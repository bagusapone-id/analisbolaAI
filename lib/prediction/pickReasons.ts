import type { Last3Summary, PredictionResult, StandingCalculated } from "../types";
import type { PickAnalysisItem, PickAnalysisInput } from "./pickAnalysis";

export function buildPickReasons(
  pick: PickAnalysisItem,
  input: PickAnalysisInput
): string[] {
  const { homeStanding: hs, awayStanding: as_, homeLast3: hl, awayLast3: al, prediction: p } = input;
  const reasons: string[] = [];
  const totalExpectedGoals = p.expectedHomeGoals + p.expectedAwayGoals;

  if (pick.supportingFactors.includes("Expected goals")) {
    reasons.push(`Expected goals mendukung ${totalExpectedGoals.toFixed(2)} gol total (${p.expectedHomeGoals.toFixed(2)}–${p.expectedAwayGoals.toFixed(2)}).`);
  }
  if (pick.supportingFactors.includes("Recent form")) {
    reasons.push(`Forma terbaru mendukung: ${hl.pointsPerMatch.toFixed(2)} vs ${al.pointsPerMatch.toFixed(2)} poin per laga.`);
  }
  if (pick.supportingFactors.includes("Season standings")) {
    reasons.push(`Data musim mendukung berdasarkan posisi ${hs.position} vs ${as_.position} dan ${hs.points} vs ${as_.points} poin.`);
  }
  if (pick.supportingFactors.includes("Goals for")) {
    reasons.push(`Produktivitas gol mendukung: ${hs.gfPerGame.toFixed(2)} vs ${as_.gfPerGame.toFixed(2)} gol per laga.`);
  }
  if (pick.supportingFactors.includes("Goals against")) {
    reasons.push(`Data pertahanan lawan mendukung dengan rata-rata kebobolan ${hs.gaPerGame.toFixed(2)} dan ${as_.gaPerGame.toFixed(2)} gol per laga.`);
  }
  if (pick.supportingFactors.includes("Poisson distribution")) {
    reasons.push("Distribusi skor model memberikan dukungan pada pilihan ini.");
  }
  if (pick.supportingFactors.includes("Home advantage")) {
    reasons.push("Keuntungan bermain di kandang ikut memperkuat estimasi tim home.");
  }
  if (pick.supportingFactors.includes("Combined attack")) {
    reasons.push(`Kombinasi serangan kedua tim menghasilkan estimasi ${totalExpectedGoals.toFixed(2)} gol.`);
  }
  if (pick.supportingFactors.includes("Both teams scoring")) {
    reasons.push("Statistik mencetak gol kedua tim mendukung peluang BTTS.");
  }

  return reasons.slice(0, 4);
}

export function buildLimitedDataReason(
  homeStanding: StandingCalculated,
  awayStanding: StandingCalculated,
  homeLast3: Last3Summary,
  awayLast3: Last3Summary,
  prediction: PredictionResult
): string {
  const missing: string[] = [];
  if (!Number.isFinite(homeStanding.position) || !Number.isFinite(awayStanding.position)) missing.push("posisi klasemen");
  if (homeLast3.matches.length < 3 || awayLast3.matches.length < 3) missing.push("forma 3 laga terakhir");
  if (!Number.isFinite(prediction.expectedHomeGoals) || !Number.isFinite(prediction.expectedAwayGoals)) missing.push("estimasi gol");
  return missing.length > 0
    ? `Prediction tersedia, tetapi confidence terbatas karena ${missing.join(", ") || "data pendukung"} tidak lengkap.`
    : "Prediction tersedia, tetapi confidence terbatas karena data pendukung belum cukup konsisten.";
}
