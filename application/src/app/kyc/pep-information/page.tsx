"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import KYCLayout from "@/components/layouts/KYCLayout";
import {
  useKYC,
  useKYCActions,
  PepDetails,
  RelatedPepDetails,
} from "@/contexts/KYCContext";
import {
  NIGERIAN_STATES,
  POLITICAL_OFFICES,
  RELATIONSHIP_TYPES,
} from "@/lib/constants/pep";

const PepInformationPage: React.FC = () => {
  const router = useRouter();
  const { state } = useKYC();
  const { setPepStatus } = useKYCActions();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PEP Details form
  const [pepDetails, setPepDetails] = useState<PepDetails>({
    politicalOffice: "",
    state: "",
    startDate: "",
    endDate: "",
    currentlyInOffice: false,
  });

  // Related PEP Details form
  const [relatedPepDetails, setRelatedPepDetails] = useState<RelatedPepDetails>(
    {
      relationName: "",
      relationship: "",
      politicalOffice: "",
      state: "",
      startDate: "",
      endDate: "",
      currentlyInOffice: false,
    }
  );

  const [pepErrors, setPepErrors] = useState<
    Partial<Omit<PepDetails, "currentlyInOffice">> & {
      currentlyInOffice?: string;
    }
  >({});
  const [relatedPepErrors, setRelatedPepErrors] = useState<
    Partial<Omit<RelatedPepDetails, "currentlyInOffice">> & {
      currentlyInOffice?: string;
    }
  >({});

  // Load existing PEP status from context
  useEffect(() => {
    if (state.pepStatus) {
      if (state.pepStatus.pepDetails) {
        setPepDetails(state.pepStatus.pepDetails);
      }
      if (state.pepStatus.relatedPepDetails) {
        setRelatedPepDetails(state.pepStatus.relatedPepDetails);
      }
    }
  }, [state.pepStatus]);

  const handlePepInputChange = (
    field: keyof PepDetails,
    value: string | boolean
  ) => {
    setPepDetails((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing (only for string fields)
    if (
      field !== "currentlyInOffice" &&
      pepErrors[field as keyof typeof pepErrors]
    ) {
      setPepErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleRelatedPepInputChange = (
    field: keyof RelatedPepDetails,
    value: string | boolean
  ) => {
    setRelatedPepDetails((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing (only for string fields)
    if (
      field !== "currentlyInOffice" &&
      relatedPepErrors[field as keyof typeof relatedPepErrors]
    ) {
      setRelatedPepErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validatePepDetails = (): boolean => {
    const errors: Partial<Omit<PepDetails, "currentlyInOffice">> & {
      currentlyInOffice?: string;
    } = {};

    if (!pepDetails.politicalOffice)
      errors.politicalOffice = "Political office is required";
    if (!pepDetails.startDate) errors.startDate = "Start date is required";

    // If not currently in office, end date is required
    if (!pepDetails.currentlyInOffice && !pepDetails.endDate) {
      errors.endDate = "End date is required when not currently in office";
    }

    setPepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRelatedPepDetails = (): boolean => {
    const errors: Partial<Omit<RelatedPepDetails, "currentlyInOffice">> & {
      currentlyInOffice?: string;
    } = {};

    if (!relatedPepDetails.relationName)
      errors.relationName = "Relation name is required";
    if (!relatedPepDetails.relationship)
      errors.relationship = "Relationship type is required";
    if (!relatedPepDetails.politicalOffice)
      errors.politicalOffice = "Political office is required";
    if (!relatedPepDetails.startDate)
      errors.startDate = "Start date is required";

    // If not currently in office, end date is required
    if (!relatedPepDetails.currentlyInOffice && !relatedPepDetails.endDate) {
      errors.endDate = "End date is required when not currently in office";
    }

    setRelatedPepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = async () => {
    setError(null);

    // Validate based on what needs to be filled
    let isValid = true;

    if (state.pepStatus?.isPep) {
      isValid = validatePepDetails() && isValid;
    }

    if (state.pepStatus?.isRelatedToPep) {
      isValid = validateRelatedPepDetails() && isValid;
    }

    if (!isValid) {
      setError("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);

    try {
      // Update PEP status with collected information
      const updatedPepStatus = {
        isPep: state.pepStatus?.isPep || false,
        isRelatedToPep: state.pepStatus?.isRelatedToPep || false,
        pepDetails: state.pepStatus?.isPep ? pepDetails : null,
        relatedPepDetails: state.pepStatus?.isRelatedToPep
          ? relatedPepDetails
          : null,
      };

      setPepStatus(updatedPepStatus);

      // Save to database
      if (state.userData?._id) {
        const response = await fetch("/api/user/pep", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: state.userData._id,
            pepStatus: updatedPepStatus,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save PEP information");
        }
      }

      // Navigate to document submission
      router.push("/kyc/document-submission");
    } catch (err) {
      console.error("Error saving PEP information:", err);
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
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-4">
            PEP Information Collection
          </h1>
          <p className="text-text-secondary">
            Please provide the following information about your political
            exposure.
          </p>
        </div>

        {/* User's Own PEP Details */}
        {state.pepStatus?.isPep && (
          <Card className="mb-8">
            <CardContent className="p-8">
              <CardTitle className="text-xl font-semibold text-primary mb-6">
                Your Political Office Information
              </CardTitle>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Political Office */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Political Office *
                  </label>
                  <select
                    value={pepDetails.politicalOffice}
                    onChange={(e) =>
                      handlePepInputChange("politicalOffice", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)] focus:border-transparent"
                  >
                    <option value="">Select political office</option>
                    {POLITICAL_OFFICES.map((office) => (
                      <option key={office} value={office}>
                        {office}
                      </option>
                    ))}
                  </select>
                  {pepErrors.politicalOffice && (
                    <p className="text-[var(--error)] text-sm mt-1">
                      {pepErrors.politicalOffice}
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    State (Optional)
                  </label>
                  <select
                    value={pepDetails.state}
                    onChange={(e) =>
                      handlePepInputChange("state", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)] focus:border-transparent"
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <Input
                    label="Start Date *"
                    type="date"
                    value={pepDetails.startDate}
                    onChange={(e) =>
                      handlePepInputChange("startDate", e.target.value)
                    }
                    error={!!pepErrors.startDate}
                    errorText={pepErrors.startDate}
                    className="bg-[var(--bg-secondary)]"
                  />
                </div>

                {/* End Date */}
                <div>
                  <Input
                    label={`End Date ${
                      pepDetails.currentlyInOffice ? "(Optional)" : "*"
                    }`}
                    type="date"
                    value={pepDetails.endDate}
                    onChange={(e) =>
                      handlePepInputChange("endDate", e.target.value)
                    }
                    disabled={pepDetails.currentlyInOffice}
                    error={!!pepErrors.endDate}
                    errorText={pepErrors.endDate}
                    className="bg-[var(--bg-secondary)]"
                  />
                </div>
              </div>

              {/* Currently In Office Checkbox */}
              <div className="mt-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pepDetails.currentlyInOffice}
                    onChange={(e) =>
                      handlePepInputChange(
                        "currentlyInOffice",
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 text-primary-teal bg-bg-primary border-border-primary rounded focus:ring-primary-teal focus:ring-2"
                  />
                  <span className="text-text-primary">
                    I currently hold this position
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related PEP Details */}
        {state.pepStatus?.isRelatedToPep && (
          <Card className="mb-8">
            <CardContent className="p-8">
              <CardTitle className="text-xl font-semibold text-primary mb-6">
                Related Person's Political Office Information
              </CardTitle>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Relation Name */}
                <div>
                  <Input
                    label="Full Name *"
                    type="text"
                    value={relatedPepDetails.relationName}
                    onChange={(e) =>
                      handleRelatedPepInputChange(
                        "relationName",
                        e.target.value
                      )
                    }
                    placeholder="Enter full name"
                    error={!!relatedPepErrors.relationName}
                    errorText={relatedPepErrors.relationName}
                    className="bg-[var(--bg-secondary)]"
                  />
                </div>

                {/* Relationship */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Relationship *
                  </label>
                  <select
                    value={relatedPepDetails.relationship}
                    onChange={(e) =>
                      handleRelatedPepInputChange(
                        "relationship",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)] focus:border-transparent"
                  >
                    <option value="">Select relationship</option>
                    {RELATIONSHIP_TYPES.map((relationship) => (
                      <option key={relationship} value={relationship}>
                        {relationship}
                      </option>
                    ))}
                  </select>
                  {relatedPepErrors.relationship && (
                    <p className="text-[var(--error)] text-sm mt-1">
                      {relatedPepErrors.relationship}
                    </p>
                  )}
                </div>

                {/* Political Office */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Political Office *
                  </label>
                  <select
                    value={relatedPepDetails.politicalOffice}
                    onChange={(e) =>
                      handleRelatedPepInputChange(
                        "politicalOffice",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)] focus:border-transparent"
                  >
                    <option value="">Select political office</option>
                    {POLITICAL_OFFICES.map((office) => (
                      <option key={office} value={office}>
                        {office}
                      </option>
                    ))}
                  </select>
                  {relatedPepErrors.politicalOffice && (
                    <p className="text-[var(--error)] text-sm mt-1">
                      {relatedPepErrors.politicalOffice}
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    State (Optional)
                  </label>
                  <select
                    value={relatedPepDetails.state}
                    onChange={(e) =>
                      handleRelatedPepInputChange("state", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)] focus:border-transparent"
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <Input
                    label="Start Date *"
                    type="date"
                    value={relatedPepDetails.startDate}
                    onChange={(e) =>
                      handleRelatedPepInputChange("startDate", e.target.value)
                    }
                    error={!!relatedPepErrors.startDate}
                    errorText={relatedPepErrors.startDate}
                    className="bg-[var(--bg-secondary)]"
                  />
                </div>

                {/* End Date */}
                <div>
                  <Input
                    label={`End Date ${
                      relatedPepDetails.currentlyInOffice ? "(Optional)" : "*"
                    }`}
                    type="date"
                    value={relatedPepDetails.endDate}
                    onChange={(e) =>
                      handleRelatedPepInputChange("endDate", e.target.value)
                    }
                    disabled={relatedPepDetails.currentlyInOffice}
                    error={!!relatedPepErrors.endDate}
                    errorText={relatedPepErrors.endDate}
                    className="bg-[var(--bg-secondary)]"
                  />
                </div>
              </div>

              {/* Currently In Office Checkbox */}
              <div className="mt-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={relatedPepDetails.currentlyInOffice}
                    onChange={(e) =>
                      handleRelatedPepInputChange(
                        "currentlyInOffice",
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 text-primary-teal bg-bg-primary border-border-primary rounded focus:ring-primary-teal focus:ring-2"
                  />
                  <span className="text-text-primary">
                    This person currently holds this position
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

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
            disabled={loading}
            className="px-8 py-3"
          >
            {loading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </KYCLayout>
  );
};

export default PepInformationPage;
