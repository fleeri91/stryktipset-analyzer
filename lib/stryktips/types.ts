/** One value per sign: 1, X, 2 */
export type Triple = [number, number, number];

/** V = vinst, O = oavgjort, F = förlust, "" = ej ifylld */
export type FormResult = "" | "V" | "O" | "F";

export type TeamForm = {
  home: FormResult[];
  away: FormResult[];
};

export type Meeting = {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  /** Same home team as the coupon match */
  sameVenue: boolean;
};

export type TrendPoint = {
  /** ISO timestamp */
  at: string;
  /** Percent */
  value: number;
};

/** Oldest first */
export type Trend = {
  odds: TrendPoint[];
  folk: TrendPoint[];
};

export type CouponMatch = {
  n: number;
  home: string;
  away: string;
  /** ISO timestamp */
  kickoff: string;
  /** Market probability from the odds, in percent */
  odds: Triple;
  /** Share of the public's picks, in percent */
  folk: Triple;
  trend: [Trend, Trend, Trend];
  meetings: Meeting[];
};

export type Coupon = {
  round: number;
  updatedAt: string;
  closesAt: string;
  matches: CouponMatch[];
};
