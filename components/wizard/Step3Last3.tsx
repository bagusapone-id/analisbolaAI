"use client";

import { useState } from "react";
import { useWizard } from "@/lib/wizard-context";
import { useLang } from "@/lib/i18n";
import type { RecentMatchForm, Venue } from "@/lib/types";
import clsx from "clsx";

/** Derive W/D/L from goalsFor vs goalsAgainst strings. Returns null if incomplete. */
function getResult(gf: string, ga: string): "W" | "D" | "L" | null {
  const f = parseInt(gf, 10);
  const a = parseInt(ga, 10);
  if (isNaN(f) || isNaN(a) || gf === "" || ga === "") return null;
  if (f > a) return "W";
  if (f === a) return "D";
  return "L";
}

function MatchRow({
  index,
  form,
  onChange,
}: {
  index: number;
  form: RecentMatchForm;
  onChange: (f: keyof RecentMatchForm, v: string | Venue) => void;
}) {
  const { t } = useLang();

  const result = getResult(form.goalsFor, form.goalsAgainst);

  // Label for each score input depends on venue:
  // HOME → left = "Tim" (goalsFor), right = "Lawan" (goalsAgainst)
  // AWAY → left = "Lawan" displayed first conceptually, but data model stays:
  //         goalsFor = goals this team scored, goalsAgainst = goals opponent scored
  // We keep data model intact and just show contextual labels + result badge.

  const resultColor =
    result === "W" ? "text-green-600" :
    result === "L" ? "text-danger" :
    result === "D" ? "text-amber-500" : "text-t3";

  const resultLabel =
    result === "W" ? "W" :
    result === "L" ? "L" :
    result === "D" ? "D" : "–";

  return (
    <div className="py-3 px-3 border-b border-line last:border-b-0">
      {/* Row 1: label + venue toggle + result badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[12px] font-semibold text-t3 w-7 shrink-0">
          {t("matchN")}{index + 1}
        </span>

        {/* Venue toggle */}
        <div className="seg-control flex-1">
          {(["HOME", "AWAY"] as Venue[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange("venue", v)}
              className={clsx("seg-option text-[12px]", form.venue === v && "active")}
            >
              {v === "HOME" ? t("home") : t("away")}
            </button>
          ))}
        </div>

        {/* Result badge */}
        <span className={clsx("text-[13px] font-black w-5 text-center shrink-0", resultColor)}>
          {resultLabel}
        </span>
      </div>

      {/* Row 2: score inputs with contextual labels */}
      <div className="flex items-center gap-2">
        {/* Team goals (always goalsFor in data) */}
        <div className="flex flex-col items-center gap-0.5 flex-1">
          <span className="text-[10px] text-t3 font-medium">
            {form.venue === "HOME" ? t("home") : t("away")}
          </span>
          <input
            type="number"
            min="0"
            className="input-num w-full"
            placeholder="0"
            value={form.goalsFor}
            onChange={(e) => onChange("goalsFor", e.target.value)}
            aria-label={`M${index + 1} goals for`}
          />
        </div>

        <span className="text-t3 text-[14px] font-medium pb-0 mt-4">–</span>

        {/* Opponent goals (always goalsAgainst in data) */}
        <div className="flex flex-col items-center gap-0.5 flex-1">
          <span className="text-[10px] text-t3 font-medium">{t("opponent")}</span>
          <input
            type="number"
            min="0"
            className="input-num w-full"
            placeholder="0"
            value={form.goalsAgainst}
            onChange={(e) => onChange("goalsAgainst", e.target.value)}
            aria-label={`M${index + 1} goals against`}
          />
        </div>
      </div>
    </div>
  );
}

function TeamBlock({
  teamName,
  forms,
  onChange,
}: {
  teamName: string;
  forms: [RecentMatchForm, RecentMatchForm, RecentMatchForm];
  onChange: (i: number, f: keyof RecentMatchForm, v: string | Venue) => void;
}) {
  return (
    <div className="mb-5">
      <p className="text-[13px] font-semibold text-t2 mb-1">{teamName}</p>
      <div className="bg-surface border border-line rounded-md overflow-hidden">
        {forms.map((form, i) => (
          <MatchRow
            key={i}
            index={i}
            form={form}
            onChange={(f, v) => onChange(i, f, v)}
          />
        ))}
      </div>
    </div>
  );
}

export function Step3Last3() {
  const { state, setHomeLast3, setAwayLast3, goToStep } = useWizard();
  const { t } = useLang();

  const [homeForms, setHome] = useState<[RecentMatchForm, RecentMatchForm, RecentMatchForm]>(state.homeLast3);
  const [awayForms, setAway] = useState<[RecentMatchForm, RecentMatchForm, RecentMatchForm]>(state.awayLast3);
  const [error, setError]   = useState("");

  const upd = (
    setter: React.Dispatch<React.SetStateAction<[RecentMatchForm, RecentMatchForm, RecentMatchForm]>>,
    i: number,
    f: keyof RecentMatchForm,
    v: string | Venue
  ) => setter((p) => { const n = [...p] as typeof p; n[i] = { ...n[i], [f]: v }; return n; });

  const next = () => {
    const ok = (forms: typeof homeForms) =>
      forms.every((f) => f.goalsFor !== "" && f.goalsAgainst !== "");
    if (!ok(homeForms) || !ok(awayForms)) { setError(t("errLast3")); return; }
    setError("");
    setHomeLast3(homeForms);
    setAwayLast3(awayForms);
    goToStep(4);
  };

  return (
    <div>
      <p className="text-[13px] text-t3 mb-4">{t("last3Desc")}</p>

      <TeamBlock
        teamName={`${state.matchInfo.homeTeam}`}
        forms={homeForms}
        onChange={(i, f, v) => upd(setHome, i, f, v)}
      />

      <div className="h-px bg-line mb-5" />

      <TeamBlock
        teamName={`${state.matchInfo.awayTeam}`}
        forms={awayForms}
        onChange={(i, f, v) => upd(setAway, i, f, v)}
      />

      {error && <p className="error-msg mb-3">{error}</p>}

      <div className="flex gap-3 mt-4">
        <button onClick={() => goToStep(2)} className="btn-secondary flex-1">{t("back")}</button>
        <button onClick={next} className="btn-primary flex-1">{t("review")}</button>
      </div>
    </div>
  );
}
