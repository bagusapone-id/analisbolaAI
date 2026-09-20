import type { Last3Summary, PredictionMarkets, PredictionResult, StandingCalculated } from "../types";
import { buildPickReasons, buildLimitedDataReason } from "./pickReasons";

export type PickMarket = "1X2" | "DOUBLE_CHANCE" | "GOALS" | "BTTS" | "DNB" | "TEAM_GOALS" | "CORRECT_SCORE";
export type PickConfidence = "Very High" | "High" | "Medium" | "Low" | "Very Low";
export type PickRisk = "Low" | "Medium" | "High";

export interface PickAnalysisItem {
  market: PickMarket;
  selection: string;
  probability: number;
  confidence: PickConfidence;
  risk: PickRisk;
  pickScore: number;
  reasons: string[];
  supportingFactors: string[];
  supportCount: number;
  supportTotal: number;
}

export interface PickAnalysisInput {
  prediction: PredictionResult;
  homeStanding: StandingCalculated;
  awayStanding: StandingCalculated;
  homeLast3: Last3Summary;
  awayLast3: Last3Summary;
}

export interface PickAnalysisResult {
  strongestPick: PickAnalysisItem | null;
  alternativePicks: PickAnalysisItem[];
  marketAnalysis: PickAnalysisItem[];
  summary: {
    strongestMarket: PickMarket | null;
    strongestSelection: string | null;
    probability: number | null;
  };
  dataSufficient: boolean;
  dataNote?: string;
}

type Factor = { label: string; supported: boolean };
type Candidate = { market: PickMarket; selection: string; probability: number; factors: Factor[] };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const finitePct = (value: number) => Number.isFinite(value) ? clamp(Math.round(value), 0, 100) : 0;

