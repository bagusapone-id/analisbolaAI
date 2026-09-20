"use client";

import { useParams } from "next/navigation";
import { WizardProvider, useWizard } from "@/lib/wizard-context";
import { useLang } from "@/lib/i18n";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Step1MatchInfo } from "@/components/wizard/Step1MatchInfo";
import { Step2Standings } from "@/components/wizard/Step2Standings";
import { Step3Last3 } from "@/components/wizard/Step3Last3";
import { Step4Review } from "@/components/wizard/Step4Review";
import { TopAppBar } from "@/components/layout/TopAppBar";

function WizardContent({ slipId }: { slipId: string }) {
  const { state } = useWizard();
  const { t } = useLang();

  const STEPS = [
    { label: t("stepMatch") },
    { label: t("stepStandings") },
    { label: t("stepForm") },
    { label: t("stepReview") },
  ];

  return (
    <div className="page">
      <TopAppBar
        title={`${t("addMatchTitle")} · ${state.step}/4`}
        backHref={`/slips/${slipId}`}
      />
      <div className="page-body pb-6">
      <div className="px-4 pt-3">
        <StepIndicator steps={STEPS} currentStep={state.step} />
      </div>

      <div className="px-4 pt-2">
        {state.step === 1 && <Step1MatchInfo />}
        {state.step === 2 && <Step2Standings />}
        {state.step === 3 && <Step3Last3 />}
        {state.step === 4 && <Step4Review slipId={slipId} />}
      </div>
      </div>
    </div>
  );
}

export default function AddMatchToSlipPage() {
  const params = useParams<{ slipId: string }>();
  return (
    <WizardProvider>
      <WizardContent slipId={params.slipId} />
    </WizardProvider>
  );
}
