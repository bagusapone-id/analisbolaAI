"use client";

import { useLang } from "@/lib/i18n";
import { StatRow } from "@/components/ui/StatRow";
import { PickAnalysisPanel } from "@/components/prediction/PickAnalysisPanel";
import type { PredictionResult, PredictionMarkets, StandingCalculated, Last3Summary } from "@/lib/types";
import clsx from "clsx";

// ─── Sub-components ──────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-t3 mb-2">
      {children}
    </p>
  );
}

function OutcomeCell({
  label, value, active, note,
}: {
  label: string; value: string | number; active?: boolean; note?: string;
}) {
  return (
    <div className={clsx(
      "flex flex-col items-center justify-center rounded-md py-2.5 px-1",
      active ? "bg-green-600" : "bg-surface border border-line",
    )}>
      <span className={clsx("text-[15px] font-bold leading-none", active ? "text-white" : "text-t1")}>
        {value}{typeof value === "number" ? "%" : ""}
      </span>
      <span className={clsx("text-[10px] mt-1 font-medium text-center leading-tight", active ? "text-green-100" : "text-t3")}>
        {label}
      </span>
      {note && (
        <span className="text-[9px] mt-0.5 font-semibold text-amber-500">{note}</span>
      )}
    </div>
  );
}

function OURow({ line, over, under }: { line: string; over: number; under: number }) {
  const overHi = over >= 60;
  return (
    <div className="flex items-center border-b border-line last:border-b-0 py-2">
      <span className={clsx("flex-1 text-[13px] font-semibold", overHi ? "text-green-600" : "text-t1")}>
        O {line}
      </span>
      <span className={clsx("text-[13px] font-bold w-10 text-right", overHi ? "text-green-600" : "text-t1")}>
        {over}%
      </span>
      <span className="text-t3 mx-3 text-[11px]">|</span>
      <span className={clsx("flex-1 text-[13px] font-semibold", !overHi ? "text-t1" : "text-t3")}>
        U {line}
      </span>
      <span className={clsx("text-[13px] font-bold w-10 text-right", !overHi ? "text-t1" : "text-t3")}>
        {under}%
      </span>
    </div>
  );
}

function ScoreRow({ rank, home, away, probability }: {
  rank: number; home: number; away: number; probability: number;
}) {
  return (
    <div className="flex items-center border-b border-line last:border-b-0 py-2">
      <span className="text-[11px] text-t3 w-4 shrink-0">{rank}.</span>
      <span className={clsx("text-[15px] font-bold flex-1 ml-2", rank === 1 ? "text-green-600" : "text-t1")}>
        {home}–{away}
      </span>
      <span className="text-[13px] text-t3 font-medium">{probability}%</span>
    </div>
  );
}

