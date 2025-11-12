import React from "react";
import { cn } from "@/lib/utils";

export interface RegulatoryFooterProps {
  className?: string;
  showLogos?: boolean;
}

const RegulatoryFooter: React.FC<RegulatoryFooterProps> = ({
  className,
  showLogos = true,
}) => {
  return (
    <div className={cn("flex flex-col items-center gap-2 pt-4", className)}>
      {showLogos && (
        <div className="flex items-center gap-4">
          {/* CBN Logo placeholder */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[var(--primary-teal)] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-xs font-medium text-[var(--text-tertiary)]">
              CBN
            </span>
          </div>

          {/* NDIC Logo placeholder */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[var(--primary-teal)] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="text-xs font-medium text-[var(--text-tertiary)]">
              NDIC
            </span>
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--text-muted)] text-center">
        Licensed by the CBN and insured by the NDIC
      </p>
    </div>
  );
};

export default RegulatoryFooter;
