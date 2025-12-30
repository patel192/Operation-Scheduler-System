import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/**
 * Automatically updates schedule status based on time
 *
 * STATUS FLOW:
 * Upcoming → Ongoing → Completed
 *
 * SIDE EFFECTS:
 * - When schedule is Completed or Cancelled:
 *   → free doctor & OT staff availability
 */
export async function autoUpdateScheduleStatus() {
  const now = new Date();
  const snapshot = await getDocs(collection(db, "schedules"));

  for (const d of snapshot.docs) {
    const data = d.data();

    if (!data.startTime || !data.endTime) continue;

    const start = data.startTime.toDate();
    const end = data.endTime.toDate();

    let computedStatus = data.status;

    /* ================= COMPUTE STATUS ================= */
    if (data.status !== "Cancelled") {
      if (now < start) {
        computedStatus = "Upcoming";
      } else if (now >= start && now < end) {
        computedStatus = "Ongoing";
      } else if (now >= end) {
        computedStatus = "Completed";
      }
    }

    /* ================= UPDATE STATUS (ONLY IF CHANGED) ================= */
    if (computedStatus !== data.status) {
      await updateDoc(doc(db, "schedules", d.id), {
        status: computedStatus,
      });
    }

    /* ================= RELEASE RESOURCES (SAFE & IDENTITY-BASED) ================= */
    if (computedStatus === "Completed" || computedStatus === "Cancelled") {

      // 🧑‍⚕️ Free surgeon
      if (data.surgeonId) {
        await updateDoc(doc(db, "users", data.surgeonId), {
          availability: "available",
        });
      }

      // 👩‍⚕️ Free OT staff
      if (Array.isArray(data.otStaffIds)) {
        for (const staffId of data.otStaffIds) {
          await updateDoc(doc(db, "users", staffId), {
            availability: "available",
          });
        }
      }
    }
  }
}
