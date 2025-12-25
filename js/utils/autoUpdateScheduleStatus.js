import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/**
 * Automatically updates schedule status based on time
 * RULES:
 * - Upcoming → before start
 * - Ongoing → between start & end
 * - Completed → after end
 *
 * IMPORTANT:
 * - Do NOT override manually set statuses:
 *   - Completed
 *   - Cancelled
 */
export async function autoUpdateScheduleStatus() {
  const now = new Date();

  const snapshot = await getDocs(collection(db, "schedules"));

  for (const d of snapshot.docs) {
    const data = d.data();

    // 🛑 Respect manual overrides
    if (data.status === "Completed") continue;
    if (data.status === "Cancelled") continue;

    // ⏱ Ensure timestamps exist
    if (!data.startTime || !data.endTime) continue;

    const start = data.startTime.toDate();
    const end = data.endTime.toDate();

    let newStatus = data.status;

    if (now < start) {
      newStatus = "Upcoming";
    } else if (now >= start && now < end) {
      newStatus = "Ongoing";
    } else if (now >= end) {
      newStatus = "Completed";
    }

    // 🔄 Update only if status changed
    if (newStatus !== data.status) {
      await updateDoc(doc(db, "schedules", d.id), {
        status: newStatus,
      });
    }
  }
}
