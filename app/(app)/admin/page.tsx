"use client";

import { useEffect, useState } from "react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { apiFetch } from "@/lib/api-client";
import { Spinner } from "@/components/ui/Spinner";

type Member = { id: string; email: string; membership: "free" | "vip"; keys: number; role: "user" | "admin" };

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { apiFetch<{ users: Member[] }>("/api/admin/users").then((body) => setMembers(body.users)).catch((e) => setError(e instanceof Error ? e.message : "Akses admin ditolak.")).finally(() => setLoading(false)); }, []);
  const update = async (member: Member) => { try { await apiFetch("/api/admin/users", { method: "PATCH", body: JSON.stringify({ userId: member.id, membership: member.membership, keys: member.keys }) }); } catch (e) { setError(e instanceof Error ? e.message : "Gagal memperbarui user."); } };
  return <div className="page"><TopAppBar title="Admin" backHref="/menu" /><div className="page-body">{loading ? <div className="flex justify-center py-12"><Spinner size="lg" className="text-green-600" /></div> : error ? <p className="error-msg">{error}</p> : <div className="list-surface">{members.map((member) => <div key={member.id} className="p-4 border-b border-line"><p className="text-[13px] font-semibold text-t1 truncate">{member.email || member.id}</p><div className="flex gap-2 mt-2"><select value={member.membership} onChange={(e) => setMembers((all) => all.map((item) => item.id === member.id ? { ...item, membership: e.target.value as Member["membership"] } : item))} className="input-standalone flex-1"><option value="free">Free</option><option value="vip">VIP</option></select><input type="number" min="0" value={member.keys} onChange={(e) => setMembers((all) => all.map((item) => item.id === member.id ? { ...item, keys: Number(e.target.value) } : item))} className="input-num w-20" /><button type="button" onClick={() => update(member)} className="btn-primary">Save</button></div></div>)}</div>}</div></div>;
}
