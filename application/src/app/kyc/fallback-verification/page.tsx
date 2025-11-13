"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";

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
  const [error, setError] = useState<string>("");

  const handleBack = () => {
    router.push("/kyc/document-submission");
  };

  const isFormValid =
    // !!utilityBill &&
    !!buildingType &&
    !!buildingColor &&
    !!closestLandmark &&
    !!email;

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

  return (
    <KYCLayout
      currentStep={4}
      totalSteps={6}
      steps={["ID Info", "Address", "Face", "Capture", "Documents", "Video"]}
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

        {/* Utility Bill */}
        {/* <Card variant="outlined">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Utility Bill
            </h3>
            <div className="border-2 border-dashed border-[var(--border-primary)] rounded-lg p-6 text-center">
              <input
                type="file"
                id="fallback-utility-bill"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setUtilityBill(f);
                }}
                className="hidden"
              />
              <label
                htmlFor="fallback-utility-bill"
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
        </Card> */}

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
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-[var(--primary-teal)] rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                  Verification Submitted Successfully
                </h3>
                <div className="space-y-2">
                  <p className="text-[var(--text-secondary)]">
                    Your address verification details have been submitted for
                    manual review.
                  </p>
                  <p className="text-[var(--text-tertiary)] text-sm">
                    This process typically takes no less than 15 minutes. We'll
                    notify you at{" "}
                    <span className="font-medium text-[var(--text-secondary)]">
                      {email}
                    </span>{" "}
                    once verification is complete.
                  </p>
                </div>
                <Button onClick={() => router.push("/")} className="w-full">
                  Return to Home
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </KYCLayout>
  );
};

export default FallbackVerificationPage;
