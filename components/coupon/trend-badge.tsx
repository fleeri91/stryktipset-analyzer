import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { badgeVariants } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatChange, formatDay, formatNumber, formatTime } from "@/lib/stryktips/format";
import type { TrendPoint } from "@/lib/stryktips/types";
import { cn } from "@/lib/utils";

type Verdict = "positive" | "negative" | "flat";

const VERDICT_STYLES: Record<Verdict, string> = {
  positive: "border-positive/40 bg-positive/12 text-positive",
  negative: "border-negative/40 bg-negative/12 text-negative",
  flat: "border-foreground/12 text-muted-foreground",
};

const VERDICT_LABELS: Record<Verdict, string> = {
  positive: "positivt",
  negative: "negativt",
  flat: "oförändrat",
};

type Signal = {
  label: string;
  /** Which way the shown number moved */
  direction: "up" | "down" | "flat";
  verdict: Verdict;
  value: string;
  detail: string;
};

/** Fair decimal odds from a probability in percent */
function fairOdds(probability: number) {
  return 100 / probability;
}

function since(points: TrendPoint[]) {
  return `${formatDay(points[0].at)} ${formatTime(points[0].at)}`;
}

/** Falling odds mean the market believes more in the sign, which is good */
export function oddsSignal(points: TrendPoint[]): Signal | null {
  if (points.length < 2) return null;
  const [from, to] = [fairOdds(points[0].value), fairOdds(points.at(-1)!.value)];
  const delta = Number((to - from).toFixed(2));
  const direction = delta < 0 ? "down" : delta > 0 ? "up" : "flat";
  return {
    label: "Odds",
    direction,
    verdict: direction === "down" ? "positive" : direction === "up" ? "negative" : "flat",
    value: formatChange(delta, 2),
    detail:
      `Oddset ${formatNumber(from, 2)} → ${formatNumber(to, 2)} sedan ${since(points)}. ` +
      "Sjunkande odds betyder att spelbolagen tror mer på tecknet.",
  };
}

/** A rising share of the public's picks backs the sign, falling shows doubt */
export function folkSignal(points: TrendPoint[]): Signal | null {
  if (points.length < 2) return null;
  const [from, to] = [points[0].value, points.at(-1)!.value];
  const delta = Math.round(to - from);
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return {
    label: "Spel",
    direction,
    verdict: direction === "up" ? "positive" : direction === "down" ? "negative" : "flat",
    value: formatChange(delta, 0),
    detail:
      `Spelprocent ${formatNumber(from, 0)} % → ${formatNumber(to, 0)} % sedan ${since(points)}. ` +
      "Sjunkande spelprocent betyder att färre spelare tror på tecknet.",
  };
}

const ICONS = { up: TrendingUp, down: TrendingDown, flat: Minus };

export function TrendBadge({ signal }: { signal: Signal }) {
  const Icon = ICONS[signal.direction];
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={cn(
              badgeVariants({ variant: "outline" }),
              "h-5.5 cursor-default gap-1 px-1.5 text-[11.5px] tabular-nums",
              VERDICT_STYLES[signal.verdict],
            )}
          />
        }
      >
        <Icon aria-hidden="true" />
        <span>{signal.label}</span>
        <span className="font-semibold">{signal.value}</span>
        <span className="sr-only">, {VERDICT_LABELS[signal.verdict]}</span>
      </TooltipTrigger>
      <TooltipContent className="block max-w-60 leading-snug">{signal.detail}</TooltipContent>
    </Tooltip>
  );
}
