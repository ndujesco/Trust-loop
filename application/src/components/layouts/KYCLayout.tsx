import React from "react";
import { cn } from "@/lib/utils";
import { StepProgress } from "@/components/ui/ProgressBar";

export interface KYCLayoutProps {
  children: React.ReactNode;
  currentStep?: number;
  totalSteps?: number;
  steps?: string[];
  showProgress?: boolean;
  onBack?: () => void;
  onHelp?: () => void;
  className?: string;
}

const KYCLayout: React.FC<KYCLayoutProps> = ({
  children,
  currentStep = 1,
  totalSteps = 4,
  steps,
  showProgress = true,
  onBack,
  onHelp,
  className,
}) => {
  return (
    <div
      className={cn(
        "min-h-screen bg-[var(--bg-primary)] flex flex-col",
        className
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5 text-[var(--text-primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {onHelp && (
            <button
              onClick={onHelp}
              className="text-[var(--primary-teal)] font-medium hover:text-[var(--primary-teal-light)] transition-colors"
            >
              Help
            </button>
          )}
        </div>
      </header>

      {/* Progress Bar */}
      {showProgress && totalSteps > 1 && (
        <div className="px-4 py-3 border-b border-[var(--border-primary)]">
          <StepProgress
            currentStep={currentStep}
            totalSteps={totalSteps}
            steps={steps}
            showLabels={false}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default KYCLayout;
