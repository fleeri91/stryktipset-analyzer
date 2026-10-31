import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Triple } from "./types";

/** One reading of every match in a round */
export type Snapshot = {
  at: string;
  matches: { n: number; odds: Triple; folk: Triple }[];
};

/** One JSON file per round, e.g. `.data/trends/4977.json` */
const TREND_DIR = path.join(process.cwd(), ".data", "trends");

function fileFor(round: number) {
  return path.join(TREND_DIR, `${round}.json`);
}

export async function readSnapshots(round: number): Promise<Snapshot[]> {
  try {
    return JSON.parse(await readFile(fileFor(round), "utf8")) as Snapshot[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

/** Skips the snapshot if the latest one is younger than `minGapMs`, e.g. when two servers collect */
export async function appendSnapshot(round: number, snapshot: Snapshot, minGapMs = 0) {
  const snapshots = await readSnapshots(round);
  const latest = snapshots.at(-1);
  if (latest && Date.parse(snapshot.at) - Date.parse(latest.at) < minGapMs) return;
  snapshots.push(snapshot);

  await mkdir(TREND_DIR, { recursive: true });
  // Write to a temp file and rename, so a reader never sees a half-written file
  const tmp = `${fileFor(round)}.tmp`;
  await writeFile(tmp, JSON.stringify(snapshots));
  await rename(tmp, fileFor(round));
}
