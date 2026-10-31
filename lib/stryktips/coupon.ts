import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { couponCache } from "./coupon-cache";
import { DEMO_COUPON } from "./demo-coupon";
import { getMeetings } from "./meetings";
import type { Coupon } from "./types";

export async function getCoupon(): Promise<Coupon> {
  "use cache";
  cacheLife("hours");
  cacheTag(couponCache.tag);

  const meetings = await getMeetings(DEMO_COUPON.matches);
  return {
    ...DEMO_COUPON,
    matches: DEMO_COUPON.matches.map((match, i) => ({ ...match, meetings: meetings[i] })),
  };
}
