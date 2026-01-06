import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const alertList = document.getElementById("alertList");
const alertSummary = document.getElementById("alertSummary");
const emptyState = document.getElementById("emptyState");

/* HELPERS */
const t = ts => ts.toDate();
const mins = ms => Math.round(ms / 60000);

/* ALERT ENGINE */
function generateAlerts(schedules) {
  const alerts = [];
  const now = new Date();

  schedules.forEach(s => {
    const start = s.startTime?.toDate();
    const end = s.endTime?.toDate();
    if (!start || !end) return;

    const planned = mins(end - start);
    const elapsed = mins(Math.min(now - start, end - start));

    /* 🔴 Overrun */
    if (s.status === "Ongoing" && now > end) {
      alerts.push({
        level: "critical",
        title: "Surgery Overrun",
        message: `${s.procedure} has exceeded planned duration`,
        meta: `${s.patientName} · OT ${s.otRoomName}`,
        action: `/doctor/schedule-details.html?id=${s.id}`
      });
    }

    /* 🟡 Ending soon */
    if (
      s.status === "Ongoing" &&
      now < end &&
      mins(end - now) <= 15
    ) {
      alerts.push({
        level: "warning",
        title: "Surgery Near Completion",
        message: `${s.procedure} ending in ${mins(end - now)} minutes`,
        meta: `${s.patientName} · OT ${s.otRoomName}`,
        action: `/doctor/schedule-details.html?id=${s.id}`
      });
    }

    /* 🔵 Upcoming */
    if (
      s.status === "Scheduled" &&
      mins(start - now) <= 30 &&
      mins(start - now) > 0
    ) {
      alerts.push({
        level: "info",
        title: "Upcoming Surgery",
        message: `${s.procedure} starts in ${mins(start - now)} minutes`,
        meta: `${s.patientName} · OT ${s.otRoomName}`,
        action: `/doctor/schedule-details.html?id=${s.id}`
      });
    }
  });

  return alerts;
}

/* RENDER */
function render(alerts) {
  alertList.innerHTML = "";
  emptyState.classList.toggle("hidden", alerts.length !== 0);

  const stats = {
    critical: alerts.filter(a => a.level === "critical").length,
    warning: alerts.filter(a => a.level === "warning").length,
    info: alerts.filter(a => a.level === "info").length
  };

  alertSummary.innerHTML = `
    <div class="text-red-600">Critical: ${stats.critical}</div>
    <div class="text-yellow-600">Warnings: ${stats.warning}</div>
    <div class="text-blue-600">Info: ${stats.info}</div>
    <div>Total: ${alerts.length}</div>
  `;

  alerts.forEach(a => {
    const row = document.createElement("div");
    row.className = "py-3 flex justify-between items-start gap-4";

    row.innerHTML = `
      <div>
        <div class="font-semibold ${
          a.level === "critical"
            ? "text-red-600"
            : a.level === "warning"
            ? "text-yellow-600"
            : "text-blue-600"
        }">
          ${a.title}
        </div>
        <div class="text-sm">${a.message}</div>
        <div class="text-xs text-slate-500 mt-1">${a.meta}</div>
      </div>

      <a href="${a.action}"
         class="text-xs font-semibold text-blue-600 hover:underline">
        View →
      </a>
    `;

    alertList.appendChild(row);
  });
}

/* INIT */
auth.onAuthStateChanged(user => {
  if (!user) return;

  const q = query(
    collection(db, "schedules"),
    where("surgeonId", "==", user.uid)
  );

  onSnapshot(q, snap => {
    const schedules = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    const alerts = generateAlerts(schedules);
    render(alerts);
  });
});
