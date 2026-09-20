"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui/Spinner";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  const pwMatch    = confirm.length > 0 && confirm === password;
  const pwMismatch = confirm.length > 0 && confirm !== password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await signUp(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not create account.";
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
      <div className="flex flex-col items-center pt-12 pb-7 px-6">
        <Image
          src="/logo.png"
          alt="AiSkor360"
          width={80}
          height={80}
          priority
          className="object-contain"
        />
        <p className="mt-2 text-[13px] text-t3">Football analytics &amp; prediction</p>
      </div>

      {/* Section label */}
      <p className="section-header">Create Account</p>

      {/* Fields */}
      <div className="field-group">
        {/* Email */}
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

        {/* Password */}
        <div className="field-row">
          <span className="field-label">Password</span>
          <div className="relative flex-1 min-w-0">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              required
              autoComplete="new-password"
              minLength={6}
              className="field-input w-full pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-t3"
              tabIndex={-1}
              aria-label={showPw ? "Hide" : "Show"}
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

        {/* Confirm */}
        <div className="field-row">
          <span className="field-label">Confirm</span>
          <div className="relative flex-1 min-w-0">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              required
              autoComplete="new-password"
              minLength={6}
              className="field-input w-full pr-20"
              style={{ color: pwMismatch ? "#FF3B30" : undefined }}
            />
            <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {pwMatch && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {pwMismatch && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-t3"
              tabIndex={-1}
              aria-label={showConfirm ? "Hide" : "Show"}
            >
              {showConfirm ? (
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
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </div>

      {/* Footer */}
      <div className="mt-auto px-4 pb-4 pt-8 flex items-center justify-center gap-1">
        <span className="text-[14px] text-t3">Already have an account?</span>
        <Link href="/login" className="text-[14px] text-green-600 font-semibold">
          Sign in
        </Link>
      </div>
    </form>
  );
}
