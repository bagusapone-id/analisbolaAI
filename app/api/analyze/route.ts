import { NextRequest, NextResponse } from "next/server";
import type { MatchData } from "@/lib/types";
import { analyzePicks } from "@/lib/prediction/pickAnalysis";
import { requireServerUser, jsonError } from "@/lib/server-auth";

type Locale = "id" | "en";

export async function POST(req: NextRequest) {
  // Require authenticated user — prevents unauthenticated OpenAI credit drain
  try {
    await requireServerUser(req);
  } catch {
    return jsonError("Unauthorized", 401);
  }

  const body = (await req.json()) as {
    matchData: Omit<MatchData, "aiAnalysis" | "createdAt" | "userId">;
    locale?: Locale;
  };

  const { matchData, locale = "id" } = body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "your_openai_api_key") {
    return NextResponse.json({
      analysis: generateFallbackAnalysis(matchData, locale),
    });
  }

  const prompt = buildPrompt(matchData, locale);
  const systemPrompt =
    locale === "id"
      ? "Kamu adalah asisten analitik sepak bola. Jelaskan prediksi statistik dengan jelas dalam Bahasa Indonesia yang natural dan mudah dipahami. Jangan pernah mengklaim kemenangan pasti. Selalu gunakan frasa seperti 'model memperkirakan', 'estimasi probabilitas', 'berdasarkan data yang tersedia'. Jangan menyebut cedera, susunan pemain, xG, head-to-head, atau odds karena data tersebut tidak tersedia."
      : "You are a football analytics assistant. Explain statistical predictions clearly. Never claim guaranteed wins. Always use phrases like 'model estimates', 'estimated probability', 'based on the provided data'. Do not mention injuries, lineups, xG, head-to-head, or odds as they are not available.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: prompt },
        ],
        max_tokens: 900,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ analysis: generateFallbackAnalysis(matchData, locale) });
    }

    const data = await response.json();
    const analysis =
      data.choices?.[0]?.message?.content ?? generateFallbackAnalysis(matchData, locale);

    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ analysis: generateFallbackAnalysis(matchData, locale) });
  }
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(
  matchData: Omit<MatchData, "aiAnalysis" | "createdAt" | "userId">,
  locale: Locale
): string {
  const {
    competition, homeTeam, awayTeam,
    homeStanding: hs, awayStanding: as_,
    homeLast3: hl, awayLast3: al,
    prediction: p,
  } = matchData;
  const pickAnalysis = analyzePicks({
    prediction: p,
    homeStanding: hs,
    awayStanding: as_,
    homeLast3: hl,
    awayLast3: al,
  });
  const strongest = pickAnalysis.strongestPick;

  const dataBlock = `
Pertandingan: ${homeTeam} vs ${awayTeam} (${competition})

DATA ${homeTeam.toUpperCase()} — KLASEMEN:
- Posisi: ${hs.position} | Main: ${hs.played} | Poin: ${hs.points} (${hs.pointsPerGame}/laga)
- Hasil: ${hs.wins}M ${hs.draws}S ${hs.losses}K | Win rate: ${Math.round(hs.winRate * 100)}%
- Gol: ${hs.goalsFor} masuk, ${hs.goalsAgainst} kebobolan (GD: ${hs.goalDifference})

DATA ${homeTeam.toUpperCase()} — 3 LAGA TERAKHIR:
- Hasil: ${hl.wins}M ${hl.draws}S ${hl.losses}K
- Gol: ${hl.goalsFor} masuk, ${hl.goalsAgainst} kebobolan | Poin/laga: ${hl.pointsPerMatch}

DATA ${awayTeam.toUpperCase()} — KLASEMEN:
- Posisi: ${as_.position} | Main: ${as_.played} | Poin: ${as_.points} (${as_.pointsPerGame}/laga)
- Hasil: ${as_.wins}M ${as_.draws}S ${as_.losses}K | Win rate: ${Math.round(as_.winRate * 100)}%
- Gol: ${as_.goalsFor} masuk, ${as_.goalsAgainst} kebobolan (GD: ${as_.goalDifference})

DATA ${awayTeam.toUpperCase()} — 3 LAGA TERAKHIR:
- Hasil: ${al.wins}M ${al.draws}S ${al.losses}K
- Gol: ${al.goalsFor} masuk, ${al.goalsAgainst} kebobolan | Poin/laga: ${al.pointsPerMatch}

PREDIKSI MODEL STATISTIK:
- Menang ${homeTeam}: ${p.homeWin}% | Seri: ${p.draw}% | Menang ${awayTeam}: ${p.awayWin}%
- Estimasi Gol: ${homeTeam} ${p.expectedHomeGoals} — ${awayTeam} ${p.expectedAwayGoals}
- Over 2.5: ${p.over25}% | Kedua Tim Cetak Gol: ${p.btts}%

PICK ANALYSIS DETERMINISTIK (SUMBER UTAMA PROBABILITAS):
- Strongest Pick: ${strongest ? `${strongest.selection} (${strongest.probability}%, ${strongest.confidence}, ${strongest.risk} risk)` : "Tidak cukup data"}
- Faktor pendukung: ${strongest?.supportingFactors.join(", ") || "data pendukung belum cukup"}
- Alternatif: ${pickAnalysis.alternativePicks.map((pick) => `${pick.selection} (${pick.probability}%)`).join(", ") || "tidak ada"}
`.trim();

  if (locale === "id") {
    return `${dataBlock}

Tulis analisis terstruktur dalam Bahasa Indonesia dengan bagian-bagian berikut:
1. Ringkasan Laga
2. Analisis ${homeTeam}
3. Analisis ${awayTeam}
4. Faktor Kunci
5. Analisis Gol
6. Kesimpulan Prediksi
7. Keterbatasan Data

Setiap bagian 2–3 kalimat. Jangan mengarang data yang tidak tercantum di atas. Gunakan bahasa yang natural dan mudah dipahami oleh penggemar sepak bola awam.`;
  }

  return `${dataBlock}

Write a structured analysis in English with these sections:
1. Match Overview
2. ${homeTeam} Analysis
3. ${awayTeam} Analysis
4. Key Factors
5. Goal Analysis
6. Prediction Summary
7. Data Limitations

Keep each section concise (2–3 sentences). Do not invent data not provided above.`;
}

