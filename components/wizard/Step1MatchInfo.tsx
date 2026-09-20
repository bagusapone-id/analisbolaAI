"use client";

import { useState } from "react";
import { useWizard } from "@/lib/wizard-context";
import { useLang } from "@/lib/i18n";
import type { MatchInfoForm } from "@/lib/types";

export function Step1MatchInfo() {
  const { state, setMatchInfo, goToStep } = useWizard();
  const { t } = useLang();
  const [form, setForm] = useState<MatchInfoForm>(state.matchInfo);
  const [error, setError] = useState("");

  const set = (f: keyof MatchInfoForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [f]: e.target.value }));
    setError("");
  };

  const next = () => {
    if (!form.competition.trim()) { setError(t("errCompetitionRequired")); return; }
    if (!form.homeTeam.trim())    { setError(t("errHomeTeamRequired")); return; }
    if (!form.awayTeam.trim())    { setError(t("errAwayTeamRequired")); return; }
    if (form.homeTeam.trim().toLowerCase() === form.awayTeam.trim().toLowerCase()) {
      setError(t("errTeamsSame")); return;
    }
    setMatchInfo({ competition: form.competition.trim(), homeTeam: form.homeTeam.trim(), awayTeam: form.awayTeam.trim() });
    goToStep(2);
  };

  return (
    <div>
      <p className="text-[13px] text-t3 mb-4">{t("matchInfoDesc")}</p>

      <div className="field-group mb-6">
        <div className="field-row">
          <label htmlFor="competition" className="field-label text-[13px]">{t("competitionLabel")}</label>
          <input id="competition" type="text" className="field-input"
            placeholder={t("competitionPlaceholder")}
            value={form.competition} onChange={set("competition")} />
        </div>
        <div className="field-row">
          <label htmlFor="homeTeam" className="field-label text-[13px]">{t("homeTeamLabel")}</label>
          <input id="homeTeam" type="text" className="field-input"
            placeholder={t("homeTeamPlaceholder")}
            value={form.homeTeam} onChange={set("homeTeam")} />
        </div>
        <div className="field-row">
          <label htmlFor="awayTeam" className="field-label text-[13px]">{t("awayTeamLabel")}</label>
          <input id="awayTeam" type="text" className="field-input"
            placeholder={t("awayTeamPlaceholder")}
            value={form.awayTeam} onChange={set("awayTeam")} />
        </div>
      </div>

      {error && <p className="error-msg mb-3">{error}</p>}

      <button onClick={next} className="btn-primary w-full justify-center">
        {t("continue")}
      </button>
    </div>
  );
}
