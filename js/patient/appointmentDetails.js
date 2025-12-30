import { db } from "../firebase.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= QUERY ================= */
const params = new URLSearchParams(window.location.search);
const appointmentId = params.get("id");

/* ================= ELEMENTS ================= */
const loadingEl = document.getElementById("loading");
const detailsSection = document.getElementById("detailsSection");

const statusBadge = document.getElementById("statusBadge");
const patientNameEl = document.getElementById("patientName");
const patientIdEl = document.getElementById("patientId");
const procedureEl = document.getElementById("procedure");
const surgeonEl = document.getElementById("surgeon");
const otRoomEl = document.getElementById("otRoom");
const timeRangeEl = document.getElementById("timeRange");
const notesEl = document.getElementById("notes");

/* ================= HELPERS ================= */
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

function formatTime(ts) {
  return ts.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ================= LOAD ================= */
async function loadAppointment() {
  if (!appointmentId) {
    alert("Invalid appointment");
    history.back();
    return;
  }

  const ref = doc(db, "schedules", appointmentId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Appointment not found");
    history.back();
    return;
  }

  const d = snap.data();

  patientNameEl.textContent = d.patientName || "—";
  patientIdEl.textContent = d.patientId || "—";
  procedureEl.textContent = d.procedure || "—";
  surgeonEl.textContent = d.surgeonName || "—";
  otRoomEl.textContent = d.otRoom || "—";
  notesEl.textContent = d.notes || "No additional notes provided";

  timeRangeEl.textContent =
    `${formatTime(d.startTime)} – ${formatTime(d.endTime)}`;

  statusBadge.textContent = d.status || "Upcoming";
  statusBadge.className =
    `inline-block px-4 py-1.5 rounded-full text-sm font-semibold
     ${statusClass(d.status)}`;

  loadingEl.classList.add("hidden");
  detailsSection.classList.remove("hidden");
}

/* ================= INIT ================= */
loadAppointment();
