"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Unlock } from "lucide-react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/api-client";

type PublicSlip = { id: string; name: string; description: string; matchCount: number; unlocked: boolean };

export default function SlipJadiPage() {
  const [tab, setTab] = useState<"locked" | "unlocked">("locked");
  const [slips, setSlips] = useState<PublicSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { apiFetch<{ slips: PublicSlip[] }>("/api/public-slips").then((body) => setSlips(body.slips)).catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat VIP Slip Prediction.")).finally(() => setLoading(false)); }, []);
  const visible = slips.filter((slip) => tab === "unlocked" ? slip.unlocked : !slip.unlocked);
  return <div className="page"><TopAppBar title="VIP Slip Prediction" backHref="/dashboard" /><div className="page-body"><div className="flex gap-2 px-4 py-3 border-b border-line"><button type="button" onClick={() => setTab("locked")} className={`flex-1 py-2 text-[13px] font-semibold rounded-md ${tab === "locked" ? "bg-green-600 text-white" : "bg-surface text-t2 border border-line"}`}>Locked</button><button type="button" onClick={() => setTab("unlocked")} className={`flex-1 py-2 text-[13px] font-semibold rounded-md ${tab === "unlocked" ? "bg-green-600 text-white" : "bg-surface text-t2 border border-line"}`}>Unlocked</button></div>{loading ? <div className="flex justify-center py-12"><Spinner size="lg" className="text-green-600" /></div> : error ? <p className="error-msg">{error}</p> : visible.length === 0 ? <p className="text-center text-[13px] text-t3 px-4 py-14">Belum ada Slip Jadi di bagian ini.</p> : <div className="list-surface">{visible.map((slip) => <Link key={slip.id} href={`/slip-jadi/${slip.id}`} className="list-row"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-600">{slip.unlocked ? <Unlock size={17} /> : <Lock size={17} />}</div><div className="min-w-0 flex-1"><p className="list-row-title truncate">{slip.name}</p><p className="list-row-sub">{slip.matchCount} Matches · {slip.unlocked ? "Unlocked" : "1 Key"}</p></div></Link>)}</div>}</div></div>;
}
