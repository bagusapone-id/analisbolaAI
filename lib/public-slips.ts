import { adminDb } from "./firebase-admin";

export async function getPublicSlipDocs() {
  const db = adminDb();
  const userRefs = await db.collection("users").listDocuments();
  const snapshots = await Promise.all(
    userRefs.map((userRef) => userRef.collection("slips").where("visibility", "==", "public").get())
  );
  return snapshots.flatMap((snapshot) => snapshot.docs);
}
