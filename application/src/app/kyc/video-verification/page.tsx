"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";

const VideoVerificationPage: React.FC = () => {
  const router = useRouter();

  const handleBack = () => {
    router.push("/kyc/document-submission");
  };

  return (
    <KYCLayout
      currentStep={6}
      totalSteps={6}
      steps={["ID Info", "Address", "Face", "Capture", "Documents", "Video"]}
      onBack={handleBack}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Video Verification
          </h1>
          <p className="text-[var(--text-tertiary)]">
            Select your house location on the map
          </p>
        </div>

        {/* Instructions */}
        <Card variant="outlined" className="bg-[var(--bg-secondary)]">
          <CardContent className="py-4">
            <h4 className="font-medium text-[var(--text-primary)] mb-2">
              Instructions:
            </h4>
            <p className="text-[var(--text-secondary)] text-sm">
              Street View is showing your verified address. Drag to look around
              360°, use the arrows on the street to navigate, and adjust the
              view to see the front of your house clearly.
            </p>
          </CardContent>
        </Card>

        {/* Street View */}
        <Card variant="outlined">
          <CardContent className="p-0">
            <div className="relative">
              <div
                className="w-full rounded-lg bg-[var(--bg-secondary)]"
                style={{ minHeight: "500px", height: "500px" }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-teal)] mx-auto"></div>
                    <p className="text-[var(--text-tertiary)] text-sm">
                      Loading Street View...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirm Location Button */}
        <Button size="lg" className="w-full" disabled>
          Confirm Location & Continue to Video
        </Button>
      </div>
    </KYCLayout>
  );
};

export default VideoVerificationPage;
