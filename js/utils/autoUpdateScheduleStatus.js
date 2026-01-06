import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { syncAvailabilityForUser } from "./syncAvailability.js";
import { persistAlerts } from "../automation/persistAlerts.js";

/**
 * SINGLE SOURCE OF TRUTH
 * ----------------------
 * - Time-based automation
 * - Manual override respected
 * - Resource lock & release enforced
 */
export async function autoUpdateScheduleStatus() {
  const now = new Date();
  const snapshot = await getDocs(collection(db, "schedules"));

  const schedulesForAlerts = [];

  for (const snap of snapshot.docs) {
    const data = snap.data();
    const scheduleId = snap.id;

    if (!data.startTime || !data.endTime || !data.otRoomId) continue;

    const start = data.startTime.toDate();
    const end = data.endTime.toDate();

    let computedStatus;

    // 1️⃣ STATUS DECISION
    if (data.status === "Completed" || data.status === "Cancelled") {
      computedStatus = data.status;
    } else {
      if (now < start) computedStatus = "Upcoming";
      else if (now >= start && now < end) computedStatus = "Ongoing";
      else computedStatus = "Completed";
    }

    if (computedStatus !== data.status) {
      await updateDoc(doc(db, "schedules", scheduleId), {
        status: computedStatus,
      });
    }

    // 2️⃣ OT ROOM SYNC
    const otRef = doc(db, "otRooms", data.otRoomId);
    if (computedStatus === "Ongoing") {
      await updateDoc(otRef, {
        status: "in-use",
        activeScheduleId: scheduleId,
      });
    } else {
      await updateDoc(otRef, {
        status: "available",
        activeScheduleId: null,
      });
    }

    // 3️⃣ EQUIPMENT MANAGEMENT
    if (Array.isArray(data.equipmentIds)) {
      for (const eqId of data.equipmentIds) {
        if (computedStatus === "Ongoing") {
          await updateDoc(doc(db, "equipment", eqId), {
            status: "in-use",
            currentScheduleId: scheduleId,
            currentOtRoomId: data.otRoomId,
            currentOtRoomName: data.otRoomName || null,
          });
        } else {
          await updateDoc(doc(db, "equipment", eqId), {
            status: "active",
            currentScheduleId: null,
            currentOtRoomId: null,
            currentOtRoomName: null,
            lastUsedAt: new Date(),
          });
        }
      }
    }

    // 4️⃣ AVAILABILITY SYNC
    if (data.surgeonId) {
      await syncAvailabilityForUser(data.surgeonId, "Doctor");
    }
    for (const staffId of data.otStaffIds || []) {
      await syncAvailabilityForUser(staffId, "OT Staff");
    }

    // 👉 Collect FINAL schedule state for alerts
    schedulesForAlerts.push({
      id: scheduleId,
      ...data,
      status: computedStatus, // ensure alerts see final status
    });
  }

  // 🔔 EMIT TIME-BASED ALERTS (ONCE PER RUN)
  await persistAlerts(schedulesForAlerts);
}