export function analyzePicks(input: PickAnalysisInput): PickAnalysisResult {
  const { prediction: p, homeStanding: hs, awayStanding: as_, homeLast3: hl, awayLast3: al } = input;
  const markets = p.markets;
  if (!markets || !hasSufficientData(input)) {
    return {
      strongestPick: null,
      alternativePicks: [],
      marketAnalysis: [],
      summary: { strongestMarket: null, strongestSelection: null, probability: null },
      dataSufficient: false,
      dataNote: buildLimitedDataReason(hs, as_, hl, al, p),
    };
  }

  const totalXg = p.expectedHomeGoals + p.expectedAwayGoals;
  const recentTotalGoals = hl.gfPerMatch + hl.gaPerMatch + al.gfPerMatch + al.gaPerMatch;
  const homeSeasonBetter = hs.pointsPerGame > as_.pointsPerGame || hs.goalDifference > as_.goalDifference;
  const awaySeasonBetter = as_.pointsPerGame > hs.pointsPerGame || as_.goalDifference > hs.goalDifference;
  const homeFormBetter = hl.pointsPerMatch > al.pointsPerMatch;
  const awayFormBetter = al.pointsPerMatch > hl.pointsPerMatch;
  const closeMatch = Math.abs(hs.pointsPerGame - as_.pointsPerGame) <= 0.25 && Math.abs(p.expectedHomeGoals - p.expectedAwayGoals) <= 0.35;
  const candidates: Candidate[] = [];

  add(candidates, "1X2", "Home Win", markets.result1X2.home, [
    factor("Season standings", homeSeasonBetter), factor("Recent form", homeFormBetter),
    factor("Goals for", hs.gfPerGame > as_.gfPerGame), factor("Goals against", hs.gaPerGame < as_.gaPerGame),
    factor("Home advantage", p.expectedHomeGoals > p.expectedAwayGoals), factor("Poisson distribution", p.homeWin > p.awayWin),
  ]);
  add(candidates, "1X2", "Draw", markets.result1X2.draw, [
    factor("Season standings", closeMatch), factor("Recent form", Math.abs(hl.pointsPerMatch - al.pointsPerMatch) <= 0.5),
    factor("Goals for", Math.abs(hs.gfPerGame - as_.gfPerGame) <= 0.4), factor("Goals against", Math.abs(hs.gaPerGame - as_.gaPerGame) <= 0.4),
    factor("Poisson distribution", markets.result1X2.draw >= 25),
  ]);
  add(candidates, "1X2", "Away Win", markets.result1X2.away, [
    factor("Season standings", awaySeasonBetter), factor("Recent form", awayFormBetter),
    factor("Goals for", as_.gfPerGame > hs.gfPerGame), factor("Goals against", as_.gaPerGame < hs.gaPerGame),
    factor("Poisson distribution", p.awayWin > p.homeWin),
  ]);

  add(candidates, "DOUBLE_CHANCE", "1X", markets.doubleChance.oneX, [
    factor("Season standings", homeSeasonBetter || closeMatch), factor("Recent form", homeFormBetter || Math.abs(hl.pointsPerMatch - al.pointsPerMatch) <= 0.5),
    factor("Home advantage", p.homeWin >= p.awayWin), factor("Poisson distribution", markets.doubleChance.oneX >= 60),
  ]);
  add(candidates, "DOUBLE_CHANCE", "X2", markets.doubleChance.xTwo, [
    factor("Season standings", awaySeasonBetter || closeMatch), factor("Recent form", awayFormBetter || Math.abs(hl.pointsPerMatch - al.pointsPerMatch) <= 0.5),
    factor("Poisson distribution", markets.doubleChance.xTwo >= 60),
  ]);
  add(candidates, "DOUBLE_CHANCE", "12", markets.doubleChance.oneTwo, [
    factor("Expected goals", totalXg >= 2.2), factor("Recent form", recentTotalGoals >= 2.4),
    factor("Poisson distribution", markets.doubleChance.oneTwo >= 70),
  ]);

  const overLines = [
    ["Over 0.5", markets.overUnder.over05, 0.5], ["Over 1.5", markets.overUnder.over15, 1.5],
    ["Over 2.5", markets.overUnder.over25, 2.5], ["Over 3.5", markets.overUnder.over35, 3.5], ["Over 4.5", markets.overUnder.over45, 4.5],
  ] as const;
  const underLines = [
    ["Under 0.5", markets.overUnder.under05, 0.5], ["Under 1.5", markets.overUnder.under15, 1.5],
    ["Under 2.5", markets.overUnder.under25, 2.5], ["Under 3.5", markets.overUnder.under35, 3.5], ["Under 4.5", markets.overUnder.under45, 4.5],
  ] as const;
  overLines.forEach(([selection, probability, line]) => add(candidates, "GOALS", selection, probability, [
    factor("Expected goals", totalXg > line + 0.5), factor("Recent form", recentTotalGoals > line),
    factor("Goals for", hs.gfPerGame + as_.gfPerGame > line), factor("Goals against", hs.gaPerGame + as_.gaPerGame > line),
    factor("Combined attack", hs.gfPerGame + as_.gfPerGame >= 2), factor("Poisson distribution", probability >= 60),
  ]));
  underLines.forEach(([selection, probability, line]) => add(candidates, "GOALS", selection, probability, [
    factor("Expected goals", totalXg < line + 0.5), factor("Recent form", recentTotalGoals < line + 1),
    factor("Goals for", hs.gfPerGame + as_.gfPerGame < line + 1), factor("Goals against", hs.gaPerGame + as_.gaPerGame < line + 1),
    factor("Poisson distribution", probability >= 60),
  ]));

  add(candidates, "BTTS", "Yes", markets.btts.yes, [
    factor("Expected goals", p.expectedHomeGoals >= 0.8 && p.expectedAwayGoals >= 0.8),
    factor("Recent form", hl.gfPerMatch >= 0.8 && al.gfPerMatch >= 0.8), factor("Goals for", hs.gfPerGame >= 0.8 && as_.gfPerGame >= 0.8),
    factor("Goals against", hs.gaPerGame >= 0.8 && as_.gaPerGame >= 0.8), factor("Both teams scoring", markets.btts.yes >= 55),
  ]);
  add(candidates, "BTTS", "No", markets.btts.no, [
    factor("Expected goals", p.expectedHomeGoals < 0.8 || p.expectedAwayGoals < 0.8),
    factor("Recent form", hl.gfPerMatch < 0.8 || al.gfPerMatch < 0.8), factor("Goals for", hs.gfPerGame < 0.8 || as_.gfPerGame < 0.8),
    factor("Poisson distribution", markets.btts.no >= 55),
  ]);

  add(candidates, "DNB", "Home DNB", markets.drawNoBet.home, [
    factor("Season standings", homeSeasonBetter), factor("Recent form", homeFormBetter), factor("Home advantage", p.homeWin >= p.awayWin),
    factor("Poisson distribution", markets.drawNoBet.home >= 55),
  ]);
  add(candidates, "DNB", "Away DNB", markets.drawNoBet.away, [
    factor("Season standings", awaySeasonBetter), factor("Recent form", awayFormBetter), factor("Poisson distribution", markets.drawNoBet.away >= 55),
  ]);

  markets.correctScore.forEach((score) => add(candidates, "CORRECT_SCORE", `${score.home}-${score.away}`, score.probability, [
    factor("Expected goals", Math.abs(score.home - p.expectedHomeGoals) <= 1 && Math.abs(score.away - p.expectedAwayGoals) <= 1),
    factor("Recent form", Math.abs(score.home - hl.gfPerMatch) <= 1 && Math.abs(score.away - al.gfPerMatch) <= 1),
    factor("Poisson distribution", score.probability >= 15),
  ]));

  addTeamGoals(candidates, "Home", markets.teamGoals.home.over05, "Over 0.5", p.expectedHomeGoals, hs.gfPerGame, hl.gfPerMatch, true);
  addTeamGoals(candidates, "Home", markets.teamGoals.home.over15, "Over 1.5", p.expectedHomeGoals, hs.gfPerGame, hl.gfPerMatch, true);
  addTeamGoals(candidates, "Home", markets.teamGoals.home.over25, "Over 2.5", p.expectedHomeGoals, hs.gfPerGame, hl.gfPerMatch, true);
  addTeamGoals(candidates, "Away", markets.teamGoals.away.over05, "Over 0.5", p.expectedAwayGoals, as_.gfPerGame, al.gfPerMatch, false);
  addTeamGoals(candidates, "Away", markets.teamGoals.away.over15, "Over 1.5", p.expectedAwayGoals, as_.gfPerGame, al.gfPerMatch, false);
  addTeamGoals(candidates, "Away", markets.teamGoals.away.over25, "Over 2.5", p.expectedAwayGoals, as_.gfPerGame, al.gfPerMatch, false);
  addTeamGoalUnder(candidates, "Home", markets.teamGoals.home.under05, "Under 0.5", p.expectedHomeGoals, hs.gfPerGame, hl.gfPerMatch);
  addTeamGoalUnder(candidates, "Home", markets.teamGoals.home.under15, "Under 1.5", p.expectedHomeGoals, hs.gfPerGame, hl.gfPerMatch);
  addTeamGoalUnder(candidates, "Home", markets.teamGoals.home.under25, "Under 2.5", p.expectedHomeGoals, hs.gfPerGame, hl.gfPerMatch);
  addTeamGoalUnder(candidates, "Away", markets.teamGoals.away.under05, "Under 0.5", p.expectedAwayGoals, as_.gfPerGame, al.gfPerMatch);
  addTeamGoalUnder(candidates, "Away", markets.teamGoals.away.under15, "Under 1.5", p.expectedAwayGoals, as_.gfPerGame, al.gfPerMatch);
  addTeamGoalUnder(candidates, "Away", markets.teamGoals.away.under25, "Under 2.5", p.expectedAwayGoals, as_.gfPerGame, al.gfPerMatch);

  const consistent = hasConsistentMarkets(p);
  const analysis = candidates.map((candidate) => toAnalysisItem(candidate, input, consistent)).sort((a, b) => b.pickScore - a.pickScore || b.probability - a.probability);
  const strongestPick = analysis[0] ?? null;
  const alternatives = analysis.filter((pick) => pick !== strongestPick).slice(0, 3);
  return {
    strongestPick,
    alternativePicks: alternatives,
    marketAnalysis: analysis,
    summary: {
      strongestMarket: strongestPick?.market ?? null,
      strongestSelection: strongestPick?.selection ?? null,
      probability: strongestPick?.probability ?? null,
    },
    dataSufficient: true,
    dataNote: consistent ? undefined : "Prediction tersedia, tetapi confidence terbatas karena beberapa market tidak konsisten dengan hasil prediction utama.",
  };
}

