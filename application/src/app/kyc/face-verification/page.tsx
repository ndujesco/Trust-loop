"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";
import { useKYC } from "@/contexts/KYCContext";

interface BVNDetails {
  bvn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: string;
  birthDate?: string;
}

const FaceVerificationPage: React.FC = () => {
  const router = useRouter();
  const { state } = useKYC();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bvnDetails, setBvnDetails] = useState<BVNDetails | null>(null);

  // Helper function to mask names (show first 3 characters, mask the rest)
  const maskName = (name: string): string => {
    if (!name) return "";
    if (name.length <= 3) return name;
    return name.substring(0, 3).toUpperCase() + "*".repeat(name.length - 3);
  };

  useEffect(() => {
    const fetchBVNDetails = async () => {
      try {
        // Check if BVN exists in context
        const bvn = state.idInformation?.bvn;
        if (!bvn) {
          setError("BVN not found. Please complete ID verification first.");
          setLoading(false);
          return;
        }

        // Call actual BVN verification API
        const response = await fetch("/api/mock/verification/bvn", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bvn }),
        });

        if (response.ok) {
          const data = await response.json();
          const bvnData = data.data;

          // Mask the names for privacy
          setBvnDetails({
            bvn: bvnData.bvn,
            firstName: maskName(bvnData.firstName),
            middleName: bvnData.middleName ? maskName(bvnData.middleName) : "",
            lastName: maskName(bvnData.lastName),
            gender: bvnData.gender,
            birthDate: bvnData.birthDate,
          });
        } else if (response.status === 404) {
          setError("BVN details not found in database.");
        } else {
          throw new Error("Failed to fetch BVN details");
        }
      } catch (err) {
        console.error("Error fetching BVN details:", err);
        setError("Failed to load BVN details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBVNDetails();
  }, [state.idInformation]);

  const handleStartFaceVerification = () => {
    router.push("/kyc/document-submission");
  };

  const handleBack = () => {
    router.push("/kyc/residential-address");
  };

  if (loading) {
    return (
      <KYCLayout
        currentStep={3}
        totalSteps={8}
        steps={["ID Info", "Address", "Face Verification"]}
        onBack={handleBack}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-teal)] mx-auto"></div>
            <p className="text-[var(--text-tertiary)]">
              Loading verification details...
            </p>
          </div>
        </div>
      </KYCLayout>
    );
  }

  if (error) {
    return (
      <KYCLayout
        currentStep={3}
        totalSteps={8}
        steps={["ID Info", "Address Verification", "Face Verification"]}
        onBack={handleBack}
      >
        <div className="space-y-6 animate-fade-in">
          <Card variant="outlined" className="border-[var(--error)]">
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 bg-[var(--error)]/20 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-[var(--error)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Error Loading Details
                </h3>
                <p className="text-[var(--text-tertiary)]">{error}</p>
              </div>

              <Button onClick={handleBack} variant="outline">
                Go Back to ID Information
              </Button>
            </CardContent>
          </Card>
        </div>
      </KYCLayout>
    );
  }

  return (
    <KYCLayout
      currentStep={3}
      totalSteps={8}
      steps={["ID Info", "Address", "Face Verification"]}
      onBack={handleBack}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          {/* Illustration */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-[var(--border-primary)]">
              <div className="relative">
                {/* Person illustration */}
                <svg
                  className="w-12 h-12 text-[var(--bg-primary)]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>

                {/* Phone/scan device */}
                <div className="absolute -right-2 -top-2">
                  <div className="w-8 h-12 bg-[var(--bg-primary)] rounded-sm border border-[var(--border-primary)] flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  {/* Scan lines */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1 h-8 bg-red-500 opacity-60 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Face Verification
            </h1>
            <p className="text-[var(--text-tertiary)] leading-relaxed">
              Face verification is used to confirm that you are the BVN holder.
            </p>
          </div>
        </div>

        {/* BVN Details Card */}
        {bvnDetails && (
          <Card variant="outlined">
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                BVN Details
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-[var(--border-primary)]">
                  <span className="text-[var(--text-secondary)]">BVN</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {bvnDetails.bvn}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-[var(--border-primary)]">
                  <span className="text-[var(--text-secondary)]">
                    First Name
                  </span>
                  <span className="font-mono text-[var(--primary-teal)]">
                    {bvnDetails.firstName}
                  </span>
                </div>

                {bvnDetails.middleName && (
                  <div className="flex justify-between items-center py-2 border-b border-[var(--border-primary)]">
                    <span className="text-[var(--text-secondary)]">
                      Middle Name
                    </span>
                    <span className="font-mono text-[var(--primary-teal)]">
                      {bvnDetails.middleName}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2">
                  <span className="text-[var(--text-secondary)]">
                    Last Name
                  </span>
                  <span className="font-mono text-[var(--primary-teal)]">
                    {bvnDetails.lastName}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Note */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)]">
          <p className="text-sm font-medium">
            Photos captured will only be used for this verification.
          </p>
        </div>

        {/* Start Button */}
        <div className="pt-4">
          <Button
            size="xl"
            onClick={handleStartFaceVerification}
            className="w-full"
          >
            Let's Start
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-center space-y-2">
          <p className="text-sm text-[var(--text-tertiary)]">You'll need to:</p>
          <ul className="text-sm text-[var(--text-tertiary)] space-y-1">
            <li>• Position your face in the camera frame</li>
            <li>• Ensure good lighting</li>
            <li>• Follow the on-screen instructions</li>
          </ul>
        </div>
      </div>
    </KYCLayout>
  );
};

export default FaceVerificationPage;
