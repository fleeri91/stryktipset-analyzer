import { COUPON_REFRESH_SECONDS } from "./coupon-cache";
import { getOpenDraw } from "./svenska-spel";
import { appendSnapshot } from "./trend-store";
import type { Triple } from "./types";

const round1 = (t: Triple) => t.map((v) => Math.round(v * 10) / 10) as Triple;

/** Stores the open round's current odds and the public's picks */
export async function collectTrend() {
  const draw = await getOpenDraw();
  if (!draw) return;

  await appendSnapshot(
    draw.round,
    {
      at: new Date().toISOString(),
      matches: draw.matches.map((m) => ({ n: m.n, odds: round1(m.odds), folk: m.folk })),
    },
    (COUPON_REFRESH_SECONDS * 1000) / 2,
  );
}

async function collectSafely() {
  try {
    await collectTrend();
  } catch (error) {
    console.error("[trend] Failed to collect:", error instanceof Error ? error.message : error);
  }
}

// Survives module reloads in development, so only one interval ever runs
const globalForTrend = globalThis as typeof globalThis & { trendCollector?: NodeJS.Timeout };

export function startTrendCollector() {
  if (globalForTrend.trendCollector) return;
  void collectSafely();
  globalForTrend.trendCollector = setInterval(collectSafely, COUPON_REFRESH_SECONDS * 1000);
}
