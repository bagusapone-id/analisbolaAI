import type {
  StandingForm,
  StandingCalculated,
  RecentMatchForm,
  Last3Summary,
  RecentMatchCalculated,
  Venue,
} from "./types";

// ─── Standing Calculations ───────────────────────────────────────────────────

export interface StandingValidation {
  errors: string[];
  warnings: string[];
}

export function validateStanding(form: StandingForm): StandingValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredFields: Array<{ key: keyof StandingForm; label: string }> = [
    { key: "position", label: "Pos" },
    { key: "goalDifference", label: "GD" },
    { key: "wins", label: "W" },
    { key: "draws", label: "D" },
    { key: "losses", label: "L" },
    { key: "goalsFor", label: "F" },
    { key: "goalsAgainst", label: "A" },
  ];

  requiredFields.forEach(({ key, label }) => {
    const value = form[key];
    if (value === undefined || value === null || String(value).trim() === "") {
      if (key === "position") {
        warnings.push(`Posisi klasemen belum diisi. AI akan menganalisis dengan data posisi yang kurang lengkap.`);
        return;
      }
      errors.push(`${label} wajib diisi.`);
    }
  });

  if (errors.length > 0) {
    return { errors, warnings };
  }

  const position = form.position !== undefined && form.position !== null ? parseInt(form.position, 10) || 0 : 0;
  const w = parseInt(form.wins, 10) || 0;
  const d = parseInt(form.draws, 10) || 0;
  const l = parseInt(form.losses, 10) || 0;
  const gf = parseInt(form.goalsFor, 10) || 0;
  const ga = parseInt(form.goalsAgainst, 10) || 0;
  const gd = parseInt(form.goalDifference, 10) || 0;

  if (gf - ga !== gd) {
    errors.push(`GD harus sesuai F(${gf}) − A(${ga}) = ${gf - ga}, tapi diinput ${gd}`);
  }

  if (w === 0 && d === 0 && l === 0 && gf === 0 && ga === 0) {
    warnings.push("Data klasemen masih 0. AI akan menganalisis dengan data yang tidak akurat.");
  }

  const totalMatches = w + d + l;
  if (totalMatches === 0 && (gf > 0 || ga > 0)) {
    warnings.push("Jumlah pertandingan belum sesuai dengan data statistik. Standings harus konsisten agar AI bisa menganalisis dengan benar.");
  }

  if (totalMatches > 0 && gf + ga === 0) {
    warnings.push("Belum ada data gol yang masuk. Standings harus sesuai agar analisis AI tetap akurat.");
  }

  return { errors, warnings };
}

export function calculateStanding(form: StandingForm): StandingCalculated {
  const position = parseInt(form.position, 10) || 0;
  const wins = parseInt(form.wins, 10) || 0;
  const draws = parseInt(form.draws, 10) || 0;
  const losses = parseInt(form.losses, 10) || 0;
  const goalsFor = parseInt(form.goalsFor, 10) || 0;
  const goalsAgainst = parseInt(form.goalsAgainst, 10) || 0;
  const goalDifference = parseInt(form.goalDifference, 10) || goalsFor - goalsAgainst;

  // Derived — not entered by user
  const played = wins + draws + losses;
  const points = wins * 3 + draws;

  const safe = Math.max(played, 1);

  return {
    position,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDifference,
    played,
    points,
    winRate: round2(wins / safe),
    drawRate: round2(draws / safe),
    lossRate: round2(losses / safe),
    pointsPerGame: round2(points / safe),
    gfPerGame: round2(goalsFor / safe),
    gaPerGame: round2(goalsAgainst / safe),
    gdPerGame: round2(goalDifference / safe),
  };
}

// ─── Last 3 Calculations ─────────────────────────────────────────────────────

export function getResult(
  venue: Venue,
  gf: number,
  ga: number
): "W" | "D" | "L" {
  if (gf > ga) return "W";
  if (gf === ga) return "D";
  return "L";
}

export function calculateLast3(forms: RecentMatchForm[]): Last3Summary {
  const matches: RecentMatchCalculated[] = forms.map((f) => {
    const gf = parseInt(f.goalsFor as string) || 0;
    const ga = parseInt(f.goalsAgainst as string) || 0;
    return {
      venue: f.venue,
      goalsFor: gf,
      goalsAgainst: ga,
      result: getResult(f.venue, gf, ga),
    };
  });

  const wins = matches.filter((m) => m.result === "W").length;
  const draws = matches.filter((m) => m.result === "D").length;
  const losses = matches.filter((m) => m.result === "L").length;
  const points = wins * 3 + draws;
  const goalsFor = matches.reduce((s, m) => s + m.goalsFor, 0);
  const goalsAgainst = matches.reduce((s, m) => s + m.goalsAgainst, 0);
  const goalDifference = goalsFor - goalsAgainst;
  const n = Math.max(matches.length, 1);

  return {
    matches,
    wins,
    draws,
    losses,
    points,
    goalsFor,
    goalsAgainst,
    goalDifference,
    gfPerMatch: round2(goalsFor / n),
    gaPerMatch: round2(goalsAgainst / n),
    pointsPerMatch: round2(points / n),
  };
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function toPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
