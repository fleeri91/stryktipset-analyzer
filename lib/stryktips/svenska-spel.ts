import "server-only";

import type { Coupon, CouponMatch, Trend, Triple } from "./types";

const API_URL = "https://api.www.svenskaspel.se/external/1/draw/stryktipset/draws";

/** Svenska Spel sends numbers as Swedish strings: "2,16", "69" */
type Outcomes = { home: string; draw: string; away: string };

type ApiEvent = {
  eventNumber: number;
  cancelled: boolean;
  participants: { type: "home" | "away"; name: string }[];
  sportEventStart: string;
  odds: Outcomes | null;
  startOdds: Outcomes | null;
  distribution:
    | (Outcomes & { date: string; refDate: string; refHome: string; refDraw: string; refAway: string })
    | null;
};

type ApiDraw = {
  drawNumber: number;
  drawState: string;
  openTime: string;
  closeTime: string;
  events: ApiEvent[];
};

type ApiResponse = {
  draws: ApiDraw[] | null;
  error: { code?: number; message?: string } | null;
};

export type OpenDraw = Omit<Coupon, "matches"> & { matches: Omit<CouponMatch, "meetings">[] };

function parse(value: string) {
  return Number(value.replace(",", "."));
}

function triple(o: Outcomes): Triple {
  return [parse(o.home), parse(o.draw), parse(o.away)];
}

/** Implied probability in percent, with the bookmaker margin removed */
function oddsToProbability(odds: Outcomes): Triple {
  const implied = triple(odds).map((o) => 1 / o);
  const total = implied.reduce((a, b) => a + b, 0);
  return implied.map((p) => (p / total) * 100) as Triple;
}

/** Trend from opening to now; stored readings are added between by the caller */
function toMatch(event: ApiEvent, openTime: string, fetchedAt: string): Omit<CouponMatch, "meetings"> {
  const team = (type: "home" | "away") => event.participants.find((p) => p.type === type)?.name ?? "";
  const odds = event.odds ? oddsToProbability(event.odds) : ([0, 0, 0] as Triple);
  const startOdds = event.startOdds ? oddsToProbability(event.startOdds) : odds;
  const d = event.distribution;
  const folk: Triple = d ? triple(d) : [0, 0, 0];
  const folkRef: Triple = d ? [parse(d.refHome), parse(d.refDraw), parse(d.refAway)] : folk;

  return {
    n: event.eventNumber,
    home: team("home"),
    away: team("away"),
    kickoff: event.sportEventStart,
    odds,
    folk,
    trend: [0, 1, 2].map((i) => ({
      odds: [
        { at: openTime, value: startOdds[i] },
        { at: fetchedAt, value: odds[i] },
      ],
      folk: d
        ? [
            { at: d.refDate, value: folkRef[i] },
            { at: d.date, value: folk[i] },
          ]
        : [],
    })) as [Trend, Trend, Trend],
  };
}

/** The currently open Stryktipset round, or null between rounds */
export async function getOpenDraw(): Promise<OpenDraw | null> {
  const key = process.env.STRYKTIPSET_API_KEY;
  if (!key) throw new Error("STRYKTIPSET_API_KEY is not set");

  const fetchedAt = new Date().toISOString();
  const res = await fetch(`${API_URL}?accesskey=${encodeURIComponent(key)}`);
  // Never include the URL in errors, it carries the access key
  if (!res.ok) throw new Error(`Svenska Spel API responded ${res.status}`);

  const body = (await res.json()) as ApiResponse;
  if (body.error) throw new Error(`Svenska Spel API error: ${body.error.message ?? body.error.code}`);

  const draw = body.draws?.find((d) => d.drawState === "Open");
  if (!draw) return null;

  const updatedAt = draw.events
    .map((e) => e.distribution?.date)
    .filter((date): date is string => !!date)
    .sort()
    .at(-1);

  return {
    round: draw.drawNumber,
    closesAt: draw.closeTime,
    updatedAt: updatedAt ?? draw.closeTime,
    matches: draw.events.filter((e) => !e.cancelled).map((e) => toMatch(e, draw.openTime, fetchedAt)),
  };
}
