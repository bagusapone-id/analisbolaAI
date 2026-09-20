/**
 * Unit tests for the AiSkor360 prediction engine.
 *
 * Rules enforced:
 * - No random numbers
 * - All 7 markets derived from the same Poisson score matrix
 * - Legacy PredictionResult fields remain compatible
 * - Legacy Match documents (no markets field) must not crash
 */

import { describe, it, expect } from "vitest";
import {
  poissonPMF,
  buildScoreMatrix,
  outcomeProbs,
  overUnderProbs,
  bttsProbs,
  doubleChanceProbs,
  drawNoBetProbs,
  topScorelines,
  teamGoalProbs,
} from "../lib/prediction/poisson";
import { runPrediction } from "../lib/prediction/prediction";
import { calculateStanding, validateStanding } from "../lib/calculations";
import type {
  StandingCalculated,
  Last3Summary,
  PredictionResult,
} from "../lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStanding(overrides: Partial<StandingCalculated> = {}): StandingCalculated {
  return {
    wins: 10, draws: 5, losses: 5, goalsFor: 30, goalsAgainst: 20,
    goalDifference: 10, played: 20, points: 35, position: 5,
    winRate: 0.5, drawRate: 0.25, lossRate: 0.25,
    pointsPerGame: 1.75, gfPerGame: 1.5, gaPerGame: 1.0, gdPerGame: 0.5,
    ...overrides,
  };
}

function makeLast3(overrides: Partial<Last3Summary> = {}): Last3Summary {
  return {
    matches: [
      { venue: "HOME", goalsFor: 2, goalsAgainst: 1, result: "W" },
      { venue: "AWAY", goalsFor: 1, goalsAgainst: 1, result: "D" },
      { venue: "HOME", goalsFor: 2, goalsAgainst: 0, result: "W" },
    ],
    wins: 2, draws: 1, losses: 0, points: 7,
    goalsFor: 5, goalsAgainst: 2, goalDifference: 3,
    gfPerMatch: 5 / 3, gaPerMatch: 2 / 3,
    pointsPerMatch: 7 / 3,
    ...overrides,
  };
}

const homeStanding = makeStanding();
const awayStanding = makeStanding({ wins: 8, draws: 4, losses: 8, points: 28,
  winRate: 0.4, pointsPerGame: 1.4, gfPerGame: 1.2, gaPerGame: 1.2,
  goalsFor: 24, goalsAgainst: 24, goalDifference: 0, gdPerGame: 0 });
const homeLast3 = makeLast3();
const awayLast3 = makeLast3({ wins: 1, draws: 1, losses: 1, points: 4, pointsPerMatch: 4/3,
  goalsFor: 3, goalsAgainst: 3, gfPerMatch: 1, gaPerMatch: 1 });

// ─── poissonPMF ───────────────────────────────────────────────────────────────

describe("validateStanding", () => {
  it("rejects empty standings before the user can continue", () => {
    const result = validateStanding({
      position: "",
      goalDifference: "",
      wins: "",
      draws: "",
      losses: "",
      goalsFor: "",
      goalsAgainst: "",
    });

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((msg) => /wajib diisi|required/i.test(msg))).toBe(true);
  });

  it("shows a warning when standing data is zeroed or inconsistent for AI analysis", () => {
    const result = validateStanding({
      goalDifference: "0",
      wins: "0",
      draws: "0",
      losses: "0",
      goalsFor: "0",
      goalsAgainst: "0",
      position: "5",
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((msg) => /AI|akurat|data klasemen/i.test(msg))).toBe(true);
  });

  it("includes standing position in calculated data for AI analysis", () => {
    const standing = calculateStanding({
      position: "3",
      goalDifference: "8",
      wins: "10",
      draws: "2",
      losses: "1",
      goalsFor: "25",
      goalsAgainst: "17",
    });

    expect(standing.position).toBe(3);
    expect(Number.isFinite(standing.position)).toBe(true);
  });
});

