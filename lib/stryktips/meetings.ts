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
  /** Normalized names, the same across seasons ("Aston Villa" and "Aston Villa FC") */
  key1: string;
  key2: string;
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

function normalize(name: string) {
  return name.replace(/\b(A?FC)\b/g, "").trim().toLowerCase();
}

async function readSeason(season: string) {
  const dir = path.join(DATA_DIR, season);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  return Promise.all(files.map(async (f) => JSON.parse(await readFile(path.join(dir, f), "utf8")) as SeasonFile));
}

/** All finished matches from every season and league, `data/<season>/*.json`, oldest first */
async function loadAllSeasons(): Promise<Result[]> {
  const seasons = await readdir(DATA_DIR);
  const leagues = (await Promise.all(seasons.map(readSeason))).flat();

  return leagues
    .flatMap((league) => league.matches)
    .sort((a, b) => `${a.date} ${a.time ?? ""}`.localeCompare(`${b.date} ${b.time ?? ""}`))
    .flatMap((m) => {
      const goals = fullTime(m.score);
      return goals
        ? [{ date: m.date, team1: m.team1, team2: m.team2, key1: normalize(m.team1), key2: normalize(m.team2), goals }]
        : [];
    });
}

// The files don't change while the server runs, so parse them once
let allSeasons: Promise<Result[]> | undefined;

/** Maps a short coupon name ("Nottingham") to a normalized dataset name ("nottingham forest") */
function resolveTeam(shortName: string, keys: string[]) {
  const short = normalize(shortName);
  if (keys.includes(short)) return short;
  const prefixed = keys.filter((k) => k.startsWith(short));
  return prefixed.length === 1 ? prefixed[0] : null;
}

function meetings(results: Result[], home: string | null, away: string | null): Meeting[] {
  if (!home || !away) return [];
  return results
    .filter((m) => m.key1 === home && m.key2 === away)
    .map((m) => ({
      date: m.date,
      homeTeam: m.team1,
      awayTeam: m.team2,
      homeGoals: m.goals[0],
      awayGoals: m.goals[1],
    }));
}

/** Earlier matches with the same home and away team as each fixture, across all seasons in `data/` */
export async function getMeetings(fixtures: Fixture[]): Promise<Meeting[][]> {
  allSeasons ??= loadAllSeasons().catch((error) => {
    allSeasons = undefined;
    throw error;
  });
  const results = await allSeasons;
  const keys = [...new Set(results.flatMap((m) => [m.key1, m.key2]))];

  return fixtures.map(({ home, away }) => meetings(results, resolveTeam(home, keys), resolveTeam(away, keys)));
}
