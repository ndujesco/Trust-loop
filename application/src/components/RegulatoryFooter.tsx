import React from "react";
import { cn } from "@/lib/utils";

export interface RegulatoryFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const RegulatoryFooter: React.FC<RegulatoryFooterProps> = ({
  className,
  ...props
}) => (
  <footer
    className={cn(
      "text-xs text-[var(--text-tertiary)] leading-relaxed",
      className
    )}
    {...props}
  >
    <p>
      TrustLoop Bank is a licensed financial institution regulated by the
      Central Bank of Nigeria (CBN) with deposits insured by the Nigeria Deposit
      Insurance Corporation (NDIC).
    </p>
    <p className="mt-2">
      For support, contact compliance@trustloop.ng or visit any of our physical
      branches nationwide.
    </p>
  </footer>
);

export default RegulatoryFooter;
