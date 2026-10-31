import { Suspense } from "react";
import { HydrationBoundary } from "@tanstack/react-query";
import { CouponPage } from "@/components/coupon/coupon-page";
import { dehydrate } from "@/lib/hydrate";
import { getCoupon } from "@/lib/stryktips/coupon";
import { couponCache } from "@/lib/stryktips/coupon-cache";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 px-4 pt-7 pb-18 sm:px-10">
      <Suspense fallback={<p className="text-muted-foreground">Laddar kupongen…</p>}>
        <CouponData />
      </Suspense>
    </div>
  );
}

async function CouponData() {
  const coupon = await getCoupon();
  const state = await dehydrate([{ queryKey: couponCache.key, data: coupon }], { tags: [couponCache.tag] });

  return (
    <HydrationBoundary state={state}>
      <CouponPage />
    </HydrationBoundary>
  );
}
