"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, Plus, Clock, MoreHorizontal } from "lucide-react";
import { useLang } from "@/lib/i18n";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard",  icon: Home,          labelKey: "navHome"    as const },
  { href: "/slips",      icon: Layers,        labelKey: "navSlips"   as const },
  { href: "/history",    icon: Clock,         labelKey: "navHistory" as const },
  { href: "/menu",       icon: MoreHorizontal,labelKey: "navMenu"    as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLang();

  const isInsideSlipContext = !!pathname && /^\/slips\/[^/]+(?:\/.*)?$/.test(pathname) && !pathname.startsWith("/slips/new");
  const addHref = isInsideSlipContext ? `${pathname.split("/slips/")[0] ?? ""}/slips/${pathname.split("/slips/")[1]?.split("/")[0]}/matches/new` : "/slips/new";
  const addLabel = isInsideSlipContext ? t("addMatch") : t("navAdd");

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="bottom-nav-content">
        {/* Regular items — split around center ADD button */}
        {NAV_ITEMS.slice(0, 2).map(({ href, icon: Icon, labelKey }) => {
          const active = pathname === href || pathname.startsWith(href + "/") && href !== "/slips";
          const slipActive = href === "/slips" && (pathname === "/slips" || (pathname.startsWith("/slips") && !pathname.startsWith("/slips/new")));
          const isActive = href === "/slips" ? slipActive : active;
          return (
            <Link key={href} href={href} className={clsx("nav-item", isActive && "active")}>
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="nav-item-label">{t(labelKey)}</span>
            </Link>
          );
        })}

        {/* ADD — center primary action */}
        <Link href={addHref} className="nav-add" aria-label={addLabel}>
          <div className="nav-add-icon">
            <Plus size={22} strokeWidth={2.5} color="white" />
          </div>
          <span className="nav-add-label">{addLabel}</span>
        </Link>

        {NAV_ITEMS.slice(2).map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={clsx("nav-item", isActive && "active")}>
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="nav-item-label">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
