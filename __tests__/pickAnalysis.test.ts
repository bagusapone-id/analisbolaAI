import { describe, expect, it } from "vitest";
import { calculateLast3, calculateStanding } from "../lib/calculations";
import { runPrediction } from "../lib/prediction/prediction";
import { analyzePicks } from "../lib/prediction/pickAnalysis";
import type { PredictionResult } from "../lib/types";

const homeStanding = calculateStanding({ position: "3", wins: "12", draws: "4", losses: "4", goalsFor: "36", goalsAgainst: "22", goalDifference: "14" });
const awayStanding = calculateStanding({ position: "8", wins: "8", draws: "5", losses: "7", goalsFor: "28", goalsAgainst: "27", goalDifference: "1" });
const homeLast3 = calculateLast3([
  { venue: "HOME", goalsFor: "2", goalsAgainst: "1" },
  { venue: "AWAY", goalsFor: "2", goalsAgainst: "1" },
  { venue: "HOME", goalsFor: "1", goalsAgainst: "0" },
]);
const awayLast3 = calculateLast3([
  { venue: "AWAY", goalsFor: "1", goalsAgainst: "2" },
  { venue: "HOME", goalsFor: "2", goalsAgainst: "1" },
  { venue: "AWAY", goalsFor: "1", goalsAgainst: "1" },
]);

function basePrediction(): PredictionResult {
  return runPrediction(homeStanding, awayStanding, homeLast3, awayLast3);
}

function predictionWith(overrides: Partial<NonNullable<PredictionResult["markets"]>>): PredictionResult {
  const prediction = JSON.parse(JSON.stringify(basePrediction())) as PredictionResult;
  prediction.markets = { ...prediction.markets!, ...overrides };
  return prediction;
}

function input(prediction: PredictionResult) {
  return { prediction, homeStanding, awayStanding, homeLast3, awayLast3 };
}

describe("analyzePicks", () => {
  it("selects Over 1.5 when it is stronger than a 51% Home Win", () => {
    const prediction = predictionWith({
      result1X2: { home: 51, draw: 25, away: 24 },
      overUnder: { over05: 60, under05: 40, over15: 85, under15: 15, over25: 48, under25: 52, over35: 25, under35: 75, over45: 30, under45: 70 },
      btts: { yes: 45, no: 55 },
      doubleChance: { oneX: 60, xTwo: 49, oneTwo: 75 },
      drawNoBet: { home: 58, away: 42 },
      teamGoals: {
        home: { over05: 50, under05: 50, over15: 50, under15: 50, over25: 50, under25: 50 },
        away: { over05: 50, under05: 50, over15: 50, under15: 50, over25: 50, under25: 50 },
      },
    });

    const result = analyzePicks(input(prediction));
    expect(result.strongestPick?.selection).toBe("Over 1.5");
    expect(result.alternativePicks.length).toBeLessThanOrEqual(3);
  });

  it("can select Home Win when probability and supporting indicators are strong", () => {
    const prediction = predictionWith({
      result1X2: { home: 72, draw: 16, away: 12 },
      overUnder: { over05: 50, under05: 50, over15: 65, under15: 35, over25: 42, under25: 58, over35: 50, under35: 50, over45: 30, under45: 70 },
      btts: { yes: 42, no: 58 },
      doubleChance: { oneX: 60, xTwo: 28, oneTwo: 60 },
      drawNoBet: { home: 65, away: 35 },
      teamGoals: {
        home: { over05: 50, under05: 50, over15: 50, under15: 50, over25: 50, under25: 50 },
        away: { over05: 50, under05: 50, over15: 50, under15: 50, over25: 50, under25: 50 },
      },
    });

    const result = analyzePicks(input(prediction));
    expect(result.strongestPick?.selection).toBe("Home Win");
    expect(["Very High", "High"]).toContain(result.strongestPick?.confidence);
  });

  it("does not mark a high-probability pick as Very High when indicators disagree", () => {
    const prediction = predictionWith({
      result1X2: { home: 90, draw: 5, away: 5 },
      overUnder: { over05: 55, under05: 45, over15: 35, under15: 65, over25: 15, under25: 85, over35: 5, under35: 95, over45: 30, under45: 70 },
      btts: { yes: 20, no: 80 },
      doubleChance: { oneX: 95, xTwo: 10, oneTwo: 95 },
      drawNoBet: { home: 95, away: 5 },
    });

    const result = analyzePicks({
      prediction,
      homeStanding: awayStanding,
      awayStanding: homeStanding,
      homeLast3: awayLast3,
      awayLast3: homeLast3,
    });
    const homeWin = result.marketAnalysis.find((pick) => pick.selection === "Home Win");
    expect(homeWin?.probability).toBe(90);
    expect(homeWin?.confidence).not.toBe("Very High");
  });

  it("returns no strongest pick when the extended market data is unavailable", () => {
    const prediction = basePrediction();
    delete prediction.markets;

    const result = analyzePicks(input(prediction));
    expect(result.strongestPick).toBeNull();
    expect(result.dataSufficient).toBe(false);
    expect(result.dataNote).toMatch(/confidence|data/i);
  });
});
