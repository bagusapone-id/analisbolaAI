/**
 * Main prediction engine.
 *
 * Purely deterministic statistical model.
 * No LLM, no random numbers.
 *
 * ONE score matrix is built per prediction and reused for ALL markets.
 * This guarantees mathematical consistency across all 7 markets.
 */

import type { StandingCalculated, Last3Summary, PredictionResult, PredictionMarkets } from "../types";
import { extractFeatures, expectedGoals, HOME_ADVANTAGE } from "./features";
import {
  buildScoreMatrix,
  outcomeProbs,
  goalMarketProbs,
  topScorelines,
  overUnderProbs,
  bttsProbs,
  doubleChanceProbs,
  drawNoBetProbs,
  teamGoalProbs,
} from "./poisson";

/** Round a fraction to an integer percentage. */
function pct(fraction: number): number {
  return Math.round(fraction * 100);
}

export function runPrediction(
  homeStanding: StandingCalculated,
  awayStanding: StandingCalculated,
  homeLast3: Last3Summary,
  awayLast3: Last3Summary
): PredictionResult {
  const homeFeatures = extractFeatures(homeStanding, homeLast3);
  const awayFeatures = extractFeatures(awayStanding, awayLast3);

  // ── Expected goals ────────────────────────────────────────────────────────
  let lambdaHome = expectedGoals(
    homeFeatures.gfPerGame,
    homeFeatures.recentGFPerMatch,
    awayFeatures.gaPerGame,
    awayFeatures.recentGAPerMatch
  );

  let lambdaAway = expectedGoals(
    awayFeatures.gfPerGame,
    awayFeatures.recentGFPerMatch,
    homeFeatures.gaPerGame,
    homeFeatures.recentGAPerMatch
  );

  // Apply home advantage
  lambdaHome *= HOME_ADVANTAGE;

  // Form adjustment: recent form can shift lambda ±10–30%
  const homeFormRatio =
    homeFeatures.recentPointsPerMatch > 0
      ? homeFeatures.recentPointsPerMatch / Math.max(homeFeatures.pointsPerGame, 0.1)
      : 1;
  const awayFormRatio =
    awayFeatures.recentPointsPerMatch > 0
      ? awayFeatures.recentPointsPerMatch / Math.max(awayFeatures.pointsPerGame, 0.1)
      : 1;

  lambdaHome = Math.max(0.3, lambdaHome * Math.max(0.9, Math.min(homeFormRatio, 1.3)));
  lambdaAway = Math.max(0.3, lambdaAway * Math.max(0.9, Math.min(awayFormRatio, 1.3)));

  // ── ONE score matrix — single source of truth for all markets ────────────
  const matrix = buildScoreMatrix(lambdaHome, lambdaAway, 6);

  // ── 1X2 outcome probabilities (normalised fractions) ─────────────────────
  const outcomes = outcomeProbs(matrix);
  const { homeWin: hwFrac, draw: dFrac, awayWin: awFrac } = outcomes;

  // ── Legacy goal markets (backward-compat, raw matrix sums) ───────────────
  const { over15: o15, over25: o25, over35: o35, btts: bttsRaw } = goalMarketProbs(matrix);

  // ── Legacy top 3 scorelines (backward-compat) ────────────────────────────
  const top3 = topScorelines(matrix, 3);

  // ── All 7 extended markets ────────────────────────────────────────────────

  // 1. 1X2 — same fractions, rounded for display
  const result1X2 = {
    home: pct(hwFrac),
    draw: pct(dFrac),
    away: 100 - pct(hwFrac) - pct(dFrac), // absorbs rounding residue
  };

  // 2. Double Chance — exact combination, no extra normalisation
  const dc = doubleChanceProbs(hwFrac, dFrac, awFrac);
  const doubleChance = {
    oneX:  pct(dc.oneX),
    xTwo:  pct(dc.xTwo),
    oneTwo: pct(dc.oneTwo),
  };

  // 3. Over/Under 0.5–4.5 — complement pairs from matrix
  const ou = overUnderProbs(matrix);
  const overUnder = {
    over05: pct(ou.over05), under05: 100 - pct(ou.over05),
    over15: pct(ou.over15), under15: 100 - pct(ou.over15),
    over25: pct(ou.over25), under25: 100 - pct(ou.over25),
    over35: pct(ou.over35), under35: 100 - pct(ou.over35),
    over45: pct(ou.over45), under45: 100 - pct(ou.over45),
  };

  // 4. BTTS Yes / No — complement pair from matrix
  const bttsP = bttsProbs(matrix);
  const bttsMarket = {
    yes: pct(bttsP.yes),
    no:  100 - pct(bttsP.yes),
  };

  // 5. Draw No Bet — conditional, draw excluded from denominator
  const dnb = drawNoBetProbs(hwFrac, awFrac);
  const drawNoBet = {
    home: pct(dnb.home),
    away: 100 - pct(dnb.home), // complement
  };

  // 6. Correct Score — top 5 from matrix
  const top5 = topScorelines(matrix, 5);
  const correctScore = top5.map((s) => ({
    home: s.home,
    away: s.away,
    probability: Math.round(s.probability * 1000) / 10, // 1dp %
  }));

  // 7. Team Total Goals — marginal Poisson per team
  const tg = teamGoalProbs(lambdaHome, lambdaAway, 6);
  const teamGoals = {
    home: {
      over05: pct(tg.home.over05), under05: 100 - pct(tg.home.over05),
      over15: pct(tg.home.over15), under15: 100 - pct(tg.home.over15),
      over25: pct(tg.home.over25), under25: 100 - pct(tg.home.over25),
    },
    away: {
      over05: pct(tg.away.over05), under05: 100 - pct(tg.away.over05),
      over15: pct(tg.away.over15), under15: 100 - pct(tg.away.over15),
      over25: pct(tg.away.over25), under25: 100 - pct(tg.away.over25),
    },
  };

  const markets: PredictionMarkets = {
    result1X2,
    doubleChance,
    overUnder,
    btts: bttsMarket,
    drawNoBet,
    correctScore,
    teamGoals,
  };

  // ── Return PredictionResult — legacy fields untouched ────────────────────
  return {
    // Legacy fields (existing consumers unchanged)
    homeWin: result1X2.home,
    draw:    result1X2.draw,
    awayWin: result1X2.away,
    over15:  pct(o15),
    over25:  pct(o25),
    over35:  pct(o35),
    btts:    pct(bttsRaw),
    expectedHomeGoals: Math.round(lambdaHome * 100) / 100,
    expectedAwayGoals: Math.round(lambdaAway * 100) / 100,
    topScorelines: top3.map((s) => ({
      ...s,
      probability: Math.round(s.probability * 100),
    })),
    // New extended markets
    markets,
  };
}
