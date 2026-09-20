import { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";

export async function requireServerUser(req: NextRequest) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const token = header.slice("Bearer ".length);
  return adminAuth().verifyIdToken(token);
}

export function jsonError(message: string, status = 400, code?: string) {
  return Response.json({ error: message, code: code ?? message }, { status });
}
