/**
 * Poisson distribution utilities for football score prediction.
 *
 * Poisson(k; λ) = (λ^k * e^-λ) / k!
 *
 * ONE score matrix is the single source of truth for all markets.
 * No random numbers. No separate formulas per market.
 */

/**
 * Returns P(X = k) for a Poisson distribution with mean λ.
 */
export function poissonPMF(lambda: number, k: number): number {
  if (k < 0 || !Number.isInteger(k)) return 0;
  if (lambda <= 0) return k === 0 ? 1 : 0;
  // Use log space to avoid overflow for large k
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 1; i <= k; i++) {
    logP -= Math.log(i);
  }
  return Math.exp(logP);
}

/**
 * Builds a probability matrix P[homeGoals][awayGoals]
 * for scores from 0-0 up to maxGoals x maxGoals.
 */
export function buildScoreMatrix(
  lambdaHome: number,
  lambdaAway: number,
  maxGoals = 6
): number[][] {
  const matrix: number[][] = [];
  for (let h = 0; h <= maxGoals; h++) {
    matrix[h] = [];
    for (let a = 0; a <= maxGoals; a++) {
      matrix[h][a] = poissonPMF(lambdaHome, h) * poissonPMF(lambdaAway, a);
    }
  }
  return matrix;
}

/**
 * Returns { homeWin, draw, awayWin } as fractions (0–1) from the score matrix.
 * Normalises so that homeWin + draw + awayWin === 1.
 */
export function outcomeProbs(matrix: number[][]): {
  homeWin: number;
  draw: number;
  awayWin: number;
} {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;

  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const p = matrix[h][a];
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
    }
  }

  // Normalise to 100% (corrects for truncated maxGoals)
  const total = homeWin + draw + awayWin;
  return {
    homeWin: homeWin / total,
    draw: draw / total,
    awayWin: awayWin / total,
  };
}

/**
 * Returns probabilities for existing goal markets (backward-compat).
 * Values are raw matrix sums (not normalised to 1).
 */
export function goalMarketProbs(matrix: number[][]): {
  over15: number;
  over25: number;
  over35: number;
  btts: number;
} {
  let over15 = 0;
  let over25 = 0;
  let over35 = 0;
  let btts = 0;

  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const p = matrix[h][a];
      const total = h + a;
      if (total > 1.5) over15 += p;
      if (total > 2.5) over25 += p;
      if (total > 3.5) over35 += p;
      if (h > 0 && a > 0) btts += p;
    }
  }

  return { over15, over25, over35, btts };
}

/**
 * Full over/under goal market probabilities for ALL lines (0.5–4.5).
 * Under X = 1 − Over X (complement, both derived from the same sum).
 * Returns fractions (0–1). Round at display time only.
 */
export function overUnderProbs(matrix: number[][]): {
  over05: number; under05: number;
  over15: number; under15: number;
  over25: number; under25: number;
  over35: number; under35: number;
  over45: number; under45: number;
} {
  let over05 = 0;
  let over15 = 0;
  let over25 = 0;
  let over35 = 0;
  let over45 = 0;

  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const p = matrix[h][a];
      const total = h + a;
      if (total > 0.5) over05 += p;
      if (total > 1.5) over15 += p;
      if (total > 2.5) over25 += p;
      if (total > 3.5) over35 += p;
      if (total > 4.5) over45 += p;
    }
  }

  return {
    over05, under05: 1 - over05,
    over15, under15: 1 - over15,
    over25, under25: 1 - over25,
    over35, under35: 1 - over35,
    over45, under45: 1 - over45,
  };
}

/**
 * BTTS Yes / No from score matrix.
 * bttsYes  = P(homeGoals >= 1 AND awayGoals >= 1)
 * bttsNo   = 1 − bttsYes
 */
export function bttsProbs(matrix: number[][]): {
  yes: number;
  no: number;
} {
  let yes = 0;
  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      if (h > 0 && a > 0) yes += matrix[h][a];
    }
  }
  return { yes, no: 1 - yes };
}

