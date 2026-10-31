"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { couponCache } from "@/lib/stryktips/coupon-cache";
import { formatDay, formatTime } from "@/lib/stryktips/format";
import { CouponTable } from "./coupon-table";
import { Countdown } from "./countdown";

export function CouponPage() {
  const { data: coupon } = useSuspenseQuery(couponCache.options());

  if (!coupon) {
    return (
      <main className="flex flex-col gap-3">
        <span className="text-[17px] font-extrabold tracking-tight">Stryktipsanalys</span>
        <p className="text-[19px] text-ink-2">Ingen omgång är öppen just nu.</p>
      </main>
    );
  }

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
          {/* A new round starts with a fresh form and no open match */}
          <CouponTable key={coupon.round} coupon={coupon} />
        </section>
      </main>
    </>
  );
}
