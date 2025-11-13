export type SubmissionStatus = "pending" | "verified" | "rejected";

export type Submission = {
  id: string;
  buildingType: string;
  buildingColor: string;
  closestLandmark: string;
  email: string;
  utilityBillProvided: boolean;
  submittedAt: string;
  status: SubmissionStatus;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  livesInEstate?: boolean;
  gatekeeperPhone?: string | null;
};

export type UpdateResult =
  | {
      submission: Submission;
      eventType: "SUBMISSION_VERIFIED" | "SUBMISSION_REJECTED";
      payload: Record<string, unknown>;
    }
  | {
      error: string;
      status: number;
    };

export const SUBMISSIONS: Submission[] = []; // in-memory mock store (dev only)

/**
 * Helper: simple id generator (no external deps)
 */
export const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const WS_HTTP_URL =
  process.env.WS_HTTP_URL ||
  process.env.NEXT_PUBLIC_WS_HTTP_URL ||
  "https://ws.alfredemmanuel.com";

const BROADCAST_ENDPOINT = WS_HTTP_URL.endsWith("/broadcast")
  ? WS_HTTP_URL
  : `${WS_HTTP_URL.replace(/\/$/, "")}/broadcast`;

export async function broadcast(message: Record<string, unknown>) {
  try {
    await fetch(BROADCAST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
  } catch (notifyErr) {
    console.error("Failed to notify WS server:", notifyErr);
  }
}

export function updateSubmissionStatus({
  id,
  status,
  reason,
}: {
  id: string;
  status: SubmissionStatus;
  reason?: string;
}): UpdateResult {
  if (!["verified", "rejected"].includes(status)) {
    return { error: "Unsupported status", status: 400 };
  }

  const index = SUBMISSIONS.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return { error: "Submission not found", status: 404 };
  }

  const now = new Date().toISOString();
  const next: Submission = { ...SUBMISSIONS[index] };

  if (status === "verified") {
    next.status = "verified";
    next.verifiedAt = now;
    next.rejectedAt = null;
    next.rejectionReason = null;
  } else {
    const trimmed = (reason || "").trim();
    if (!trimmed) {
      return { error: "rejectionReason is required", status: 400 };
    }
    next.status = "rejected";
    next.rejectedAt = now;
    next.verifiedAt = null;
    next.rejectionReason = trimmed;
  }

  SUBMISSIONS[index] = next;

  const eventType =
    next.status === "verified" ? "SUBMISSION_VERIFIED" : "SUBMISSION_REJECTED";
  const payload: Record<string, unknown> = {
    id: next.id,
    status: next.status,
  };

  if (next.status === "verified") {
    payload.verifiedAt = next.verifiedAt;
  } else {
    payload.rejectedAt = next.rejectedAt;
    payload.reason = next.rejectionReason;
  }

  return {
    submission: next,
    eventType,
    payload,
  };
}
