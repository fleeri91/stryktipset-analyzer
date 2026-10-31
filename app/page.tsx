import { Suspense } from "react";
import { HydrationBoundary } from "@tanstack/react-query";
import { CouponTable } from "@/components/coupon/coupon-table";
import { Countdown } from "@/components/coupon/countdown";
import { dehydrate } from "@/lib/hydrate";
import { getCoupon } from "@/lib/stryktips/coupon";
import { couponCache } from "@/lib/stryktips/coupon-cache";
import { formatDay, formatTime } from "@/lib/stryktips/format";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-10 px-4 pt-7 pb-18 sm:px-10">
      <Suspense fallback={<p className="text-muted-foreground">Laddar kupongen…</p>}>
        <CouponPage />
      </Suspense>
    </div>
  );
}

async function CouponPage() {
  const coupon = await getCoupon();
  const state = await dehydrate([{ queryKey: couponCache.key, data: coupon }], { tags: [couponCache.tag] });

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-[17px] font-extrabold tracking-tight">Stryktipsanalys</span>
        <span className="text-sm text-muted-foreground">
          Uppdaterad {formatDay(coupon.updatedAt)} {formatTime(coupon.updatedAt)}
        </span>
      </header>

      <main className="flex flex-col gap-10">
        <section aria-labelledby="omg" className="flex flex-col gap-3">
          <h1 id="omg" className="text-[clamp(44px,6.4vw,80px)] leading-[0.95] font-extrabold tracking-[-0.02em]">
            Omgång {coupon.round}
          </h1>
          <p className="text-[19px] leading-[1.45] text-ink-2">
            Spelstopp {formatDay(coupon.closesAt)} {formatTime(coupon.closesAt)}
            <Countdown to={coupon.closesAt} />.
          </p>
        </section>

        <section aria-labelledby="kup" className="flex flex-col gap-4">
          <h2 id="kup" className="text-2xl font-bold tracking-tight">
            Kupongen
          </h2>
          <HydrationBoundary state={state}>
            <CouponTable />
          </HydrationBoundary>
        </section>
      </main>
    </>
  );
}
