import type { CouponMatch, FormResult, Meeting, TeamForm, Triple } from "./types";

export const SIGNS = ["1", "X", "2"] as const;

export const FORM_LENGTH = 5;

/** Weight of form and meetings against the market odds */
const MODEL_WEIGHT = 0.3;

const POINTS: Record<Exclude<FormResult, "">, number> = { V: 3, O: 1, F: 0 };

const NEXT_RESULT: Record<FormResult, FormResult> = { "": "V", V: "O", O: "F", F: "" };

export type Bucket = "under-strong" | "under" | "neutral" | "over" | "over-strong";

export type SignAnalysis = {
  probability: number;
  valueIndex: number;
  bucket: Bucket;
  playable: boolean;
};

export type MatchAnalysis = {
  form: Triple | null;
  meetings: Triple | null;
  combined: Triple;
  signs: [SignAnalysis, SignAnalysis, SignAnalysis];
};

export type Tally = {
  played: number;
  points: number;
  draws: number;
  rate: number;
};

export function emptyForm(): TeamForm {
  return { home: Array(FORM_LENGTH).fill(""), away: Array(FORM_LENGTH).fill("") };
}

export function nextResult(result: FormResult): FormResult {
  return NEXT_RESULT[result];
}

export function tally(results: FormResult[]): Tally {
  let played = 0;
  let points = 0;
  let draws = 0;
  for (const r of results) {
    if (!r) continue;
    played++;
    points += POINTS[r];
    if (r === "O") draws++;
  }
  return { played, points, draws, rate: played ? points / (played * 3) : 0 };
}

/** Needs at least three filled-in matches per team */
export function formModel(form: TeamForm): Triple | null {
  const h = tally(form.home);
  const a = tally(form.away);
  if (h.played < 3 || a.played < 3) return null;

  const draw = Math.min(0.38, Math.max(0.18, (0.5 * (h.draws + a.draws)) / (h.played + a.played) + 0.13));
  const homeShare = (h.rate + 0.2) / (h.rate + a.rate + 0.4);
  return [(1 - draw) * homeShare * 100, draw * 100, (1 - draw) * (1 - homeShare) * 100];
}

/** Needs at least two meetings with the same home team. Shrunk towards the odds. */
export function meetingsModel(meetings: Meeting[], odds: Triple): Triple | null {
  if (meetings.length < 2) return null;
  const counts: Triple = [0, 0, 0];
  for (const m of meetings) {
    counts[m.homeGoals > m.awayGoals ? 0 : m.homeGoals === m.awayGoals ? 1 : 2]++;
  }
  return counts.map((c, i) => ((c + (3 * odds[i]) / 100) / (meetings.length + 3)) * 100) as Triple;
}

function bucketFor(valueIndex: number): Bucket {
  if (valueIndex >= 1.2) return "under-strong";
  if (valueIndex >= 1.05) return "under";
  if (valueIndex > 0.95) return "neutral";
  if (valueIndex > 0.85) return "over";
  return "over-strong";
}

export function analyzeMatch(match: CouponMatch, form: TeamForm): MatchAnalysis {
  const fm = formModel(form);
  const mm = meetingsModel(match.meetings, match.odds);
  const model = fm && mm ? (fm.map((f, i) => 0.7 * f + 0.3 * mm[i]) as Triple) : (fm ?? mm);
  const combined = match.odds.map((p, i) =>
    model ? p * (1 - MODEL_WEIGHT) + model[i] * MODEL_WEIGHT : p,
  ) as Triple;

  const signs = combined.map((probability, i) => {
    const valueIndex = match.folk[i] ? probability / match.folk[i] : 0;
    return {
      probability,
      valueIndex,
      bucket: bucketFor(valueIndex),
      // Only flag value once the user has filled in form
      playable: !!fm && valueIndex >= 1.1 && probability >= 20,
    };
  }) as MatchAnalysis["signs"];

  return { form: fm, meetings: mm, combined, signs };
}
