// ─── Standing Data ───────────────────────────────────────────────────────────

export interface StandingInput {
  // Fields entered by user (new form: Pos, GD, W, D, L, F, A)
  position: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  // Derived / backward-compat (may be 0 for old records that had them)
  played: number;
  points: number;
}

export interface StandingCalculated extends StandingInput {
  winRate: number;
  drawRate: number;
  lossRate: number;
  pointsPerGame: number;
  gfPerGame: number;
  gaPerGame: number;
  gdPerGame: number;
}

// ─── Last 3 Matches ──────────────────────────────────────────────────────────

export type Venue = "HOME" | "AWAY";

export interface RecentMatch {
  venue: Venue;
  goalsFor: number;
  goalsAgainst: number;
}

export interface RecentMatchCalculated extends RecentMatch {
  result: "W" | "D" | "L";
}

export interface Last3Summary {
  matches: RecentMatchCalculated[];
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  gfPerMatch: number;
  gaPerMatch: number;
  pointsPerMatch: number;
}

// ─── Prediction ──────────────────────────────────────────────────────────────

export interface ScoreProbability {
  home: number;
  away: number;
  probability: number;
}

/** All 7 prediction markets — derived from the same Poisson score matrix. */
export interface PredictionMarkets {
  /** 1X2 — same as top-level homeWin/draw/awayWin but kept here for grouping. */
  result1X2: {
    home: number;   // % integer
    draw: number;
    away: number;
  };
  /** Double Chance: 1X, X2, 12 */
  doubleChance: {
    oneX: number;   // % integer
    xTwo: number;
    oneTwo: number;
  };
  /** Over/Under total goals for lines 0.5–4.5 */
  overUnder: {
    over05: number;  under05: number;
    over15: number;  under15: number;
    over25: number;  under25: number;
    over35: number;  under35: number;
    over45: number;  under45: number;
  };
  /** BTTS Yes / No */
  btts: {
    yes: number;    // % integer
    no: number;
  };
  /** Draw No Bet — conditional probability with draw excluded */
  drawNoBet: {
    home: number;   // % integer
    away: number;
  };
  /**
   * Correct Score — top 5 most likely scorelines, sorted by probability desc.
   * Deterministic tie-breaker: homeGoals asc, then awayGoals asc.
   */
  correctScore: ScoreProbability[];  // probability is % integer
  /** Team Total Goals — marginal Poisson per team */
  teamGoals: {
    home: {
      over05: number; under05: number;
      over15: number; under15: number;
      over25: number; under25: number;
    };
    away: {
      over05: number; under05: number;
      over15: number; under15: number;
      over25: number; under25: number;
    };
  };
}

export interface PredictionResult {
  // ── Legacy fields — kept intact, no consumers broken ──
  homeWin: number;
  draw: number;
  awayWin: number;
  over15: number;
  over25: number;
  over35: number;
  btts: number;
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  /** Top 3 for backward compat; new engine provides top 5 via markets.correctScore */
  topScorelines: ScoreProbability[];

  // ── New extended markets (optional so legacy Firestore docs don't crash) ──
  markets?: PredictionMarkets;
}

// ─── Match Data ───────────────────────────────────────────────────────────────

export interface MatchData {
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeStanding: StandingCalculated;
  awayStanding: StandingCalculated;
  homeLast3: Last3Summary;
  awayLast3: Last3Summary;
  prediction: PredictionResult;
  aiAnalysis: string;
  createdAt: string;
  userId: string;
}

// ─── Slip ────────────────────────────────────────────────────────────────────

export interface SlipData {
  name: string;
  description: string;
  visibility?: "private" | "public";
  ownerRole?: "user" | "admin";
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export type Membership = "free" | "vip";
export type PaymentProductType = "vip" | "key";
export type PaymentStatus = "pending" | "completed" | "cancelled";

export interface UserProfile {
  email?: string;
  membership: Membership;
  keys: number;
  role: "user" | "admin";
}

export interface PaymentRecord {
  orderId: string;
  userId: string;
  productId: string;
  productType: PaymentProductType;
  keys: number;
  amount: number;
  status: PaymentStatus;
  paymentMethod?: string;
  createdAt: string;
  completedAt?: string;
}

/** A MatchData document stored inside a Slip subcollection. */
export interface SlipMatchData extends MatchData {
  slipId: string;
}

// ─── Form Steps ──────────────────────────────────────────────────────────────

export interface MatchInfoForm {
  competition: string;
  homeTeam: string;
  awayTeam: string;
}

export interface StandingForm {
  position: string;
  goalDifference: string;
  wins: string;
  draws: string;
  losses: string;
  goalsFor: string;
  goalsAgainst: string;
}

export interface RecentMatchForm {
  venue: Venue;
  goalsFor: string;
  goalsAgainst: string;
}

export interface WizardState {
  step: number;
  matchInfo: MatchInfoForm;
  homeStanding: StandingForm;
  awayStanding: StandingForm;
  homeLast3: [RecentMatchForm, RecentMatchForm, RecentMatchForm];
  awayLast3: [RecentMatchForm, RecentMatchForm, RecentMatchForm];
}
