"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";

const DocumentSubmissionPage: React.FC = () => {
  const router = useRouter();

  const [utilityBill, setUtilityBill] = useState<File | null>(null);
  const [locationHistory, setLocationHistory] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [showAlternative, setShowAlternative] = useState(false);

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

  const handleSubmit = () => {
    if (!utilityBill) {
      setError("Please upload a utility bill");
      return;
    }
    if (!locationHistory && !showAlternative) {
      setError("Please upload location history or choose alternative option");
      return;
    }
    // Submit logic will be added in next steps
    console.log("Form is valid, ready to submit");
  };

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

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full"
          >
            Submit Documents
          </Button>
        </div>
      </div>
    </KYCLayout>
  );
};

export default DocumentSubmissionPage;
