"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";

const VERIFICATION_STAGES = [
  {
    label: "Verifying your identity…",
    description:
      "Confirming the details you just shared with us. This usually takes about 15–45 minutes to complete.",
  },
  {
    label: "Validating address details…",
    description: "Securely matching your location and contact information.",
  },
  {
    label: "Performing security checks…",
    description: "Keeping your account safe with quick protective reviews.",
  },
  {
    label: "Final confirmation in progress…",
    description: "Wrapping up the last steps before we sign off.",
  },
  {
    label: "Verification complete.",
    description: "All checks are finished—thanks for your patience!",
  },
];

const STAGE_DURATION_MS = 5000; // Mocked duration for each stage (5 seconds)
const COMPLETION_DELAY_MS = 1500; // Brief pause before showing the success state

const FallbackVerificationPage: React.FC = () => {
  const router = useRouter();

  const [utilityBill, setUtilityBill] = useState<File | null>(null);
  const [buildingType, setBuildingType] = useState<string>("");
  const [buildingColor, setBuildingColor] = useState<string>("");
  const [closestLandmark, setClosestLandmark] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [progressStageIndex, setProgressStageIndex] = useState<number>(0);
  const [stageComplete, setStageComplete] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleBack = () => {
    router.push("/kyc/document-submission");
  };

  const isFormValid =
    // !!utilityBill &&
    !!buildingType && !!buildingColor && !!closestLandmark && !!email;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      // For now, we only show an in-progress message.
      await new Promise((r) => setTimeout(r, 800));
      setShowSuccessModal(true);
    } catch (e) {
      setError("Failed to submit details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let completionTimeoutId: ReturnType<typeof setTimeout> | null = null;

    if (!showSuccessModal) {
      setProgressStageIndex(0);
      setStageComplete(false);
      return () => {
        if (completionTimeoutId) {
          clearTimeout(completionTimeoutId);
        }
      };
    }

    let isActive = true;
    let currentIndex = 0;

    setProgressStageIndex(0);
    setStageComplete(false);

    const intervalId = setInterval(() => {
      currentIndex += 1;

      if (!isActive) {
        return;
      }

      if (currentIndex < VERIFICATION_STAGES.length) {
        setProgressStageIndex(currentIndex);
      }

      if (currentIndex >= VERIFICATION_STAGES.length - 1) {
        clearInterval(intervalId);
        completionTimeoutId = setTimeout(() => {
          if (!isActive) {
            return;
          }
          setStageComplete(true);
        }, COMPLETION_DELAY_MS);
      }
    }, STAGE_DURATION_MS);

    return () => {
      isActive = false;
      clearInterval(intervalId);
      if (completionTimeoutId) {
        clearTimeout(completionTimeoutId);
      }
    };
  }, [showSuccessModal]);

  const currentStage =
    VERIFICATION_STAGES[
      Math.min(progressStageIndex, VERIFICATION_STAGES.length - 1)
    ];
  const progressPercent = stageComplete
    ? 100
    : Math.min(
        (progressStageIndex / Math.max(VERIFICATION_STAGES.length - 1, 1)) *
          100,
        100
      );

  return (
    <KYCLayout
      currentStep={6}
      totalSteps={8}
      steps={[
        "ID Info",
        "Address",
        "Face",
        "Capture",
        "Documents",
        "Video",
        "Complete",
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
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--primary-teal)]/40">
                      <div className="h-10 w-10 rounded-full border-2 border-transparent border-t-[var(--primary-teal)] border-r-[var(--primary-teal)] animate-spin" />
                    </div>

                    <div
                      key={currentStage.label}
                      className="space-y-2 animate-fade-in"
                    >
                      <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                        {currentStage.label}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {currentStage.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-[var(--primary-teal)] transition-all duration-700 ease-out"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Step{" "}
                        {Math.min(
                          progressStageIndex + 1,
                          VERIFICATION_STAGES.length
                        )}{" "}
                        of {VERIFICATION_STAGES.length}
                      </p>
                    </div>

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
