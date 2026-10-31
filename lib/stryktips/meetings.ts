import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Meeting } from "./types";

type RawScore = [number, number] | { ft?: [number, number] } | null | undefined;

type SeasonFile = {
  name: string;
  matches: { date: string; time?: string; team1: string; team2: string; score?: RawScore }[];
};

type Result = {
  date: string;
  team1: string;
  team2: string;
  /** Full-time goals, which is what Stryktipset settles on */
  goals: [number, number];
};

type Fixture = { home: string; away: string };

const DATA_DIR = path.join(process.cwd(), "data");

/** The dataset stores scores either as `[h, a]` or `{ ft: [h, a] }` */
function fullTime(score: RawScore): [number, number] | null {
  if (Array.isArray(score)) return score;
  return score?.ft ?? null;
}

/** All finished matches from every league in the latest season, e.g. `data/25-26/*.json`, oldest first */
async function loadLatestSeason(): Promise<Result[]> {
  const seasons = (await readdir(DATA_DIR)).sort();
  const dir = path.join(DATA_DIR, seasons[seasons.length - 1]);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  const leagues = await Promise.all(
    files.map(async (f) => JSON.parse(await readFile(path.join(dir, f), "utf8")) as SeasonFile),
  );

  return leagues
    .flatMap((league) => league.matches)
    .sort((a, b) => `${a.date} ${a.time ?? ""}`.localeCompare(`${b.date} ${b.time ?? ""}`))
    .flatMap((m) => {
      const goals = fullTime(m.score);
      return goals ? [{ date: m.date, team1: m.team1, team2: m.team2, goals }] : [];
    });
}

function normalize(name: string) {
  return name.replace(/\b(A?FC)\b/g, "").trim().toLowerCase();
}

/** Maps a short coupon name ("Nottingham") to the dataset name ("Nottingham Forest FC") */
function resolveTeam(shortName: string, teams: string[]) {
  const short = normalize(shortName);
  const exact = teams.filter((t) => normalize(t) === short);
  if (exact.length === 1) return exact[0];
  const prefixed = teams.filter((t) => normalize(t).startsWith(short));
  return prefixed.length === 1 ? prefixed[0] : null;
}

function meetings(results: Result[], homeTeam: string | null, awayTeam: string | null): Meeting[] {
  if (!homeTeam || !awayTeam) return [];
  return results
    .filter(
      (m) => (m.team1 === homeTeam && m.team2 === awayTeam) || (m.team1 === awayTeam && m.team2 === homeTeam),
    )
    .map((m) => ({
      date: m.date,
      homeTeam: m.team1,
      awayTeam: m.team2,
      homeGoals: m.goals[0],
      awayGoals: m.goals[1],
      sameVenue: m.team1 === homeTeam,
    }));
}

/** Meetings between each fixture's teams this season */
export async function getMeetings(fixtures: Fixture[]): Promise<Meeting[][]> {
  const results = await loadLatestSeason();
  const teams = [...new Set(results.flatMap((m) => [m.team1, m.team2]))];

  return fixtures.map(({ home, away }) =>
    meetings(results, resolveTeam(home, teams), resolveTeam(away, teams)),
  );
}
