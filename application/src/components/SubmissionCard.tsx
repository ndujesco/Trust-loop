// application/src/components/SubmissionCard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

type SubmissionStatus = "pending" | "verified" | "rejected";

type Submission = {
  id: string;
  buildingType: string;
  buildingColor: string;
  closestLandmark: string;
  email: string;
  utilityBillProvided: boolean;
  submittedAt: string;
  status?: SubmissionStatus;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  livesInEstate?: boolean;
  gatekeeperPhone?: string | null;
};

export default function SubmissionCard({
  submission,
}: {
  submission: Submission;
}) {
  const [open, setOpen] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [rejectSuccess, setRejectSuccess] = useState(false);
  const [localStatus, setLocalStatus] = useState<SubmissionStatus>(
    submission.status ?? "pending"
  );
  const [localVerifiedAt, setLocalVerifiedAt] = useState<string | null>(
    submission.verifiedAt ?? null
  );
  const [localRejectedAt, setLocalRejectedAt] = useState<string | null>(
    submission.rejectedAt ?? null
  );
  const [localRejectionReason, setLocalRejectionReason] = useState<
    string | null
  >(submission.rejectionReason ?? null);
  const [rejectReason, setRejectReason] = useState(
    submission.rejectionReason ?? ""
  );
  const dt = new Date(submission.submittedAt);
  const shortTs = dt.toLocaleString();

  useEffect(() => {
    setLocalStatus(submission.status ?? "pending");
    setLocalVerifiedAt(submission.verifiedAt ?? null);
    setLocalRejectedAt(submission.rejectedAt ?? null);
    setLocalRejectionReason(submission.rejectionReason ?? null);
    setRejectReason(submission.rejectionReason ?? "");
  }, [
    submission.status,
    submission.verifiedAt,
    submission.rejectedAt,
    submission.rejectionReason,
  ]);

  // mask email for privacy in rider UI
  const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const first = local.slice(0, 1);
    return `${first}***@${domain}`;
  };

  const statusMeta = useMemo(() => {
    return {
      pending: {
        label: "Pending",
        className:
          "border-yellow-300 bg-yellow-200/40 text-yellow-900 dark:border-yellow-400/80 dark:bg-yellow-400/20 dark:text-yellow-100",
      },
      verified: {
        label: "Verified",
        className:
          "border-emerald-400 bg-emerald-400/20 text-emerald-800 dark:border-emerald-300 dark:bg-emerald-300/20 dark:text-emerald-100",
      },
      rejected: {
        label: "Rejected",
        className:
          "border-red-400 bg-red-400/20 text-red-800 dark:border-red-300 dark:bg-red-300/20 dark:text-red-100",
      },
    } as Record<SubmissionStatus, { label: string; className: string }>;
  }, []);

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return null;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString();
  };

  const renderStatusBadge = () => {
    if (localStatus === "pending") return null;
    return (
      <span
        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusMeta[localStatus].className}`}
      >
        {statusMeta[localStatus].label}
      </span>
    );
  };

  return (
    <div className="p-4 bg-white dark:bg-primary-teal rounded-lg shadow-sm border border-[var(--border-primary)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              {submission.buildingType}
            </h3>
            <span className="text-xs text-white/80">• {shortTs}</span>
          </div>

          <p className="mt-2 text-sm text-white/90">
            {submission.buildingColor} — {submission.closestLandmark}
          </p>

          <p className="mt-3 text-xs text-white/70">
            {maskEmail(submission.email)} •{" "}
            {submission.utilityBillProvided
              ? "Utility bill provided"
              : "No bill"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          {renderStatusBadge()}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setOpen(true)}
            className="rounded-md border border-white/60 bg-white/90 px-4 py-1 text-xs font-medium text-[var(--primary-teal)] shadow-sm transition hover:border-white hover:bg-white hover:text-[var(--primary-teal-dark)]"
          >
            View
          </Button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="flex h-[80vh] max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Submission Details
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Received {shortTs}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {renderStatusBadge()}
                <button
                  aria-label="Close details"
                  className="rounded-full p-2 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <DetailRow
                label="Building Type"
                value={submission.buildingType}
              />
              <DetailRow
                label="Building Color"
                value={submission.buildingColor}
              />
              <DetailRow
                label="Closest Landmark"
                value={submission.closestLandmark}
              />
              <DetailRow label="Email" value={submission.email} />
              <DetailRow
                label="Utility Bill"
                value={
                  submission.utilityBillProvided ? "Provided" : "Not provided"
                }
              />
              <DetailRow label="Submitted At" value={shortTs} />
              {submission.livesInEstate && (
                <div className="rounded-lg border-2 border-black/20 bg-white shadow-lg shadow-white/50 px-4 py-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 text-black mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-black mb-1">
                        Gated Estate Access Required
                      </h4>
                      <p className="text-xs text-black/90 mb-2">
                        This address is located in a gated estate. You'll need
                        to coordinate with estate security or reception before
                        visiting.
                      </p>
                      {submission.gatekeeperPhone ? (
                        <div className="mt-2 pt-2 border-t border-black/20">
                          <p className="text-xs font-medium text-black mb-1">
                            Contact Number:
                          </p>
                          <a
                            href={`tel:${submission.gatekeeperPhone}`}
                            className="text-sm font-semibold text-black hover:text-black/80 underline"
                          >
                            {submission.gatekeeperPhone}
                          </a>
                          <p className="text-xs text-black/80 mt-1">
                            Call this number before your visit to arrange access
                            with estate security or reception.
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-black/80 mt-1">
                          No contact number provided. You may need to contact
                          the resident directly or use the email address above
                          to coordinate access.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {localStatus !== "pending" && (
                <DetailRow
                  label="Status"
                  value={statusMeta[localStatus].label}
                />
              )}
              {localStatus === "verified" && (
                <DetailRow
                  label="Verified At"
                  value={formatDate(localVerifiedAt) ?? "—"}
                />
              )}
              {localStatus === "rejected" && (
                <>
                  <DetailRow
                    label="Rejected At"
                    value={formatDate(localRejectedAt) ?? "—"}
                  />
                  <DetailRow
                    label="Rejection Reason"
                    value={localRejectionReason || "—"}
                  />
                </>
              )}
            </div>
            <div className="space-y-3 border-t border-[var(--border-primary)] px-6 py-4">
              {verifyError && (
                <p className="rounded-md border border-[var(--error)] bg-[var(--error-light)] px-3 py-2 text-sm text-[var(--error)]">
                  {verifyError}
                </p>
              )}
              {verifySuccess && (
                <p className="rounded-md border border-[var(--success)] bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--success)]">
                  Verification notice sent to user.
                </p>
              )}
              {rejectError && (
                <p className="rounded-md border border-[var(--error)] bg-[var(--error-light)] px-3 py-2 text-sm text-[var(--error)]">
                  {rejectError}
                </p>
              )}
              {rejectSuccess && (
                <p className="rounded-md border border-orange-400/60 bg-orange-500/10 px-3 py-2 text-sm text-orange-300">
                  Rejection notice sent to user.
                </p>
              )}
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                  Rejection reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="e.g., submitted landmark does not match the location"
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/70 px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
                />
                <p className="text-xs text-[var(--text-secondary)]">
                  Provide context if you can’t verify this address. The user
                  sees this message.
                </p>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={async () => {
                    if (verifyLoading) return;
                    setVerifyError(null);
                    setVerifySuccess(false);
                    setRejectError(null);
                    setRejectSuccess(false);
                    setVerifyLoading(true);
                    try {
                      const res = await fetch("/api/rider-submissions", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: submission.id,
                          status: "verified",
                        }),
                      });
                      if (!res.ok) {
                        throw new Error("Failed to notify verification");
                      }
                      const updated = (await res.json()) as Submission;
                      setVerifySuccess(true);
                      setLocalStatus("verified");
                      setLocalVerifiedAt(
                        updated.verifiedAt ?? new Date().toISOString()
                      );
                      setLocalRejectedAt(null);
                      setLocalRejectionReason(null);
                      setRejectReason("");
                    } catch (err: any) {
                      setVerifyError(
                        err?.message ||
                          "Unable to notify verification. Please retry."
                      );
                    } finally {
                      setVerifyLoading(false);
                    }
                  }}
                  loading={verifyLoading}
                >
                  Mark as Verified
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (rejectLoading) return;
                    if (!rejectReason.trim()) {
                      setRejectError("Please enter a reason before rejecting.");
                      return;
                    }
                    setRejectError(null);
                    setRejectSuccess(false);
                    setVerifyError(null);
                    setVerifySuccess(false);
                    setRejectLoading(true);
                    try {
                      const res = await fetch("/api/rider-submissions", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: submission.id,
                          status: "rejected",
                          rejectionReason: rejectReason.trim(),
                        }),
                      });
                      if (!res.ok) {
                        throw new Error("Failed to notify rejection");
                      }
                      const updated = (await res.json()) as Submission;
                      setRejectSuccess(true);
                      setLocalStatus("rejected");
                      setLocalRejectedAt(
                        updated.rejectedAt ?? new Date().toISOString()
                      );
                      setLocalVerifiedAt(null);
                      const reasonValue =
                        updated.rejectionReason ?? rejectReason.trim();
                      setLocalRejectionReason(reasonValue);
                      setRejectReason(reasonValue);
                    } catch (err: any) {
                      setRejectError(
                        err?.message ||
                          "Unable to notify rejection. Please retry."
                      );
                    } finally {
                      setRejectLoading(false);
                    }
                  }}
                  loading={rejectLoading}
                  className="sm:order-first"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/70 px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </span>
      <span className="break-words text-sm font-semibold text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}
