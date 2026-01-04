import { db } from "../firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { autoUpdateScheduleStatus } from "../utils/autoUpdateScheduleStatus.js";

const params = new URLSearchParams(window.location.search);
const scheduleId = params.get("id");

if (!scheduleId) {
  alert("Invalid schedule");
  window.location.href = "/admin/schedule-board.html";
}

/* ELEMENTS */
const patientNameEl = document.getElementById("patientName");
const procedureEl = document.getElementById("procedure");
const otRoomEl = document.getElementById("otRoom");
const timeRangeEl = document.getElementById("timeRange");
const surgeonEl = document.getElementById("surgeon");
const anesthEl = document.getElementById("anesthesiologist");
const notesEl = document.getElementById("notes");
const statusBadgeEl = document.getElementById("statusBadge");

const btnOngoing = document.getElementById("markOngoing");
const btnCompleted = document.getElementById("markCompleted");
const btnCancel = document.getElementById("cancelSchedule");

/* HELPERS */
function formatTime(ts) {
  return ts.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status) {
  if (status === "Completed")
    return "bg-emerald-100 text-emerald-700";
  if (status === "Ongoing")
    return "bg-amber-100 text-amber-700";
  if (status === "Cancelled")
    return "bg-red-100 text-red-700";
  return "bg-blue-100 text-blue-700";
}

/* LOAD */
async function loadSchedule() {
  const ref = doc(db, "schedules", scheduleId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Schedule not found");
    window.location.href = "/admin/schedule-board.html";
    return;
  }

  const d = snap.data();

  patientNameEl.textContent = d.patientName || "—";
  procedureEl.textContent = d.procedure || "—";
  otRoomEl.textContent = d.otRoomName || "—";
  surgeonEl.textContent = d.surgeonName || "—";
  anesthEl.textContent = d.anesthesiologist || "—";
  notesEl.textContent = d.notes || "No clinical notes";

  timeRangeEl.innerHTML =
    `<i data-lucide="clock" class="w-4"></i>
     ${formatTime(d.startTime)} – ${formatTime(d.endTime)}`;

  statusBadgeEl.textContent = d.status || "Upcoming";
  statusBadgeEl.className =
    `px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${statusClass(d.status)}`;

  btnOngoing.disabled = d.status !== "Upcoming";
  btnCompleted.disabled = d.status === "Completed" || d.status === "Cancelled";

  btnOngoing.classList.toggle("opacity-50", btnOngoing.disabled);
  btnCompleted.classList.toggle("opacity-50", btnCompleted.disabled);

  lucide.createIcons();
}

/* ACTIONS */
btnOngoing.onclick = async () => {
  await updateDoc(doc(db, "schedules", scheduleId), { status: "Ongoing" });
  await autoUpdateScheduleStatus();
  await loadSchedule();
};

btnCompleted.onclick = async () => {
  await updateDoc(doc(db, "schedules", scheduleId), { status: "Completed" });
  await autoUpdateScheduleStatus();
  await loadSchedule();
};

btnCancel.onclick = async () => {
  if (!confirm("Cancel this schedule?")) return;
  await updateDoc(doc(db, "schedules", scheduleId), { status: "Cancelled" });
  await autoUpdateScheduleStatus();
  window.location.href = "/admin/schedule-board.html";
};

loadSchedule();