// ─── Fallback (no API key) ────────────────────────────────────────────────────

function generateFallbackAnalysis(
  matchData: Omit<MatchData, "aiAnalysis" | "createdAt" | "userId">,
  locale: Locale
): string {
  const {
    homeTeam, awayTeam,
    homeStanding: hs, awayStanding: as_,
    homeLast3: hl, awayLast3: al,
    prediction: p,
  } = matchData;
  const fallbackPick = analyzePicks({
    prediction: p,
    homeStanding: hs,
    awayStanding: as_,
    homeLast3: hl,
    awayLast3: al,
  }).strongestPick;

  const homeFormBetter  = hl.pointsPerMatch >= al.pointsPerMatch;
  const betterFormTeam  = homeFormBetter ? homeTeam : awayTeam;
  const betterFormPts   = Math.max(hl.pointsPerMatch, al.pointsPerMatch).toFixed(2);
  const favorite        =
    p.homeWin > p.awayWin ? homeTeam :
    p.awayWin > p.homeWin ? awayTeam : null;
  const topScore        = p.topScorelines[0];

  if (locale === "id") {
    return `**Ringkasan Laga**
${homeTeam} menjamu ${awayTeam} di ${matchData.competition}. Model memperkirakan probabilitas kemenangan tuan rumah sebesar ${p.homeWin}%, seri ${p.draw}%, dan kemenangan tamu ${p.awayWin}% berdasarkan data statistik yang tersedia.

**Analisis ${homeTeam}**
${homeTeam} berada di posisi ${hs.position} dengan ${hs.points} poin dari ${hs.played} laga (rata-rata ${hs.pointsPerGame} poin/laga). Forma terakhir menunjukkan ${hl.wins}M ${hl.draws}S ${hl.losses}K dari 3 laga terakhir dengan ${hl.goalsFor} gol yang dicetak.

**Analisis ${awayTeam}**
${awayTeam} berada di posisi ${as_.position} dengan ${as_.points} poin dari ${as_.played} laga (rata-rata ${as_.pointsPerGame} poin/laga). Dalam 3 laga terakhir, mereka mencatat ${al.wins}M ${al.draws}S ${al.losses}K dengan ${al.goalsFor} gol yang dicetak.

**Faktor Kunci**
  ${betterFormTeam} menunjukkan forma terkini yang lebih baik dengan rata-rata ${betterFormPts} poin per laga dalam 3 pertandingan terakhir. Faktor keuntungan bermain di kandang sudah diperhitungkan dalam estimasi gol model.${fallbackPick ? ` Pick terkuat model adalah ${fallbackPick.selection} dengan probabilitas ${fallbackPick.probability}% dan confidence ${fallbackPick.confidence}.` : " Data pendukung belum cukup untuk menentukan pick terkuat."}

**Analisis Gol**
Model memperkirakan estimasi gol ${p.expectedHomeGoals} (tuan rumah) dan ${p.expectedAwayGoals} (tamu). Probabilitas Over 2.5 gol diestimasi ${p.over25}%, sementara Kedua Tim Cetak Gol diestimasi ${p.btts}%.

**Kesimpulan Prediksi**
${favorite ? `Berdasarkan data yang tersedia, model memperkirakan ${favorite} sebagai tim yang lebih diunggulkan.` : "Berdasarkan data yang tersedia, model memperkirakan laga ini akan berlangsung seimbang."} Skor yang paling mungkin terjadi adalah ${topScore?.home ?? 1}–${topScore?.away ?? 0}. Semua angka merupakan estimasi model, bukan jaminan hasil.

**Keterbatasan Data**
Analisis ini hanya berdasarkan data klasemen dan 3 laga terakhir yang diinput. Faktor seperti cedera pemain, susunan pemain, rekam jejak head-to-head, dan konteks pertandingan tidak tersedia dan tidak diperhitungkan. Gunakan sebagai referensi Prediksi ini dihasilkan oleh analisis AI berdasarkan data dan statistik. Hasil estimasi ini tidak menjamin hasil akhir pertandingan.`;
  }

  return `**Match Overview**
${homeTeam} host ${awayTeam} in ${matchData.competition}. The model estimates a ${p.homeWin}% probability of a home win, ${p.draw}% draw, and ${p.awayWin}% away win based on the provided statistical data.

**${homeTeam} Analysis**
${homeTeam} sit in position ${hs.position} with ${hs.points} points from ${hs.played} games (${hs.pointsPerGame} pts/game). Their recent form shows ${hl.wins}W ${hl.draws}D ${hl.losses}L in the last 3 matches with ${hl.goalsFor} goals scored.

**${awayTeam} Analysis**
${awayTeam} are in position ${as_.position} with ${as_.points} points from ${as_.played} games (${as_.pointsPerGame} pts/game). Their last 3 matches resulted in ${al.wins}W ${al.draws}D ${al.losses}L with ${al.goalsFor} goals scored.

**Key Factors**
  ${betterFormTeam} show stronger recent form with ${betterFormPts} points per match in the last 3 games. The home advantage factor is incorporated into the model's estimated goal expectations.${fallbackPick ? ` The model's strongest pick is ${fallbackPick.selection} at ${fallbackPick.probability}% probability with ${fallbackPick.confidence} confidence.` : " There is not enough supporting data to determine a strongest pick."}

**Goal Analysis**
The model estimates expected goals of ${p.expectedHomeGoals} (home) and ${p.expectedAwayGoals} (away). An Over 2.5 outcome has an estimated probability of ${p.over25}%, while Both Teams to Score is estimated at ${p.btts}%.

**Prediction Summary**
${favorite ? `Based on the provided data, the model estimates ${favorite} as the more likely winner.` : "Based on the provided data, the model estimates this as an evenly contested match."} The most likely scoreline is ${topScore?.home ?? 1}–${topScore?.away ?? 0}. All probabilities are model estimates only.

**Data Limitations**
This analysis is based solely on standings and last 3 match data provided. Injuries, lineups, head-to-head records, and other contextual factors are not available and have not been considered. This prediction is generated by AI analysis based on data and statistics. Model estimates do not guarantee the final match outcome.`;
}
