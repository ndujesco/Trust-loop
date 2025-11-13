"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";
import RegulatoryFooter from "@/components/RegulatoryFooter";
import ClientOnly from "@/components/ClientOnly";

const KYCSuccessPage: React.FC = () => {
  const router = useRouter();
  const [showAnimation, setShowAnimation] = useState(false);
  const [verificationId, setVerificationId] = useState<string>("");

  useEffect(() => {
    // Generate verification ID on client side only
    setVerificationId(`KYC-${Date.now().toString().slice(-8)}`);

    // Trigger animation after component mounts
    setTimeout(() => setShowAnimation(true), 100);
  }, []);

  const handleContinue = () => {
    // TODO: Redirect to partner bank or dashboard
    router.push("/kyc");
  };

  const handleDownload = () => {
    // TODO: Generate and download verification certificate
    console.log("Download verification certificate");
  };

  const handleBack = () => {
    router.push("/kyc");
  };

  const handleHelp = () => {
    console.log("Help clicked");
  };

  return (
    <KYCLayout
      currentStep={8}
      totalSteps={8}
      steps={["ID Info", "Address", "Face", "Capture", "Documents", "Video"]}
      onBack={handleBack}
      onHelp={handleHelp}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Success Modal */}
        <Card variant="elevated" className="text-center">
          <CardContent className="space-y-6 p-8">
            {/* Success Icon with Animation */}
            <div className="flex justify-center">
              <div
                className={`w-20 h-20 bg-[var(--success)] rounded-full flex items-center justify-center transition-all duration-500 ${
                  showAnimation ? "scale-100 opacity-100" : "scale-75 opacity-0"
                }`}
              >
                <svg
                  className="w-10 h-10 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                Verification Complete!
              </h1>
              <p className="text-lg text-[var(--text-secondary)]">
                Your KYC verification has been completed successfully
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-3">
                <div className="bg-[var(--success)] h-3 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">100%</span>
                </div>
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">
                All verification steps completed
              </p>
            </div>

            {/* Verification ID */}
            <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
              <p className="text-sm text-[var(--text-tertiary)] mb-1">
                Verification ID
              </p>
              <ClientOnly
                fallback={
                  <p className="font-mono text-lg font-bold text-[var(--primary-teal)]">
                    Loading...
                  </p>
                }
              >
                <p className="font-mono text-lg font-bold text-[var(--primary-teal)]">
                  {verificationId}
                </p>
              </ClientOnly>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Keep this ID for future reference
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verification Summary */}
        <Card variant="outlined">
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)]">
              Verification Summary
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--success)] rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Identity Verification
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    BVN and personal details verified
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--success)] rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Face Verification
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Biometric verification completed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--success)] rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Address Verification
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Location verified through partner services
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card variant="outlined">
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)]">
              What you can do now:
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[var(--primary-teal)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Open accounts instantly
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Use your verification to open accounts with partner banks
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[var(--primary-teal)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Access financial services
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Apply for loans, credit cards, and other financial products
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[var(--primary-teal)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Share verification status
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Show your verification ID to access services faster
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button size="lg" onClick={handleContinue} className="w-full">
            Continue to Banking Services
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleDownload}
            className="w-full"
          >
            Download Certificate
          </Button>
        </div>

        {/* Footer */}
        <RegulatoryFooter className="pt-4" />
      </div>
    </KYCLayout>
  );
};

export default KYCSuccessPage;