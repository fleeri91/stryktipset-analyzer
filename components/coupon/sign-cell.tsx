import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/stryktips/format";
import { SIGNS, type Bucket, type SignAnalysis } from "@/lib/stryktips/model";
import type { Trend, TrendPoint } from "@/lib/stryktips/types";
import { cn } from "@/lib/utils";
import { TrendBadge, folkSignal, oddsSignal } from "./trend-badge";

const BUCKET_STYLES: Record<Bucket, { cell: string; fill: string; text: string; line: string; label: string }> = {
  "under-strong": {
    cell: "bg-amber/20",
    fill: "bg-amber",
    text: "text-amber-ink",
    line: "stroke-amber",
    label: "tydligt understreckat",
  },
  under: {
    cell: "bg-amber/8",
    fill: "bg-amber/70",
    text: "text-[#f2c77a]",
    line: "stroke-[#f2c77a]",
    label: "något understreckat",
  },
  neutral: {
    cell: "bg-[#1a222d]",
    fill: "bg-[#8e9aaa]",
    text: "text-ink-2",
    line: "stroke-[#a3aebc]",
    label: "rimligt streckat",
  },
  over: {
    cell: "bg-chalk/11",
    fill: "bg-chalk/70",
    text: "text-[#a9c6ee]",
    line: "stroke-[#a9c6ee]",
    label: "något överstreckat",
  },
  "over-strong": {
    cell: "bg-chalk/24",
    fill: "bg-chalk",
    text: "text-[#b4cff3]",
    line: "stroke-[#b4cff3]",
    label: "kraftigt överstreckat",
  },
};

type SignCellProps = {
  index: number;
  sign: SignAnalysis;
  folk: number;
  trend: Trend;
};

const CHART_W = 120;
const CHART_H = 32;

type Scale = { x: (at: string) => number; y: (value: number) => number };

/** Shared time and value scales so both lines can be compared, higher share drawn higher */
function trendScale(trend: Trend): Scale {
  const points = [...trend.odds, ...trend.folk];
  const times = points.map((p) => Date.parse(p.at));
  const values = points.map((p) => p.value);
  const [t0, t1] = [Math.min(...times), Math.max(...times)];
  const [v0, v1] = [Math.min(...values) - 3, Math.max(...values) + 3];
  return {
    x: (at) => (t1 > t0 ? ((Date.parse(at) - t0) / (t1 - t0)) * CHART_W : CHART_W),
    y: (value) => CHART_H - ((value - v0) / (v1 - v0)) * CHART_H,
  };
}

function line(points: TrendPoint[], scale: Scale) {
  return points.map((p) => `${scale.x(p.at).toFixed(1)},${scale.y(p.value).toFixed(1)}`).join(" ");
}

/** A round dot on the latest reading, drawn in HTML since the stretched SVG would make it oval */
function EndDot({ points, scale, className }: { points: TrendPoint[]; scale: Scale; className: string }) {
  const last = points.at(-1);
  if (!last) return null;
  return (
    <span
      className={cn("absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full", className)}
      style={{
        left: `${(scale.x(last.at) / CHART_W) * 100}%`,
        top: `${(scale.y(last.value) / CHART_H) * 100}%`,
      }}
    />
  );
}

export function SignCell({ index, sign, folk, trend }: SignCellProps) {
  const style = BUCKET_STYLES[sign.bucket];
  const scale = trendScale(trend);
  const odds = oddsSignal(trend.odds);
  const spel = folkSignal(trend.folk);

  return (
    <div className={cn("flex flex-col gap-2.25 rounded-lg border border-foreground/6 px-3.5 pt-3 pb-2.75", style.cell)}>
      <span className="sr-only">
        Tecken {SIGNS[index]}, {style.label}.
      </span>

      <div className="flex min-h-6 items-center justify-between gap-2">
        <div className="flex items-baseline gap-0.5">
          <span className="sr-only">Folket streckar</span>
          <span className="text-2xl leading-none font-bold tracking-tight">{folk}</span>
          <span className="ml-0.5 text-sm font-medium text-ink-2">%</span>
        </div>
        {sign.playable && (
          <Badge variant="outline" className="h-5.5 border-amber px-2 font-semibold text-amber-ink">
            Spelbar
          </Badge>
        )}
      </div>

      <div aria-hidden="true" className="relative h-1.5 rounded-full bg-foreground/10">
        <span className={cn("absolute inset-y-0 left-0 rounded-full", style.fill)} style={{ width: `${folk}%` }} />
        <span
          className="absolute -top-1 -ml-px h-3.5 w-0.5 rounded-[1px] bg-foreground"
          style={{ left: `${sign.probability.toFixed(1)}%` }}
        />
      </div>

      <div aria-hidden="true" className="relative h-7.5">
        <svg
          className="absolute inset-0 size-full overflow-visible"
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="none"
        >
          <polyline
            points={line(trend.folk, scale)}
            vectorEffect="non-scaling-stroke"
            className={cn("fill-none stroke-2 [stroke-linecap:round] [stroke-linejoin:round]", style.line)}
          />
          <polyline
            points={line(trend.odds, scale)}
            vectorEffect="non-scaling-stroke"
            strokeDasharray="3 3"
            className="fill-none stroke-foreground stroke-[1.25] opacity-85 [stroke-linecap:round] [stroke-linejoin:round]"
          />
        </svg>
        <EndDot points={trend.folk} scale={scale} className={style.fill} />
        <EndDot points={trend.odds} scale={scale} className="bg-foreground" />
      </div>

      {(odds || spel) && (
        <div className="flex flex-wrap items-center gap-1">
          {odds && <TrendBadge signal={odds} />}
          {spel && <TrendBadge signal={spel} />}
        </div>
      )}

      <div className="flex items-baseline justify-between gap-2 text-[12.5px] text-muted-foreground">
        <span>Sannolikhet {formatNumber(sign.probability, 0)} %</span>
        <span className={cn("text-[13.5px] font-semibold", style.text)}>
          <span className="sr-only">Värdeindex </span>
          {formatNumber(sign.valueIndex, 2)}
        </span>
      </div>
    </div>
  );
}
