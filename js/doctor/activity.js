import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const timeline = document.getElementById("activityTimeline");
const summary = document.getElementById("activitySummary");
const dateFilter = document.getElementById("dateFilter");

/* ================= HELPERS ================= */
const t = ts => ts.toDate();
const fmt = d => d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const sameDay = (a,b) => a.toDateString() === b.toDateString();

/* ================= STATE ================= */
let activities = [];

/* ================= BUILD ACTIVITY ================= */
function extractActivities(s) {
  const list = [];

  // Schedule created
  if (s.createdAt) {
    list.push({
      at: s.createdAt,
      type: "info",
      title: "Schedule Created",
      desc: `${s.procedure} · OT ${s.otRoomName}`,
    });
  }

  // Notes
  if (Array.isArray(s.notes)) {
    s.notes.forEach(n => {
      list.push({
        at: n.at,
        type: "info",
        title: "Note Added",
        desc: `${s.procedure}: "${n.text}"`,
      });
    });
  }

  // Completion
  if (s.status === "Completed") {
    list.push({
      at: s.updatedAt || s.endTime,
      type: "success",
      title: "Surgery Completed",
      desc: `${s.procedure} · Patient ${s.patientName}`,
    });
  }

  // Overrun
  if (s.status === "Ongoing" && new Date() > t(s.endTime)) {
    list.push({
      at: s.endTime,
      type: "warning",
      title: "Surgery Overrun",
      desc: `${s.procedure} exceeded planned time`,
    });
  }

  return list;
}

/* ================= RENDER ================= */
function render() {
  const selectedDate = dateFilter.value
    ? new Date(dateFilter.value)
    : new Date();

  const filtered = activities.filter(a =>
    a.at && sameDay(t(a.at), selectedDate)
  );

  /* SUMMARY */
  summary.innerHTML = `
    <div>Total<br><span>${filtered.length}</span></div>
    <div class="text-blue-600">Notes<br><span>${
      filtered.filter(a => a.title === "Note Added").length
    }</span></div>
    <div class="text-green-600">Completed<br><span>${
      filtered.filter(a => a.title === "Surgery Completed").length
    }</span></div>
    <div class="text-red-600">Warnings<br><span>${
      filtered.filter(a => a.type === "warning").length
    }</span></div>
  `;

  /* TIMELINE */
  timeline.innerHTML = `
    <div class="absolute left-2 top-0 bottom-0 w-px bg-slate-200"></div>
  `;

  filtered
    .sort((a,b)=> t(b.at)-t(a.at))
    .forEach(a => {
      const dot =
        a.type === "success" ? "bg-green-600" :
        a.type === "warning" ? "bg-red-600" :
        "bg-blue-600";

      const item = document.createElement("div");
      item.className = "relative flex gap-4";

      item.innerHTML = `
        <span class="absolute left-[-14px] top-1.5 w-2.5 h-2.5 rounded-full ${dot}"></span>

        <div class="w-full">
          <div class="flex justify-between text-xs text-slate-500">
            <span>${a.title}</span>
            <span>${fmt(t(a.at))}</span>
          </div>

          <div class="font-medium mt-0.5">
            ${a.desc}
          </div>
        </div>
      `;

      timeline.appendChild(item);
    });
}

/* ================= LISTENER ================= */
function listen() {
  const q = query(
    collection(db, "schedules"),
    where("surgeonId", "==", auth.currentUser.uid)
  );

  onSnapshot(q, snap => {
    activities = [];
    snap.docs.forEach(d => {
      extractActivities(d.data()).forEach(a => activities.push(a));
    });
    render();
  });
}

/* ================= INIT ================= */
auth.onAuthStateChanged(u => {
  if (!u) return;
  dateFilter.valueAsDate = new Date();
  listen();
});

dateFilter.addEventListener("change", render);
