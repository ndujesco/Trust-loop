"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";
import ConsentModal from "@/components/ConsentModal";

const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ||
  "wss://ws.alfredemmanuel.com/") as string;

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const FallbackVerificationPage: React.FC = () => {
  const router = useRouter();

  // form state
  const [utilityBill, setUtilityBill] = useState<File | null>(null);
  const [buildingType, setBuildingType] = useState<string>("");
  const [buildingColor, setBuildingColor] = useState<string>("");
  const [closestLandmark, setClosestLandmark] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  // flow state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [verificationStarted, setVerificationStarted] = useState<boolean>(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [stageComplete, setStageComplete] = useState<boolean>(false);
  const [isRejected, setIsRejected] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>(
    "Submitting your details…"
  );

  // UI progress hint (purely visual - no percent required by product)
  const [progressState, setProgressState] = useState<"started" | "in-progress" | "waiting" | "done">("started");

  const wsRef = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleBack = () => {
    router.push("/kyc/document-submission");
  };

  const handleTryAgain = () => {
    // reset to form state
    setIsRejected(false);
    setRejectionReason(null);
    setError("");
    setStatusMessage("Submitting your details…");
    setVerificationId(null);
    setSubmitted(false);
    setStageComplete(false);
    setVerificationStarted(false);
    setProgressState("started");
  };

  const isFormValid =
    !!buildingType && !!buildingColor && !!closestLandmark && !!email;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError("");
    setIsRejected(false);
    setRejectionReason(null);

    try {
      const payload = {
        buildingType,
        buildingColor,
        closestLandmark,
        email,
        utilityBillProvided: Boolean(utilityBill),
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch("/api/rider-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Submission failed");
      }

      const saved = await response.json();

      setSubmitted(true);
      setStatusMessage("Verification in progress…");
      setProgressState("in-progress");
      setVerificationId(saved?.id ?? null);

      // switch to the full-page verification view
      setVerificationStarted(true);

      // start 15-minute timeout to mark as waiting/timeout
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        // mark as waiting/timeout state — user can retry or contact support
        setStatusMessage(
          "This is taking longer than expected. We'll notify you when verification completes."
        );
        setProgressState("waiting");
      }, TIMEOUT_MS);

    } catch (e: any) {
      setError(e?.message || "Failed to submit details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Consent modal logic (session-scoped)
  const [showHouseConsent, setShowHouseConsent] = useState<boolean>(false);

  useEffect(() => {
    try {
      const given = sessionStorage.getItem("kycHouseDetailsConsentGiven");
      if (!given) {
        setShowHouseConsent(true);
      }
    } catch (e) {
      setShowHouseConsent(true);
    }
  }, []);

  const handleHouseConsentConfirm = () => {
    try {
      sessionStorage.setItem("kycHouseDetailsConsentGiven", "true");
    } catch (e) {
      // ignore
    }
    setShowHouseConsent(false);
  };

  const handleHouseConsentClose = () => {
    router.back();
  };

  // WebSocket lifecycle: connect when verification starts and we have an id
  useEffect(() => {
    if (!verificationStarted || !verificationId) return;

    // ensure no previous ws
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatusMessage("An agent is reviewing your information…");
      setProgressState("in-progress");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (
          message?.type === "SUBMISSION_VERIFIED" &&
          message?.payload?.id === verificationId
        ) {
          // success
          setStatusMessage("Your address has been confirmed. You're all set!");
          setProgressState("done");
          setStageComplete(true);

          if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          ws.close();
        }

        if (
          message?.type === "SUBMISSION_REJECTED" &&
          message?.payload?.id === verificationId
        ) {
          setStatusMessage(
            "We were unable to verify your address. Please review and resubmit."
          );
          setProgressState("done");
          setStageComplete(false);
          setIsRejected(true);
          setRejectionReason(message?.payload?.reason || null);
          setError(
            message?.payload?.reason ||
              "Address verification was declined. Please review your details."
          );
          if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          ws.close();
        }
      } catch (err) {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      setStatusMessage("Experiencing connection issues. We'll keep trying…");
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [verificationStarted, verificationId]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Full-page verification view (no modal)
  if (verificationStarted && !stageComplete && !isRejected) {
    return (
      <KYCLayout
        currentStep={6}
        totalSteps={6}
        steps={[
          "ID Info",
          "Address",
          "Face",
          "Capture",
          "Documents",
          "Fallback Verification",
        ]}
        onBack={handleBack}
      >
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 text-center p-6 animate-fade-in">
          {/* Spinner */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-teal-200">
            <div className="h-10 w-10 rounded-full border-4 border-transparent border-t-teal-600 border-r-teal-600 animate-spin" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Your address is being verified…
            </h1>
            <p className="text-sm mt-2 text-[var(--text-tertiary)]">
              This screen will update automatically once verification is complete.
            </p>
          </div>

          {/* Timeline */}
          <div className="space-y-6 w-full max-w-xs text-left">
            <div className="flex items-start space-x-3">
              <div className="h-4 w-4 rounded-full bg-teal-600" />
              <p className="text-[var(--text-primary)] font-medium">Verification started</p>
            </div>

            <div className={`ml-2 h-10 w-px ${progressState === 'in-progress' || progressState === 'started' ? 'bg-teal-300' : 'bg-gray-200'}`} />

            <div className={`flex items-start space-x-3 ${progressState === 'in-progress' ? '' : 'opacity-60'}`}>
              <div className={`h-4 w-4 rounded-full ${progressState === 'in-progress' ? 'bg-teal-600' : 'bg-gray-300'}`} />
              <p className="text-[var(--text-secondary)]">In progress…</p>
            </div>

            <div className={`ml-2 h-10 w-px ${progressState === 'done' ? 'bg-teal-300' : 'bg-gray-200'}`} />

            <div className={`flex items-start space-x-3 ${progressState === 'done' ? '' : 'opacity-40'}`}>
              <div className={`h-4 w-4 rounded-full ${progressState === 'done' ? 'bg-teal-600' : 'bg-gray-200'}`} />
              <p className="text-[var(--text-tertiary)]">Verification complete</p>
            </div>
          </div>

          <p className="text-xs text-[var(--text-tertiary)] mt-4">
            Usually takes a few minutes — please keep this page open.
          </p>

          <div className="w-full max-w-xs">
            <Button onClick={() => router.push("/")} className="w-full">
              Return to Home
            </Button>
            <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">You will be notified at <span className="font-medium">{email}</span>.</p>
          </div>
        </div>
      </KYCLayout>
    );
  }

  // Rejected view (full-page)
  if (isRejected) {
    return (
      <KYCLayout
        currentStep={6}
        totalSteps={6}
        steps={[
          "ID Info",
          "Address",
          "Face",
          "Capture",
          "Documents",
          "Fallback Verification",
        ]}
        onBack={handleBack}
      >
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 p-6 animate-fade-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-400/40 bg-red-50">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[var(--text-primary)]">We couldn't verify your address</h1>

          {rejectionReason && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 max-w-xl text-left">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Reason:</p>
              <p className="text-sm text-[var(--text-primary)]">{rejectionReason}</p>
            </div>
          )}

          <div className="space-y-3 w-full max-w-xs">
            <Button onClick={handleTryAgain} className="w-full">Review & Try Again</Button>
            <Button onClick={() => router.push('/')} variant="ghost" className="w-full">Return Home</Button>
            <p className="text-xs text-[var(--text-tertiary)] text-center">If you need help, contact support.</p>
          </div>
        </div>
      </KYCLayout>
    );
  }

  // Success view (full-page)
  if (stageComplete) {
    return (
      <KYCLayout
        currentStep={6}
        totalSteps={6}
        steps={[
          "ID Info",
          "Address",
          "Face",
          "Capture",
          "Documents",
          "Fallback Verification",
        ]}
        onBack={handleBack}
      >
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 p-6 animate-fade-in">
          <div className="relative mx-auto h-20 w-20">
            <div className="absolute inset-0 rounded-full bg-[var(--primary-teal)]/30 blur-xl animate-pulse" />
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[var(--primary-teal)] text-white">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Verification complete!</h1>

          <p className="text-sm text-[var(--text-secondary)]">A confirmation has been sent to <span className="font-medium text-[var(--text-primary)]">{email}</span>. You're all set.</p>

          <div className="space-y-3 w-full max-w-xs">
            <Button onClick={() => router.push("/")} className="w-full">Continue</Button>
            <p className="text-xs text-[var(--text-tertiary)] text-center">Need assistance? Contact our support team.</p>
          </div>
        </div>
      </KYCLayout>
    );
  }

  // Default: the input form
  return (
    <KYCLayout
      currentStep={6}
      totalSteps={6}
      steps={[
        "ID Info",
        "Address",
        "Face",
        "Capture",
        "Documents",
        "Fallback Verification",
      ]}
      onBack={handleBack}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Manual Address Verification</h1>
          <p className="text-[var(--text-tertiary)]">Provide a few details about where you live so we can verify your address.</p>
        </div>

        <Card variant="outlined">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">House Details</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Type of Building</label>
                <select
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-primary)]"
                >
                  <option value="">Select type</option>
                  <option value="storey">Storey</option>
                  <option value="bungalow">Bungalow</option>
                  <option value="detached">Detached</option>
                  <option value="semi-detached">Semi-detached</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Color of Building</label>
                <input
                  type="text"
                  value={buildingColor}
                  onChange={(e) => setBuildingColor(e.target.value)}
                  placeholder="e.g., cream with brown trims"
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Closest Landmark</label>
                <input
                  type="text"
                  value={closestLandmark}
                  onChange={(e) => setClosestLandmark(e.target.value)}
                  placeholder="e.g., Folagoro Bus Stop"
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-primary)]"
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">We'll use this to notify you when verification is complete</p>
              </div>

              <div>
                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Utility bill (optional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setUtilityBill(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card variant="outlined" className="border-[var(--error)] bg-[var(--error-light)]">
            <CardContent className="py-3 text-[var(--error)] font-medium">{error}</CardContent>
          </Card>
        )}

        <div className="pt-2">
          <Button size="lg" onClick={handleSubmit} disabled={!isFormValid} loading={submitting} className="w-full">
            Submit House Details
          </Button>
        </div>

        <ConsentModal
          open={showHouseConsent}
          onConfirm={handleHouseConsentConfirm}
          onClose={handleHouseConsentClose}
          title={"TrustLoop Data Consent Notice"}
        >
          <p className="text-sm text-[var(--text-primary)] mb-4">
            To complete your address verification, we may need a few additional details about your residence — such as building type, colour, landmarks, or other descriptive information.
          </p>

          <div className="text-sm text-[var(--text-primary)] space-y-2 mb-4">
            <p>
              These details will be used only for this verification process and will not be stored, reused, or shared for any other purpose. Once the verification is complete, this information is automatically deleted.
            </p>

            <p className="mt-2">By clicking “Yes”, you consent to TrustLoop processing these house details solely for the purpose of completing your KYC address verification.</p>
          </div>
        </ConsentModal>
      </div>
    </KYCLayout>
  );
};

export default FallbackVerificationPage;
