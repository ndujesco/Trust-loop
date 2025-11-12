import React from "react";
import { cn } from "@/lib/utils";

export interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
  showLabels?: boolean;
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps,
  steps,
  showLabels = true,
  className,
}) => {
  const safeTotal = Math.max(totalSteps, 1);
  const percentage =
    Math.min(Math.max(currentStep, 0), safeTotal) / safeTotal;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="h-2 bg-[var(--border-primary)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--primary-teal)] transition-all duration-300"
          style={{ width: `${percentage * 100}%` }}
        />
      </div>

      <div className="flex justify-between text-sm text-[var(--text-tertiary)]">
          <span>Step {Math.min(currentStep, safeTotal)} of {safeTotal}</span>
        {steps && steps.length > 0 && (
          <span>{steps[Math.min(currentStep - 1, steps.length - 1)]}</span>
        )}
      </div>

      {showLabels && steps && steps.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs text-[var(--text-secondary)]">
          {steps.map((label, index) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-2",
                index + 1 <= currentStep
                  ? "text-[var(--primary-teal)] font-semibold"
                  : "opacity-60"
              )}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                {index + 1}
              </span>
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

