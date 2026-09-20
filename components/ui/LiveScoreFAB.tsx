"use client";

import { useLang } from "@/lib/i18n";

const LIVESCORE_URL = "https://livescore.com/";

export function LiveScoreFAB() {
  const { t } = useLang();

  const openLivescore = () => {
    window.open(LIVESCORE_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={openLivescore}
      aria-label={t("checkLivescore")}
      className="
        fixed bottom-20 right-4 z-40
        flex items-center gap-1.5
        bg-white border border-line shadow-mid rounded-full
        px-3 py-2 text-[12px] font-semibold text-t2
        active:scale-[0.98] active:opacity-90 transition-all
      "
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-600" />
      </span>
      <span>LiveScore</span>
    </button>
  );
}
