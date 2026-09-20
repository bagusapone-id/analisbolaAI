"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizard } from "@/lib/wizard-context";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/i18n";
import { calculateStanding, calculateLast3 } from "@/lib/calculations";
import { runPrediction } from "@/lib/prediction/prediction";
import { saveMatch, saveMatchToSlip } from "@/lib/firestore";
import { apiFetch } from "@/lib/api-client";
import { StatRow } from "@/components/ui/StatRow";
import { Spinner } from "@/components/ui/Spinner";

interface Props { slipId?: string; }

export function Step4Review({ slipId }: Props) {
  const { state, goToStep, reset } = useWizard();
  const { user } = useAuth();
  const { t, locale } = useLang();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const homeStanding = calculateStanding(state.homeStanding);
  const awayStanding = calculateStanding(state.awayStanding);
  const homeLast3    = calculateLast3(state.homeLast3);
  const awayLast3    = calculateLast3(state.awayLast3);

  const analyze = async () => {
    if (!user) return;
    setLoading(true); setError("");
    try {
      const prediction = runPrediction(homeStanding, awayStanding, homeLast3, awayLast3);
      const payload = {
        competition: state.matchInfo.competition,
        homeTeam:    state.matchInfo.homeTeam,
        awayTeam:    state.matchInfo.awayTeam,
        homeStanding, awayStanding, homeLast3, awayLast3, prediction,
      };
      const { analysis } = await apiFetch<{ analysis: string }>("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ matchData: payload, locale }),
      });

      if (slipId) {
        const mid = await saveMatchToSlip(user.uid, slipId, { ...payload, aiAnalysis: analysis });
        reset();
        router.push(`/slips/${slipId}/matches/${mid}`);
      } else {
        const mid = await saveMatch(user.uid, { ...payload, aiAnalysis: analysis });
        reset();
        router.push(`/matches/${mid}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
      setLoading(false);
    }
  };

  const SectionLabel = ({ children }: { children: string }) => (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-t3 mb-1 mt-4">{children}</p>
  );

  const ColHeader = ({ home, away }: { home: string; away: string }) => (
    <div className="grid grid-cols-[1fr_56px_1fr] text-[11px] font-semibold text-t3 mb-0.5 px-0">
      <span>{home}</span>
      <span className="text-center">Stat</span>
      <span className="text-right">{away}</span>
    </div>
  );

  const hi = (a: number, b: number) => a > b ? "home" : b > a ? "away" : "none" as const;
  const loIsGood = (a: number, b: number) => a < b ? "home" : b < a ? "away" : "none" as const;

  return (
    <div>
      <p className="text-[13px] text-t3 mb-4">{t("reviewDesc")}</p>

      {/* Match */}
      <SectionLabel>{t("reviewMatch")}</SectionLabel>
      <div className="bg-surface border border-line rounded-md px-4 py-3 mb-0">
        <p className="text-[12px] text-t3">{state.matchInfo.competition}</p>
        <p className="text-[16px] font-semibold text-t1 mt-0.5">
          {state.matchInfo.homeTeam} <span className="text-t3 font-normal">vs</span> {state.matchInfo.awayTeam}
        </p>
      </div>

      {/* Standings */}
      <SectionLabel>{t("reviewStandings")}</SectionLabel>
      <ColHeader home={state.matchInfo.homeTeam} away={state.matchInfo.awayTeam} />
      <div className="bg-surface border border-line rounded-md px-3 py-0">
        <StatRow label="GD" home={homeStanding.goalDifference} away={awayStanding.goalDifference} highlight={hi(homeStanding.goalDifference, awayStanding.goalDifference)} />
        <StatRow label="W/D/L" home={`${homeStanding.wins}/${homeStanding.draws}/${homeStanding.losses}`} away={`${awayStanding.wins}/${awayStanding.draws}/${awayStanding.losses}`} />
        <StatRow label="F" home={homeStanding.goalsFor} away={awayStanding.goalsFor} highlight={hi(homeStanding.goalsFor, awayStanding.goalsFor)} />
        <StatRow label="A" home={homeStanding.goalsAgainst} away={awayStanding.goalsAgainst} highlight={loIsGood(homeStanding.goalsAgainst, awayStanding.goalsAgainst)} />
        <StatRow label="Pts" home={homeStanding.points} away={awayStanding.points} highlight={hi(homeStanding.points, awayStanding.points)} />
      </div>

      {/* Last 3 */}
      <SectionLabel>{t("reviewLast3")}</SectionLabel>
      <ColHeader home={state.matchInfo.homeTeam} away={state.matchInfo.awayTeam} />
      <div className="bg-surface border border-line rounded-md px-3 py-0">
        {homeLast3.matches.map((hm, i) => {
          const am = awayLast3.matches[i];
          return (
            <StatRow key={i} label={`M${i + 1}`}
              home={`${hm.venue[0]} ${hm.goalsFor}-${hm.goalsAgainst} (${hm.result})`}
              away={`${am.venue[0]} ${am.goalsFor}-${am.goalsAgainst} (${am.result})`} />
          );
        })}
        <StatRow label="W/D/L" home={`${homeLast3.wins}/${homeLast3.draws}/${homeLast3.losses}`} away={`${awayLast3.wins}/${awayLast3.draws}/${awayLast3.losses}`} />
        <StatRow label="Pts/M" home={homeLast3.pointsPerMatch} away={awayLast3.pointsPerMatch} highlight={hi(homeLast3.pointsPerMatch, awayLast3.pointsPerMatch)} />
      </div>

      {error && <p className="error-msg mt-2">{error}</p>}

      <div className="flex gap-3 mt-5">
        <button onClick={() => goToStep(3)} className="btn-secondary flex-1" disabled={loading}>{t("back")}</button>
        <button onClick={analyze} className="btn-primary flex-1" disabled={loading}>
          {loading && <Spinner size="sm" />}
          {loading ? t("analyzing") : t("analyzeMatch")}
        </button>
      </div>
    </div>
  );
}
