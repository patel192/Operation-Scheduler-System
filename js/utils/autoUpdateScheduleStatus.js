import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { syncAvailabilityForUser } from "./syncAvailability.js";

/**
 * Automatically updates schedule status based on time
 *
 * STATUS FLOW:
 * Upcoming → Ongoing → Completed
 *
 * IMPORTANT RULE:
 * - Manual states (Completed, Cancelled) are FINAL
 */
export async function autoUpdateScheduleStatus() {
  const now = new Date();
  const snapshot = await getDocs(collection(db, "schedules"));

  for (const d of snapshot.docs) {
    const data = d.data();

    if (!data.startTime || !data.endTime) continue;

    // ✅ DO NOT OVERRIDE MANUAL STATES
    if (data.status === "Completed" || data.status === "Cancelled") {
      continue;
    }

    const start = data.startTime.toDate();
    const end = data.endTime.toDate();

    let computedStatus = data.status;

    /* ================= COMPUTE STATUS ================= */
    if (now < start) {
      computedStatus = "Upcoming";
    } else if (now >= start && now < end) {
      computedStatus = "Ongoing";
    } else if (now >= end) {
      computedStatus = "Completed";
    }

    /* ================= UPDATE STATUS ================= */
    if (computedStatus !== data.status) {
      await updateDoc(doc(db, "schedules", d.id), {
        status: computedStatus,
      });
    }

    /* ================= RELEASE RESOURCES ================= */
    if (computedStatus === "Completed") {
      // 🧑‍⚕️ Free surgeon
      if (data.surgeonId) {
        await syncAvailabilityForUser(data.surgeonId, "Doctor");
      }

      // 👩‍⚕️ Free OT staff
      for (const staffId of data.otStaffIds || []) {
        await syncAvailabilityForUser(staffId, "OT Staff");
      }
    }
  }
}
