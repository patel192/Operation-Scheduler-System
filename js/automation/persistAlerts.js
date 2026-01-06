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

export async function persistAlerts(schedules) {
  const now = new Date();

  for (const s of schedules) {
    const start = s.startTime?.toDate();
    const end = s.endTime?.toDate();
    if (!start || !end) continue;

    const recipients = [
      { userId: s.surgeonId, role: "doctor" },
      ...(s.otStaffIds || []).map(id => ({
        userId: id,
        role: "ot"
      }))
    ];

    /* 🔴 OVERRUN */
    if (s.status === "Ongoing" && now > end) {
      for (const r of recipients) {
        await createAlertIfNotExists({
          userId: r.userId,
          role: r.role,
          scheduleId: s.id,
          type: ALERT_TYPES.OVERRUN,
          severity: "critical",
          title: "Surgery Overrun",
          message: `${s.procedure} exceeded planned duration`,
          meta: `${s.patientName} · OT ${s.otRoomName}`
        });
      }
    }

    /* 🟡 ENDING SOON (15 min) */
    if (
      s.status === "Ongoing" &&
      end - now <= 15 * 60000 &&
      end - now > 0
    ) {
      for (const r of recipients) {
        await createAlertIfNotExists({
          userId: r.userId,
          role: r.role,
          scheduleId: s.id,
          type: ALERT_TYPES.ENDING,
          severity: "warning",
          title: "Surgery Near Completion",
          message: `${s.procedure} ending soon`,
          meta: `${s.patientName} · OT ${s.otRoomName}`
        });
      }
    }

    /* 🔵 UPCOMING (30 min) */
    if (
      s.status === "Upcoming" &&
      start - now <= 30 * 60000 &&
      start - now > 0
    ) {
      for (const r of recipients) {
        await createAlertIfNotExists({
          userId: r.userId,
          role: r.role,
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
}

/* ---------- Deduplication (PER USER) ---------- */
async function createAlertIfNotExists(data) {
  const q = query(
    collection(db, "alerts"),
    where("scheduleId", "==", data.scheduleId),
    where("type", "==", data.type),
    where("userId", "==", data.userId)
  );

  const snap = await getDocs(q);
  if (!snap.empty) return;

  await addDoc(collection(db, "alerts"), {
    ...data,
    read: false,
    createdAt: serverTimestamp()
  });
}
