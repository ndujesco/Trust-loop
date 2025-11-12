import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  animated?: boolean;
  color?: "default" | "success" | "warning" | "error";
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      size = "md",
      showPercentage = true,
      animated = true,
      color = "default",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const baseStyles =
      "relative overflow-hidden rounded-full bg-[var(--bg-tertiary)]";

    const sizes = {
      sm: "h-2",
      md: "h-3",
      lg: "h-4",
    };

    const colors = {
      default: "bg-[var(--primary-teal)]",
      success: "bg-[var(--success)]",
      warning: "bg-[var(--warning)]",
      error: "bg-[var(--error)]",
    };

    const fillStyles = cn(
      "h-full transition-all duration-300 ease-out",
      colors[color],
      animated && "animate-pulse"
    );

    return (
      <div
        ref={ref}
        className={cn(baseStyles, sizes[size], className)}
        {...props}
      >
        <div className={fillStyles} style={{ width: `${percentage}%` }} />
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export interface StepProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
  showLabels?: boolean;
}

const StepProgress = React.forwardRef<HTMLDivElement, StepProgressProps>(
  (
    { className, currentStep, totalSteps, steps, showLabels = true, ...props },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {/* Steps */}
        <div className="flex justify-between relative">
          {/* Progress Line - positioned in the middle of circles */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[var(--bg-tertiary)] transform -translate-y-1/2" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-[var(--primary-teal)] transform -translate-y-1/2 transition-all duration-300"
            style={{
              width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            }}
          />
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div
                key={stepNumber}
                className="flex flex-col items-center flex-1 relative z-10"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all duration-200 bg-[var(--bg-primary)]",
                    isCompleted &&
                      "bg-[var(--primary-teal)] border-[var(--primary-teal)] text-white",
                    isCurrent &&
                      "bg-[var(--bg-card)] border-[var(--primary-teal)] text-[var(--primary-teal)]",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-tertiary)]"
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                {showLabels && steps && steps[index] && (
                  <span className="mt-2 text-xs text-[var(--text-tertiary)] text-center px-1">
                    {steps[index]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

StepProgress.displayName = "StepProgress";

export { ProgressBar, StepProgress };
