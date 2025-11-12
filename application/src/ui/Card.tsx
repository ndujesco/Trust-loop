import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "elevated" | "outlined" | "ghost";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "elevated", ...props }, ref) => {
    const variants = {
      elevated:
        "bg-[var(--bg-card)] shadow-lg shadow-black/5 border border-[var(--border-primary)]",
      outlined: "bg-[var(--bg-card)] border border-[var(--border-primary)]",
      ghost: "bg-transparent border border-transparent",
    } as const;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl transition-shadow duration-200",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-6 text-[var(--text-secondary)]", className)}
      {...props}
    />
  )
);

CardContent.displayName = "CardContent";

