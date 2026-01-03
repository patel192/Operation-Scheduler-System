import { db } from "../firebase.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {autoUpdateScheduleStatus} from "../utils/autoUpdateScheduleStatus.js"
/* ================= ELEMENTS ================= */
const rowsContainer = document.getElementById("scheduleRows");

/* ================= CONSTANTS ================= */
const MAX_COLS = 6;

/* ================= HELPERS ================= */
function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getColSpan(start, end) {
  const diffHours = (end - start) / (1000 * 60 * 60);
  return Math.max(1, Math.round(diffHours / 2));
}

function statusStyles(status) {
  if (status === "Completed")
    return "bg-green-50 border-green-200 text-green-700";
  if (status === "Ongoing")
    return "bg-yellow-50 border-yellow-200 text-yellow-700";
  return "bg-blue-50 border-blue-200 text-blue-700";
}

/* ================= LOAD OT ROOMS ================= */
async function loadOtRooms() {
  const snap = await getDocs(collection(db, "otRooms"));
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name,
  }));
}

/* ================= LISTEN ================= */
async function listenSchedules() {
  const otRooms = await loadOtRooms();
await autoUpdateScheduleStatus();
  const q = query(
    collection(db, "schedules"),
    orderBy("startTime", "asc")
  );

  onSnapshot(q, (snapshot) => {
    rowsContainer.innerHTML = "";

    const schedules = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    otRooms.forEach((ot) => {
      const otSchedules = schedules.filter(
        (s) => s.otRoomId === ot.id
      );

      const row = document.createElement("div");
      row.className =
        "ot-lane grid grid-cols-[120px_repeat(6,1fr)] gap-2 items-stretch";

      /* ---- OT LABEL ---- */
      const label = document.createElement("div");
      label.className = "ot-label";
      label.innerHTML = `<span class="ot-dot"></span>${ot.name}`;
      row.appendChild(label);

      let filledCols = 0;

      otSchedules.forEach((sch) => {
        if (!sch.startTime || !sch.endTime) return;

        const start = sch.startTime.toDate();
        const end = sch.endTime.toDate();
        const span = Math.min(getColSpan(start, end), MAX_COLS);

        const card = document.createElement("div");
        card.style.gridColumn = `span ${span}`;
        card.className = `schedule-card border ${statusStyles(
          sch.status
        )}`;

        card.innerHTML = `
          <div class="schedule-title">${sch.procedure}</div>
          <div class="schedule-meta">${sch.surgeonName || "—"}</div>
          <div class="schedule-time">
            ${formatTime(start)} – ${formatTime(end)}
          </div>
          <span class="schedule-status">${sch.status}</span>
        `;

        card.onclick = () => {
          window.location.href =
            `/admin/schedule-details.html?id=${sch.id}`;
        };

        row.appendChild(card);
        filledCols += span;
      });

      while (filledCols < MAX_COLS) {
        const empty = document.createElement("div");
        empty.className = "time-cell";
        row.appendChild(empty);
        filledCols++;
      }

      rowsContainer.appendChild(row);
    });
  });
}

/* ================= INIT ================= */
listenSchedules();
// 🔁 AUTO STATUS UPDATE EVERY 60 SECONDS
setInterval(async () => {
  await autoUpdateScheduleStatus();
}, 60 * 1000);
