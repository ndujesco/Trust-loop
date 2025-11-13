"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";
import { useKYC } from "@/contexts/KYCContext";

const PreviouslyVerifiedPage: React.FC = () => {
  const router = useRouter();
  const { state } = useKYC();

  const handleGoHome = () => {
    router.push("/kyc");
  };

  const handleHelp = () => {
    console.log("Help clicked");
  };

  const getUserName = () => {
    if (state.userData) {
      const { firstName, middleName, lastName } = state.userData;
      return `${firstName} ${
        middleName ? middleName + " " : ""
      }${lastName}`.trim();
    }
    return "User";
  };

  const getVerificationLevel = () => {
    const status = state.userData?.verificationStatus;
    switch (status) {
      case 1:
        return "Basic Verification";
      case 2:
        return "Document Verification";
      case 3:
        return "Complete Verification";
      default:
        return "Verified";
    }
  };

  return (
    <KYCLayout
      showProgress={false}
      onHelp={handleHelp}
      className="justify-center"
    >
      <div className="text-center space-y-8 animate-fade-in">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-32 h-32 bg-[var(--success)] rounded-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-white"
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
        </div>

        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Already Verified!
          </h1>
          <p className="text-lg text-[var(--text-tertiary)] max-w-sm mx-auto leading-relaxed">
            Hello {getUserName()}, you have already completed the KYC
            verification process.
          </p>
        </div>

        {/* Verification Status Card */}
        <Card variant="outlined">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Verification Status
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[var(--border-primary)]">
                <span className="text-[var(--text-secondary)]">Status</span>
                <span className="font-medium text-[var(--success)]">
                  Verified
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-[var(--border-primary)]">
                <span className="text-[var(--text-secondary)]">Level</span>
                <span className="font-medium text-[var(--primary-teal)]">
                  {getVerificationLevel()}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-[var(--border-primary)]">
                <span className="text-[var(--text-secondary)]">BVN</span>
                <span className="font-mono text-[var(--primary-teal)]">
                  {state.userData?.bvn
                    ? `***${state.userData.bvn.slice(-4)}`
                    : "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-[var(--text-secondary)]">NIN</span>
                <span className="font-mono text-[var(--primary-teal)]">
                  {state.userData?.nin
                    ? `***${state.userData.nin.slice(-4)}`
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card variant="outlined" className="bg-[var(--bg-secondary)]">
          <CardContent className="py-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <svg
                  className="w-6 h-6 text-[var(--primary-teal)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h4 className="font-semibold text-[var(--text-tertiary)]">
                  No Further Action Required
                </h4>
              </div>

              <p className="text-[var(--text-tertiary)] text-sm">
                Your identity has been successfully verified. You can now access
                all banking services across multiple institutions without
                needing to complete KYC again.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            What this means for you:
          </h3>

          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[var(--success)] flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[var(--text-tertiary)]">
                Instant access to banking services
              </span>
            </div>

            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[var(--success)] flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[var(--text-tertiary)]">
                No need to repeat verification
              </span>
            </div>

            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-[var(--success)] flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[var(--text-tertiary)]">
                Secure and CBN compliant
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Button size="xl" onClick={handleGoHome} className="w-full">
            Go to Home
          </Button>
        </div>
      </div>
    </KYCLayout>
  );
};

export default PreviouslyVerifiedPage;
