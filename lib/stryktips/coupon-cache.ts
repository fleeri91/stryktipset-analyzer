import { queryOptions } from "@tanstack/react-query";
import type { Coupon } from "./types";

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
    }),
};
