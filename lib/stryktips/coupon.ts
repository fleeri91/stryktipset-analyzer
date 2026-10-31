import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { COUPON_REFRESH_SECONDS, couponCache } from "./coupon-cache";
import { getMeetings } from "./meetings";
import { getOpenDraw } from "./svenska-spel";
import { readSnapshots, type Snapshot } from "./trend-store";
import type { Coupon, Trend, TrendPoint } from "./types";

/** Oldest first, one point per timestamp */
function series(points: TrendPoint[]) {
  const byTime = new Map(points.map((p) => [p.at, p]));
  return [...byTime.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/**
 * Combines the API's reference points with the stored 10-minute readings. Once readings exist,
 * reference points from before the first reading (opening odds, the public's reference time)
 * are dropped, so both lines share the window the readings cover instead of being squeezed
 * against the right edge of a days-long axis.
 */
function withSnapshots(trend: Trend, snapshots: Snapshot[], n: number, sign: number): Trend {
  const readings = snapshots.flatMap((s) => s.matches.filter((m) => m.n === n).map((m) => ({ at: s.at, m })));
  if (readings.length === 0) return trend;

  const from = Date.parse(readings[0].at);
  const inWindow = (points: TrendPoint[]) => points.filter((p) => Date.parse(p.at) >= from);
  return {
    odds: series([...inWindow(trend.odds), ...readings.map(({ at, m }) => ({ at, value: m.odds[sign] }))]),
    folk: series([...inWindow(trend.folk), ...readings.map(({ at, m }) => ({ at, value: m.folk[sign] }))]),
  };
}

/** The open round with meetings from the dataset and stored trend readings, or null between rounds */
export async function getCoupon(): Promise<Coupon | null> {
  "use cache";
  // Odds and the public's picks move until the round closes; refresh every 10 minutes
  cacheLife({ stale: 5 * 60, revalidate: COUPON_REFRESH_SECONDS, expire: 60 * 60 });
  cacheTag(couponCache.tag);

  const draw = await getOpenDraw();
  if (!draw) return null;

  const [meetings, snapshots] = await Promise.all([getMeetings(draw.matches), readSnapshots(draw.round)]);
  return {
    ...draw,
    matches: draw.matches.map((match, i) => ({
      ...match,
      meetings: meetings[i],
      trend: match.trend.map((t, sign) => withSnapshots(t, snapshots, match.n, sign)) as typeof match.trend,
    })),
  };
}
