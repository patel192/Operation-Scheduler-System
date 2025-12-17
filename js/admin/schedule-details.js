import { db } from "../firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const scheduleId = params.get("id");

if (!scheduleId) {
  alert("Invalid Schedule.");
  window.location.href = "/admin/schedule-board.html";
}

// DOM ELEMENTS
const patientNameEl = document.getElementById("patientName");
const procedureEl = document.getElementById("procedure");
const otRoomEl = document.getElementById("otRoom");
const timeRangeEl = document.getElementById("timeRange");
const surgeonEl = document.getElementById("surgeon");
const anesthEl = document.getElementById("anesthesiologist");
const statusBadgeEl = document.getElementById("statusBadge");
const notesEl = document.getElementById("notes");

const btnOngoing = document.getElementById("markOngoing");
const btnCompleted = document.getElementById("markCompleted");
const btnCancel = document.getElementById("cancelSchedule");

// HELPERS
function formatTime(ts) {
  return ts.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status) {
  if (status === "Completed") return "bg-green-100 text-green-700";
  if (status === "Ongoing") return "bg-yellow-100 text-yellow-700";
  return "bg-blue-100 text-blue-700";
}

// LOAD DATA
async function loadSchedule() {
  const ref = doc(db, "schedules", scheduleId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    alert("Schedule not found.");
    window.location.href = "/admin/schedule-board.html";
    return;
  }

  const d = snap.data();
  console.log(d);

  patientNameEl.textContent = d.patientName || "-";
  procedureEl.textContent = d.procedure || "-";
  otRoomEl.textContent = d.otRoom || "-";
  surgeonEl.textContent = d.surgeon || "-";
  anesthEl.textContent = d.anesthesiologist || "-";
  notesEl.textContent = d.notes || "No notes";

  timeRangeEl.textContent = `${formatTime(d.startTime)} - ${formatTime(
    d.endTime
  )}`;

  statusBadgeEl.textContent = d.status || "Upcoming";
  statusBadgeEl.className = `inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusClass(
    d.status
  )}`;
}

// ACTIONS
btnOngoing.addEventListener("click", async () => {
  await updateDoc(doc(db, "schedules", scheduleId), {
    status: "Ongoing",
  });
  loadSchedule();
});

btnCompleted.addEventListener("click", async () => {
  await updateDoc(doc(db, "schedules", scheduleId), {
    status: "Completed",
  });
  loadSchedule();
});

btnCancel.addEventListener("click", async () => {
  const ok = confirm("Are you sure you want to cancel this schedule?");
  if (!ok) return;

  await deleteDoc(doc(db, "schedules", scheduleId));
  window.location.href = "/admin/schedule-board.html";
});

// INIT
loadSchedule();
