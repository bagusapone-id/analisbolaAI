"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/i18n";
import { getUserSlips, getSlipMatches } from "@/lib/firestore";
import type { SlipMatchData } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Clock } from "lucide-react";
import clsx from "clsx";

type HistoryEntry = SlipMatchData & { id: string; slipName: string };

export default function HistoryPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const slips = await getUserSlips(user.uid);
        const all: HistoryEntry[] = [];
        await Promise.all(
          slips.map(async (slip) => {
            const matches = await getSlipMatches(user.uid, slip.id);
            matches.forEach((m) =>
              all.push({ ...m, slipName: slip.name })
            );
          })
        );
        all.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setEntries(all);
      } catch {
        setError(t("failedHistory"));
      } finally {
        setLoading(false);
      }
    })();
  }, [user, t]);

  return (
    <div className="page">
      <TopAppBar title={t("historyTitle")} />
      <div className="page-body">
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-green-600" />
        </div>
      ) : error ? (
        <p className="error-msg px-4 py-4">{error}</p>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <Clock size={40} className="text-t3 mb-3" />
          <p className="text-[15px] font-semibold text-t1">{t("noHistoryYet")}</p>
          <p className="text-[13px] text-t3 mt-1">{t("noHistoryDesc")}</p>
        </div>
      ) : (
        <div className="list-surface mt-0">
          {entries.map((entry) => {
            const { homeWin, draw, awayWin } = entry.prediction;
            const top =
              homeWin > draw && homeWin > awayWin ? "H"
              : awayWin > draw ? "A" : "D";
            const date = new Date(entry.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit", month: "short",
            });
            return (
              <button
                key={entry.id}
                className="list-row w-full text-left"
                onClick={() =>
                  router.push(`/slips/${entry.slipId}/matches/${entry.id}`)
                }
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-t3 mb-0.5">{entry.competition} · {entry.slipName}</p>
                  <p className="list-row-title truncate">
                    {entry.homeTeam} <span className="text-t3 font-normal">vs</span> {entry.awayTeam}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <div className="text-right">
                    <div className="flex gap-1.5">
                      {[
                        { l: "H", v: homeWin },
                        { l: "D", v: draw },
                        { l: "A", v: awayWin },
                      ].map(({ l, v }) => (
                        <span
                          key={l}
                          className={clsx(
                            "text-[11px] font-bold",
                            top === l ? "text-green-600" : "text-t3"
                          )}
                        >
                          {v}%
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-t3 mt-0.5 text-right">{date}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
