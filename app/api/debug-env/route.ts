/**
 * TEMPORARY diagnostic endpoint — DELETE after fixing the issue.
 * Does NOT import firebase-admin. Only reads env vars.
 */
export const runtime = "nodejs";

export async function GET() {
  const val = (key: string) => {
    const v = process.env[key];
    if (!v) return "❌ MISSING";
    const sensitive = key.includes("KEY") || key.includes("SECRET") || key.includes("EMAIL") || key.includes("PRIVATE");
    return sensitive ? `✅ SET (${v.length} chars, starts: ${v.slice(0, 8)})` : `✅ ${v}`;
  };

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "";
  const keyChecks = {
    raw_length:              privateKey.length,
    has_begin_header:        privateKey.includes("BEGIN PRIVATE KEY"),
    has_end_footer:          privateKey.includes("END PRIVATE KEY"),
    has_literal_backslash_n: privateKey.includes("\\n"),
    has_real_newlines:       privateKey.includes("\n"),
    starts_with_quote:       privateKey.startsWith('"'),
    ends_with_quote:         privateKey.endsWith('"'),
    first_20_chars:          JSON.stringify(privateKey.slice(0, 20)),
  };

  return Response.json({
    env_vars: {
      FIREBASE_ADMIN_PROJECT_ID:      val("FIREBASE_ADMIN_PROJECT_ID"),
      FIREBASE_ADMIN_CLIENT_EMAIL:    val("FIREBASE_ADMIN_CLIENT_EMAIL"),
      FIREBASE_ADMIN_PRIVATE_KEY:     val("FIREBASE_ADMIN_PRIVATE_KEY"),
      FIREBASE_SERVICE_ACCOUNT_JSON:  val("FIREBASE_SERVICE_ACCOUNT_JSON"),
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: val("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
      PAKASIR_PROJECT:                val("PAKASIR_PROJECT"),
      NEXT_PUBLIC_APP_URL:            val("NEXT_PUBLIC_APP_URL"),
    },
    private_key_analysis: keyChecks,
    node_version: process.version,
  });
}