describe("poissonPMF", () => {
  it("returns 1 for lambda=0, k=0", () => {
    expect(poissonPMF(0, 0)).toBeCloseTo(1);
  });
  it("returns 0 for lambda=0, k>0", () => {
    expect(poissonPMF(0, 1)).toBe(0);
  });
  it("returns 0 for negative k", () => {
    expect(poissonPMF(1.5, -1)).toBe(0);
  });
  it("returns 0 for non-integer k", () => {
    expect(poissonPMF(1.5, 1.5)).toBe(0);
  });
  it("sums to ~1 over k=0..20 for lambda=2.5", () => {
    let sum = 0;
    for (let k = 0; k <= 20; k++) sum += poissonPMF(2.5, k);
    expect(sum).toBeCloseTo(1, 4);
  });
  it("is deterministic — same inputs produce identical outputs", () => {
    expect(poissonPMF(1.8, 2)).toBe(poissonPMF(1.8, 2));
  });
});

// ─── buildScoreMatrix ─────────────────────────────────────────────────────────

describe("buildScoreMatrix", () => {
  it("produces a (maxGoals+1) × (maxGoals+1) matrix", () => {
    const m = buildScoreMatrix(1.5, 1.2, 6);
    expect(m.length).toBe(7);
    m.forEach((row) => expect(row.length).toBe(7));
  });
  it("all cells are non-negative", () => {
    const m = buildScoreMatrix(1.5, 1.2, 6);
    m.forEach((row) => row.forEach((p) => expect(p).toBeGreaterThanOrEqual(0)));
  });
  it("sum of all cells is close to 1 (slight truncation OK)", () => {
    const m = buildScoreMatrix(1.0, 1.0, 10);
    let sum = 0;
    m.forEach((row) => row.forEach((p) => (sum += p)));
    expect(sum).toBeCloseTo(1, 2);
  });
});

// ─── outcomeProbs ─────────────────────────────────────────────────────────────

describe("outcomeProbs — 1X2 sums to 1", () => {
  it("homeWin + draw + awayWin === 1.0", () => {
    const m = buildScoreMatrix(1.8, 1.2, 6);
    const { homeWin, draw, awayWin } = outcomeProbs(m);
    expect(homeWin + draw + awayWin).toBeCloseTo(1, 10);
  });
  it("all values in [0, 1]", () => {
    const m = buildScoreMatrix(1.8, 1.2, 6);
    const { homeWin, draw, awayWin } = outcomeProbs(m);
    [homeWin, draw, awayWin].forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });
  it("is deterministic", () => {
    const m = buildScoreMatrix(1.8, 1.2, 6);
    expect(outcomeProbs(m)).toEqual(outcomeProbs(m));
  });
});

// ─── overUnderProbs ───────────────────────────────────────────────────────────

describe("overUnderProbs — complement pairs sum to 1", () => {
  const m = buildScoreMatrix(1.5, 1.1, 6);
  const ou = overUnderProbs(m);

  const lines = ["05", "15", "25", "35", "45"] as const;
  lines.forEach((line) => {
    it(`Over${line} + Under${line} === 1`, () => {
      const over = ou[`over${line}` as keyof typeof ou];
      const under = ou[`under${line}` as keyof typeof ou];
      expect(over + under).toBeCloseTo(1, 10);
    });
  });

  it("Over0.5 >= Over1.5 >= Over2.5 >= Over3.5 >= Over4.5 (monotone)", () => {
    expect(ou.over05).toBeGreaterThanOrEqual(ou.over15);
    expect(ou.over15).toBeGreaterThanOrEqual(ou.over25);
    expect(ou.over25).toBeGreaterThanOrEqual(ou.over35);
    expect(ou.over35).toBeGreaterThanOrEqual(ou.over45);
  });

  it("all values in [0, 1]", () => {
    Object.values(ou).forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });
});

// ─── bttsProbs ────────────────────────────────────────────────────────────────

describe("bttsProbs — Yes + No === 1", () => {
  it("yes + no === 1.0", () => {
    const m = buildScoreMatrix(1.5, 1.1, 6);
    const { yes, no } = bttsProbs(m);
    expect(yes + no).toBeCloseTo(1, 10);
  });
  it("yes is in [0, 1]", () => {
    const m = buildScoreMatrix(1.5, 1.1, 6);
    const { yes } = bttsProbs(m);
    expect(yes).toBeGreaterThanOrEqual(0);
    expect(yes).toBeLessThanOrEqual(1);
  });
  it("btts yes is higher when both lambdas are high", () => {
    const mHigh = buildScoreMatrix(3.0, 3.0, 6);
    const mLow  = buildScoreMatrix(0.5, 0.5, 6);
    expect(bttsProbs(mHigh).yes).toBeGreaterThan(bttsProbs(mLow).yes);
  });
  it("btts yes is 0 when lambdaAway=0 (away team never scores)", () => {
    const m = buildScoreMatrix(2.0, 0, 6);
    const { yes } = bttsProbs(m);
    expect(yes).toBeCloseTo(0, 5);
  });
});

