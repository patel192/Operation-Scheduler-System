
import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const totalCountEl = document.getElementById("totalCount");
const upcomingCountEl = document.getElementById("upcomingCount");
const ongoingCountEl = document.getElementById("ongoingCount");
const completedCountEl = document.getElementById("completedCount");
const nextAppointmentEl = document.getElementById("nextAppointment");

/* ================= INIT ================= */
const patientId = localStorage.getItem("patientId");

if (!patientId) {
  window.location.href = "/patient/my-appointments.html";
}

/* ================= LOAD DASHBOARD ================= */
async function loadDashboard() {
  const q = query(
    collection(db, "schedules"),
    where("patientId", "==", patientId),
    orderBy("startTime", "asc")
  );

  const snap = await getDocs(q);

  let total = 0;
  let upcoming = 0;
  let ongoing = 0;
  let completed = 0;
  let nextAppointment = null;

  snap.forEach(docSnap => {
    const s = docSnap.data();
    total++;

    if (s.status === "Upcoming") {
      upcoming++;
      if (!nextAppointment) nextAppointment = s;
    }
    if (s.status === "Ongoing") ongoing++;
    if (s.status === "Completed") completed++;
  });

  totalCountEl.textContent = total;
  upcomingCountEl.textContent = upcoming;
  ongoingCountEl.textContent = ongoing;
  completedCountEl.textContent = completed;

  renderNextAppointment(nextAppointment);
}

function renderNextAppointment(s) {
  if (!s) {
    nextAppointmentEl.innerHTML = `
      <p class="text-sm text-slate-500">
        No upcoming appointments
      </p>
    `;
    return;
  }

  const start = s.startTime.toDate();
  const end = s.endTime.toDate();

  nextAppointmentEl.innerHTML = `
    <div class="border rounded-xl p-4">
      <p class="font-semibold">${s.procedure}</p>
      <p class="text-sm text-slate-500 mt-1">
        ${start.toLocaleDateString()} •
        ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –
        ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p class="text-sm text-slate-500">
        OT Room: ${s.otRoom} • Dr. ${s.surgeonName}
      </p>
      <span class="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-semibold">
        Upcoming
      </span>
    </div>
  `;
}

loadDashboard();
