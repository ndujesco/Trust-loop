"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import KYCLayout from "@/components/layouts/KYCLayout";
import { useKYC, useKYCActions } from "@/contexts/KYCContext";

const ResidentialAddressPage: React.FC = () => {
  const router = useRouter();
  const { state } = useKYC();
  const { setCurrentAddress } = useKYCActions();

  const [sameAsCurrent, setSameAsCurrent] = useState(true);
  const [currentAddress, setCurrentAddressState] = useState({
    state: "",
    lga: "",
    area: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  // Get BVN address from user data
  const bvnAddress = state.userData?.address?.fromBvn || "";

  const handleContinue = async () => {
    setLoading(true);

    try {
      // Save current address to context
      setCurrentAddress(currentAddress);

      // Navigate to face verification
      router.push("/kyc/face-verification");
    } catch (error) {
      console.error("Error saving address:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/kyc/id-information");
  };

  const isFormValid =
    sameAsCurrent ||
    (currentAddress.state &&
      currentAddress.lga &&
      currentAddress.area &&
      currentAddress.address);

  return (
    <KYCLayout
      currentStep={2}
      totalSteps={8}
      steps={[
        "ID Info",
        "Address",
      ]}
      onBack={handleBack}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Residential Address
          </h1>
          <p className="text-[var(--text-tertiary)]">
            Verify your residential address information
          </p>
        </div>

        {/* Instruction Banner */}
        <Card className="bg-[var(--primary-teal)] border-[var(--primary-teal)]">
          <CardContent className="py-4">
            <p className="text-white text-center font-medium">
              Provide your complete residential address
            </p>
          </CardContent>
        </Card>

        {/* BVN Address Display */}
        <Card variant="outlined">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Address from BVN
            </h3>
            <div className="bg-[var(--bg-primary)] rounded-lg p-4">
              <p className="text-[var(--text-secondary)] font-mono">
                {bvnAddress}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[var(--text-tertiary)] text-sm">
                Is this where you currently live?
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Address Section */}
        <Card variant="outlined">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Current Address
            </h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sameAsBvn"
                checked={sameAsCurrent}
                onChange={(e) => setSameAsCurrent(e.target.checked)}
                className="w-5 h-5 text-[var(--primary-teal)] bg-[var(--bg-secondary)] border-[var(--border-primary)] rounded focus:ring-[var(--primary-teal)] focus:ring-2"
              />
              <label
                htmlFor="sameAsBvn"
                className="text-[var(--text-secondary)]"
              >
                My current address is the same as the BVN address above
              </label>
            </div>

            {!sameAsCurrent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="State"
                      value={currentAddress.state}
                      onChange={(e) =>
                        setCurrentAddressState((prev) => ({
                          ...prev,
                          state: e.target.value,
                        }))
                      }
                      placeholder="Select state"
                    />
                  </div>
                  <div>
                    <Input
                      label="LGA"
                      value={currentAddress.lga}
                      onChange={(e) =>
                        setCurrentAddressState((prev) => ({
                          ...prev,
                          lga: e.target.value,
                        }))
                      }
                      placeholder="Select LGA"
                    />
                  </div>
                </div>

                <div>
                  <Input
                    label="Area"
                    value={currentAddress.area}
                    onChange={(e) =>
                      setCurrentAddressState((prev) => ({
                        ...prev,
                        area: e.target.value,
                      }))
                    }
                    placeholder="Select area"
                  />
                </div>

                <div>
                  <Input
                    label="Address"
                    value={currentAddress.address}
                    onChange={(e) =>
                      setCurrentAddressState((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="Please enter your detailed address"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Button */}
        <div className="pt-4">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!isFormValid}
            className="w-full"
            loading={loading}
          >
            Next
          </Button>
        </div>
      </div>
    </KYCLayout>
  );
};

export default ResidentialAddressPage;
