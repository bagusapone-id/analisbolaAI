import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex flex-1 flex-col w-full max-w-lg bg-bg" style={{ minHeight: "100dvh" }}>
        {children}
      </div>
    </AuthProvider>
  );
}