function TeamGoalGrid({ label, over05, over15, over25 }: {
  label: string; over05: number; over15: number; over25: number;
}) {
  return (
    <div className="flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-t3 mb-1.5">{label}</p>
      <div className="bg-surface border border-line rounded-md divide-y divide-line">
        {[
          { l: "O 0.5", v: over05 },
          { l: "O 1.5", v: over15 },
          { l: "O 2.5", v: over25 },
        ].map(({ l, v }) => (
          <div key={l} className="flex items-center justify-between px-2.5 py-1.5">
            <span className={clsx("text-[12px] font-semibold", v >= 60 ? "text-green-600" : "text-t2")}>{l}</span>
            <span className={clsx("text-[12px] font-bold", v >= 60 ? "text-green-600" : "text-t1")}>{v}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalysisText({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[14px] leading-relaxed text-t2">
      {text.split("\n\n").map((block, i) => {
        if (!block.trim()) return null;
        const parts = block.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={j} className="font-semibold text-t1">{p.slice(2, -2)}</strong>
                : p
            )}
          </p>
        );
      })}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface MatchDetailViewProps {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  prediction: PredictionResult;
  homeStanding: StandingCalculated;
  awayStanding: StandingCalculated;
  homeLast3: Last3Summary;
  awayLast3: Last3Summary;
  aiAnalysis?: string;
}

export function MatchDetailView({
  homeTeam,
  awayTeam,
  competition,
  prediction: pred,
  homeStanding: hs,
  awayStanding: as_,
  homeLast3: hl,
  awayLast3: al,
  aiAnalysis,
}: MatchDetailViewProps) {
  const { t } = useLang();

  const m: PredictionMarkets | undefined = pred.markets;

  const top1x2 =
    pred.homeWin > pred.draw && pred.homeWin > pred.awayWin
      ? "home"
      : pred.awayWin > pred.draw
      ? "away"
      : "draw";

  const hi = (a: number, b: number) => (a > b ? "home" : b > a ? "away" : "none") as "home" | "away" | "none";
  const lo = (a: number, b: number) => (a < b ? "home" : b < a ? "away" : "none") as "home" | "away" | "none";

  return (
    <div className="pb-6">
      {/* Competition label */}
      <p className="px-4 pt-3 pb-2 text-[12px] font-semibold uppercase tracking-widest text-t3">
        {competition}
      </p>

      <PickAnalysisPanel
        prediction={pred}
        homeStanding={hs}
        awayStanding={as_}
        homeLast3={hl}
        awayLast3={al}
      />

      {/* ── 1. 1X2 ────────────────────────────────────────────────────── */}
      <div className="px-4 mb-4">
        <SectionLabel>{t("mktResult")}</SectionLabel>
        <div className="flex items-center justify-between mb-3">
          <p className={clsx(
            "text-[15px] font-bold flex-1 text-left truncate pr-2",
            top1x2 === "home" ? "text-green-600" : "text-t1",
          )}>
            {homeTeam}
          </p>
          <span className="text-[11px] font-bold text-t3 px-2 shrink-0">VS</span>
          <p className={clsx(
            "text-[15px] font-bold flex-1 text-right truncate pl-2",
            top1x2 === "away" ? "text-green-600" : "text-t1",
          )}>
            {awayTeam}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <OutcomeCell label={t("homeWin")} value={pred.homeWin} active={top1x2 === "home"} />
          <OutcomeCell label={t("draw")}    value={pred.draw}    active={top1x2 === "draw"} />
          <OutcomeCell label={t("awayWin")} value={pred.awayWin} active={top1x2 === "away"} />
        </div>
        <div className="flex h-1.5 rounded-full overflow-hidden bg-line mb-1">
          <div className="bg-green-500" style={{ width: `${pred.homeWin}%` }} />
          <div className="bg-amber"     style={{ width: `${pred.draw}%` }} />
          <div className="bg-t3"        style={{ width: `${pred.awayWin}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-t3">
          <span>{t("home")}</span><span>{t("draw")}</span><span>{t("away")}</span>
        </div>
      </div>

      {/* ── 2. Double Chance ─────────────────────────────────────────── */}
      {m && (
        <div className="px-4 mb-4">
          <SectionLabel>{t("mktDoubleChance")}</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            <OutcomeCell label="1X" value={m.doubleChance.oneX}
              active={m.doubleChance.oneX >= m.doubleChance.xTwo && m.doubleChance.oneX >= m.doubleChance.oneTwo} />
            <OutcomeCell label="X2" value={m.doubleChance.xTwo} active={false} />
            <OutcomeCell label="12" value={m.doubleChance.oneTwo}
              active={m.doubleChance.oneTwo >= m.doubleChance.oneX && m.doubleChance.oneTwo >= m.doubleChance.xTwo} />
          </div>
        </div>
      )}

      {/* ── 3. Over/Under ────────────────────────────────────────────── */}
      {m && (
        <div className="px-4 mb-4">
          <SectionLabel>{t("mktOverUnder")}</SectionLabel>
          <div className="bg-surface border border-line rounded-md px-3 py-0">
            <OURow line="0.5" over={m.overUnder.over05} under={m.overUnder.under05} />
            <OURow line="1.5" over={m.overUnder.over15} under={m.overUnder.under15} />
            <OURow line="2.5" over={m.overUnder.over25} under={m.overUnder.under25} />
            <OURow line="3.5" over={m.overUnder.over35} under={m.overUnder.under35} />
            <OURow line="4.5" over={m.overUnder.over45} under={m.overUnder.under45} />
          </div>
        </div>
      )}

      {/* ── 4 & 5. BTTS + Draw No Bet ─────────────────────────────────── */}
      {m && (
        <div className="px-4 mb-4 grid grid-cols-2 gap-3">
          <div>
            <SectionLabel>{t("mktBtts")}</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <OutcomeCell label="Yes" value={m.btts.yes} active={m.btts.yes >= 50} />
              <OutcomeCell label="No"  value={m.btts.no}  active={m.btts.no > m.btts.yes} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5 mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-t3">{t("mktDnb")}</p>
              <span className="text-[9px] font-bold text-amber-500">{t("mktDnbNote")}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <OutcomeCell label={t("home")} value={m.drawNoBet.home} active={m.drawNoBet.home > m.drawNoBet.away} />
              <OutcomeCell label={t("away")} value={m.drawNoBet.away} active={m.drawNoBet.away >= m.drawNoBet.home} />
            </div>
          </div>
        </div>
      )}

      {/* ── Exp. Goals ────────────────────────────────────────────────── */}
      <div className="px-4 mb-4">
        <SectionLabel>{t("expGoals")}</SectionLabel>
        <div className="bg-surface border border-line rounded-md px-4 py-3">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-[26px] font-bold text-green-600 leading-none">{pred.expectedHomeGoals}</p>
              <p className="text-[10px] text-t3 mt-1 truncate max-w-[64px]">{homeTeam.split(" ")[0]}</p>
            </div>
            <span className="text-t3 text-[18px] font-medium">–</span>
            <div className="text-center">
              <p className="text-[26px] font-bold text-t1 leading-none">{pred.expectedAwayGoals}</p>
              <p className="text-[10px] text-t3 mt-1 truncate max-w-[64px]">{awayTeam.split(" ")[0]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. Correct Score ─────────────────────────────────────────── */}
      {m && (
        <div className="px-4 mb-4">
          <SectionLabel>{t("mktCorrectScore")}</SectionLabel>
          <div className="bg-surface border border-line rounded-md px-3 py-0">
            {m.correctScore.map((s, i) => (
              <ScoreRow key={`${s.home}-${s.away}`} rank={i + 1}
                home={s.home} away={s.away} probability={s.probability} />
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Team Total Goals ───────────────────────────────────────── */}
      {m && (
        <div className="px-4 mb-4">
          <SectionLabel>{t("mktTeamGoals")}</SectionLabel>
          <div className="flex gap-3">
            <TeamGoalGrid
              label={homeTeam.split(" ")[0]}
              over05={m.teamGoals.home.over05}
              over15={m.teamGoals.home.over15}
              over25={m.teamGoals.home.over25}
            />
            <TeamGoalGrid
              label={awayTeam.split(" ")[0]}
              over05={m.teamGoals.away.over05}
              over15={m.teamGoals.away.over15}
              over25={m.teamGoals.away.over25}
            />
          </div>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="px-4 mb-4">
        <SectionLabel>{t("stats")}</SectionLabel>
        <div className="grid grid-cols-[1fr_56px_1fr] text-[11px] font-semibold text-t3 mb-0.5">
          <span>{homeTeam}</span>
          <span className="text-center">Stat</span>
          <span className="text-right">{awayTeam}</span>
        </div>
        <div className="bg-surface border border-line rounded-md px-3 py-0">
          <StatRow label="GD"    home={hs.goalDifference} away={as_.goalDifference} highlight={hi(hs.goalDifference, as_.goalDifference)} />
          <StatRow label="W/D/L" home={`${hs.wins}/${hs.draws}/${hs.losses}`}       away={`${as_.wins}/${as_.draws}/${as_.losses}`} />
          <StatRow label="F/G"   home={hs.gfPerGame}      away={as_.gfPerGame}      highlight={hi(hs.gfPerGame, as_.gfPerGame)} />
          <StatRow label="A/G"   home={hs.gaPerGame}      away={as_.gaPerGame}      highlight={lo(hs.gaPerGame, as_.gaPerGame)} />
          <StatRow label="Pts"   home={hs.points}         away={as_.points}         highlight={hi(hs.points, as_.points)} />
          <StatRow label="Form"  home={`${hl.wins}W${hl.draws}D${hl.losses}L`}     away={`${al.wins}W${al.draws}D${al.losses}L`} />
          <StatRow label="Pts/M" home={hl.pointsPerMatch} away={al.pointsPerMatch}  highlight={hi(hl.pointsPerMatch, al.pointsPerMatch)} />
        </div>
      </div>

      {/* ── AI Analysis ───────────────────────────────────────────────── */}
      {aiAnalysis && (
        <div className="px-4 mb-4">
          <SectionLabel>{t("matchAnalysis")}</SectionLabel>
          <div className="bg-surface border border-line rounded-md px-4 py-4">
            <AnalysisText text={aiAnalysis} />
            <p className="text-[11px] text-t3 mt-4">{t("disclaimer")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
