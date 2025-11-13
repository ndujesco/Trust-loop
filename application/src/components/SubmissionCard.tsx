// application/src/components/SubmissionCard.tsx
"use client";

import React from "react";

type Submission = {
  id: string;
  buildingType: string;
  buildingColor: string;
  closestLandmark: string;
  email: string;
  utilityBillProvided: boolean;
  submittedAt: string;
};

export default function SubmissionCard({
  submission,
}: {
  submission: Submission;
}) {
  const dt = new Date(submission.submittedAt);
  const shortTs = dt.toLocaleString();

  // mask email for privacy in rider UI
  const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const first = local.slice(0, 1);
    return `${first}***@${domain}`;
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-[var(--border-primary)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {submission.buildingType}
            </h3>
            <span className="text-xs text-[var(--text-tertiary)]">
              • {shortTs}
            </span>
          </div>

          <p className="text-sm text-[var(--text-secondary)] mt-2">
            {submission.buildingColor} — {submission.closestLandmark}
          </p>

          <p className="text-xs text-[var(--text-tertiary)] mt-3">
            {maskEmail(submission.email)} •{" "}
            {submission.utilityBillProvided
              ? "Utility bill provided"
              : "No bill"}
          </p>
        </div>

        <div className="text-right">
          <button
            type="button"
            className="inline-block px-3 py-1 rounded-md border border-[var(--border-primary)] text-sm text-[var(--text-primary)]"
            onClick={() => {
              // open details view - placeholder
              alert(JSON.stringify(submission, null, 2));
            }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}
