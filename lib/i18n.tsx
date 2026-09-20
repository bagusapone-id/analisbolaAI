"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// ─── Dictionary ───────────────────────────────────────────────────────────────

export type Locale = "id" | "en";

const dict = {
  id: {
    // Navigation / global
    appTagline: "Analitik & Prediksi Sepak Bola",
    signOut: "Keluar",
    back: "Kembali",
    cancel: "Batal",
    delete: "Hapus",
    save: "Simpan",
    continue: "Lanjut",
    previous: "Sebelumnya",
    loading: "Memuat…",
    errorGeneric: "Terjadi kesalahan. Silakan coba lagi.",

    // Dashboard
    dashboardLabel: "Slip Saya",
    dashboardTitle: "Beranda",
    newSlip: "Slip Baru",
    failedLoadSlips: "Gagal memuat slip.",
    noSlipsYet: "Belum ada slip",
    noSlipsDesc: "Buat slip untuk mengelompokkan prediksi pertandinganmu.",
    createFirstSlip: "Buat Slip Pertama",
    matchSingular: "pertandingan",
    matchPlural: "pertandingan",

    // Create Slip
    newSlipTitle: "Slip Baru",
    slipName: "Nama",
    slipNamePlaceholder: "cth. Liga Inggris Pekan 32",
    slipDescription: "Deskripsi",
    slipDescOptional: "(opsional)",
    slipDescPlaceholder: "cth. Laga papan atas, pekan 32",
    slipNameRequired: "Nama slip wajib diisi.",
    failedCreateSlip: "Gagal membuat slip. Silakan coba lagi.",
    createSlip: "Buat Slip",
    creating: "Membuat…",

    // Slip Detail
    slipNotFound: "Slip tidak ditemukan.",
    failedLoadSlip: "Gagal memuat slip.",
    addMatch: "Tambah Laga",
    noMatchesYet: "Belum ada laga",
    noMatchesDesc: "Tambahkan laga pertama untuk mulai membuat prediksi.",
    deleteSlip: "Hapus Slip",
    deleteSlipConfirmTitle: "Hapus Slip?",
    deleteSlipConfirmDesc: "Slip beserta semua laga di dalamnya akan dihapus permanen.",
    deleting: "Menghapus…",
    failedDeleteSlip: "Gagal menghapus slip.",

    // Match row / detail
    matchNotFound: "Laga tidak ditemukan.",
    failedLoadMatch: "Gagal memuat laga.",
    deleteMatch: "Hapus Laga",
    deleteMatchConfirmTitle: "Hapus Laga?",
    deleteMatchConfirmDesc: "Laga ini akan dihapus permanen dari slip.",
    failedDeleteMatch: "Gagal menghapus laga.",

    // Wizard steps
    stepMatch: "Laga",
    stepStandings: "Klasemen",
    stepForm: "Forma",
    stepReview: "Tinjau",

    // Step 1
    matchInfoTitle: "Informasi Laga",
    matchInfoDesc: "Masukkan nama kompetisi dan kedua tim.",
    competitionLabel: "Kompetisi / Liga",
    competitionPlaceholder: "cth. Premier League",
    homeTeamLabel: "Tim Home",
    homeTeamPlaceholder: "cth. Arsenal",
    awayTeamLabel: "Tim Away",
    awayTeamPlaceholder: "cth. Chelsea",
    errCompetitionRequired: "Nama kompetisi wajib diisi.",
    errHomeTeamRequired: "Nama tim home wajib diisi.",
    errAwayTeamRequired: "Nama tim away wajib diisi.",
    errTeamsSame: "Tim tuan rumah dan tamu tidak boleh sama.",

    // Step 2
    standingsTitle: "Klasemen Liga",
    standingsDesc: "GD = Gol Masuk − Gol Kebobolan. Laga dimainkan & poin dihitung otomatis.",
    home: "Home",
    away: "Away",

    // Step 3
    last3Title: "3 Laga Terakhir",
    last3Desc: "Hasil (M/S/K) ditentukan otomatis dari skor.",
    matchN: "M",
    venue: "Kandang/Tandang",
    goalsFor: "Gol Masuk",
    goalsAgainst: "Gol Kebobolan",
    opponent: "Lawan",
    errLast3: "Lengkapi semua skor untuk 3 laga terakhir kedua tim.",
    review: "Tinjau",

    // Step 4 / Review
    reviewTitle: "Tinjau Data",
    reviewDesc: "Periksa kembali semua data sebelum analisis dibuat.",
    reviewMatch: "Laga",
    reviewStandings: "Klasemen",
    reviewLast3: "3 Laga Terakhir",
    stat: "Stat",
    analyzing: "Menganalisis…",
    analyzeMatch: "Buat Analisis",

    // Add Match wizard page
    addMatchTitle: "Tambah Laga",

    // Match result page
    prediction: "Prediksi",
    goals: "Gol",
    stats: "Statistik",
    matchAnalysis: "Analisis AI",
    homeWin: "Home Win",
    draw: "Seri",
    awayWin: "Away Win",
    expGoals: "Eks. Gol",
    topScores: "Prediksi Skor",
    disclaimer: "Prediksi ini dihasilkan oleh analisis AI berdasarkan data dan statistik. Hasil estimasi ini tidak menjamin hasil akhir pertandingan.",
    // Markets
    mktResult:       "Hasil (1X2)",
    mktDoubleChance: "Peluang Ganda",
    mktOverUnder:    "Over/Under Gol",
    mktBtts:         "BTTS",
    mktDnb:          "DNB",
    mktDnbNote:      "Seri = Void",
    mktCorrectScore: "Prediksi Skor Akhir",
    mktTeamGoals:    "Total Gol Tim",

    // LiveScore FAB
    checkLivescore: "Cek Skor Live",

    // Bottom navigation
    navHome:    "Beranda",
    navSlips:   "Slip",
    navAdd:     "Buat",
    navHistory: "Riwayat",
    navMenu:    "Menu",

    // Menu / account page
    menuTitle:        "Menu",
    menuAccount:      "Akun",
    menuMembership:   "Membership",
    menuFree:         "Free",
    menuVip:          "VIP",
    menuRole:         "Role",
    menuKeys:         "Key",
    menuKeysLoading:  "Memuat…",
    menuLanguage:     "Bahasa",
    menuLangId:       "Bahasa Indonesia",
    menuLangEn:       "English",
    menuLogout:       "Keluar",
    logoutConfTitle:  "Keluar dari akun?",
    logoutConfDesc:   "Kamu akan keluar dari akun ini.",

    // History page
    historyTitle:   "Riwayat",
    noHistoryYet:   "Belum ada riwayat",
    noHistoryDesc:  "Laga yang sudah dianalisis akan muncul di sini.",
    failedHistory:  "Gagal memuat riwayat.",

    // Slips page
    slipsTitle:   "Slip Saya",

    // Greeting
    greetMorning:   "Selamat pagi",
    greetAfternoon: "Selamat siang",
    greetEvening:   "Selamat malam",
  },

  en: {
    // Navigation / global
    appTagline: "Football Match Analytics",
    signOut: "Sign out",
    back: "Back",
    cancel: "Cancel",
    delete: "Delete",
    save: "Save",
    continue: "Continue",
    previous: "Previous",
    loading: "Loading…",
    errorGeneric: "Something went wrong. Please try again.",

    // Dashboard
    dashboardLabel: "My Slips",
    dashboardTitle: "Dashboard",
    newSlip: "New Slip",
    failedLoadSlips: "Failed to load slips.",
    noSlipsYet: "No slips yet",
    noSlipsDesc: "Create a slip to group your match predictions.",
    createFirstSlip: "Create first slip",
    matchSingular: "match",
    matchPlural: "matches",

    // Create Slip
    newSlipTitle: "New Slip",
    slipName: "Name",
    slipNamePlaceholder: "e.g. Premier League Week 32",
    slipDescription: "Description",
    slipDescOptional: "(optional)",
    slipDescPlaceholder: "e.g. Top-of-table clashes, matchday 32",
    slipNameRequired: "Slip name is required.",
    failedCreateSlip: "Failed to create slip. Please try again.",
    createSlip: "Create Slip",
    creating: "Creating…",

    // Slip Detail
    slipNotFound: "Slip not found.",
    failedLoadSlip: "Failed to load slip.",
    addMatch: "Add Match",
    noMatchesYet: "No matches yet",
    noMatchesDesc: "Add your first match to start generating predictions.",
    deleteSlip: "Delete Slip",
    deleteSlipConfirmTitle: "Delete Slip?",
    deleteSlipConfirmDesc: "This will permanently delete the slip and all matches inside it.",
    deleting: "Deleting…",
    failedDeleteSlip: "Failed to delete slip.",

    // Match row / detail
    matchNotFound: "Match not found.",
    failedLoadMatch: "Failed to load match.",
    deleteMatch: "Delete Match",
    deleteMatchConfirmTitle: "Delete Match?",
    deleteMatchConfirmDesc: "This match will be permanently removed from the slip.",
    failedDeleteMatch: "Failed to delete match.",

    // Wizard steps
    stepMatch: "Match",
    stepStandings: "Standings",
    stepForm: "Form",
    stepReview: "Review",

    // Step 1
    matchInfoTitle: "Match Information",
    matchInfoDesc: "Enter the competition and team names.",
    competitionLabel: "Competition / League",
    competitionPlaceholder: "e.g. Premier League",
    homeTeamLabel: "Home Team",
    homeTeamPlaceholder: "e.g. Arsenal",
    awayTeamLabel: "Away Team",
    awayTeamPlaceholder: "e.g. Chelsea",
    errCompetitionRequired: "Competition / League name is required.",
    errHomeTeamRequired: "Home team name is required.",
    errAwayTeamRequired: "Away team name is required.",
    errTeamsSame: "Home and Away teams cannot be identical.",

    // Step 2
    standingsTitle: "League Standings",
    standingsDesc: "GD = F − A. Played and Points are calculated automatically.",
    home: "Home",
    away: "Away",

    // Step 3
    last3Title: "Last 3 Matches",
    last3Desc: "W/D/L is determined automatically from the scores.",
    matchN: "M",
    venue: "Venue",
    goalsFor: "Goals For",
    goalsAgainst: "Goals Against",
    opponent: "Opponent",
    errLast3: "Please fill in all goals for all 3 matches for both teams.",
    review: "Review",

    // Step 4 / Review
    reviewTitle: "Review",
    reviewDesc: "Check everything before generating the analysis.",
    reviewMatch: "Match",
    reviewStandings: "Standings",
    reviewLast3: "Last 3 Matches",
    stat: "Stat",
    analyzing: "Analyzing…",
    analyzeMatch: "Analyze Match",

    // Add Match wizard page
    addMatchTitle: "Add Match",

    // Match result page
    prediction: "Prediction",
    goals: "Goals",
    stats: "Stats",
    matchAnalysis: "Match Analysis",
    homeWin: "Home Win",
    draw: "Draw",
    awayWin: "Away Win",
    expGoals: "Exp. Goals",
    topScores: "Top Scores",
    disclaimer:
      "This prediction is generated by AI analysis based on data and statistics. Model estimates do not guarantee the final match outcome.",
    // Markets
    mktResult:       "Result (1X2)",
    mktDoubleChance: "Double Chance",
    mktOverUnder:    "Over/Under Goals",
    mktBtts:         "Both Teams to Score",
    mktDnb:          "Draw No Bet",
    mktDnbNote:      "Draw = Void",
    mktCorrectScore: "Correct Score",
    mktTeamGoals:    "Team Total Goals",

    // LiveScore FAB
    checkLivescore: "Check LiveScore",

    // Bottom navigation
    navHome:    "Home",
    navSlips:   "Slips",
    navAdd:     "New",
    navHistory: "History",
    navMenu:    "Menu",

    // Menu / account page
    menuTitle:        "Menu",
    menuAccount:      "Account",
    menuMembership:   "Membership",
    menuFree:         "Free",
    menuVip:          "VIP",
    menuRole:         "Role",
    menuKeys:         "Keys",
    menuKeysLoading:  "Loading…",
    menuLanguage:     "Language",
    menuLangId:       "Bahasa Indonesia",
    menuLangEn:       "English",
    menuLogout:       "Sign Out",
    logoutConfTitle:  "Sign Out?",
    logoutConfDesc:   "You will be signed out of this account.",

    // History page
    historyTitle:   "History",
    noHistoryYet:   "No history yet",
    noHistoryDesc:  "Analyzed matches will appear here.",
    failedHistory:  "Failed to load history.",

    // Slips page
    slipsTitle:   "My Slips",

    // Greeting
    greetMorning:   "Good morning",
    greetAfternoon: "Good afternoon",
    greetEvening:   "Good evening",
  },
} as const;

export type TranslationKey = keyof typeof dict.en;

// ─── Context ──────────────────────────────────────────────────────────────────

interface LangContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
  /** Returns "match" or "matches" / "pertandingan" based on count */
  tMatch: (count: number) => string;
}

const LangContext = createContext<LangContextType | null>(null);
const STORAGE_KEY = "aiscore360_lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "id") setLocaleState(stored);
    } catch {
      // localStorage unavailable (SSR guard)
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => dict[locale][key] as string,
    [locale]
  );

  const tMatch = useCallback(
    (count: number): string =>
      count === 1
        ? `${count} ${dict[locale].matchSingular}`
        : `${count} ${dict[locale].matchPlural}`,
    [locale]
  );

  return (
    <LangContext.Provider value={{ locale, setLocale, t, tMatch }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextType {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
