"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";

interface TopAppBarProps {
  title: string;
  /** If provided, renders a back button that navigates to this href */
  backHref?: string;
  /** Callback override for back press (instead of href) */
  onBack?: () => void;
  /** Right-side action slot */
  right?: React.ReactNode;
  /** Extra className for the bar root */
  className?: string;
}

export function TopAppBar({
  title,
  backHref,
  onBack,
  right,
  className,
}: TopAppBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    if (backHref) { router.push(backHref); return; }
    router.back();
  };

  return (
    <header className={clsx("top-bar", className)}>
      <div className="top-bar-content">
        {(backHref !== undefined || onBack !== undefined) && (
          <button
            onClick={handleBack}
            className="btn-icon -ml-2 shrink-0 text-green-600"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <h1 className="top-bar-title">{title}</h1>
        {right && (
          <div className="flex items-center gap-1 shrink-0">{right}</div>
        )}
      </div>
    </header>
  );
}
