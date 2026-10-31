"use client";

import { useSyncExternalStore } from "react";
import { formatTimeLeft } from "@/lib/stryktips/format";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 15_000);
  return () => clearInterval(id);
}

/** Current minute; null on the server so prerendering never reads the clock */
function useMinute() {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 60_000),
    () => null,
  );
}

export function Countdown({ to }: { to: string }) {
  const minute = useMinute();
  if (minute === null) return null;
  return <>, {formatTimeLeft(new Date(to).getTime() - minute * 60_000)}</>;
}
