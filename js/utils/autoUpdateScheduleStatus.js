import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { syncAvailabilityForUser } from "./syncAvailability.js";

/**
 * SINGLE SOURCE OF TRUTH
 * ----------------------
 * - Call on interval (schedule board)
 * - Call after manual status change
 * - NEVER call inside onSnapshot
 */
export async function autoUpdateScheduleStatus() {
  const now = new Date();
  const snapshot = await getDocs(collection(db, "schedules"));

  for (const snap of snapshot.docs) {
    const data = snap.data();
    const scheduleId = snap.id;

    // Required fields
    if (!data.startTime || !data.endTime || !data.otRoomId) continue;

    const start = data.startTime.toDate();
    const end = data.endTime.toDate();

    let computedStatus = data.status;

    /* ======================================================
       1️⃣ COMPUTE STATUS (TIME-BASED)
    ====================================================== */
    if (data.status !== "Completed" && data.status !== "Cancelled") {
      if (now < start) computedStatus = "Upcoming";
      else if (now >= start && now < end) computedStatus = "Ongoing";
      else computedStatus = "Completed";

      if (computedStatus !== data.status) {
        await updateDoc(doc(db, "schedules", scheduleId), {
          status: computedStatus,
        });
      }
    }

    /* ======================================================
       2️⃣ OT ROOM SYNC
    ====================================================== */
    const otRef = doc(db, "otRooms", data.otRoomId);

    if (computedStatus === "Ongoing") {
      await updateDoc(otRef, {
        status: "in-use",
        activeScheduleId: scheduleId,
      });
    }

    if (computedStatus === "Completed" || computedStatus === "Cancelled") {
      await updateDoc(otRef, {
        status: "available",
        activeScheduleId: null,
      });
    }

    /* ======================================================
       3️⃣ DOCTOR & STAFF AVAILABILITY
    ====================================================== */
    if (computedStatus === "Ongoing") {
      // 🔒 MARK BUSY
      if (data.surgeonId) {
        await syncAvailabilityForUser(data.surgeonId, "Doctor");
      }

      for (const staffId of data.otStaffIds || []) {
        await syncAvailabilityForUser(staffId, "OT Staff");
      }
    }

    if (computedStatus === "Completed" || computedStatus === "Cancelled") {
      // 🔓 RELEASE
      if (data.surgeonId) {
        await syncAvailabilityForUser(data.surgeonId, "Doctor");
      }

      for (const staffId of data.otStaffIds || []) {
        await syncAvailabilityForUser(staffId, "OT Staff");
      }
    }

    /* ======================================================
       4️⃣ EQUIPMENT MANAGEMENT
    ====================================================== */
    if (
      (computedStatus === "Completed" || computedStatus === "Cancelled") &&
      Array.isArray(data.equipmentIds)
    ) {
      for (const eqId of data.equipmentIds) {
        await updateDoc(doc(db, "equipment", eqId), {
          status: "active",
          currentScheduleId: null,
          // keep currentOtRoomId for location tracking
        });
      }
    }
  }
}
