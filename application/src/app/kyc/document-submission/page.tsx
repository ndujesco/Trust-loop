"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";
import { useKYC, useKYCActions } from "@/contexts/KYCContext";
import { Upload } from "@aws-sdk/lib-storage";
import axios from "axios";
import { s3, BUCKET, PYTHON_BACKEND, REGION } from "@/lib/s3Config";

const DocumentSubmissionPage: React.FC = () => {
  const router = useRouter();
  const { state } = useKYC();
  const { setUserData } = useKYCActions();

  const [utilityBill, setUtilityBill] = useState<File | null>(null);
  const [locationHistory, setLocationHistory] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAlternative, setShowAlternative] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);

  const handleUtilityBillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUtilityBill(file);
      setError("");
    }
  };

  const handleLocationHistoryChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocationHistory(file);
      setError("");
    }
  };

  const handleAlternativeClick = () => {
    setShowAlternative(true);
    setError("");
  };

  const handleConfidenceModalTryInstead = () => {
    setShowConfidenceModal(false);
    router.push("/kyc/fallback-verification");
  };

  async function handleSubmit() {
    if (!utilityBill) {
      setError("Please upload a utility bill");
      return;
    }
    if (!locationHistory && !showAlternative) {
      setError("Please upload location history or choose alternative option");
      return;
    }

    setLoading(true);
    setError("");
    setUploadProgress("Preparing uploads...");

    try {
      // ---------- Upload utility bill ----------
      const safeBillName = utilityBill.name.replace(/\s+/g, "_");
      const billKey = `utility-bills/${Date.now()}-${safeBillName}`;

      setUploadProgress(`Uploading utility bill...`);

      const billUpload = new Upload({
        client: s3,
        params: {
          Bucket: BUCKET,
          Key: billKey,
          Body: utilityBill,
          ContentType: utilityBill.type || "application/octet-stream",
        },
        queueSize: 4, // concurrency
        partSize: 5 * 1024 * 1024,
      });

      await billUpload.done();

      const billUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(
        billKey
      )}`;

      // ---------- Upload timeline (optional) ----------
      let timelineUrl: string | null = null;
      if (locationHistory) {
        const safeTimelineName = locationHistory.name.replace(/\s+/g, "_");
        const timelineKey = `timelines/${Date.now()}-${safeTimelineName}`;

        setUploadProgress("Uploading timeline...");

        const timelineUpload = new Upload({
          client: s3,
          params: {
            Bucket: BUCKET,
            Key: timelineKey,
            Body: locationHistory,
            ContentType: locationHistory.type || "application/octet-stream",
          },
          queueSize: 4,
          partSize: 5 * 1024 * 1024,
        });

        await timelineUpload.done();
        timelineUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(
          timelineKey
        )}`;
      }

      // ---------- Call Python verification endpoint (JSON) ----------
      setUploadProgress("Verifying address with AI...");

      const userId = state.userData?._id || "";

      const pythonResp = await axios.post(
        `${PYTHON_BACKEND}/api/proof-of-address`,
        {
          bill_url: billUrl,
          timeline_url: timelineUrl,
          user_id: userId,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const verificationData = pythonResp.data;
      if (!verificationData) {
        throw new Error("Failed to verify address with backend");
      }

      const confidenceScore = verificationData.confidence_score ?? 0;
      if (confidenceScore < 0.8) {
        setConfidenceScore(confidenceScore);
        setShowConfidenceModal(true);
        setLoading(false);
        setUploadProgress("");
        return;
      }

      // ---------- Save verification data to backend ----------
      setUploadProgress("Saving verification data...");

      const payload = {
        userId,
        confidenceScore,
        googlePlaceId: verificationData.utility_address.place_id,
        lng: verificationData.utility_address.lng,
        lat: verificationData.utility_address.lat,
        formattedAddress: verificationData.utility_address.formatted_address,
        billUrl,
      };

      const saveResp = await fetch("/api/user/address/verify/google-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!saveResp.ok) {
        throw new Error("Failed to save verification data");
      }

      const saveData = await saveResp.json();
      console.log(saveData);
      
      if (saveData.user) {
        setUserData(saveData.user);
        router.push("/kyc/video-verification");
      } else {
        setError("Failed to save verification data. Please try again.");
      }
    } catch (err: any) {
      console.error("Error uploading documents:", err);
      setError(err?.message || "Failed to upload documents. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress("");
    }
  }

  const handleBack = () => {
    router.push("/kyc/face-capture");
  };

  const isFormValid = utilityBill && (locationHistory || showAlternative);

  return (
    <KYCLayout
      currentStep={4}
      totalSteps={8}
      steps={["ID Info", "Address", "Face", "Capture", "Documents"]}
      onBack={handleBack}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Document Submission
          </h1>
          <p className="text-[var(--text-tertiary)]">
            Submit your utility bill and location history for verification
          </p>
        </div>

        {/* Utility Bill Upload */}
        <Card variant="outlined">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Utility Bill
            </h3>
            <p className="text-[var(--text-tertiary)] text-sm">
              Upload a recent utility bill (electricity, water, internet, etc.)
              that shows your current address
            </p>

            <div className="border-2 border-dashed border-[var(--border-primary)] rounded-lg p-6 text-center">
              <input
                type="file"
                id="utility-bill"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUtilityBillChange}
                className="hidden"
              />
              <label
                htmlFor="utility-bill"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <svg
                  className="w-12 h-12 text-[var(--text-tertiary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div>
                  <p className="text-[var(--text-secondary)] font-medium">
                    {utilityBill
                      ? utilityBill.name
                      : "Click to upload utility bill"}
                  </p>
                  <p className="text-[var(--text-tertiary)] text-xs">
                    PDF, JPG, PNG up to 10MB
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Location History Upload */}
        <Card variant="outlined">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Google Location History
            </h3>
            <p className="text-[var(--text-tertiary)] text-sm">
              Export your location history from Google to verify your address
            </p>

            {/* Instructions */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-[var(--text-primary)]">
                How to export:
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium text-[var(--text-secondary)]">
                    Android:
                  </p>
                  <p className="text-[var(--text-tertiary)]">
                    Settings → Location → Timeline → Select account → Export
                    timeline data
                  </p>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-secondary)]">
                    iOS:
                  </p>
                  <p className="text-[var(--text-tertiary)]">
                    Google Maps → Settings → Personal content → Download your
                    data → Location History → JSON format
                  </p>
                </div>
              </div>

              {/* Privacy Note */}
              <div className="bg-[var(--primary-teal)]/10 border border-[var(--primary-teal)]/20 rounded-lg p-3 mt-4">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-[var(--primary-teal)] mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-xs text-[var(--primary-teal)] font-medium">
                      Privacy Notice
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      We do not store your timeline data. It is only used for
                      verification purposes and is automatically deleted after
                      processing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-[var(--border-primary)] rounded-lg p-6 text-center">
              <input
                type="file"
                id="location-history"
                accept=".json"
                onChange={handleLocationHistoryChange}
                className="hidden"
              />
              <label
                htmlFor="location-history"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <svg
                  className="w-12 h-12 text-[var(--text-tertiary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div>
                  <p className="text-[var(--text-secondary)] font-medium">
                    {locationHistory
                      ? locationHistory.name
                      : "Click to upload location history"}
                  </p>
                  <p className="text-[var(--text-tertiary)] text-xs">
                    JSON format up to 50MB
                  </p>
                </div>
              </label>
            </div>

            {/* Alternative Option */}
            {!showAlternative && (
              <div className="text-center">
                <button
                  onClick={handleAlternativeClick}
                  className="text-[var(--primary-teal)] text-sm hover:text-[var(--primary-teal-light)] transition-colors"
                >
                  Can't export this data for some reason?
                </button>
              </div>
            )}

            {showAlternative && (
              <Card variant="outlined" className="bg-[var(--bg-secondary)]">
                <CardContent className="py-4">
                  <p className="text-[var(--text-secondary)] text-sm text-center">
                    Alternative: You can proceed with just the utility bill.
                    This may take longer to verify.
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card
            variant="outlined"
            className="border-[var(--error)] bg-[var(--error-light)]"
          >
            <CardContent className="flex items-center gap-3 py-4">
              <svg
                className="w-5 h-5 text-[var(--error)] flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[var(--error)] font-medium">{error}</span>
            </CardContent>
          </Card>
        )}

        {/* Upload Progress */}
        {uploadProgress && (
          <Card variant="outlined" className="bg-[var(--bg-secondary)]">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--primary-teal)]"></div>
                <span className="text-[var(--text-secondary)] font-medium">
                  {uploadProgress}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            className="w-full"
            loading={loading}
          >
            Submit Documents
          </Button>
        </div>

        {/* Confidence Score Modal */}
        {showConfidenceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 space-y-4">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 mx-auto bg-[var(--error-light)] rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[var(--error)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Address Verification Failed
                  </h3>
                  <p className="text-[var(--text-secondary)] text-sm">
                    We couldn't automatically verify your address from the
                    documents provided. The confidence score was{" "}
                    {(confidenceScore * 100).toFixed(0)}%, which is below our
                    verification threshold.
                  </p>
                </div>

                <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                  <p className="text-[var(--text-primary)] text-sm font-medium mb-2">
                    What this means:
                  </p>
                  <ul className="text-[var(--text-secondary)] text-sm space-y-1">
                    <li>
                      • The utility bill address doesn't match your location
                      history
                    </li>
                    <li>
                      • We need additional verification to confirm your address
                    </li>
                    <li>• This is common and nothing to worry about</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfidenceModal(false)}
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={handleConfidenceModalTryInstead}
                    className="flex-1"
                  >
                    Try This Instead
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </KYCLayout>
  );
};

export default DocumentSubmissionPage;
