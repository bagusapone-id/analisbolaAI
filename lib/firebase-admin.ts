import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

function getAdminApp(): App {
  // Return cached instance
  if (adminApp) return adminApp;

  // Reuse an already-initialised app (e.g. hot-reload in dev)
  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  // ── Option 1: full JSON string ─────────────────────────────────────────────
  // Set FIREBASE_SERVICE_ACCOUNT_JSON to the entire service-account JSON as
  // a single-line string. Useful for platforms that support long env values.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      adminApp = initializeApp({ credential: cert(serviceAccount) });
      return adminApp;
    } catch (e) {
      console.error("[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e);
      // fall through to next option
    }
  }

  // ── Option 2: path to JSON file (local dev only) ───────────────────────────
  // NOT available on Vercel — file system is read-only and the file won't exist.
  // Skip silently when the path doesn't resolve.
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    try {
      // Dynamic require keeps firebase-admin out of the Edge bundle
      const fs   = require("node:fs") as typeof import("node:fs");
      const path = require("node:path") as typeof import("node:path");
      const resolved = path.resolve(process.cwd(), serviceAccountPath);
      const serviceAccount = JSON.parse(fs.readFileSync(resolved, "utf8"));
      adminApp = initializeApp({ credential: cert(serviceAccount) });
      return adminApp;
    } catch {
      // File not found on Vercel — expected, fall through to Option 3
    }
  }

  // ── Option 3: three separate env vars (recommended for Vercel) ────────────
  const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID
    ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey      = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    const missing = [
      !projectId   && "FIREBASE_ADMIN_PROJECT_ID",
      !clientEmail && "FIREBASE_ADMIN_CLIENT_EMAIL",
      !rawKey      && "FIREBASE_ADMIN_PRIVATE_KEY",
    ].filter(Boolean).join(", ");
    throw new Error(
      `[firebase-admin] Missing credentials: ${missing}. ` +
      "Set them as environment variables in Vercel (Project Settings → Environment Variables)."
    );
  }

  // Vercel stores multiline values with literal \n — replace with real newlines.
  // Also handle the case where the key was pasted WITH the surrounding quotes
  // (some users copy the JSON value including the outer double-quotes).
  const privateKey = rawKey
    .replace(/^"([\s\S]*)"$/, "$1")  // strip surrounding quotes if present
    .replace(/\\n/g, "\n");           // convert literal \n to real newlines

  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return adminApp;
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb() {
  return getFirestore(getAdminApp());
}
