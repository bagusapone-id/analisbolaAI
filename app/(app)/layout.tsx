"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthProvider } from "@/lib/auth-context";
import { LangProvider } from "@/lib/i18n";
import { BottomNav } from "@/components/layout/BottomNav";
import { LiveScoreFAB } from "@/components/ui/LiveScoreFAB";
import { Spinner } from "@/components/ui/Spinner";

// Paths where bottom nav is hidden (wizard / form focus)
const HIDE_NAV_PREFIXES = [
  "/slips/new",
  "/matches/new",
];
function isWizardPath(path: string) {
  return HIDE_NAV_PREFIXES.some((p) => path.startsWith(p))
    || /\/slips\/[^/]+\/matches\/new/.test(path);
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex-1 flex min-h-[100dvh] items-center justify-center bg-bg">
        <Spinner size="lg" className="text-green-600" />
      </div>
    );
  }
  if (!user) return null;

  const hideNav = isWizardPath(pathname ?? "");

  return (
    <div
      className="flex flex-col w-full max-w-lg mx-auto bg-bg"
      style={{ height: '100dvh', overflow: 'hidden' }}
    >
      <main className="flex flex-col flex-1 bg-bg" style={{ minHeight: 0, overflow: 'hidden' }}>
        {children}
      </main>
      <LiveScoreFAB />
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LangProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </LangProvider>
    </AuthProvider>
  );
}
