import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  Timestamp,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { persistAlerts } from "../doctor/alert-generator.js";

/* ================= ELEMENTS ================= */
const datePicker = document.getElementById("datePicker");
const timeline = document.getElementById("scheduleTimeline");

const statTotal = document.getElementById("statTotal");
const statOngoing = document.getElementById("statOngoing");
const statUpcoming = document.getElementById("statUpcoming");
const statCompleted = document.getElementById("statCompleted");
const statOT = document.getElementById("statOT");
const statPatients = document.getElementById("statPatients");

const inspectPanel = document.getElementById("inspectPanel");
const inspectEmpty = document.getElementById("inspectEmpty");
const inspectDetails = document.getElementById("inspectDetails");

const noteInput = document.getElementById("noteInput");
const addNoteBtn = document.getElementById("addNoteBtn");
const markCompletedBtn = document.getElementById("markCompletedBtn");
const exportBtn = document.getElementById("exportBtn");

/* ================= STATE ================= */
let schedules = [];
let activeFilter = "All";
let selectedId = null;
let unsubscribe = null;
let doctorPrefs = {
  upcomingWindowMinutes: 15,
  minGapMinutes: 30,
  workingHours: null,
};

/* ================= HELPERS ================= */
const t = (ts) => ts.toDate();

const time = (ts) =>
  t(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const sameDay = (a, b) => a.toDateString() === b.toDateString();

function resolvedStatus(s) {
  return s.__derivedStatus || s.status;
}

function isUpcoming(schedule) {
  const now = new Date();
  const start = t(schedule.startTime);
  const diffMin = (start - now) / 60000;
  return diffMin > 0 && diffMin <= doctorPrefs.upcomingWindowMinutes;
}

function minutesBetween(a, b) {
  return Math.round((b - a) / 60000);
}

function formatDurationShort(ms) {
  return `${Math.floor(ms / 60000)}m`;
}

function progressPercent(start, end) {
  const planned = end - start;
  const elapsed = new Date() - start;
  return Math.min((elapsed / planned) * 100, 100);
}

/* ================= EXPORT ================= */
function exportDayCSV() {
  const selectedDate = datePicker.value
    ? new Date(datePicker.value)
    : new Date();

  const rows = [
    [
      "Date",
      "Start",
      "End",
      "Procedure",
      "Patient",
      "Department",
      "OT",
      "Status",
    ],
  ];

  schedules
    .filter((s) => sameDay(t(s.startTime), selectedDate))
    .filter((s) => activeFilter === "All" || resolvedStatus(s) === activeFilter)
    .forEach((s) =>
      rows.push([
        t(s.startTime).toLocaleDateString(),
        time(s.startTime),
        time(s.endTime),
        s.procedure,
        s.patientName,
        s.department,
        s.otRoomName,
        resolvedStatus(s),
      ])
    );

  if (rows.length === 1) {
    alert("No schedules to export.");
    return;
  }

  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `schedule_${selectedDate.toISOString().slice(0, 10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}
async function loadDoctorPreferences(uid) {
  const snap = await getDoc(doc(db, "doctorProfiles", uid));
  if (!snap.exists()) return;

  const p = snap.data();

  doctorPrefs.upcomingWindowMinutes =
    p.upcomingWindowMinutes ?? doctorPrefs.upcomingWindowMinutes;

  doctorPrefs.minGapMinutes = p.minGapMinutes ?? doctorPrefs.minGapMinutes;

  doctorPrefs.workingHours = p.workingHours || null;
}

/* ================= RISK DETECTION ================= */
function detectRisks(dayList) {
  const risks = {};
  const sorted = [...dayList].sort((a, b) => t(a.startTime) - t(b.startTime));

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const currEnd = t(curr.endTime);

    risks[curr.id] = { overlap: false, tightGap: false, overrun: false };

    if (resolvedStatus(curr) === "Ongoing" && new Date() > currEnd) {
      risks[curr.id].overrun = true;
    }

    const next = sorted[i + 1];
    if (!next) continue;

    const gap = minutesBetween(currEnd, t(next.startTime));
    if (currEnd > t(next.startTime)) risks[curr.id].overlap = true;
    if (gap >= 0 && gap < doctorPrefs.minGapMinutes)
      risks[next.id] = { tightGap: true };
  }

  return risks;
}

/* ================= REALTIME ================= */
function listenToSchedules() {
  if (!auth.currentUser) return;

  const q = query(
    collection(db, "schedules"),
    where("surgeonId", "==", auth.currentUser.uid)
  );

  unsubscribe?.();

  unsubscribe = onSnapshot(q, async (snap) => {
    schedules = snap.docs.map((d) => {
      const s = { id: d.id, ...d.data() };
      if (s.status === "Scheduled" && isUpcoming(s)) {
        s.__derivedStatus = "Upcoming";
      }
      return s;
    });

    await persistAlerts(schedules, auth.currentUser.uid);
    render();
  });
}

/* ================= RENDER ================= */
function render() {
  const selectedDate = datePicker.value
    ? new Date(datePicker.value)
    : new Date();

  const dayList = schedules.filter((s) =>
    sameDay(t(s.startTime), selectedDate)
  );

  const riskMap = detectRisks(dayList);

  statTotal.textContent = dayList.length;
  statOngoing.textContent = dayList.filter(
    (s) => resolvedStatus(s) === "Ongoing"
  ).length;
  statUpcoming.textContent = dayList.filter(
    (s) => resolvedStatus(s) === "Upcoming"
  ).length;
  statCompleted.textContent = dayList.filter(
    (s) => resolvedStatus(s) === "Completed"
  ).length;

  statOT.textContent = new Set(dayList.map((s) => s.otRoomId)).size;
  statPatients.textContent = new Set(dayList.map((s) => s.patientId)).size;

  timeline.innerHTML = "";

  dayList
    .filter((s) => activeFilter === "All" || resolvedStatus(s) === activeFilter)
    .sort((a, b) => t(a.startTime) - t(b.startTime))
    .forEach((s) => {
      const risk = riskMap[s.id] || {};
      const row = document.createElement("div");

      row.className = `
        grid grid-cols-[80px_1fr_100px_70px_90px] gap-3 py-2 cursor-pointer
        hover:bg-slate-50 transition
        ${risk.overrun ? "border-l-4 border-red-600 pulse" : ""}
      `;

      row.innerHTML = `
        <div class="text-xs text-slate-500">${time(s.startTime)}</div>

        <div>
          <div class="font-semibold">${s.procedure}</div>
          <div class="text-xs text-slate-500">
            ${s.patientName} · OT ${s.otRoomName}
          </div>
        </div>

        <div class="text-xs font-semibold">${resolvedStatus(s)}</div>
        <div class="text-xs">${s.department}</div>

        <div class="text-right">
          <button class="details-btn text-xs font-semibold text-blue-600">
            Details →
          </button>
        </div>
      `;

      row.onclick = () => inspect(s.id);
      row.querySelector(".details-btn").onclick = (e) => {
        e.stopPropagation();
        window.location.href = `/doctor/schedule-details.html?id=${s.id}`;
      };

      timeline.appendChild(row);
    });

  if (selectedId) inspect(selectedId);
}

/* ================= INSPECT ================= */
function inspect(id) {
  selectedId = id;
  const s = schedules.find((x) => x.id === id);
  if (!s) return;

  inspectEmpty.classList.add("hidden");
  inspectPanel.classList.remove("hidden");

  inspectDetails.innerHTML = `
    <div><p class="text-xs text-slate-500">Procedure</p><p class="font-semibold">${
      s.procedure
    }</p></div>
    <div><p class="text-xs text-slate-500">Patient</p><p class="font-semibold">${
      s.patientName
    }</p></div>
    <div><p class="text-xs text-slate-500">OT Room</p><p class="font-semibold">${
      s.otRoomName
    }</p></div>
    <div><p class="text-xs text-slate-500">Department</p><p class="font-semibold">${
      s.department
    }</p></div>
    <div><p class="text-xs text-slate-500">Time</p><p class="font-semibold">${time(
      s.startTime
    )} – ${time(s.endTime)}</p></div>
    <div><p class="text-xs text-slate-500">Status</p><p class="font-semibold">${resolvedStatus(
      s
    )}</p></div>
  `;

  markCompletedBtn.classList.toggle("hidden", resolvedStatus(s) !== "Ongoing");

  addNoteBtn.onclick = async () => {
    if (!noteInput.value.trim()) return;

    await updateDoc(doc(db, "schedules", s.id), {
      notes: arrayUnion({
        text: noteInput.value,
        by: auth.currentUser.uid,
        at: Timestamp.now(),
      }),
      updatedAt: serverTimestamp(),
    });

    noteInput.value = "";
  };

  markCompletedBtn.onclick = async () => {
    if (!confirm("Mark this surgery as completed?")) return;

    await updateDoc(doc(db, "schedules", s.id), {
      status: "Completed",
      updatedAt: serverTimestamp(),
    });
  };
}

/* ================= INIT ================= */
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.onclick = () => {
    activeFilter = btn.dataset.filter;
    render();
  };
});

exportBtn.onclick = exportDayCSV;

auth.onAuthStateChanged(async (u) => {
  if (!u) return;

  await loadDoctorPreferences(u.uid);

  datePicker.valueAsDate = new Date();
  listenToSchedules();
});
