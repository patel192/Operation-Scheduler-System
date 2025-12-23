import { auth, db } from "../firebase.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ------------------
// URL PARAM
// ------------------
const params = new URLSearchParams(window.location.search);
const scheduleId = params.get("id");

if (!scheduleId) {
  alert("Invalid schedule");
  window.location.href = "/doctor/my-schedule.html";
}

// ------------------
// ELEMENTS
// ------------------
const patientNameEl = document.getElementById("patientName");
const patientIdEl = document.getElementById("patientId");
const departmentEl = document.getElementById("department");
const procedureEl = document.getElementById("procedure");
const otRoomEl = document.getElementById("otRoom");
const timeRangeEl = document.getElementById("timeRange");
const surgeonEl = document.getElementById("surgeon");
const anesthEl = document.getElementById("anesthesiologist");
const notesEl = document.getElementById("notes");
const statusBadgeEl = document.getElementById("statusBadge");

const btnCompleted = document.getElementById("markCompleted");

// ------------------
// HELPERS
// ------------------
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

// ------------------
// LOAD DATA
// ------------------
async function loadSchedule() {
  const ref = doc(db, "schedules", scheduleId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Schedule not found");
    window.location.href = "/doctor/my-schedule.html";
    return;
  }

  const d = snap.data();

  // 🔒 SECURITY: ensure this doctor is assigned
  if (d.surgeonId !== auth.currentUser.uid) {
    alert("Unauthorized access");
    window.location.href = "/doctor/my-schedule.html";
    return;
  }

  patientNameEl.textContent = d.patientName;
  patientIdEl.textContent = d.patientId || "-";
  departmentEl.textContent = d.department;
  procedureEl.textContent = d.procedure;
  otRoomEl.textContent = d.otRoom;
  surgeonEl.textContent = d.surgeonName;
  anesthEl.textContent = d.anesthesiologist || "-";
  notesEl.textContent = d.notes || "No notes";

  timeRangeEl.textContent =
    `${formatTime(d.startTime)} - ${formatTime(d.endTime)}`;

  statusBadgeEl.textContent = d.status;
  statusBadgeEl.className =
    `inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusClass(d.status)}`;

  // Disable button if already completed
  if (d.status === "Completed") {
    btnCompleted.disabled = true;
    btnCompleted.textContent = "Completed";
    btnCompleted.classList.add("opacity-50", "cursor-not-allowed");
  }
}

loadSchedule();

// ------------------
// ACTIONS
// ------------------
btnCompleted.addEventListener("click", async () => {
  const ok = confirm("Mark this surgery as completed?");
  if (!ok) return;

  await updateDoc(doc(db, "schedules", scheduleId), {
    status: "Completed",
  });

  loadSchedule();
});