function add(candidates: Candidate[], market: PickMarket, selection: string, probability: number, factors: Factor[]) {
  candidates.push({ market, selection, probability: finitePct(probability), factors });
}

function factor(label: string, supported: boolean): Factor { return { label, supported }; }

function addTeamGoals(candidates: Candidate[], team: string, probability: number, line: string, expected: number, seasonGF: number, recentGF: number, home: boolean) {
  add(candidates, "TEAM_GOALS", `${team} ${line}`, probability, [
    factor("Expected goals", expected >= (line === "Over 0.5" ? 0.8 : line === "Over 1.5" ? 1.4 : 2.1)),
    factor("Goals for", seasonGF >= (line === "Over 0.5" ? 0.8 : line === "Over 1.5" ? 1.3 : 1.8)),
    factor("Recent form", recentGF >= (line === "Over 0.5" ? 0.7 : line === "Over 1.5" ? 1.0 : 1.5)),
    factor("Home advantage", home && expected >= 1),
    factor("Poisson distribution", probability >= 60),
  ]);
}

function addTeamGoalUnder(candidates: Candidate[], team: string, probability: number, line: string, expected: number, seasonGF: number, recentGF: number) {
  const threshold = line === "Under 0.5" ? 0.8 : line === "Under 1.5" ? 1.4 : 2.1;
  add(candidates, "TEAM_GOALS", `${team} ${line}`, probability, [
    factor("Expected goals", expected < threshold),
    factor("Goals for", seasonGF < threshold),
    factor("Recent form", recentGF < threshold),
    factor("Poisson distribution", probability >= 60),
  ]);
}

