import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { couponCache } from "./coupon-cache";
import { getMeetings } from "./meetings";
import { getOpenDraw } from "./svenska-spel";
import type { Coupon } from "./types";

/** The open round with meetings from the dataset, or null between rounds */
export async function getCoupon(): Promise<Coupon | null> {
  "use cache";
  // Odds and the public's picks move until the round closes
  cacheLife("minutes");
  cacheTag(couponCache.tag);

  const draw = await getOpenDraw();
  if (!draw) return null;

  const meetings = await getMeetings(draw.matches);
  return {
    ...draw,
    matches: draw.matches.map((match, i) => ({ ...match, meetings: meetings[i] })),
  };
}
