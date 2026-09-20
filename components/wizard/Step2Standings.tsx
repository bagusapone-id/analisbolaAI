"use client";

import { useState } from "react";
import { useWizard } from "@/lib/wizard-context";
import { useLang } from "@/lib/i18n";
import { validateStanding } from "@/lib/calculations";
import type { StandingForm } from "@/lib/types";

const FIELDS: { id: keyof StandingForm; label: string }[] = [
  { id: "position",       label: "Pos" },
  { id: "goalDifference", label: "GD"  },
  { id: "wins",           label: "W"   },
  { id: "draws",          label: "D"   },
  { id: "losses",         label: "L"   },
  { id: "goalsFor",       label: "F"   },
  { id: "goalsAgainst",   label: "A"   },
];

function TeamBlock({
  label,
  prefix,
  form,
  onChange,
  errors,
  warnings,
}: {
  label: string;
  prefix: string;
  form: StandingForm;
  onChange: (f: keyof StandingForm, v: string) => void;
  errors: string[];
  warnings: string[];
}) {
  return (
    <div className="mb-5">
      <p className="text-[13px] font-semibold text-t2 mb-2 px-0">{label}</p>
      <div className="grid grid-cols-7 gap-1.5">
        {FIELDS.map(({ id, label: lbl }) => (
          <div key={id} className="flex flex-col gap-1">
            <label
              htmlFor={`${prefix}-${id}`}
              className="text-center text-[10px] font-semibold uppercase tracking-wide text-t3"
            >
              {lbl}
            </label>
            <input
              id={`${prefix}-${id}`}
              type="number"
              className="input-num"
              placeholder="0"
              value={form[id]}
              onChange={(e) => onChange(id, e.target.value)}
            />
          </div>
        ))}
      </div>
      {errors.length > 0 && (
        <div className="mt-2">
          {errors.map((e) => <p key={e} className="error-msg">{e}</p>)}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="mt-2">
          {warnings.map((w) => <p key={w} className="warning-msg">{w}</p>)}
        </div>
      )}
    </div>
  );
}

export function Step2Standings() {
  const { state, setHomeStanding, setAwayStanding, goToStep } = useWizard();
  const { t } = useLang();

  const [homeForm, setHomeForm] = useState<StandingForm>(state.homeStanding);
  const [awayForm, setAwayForm] = useState<StandingForm>(state.awayStanding);
  const [homeErrors, setHomeErrors] = useState<string[]>([]);
  const [awayErrors, setAwayErrors] = useState<string[]>([]);
  const [homeWarnings, setHomeWarnings] = useState<string[]>([]);
  const [awayWarnings, setAwayWarnings] = useState<string[]>([]);

  const next = () => {
    const hv = validateStanding(homeForm);
    const av = validateStanding(awayForm);
    setHomeErrors(hv.errors);
    setAwayErrors(av.errors);
    setHomeWarnings(hv.warnings);
    setAwayWarnings(av.warnings);
    if (hv.errors.length || av.errors.length) return;
    setHomeStanding(homeForm);
    setAwayStanding(awayForm);
    goToStep(3);
  };

  return (
    <div>
      <p className="text-[13px] text-t3 mb-4">{t("standingsDesc")}</p>

      <TeamBlock
        label={`${state.matchInfo.homeTeam} (${t("home")})`}
        prefix="home"
        form={homeForm}
        onChange={(f, v) => {
          setHomeForm((p) => ({ ...p, [f]: v }));
          setHomeErrors([]);
          setHomeWarnings([]);
        }}
        errors={homeErrors}
        warnings={homeWarnings}
      />

      <div className="h-px bg-line mb-5" />

      <TeamBlock
        label={`${state.matchInfo.awayTeam} (${t("away")})`}
        prefix="away"
        form={awayForm}
        onChange={(f, v) => {
          setAwayForm((p) => ({ ...p, [f]: v }));
          setAwayErrors([]);
          setAwayWarnings([]);
        }}
        errors={awayErrors}
        warnings={awayWarnings}
      />

      <div className="flex gap-3 mt-4">
        <button onClick={() => goToStep(1)} className="btn-secondary flex-1">{t("back")}</button>
        <button onClick={next} className="btn-primary flex-1">{t("continue")}</button>
      </div>
    </div>
  );
}
