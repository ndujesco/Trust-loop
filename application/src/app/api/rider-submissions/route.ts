// application/src/app/api/rider-submissions/route.ts
import type { NextRequest } from "next/server";

type Submission = {
  id: string;
  buildingType: string;
  buildingColor: string;
  closestLandmark: string;
  email: string;
  utilityBillProvided: boolean;
  submittedAt: string;
};

let SUBMISSIONS: Submission[] = []; // in-memory mock store (dev only)

/**
 * Helper: simple id generator (no external deps)
 */
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * GET: returns current submissions (dev mock)
 * POST: validate payload, push to SUBMISSIONS, and notify the local WS server
 *
 * Note: In serverless/production, module-level state won't persist across invocations.
 * Replace with a persistent DB for production.
 */
export async function GET() {
  return new Response(JSON.stringify(SUBMISSIONS), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Basic validation
    const required = [
      "buildingType",
      "buildingColor",
      "closestLandmark",
      "email",
    ];
    for (const key of required) {
      if (!body[key]) {
        return new Response(JSON.stringify({ error: `${key} is required` }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const saved = {
      id: makeId(),
      buildingType: String(body.buildingType),
      buildingColor: String(body.buildingColor),
      closestLandmark: String(body.closestLandmark),
      email: String(body.email),
      utilityBillProvided: Boolean(body.utilityBillProvided),
      submittedAt: new Date().toISOString(),
    } as Submission;

    // push to in-memory store (unshift to show newest first)
    SUBMISSIONS.unshift(saved);

    // Notify local WS server (mock broadcasting)
    try {
      // WS server default port 4001; adjust if you changed it
      await fetch("http://localhost:4001/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "NEW_SUBMISSION", payload: saved }),
      });
    } catch (notifyErr) {
      // Log the error server-side; do not fail the request on notification failure
      // In production, ensure resilient pub/sub
      // eslint-disable-next-line no-console
      console.error("Failed to notify WS server:", notifyErr);
    }

    return new Response(JSON.stringify(saved), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
