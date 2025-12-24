import { db } from "../firebase.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { autoUpdateScheduleStatus } from "../utils/autoUpdateScheduleStatus.js";
/* ================= HELPERS ================= */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function statusClass(status) {
  switch (status) {
    case "Upcoming":
      return "bg-blue-100 text-blue-700";
    case "Ongoing":
      return "bg-yellow-100 text-yellow-700";
    case "Completed":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

/* ================= INIT ================= */
const scheduleId = getQueryParam("id");

if (!scheduleId) {
  alert("Invalid appointment");
  history.back();
}

/* ================= ELEMENTS ================= */
const loading = document.getElementById("loading");
const detailsSection = document.getElementById("detailsSection");

const patientNameEl = document.getElementById("patientName");
const patientIdEl = document.getElementById("patientId");
const procedureEl = document.getElementById("procedure");
const surgeonEl = document.getElementById("surgeon");
const otRoomEl = document.getElementById("otRoom");
const statusBadgeEl = document.getElementById("statusBadge");
const timeRangeEl = document.getElementById("timeRange");
const notesEl = document.getElementById("notes");

/* ================= LOAD DETAILS ================= */
async function loadDetails() {
  const ref = doc(db, "schedules", scheduleId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Appointment not found");
    history.back();
    return;
  }

  const s = snap.data();

  patientNameEl.textContent = s.patientName || "-";
  patientIdEl.textContent = s.patientId || "-";
  procedureEl.textContent = s.procedure || "-";
  surgeonEl.textContent = s.surgeonName || "-";
  otRoomEl.textContent = s.otRoom || "-";

  const start = s.startTime.toDate();
  const end = s.endTime.toDate();

  timeRangeEl.textContent = `
    ${start.toLocaleDateString()} •
    ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –
    ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
  `;

  statusBadgeEl.textContent = s.status;
  statusBadgeEl.className =
    `inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${statusClass(s.status)}`;

  notesEl.textContent = s.notes || "No notes provided";

  loading.classList.add("hidden");
  detailsSection.classList.remove("hidden");
}

(async () => {
  // ✅ Sync statuses once
  await autoUpdateScheduleStatus();

  // ✅ Then load appointment details
  await loadDetails();
})();

