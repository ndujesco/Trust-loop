import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "segmented";
  error?: boolean;
  label?: string;
  helperText?: string;
  errorText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = "default",
      error = false,
      label,
      helperText,
      errorText,
      type,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-teal)] disabled:cursor-not-allowed disabled:opacity-50";

    const variants = {
      default:
        "border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-secondary)]",
      segmented:
        "border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-secondary)] text-center font-mono text-lg tracking-wider",
    };

    const errorStyles =
      "border-[var(--error)] focus-visible:ring-[var(--error)]";

    const input = (
      <input
        type={type}
        className={cn(
          baseStyles,
          variants[variant],
          error && errorStyles,
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (!label && !helperText && !errorText) {
      return input;
    }

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            {label}
          </label>
        )}
        {input}
        {error && errorText && (
          <p className="mt-2 text-sm text-[var(--error)]">{errorText}</p>
        )}
        {!error && helperText && (
          <p className="mt-2 text-sm text-[var(--text-tertiary)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";


export { Input };
