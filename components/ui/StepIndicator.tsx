import clsx from "clsx";
import { Check } from "lucide-react";

interface Step { label: string }
interface Props { steps: Step[]; currentStep: number }

export function StepIndicator({ steps, currentStep }: Props) {
  const pct = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="mb-4" aria-label="Progress">
      {/* Linear progress bar */}
      <div className="h-1 w-full rounded-full bg-line mb-3 overflow-hidden">
        <div
          className="h-1 rounded-full bg-green-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step nodes */}
      <ol className="flex items-start justify-between">
        {steps.map((step, i) => {
          const n    = i + 1;
          const done = n < currentStep;
          const cur  = n === currentStep;

          return (
            <li key={step.label} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
              <div className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all",
                done ? "bg-green-500 text-white"
                     : cur ? "bg-green-600 text-white ring-4 ring-green-100"
                            : "bg-line text-t3"
              )}>
                {done ? <Check size={12} strokeWidth={3} /> : n}
              </div>
              <span className={clsx(
                "text-[10px] text-center leading-tight",
                cur ? "font-semibold text-green-700"
                    : done ? "text-green-600"
                           : "text-t3"
              )}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
