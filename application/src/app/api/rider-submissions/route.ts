// application/src/app/api/rider-submissions/route.ts
import type { NextRequest } from "next/server";
import {
  SUBMISSIONS,
  Submission,
  makeId,
  broadcast,
  updateSubmissionStatus,
} from "./shared";

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

    const saved: Submission = {
      id: makeId(),
      buildingType: String(body.buildingType),
      buildingColor: String(body.buildingColor),
      closestLandmark: String(body.closestLandmark),
      email: String(body.email),
      utilityBillProvided: Boolean(body.utilityBillProvided),
      submittedAt: new Date().toISOString(),
      status: "pending",
      verifiedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      livesInEstate: Boolean(body.livesInEstate),
      gatekeeperPhone: body.gatekeeperPhone
        ? String(body.gatekeeperPhone)
        : null,
    };

    // push to in-memory store (unshift to show newest first)
    SUBMISSIONS.unshift(saved);

    // Notify local WS server (mock broadcasting)
    await broadcast({ type: "NEW_SUBMISSION", payload: saved });

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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : null;
    const status = body.status;
    const reason =
      typeof body.rejectionReason === "string" ? body.rejectionReason : "";

    if (!id || !status) {
      return new Response(
        JSON.stringify({ error: "id and status are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result = updateSubmissionStatus({
      id,
      status,
      reason,
    });

    if ("error" in result) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    await broadcast({ type: result.eventType, payload: result.payload });

    return new Response(JSON.stringify(result.submission), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
