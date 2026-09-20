"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui/Spinner";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials.";
      setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col w-full max-w-lg bg-bg"
      style={{
        minHeight: "100dvh",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 24px)",
      }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center pt-14 pb-8 px-6">
        <Image
          src="/logo.png"
          alt="AiSkor360"
          width={88}
          height={88}
          priority
          className="object-contain"
        />
        <p className="mt-2 text-[13px] text-t3">Football analytics &amp; prediction</p>
      </div>

      {/* Section label */}
      <p className="section-header">Sign In</p>

      {/* Fields */}
      <div className="field-group">
        <div className="field-row">
          <span className="field-label">Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            required
            autoComplete="email"
            autoFocus
            className="field-input"
          />
        </div>
        <div className="field-row">
          <span className="field-label">Password</span>
          <div className="relative flex-1 min-w-0">
            <input
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              required
              autoComplete="current-password"
              minLength={6}
              className="field-input w-full pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-t3"
              tabIndex={-1}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <p className="error-msg px-4 pt-2">{error}</p>}

      {/* Submit */}
      <div className="px-4 mt-6">
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <Spinner size="sm" />}
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </div>

      {/* Footer */}
      <div className="mt-auto px-4 pb-4 pt-8 flex items-center justify-center gap-1">
        <span className="text-[14px] text-t3">Don&apos;t have an account?</span>
        <Link href="/register" className="text-[14px] text-green-600 font-semibold">
          Create one
        </Link>
      </div>
    </form>
  );
}
