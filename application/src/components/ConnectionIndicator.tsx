"use client";

export default function ConnectionIndicator({
  connected,
}: {
  connected: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block h-3 w-3 rounded-full ${
          connected ? "bg-emerald-500" : "bg-amber-400"
        }`}
      />
      <span className="text-sm text-[var(--text-tertiary)]">
        {connected ? "Connected" : "Reconnecting"}
      </span>
    </div>
  );
}
