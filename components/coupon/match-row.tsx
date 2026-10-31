"use client";

import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatTime } from "@/lib/stryktips/format";
import { analyzeMatch, formModel } from "@/lib/stryktips/model";
import type { CouponMatch, TeamForm } from "@/lib/stryktips/types";
import { cn } from "@/lib/utils";
import { MatchDetails } from "./match-details";
import { SignCell } from "./sign-cell";

export const ROW_GRID = "grid grid-cols-[40px_minmax(200px,1.2fr)_repeat(3,minmax(0,1fr))] gap-2";

type MatchRowProps = {
  match: CouponMatch;
  form: TeamForm;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCycleResult: (side: keyof TeamForm, index: number) => void;
  onClearForm: () => void;
};

export function MatchRow({ match, form, open, onOpenChange, onCycleResult, onClearForm }: MatchRowProps) {
  const analysis = analyzeMatch(match, form);
  const formFilled = formModel(form) !== null;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="flex flex-col gap-2">
      <div className={cn(ROW_GRID, "items-stretch")}>
        <span className="pt-3 text-xl font-extrabold text-muted-foreground">{match.n}</span>

        <CollapsibleTrigger
          className={cn(
            "group flex min-h-11 w-full cursor-pointer items-start justify-between gap-2.5 border-b py-2.5 pr-3 text-left",
            "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-ink",
            "data-panel-open:border-transparent",
          )}
        >
          <span className="flex flex-col gap-1.5">
            <span className="flex flex-col gap-px text-base leading-tight font-semibold group-hover:text-amber-ink">
              <span>{match.home}</span>
              <span>{match.away}</span>
            </span>
            <span className="text-[13px] text-muted-foreground">
              {formatTime(match.kickoff)}
              {formFilled && ", form ifylld"}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-transform group-data-panel-open:rotate-180"
          />
        </CollapsibleTrigger>

        {analysis.signs.map((sign, i) => (
          <SignCell key={i} index={i} sign={sign} folk={match.folk[i]} trend={match.trend[i]} />
        ))}
      </div>

      <CollapsibleContent>
        <MatchDetails
          match={match}
          form={form}
          analysis={analysis}
          onCycleResult={onCycleResult}
          onClearForm={onClearForm}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
