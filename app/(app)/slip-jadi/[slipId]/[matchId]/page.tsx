"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Spinner } from "@/components/ui/Spinner";
import { MatchDetailView } from "@/components/prediction/MatchDetailView";
import { apiFetch } from "@/lib/api-client";
import type { SlipMatchData } from "@/lib/types";

type SlipMatch = SlipMatchData & { id: string };

export default function SlipJadiMatchPage() {
  const { slipId, matchId } = useParams<{ slipId: string; matchId: string }>();

  const [match, setMatch]     = useState<SlipMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = useCallback(async () => {
    try {
      const body = await apiFetch<{ slip: unknown; matches: SlipMatch[] }>(
        `/api/public-slips/${encodeURIComponent(slipId)}`
      );
      const found = body.matches.find((m) => m.id === matchId);
      if (!found) setError("Laga tidak ditemukan.");
      else setMatch(found);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat laga.");
    } finally {
      setLoading(false);
    }
  }, [slipId, matchId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return (
    <div className="page">
      <TopAppBar title="Analisis Laga" backHref={`/slip-jadi/${slipId}`} />
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" className="text-green-600" />
      </div>
    </div>
  );

  if (error || !match) return (
    <div className="page">
      <TopAppBar title="—" backHref={`/slip-jadi/${slipId}`} />
      <div className="page-body">
        <p className="error-msg px-4 py-4">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="page">
      <TopAppBar
        title={`${match.homeTeam} vs ${match.awayTeam}`}
        backHref={`/slip-jadi/${slipId}`}
      />
      <div className="page-body">
        <MatchDetailView
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          competition={match.competition}
          prediction={match.prediction}
          homeStanding={match.homeStanding}
          awayStanding={match.awayStanding}
          homeLast3={match.homeLast3}
          awayLast3={match.awayLast3}
          aiAnalysis={match.aiAnalysis}
        />
      </div>
    </div>
  );
}