/**
 * Double Chance market — derived from 1X2 fractions (full precision).
 * 1X  = homeWin + draw
 * X2  = draw + awayWin
 * 12  = homeWin + awayWin
 * No extra normalisation — these are exact combinations.
 */
export function doubleChanceProbs(
  homeWin: number,
  draw: number,
  awayWin: number
): { oneX: number; xTwo: number; oneTwo: number } {
  return {
    oneX: homeWin + draw,
    xTwo: draw + awayWin,
    oneTwo: homeWin + awayWin,
  };
}

/**
 * Draw No Bet — conditional probability with draw removed from denominator.
 * homeDNB = homeWin / (homeWin + awayWin)
 * awayDNB = awayWin / (homeWin + awayWin)
 * If homeWin + awayWin === 0 (degenerate), returns 0.5 / 0.5.
 */
export function drawNoBetProbs(
  homeWin: number,
  awayWin: number
): { home: number; away: number } {
  const denom = homeWin + awayWin;
  if (denom <= 0) return { home: 0.5, away: 0.5 };
  return {
    home: homeWin / denom,
    away: awayWin / denom,
  };
}

/**
 * Top N most likely scorelines from the score matrix.
 * Sorted descending by probability.
 * Deterministic tie-breaker: homeGoals ascending, then awayGoals ascending.
 * No randomisation.
 */
export function topScorelines(
  matrix: number[][],
  n = 5
): { home: number; away: number; probability: number }[] {
  const lines: { home: number; away: number; probability: number }[] = [];

  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      lines.push({ home: h, away: a, probability: matrix[h][a] });
    }
  }

  return lines
    .sort((a, b) => {
      if (b.probability !== a.probability) return b.probability - a.probability;
      if (a.home !== b.home) return a.home - b.home;
      return a.away - b.away;
    })
    .slice(0, n);
}

/**
 * Team Total Goals — uses the MARGINAL Poisson distribution for each team.
 * P(homeGoals > line) uses lambdaHome only (independent of away goals).
 * P(awayGoals > line) uses lambdaAway only.
 *
 * This is mathematically correct because in the Poisson independence model
 * the marginal distribution of each team's goals IS the Poisson(lambda).
 *
 * Returns fractions (0–1).
 */
export function teamGoalProbs(
  lambdaHome: number,
  lambdaAway: number,
  maxGoals = 6
): {
  home: { over05: number; under05: number; over15: number; under15: number; over25: number; under25: number };
  away: { over05: number; under05: number; over15: number; under15: number; over25: number; under25: number };
} {
  function marginalOver(lambda: number, line: number): number {
    // P(X > line) = 1 - P(X <= floor(line))
    const maxK = Math.floor(line);
    let cumulative = 0;
    for (let k = 0; k <= maxK; k++) {
      cumulative += poissonPMF(lambda, k);
    }
    // cumulative may exceed 1 slightly due to float arithmetic — clamp
    return Math.max(0, Math.min(1, 1 - cumulative));
  }

  // Pre-warm by capping at maxGoals to stay consistent with matrix
  const hOver05 = marginalOver(lambdaHome, 0.5);
  const hOver15 = marginalOver(lambdaHome, 1.5);
  const hOver25 = marginalOver(lambdaHome, 2.5);

  const aOver05 = marginalOver(lambdaAway, 0.5);
  const aOver15 = marginalOver(lambdaAway, 1.5);
  const aOver25 = marginalOver(lambdaAway, 2.5);

  return {
    home: {
      over05: hOver05, under05: 1 - hOver05,
      over15: hOver15, under15: 1 - hOver15,
      over25: hOver25, under25: 1 - hOver25,
    },
    away: {
      over05: aOver05, under05: 1 - aOver05,
      over15: aOver15, under15: 1 - aOver15,
      over25: aOver25, under25: 1 - aOver25,
    },
  };

  void maxGoals; // param kept for API consistency
}
