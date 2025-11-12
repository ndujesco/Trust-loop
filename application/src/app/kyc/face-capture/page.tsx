"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useKYC, useKYCActions } from "@/contexts/KYCContext";

import { Upload } from "@aws-sdk/lib-storage";
import axios from "axios";
import { s3, BUCKET, PYTHON_BACKEND, REGION } from "@/lib/s3Config";

const FaceCapturePage: React.FC = () => {
  const router = useRouter();
  const { state } = useKYC();
  const { setUserData } = useKYCActions();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentInstruction, setCurrentInstruction] = useState(
    "Position your face in the camera frame"
  );
  const [shouldRehydrate, setShouldRehydrate] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const instructions = [
    "Position your face in the camera frame",
    "Look directly at the camera",
    "Blink your eyes",
    "Keep still while we capture your photo",
  ];

  useEffect(() => {
    startCamera();

    // Cycle through instructions
    const instructionInterval = setInterval(() => {
      setCurrentInstruction((prev) => {
        const currentIndex = instructions.indexOf(prev);
        const nextIndex = (currentIndex + 1) % instructions.length;
        return instructions[nextIndex];
      });
    }, 3000);

    return () => {
      clearInterval(instructionInterval);
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasPermission(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check your permissions.");
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Ensure we attach the MediaStream to the video element when either
  // the stream becomes available before the video mounts or when the
  // video mounts after the stream is created. This avoids a race where
  // startCamera runs before the <video> element exists (common when
  // rendering is delayed on hosted environments).
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video && stream) {
      if (video.srcObject !== stream) {
        try {
          video.srcObject = stream;
        } catch (err) {
          // Some browsers might throw when assigning; log and continue
          console.error("Failed to set video.srcObject:", err);
        }
      }

      // Attempt to play; autoplay policies usually allow autoplay when muted.
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((playError) => {
          // Not a hard failure; log for debugging on hosted envs
          console.error("video.play() rejected:", playError);
        });
      }
      setShouldRehydrate(false);
    }
  }, [hasPermission, capturedImage, shouldRehydrate]);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setCurrentInstruction("");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      // Draw video frame to canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to Blob for S3 upload
      const blob: Blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.9)
      );

      setCapturedImage(URL.createObjectURL(blob));
      stopCamera();

      const userId = state.userData?._id || "";
      if (!userId) throw new Error("User not found in state");

      // ---------- Upload to S3 ----------
      setUploadProgress("Uploading liveness photo...");

      const safeName = `liveness-${Date.now()}.jpg`;
      const s3Key = `liveness/${safeName}`;

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: BUCKET,
          Key: s3Key,
          Body: blob,
          ContentType: "image/jpeg",
        },
        queueSize: 4,
        partSize: 5 * 1024 * 1024,
      });

      await upload.done();

      const photoUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(
        s3Key
      )}`;

      // ---------- Verify with Python backend ----------
      setUploadProgress("Verifying liveness...");

      const pythonResp = await axios.post(
        `${PYTHON_BACKEND}/api/liveness-check`,
        {
          photo_url: photoUrl,
        }
      );

      const verification = pythonResp.data;
      if (!verification || verification.status !== "success") {
        throw new Error("Liveness verification failed");
      }

      if (verification.result !== "real") {
        setError("Liveness check failed. Please retake the photo.");
        setIsCapturing(false);
        setUploadProgress("");
        return;
      }

      // ---------- Update local backend ----------
      setUploadProgress("Saving liveness data...");

      const saveResp = await fetch("/api/upload/liveness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          liveness: { photo_url: photoUrl },
        }),
      });

      if (!saveResp.ok) {
        throw new Error("Failed to save liveness verification data");
      }

      const saveData = await saveResp.json();
      setUserData(saveData.user);

      // ---------- Route user based on verification ----------
      const verificationStatus = saveData.user?.verificationStatus;
      if (verificationStatus === 2 || verificationStatus === 3) {
        router.push("/kyc/previously-verified");
      } else {
        router.push("/kyc/document-submission");
      }
    } catch (err: any) {
      console.error("Error capturing photo:", err);
      setError(
        err.message || "Failed to complete liveness check. Please try again."
      );
    } finally {
      setIsCapturing(false);
      setUploadProgress("");
    }
  };

  const handleBack = () => {
    router.push("/kyc/face-verification");
  };

  const handleHelp = () => {
    console.log("Help clicked");
  };

  const handleRetake = async () => {
    setCapturedImage(null);
    setError(null);
    setHasPermission(false); // Reset permission state
    setIsLoading(true); // Show loading state
    setShouldRehydrate(true);

    // Small delay to ensure state updates, then start camera
    await new Promise((resolve) => setTimeout(resolve, 100));
    await startCamera();
  };

  if (isLoading) {
    return (
      <KYCLayout
        currentStep={4}
        totalSteps={8}
        steps={["ID Info", "Address", "Face", "Capture"]}
        onBack={handleBack}
        onHelp={handleHelp}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-[var(--text-tertiary)]">
              Initializing camera...
            </p>
          </div>
        </div>
      </KYCLayout>
    );
  }

  if (error) {
    return (
      <KYCLayout
        currentStep={4}
        totalSteps={6}
        steps={["ID Info", "Address", "Face", "Capture", "Documents", "Video"]}
        onBack={handleBack}
        onHelp={handleHelp}
      >
        <div className="space-y-6 animate-fade-in">
          <Card variant="outlined" className="border-[var(--error)]">
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 bg-[var(--error)]/20 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-[var(--error)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Camera Error
                </h3>
                <p className="text-[var(--text-tertiary)]">{error}</p>
              </div>

              <Button onClick={handleRetake} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </KYCLayout>
    );
  }

  return (
    <KYCLayout
      currentStep={4}
      totalSteps={6}
      steps={["ID Info", "Address", "Face", "Capture", "Documents", "Video"]}
      onBack={handleBack}
      onHelp={handleHelp}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Instruction */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {currentInstruction}
          </h1>
          <p className="text-[var(--text-tertiary)]">
            Follow the instructions below to complete face verification
          </p>
        </div>

        {/* Camera Preview */}
        <div className="relative">
          {hasPermission && !capturedImage && (
            <div className="relative">
              {/* Avatar placeholder */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-[var(--border-primary)]">
                  <svg
                    className="w-6 h-6 text-[var(--bg-primary)]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>

              {/* Video element */}
              <div className="relative rounded-2xl overflow-hidden border-4 border-[var(--primary-teal)] bg-[var(--bg-secondary)]">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  autoPlay
                  muted
                  playsInline
                />

                {/* Overlay guides */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Face guide oval */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-40 border-2 border-white/50 rounded-full"></div>
                </div>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="relative rounded-2xl overflow-hidden border-4 border-[var(--success)] bg-[var(--bg-secondary)]">
              <img
                src={capturedImage}
                alt="Captured face"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-[var(--success)] text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Photo Captured
                </div>
              </div>
            </div>
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Capture Button */}
        {/* Capture / Upload Button */}
        <div className="flex gap-3">
          {!capturedImage || isCapturing ? (
            <Button
              size="lg"
              onClick={capturePhoto}
              loading={isCapturing}
              disabled={!!uploadProgress}
              className="flex-1"
            >
              {isCapturing
                ? uploadProgress
                  ? uploadProgress // e.g. "Uploading liveness photo..." or "Verifying liveness..."
                  : "Capturing..."
                : "Capture Photo"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={handleRetake}
                disabled={isCapturing}
                className="flex-1"
              >
                {error ? "Retake (Failed)" : "Retake"}
              </Button>

              {uploadProgress && (
                <Button
                  size="lg"
                  disabled
                  className="flex-1 opacity-80 cursor-not-allowed"
                >
                  {uploadProgress}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Tips */}
        <Card variant="outlined">
          <CardContent className="space-y-3">
            <h3 className="font-semibold text-[var(--text-primary)]">
              Tips for better capture:
            </h3>
            <ul className="text-sm text-[var(--text-tertiary)] space-y-1">
              <li>• Ensure good lighting on your face</li>
              <li>• Remove glasses and hats</li>
              <li>• Look directly at the camera</li>
              <li>• Keep your face centered in the frame</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </KYCLayout>
  );
};

export default FaceCapturePage;
