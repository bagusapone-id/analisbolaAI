import type {
  StandingCalculated,
  Last3Summary,
} from "../types";

/**
 * Extracts and normalises features from standings and recent form
 * to be consumed by the prediction model.
 */
export interface TeamFeatures {
  // Standings
  pointsPerGame: number;
  gfPerGame: number;
  gaPerGame: number;
  winRate: number;
  drawRate: number;
  lossRate: number;
  goalDifference: number;
  // Recent form (last 3)
  recentPointsPerMatch: number;
  recentGFPerMatch: number;
  recentGAPerMatch: number;
  recentWinRate: number;
}

export function extractFeatures(
  standing: StandingCalculated,
  last3: Last3Summary
): TeamFeatures {
  const played3 = last3.matches.length;
  const recentWinRate = played3 > 0 ? last3.wins / played3 : 0;

  return {
    pointsPerGame: standing.pointsPerGame,
    gfPerGame: standing.gfPerGame,
    gaPerGame: standing.gaPerGame,
    winRate: standing.winRate,
    drawRate: standing.drawRate,
    lossRate: standing.lossRate,
    goalDifference: standing.goalDifference,
    recentPointsPerMatch: last3.pointsPerMatch,
    recentGFPerMatch: last3.gfPerMatch,
    recentGAPerMatch: last3.gaPerMatch,
    recentWinRate,
  };
}

/**
 * Calculates expected goals for a team using a weighted blend of
 * season-long and recent-form statistics.
 *
 * Season weight: 60%
 * Recent form weight: 40%
 */
export function expectedGoals(
  attackGFPerGame: number,
  recentGFPerMatch: number,
  defenceGAPerGame: number,
  recentGAPerGame: number
): number {
  // Attacking strength
  const attackSeason = attackGFPerGame;
  const attackRecent = recentGFPerMatch;
  const attack = 0.6 * attackSeason + 0.4 * attackRecent;

  // Opponent defensive weakness (higher GA = weaker defence)
  const defenceSeason = defenceGAPerGame;
  const defenceRecent = recentGAPerGame;
  const defenceGARate = 0.6 * defenceSeason + 0.4 * defenceRecent;

  // Expected goals = geometric mean of attack and opponent's conceding rate
  const raw = Math.sqrt(attack * defenceGARate);

  // Clamp to a reasonable range
  return Math.max(0.3, Math.min(raw, 5.0));
}

/**
 * Calculates a home advantage multiplier.
 * Home team gets a small statistical edge.
 */
export const HOME_ADVANTAGE = 1.1;