function toAnalysisItem(candidate: Candidate, input: PickAnalysisInput, consistent: boolean): PickAnalysisItem {
  const supportCount = candidate.factors.filter((item) => item.supported).length;
  const supportTotal = candidate.factors.length;
  const supportRatio = supportTotal > 0 ? supportCount / supportTotal : 0;
  const probabilityScore = candidate.probability * 0.7;
  const pickScore = Math.round(clamp(probabilityScore + supportRatio * 30 + actionabilityAdjustment(candidate) - (consistent ? 0 : 8), 0, 100));
  const confidence = getConfidence(candidate.probability, supportRatio, consistent);
  const risk = getRisk(candidate.probability, supportRatio, candidate.market, consistent);
  const item: PickAnalysisItem = {
    market: candidate.market,
    selection: candidate.selection,
    probability: candidate.probability,
    confidence,
    risk,
    pickScore,
    reasons: [],
    supportingFactors: candidate.factors.filter((factorItem) => factorItem.supported).map((factorItem) => factorItem.label),
    supportCount,
    supportTotal,
  };
  item.reasons = buildPickReasons(item, input);
  return item;
}

function actionabilityAdjustment(candidate: Candidate): number {
  if (candidate.market === "TEAM_GOALS") {
    if (candidate.selection.endsWith("Over 0.5")) return -8;
    if (candidate.selection.endsWith("Over 1.5")) return -2;
  }
  if (candidate.market === "GOALS" && candidate.selection === "Over 1.5") return 4;
  if (candidate.market === "GOALS" && candidate.selection === "Under 4.5") return -8;
  if (candidate.market === "CORRECT_SCORE") return -5;
  return 0;
}

function getConfidence(probability: number, supportRatio: number, consistent: boolean): PickConfidence {
  if (consistent && probability >= 75 && supportRatio >= 0.7) return "Very High";
  if (probability >= 60 && supportRatio >= 0.55) return "High";
  if (probability >= 50 && supportRatio >= 0.4) return "Medium";
  if (probability >= 35 && supportRatio >= 0.25) return "Low";
  return "Very Low";
}

function getRisk(probability: number, supportRatio: number, market: PickMarket, consistent: boolean): PickRisk {
  if (market === "CORRECT_SCORE") return "High";
  if (!consistent) return "High";
  if (probability >= 70 && supportRatio >= 0.6) return "Low";
  if (probability >= 50 && supportRatio >= 0.4) return "Medium";
  return "High";
}

function hasSufficientData(input: PickAnalysisInput): boolean {
  const { prediction: p, homeStanding: hs, awayStanding: as_, homeLast3: hl, awayLast3: al } = input;
  const values = [p.expectedHomeGoals, p.expectedAwayGoals, hs.pointsPerGame, as_.pointsPerGame, hs.gfPerGame, as_.gfPerGame];
  return values.every(Number.isFinite) && hl.matches.length >= 3 && al.matches.length >= 3;
}

function hasConsistentMarkets(prediction: PredictionResult): boolean {
  const markets = prediction.markets;
  if (!markets) return false;
  const pairs = [
    [markets.overUnder.over05, markets.overUnder.under05], [markets.overUnder.over15, markets.overUnder.under15],
    [markets.overUnder.over25, markets.overUnder.under25], [markets.overUnder.over35, markets.overUnder.under35],
    [markets.overUnder.over45, markets.overUnder.under45], [markets.btts.yes, markets.btts.no],
    [markets.drawNoBet.home, markets.drawNoBet.away], [markets.teamGoals.home.over05, markets.teamGoals.home.under05],
    [markets.teamGoals.home.over15, markets.teamGoals.home.under15], [markets.teamGoals.home.over25, markets.teamGoals.home.under25],
    [markets.teamGoals.away.over05, markets.teamGoals.away.under05], [markets.teamGoals.away.over15, markets.teamGoals.away.under15],
    [markets.teamGoals.away.over25, markets.teamGoals.away.under25],
  ];
  const finite = pairs.flat().every(Number.isFinite);
  const closeTo100 = pairs.every(([left, right]) => Math.abs(left + right - 100) <= 1);
  const resultSum = markets.result1X2.home + markets.result1X2.draw + markets.result1X2.away;
  const legacyMatches = prediction.homeWin === markets.result1X2.home && prediction.draw === markets.result1X2.draw && prediction.awayWin === markets.result1X2.away;
  return finite && closeTo100 && Math.abs(resultSum - 100) <= 1 && legacyMatches;
}

export function marketCategoryLabel(market: PickMarket): string {
  return market === "DOUBLE_CHANCE" ? "Double Chance" : market === "TEAM_GOALS" ? "Team Goals" : market === "CORRECT_SCORE" ? "Correct Score" : market;
}

export type { PredictionMarkets };
