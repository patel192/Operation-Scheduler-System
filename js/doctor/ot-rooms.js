import { auth, db } from "../firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= CONFIG ================= */
const START_HOUR = 6;
const END_HOUR = 22;
const SLOT_MINUTES = 30;
const PX_PER_SLOT = 48;

/* ================= ELEMENTS ================= */
const otSummary = document.getElementById("otSummary");
const otHeader = document.getElementById("otHeader");
const otGridBody = document.getElementById("otGridBody");

/* ================= HELPERS ================= */
const t = ts => ts.toDate();

function sameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function minutesFromStart(d) {
  return (d.getHours() * 60 + d.getMinutes()) - (START_HOUR * 60);
}

function blockClass(s) {
  if (s.status === "Ongoing" && new Date() > t(s.endTime)) return "overrun";
  if (s.status === "Ongoing") return "ongoing";
  if (s.status === "Scheduled") return "scheduled";
  return "completed";
}

/* ================= STATE ================= */
let schedules = [];

/* ================= LOAD ================= */
function listen() {
  onSnapshot(collection(db, "schedules"), snap => {
    schedules = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  });
}

/* ================= RENDER ================= */
function render() {
  const today = new Date();

  const todaySchedules = schedules.filter(s =>
    sameDay(t(s.startTime), today)
  );

  const otMap = {};
  todaySchedules.forEach(s => {
    if (!otMap[s.otRoomId]) {
      otMap[s.otRoomId] = {
        id: s.otRoomId,
        name: s.otRoomName,
        list: []
      };
    }
    otMap[s.otRoomId].list.push(s);
  });

  const otRooms = Object.values(otMap);

  /* ---------- SUMMARY ---------- */
  const ongoing = todaySchedules.filter(s => s.status === "Ongoing").length;
  const totalMinutes = todaySchedules.reduce(
    (a, s) => a + (t(s.endTime) - t(s.startTime)) / 60000, 0
  );

  otSummary.innerHTML = `
    <div>Total OT Rooms<br><span class="text-sm">${otRooms.length}</span></div>
    <div class="text-green-600">Ongoing<br><span class="text-sm">${ongoing}</span></div>
    <div>Total Surgeries<br><span class="text-sm">${todaySchedules.length}</span></div>
    <div>Utilized Minutes<br><span class="text-sm">${Math.round(totalMinutes)}</span></div>
    <div>Date<br><span class="text-sm">${today.toLocaleDateString()}</span></div>
  `;

  /* ---------- HEADER ---------- */
  otHeader.innerHTML = "";
  otHeader.style.gridTemplateColumns =
    `80px repeat(${otRooms.length}, 220px)`;

  otHeader.innerHTML += `<div class="text-xs font-semibold p-2">Time</div>`;
  otRooms.forEach(ot => {
    otHeader.innerHTML += `
      <div class="text-xs font-semibold p-2 border-l">
        ${ot.name}
      </div>`;
  });

  /* ---------- GRID BODY ---------- */
  otGridBody.innerHTML = "";

  for (let h = START_HOUR * 60; h < END_HOUR * 60; h += SLOT_MINUTES) {
    const row = document.createElement("div");
    row.className = "grid";
    row.style.gridTemplateColumns =
      `80px repeat(${otRooms.length}, 220px)`;

    const label = document.createElement("div");
    label.className = "time-row text-xs p-2 text-slate-500";
    label.textContent =
      `${String(Math.floor(h / 60)).padStart(2, "0")}:${h % 60 === 0 ? "00" : "30"}`;

    row.appendChild(label);

    otRooms.forEach(() => {
      const cell = document.createElement("div");
      cell.className = "time-row ot-cell";
      row.appendChild(cell);
    });

    otGridBody.appendChild(row);
  }

  /* ---------- BLOCKS ---------- */
  otRooms.forEach((ot, colIndex) => {
    ot.list.forEach(s => {
      const startMin = minutesFromStart(t(s.startTime));
      const endMin = minutesFromStart(t(s.endTime));

      const top = (startMin / SLOT_MINUTES) * PX_PER_SLOT;
      const height =
        Math.max(((endMin - startMin) / SLOT_MINUTES) * PX_PER_SLOT, 36);

      const block = document.createElement("div");
      block.className = `block ${blockClass(s)}`;
      block.style.top = `${top}px`;
      block.style.height = `${height}px`;
      block.style.left = `${80 + colIndex * 220 + 6}px`;
      block.style.width = `208px`;

      block.innerHTML = `
        <div class="font-semibold truncate">${s.procedure}</div>
        <div class="opacity-90 truncate">${s.patientName}</div>
        <div class="opacity-80">
          ${t(s.startTime).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
        </div>
      `;

      block.onclick = () => {
        window.location.href =
          `/doctor/schedule-details.html?id=${s.id}`;
      };

      otGridBody.appendChild(block);
    });
  });
}

/* ================= INIT ================= */
auth.onAuthStateChanged(u => {
  if (u) listen();
});
