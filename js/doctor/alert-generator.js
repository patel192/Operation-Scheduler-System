import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const ALERT_TYPES = {
  OVERRUN: "overrun",
  ENDING: "ending_soon",
  UPCOMING: "upcoming"
};

export async function persistAlerts(schedules, doctorId) {
  const now = new Date();

  for (const s of schedules) {
    const start = s.startTime?.toDate();
    const end = s.endTime?.toDate();
    if (!start || !end) continue;

    /* 🔴 OVERRUN */
    if (s.status === "Ongoing" && now > end) {
      await createAlertIfNotExists({
        doctorId,
        scheduleId: s.id,
        type: ALERT_TYPES.OVERRUN,
        severity: "critical",
        title: "Surgery Overrun",
        message: `${s.procedure} exceeded planned duration`,
        meta: `${s.patientName} · OT ${s.otRoomName}`
      });
    }

    /* 🟡 ENDING SOON (15 min) */
    if (
      s.status === "Ongoing" &&
      end - now <= 15 * 60000 &&
      end - now > 0
    ) {
      await createAlertIfNotExists({
        doctorId,
        scheduleId: s.id,
        type: ALERT_TYPES.ENDING,
        severity: "warning",
        title: "Surgery Near Completion",
        message: `${s.procedure} ending soon`,
        meta: `${s.patientName} · OT ${s.otRoomName}`
      });
    }

    /* 🔵 UPCOMING (30 min) */
    if (
      s.status === "Scheduled" &&
      start - now <= 30 * 60000 &&
      start - now > 0
    ) {
      await createAlertIfNotExists({
        doctorId,
        scheduleId: s.id,
        type: ALERT_TYPES.UPCOMING,
        severity: "info",
        title: "Upcoming Surgery",
        message: `${s.procedure} starting soon`,
        meta: `${s.patientName} · OT ${s.otRoomName}`
      });
    }
  }
}

/* ---------- Deduplication ---------- */
async function createAlertIfNotExists(data) {
  const q = query(
    collection(db, "alerts"),
    where("scheduleId", "==", data.scheduleId),
    where("type", "==", data.type)
  );

  const snap = await getDocs(q);
  if (!snap.empty) return; // already exists

  await addDoc(collection(db, "alerts"), {
    ...data,
    read: false,
    createdAt: serverTimestamp()
  });
}
