import { db } from "../firebase.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { autoUpdateScheduleStatus } from "../utils/autoUpdateScheduleStatus.js";

/* ================= ELEMENTS ================= */
const rowsContainer = document.getElementById("scheduleRows");
const filterToday = document.getElementById("filterToday");
const filterWeek = document.getElementById("filterWeek");

/* ================= CONSTANTS ================= */
const OT_ROOMS = ["OT-1", "OT-2", "OT-3"];

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

/* ================= REAL-TIME LISTENER ================= */
function listenSchedules() {
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

    OT_ROOMS.forEach((ot) => {
      const otSchedules = schedules.filter((s) => s.otRoom === ot);

      const row = document.createElement("div");
      row.className =
        "grid grid-cols-[110px_repeat(6,1fr)] gap-2 items-stretch";

      /* ---- OT LABEL ---- */
      const label = document.createElement("div");
      label.className = "font-semibold text-sm flex items-center";
      label.textContent = ot;
      row.appendChild(label);

      let filledCols = 0;

      /* ---- SCHEDULE BLOCKS ---- */
      otSchedules.forEach((sch) => {
        if (!sch.startTime || !sch.endTime) return;

        const start = sch.startTime.toDate();
        const end = sch.endTime.toDate();
        const span = getColSpan(start, end);

        const card = document.createElement("div");
        card.className = `
          col-span-${span}
          rounded-xl p-3 border cursor-pointer
          hover:shadow-md transition
          ${statusStyles(sch.status)}
        `;

        card.innerHTML = `
          <p class="font-semibold text-sm">${sch.procedure}</p>
          <p class="text-xs text-slate-600">
            ${sch.surgeonName || "-"}
          </p>
          <p class="text-xs text-slate-600">
            ${formatTime(start)} – ${formatTime(end)}
          </p>
          <span class="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-white/60">
            ${sch.status}
          </span>
        `;

        card.onclick = () => {
          window.location.href =
            `/admin/schedule-details.html?id=${sch.id}`;
        };

        row.appendChild(card);
        filledCols += span;
      });

      /* ---- EMPTY COLUMNS ---- */
      while (filledCols < 6) {
        row.appendChild(document.createElement("div"));
        filledCols++;
      }

      rowsContainer.appendChild(row);
    });
  });
}

/* ================= FILTERS (UI READY) ================= */
filterToday?.addEventListener("click", () => {
  // future enhancement
});

filterWeek?.addEventListener("click", () => {
  // future enhancement
});

/* ================= INIT ================= */
(async () => {
  // keep auto status updater
  await autoUpdateScheduleStatus();

  // start real-time listener
  listenSchedules();
})();
