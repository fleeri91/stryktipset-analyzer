import { queryOptions } from "@tanstack/react-query";
import type { Coupon } from "./types";

/** How often the coupon is refreshed from Svenska Spel */
export const COUPON_REFRESH_SECONDS = 10 * 60;

/** Shared contract between the server cache (tag) and TanStack Query (key) */
export const couponCache = {
  key: ["coupon"] as const,
  tag: "coupon",
  options: () =>
    queryOptions({
      queryKey: couponCache.key,
      queryFn: async (): Promise<Coupon | null> => {
        const res = await fetch("/api/coupon");
        if (!res.ok) throw new Error("Failed to fetch coupon");
        return res.json();
      },
      // Poll while the page is open; the server cache refreshes on the same interval
      staleTime: COUPON_REFRESH_SECONDS * 1000,
      refetchInterval: COUPON_REFRESH_SECONDS * 1000,
    }),
};
