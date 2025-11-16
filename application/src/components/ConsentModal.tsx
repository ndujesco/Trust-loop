"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface ConsentModalProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  children?: React.ReactNode;
}

const ConsentModal: React.FC<ConsentModalProps> = ({
  open,
  onConfirm,
  onClose,
  title = "TrustLoop Data Consent Notice",
  confirmLabel = "Yes — I Consent",
  cancelLabel = "Cancel",
  children,
}) => {
  if (!open) return null;

  const defaultContent = (
    <>
      <p className="text-sm text-[var(--text-primary)] mb-4">
        TrustLoop is committed to protecting your privacy. To complete your KYC
        address verification, we require your permission to process the
        information you provide — including your uploaded utility bill and Phone
        Location History file.
      </p>

      <div className="text-sm text-[var(--text-primary)] space-y-2 mb-4">
        <p>This data will be used exclusively to:</p>
        <ul className="list-disc pl-5">
          <li>verify your identity and residential address,</li>
          <li>run our verification algorithms, and</li>
          <li>confirm your eligibility for Tier-3 KYC.</li>
        </ul>

        <p className="mt-2">
          We do not store, share, or retain your Phone's Location History. The
          file is processed securely and deleted immediately after analysis.
          Only your verified address and utility document are retained, in line
          with regulatory requirements.
        </p>

        <p className="mt-2">You may withdraw your consent at any time.</p>

        <p className="mt-2">
          Please confirm your consent to allow TrustLoop to process your
          information for KYC verification by clicking “Yes” below.
        </p>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative max-w-2xl w-full mx-4">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-3">{title}</h2>

            {children ?? defaultContent}

            <div className="flex justify-end space-x-3 mt-4">
              <Button variant="secondary" onClick={onClose} size="md">
                {cancelLabel}
              </Button>
              <Button variant="primary" onClick={onConfirm} size="md">
                {confirmLabel}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConsentModal;
