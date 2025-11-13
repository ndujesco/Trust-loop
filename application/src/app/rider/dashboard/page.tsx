"use client";

import React, { useEffect, useRef, useState } from "react";
import SubmissionCard from "@/components/SubmissionCard";
import ConnectionIndicator from "@/components/ConnectionIndicator";

type SubmissionStatus = "pending" | "verified" | "rejected";

type Submission = {
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

const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ||
  "ws://trustloop-websocket-0q27xj-c90237-178-128-8-109.traefik.me") as string; 

export default function RiderDashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number>(0);

  // Fetch initial list
  useEffect(() => {
    let mounted = true;
    fetch("/api/rider-submissions")
      .then((r) => r.json())
      .then((data: Submission[]) => {
        if (mounted && Array.isArray(data)) setSubmissions(data);
      })
      .catch(() => {
        // ignore for now
      });
    return () => {
      mounted = false;
    };
  }, []);

  // WebSocket connect + simple reconnect/backoff
  useEffect(() => {
    let shouldStop = false;
    let backoff = 1000;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        backoff = 1000; // reset backoff
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg?.type === "NEW_SUBMISSION") {
            const payload = msg.payload as Submission;
            setSubmissions((prev) => [payload, ...prev]);
            return;
          }

          if (msg?.type === "SUBMISSION_VERIFIED") {
            const payload = msg.payload as {
              id: string;
              verifiedAt?: string;
            };
            if (payload?.id) {
              setSubmissions((prev) =>
                prev.map((item) =>
                  item.id === payload.id
                    ? {
                        ...item,
                        status: "verified",
                        verifiedAt: payload.verifiedAt ?? new Date().toISOString(),
                        rejectedAt: null,
                        rejectionReason: null,
                      }
                    : item
                )
              );
            }
            return;
          }

          if (msg?.type === "SUBMISSION_REJECTED") {
            const payload = msg.payload as {
              id: string;
              rejectedAt?: string;
              reason?: string;
            };
            if (payload?.id) {
              setSubmissions((prev) =>
                prev.map((item) =>
                  item.id === payload.id
                    ? {
                        ...item,
                        status: "rejected",
                        rejectedAt: payload.rejectedAt ?? new Date().toISOString(),
                        rejectionReason: payload.reason ?? item.rejectionReason,
                        verifiedAt: null,
                      }
                    : item
                )
              );
            }
            return;
          }

          if (msg?.type === "WS_CONNECTED") {
            // ignore
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!shouldStop) {
          // reconnect with exponential backoff capped at 10s
          reconnectRef.current = window.setTimeout(connect, backoff);
          backoff = Math.min(backoff * 1.8, 10000);
        }
      };

      ws.onerror = () => {
        // error handled by onclose eventually
      };
    };

    connect();

    return () => {
      shouldStop = true;
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          Rider Dashboard
        </h2>
        <div className="flex items-center gap-3">
          <ConnectionIndicator connected={connected} />
        </div>
      </div>

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="p-6 bg-[var(--bg-secondary)] rounded-lg text-[var(--text-tertiary)]">
            No submissions yet.
          </div>
        ) : (
          submissions.map((s) => <SubmissionCard key={s.id} submission={s} />)
        )}
      </div>
    </div>
  );
}
