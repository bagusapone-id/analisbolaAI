import { auth } from "./firebase";

// Maps server error messages/codes to user-facing Indonesian/English messages.
// The key matches the `error` or `code` field returned by the API.
const ERROR_MESSAGES: Record<string, { id: string; en: string }> = {
  "Free users can create only one Slip. Upgrade to VIP.": {
    id: "User Free hanya bisa membuat 1 Slip. Upgrade ke VIP untuk lebih.",
    en: "Free users can only create 1 Slip. Upgrade to VIP for more.",
  },
  "Free users can create only 3 matches. Upgrade to VIP.": {
    id: "User Free hanya bisa membuat 3 laga per slip. Upgrade ke VIP.",
    en: "Free users can only create 3 matches per slip. Upgrade to VIP.",
  },
  "Slip not found": {
    id: "Slip tidak ditemukan.",
    en: "Slip not found.",
  },
  "Match not found": {
    id: "Laga tidak ditemukan.",
    en: "Match not found.",
  },
  "Slip not found.": {
    id: "Slip tidak ditemukan.",
    en: "Slip not found.",
  },
  "Unauthorized": {
    id: "Sesi kamu habis. Silakan login ulang.",
    en: "Session expired. Please log in again.",
  },
  "Only admins can change Slip visibility.": {
    id: "Hanya admin yang bisa mengubah visibilitas slip.",
    en: "Only admins can change Slip visibility.",
  },
};

function getLocale(): "id" | "en" {
  try {
    const stored = localStorage.getItem("aiscore360_lang");
    return stored === "en" ? "en" : "id";
  } catch {
    return "id";
  }
}

function localizeError(serverMessage: string): string {
  const locale = getLocale();
  const mapped = ERROR_MESSAGES[serverMessage];
  if (mapped) return mapped[locale];
  return serverMessage;
}

export async function apiFetch<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error(localizeError("Unauthorized"));
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  // Only set Content-Type for requests that have a body
  if (init.body !== undefined && init.body !== null) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(input, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const rawMessage: string = body.error ?? "Request failed";
    throw new Error(localizeError(rawMessage));
  }
  return body as T;
}
