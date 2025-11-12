"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/Button";
import { Card, CardContent } from "@/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";
import RegulatoryFooter from "@/components/RegulatoryFooter";

const KYCLandingPage: React.FC = () => {
  const router = useRouter();

  const handleStartKYC = () => {
    router.push("/kyc/id-information");
  };

  const handleHelp = () => {
    // TODO: Implement help functionality
    console.log("Help clicked");
  };

  return (
    <KYCLayout
      showProgress={false}
      onHelp={handleHelp}
      className="justify-center"
    >
      <div className="text-center space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="space-y-6">
          {/* Illustration */}
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-[var(--bg-card)] rounded-full flex items-center justify-center border-2 border-[var(--border-primary)]">
              <svg
                className="w-16 h-16 text-[var(--primary-teal)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              Start KYC Verification
            </h1>
            <p className="text-lg text-[var(--text-tertiary)] max-w-sm mx-auto leading-relaxed">
              Complete your identity verification to upgrade to Tier 3 and have
              access to more banking services.
            </p>
          </div>
        </div>

        {/* Features Card */}
        <Card variant="outlined" className="text-left">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              What you'll need:
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[var(--primary-teal)] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <span className="text-[var(--text-secondary)]">
                  Your BVN or NIN
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[var(--primary-teal)] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <span className="text-[var(--text-secondary)]">
                  A device with camera for face verification
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[var(--primary-teal)] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <span className="text-[var(--text-secondary)]">
                  Access to services like Google, Bolt, or telecom providers
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Why use our KYC service?
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
                Use once, verify everywhere
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
                Faster than traditional verification
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

        {/* Start Button */}
        <div className="pt-4">
          <Button size="xl" onClick={handleStartKYC} className="w-full">
            Start KYC
          </Button>
        </div>

        {/* Footer */}
        <RegulatoryFooter className="pt-8" />
      </div>
    </KYCLayout>
  );
};

export default KYCLandingPage;
