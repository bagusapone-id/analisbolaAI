import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length) {
    adminApp = getApps()[0];
    return adminApp;
  }

  // Option 1: full JSON string (set as FIREBASE_SERVICE_ACCOUNT_JSON env var)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      adminApp = initializeApp({ credential: cert(serviceAccount) });
      return adminApp;
    } catch (e) {
      console.error("[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e);
    }
  }

  // Option 2: path to JSON file (local dev only — not available on Vercel)
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    try {
      const fs = require("node:fs") as typeof import("node:fs");
      const path = require("node:path") as typeof import("node:path");
      const serviceAccount = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), serviceAccountPath), "utf8")
      );
      adminApp = initializeApp({ credential: cert(serviceAccount) });
      return adminApp;
    } catch (e) {
      console.error("[firebase-admin] Failed to load FIREBASE_SERVICE_ACCOUNT_PATH:", e);
    }
  }

  // Option 3: three separate env vars (recommended for Vercel)
  const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey      = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error(
      `[firebase-admin] Missing credentials. ` +
      `projectId=${!!projectId} clientEmail=${!!clientEmail} privateKey=${!!rawKey}`
    );
  }

  // Vercel stores the private key with literal \n — replace them with real newlines
  const privateKey = rawKey.replace(/\\n/g, "\n");

  adminApp = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return adminApp;
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb() {
  return getFirestore(getAdminApp());
}
