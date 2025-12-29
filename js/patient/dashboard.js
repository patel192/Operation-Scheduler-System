import { db, auth } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { autoUpdateScheduleStatus } from "../utils/autoUpdateScheduleStatus.js";

/* ================= ELEMENTS ================= */
const totalCountEl = document.getElementById("totalCount");
const upcomingCountEl = document.getElementById("upcomingCount");
const ongoingCountEl = document.getElementById("ongoingCount");
const completedCountEl = document.getElementById("completedCount");
const nextAppointmentEl = document.getElementById("nextAppointment");

/* ================= LOAD DASHBOARD ================= */
async function loadDashboard(patientId) {
  try {
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

    snap.forEach((docSnap) => {
      const s = docSnap.data();
      total++;

      if (s.status === "Upcoming") {
        upcoming++;
        if (!nextAppointment) nextAppointment = s;
      }
      if (s.status === "Ongoing") ongoing++;
      if (s.status === "Completed") completed++;
    });

    if (totalCountEl) totalCountEl.textContent = total;
    if (upcomingCountEl) upcomingCountEl.textContent = upcoming;
    if (ongoingCountEl) ongoingCountEl.textContent = ongoing;
    if (completedCountEl) completedCountEl.textContent = completed;

    renderNextAppointment(nextAppointment);
  } catch (err) {
    console.error("❌ Failed to load patient dashboard:", err);

    if (nextAppointmentEl) {
      nextAppointmentEl.innerHTML = `
        <p class="text-sm text-red-600">
          Failed to load appointments. Please refresh.
        </p>
      `;
    }
  }
}

/* ================= NEXT APPOINTMENT ================= */
function renderNextAppointment(s) {
  if (!nextAppointmentEl) return;

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
        ${s.status}
      </span>
    </div>
  `;
}

/* ================= AUTH INIT ================= */
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    console.warn("🚫 Patient not logged in");
    window.location.replace("/login.html");
    return;
  }

  const patientId = user.uid;

  try {
    // ⚠️ Enable only after confirming it works fast
    // await autoUpdateScheduleStatus();

    await loadDashboard(patientId);
  } catch (err) {
    console.error("❌ Dashboard init error:", err);
  }
});
