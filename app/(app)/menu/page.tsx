"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLang, type Locale } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { ChevronRight, Check, User, Globe, LogOut } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { apiFetch } from "@/lib/api-client";

type Profile = {
  membership: "free" | "vip";
  keys: number;
  role: "user" | "admin";
};

export default function MenuPage() {
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useLang();
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    apiFetch<Profile>("/api/profile").then((nextProfile) => {
      setProfile(nextProfile);
      setIsAdmin(nextProfile.role === "admin");
    }).catch(() => undefined);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const langs: { code: Locale; label: string }[] = [
    { code: "id", label: t("menuLangId") },
    { code: "en", label: t("menuLangEn") },
  ];

  return (
    <div className="page">
      <TopAppBar title={t("menuTitle")} />
      <div className="page-body">

      {/* Account */}
      <p className="section-header">{t("menuAccount")}</p>
      <div className="list-surface">
        <div className="list-row cursor-default active:bg-surface">
          <User size={18} className="text-t3 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="list-row-title truncate">{user?.email ?? "—"}</p>
          </div>
        </div>
        <div className="list-row cursor-default active:bg-surface">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-t3">{t("menuMembership")}</p>
            <p className="list-row-title">{profile ? (profile.membership === "vip" ? t("menuVip") : t("menuFree")) : t("menuKeysLoading")}</p>
          </div>
          {profile?.membership === "vip" && <span className="badge-green">VIP</span>}
        </div>
        <div className="list-row cursor-default active:bg-surface">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-t3">{t("menuRole")}</p>
            <p className="list-row-title">{profile?.role === "admin" ? "Admin" : "User"}</p>
          </div>
        </div>
        <div className="list-row cursor-default active:bg-surface">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-t3">{t("menuKeys")}</p>
            <p className="list-row-title">{profile ? profile.keys : t("menuKeysLoading")}</p>
          </div>
          <Link href="/store" className="text-[12px] font-semibold text-green-600">Beli</Link>
        </div>
      </div>

      {isAdmin && (
        <div className="list-surface mt-3">
          <Link href="/admin" className="list-row">
            <span className="flex-1 list-row-title">Admin Member Management</span>
            <ChevronRight size={18} className="text-t3" />
          </Link>
        </div>
      )}

      <p className="section-header">Premium</p>
      <div className="list-surface">
        <Link href="/slip-jadi" className="list-row">
          <span className="flex-1 list-row-title">VIP Slip Prediction</span>
          <ChevronRight size={18} className="text-t3" />
        </Link>
        <Link href="/store" className="list-row">
          <span className="flex-1 list-row-title">Toko</span>
          <ChevronRight size={18} className="text-t3" />
        </Link>
      </div>

      {/* Language */}
      <p className="section-header">{t("menuLanguage")}</p>
      <div className="list-surface">
        {langs.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setLocale(code)}
            className="list-row w-full text-left"
          >
            <Globe size={18} className="text-t3 shrink-0" />
            <span className="flex-1 list-row-title">{label}</span>
            {locale === code && (
              <Check size={18} className="text-green-600 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="px-4 mt-8 mb-6">
        <button
          onClick={() => setShowLogout(true)}
          className="btn-danger w-full justify-center"
        >
          <LogOut size={18} />
          {t("menuLogout")}
        </button>
      </div>

      <ConfirmDialog
        open={showLogout}
        title={t("logoutConfTitle")}
        description={t("logoutConfDesc")}
        confirmLabel={t("menuLogout")}
        cancelLabel={t("cancel")}
        loading={loggingOut}
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
      </div>
    </div>
  );
}
