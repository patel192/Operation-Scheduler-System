import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const todayLabel = document.getElementById("todayLabel");

const sumToday = document.getElementById("sumToday");
const sumOngoing = document.getElementById("sumOngoing");
const sumUpcoming = document.getElementById("sumUpcoming");
const sumCompleted = document.getElementById("sumCompleted");
const sumOtTime = document.getElementById("sumOtTime");
const sumWeek = document.getElementById("sumWeek");

const scheduleList = document.getElementById("scheduleList");

const detailsPanel = document.getElementById("detailsPanel");
const detailsEmpty = document.getElementById("detailsEmpty");

const contriPatients = document.getElementById("contriPatients");
const contriProcedures = document.getElementById("contriProcedures");
const contriAvg = document.getElementById("contriAvg");
const contriOnTime = document.getElementById("contriOnTime");

const focusWork = document.getElementById("focusWork");
const focusBreak = document.getElementById("focusBreak");
const focusRemaining = document.getElementById("focusRemaining");

/* ================= STATE ================= */
let schedules = [];
let selectedId = null;

/* ================= HELPERS ================= */
const t = ts => ts.toDate();

const time = ts =>
  t(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const sameDay = (a, b) => a.toDateString() === b.toDateString();

function minutesBetween(a, b) {
  return Math.round((b - a) / 60000);
}

/* ================= LOAD ================= */
async function loadDashboard() {
  if (!auth.currentUser) return;

  const snap = await getDocs(
    query(
      collection(db, "schedules"),
      where("surgeonId", "==", auth.currentUser.uid)
    )
  );

  schedules = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderDashboard();
}

/* ================= RENDER ================= */
function renderDashboard() {
  const now = new Date();
  todayLabel.textContent = now.toDateString();

  const todayList = schedules.filter(s =>
    sameDay(t(s.startTime), now)
  );

  const ongoing = todayList.filter(s => s.status === "Ongoing");
  const upcoming = todayList.filter(s => s.status === "Upcoming");
  const completed = todayList.filter(s => s.status === "Completed");

  /* ---------- SUMMARY ---------- */
  sumToday.textContent = todayList.length;
  sumOngoing.textContent = ongoing.length;
  sumUpcoming.textContent = upcoming.length;
  sumCompleted.textContent = completed.length;

  /* ---------- OT USAGE (ACTUAL) ---------- */
  let otMinutes = 0;

  todayList.forEach(s => {
    const start = t(s.startTime);
    const end = t(s.endTime);

    if (s.status === "Completed") {
      otMinutes += minutesBetween(start, end);
    } else if (s.status === "Ongoing") {
      otMinutes += Math.max(0, minutesBetween(start, now));
    }
  });

  sumOtTime.textContent =
    `${Math.floor(otMinutes / 60)}h ${otMinutes % 60}m`;

  /* ---------- WEEK PATIENTS ---------- */
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);

  const weekPatients = new Set(
    schedules
      .filter(s => t(s.startTime) >= weekStart)
      .map(s => s.patientId)
  );
  sumWeek.textContent = weekPatients.size;

  /* ---------- LEFT LIST ---------- */
  scheduleList.innerHTML = "";

  todayList
    .sort((a, b) => t(a.startTime) - t(b.startTime))
    .forEach(s => {
      const remaining = minutesBetween(now, t(s.endTime));

      const row = document.createElement("div");
      row.className =
        `grid grid-cols-[90px_1fr_90px_80px] gap-3 items-center py-2 cursor-pointer
         hover:bg-slate-50 transition
         ${s.id === selectedId ? "bg-slate-100" : ""}`;

      row.innerHTML = `
        <div class="text-xs text-slate-500">${time(s.startTime)}</div>

        <div>
          <div class="font-semibold">${s.procedure}</div>
          <div class="text-xs text-slate-500">
            ${s.patientName} · OT ${s.otRoomName}
          </div>
        </div>

        <div class="text-xs font-semibold">${s.status}</div>

        <div class="text-xs ${
          s.status === "Ongoing" && remaining < 0
            ? "text-red-600 font-semibold"
            : "text-slate-500"
        }">
          ${s.status === "Ongoing"
            ? remaining > 0 ? `${remaining}m` : "Overrun"
            : ""}
        </div>
      `;

      row.onclick = () => selectSchedule(s.id);
      scheduleList.appendChild(row);
    });

  /* ---------- CONTRIBUTION ---------- */
  contriPatients.textContent =
    new Set(todayList.map(s => s.patientId)).size;

  contriProcedures.textContent = todayList.length;

  if (completed.length) {
    const avg =
      completed.reduce((sum, s) =>
        sum + minutesBetween(t(s.startTime), t(s.endTime)), 0
      ) / completed.length;

    contriAvg.textContent =
      `${Math.floor(avg / 60)}h ${Math.round(avg % 60)}m`;
  } else {
    contriAvg.textContent = "—";
  }

  const onTime = completed.filter(s =>
    t(s.endTime) <= t(s.endTime)
  ).length;

  contriOnTime.textContent =
    completed.length
      ? `${Math.round((onTime / completed.length) * 100)}%`
      : "—";

  /* ---------- FOCUS ---------- */
  if (ongoing[0]) {
    focusWork.textContent =
      `${minutesBetween(t(ongoing[0].startTime), now)} min`;
  } else {
    focusWork.textContent = "—";
  }

  focusBreak.textContent = "—";
  focusRemaining.textContent = upcoming.length;

  if (selectedId) selectSchedule(selectedId);
}

/* ================= DETAILS ================= */
function selectSchedule(id) {
  selectedId = id;
  const s = schedules.find(x => x.id === id);
  if (!s) return;

  detailsEmpty.classList.add("hidden");
  detailsPanel.classList.remove("hidden");

  const remaining =
    minutesBetween(new Date(), t(s.endTime));

  const notes =
    Array.isArray(s.notes)
      ? s.notes.map(n => `• ${n.text}`).join("<br>")
      : "No notes available";

  detailsPanel.innerHTML = `
    <div><p class="text-xs text-slate-500">Procedure</p><p class="font-semibold">${s.procedure}</p></div>
    <div><p class="text-xs text-slate-500">Patient</p><p class="font-semibold">${s.patientName}</p></div>
    <div><p class="text-xs text-slate-500">OT Room</p><p class="font-semibold">${s.otRoomName}</p></div>
    <div><p class="text-xs text-slate-500">Department</p><p class="font-semibold">${s.department}</p></div>
    <div><p class="text-xs text-slate-500">Time</p><p class="font-semibold">${time(s.startTime)} – ${time(s.endTime)}</p></div>
    <div><p class="text-xs text-slate-500">Remaining</p>
      <p class="font-semibold ${remaining < 0 ? "text-red-600" : ""}">
        ${remaining > 0 ? `${remaining} min` : "Overrun"}
      </p>
    </div>
    <div class="col-span-2">
      <p class="text-xs text-slate-500">Notes</p>
      <p class="text-sm">${notes}</p>
    </div>
  `;
}

/* ================= INIT ================= */
auth.onAuthStateChanged(user => {
  if (user) loadDashboard();
});
