"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { Last3Summary, PredictionResult, StandingCalculated } from "@/lib/types";
import { analyzePicks, marketCategoryLabel, type PickAnalysisItem, type PickMarket } from "@/lib/prediction/pickAnalysis";

interface Props {
  prediction: PredictionResult;
  homeStanding: StandingCalculated;
  awayStanding: StandingCalculated;
  homeLast3: Last3Summary;
  awayLast3: Last3Summary;
}

const filters: Array<{ label: string; value: PickMarket | "ALL" }> = [
  { label: "All", value: "ALL" }, { label: "1X2", value: "1X2" }, { label: "Double Chance", value: "DOUBLE_CHANCE" },
  { label: "Goals", value: "GOALS" }, { label: "BTTS", value: "BTTS" }, { label: "DNB", value: "DNB" },
  { label: "Team Goals", value: "TEAM_GOALS" }, { label: "Correct Score", value: "CORRECT_SCORE" },
];

export function PickAnalysisPanel(props: Props) {
  const result = useMemo(() => analyzePicks(props), [props]);
  const [filter, setFilter] = useState<PickMarket | "ALL">("ALL");
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const visible = result.marketAnalysis.filter((pick) => filter === "ALL" || pick.market === filter);

  return (
    <section className="px-4 mb-4" aria-label="Pick Analysis">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        className="flex items-center justify-between w-full mb-2 text-left"
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest text-t3">Pick Analysis</p>
        <span className="flex items-center gap-1 text-[10px] text-t3">
          {expanded ? "Hide" : "Show markets"}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={clsx("transition-transform", expanded && "rotate-180")}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {result.strongestPick ? (
        <div className="bg-green-600 text-white rounded-md p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-100">Strongest Pick</p>
          <div className="flex items-end justify-between gap-3 mt-2">
            <div>
              <p className="text-[18px] font-bold leading-tight">{result.strongestPick.selection}</p>
              <p className="text-[11px] text-green-100 mt-1">{result.strongestPick.market}</p>
            </div>
            <p className="text-[28px] font-bold leading-none">{result.strongestPick.probability}%</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-[10px] font-semibold">
            <span className="rounded-full bg-white/15 px-2 py-1">{result.strongestPick.confidence} Confidence</span>
            <span className="rounded-full bg-white/15 px-2 py-1">{result.strongestPick.risk} Risk</span>
          </div>
          {expanded && (
            <>
              <button type="button" onClick={() => setShowDetails((open) => !open)} className="mt-3 text-[11px] font-semibold text-white underline underline-offset-2">
                {showDetails ? "Hide Analysis" : "View Analysis"}
              </button>
              {showDetails && <PickDetails pick={result.strongestPick} />}
              {result.dataNote && <p className="mt-2 text-[10px] text-green-100">{result.dataNote}</p>}
            </>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-md p-4 mb-3 text-[13px] text-t2">
          {result.dataNote ?? "Not enough data to determine a strong pick."}
        </div>
      )}

      {expanded && result.alternativePicks.length > 0 && (
        <div className="bg-surface border border-line rounded-md p-3 mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-t3 mb-2">Other Strong Picks</p>
          <div className="space-y-2">
            {result.alternativePicks.map((pick) => <PickListRow key={`${pick.market}-${pick.selection}`} pick={pick} />)}
          </div>
        </div>
      )}

      {expanded && <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2">
        {filters.map((item) => (
          <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={clsx("shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold", filter === item.value ? "border-green-600 bg-green-600 text-white" : "border-line bg-surface text-t2")}>
            {item.label}
          </button>
        ))}
      </div>}

      {expanded && <>
        <div className="bg-surface border border-line rounded-md px-3">
          {visible.map((pick) => <PickListRow key={`${pick.market}-${pick.selection}`} pick={pick} />)}
        </div>
        <p className="text-[10px] text-t3 mt-2">Model probability is not a guarantee of the match result.</p>
      </>}
    </section>
  );
}

function PickListRow({ pick }: { pick: PickAnalysisItem }) {
  return (
    <div className="flex items-center gap-2 border-b border-line last:border-b-0 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-t1 truncate">{pick.selection}</p>
        <p className="text-[10px] text-t3">{marketCategoryLabel(pick.market)} · {pick.supportCount}/{pick.supportTotal} indicators</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[13px] font-bold text-t1">{pick.probability}%</p>
        <p className="text-[10px] text-t3">{pick.confidence} · {pick.risk}</p>
      </div>
    </div>
  );
}

function PickDetails({ pick }: { pick: PickAnalysisItem }) {
  return (
    <div className="mt-3 border-t border-white/20 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-green-100">Why This Pick</p>
      <ul className="mt-1 space-y-1 text-[11px] text-white">
        {pick.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
      </ul>
      <p className="mt-2 text-[10px] text-green-100">Pick score {pick.pickScore}/100 · {pick.supportCount}/{pick.supportTotal} indicators support</p>
    </div>
  );
}
