import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { apiFetch } from "./api-client";
import type { MatchData, SlipData, SlipMatchData } from "./types";

// ─── Slip CRUD ────────────────────────────────────────────────────────────────

export async function createSlip(
  userId: string,
  data: Pick<SlipData, "name" | "description"> & { visibility?: "private" | "public" }
): Promise<string> {
  void userId;
  const result = await apiFetch<{ slipId: string }>("/api/slips", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result.slipId;
}

export async function getUserSlips(
  userId: string
): Promise<(SlipData & { id: string; matchCount: number })[]> {
  const ref = collection(db, "users", userId, "slips");
  const q = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name ?? "",
      description: data.description ?? "",
      visibility: data.visibility === "public" ? "public" : "private",
      ownerRole: data.ownerRole === "admin" ? "admin" : "user",
      matchCount: data.matchCount ?? 0,
      userId: data.userId ?? userId,
      createdAt:
        data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      updatedAt:
        data.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    };
  });
}

export async function getSlip(
  userId: string,
  slipId: string
): Promise<(SlipData & { id: string; matchCount: number }) | null> {
  const docRef = doc(db, "users", userId, "slips", slipId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name ?? "",
    description: data.description ?? "",
    visibility: data.visibility === "public" ? "public" : "private",
    ownerRole: data.ownerRole === "admin" ? "admin" : "user",
    matchCount: data.matchCount ?? 0,
    userId: data.userId ?? userId,
    createdAt:
      data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    updatedAt:
      data.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  };
}

export async function deleteSlip(
  userId: string,
  slipId: string
): Promise<void> {
  void userId;
  await apiFetch(`/api/slips?slipId=${encodeURIComponent(slipId)}`, { method: "DELETE" });
}

export async function updateSlipVisibility(
  userId: string,
  slipId: string,
  visibility: "private" | "public"
): Promise<void> {
  void userId;
  await apiFetch(`/api/slips?slipId=${encodeURIComponent(slipId)}`, {
    method: "PATCH",
    body: JSON.stringify({ visibility }),
  });
}

// ─── Slip Matches ─────────────────────────────────────────────────────────────

export async function saveMatchToSlip(
  userId: string,
  slipId: string,
  data: Omit<MatchData, "createdAt" | "userId">
): Promise<string> {
  void userId;
  const result = await apiFetch<{ matchId: string }>(`/api/slips/${encodeURIComponent(slipId)}/matches`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result.matchId;
}

export async function getSlipMatches(
  userId: string,
  slipId: string
): Promise<(SlipMatchData & { id: string })[]> {
  const ref = collection(
    db,
    "users",
    userId,
    "slips",
    slipId,
    "matches"
  );
  const q = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...(data as Omit<SlipMatchData, "id">),
      slipId,
      createdAt:
        data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    };
  });
}

export async function getSlipMatch(
  userId: string,
  slipId: string,
  matchId: string
): Promise<(SlipMatchData & { id: string }) | null> {
  const docRef = doc(
    db,
    "users",
    userId,
    "slips",
    slipId,
    "matches",
    matchId
  );
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...(data as Omit<SlipMatchData, "id">),
    slipId,
    createdAt:
      data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  };
}

export async function deleteMatchFromSlip(
  userId: string,
  slipId: string,
  matchId: string
): Promise<void> {
  void userId;
  await apiFetch(`/api/slips/${encodeURIComponent(slipId)}/matches?matchId=${encodeURIComponent(matchId)}`, { method: "DELETE" });
}

// ─── Legacy: flat users/{userId}/matches (kept for backward compat) ───────────

export async function saveMatch(
  userId: string,
  data: Omit<MatchData, "createdAt" | "userId">
): Promise<string> {
  void userId;
  const result = await apiFetch<{ matchId: string }>("/api/matches", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result.matchId;
}

export async function getUserMatches(
  userId: string
): Promise<(MatchData & { id: string })[]> {
  const ref = collection(db, "users", userId, "matches");
  const q = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt:
        data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    } as MatchData & { id: string };
  });
}

export async function getMatch(
  userId: string,
  matchId: string
): Promise<(MatchData & { id: string }) | null> {
  const docRef = doc(db, "users", userId, "matches", matchId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt:
      data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  } as MatchData & { id: string };
}
