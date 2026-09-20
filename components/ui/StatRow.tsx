import clsx from "clsx";

interface StatRowProps {
  label: string;
  home: string | number;
  away: string | number;
  highlight?: "home" | "away" | "none";
}

export function StatRow({ label, home, away, highlight }: StatRowProps) {
  return (
    <div className="grid grid-cols-[1fr_56px_1fr] items-center py-2 border-b border-line last:border-b-0 text-[13px]">
      <span className={clsx(highlight === "home" ? "font-semibold text-green-600" : "text-t1")}>
        {home}
      </span>
      <span className="text-center text-[11px] text-t3">{label}</span>
      <span className={clsx("text-right", highlight === "away" ? "font-semibold text-green-600" : "text-t1")}>
        {away}
      </span>
    </div>
  );
}
