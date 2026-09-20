"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/i18n";
import { createSlip } from "@/lib/firestore";
import { apiFetch } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { TopAppBar } from "@/components/layout/TopAppBar";

export default function NewSlipPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const [name, setName]             = useState("");
  const [description, setDesc]      = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [isAdmin, setIsAdmin]       = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    apiFetch<{ role: "user" | "admin" }>("/api/profile").then((profile) => setIsAdmin(profile.role === "admin")).catch(() => undefined);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError(t("slipNameRequired")); return; }
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const slipId = await createSlip(user.uid, { name: trimmed, description: description.trim(), visibility });
      router.push(`/slips/${slipId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedCreateSlip"));
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <TopAppBar
        title={t("newSlipTitle")}
        backHref="/slips"
      />
      <div className="page-body">
      <form onSubmit={handleSubmit}>
        {/* Fields */}
        <div className="field-group mt-6">
          <div className="field-row gap-2">
            <label htmlFor="slip-name" className="field-label w-16 shrink-0 text-[13px]">{t("slipName")}</label>
            <input
              id="slip-name"
              type="text"
              className="field-input"
              placeholder={t("slipNamePlaceholder")}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              maxLength={80}
              required
              autoFocus
            />
          </div>
        </div>

        <p className="section-header">{t("slipDescription")}</p>
        <div className="field-group">
          <textarea
            id="slip-desc"
            className="field-input-full min-h-[88px] resize-none"
            placeholder={t("slipDescPlaceholder")}
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={200}
          />
        </div>

        {isAdmin && (
          <>
            <p className="section-header">Visibility</p>
            <div className="field-group px-4 py-3 flex gap-2">
              <button type="button" onClick={() => setVisibility("private")} className={`flex-1 py-2 rounded-md text-[13px] font-semibold border ${visibility === "private" ? "bg-green-600 text-white border-green-600" : "border-line text-t2"}`}>Private</button>
              <button type="button" onClick={() => setVisibility("public")} className={`flex-1 py-2 rounded-md text-[13px] font-semibold border ${visibility === "public" ? "bg-green-600 text-white border-green-600" : "border-line text-t2"}`}>Public</button>
            </div>
          </>
        )}

        {error && <p className="error-msg">{error}</p>}

        <div className="px-4 mt-8">
          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading && <Spinner size="sm" />}
            {loading ? t("creating") : t("createSlip")}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
