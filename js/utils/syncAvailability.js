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
 * Availability is derived ONLY from ONGOING schedules
 */
export async function syncAvailabilityForUser(userId, role) {
  if (!userId || !role) return;

  let q;

  if (role === "Doctor") {
    q = query(
      collection(db, "schedules"),
      where("surgeonId", "==", userId),
      where("status", "==", "Ongoing")
    );
  } else if (role === "OT Staff") {
    q = query(
      collection(db, "schedules"),
      where("otStaffIds", "array-contains", userId),
      where("status", "==", "Ongoing")
    );
  } else {
    return;
  }

  const snap = await getDocs(q);

  await updateDoc(doc(db, "users", userId), {
    availability: snap.empty ? "available" : "busy",
  });
}