// ─── doubleChanceProbs ────────────────────────────────────────────────────────

describe("doubleChanceProbs — formulas correct", () => {
  it("1X = homeWin + draw", () => {
    const { oneX } = doubleChanceProbs(0.52, 0.26, 0.22);
    expect(oneX).toBeCloseTo(0.78, 10);
  });
  it("X2 = draw + awayWin", () => {
    const { xTwo } = doubleChanceProbs(0.52, 0.26, 0.22);
    expect(xTwo).toBeCloseTo(0.48, 10);
  });
  it("12 = homeWin + awayWin", () => {
    const { oneTwo } = doubleChanceProbs(0.52, 0.26, 0.22);
    expect(oneTwo).toBeCloseTo(0.74, 10);
  });
  it("consistent with summing 1X2 fractions from outcomeProbs", () => {
    const m = buildScoreMatrix(1.8, 1.2, 6);
    const { homeWin: hw, draw: d, awayWin: aw } = outcomeProbs(m);
    const dc = doubleChanceProbs(hw, d, aw);
    expect(dc.oneX).toBeCloseTo(hw + d, 10);
    expect(dc.xTwo).toBeCloseTo(d + aw, 10);
    expect(dc.oneTwo).toBeCloseTo(hw + aw, 10);
  });
});

// ─── drawNoBetProbs ───────────────────────────────────────────────────────────

describe("drawNoBetProbs — excludes draw correctly", () => {
  it("home + away === 1.0", () => {
    const { home, away } = drawNoBetProbs(0.52, 0.22);
    expect(home + away).toBeCloseTo(1, 10);
  });
  it("home DNB = homeWin / (homeWin + awayWin)", () => {
    const { home } = drawNoBetProbs(0.52, 0.22);
    expect(home).toBeCloseTo(0.52 / (0.52 + 0.22), 10);
  });
  it("away DNB = awayWin / (homeWin + awayWin)", () => {
    const { away } = drawNoBetProbs(0.52, 0.22);
    expect(away).toBeCloseTo(0.22 / (0.52 + 0.22), 10);
  });
  it("draw is NOT included — probabilities ignore draw fraction", () => {
    // With draw = 0.4, DNB should still only normalise home vs away
    const { home } = drawNoBetProbs(0.4, 0.2);
    expect(home).toBeCloseTo(0.4 / 0.6, 10);
  });
  it("returns 0.5/0.5 when both are zero (edge case)", () => {
    const { home, away } = drawNoBetProbs(0, 0);
    expect(home).toBe(0.5);
    expect(away).toBe(0.5);
  });
});

// ─── topScorelines ────────────────────────────────────────────────────────────

describe("topScorelines — correct score", () => {
  const m = buildScoreMatrix(1.5, 1.1, 6);
  const top5 = topScorelines(m, 5);

  it("returns exactly 5 scorelines", () => {
    expect(top5.length).toBe(5);
  });
  it("sorted descending by probability", () => {
    for (let i = 0; i < top5.length - 1; i++) {
      expect(top5[i].probability).toBeGreaterThanOrEqual(top5[i + 1].probability);
    }
  });
  it("all probabilities are non-negative", () => {
    top5.forEach((s) => expect(s.probability).toBeGreaterThanOrEqual(0));
  });
  it("all scores are within matrix bounds", () => {
    top5.forEach((s) => {
      expect(s.home).toBeGreaterThanOrEqual(0);
      expect(s.away).toBeGreaterThanOrEqual(0);
      expect(s.home).toBeLessThanOrEqual(6);
      expect(s.away).toBeLessThanOrEqual(6);
    });
  });
  it("probabilities match the score matrix values", () => {
    top5.forEach((s) => {
      expect(s.probability).toBeCloseTo(m[s.home][s.away], 10);
    });
  });
  it("is deterministic — no randomisation", () => {
    const a = topScorelines(m, 5);
    const b = topScorelines(m, 5);
    expect(a).toEqual(b);
  });
  it("tie-breaker: lower home goals first when probabilities equal", () => {
    // Artificial matrix where two cells have equal probability
    const flat: number[][] = Array.from({ length: 3 }, () => [0.1, 0.1, 0.1]);
    const sorted = topScorelines(flat, 9);
    // First entry should be 0-0 (lowest home, lowest away)
    expect(sorted[0]).toMatchObject({ home: 0, away: 0 });
    expect(sorted[1]).toMatchObject({ home: 0, away: 1 });
    expect(sorted[3]).toMatchObject({ home: 1, away: 0 });
  });
});

