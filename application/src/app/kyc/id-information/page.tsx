"use client";

import { Button } from "@/components/ui/Button";
import KYCLayout from "@/components/layouts/KYCLayout";
import { useState } from "react";

type ActiveTab = "bvn" | "nin";

const IDInformationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("bvn");

  return (
    <KYCLayout>
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
            {false && (
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
            {false && (
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
                <input
                  placeholder="Enter 11-digit NIN"
                  className="text-center font-mono text-lg tracking-wider"
                />
              </div>
            </div>
          )}

          {/* NIN Input */}
          {activeTab === "nin" && (
            <div className="space-y-3 animate-fade-in">
              <div className="w-full max-w-xs mx-auto">
                <input
                  placeholder="Enter 11-digit NIN"
                  className="text-center font-mono text-lg tracking-wider"
                />
              </div>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="pt-4">
          <Button size="lg">Continue</Button>
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
