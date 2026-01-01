import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { syncAvailabilityForUser } from "./syncAvailability.js";

export async function autoUpdateScheduleStatus() {
  const now = new Date();
  const snapshot = await getDocs(collection(db, "schedules"));

  for (const d of snapshot.docs) {
    const data = d.data();

    if (!data.startTime || !data.endTime || !data.otRoom) continue;

    const start = data.startTime.toDate();
    const end = data.endTime.toDate();

    let computedStatus = data.status;

    // ===== STATUS COMPUTATION =====
    if (data.status !== "Cancelled") {
      if (now < start) computedStatus = "Upcoming";
      else if (now >= start && now < end) computedStatus = "Ongoing";
      else computedStatus = "Completed";
    }

    // ===== UPDATE SCHEDULE STATUS =====
    if (computedStatus !== data.status) {
      await updateDoc(doc(db, "schedules", d.id), {
        status: computedStatus,
      });
    }

    // ===== OT ROOM STATUS (CORRECT WAY) =====
    const otQuery = query(
      collection(db, "otRooms"),   // ✅ correct collection name
      where("name", "==", data.otRoom)
    );

    const otSnap = await getDocs(otQuery);

    for (const otDoc of otSnap.docs) {
      if (computedStatus === "Ongoing") {
        await updateDoc(doc(db, "otRooms", otDoc.id), {
          status: "in-use",
          activeScheduleId: d.id,
        });
      }

      if (computedStatus === "Completed" || computedStatus === "Cancelled") {
        await updateDoc(doc(db, "otRooms", otDoc.id), {
          status: "available",
          activeScheduleId: null,
        });
      }
    }

    // ===== RELEASE DOCTOR & STAFF =====
    if (computedStatus === "Completed" || computedStatus === "Cancelled") {
      if (data.surgeonId) {
        await syncAvailabilityForUser(data.surgeonId, "Doctor");
      }

      for (const staffId of data.otStaffIds || []) {
        await syncAvailabilityForUser(staffId, "OT Staff");
      }
    }
  }
}