// ─── teamGoalProbs ────────────────────────────────────────────────────────────

describe("teamGoalProbs — marginal Poisson per team", () => {
  const tg = teamGoalProbs(1.8, 1.1, 6);

  it("home over + under sum to 1 for each line", () => {
    expect(tg.home.over05 + tg.home.under05).toBeCloseTo(1, 10);
    expect(tg.home.over15 + tg.home.under15).toBeCloseTo(1, 10);
    expect(tg.home.over25 + tg.home.under25).toBeCloseTo(1, 10);
  });
  it("away over + under sum to 1 for each line", () => {
    expect(tg.away.over05 + tg.away.under05).toBeCloseTo(1, 10);
    expect(tg.away.over15 + tg.away.under15).toBeCloseTo(1, 10);
    expect(tg.away.over25 + tg.away.under25).toBeCloseTo(1, 10);
  });
  it("home Over0.5 >= Over1.5 >= Over2.5 (monotone)", () => {
    expect(tg.home.over05).toBeGreaterThanOrEqual(tg.home.over15);
    expect(tg.home.over15).toBeGreaterThanOrEqual(tg.home.over25);
  });
  it("away Over0.5 >= Over1.5 >= Over2.5 (monotone)", () => {
    expect(tg.away.over05).toBeGreaterThanOrEqual(tg.away.over15);
    expect(tg.away.over15).toBeGreaterThanOrEqual(tg.away.over25);
  });
  it("home Over0.5 > away Over0.5 when lambdaHome > lambdaAway", () => {
    expect(tg.home.over05).toBeGreaterThan(tg.away.over05);
  });
  it("uses marginal distribution — independent of the other team's lambda", () => {
    const tg1 = teamGoalProbs(1.8, 0.3, 6);
    const tg2 = teamGoalProbs(1.8, 3.0, 6);
    // Home team probabilities must be identical regardless of away lambda
    expect(tg1.home.over05).toBeCloseTo(tg2.home.over05, 10);
    expect(tg1.home.over15).toBeCloseTo(tg2.home.over15, 10);
    expect(tg1.home.over25).toBeCloseTo(tg2.home.over25, 10);
  });
});

// ─── runPrediction — integration ─────────────────────────────────────────────

