import { db } from "../firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export async function createScheduleCreatedAlerts(schedule) {
  const recipients = [
    { userId: schedule.surgeonId, role: "doctor" },
    ...(schedule.otStaffIds || []).map(id => ({
      userId: id,
      role: "ot"
    }))
  ];

  for (const r of recipients) {
    await addDoc(collection(db, "alerts"), {
      userId: r.userId,
      role: r.role,
      scheduleId: schedule.id,
      type: "schedule_created",
      severity: "info",
      title: "New Surgery Scheduled",
      message: `${schedule.procedure} scheduled`,
      meta: `${schedule.patientName} · OT ${schedule.otRoomName}`,
      read: false,
      createdAt: serverTimestamp()
    });
  }
}
