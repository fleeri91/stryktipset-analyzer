"use client";

import { useState } from "react";
import { SIGNS, emptyForm, nextResult } from "@/lib/stryktips/model";
import type { Coupon, TeamForm } from "@/lib/stryktips/types";
import { MatchRow, ROW_GRID } from "./match-row";
import { useStoredForms } from "./use-stored-forms";
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

  return (
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
  );
}
