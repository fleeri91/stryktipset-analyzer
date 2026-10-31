"use client";

import { useState } from "react";
import { COUPON_REFRESH_SECONDS } from "@/lib/stryktips/coupon-cache";
import { formatDay, formatTime } from "@/lib/stryktips/format";
import { SIGNS, emptyForm, nextResult } from "@/lib/stryktips/model";
import type { Coupon, TeamForm } from "@/lib/stryktips/types";
import { MatchRow, ROW_GRID } from "./match-row";
import { useStoredForms } from "./use-stored-forms";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function CouponTable({ coupon }: { coupon: Coupon }) {
  const [openMatch, setOpenMatch] = useState<number | null>(coupon.matches[0]?.n ?? null);
  const [forms, updateForms] = useStoredForms(coupon.round);

  function cycleResult(n: number, side: keyof TeamForm, index: number) {
    updateForms((prev) => {
      const form = prev[n] ?? emptyForm();
      const results = form[side].with(index, nextResult(form[side][index]));
      return { ...prev, [n]: { ...form, [side]: results } };
    });
  }

  function clearForm(n: number) {
    updateForms((prev) => {
      const next = { ...prev };
      delete next[n];
      return next;
    });
  }

  const trendStart = earliestReading(coupon);

  return (
    <TooltipProvider delay={200}>
      <div className="flex flex-col gap-3">
        {trendStart && (
          <div className="flex flex-col gap-1.5 text-[13px] text-muted-foreground">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-[#a3aebc]" />
                Spelprocent
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="w-4 border-t-[1.5px] border-dashed border-foreground/85" />
                Oddsens sannolikhet (stiger när oddset sjunker)
              </span>
              <span>
                Sedan {formatDay(trendStart)} {formatTime(trendStart)}, mätt var {COUPON_REFRESH_SECONDS / 60}:e minut.
              </span>
            </p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2 rounded-full bg-positive" />
                Positivt: oddset sjunker eller spelprocenten stiger
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2 rounded-full bg-negative" />
                Negativt: oddset stiger eller spelprocenten sjunker
              </span>
            </p>
          </div>
        )}
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex min-w-[780px] flex-col gap-2">
            <div aria-hidden="true" className={cn(ROW_GRID, "items-end pb-1.5")}>
              <span />
              <span />
              {SIGNS.map((sign) => (
                <span key={sign} className="pl-3.5 text-[30px] leading-none font-extrabold">
                  {sign}
                </span>
              ))}
            </div>

            {coupon.matches.map((match) => (
              <MatchRow
                key={match.n}
                match={match}
                form={forms[match.n] ?? emptyForm()}
                open={openMatch === match.n}
                onOpenChange={(open) => setOpenMatch(open ? match.n : null)}
                onCycleResult={(side, index) => cycleResult(match.n, side, index)}
                onClearForm={() => clearForm(match.n)}
              />
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

/** When the trend lines start: the first point across every match and sign */
function earliestReading(coupon: Coupon) {
  const times = coupon.matches.flatMap((m) => m.trend.flatMap((t) => [...t.folk, ...t.odds].map((p) => p.at)));
  return times.length ? times.reduce((a, b) => (Date.parse(a) < Date.parse(b) ? a : b)) : null;
}
