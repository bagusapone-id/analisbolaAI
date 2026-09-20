"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lock, Unlock, ChevronRight } from "lucide-react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/api-client";
import type { SlipMatchData } from "@/lib/types";
import clsx from "clsx";

type SlipMatch = SlipMatchData & { id: string };
type Slip = { id: string; name: string; description?: string; matchCount: number; userId: string };
type SlipMeta = { name: string; description?: string; matchCount: number };

export default function SlipJadiDetailPage() {
  const { slipId } = useParams<{ slipId: string }>();
  const router = useRouter();

  const [slip, setSlip]           = useState<Slip | null>(null);
  const [matches, setMatches]     = useState<SlipMatch[]>([]);
  const [locked, setLocked]       = useState(true);
  const [keys, setKeys]           = useState<number | null>(null);
  const [slipMeta, setSlipMeta]   = useState<SlipMeta | null>(null);
  const [loading, setLoading]     = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError]         = useState("");

  // Pre-fetch name/desc for locked state from list endpoint
  useEffect(() => {
    apiFetch<{ slips: Array<{ id: string; name: string; description: string; matchCount: number }> }>("/api/public-slips")
      .then(({ slips }) => {
        const found = slips.find((s) => s.id === slipId);
        if (found) setSlipMeta({ name: found.name, description: found.description, matchCount: found.matchCount });
      })
      .catch(() => undefined);
  }, [slipId]);

  // Fetch keys
  useEffect(() => {
    apiFetch<{ keys: number }>("/api/profile")
      .then((body) => setKeys(body.keys))
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    try {
      const body = await apiFetch<{ slip: Slip; matches: SlipMatch[] }>(
        `/api/public-slips/${encodeURIComponent(slipId)}`
      );
      setSlip(body.slip);
      setSlipMeta({ name: body.slip.name, description: body.slip.description, matchCount: body.slip.matchCount });
      setMatches(body.matches);
      setLocked(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.toLowerCase().includes("lock")) setLocked(true);
      else setError(msg || "Gagal memuat VIP Slip Prediction.");
    } finally {
      setLoading(false);
    }
  }, [slipId]);

  useEffect(() => { if (slipId) void load(); }, [load, slipId]);

  const unlock = async () => {
    setUnlocking(true);
    setError("");
    try {
      await apiFetch(`/api/public-slips/${encodeURIComponent(slipId)}`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuka Slip.");
    } finally {
      setUnlocking(false);
    }
  };

  const displayName  = slipMeta?.name ?? slip?.name ?? "VIP Slip Prediction";
  const displayDesc  = slipMeta?.description ?? slip?.description;
  const displayCount = slipMeta?.matchCount ?? slip?.matchCount ?? 0;

  if (loading) return (
    <div className="page">
      <TopAppBar title="VIP Slip Prediction" backHref="/slip-jadi" />
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" className="text-green-600" />
      </div>
    </div>
  );

  return (
    <div className="page">
      <TopAppBar title={displayName} backHref="/slip-jadi" />
      <div className="page-body">

        {error && <p className="error-msg">{error}</p>}

        {/* Slip meta header — always visible */}
        <div className="px-4 py-3 bg-bg border-b border-line">
          {!locked && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <Unlock size={12} className="text-green-600" />
              <span className="text-[11px] font-semibold text-green-600 uppercase tracking-wide">
                Unlocked
              </span>
            </div>
          )}
          {displayDesc && (
            <p className="text-[13px] text-t2 mb-1">{displayDesc}</p>
          )}
          <p className="text-[12px] text-t3">
            {displayCount} {displayCount === 1 ? "laga" : "laga"}
          </p>
        </div>

        {locked ? (
          /* ── Locked state ──────────────────────────────────────── */
          <div className="px-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 mx-auto mb-4">
              <Lock size={28} className="text-green-600" />
            </div>
            <p className="text-[17px] font-semibold text-t1 mb-1">Slip ini terkunci</p>
            <p className="text-[13px] text-t3 max-w-xs mx-auto">
              Buka dengan <span className="font-semibold text-t1">1 Key</span> untuk melihat
              semua laga dan analisis lengkap dari admin.
            </p>
            <p className="text-[13px] text-t2 mt-3">
              Key kamu:{" "}
              <span className="font-semibold text-t1">{keys ?? "—"}</span>
            </p>
            <button
              type="button"
              onClick={keys === 0 ? () => router.push("/store") : unlock}
              disabled={unlocking || keys === null}
              className="btn-primary mt-5"
            >
              {unlocking
                ? <Spinner size="sm" />
                : keys === 0
                  ? "Beli Key di Store"
                  : "Buka dengan 1 Key"}
            </button>
          </div>
        ) : (
          /* ── Unlocked: match list — same pattern as slips/[slipId] ── */
          <>
            <div className="flex items-center px-4 pt-4 pb-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-t3">Matches</p>
            </div>

            {matches.length === 0 ? (
              <div className="flex flex-col items-center py-14 px-6 text-center">
                <p className="text-[15px] font-semibold text-t1">Belum ada laga</p>
                <p className="text-[13px] text-t3 mt-1">Admin belum menambahkan laga ke slip ini.</p>
              </div>
            ) : (
              <div className="list-surface">
                {matches.map((match) => {
                  const { homeWin, draw, awayWin } = match.prediction;
                  const top =
                    homeWin > draw && homeWin > awayWin ? "H"
                    : awayWin > draw ? "A" : "D";
                  return (
                    <button
                      key={match.id}
                      className="list-row w-full text-left"
                      onClick={() => router.push(`/slip-jadi/${slipId}/${match.id}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-t3 mb-0.5">{match.competition}</p>
                        <p className="list-row-title truncate">
                          {match.homeTeam}{" "}
                          <span className="text-t3 font-normal">vs</span>{" "}
                          {match.awayTeam}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {([ ["H", homeWin], ["D", draw], ["A", awayWin] ] as [string, number][]).map(([l, v]) => (
                            <span
                              key={l}
                              className={clsx(
                                "text-[11px] font-bold",
                                top === l ? "text-green-600" : "text-t3"
                              )}
                            >
                              {l} {v}%
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-t3 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
