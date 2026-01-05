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
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

/* ================= STATE ================= */
let schedules = [];
let activeFilter = "All";
let selectedId = null;
let unsubscribe = null;

const MIN_GAP_MINUTES = 30;

/* ================= HELPERS ================= */
const t = (ts) => ts.toDate();
const time = (ts) =>
  t(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const sameDay = (a, b) => a.toDateString() === b.toDateString();

function minutesBetween(a, b) {
  return Math.round((b - a) / 60000);
}

/* ================= RISK DETECTION ================= */
function detectRisks(dayList) {
  const risks = {};

  const sorted = dayList
    .slice()
    .sort((a, b) => t(a.startTime) - t(b.startTime));

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const currEnd = t(curr.endTime);

    risks[curr.id] = {
      overlap: false,
      tightGap: false,
      overrun: false,
    };

    // 🔴 Overrun
    if (curr.status === "Ongoing" && new Date() > currEnd) {
      risks[curr.id].overrun = true;
    }

    const next = sorted[i + 1];
    if (!next) continue;

    const nextStart = t(next.startTime);

    // 🔴 Overlap
    if (currEnd > nextStart) {
      risks[curr.id].overlap = true;
      risks[next.id] = risks[next.id] || {};
      risks[next.id].overlap = true;
    }

    // 🟡 Tight gap
    const gap = minutesBetween(currEnd, nextStart);
    if (gap >= 0 && gap < MIN_GAP_MINUTES) {
      risks[next.id] = risks[next.id] || {};
      risks[next.id].tightGap = true;
    }
  }

  return risks;
}

/* ================= REALTIME LISTENER ================= */
function listenToSchedules() {
  if (!auth.currentUser) return;

  const q = query(
    collection(db, "schedules"),
    where("surgeonId", "==", auth.currentUser.uid)
  );

  if (unsubscribe) unsubscribe();

  unsubscribe = onSnapshot(q, (snapshot) => {
    schedules = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
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

  const filtered =
    activeFilter === "All"
      ? dayList
      : dayList.filter((s) => s.status === activeFilter);

  /* ---------- STATS ---------- */
  statTotal.textContent = dayList.length;
  statOngoing.textContent = dayList.filter(s => s.status === "Ongoing").length;
  statUpcoming.textContent = dayList.filter(s => s.status === "Scheduled").length;
  statCompleted.textContent = dayList.filter(s => s.status === "Completed").length;

  statOT.textContent = new Set(dayList.map(s => s.otRoomId)).size;
  statPatients.textContent = new Set(dayList.map(s => s.patientId)).size;

  /* ---------- TIMELINE ---------- */
  timeline.innerHTML = "";

  filtered
    .sort((a, b) => t(a.startTime) - t(b.startTime))
    .forEach((s) => {
      const risk = riskMap[s.id] || {};
      let riskClass = "";
      let riskLabel = "";

      if (risk.overlap) {
        riskClass = "border-l-4 border-red-600 bg-red-50";
        riskLabel = "Overlap";
      } else if (risk.overrun) {
        riskClass = "border-l-4 border-red-600";
        riskLabel = "Overrun";
      } else if (risk.tightGap) {
        riskClass = "border-l-4 border-yellow-500 bg-yellow-50";
        riskLabel = "Tight gap";
      }

      const row = document.createElement("div");
      row.className = `
        grid grid-cols-[80px_1fr_90px_60px_70px] gap-3 py-2 cursor-pointer
        hover:bg-slate-50 transition
        ${s.id === selectedId ? "bg-slate-100" : ""}
        ${riskClass}
        ${risk.overrun ? "pulse" : ""}
      `;

      row.innerHTML = `
        <div class="text-xs text-slate-500">${time(s.startTime)}</div>

        <div>
          <div class="font-semibold">${s.procedure}</div>
          <div class="text-xs text-slate-500">
            ${s.patientName} · OT ${s.otRoomName}
          </div>
        </div>

        <div class="text-xs font-semibold">
          ${s.status}
          ${
            riskLabel
              ? `<span class="ml-1 text-[10px] px-2 py-0.5 rounded-full
                 ${risk.overlap || risk.overrun
                   ? "bg-red-100 text-red-700"
                   : "bg-yellow-100 text-yellow-700"}">
                 ${riskLabel}
               </span>`
              : ""
          }
        </div>

        <div class="text-xs">${s.department}</div>
        <div class="text-xs">${s.otRoomName}</div>
      `;

      row.onclick = () => inspect(s.id);
      timeline.appendChild(row);
    });

  if (selectedId) inspect(selectedId);
}

/* ================= INSPECT ================= */
function inspect(id) {
  selectedId = id;
  const s = schedules.find(x => x.id === id);
  if (!s) return;

  inspectEmpty.classList.add("hidden");
  inspectPanel.classList.remove("hidden");

  inspectDetails.innerHTML = `
    <div><p class="text-xs text-slate-500">Procedure</p><p class="font-semibold">${s.procedure}</p></div>
    <div><p class="text-xs text-slate-500">Patient</p><p class="font-semibold">${s.patientName}</p></div>
    <div><p class="text-xs text-slate-500">OT Room</p><p class="font-semibold">${s.otRoomName}</p></div>
    <div><p class="text-xs text-slate-500">Department</p><p class="font-semibold">${s.department}</p></div>
    <div><p class="text-xs text-slate-500">Time</p><p class="font-semibold">${time(s.startTime)} – ${time(s.endTime)}</p></div>
    <div><p class="text-xs text-slate-500">Status</p><p class="font-semibold">${s.status}</p></div>
  `;

  markCompletedBtn.classList.toggle("hidden", s.status !== "Ongoing");

  addNoteBtn.onclick = async () => {
    const note = noteInput.value.trim();
    if (!note) return;

    await updateDoc(doc(db, "schedules", s.id), {
      notes: arrayUnion({
        text: note,
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

/* ================= FILTER ================= */
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.onclick = () => {
    activeFilter = btn.dataset.filter;
    render();
  };
});

/* ================= INIT ================= */
auth.onAuthStateChanged((user) => {
  if (!user) return;
  datePicker.valueAsDate = new Date();
  listenToSchedules();
});
