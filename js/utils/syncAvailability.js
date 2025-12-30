import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/**
 * Sync availability for a single user (Doctor / OT Staff)
 * Availability is derived ONLY from schedules
 */
export async function syncAvailabilityForUser(userId, role) {
  if (!userId || !role) return;

  let q;

  /* ================= DOCTOR ================= */
  if (role === "Doctor") {
    q = query(
      collection(db, "schedules"),
      where("surgeonId", "==", userId),
      where("status", "in", ["Upcoming", "Ongoing"])
    );
  }

  /* ================= OT STAFF ================= */
  else if (role === "OT Staff") {
    q = query(
      collection(db, "schedules"),
      where("otStaffIds", "array-contains", userId),
      where("status", "in", ["Upcoming", "Ongoing"])
    );
  }

  else {
    console.warn("syncAvailabilityForUser: Unknown role", role);
    return;
  }

  const snap = await getDocs(q);

  const availability = snap.empty ? "available" : "busy";

  await updateDoc(doc(db, "users", userId), {
    availability,
  });
}
