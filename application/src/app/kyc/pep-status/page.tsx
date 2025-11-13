"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";
import { useKYC, useKYCActions, PepStatus } from "@/contexts/KYCContext";

const PepStatusPage: React.FC = () => {
  const router = useRouter();
  //   const { state } = useKYC();
  const { setPepStatus } = useKYCActions();

  const [isPep, setIsPep] = useState<boolean | null>(null);
  const [isRelatedToPep, setIsRelatedToPep] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (isPep === null || isRelatedToPep === null) {
      setError("Please answer both questions before continuing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Save basic PEP status to context
      const pepStatus: PepStatus = {
        isPep,
        isRelatedToPep,
        pepDetails: null,
        relatedPepDetails: null,
      };

      setPepStatus(pepStatus);

      // Determine next step based on answers
      if (isPep || isRelatedToPep) {
        // User needs to provide PEP information
        router.push("/kyc/pep-information");
      } else {
        // User is not a PEP, proceed to document submission
        router.push("/kyc/document-submission");
      }
    } catch (err) {
      console.error("Error saving PEP status:", err);
      setError("Failed to save your information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KYCLayout
      currentStep={5}
      totalSteps={8}
      steps={[
        "ID Info",
        "Address",
        "Face",
        "Capture",
        "PEP Status",
        "Documents",
        "Video",
        "Complete",
      ]}
    >
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Title Section - No background, just text */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-4">
            Politically Exposed Person (PEP) Screening
          </h1>
          <p className="text-text-secondary">
            We need to verify if you or anyone related to you holds or has held
            a political office.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-warning mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-warning">
                Important Notice
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Please provide accurate information. Providing false information
                may result in account restrictions or legal consequences.
              </p>
            </div>
          </div>
        </div>

        {/* Question 1 Block */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">
              1. Are you currently or have you ever been a Politically Exposed
              Person (PEP)?
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              This includes holding positions such as President, Vice President,
              Governor, Senator, Minister, Commissioner, or similar political
              offices.
            </p>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="isPep"
                  checked={isPep === true}
                  onChange={() => setIsPep(true)}
                  className="w-4 h-4 text-primary-teal bg-bg-primary border-border-primary focus:ring-primary-teal focus:ring-2"
                />
                <span className="text-text-primary">
                  Yes, I am or have been a PEP
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="isPep"
                  checked={isPep === false}
                  onChange={() => setIsPep(false)}
                  className="w-4 h-4 text-primary-teal bg-bg-primary border-border-primary focus:ring-primary-teal focus:ring-2"
                />
                <span className="text-text-primary">No, I am not a PEP</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Question 2 Block */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">
              2. Are you related to someone who is currently or has been a
              Politically Exposed Person?
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              This includes immediate family members such as spouse, parents,
              children, or siblings who hold or have held political positions.
            </p>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="isRelatedToPep"
                  checked={isRelatedToPep === true}
                  onChange={() => setIsRelatedToPep(true)}
                  className="w-4 h-4 text-primary-teal bg-bg-primary border-border-primary focus:ring-primary-teal focus:ring-2"
                />
                <span className="text-text-primary">
                  Yes, I am related to a PEP
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="isRelatedToPep"
                  checked={isRelatedToPep === false}
                  onChange={() => setIsRelatedToPep(false)}
                  className="w-4 h-4 text-primary-teal bg-bg-primary border-border-primary focus:ring-primary-teal focus:ring-2"
                />
                <span className="text-text-primary">
                  No, I am not related to a PEP
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleContinue}
            disabled={loading || isPep === null || isRelatedToPep === null}
            className="px-8 py-3"
          >
            {loading ? "Processing..." : "Continue"}
          </Button>
        </div>
      </div>
    </KYCLayout>
  );
};

export default PepStatusPage;
