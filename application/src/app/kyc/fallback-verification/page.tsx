"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";

const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ||
  "wss://ws.alfredemmanuel.com/") as string;

const FallbackVerificationPage: React.FC = () => {
  const router = useRouter();

  const [utilityBill, setUtilityBill] = useState<File | null>(null);
  const [buildingType, setBuildingType] = useState<string>("");
  const [buildingColor, setBuildingColor] = useState<string>("");
  const [closestLandmark, setClosestLandmark] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [livesInEstate, setLivesInEstate] = useState<boolean>(false);
  const [gatekeeperPhone, setGatekeeperPhone] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [stageComplete, setStageComplete] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>(
    "Submitting your details…"
  );
  const [progress, setProgress] = useState<number>(10);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isRejected, setIsRejected] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const handleBack = () => {
    router.push("/kyc/document-submission");
  };

  const handleTryAgain = () => {
    setIsRejected(false);
    setRejectionReason(null);
    setShowSuccessModal(false);
    setError("");
    setStatusMessage("Submitting your details…");
    setProgress(10);
    setVerificationId(null);
    setSubmitted(false);
    setStageComplete(false);
  };

  const isFormValid =
    // !!utilityBill &&
    !!buildingType &&
    !!buildingColor &&
    !!closestLandmark &&
    !!email &&
    (!livesInEstate || !!gatekeeperPhone);

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
        livesInEstate,
        gatekeeperPhone: livesInEstate ? gatekeeperPhone : null,
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch("/api/rider-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      const saved = await response.json();

      setSubmitted(true);
      setStageComplete(false);
      setStatusMessage(
        "We’ve received your details. Waiting for an agent to review…"
      );
      setProgress(35);
      setVerificationId(saved?.id ?? null);
      setShowSuccessModal(true);
    } catch (e) {
      setError("Failed to submit details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!showSuccessModal || !verificationId) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatusMessage("An agent is reviewing your information…");
      setProgress(60);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (
          message?.type === "SUBMISSION_VERIFIED" &&
          message?.payload?.id === verificationId
        ) {
          setStatusMessage("Your address has been confirmed. You're all set!");
          setProgress(100);
          setStageComplete(true);
          ws.close();
        }
        if (
          message?.type === "SUBMISSION_REJECTED" &&
          message?.payload?.id === verificationId
        ) {
          setStatusMessage(
            "We were unable to verify your address. Please review and resubmit."
          );
          setProgress(100);
          setStageComplete(false);
          setIsRejected(true);
          setRejectionReason(message?.payload?.reason || null);
          setError(
            message?.payload?.reason ||
              "Address verification was declined. Please review your details."
          );
          ws.close();
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    ws.onerror = () => {
      setStatusMessage("Experiencing connection issues. We'll keep trying…");
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [showSuccessModal, verificationId]);

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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Manual Address Verification
          </h1>
          <p className="text-[var(--text-tertiary)]">
            Provide your utility bill and a few details about where you live.
          </p>
        </div>

        {/* House Details */}
        <Card variant="outlined">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              House Details
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-[var(--text-tertiary)] mb-1">
                  Type of Building
                </label>
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
                <label className="block text-sm text-[var(--text-tertiary)] mb-1">
                  Color of Building
                </label>
                <input
                  type="text"
                  value={buildingColor}
                  onChange={(e) => setBuildingColor(e.target.value)}
                  placeholder="e.g., cream with brown trims"
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--text-tertiary)] mb-1">
                  Closest Landmark
                </label>
                <input
                  type="text"
                  value={closestLandmark}
                  onChange={(e) => setClosestLandmark(e.target.value)}
                  placeholder="e.g., Folagoro Bus Stop"
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--text-tertiary)] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-primary)]"
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  We'll use this to notify you when verification is complete
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/80 p-3">
                <input
                  id="lives-in-estate"
                  type="checkbox"
                  checked={livesInEstate}
                  onChange={(e) => {
                    setLivesInEstate(e.target.checked);
                    if (!e.target.checked) {
                      setGatekeeperPhone("");
                    }
                  }}
                  className="mt-1 h-4 w-4 rounded border-[var(--border-primary)] text-[var(--primary-teal)] focus:ring-[var(--primary-teal)]"
                />
                <div>
                  <label
                    htmlFor="lives-in-estate"
                    className="block text-sm font-medium text-[var(--text-primary)]"
                  >
                    Do you live in a gated estate?
                  </label>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    If checked, a verification officer will visit your estate.
                    We’ll need a phone number so they can call ahead.
                  </p>
                </div>
              </div>

              {livesInEstate && (
                <div className="space-y-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/60 px-3 py-3">
                  <label className="block text-sm font-medium text-[var(--text-primary)]">
                    Contact Number for Estate Access
                  </label>
                  <input
                    type="tel"
                    value={gatekeeperPhone}
                    onChange={(e) => setGatekeeperPhone(e.target.value)}
                    placeholder="e.g., +234 801 234 5678"
                    className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                  />
                  <p className="text-xs text-[var(--text-secondary)]">
                    This number is shared only with the verification officer to
                    coordinate entry with estate security or reception.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card
            variant="outlined"
            className="border-[var(--error)] bg-[var(--error-light)]"
          >
            <CardContent className="py-3 text-[var(--error)] font-medium">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!isFormValid}
            loading={submitting}
            className="w-full"
          >
            Submit House Details
          </Button>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 sm:p-8 text-center space-y-6">
                {!stageComplete ? (
                  <div className="space-y-6">
                    {!isRejected ? (
                      <>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--primary-teal)]/40">
                          <div className="h-10 w-10 rounded-full border-2 border-transparent border-t-[var(--primary-teal)] border-r-[var(--primary-teal)] animate-spin" />
                        </div>

                        <div
                          key={statusMessage}
                          className="space-y-2 animate-fade-in"
                        >
                          <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                            {statusMessage}
                          </h3>
                          <p className="text-sm text-[var(--text-secondary)]">
                            We'll update this screen as soon as the rider takes
                            action.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                            <div
                              className="absolute left-0 top-0 h-full rounded-full bg-[var(--primary-teal)] transition-all duration-700 ease-out"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-[var(--text-tertiary)] text-center">
                            {progress >= 100
                              ? "Awaiting confirmation response…"
                              : `${Math.round(progress)}% complete`}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-400/40 bg-red-50 dark:bg-red-900/20">
                          <svg
                            className="h-10 w-10 text-red-600 dark:text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>

                        <div className="space-y-2 animate-fade-in">
                          <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                            {statusMessage}
                          </h3>
                          {rejectionReason && (
                            <div className="mt-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3">
                              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                                Reason:
                              </p>
                              <p className="text-sm text-[var(--text-primary)]">
                                {rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={handleTryAgain}
                            className="w-full"
                            variant="primary"
                          >
                            Try Again
                          </Button>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            Please review your details and resubmit your
                            information.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    <div className="relative mx-auto h-20 w-20">
                      <div className="absolute inset-0 rounded-full bg-[var(--primary-teal)]/30 blur-xl animate-pulse" />
                      <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[var(--primary-teal)] text-white shadow-lg shadow-[var(--primary-teal)]/40">
                        <svg
                          className="h-10 w-10"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                        Your verification has been successfully completed.
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        A confirmation has been sent to{" "}
                        <span className="font-medium text-[var(--text-primary)]">
                          {email}
                        </span>
                        . You're all set.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => router.push("/")}
                        className="w-full"
                      >
                        Return to Home
                      </Button>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Need assistance? Our team is ready to help if you have
                        any questions about your address validation.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </KYCLayout>
  );
};

export default FallbackVerificationPage;
