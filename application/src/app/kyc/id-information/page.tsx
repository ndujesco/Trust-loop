"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Input } from "@/components/ui/Input";
import KYCLayout from "@/components/layouts/KYCLayout";
import { useState } from "react";
import { useKYCActions } from "@/contexts/KYCContext";

interface IDValues {
  bvn: string;
  nin: string;
}

type ActiveTab = "bvn" | "nin";

const IDInformationPage: React.FC = () => {
  const router = useRouter();
  const { setIdInformation, setUserData } = useKYCActions();
  const [activeTab, setActiveTab] = useState<ActiveTab>("bvn");
  const [idValues, setIdValues] = useState<IDValues>({ bvn: "", nin: "" });
  const [isValidating, setIsValidating] = useState(false);
  const [bvnError, setBvnError] = useState("");
  const [ninError, setNinError] = useState("");
  const [error, setError] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [bvnExists, setBvnExists] = useState<boolean | null>(null);
  const [ninExists, setNinExists] = useState<boolean | null>(null);
  const [bvnValidated, setBvnValidated] = useState(false);
  const [ninValidated, setNinValidated] = useState(false);

  const handleIDChange = (type: "bvn" | "nin", value: string) => {
    // Only allow digits and limit to 11 characters
    const cleanValue = value.replace(/\D/g, "").slice(0, 11);
    setIdValues((prev) => ({
      ...prev,
      [type]: cleanValue,
    }));
    setIsComplete(false);

    // Reset validation state and error for the field being changed
    if (type === "bvn") {
      setBvnError("");
      setBvnExists(null);
      setBvnValidated(false);
    } else {
      setNinError("");
      setNinExists(null);
      setNinValidated(false);
    }

    // Auto-validate when 11 digits are entered
    if (cleanValue.length === 11) {
      handleIDComplete(type, cleanValue);
    }
  };

  const handleIDComplete = async (type: "bvn" | "nin", value: string) => {
    const cleanValue = value.replace(/\s/g, "");
    if (cleanValue.length !== 11) {
      return;
    }

    setIsValidating(true);

    try {
      let currentBvnValidated = bvnValidated;
      let currentNinValidated = ninValidated;

      if (type === "bvn") {
        // Call actual BVN verification API
        const response = await fetch("/api/mock/verification/bvn", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bvn: cleanValue }),
        });

        if (response.ok) {
          const data = await response.json();
          setBvnExists(true);
          setBvnValidated(true);
          setBvnError("");
          currentBvnValidated = true;
          console.log("BVN found:", data.data);
        } else if (response.status === 404) {
          setBvnExists(false);
          setBvnValidated(false);
          setBvnError("Incorrect BVN. Please check and try again.");
          currentBvnValidated = false;
        } else {
          throw new Error("BVN verification failed");
        }
      } else if (type === "nin") {
        // Call actual NIN verification API
        const response = await fetch("/api/mock/verification/nin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nin: cleanValue }),
        });

        if (response.ok) {
          const data = await response.json();
          setNinExists(true);
          setNinValidated(true);
          setNinError("");
          currentNinValidated = true;
          console.log("NIN found:", data.data);
        } else if (response.status === 404) {
          setNinExists(false);
          setNinValidated(false);
          setNinError("Incorrect NIN. Please check and try again.");
          currentNinValidated = false;
        } else {
          throw new Error("NIN verification failed");
        }
      }

      // Check if both IDs are validated
      const bothValidated =
        (type === "bvn" ? currentBvnValidated : bvnValidated) &&
        (type === "nin" ? currentNinValidated : ninValidated);

      if (bothValidated) {
        setIsComplete(true);
        // Save ID information to context
        setIdInformation({
          bvn: type === "bvn" ? cleanValue : idValues.bvn,
          nin: type === "nin" ? cleanValue : idValues.nin,
        });
      } else if (type === "bvn" && currentBvnValidated && !ninValidated) {
        // Auto-switch to NIN tab after BVN is validated
        setTimeout(() => setActiveTab("nin"), 500);
      }
    } catch (error) {
      console.error(`Failed to validate ${type.toUpperCase()}:`, error);
      if (type === "bvn") {
        setBvnError(`Failed to validate BVN. Please try again.`);
        setBvnExists(null);
        setBvnValidated(false);
      } else {
        setNinError(`Failed to validate NIN. Please try again.`);
        setNinExists(null);
        setNinValidated(false);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleBack = () => {
    router.push("/kyc");
  };

  const handleContinue = async () => {
    if (!isFormValid) return;

    setIsValidating(true);
    setError("");

    try {
      // Call /api/user endpoint with BVN and NIN
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bvn: idValues.bvn,
          nin: idValues.nin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "BVN and NIN do not match");
      }

      const data = await response.json();

      // Save user data to KYC context
      setUserData(data.user);

      // Navigate to residential address page
      router.push("/kyc/residential-address");
    } catch (err) {
      console.error("Error validating BVN and NIN:", err);
      setError(
        err instanceof Error
          ? err.message
          : "BVN and NIN do not match. Please check and try again."
      );
    } finally {
      setIsValidating(false);
    }
  };

  const isFormValid =
    bvnValidated && ninValidated && !isValidating && !bvnError && !ninError;

  return (
    <KYCLayout
      currentStep={1}
      totalSteps={8}
      steps={["ID Info", "Address"]}
      onBack={handleBack}
    >
      <div className="space-y-6 animate-fade-in px-2 sm:px-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="mt-10 text-center space-y-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Enter your ID information
          </h1>
          <p className="text-[var(--text-tertiary)] leading-relaxed">
            Please provide both your BVN and NIN to verify your account opening
            application
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-[var(--bg-secondary)] rounded-lg">
          <button
            onClick={() => setActiveTab("bvn")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "bvn"
                ? "bg-[var(--primary-teal)] text-white"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>BVN</span>
            {bvnValidated && (
              <svg
                className={`w-4 h-4 ${
                  activeTab === "bvn" ? "text-white" : "text-[var(--success)]"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
          <button
            onClick={() => setActiveTab("nin")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "nin"
                ? "bg-[var(--primary-teal)] text-white"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>NIN</span>
            {ninValidated && (
              <svg
                className={`w-4 h-4 ${
                  activeTab === "nin" ? "text-white" : "text-[var(--success)]"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>

        {/* ID Input Fields */}
        <div className="space-y-6">
          {/* BVN Input */}
          {activeTab === "bvn" && (
            <div className="space-y-3 animate-fade-in">
              <div className="w-full max-w-xs mx-auto">
                <Input
                  label="BVN (Bank Verification Number)"
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  value={idValues.bvn}
                  onChange={(e) => handleIDChange("bvn", e.target.value)}
                  error={!!bvnError}
                  errorText={bvnError}
                  helperText="11-digit bank verification number"
                  disabled={isValidating}
                  placeholder="Enter 11-digit BVN"
                  className="text-center font-mono text-lg tracking-wider"
                />
              </div>
            </div>
          )}

          {/* NIN Input */}
          {activeTab === "nin" && (
            <div className="space-y-3 animate-fade-in">
              <div className="w-full max-w-xs mx-auto">
                <Input
                  label="NIN (National Identification Number)"
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  value={idValues.nin}
                  onChange={(e) => handleIDChange("nin", e.target.value)}
                  error={!!ninError}
                  errorText={ninError}
                  helperText="11-digit national identification number"
                  disabled={isValidating}
                  placeholder="Enter 11-digit NIN"
                  className="text-center font-mono text-lg tracking-wider"
                />
              </div>
            </div>
          )}
        </div>

        {/* Validation Status */}
        {isValidating && (
          <Card variant="outlined">
            <CardContent className="flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <span className="text-[var(--text-secondary)]">
                Validating ID information...
              </span>
            </CardContent>
          </Card>
        )}

        {isComplete && !bvnError && !ninError && (
          <Card variant="outlined" className="border-[var(--success)]">
            <CardContent className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-[var(--success)]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[var(--success)] font-medium">
                BVN and NIN validated successfully
              </span>
            </CardContent>
          </Card>
        )}

        {/* BVN Status (if BVN exists in database) */}
        {bvnExists === true && activeTab === "bvn" && (
          <Card
            variant="outlined"
            className="border-[var(--primary-teal)] bg-[var(--bg-secondary)]"
          >
            <CardContent className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-[var(--primary-teal)]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <span className="text-[var(--primary-teal)] font-medium">
                  BVN verified successfully
                </span>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  You may be eligible for fast-track verification
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NIN Status (if NIN exists in database) */}
        {ninExists === true && activeTab === "nin" && (
          <Card
            variant="outlined"
            className="border-[var(--success)] bg-[var(--bg-secondary)]"
          >
            <CardContent className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-[var(--success)]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[var(--success)] font-medium">
                NIN verified successfully
              </span>
            </CardContent>
          </Card>
        )}

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

        {/* Continue Button */}
        <div className="pt-4">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!isFormValid}
            className="w-full"
            loading={isValidating}
          >
            Continue
          </Button>
        </div>

        {/* Security Note */}
        <div className="text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Your information is secure and encrypted
          </p>
        </div>
      </div>
    </KYCLayout>
  );
};

export default IDInformationPage;
