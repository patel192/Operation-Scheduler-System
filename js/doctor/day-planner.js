import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const datePicker = document.getElementById("datePicker");
const hourColumn = document.getElementById("hourColumn");
const plannerCanvas = document.getElementById("plannerCanvas");

/* ================= CONFIG ================= */
const START_HOUR = 6;
const END_HOUR = 22;
const PX_PER_MIN = 1.2; // density control

/* ================= STATE ================= */
let schedules = [];
let unsubscribe = null;

/* ================= HELPERS ================= */
const t = ts => ts.toDate();

function minutesFromStart(d) {
  return (d.getHours() - START_HOUR) * 60 + d.getMinutes();
}

function sameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function resolvedStatus(s) {
  if (s.status === "Ongoing" && new Date() > t(s.endTime)) return "Overrun";
  return s.status;
}

function statusColor(status) {
  if (status === "Upcoming") return "bg-blue-500";
  if (status === "Ongoing") return "bg-green-500";
  if (status === "Completed") return "bg-slate-400";
  if (status === "Overrun") return "bg-red-500";
  return "bg-slate-300";
}

/* ================= HOURS ================= */
function renderHours() {
  hourColumn.innerHTML = "";
  plannerCanvas.innerHTML = "";

  for (let h = START_HOUR; h <= END_HOUR; h++) {
    const row = document.createElement("div");
    row.className = "h-[72px] px-2 flex items-start justify-end pt-1";
    row.textContent = `${h}:00`;
    hourColumn.appendChild(row);

    const line = document.createElement("div");
    line.className = "hour-line absolute left-0 right-0";
    line.style.top = `${(h - START_HOUR) * 60 * PX_PER_MIN}px`;
    plannerCanvas.appendChild(line);
  }

  plannerCanvas.style.height =
    `${(END_HOUR - START_HOUR) * 60 * PX_PER_MIN}px`;
}

/* ================= RENDER ================= */
function render() {
  renderHours();

  const selectedDate = datePicker.value
    ? new Date(datePicker.value)
    : new Date();

  schedules
    .filter(s => sameDay(t(s.startTime), selectedDate))
    .forEach(s => {
      const start = t(s.startTime);
      const end = t(s.endTime);

      const top = minutesFromStart(start) * PX_PER_MIN;
      const height =
        Math.max((end - start) / 60000 * PX_PER_MIN, 24);

      const status = resolvedStatus(s);

      const block = document.createElement("div");
      block.className = `
        absolute left-4 right-4 rounded-xl p-2 text-xs text-white
        cursor-pointer shadow
        ${statusColor(status)}
      `;

      block.style.top = `${top}px`;
      block.style.height = `${height}px`;

      block.innerHTML = `
        <div class="font-semibold">${s.procedure}</div>
        <div class="opacity-90">
          ${s.patientName} · OT ${s.otRoomName}
        </div>
        <div class="opacity-90">
          ${start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
          –
          ${end.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
        </div>
      `;

      block.onclick = () => {
        window.location.href =
          `/doctor/schedule-details.html?id=${s.id}`;
      };

      plannerCanvas.appendChild(block);
    });
}

/* ================= REALTIME ================= */
function listen() {
  if (!auth.currentUser) return;

  const q = query(
    collection(db, "schedules"),
    where("surgeonId", "==", auth.currentUser.uid)
  );

  unsubscribe?.();

  unsubscribe = onSnapshot(q, snap => {
    schedules = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    render();
  });
}

/* ================= INIT ================= */
auth.onAuthStateChanged(user => {
  if (!user) return;

  datePicker.valueAsDate = new Date();
  listen();
});

datePicker.onchange = render;