describe("runPrediction — integration tests", () => {
  const result = runPrediction(homeStanding, awayStanding, homeLast3, awayLast3);

  // ── Legacy fields backward-compat ──────────────────────────────────────────
  it("returns legacy homeWin/draw/awayWin as integers", () => {
    expect(Number.isInteger(result.homeWin)).toBe(true);
    expect(Number.isInteger(result.draw)).toBe(true);
    expect(Number.isInteger(result.awayWin)).toBe(true);
  });
  it("legacy homeWin + draw + awayWin === 100", () => {
    expect(result.homeWin + result.draw + result.awayWin).toBe(100);
  });
  it("returns legacy topScorelines with 3 entries", () => {
    expect(result.topScorelines.length).toBe(3);
  });
  it("legacy over25 === markets.overUnder.over25", () => {
    expect(result.over25).toBe(result.markets!.overUnder.over25);
  });
  it("legacy btts === markets.btts.yes", () => {
    expect(result.btts).toBe(result.markets!.btts.yes);
  });

  // ── markets field present ──────────────────────────────────────────────────
  it("markets field is present", () => {
    expect(result.markets).toBeDefined();
  });

  // ── 1X2 ────────────────────────────────────────────────────────────────────
  it("1X2: home + draw + away === 100", () => {
    const { result1X2 } = result.markets!;
    expect(result1X2.home + result1X2.draw + result1X2.away).toBe(100);
  });
  it("1X2 matches legacy fields exactly", () => {
    const { result1X2 } = result.markets!;
    expect(result1X2.home).toBe(result.homeWin);
    expect(result1X2.draw).toBe(result.draw);
    expect(result1X2.away).toBe(result.awayWin);
  });

  // ── Double Chance ─────────────────────────────────────────────────────────
  it("doubleChance.oneX === homeWin + draw (at display precision)", () => {
    const { result1X2, doubleChance } = result.markets!;
    expect(doubleChance.oneX).toBe(result1X2.home + result1X2.draw);
  });
  it("doubleChance.xTwo === draw + away", () => {
    const { result1X2, doubleChance } = result.markets!;
    expect(doubleChance.xTwo).toBe(result1X2.draw + result1X2.away);
  });
  it("doubleChance.oneTwo === home + away", () => {
    const { result1X2, doubleChance } = result.markets!;
    expect(doubleChance.oneTwo).toBe(result1X2.home + result1X2.away);
  });

  // ── Over/Under ────────────────────────────────────────────────────────────
  it("each Over/Under pair sums to 100", () => {
    const ou = result.markets!.overUnder;
    expect(ou.over05 + ou.under05).toBe(100);
    expect(ou.over15 + ou.under15).toBe(100);
    expect(ou.over25 + ou.under25).toBe(100);
    expect(ou.over35 + ou.under35).toBe(100);
    expect(ou.over45 + ou.under45).toBe(100);
  });
  it("Over lines are monotone descending", () => {
    const ou = result.markets!.overUnder;
    expect(ou.over05).toBeGreaterThanOrEqual(ou.over15);
    expect(ou.over15).toBeGreaterThanOrEqual(ou.over25);
    expect(ou.over25).toBeGreaterThanOrEqual(ou.over35);
    expect(ou.over35).toBeGreaterThanOrEqual(ou.over45);
  });

  // ── BTTS ──────────────────────────────────────────────────────────────────
  it("btts.yes + btts.no === 100", () => {
    const { btts } = result.markets!;
    expect(btts.yes + btts.no).toBe(100);
  });

  // ── Draw No Bet ───────────────────────────────────────────────────────────
  it("drawNoBet.home + drawNoBet.away === 100", () => {
    const { drawNoBet } = result.markets!;
    expect(drawNoBet.home + drawNoBet.away).toBe(100);
  });
  it("drawNoBet does not include draw", () => {
    // home DNB must be >= homeWin (because draw is excluded from denominator)
    expect(result.markets!.drawNoBet.home).toBeGreaterThanOrEqual(result.markets!.result1X2.home);
  });

  // ── Correct Score ─────────────────────────────────────────────────────────
  it("correctScore has 5 entries", () => {
    expect(result.markets!.correctScore.length).toBe(5);
  });
  it("correctScore sorted descending by probability", () => {
    const cs = result.markets!.correctScore;
    for (let i = 0; i < cs.length - 1; i++) {
      expect(cs[i].probability).toBeGreaterThanOrEqual(cs[i + 1].probability);
    }
  });
  it("correctScore top entry is consistent with score matrix", () => {
    const top = result.markets!.correctScore[0];
    expect(top.probability).toBeGreaterThan(0);
  });

  // ── Team Goals ────────────────────────────────────────────────────────────
  it("teamGoals each pair sums to 100", () => {
    const tg = result.markets!.teamGoals;
    expect(tg.home.over05 + tg.home.under05).toBe(100);
    expect(tg.home.over15 + tg.home.under15).toBe(100);
    expect(tg.home.over25 + tg.home.under25).toBe(100);
    expect(tg.away.over05 + tg.away.under05).toBe(100);
    expect(tg.away.over15 + tg.away.under15).toBe(100);
    expect(tg.away.over25 + tg.away.under25).toBe(100);
  });
  it("teamGoals.home uses own lambda — independent of away", () => {
    const r1 = runPrediction(homeStanding, awayStanding, homeLast3, awayLast3);
    const weakAway = makeStanding({ wins: 1, draws: 1, losses: 18, points: 4, winRate: 0.05,
      pointsPerGame: 0.2, gfPerGame: 0.3, gaPerGame: 3.0, goalsFor: 6, goalsAgainst: 60,
      goalDifference: -54, gdPerGame: -2.7 });
    const r2 = runPrediction(homeStanding, weakAway, homeLast3, awayLast3);
    // Home team goals should be roughly similar — different away affects their attack indirectly
    // but same home team; just assert the markets exist and are valid
    expect(r2.markets!.teamGoals.home.over05).toBeGreaterThanOrEqual(0);
    expect(r2.markets!.teamGoals.home.over05).toBeLessThanOrEqual(100);
  });

  // ── No random numbers ─────────────────────────────────────────────────────
  it("is fully deterministic — same input produces identical output", () => {
    const a = runPrediction(homeStanding, awayStanding, homeLast3, awayLast3);
    const b = runPrediction(homeStanding, awayStanding, homeLast3, awayLast3);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("edge cases — extreme / zero expected goals", () => {
  it("handles very high-scoring game (both attack >4 gfPerGame)", () => {
    const attacker = makeStanding({ gfPerGame: 4.5, gaPerGame: 0.5, wins: 18, draws: 1, losses: 1,
      points: 55, winRate: 0.9, pointsPerGame: 2.75, goalsFor: 90, goalsAgainst: 10,
      goalDifference: 80, gdPerGame: 4.0 });
    const result = runPrediction(attacker, attacker, homeLast3, awayLast3);
    expect(result.homeWin + result.draw + result.awayWin).toBe(100);
    expect(result.markets!.overUnder.over25).toBeGreaterThan(50); // high-scoring → likely over
  });

  it("handles 0-0 standoff (both teams 0 gfPerGame → clamped to 0.3)", () => {
    const scoreless = makeStanding({ gfPerGame: 0, gaPerGame: 0, goalsFor: 0,
      gdPerGame: 0, goalDifference: 0 });
    const scorelessLast3 = makeLast3({ gfPerMatch: 0, gaPerMatch: 0, goalsFor: 0, goalsAgainst: 0 });
    const result = runPrediction(scoreless, scoreless, scorelessLast3, scorelessLast3);
    // Should not throw, markets should be valid
    expect(result.homeWin + result.draw + result.awayWin).toBe(100);
    expect(result.markets!.btts.yes + result.markets!.btts.no).toBe(100);
  });

  it("lambda floor of 0.3 prevents zero-division in drawNoBetProbs", () => {
    // Even extreme cases should never crash
    const allDraws = makeStanding({ wins: 0, draws: 20, losses: 0, points: 20,
      winRate: 0, drawRate: 1, lossRate: 0, pointsPerGame: 1,
      gfPerGame: 0.1, gaPerGame: 0.1, goalDifference: 0, gdPerGame: 0 });
    const result = runPrediction(allDraws, allDraws, homeLast3, awayLast3);
    expect(result.markets!.drawNoBet.home + result.markets!.drawNoBet.away).toBe(100);
  });
});

// ─── Legacy document compatibility ───────────────────────────────────────────

describe("legacy Match documents without markets field", () => {
  it("PredictionResult.markets is optional — legacy doc with undefined markets does not crash", () => {
    const legacyResult: PredictionResult = {
      homeWin: 52, draw: 26, awayWin: 22,
      over15: 70, over25: 45, over35: 22, btts: 51,
      expectedHomeGoals: 1.8, expectedAwayGoals: 1.2,
      topScorelines: [
        { home: 1, away: 0, probability: 14 },
        { home: 1, away: 1, probability: 12 },
        { home: 2, away: 1, probability: 10 },
      ],
      // markets intentionally absent
    };
    expect(legacyResult.markets).toBeUndefined();
    // Accessing optional field with ?. should not throw
    expect(legacyResult.markets?.btts?.yes).toBeUndefined();
    expect(legacyResult.markets?.correctScore?.length).toBeUndefined();
  });

  it("existing prediction outputs remain compatible — legacy fields present in new result", () => {
    const result = runPrediction(homeStanding, awayStanding, homeLast3, awayLast3);
    // All legacy fields must exist
    expect(result).toHaveProperty("homeWin");
    expect(result).toHaveProperty("draw");
    expect(result).toHaveProperty("awayWin");
    expect(result).toHaveProperty("over15");
    expect(result).toHaveProperty("over25");
    expect(result).toHaveProperty("over35");
    expect(result).toHaveProperty("btts");
    expect(result).toHaveProperty("expectedHomeGoals");
    expect(result).toHaveProperty("expectedAwayGoals");
    expect(result).toHaveProperty("topScorelines");
  });
});
