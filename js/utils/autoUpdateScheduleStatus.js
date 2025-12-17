import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export async function autoUpdateScheduleStatus() {
  const now = new Date();

  const snapshot = await getDocs(collection(db, "schedules"));

  for (const d of snapshot.docs) {
    const data = d.data();

    // ❗ Skip cancelled schedules
    if (data.status === "Cancelled") continue;

    // ✅ Convert Firestore timestamps
    const start = data.startTime?.toDate();
    const end = data.endTime?.toDate();

    if (!start || !end) continue;

    let newStatus = data.status;

    if (now < start) newStatus = "Upcoming";
    else if (now >= start && now < end) newStatus = "Ongoing";
    else if (now >= end) newStatus = "Completed";

    // 🔄 Update only if changed
    if (newStatus !== data.status) {
      await updateDoc(doc(db, "schedules", d.id), {
        status: newStatus,
      });
    }
  }
}
