import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const kpiStrip = document.getElementById("kpiStrip");
const efficiencyList = document.getElementById("efficiencyList");

let workloadChart, statusChart, otChart;

/* PREF STATE */
let doctorPrefs = {
  upcomingWindowMinutes: 15,
  minGapMinutes: 30,
  workingHours: null
};

/* HELPERS */
const t = (ts) => ts.toDate();
const mins = (ms) => Math.round(ms / 60000);

function dayKey(d) {
  return d.toISOString().slice(0, 10);
}

function withinWorkingHours(date) {
  if (!doctorPrefs.workingHours) return true;

  const [sh, sm] = doctorPrefs.workingHours.start.split(":").map(Number);
  const [eh, em] = doctorPrefs.workingHours.end.split(":").map(Number);

  const start = new Date(date);
  start.setHours(sh, sm, 0, 0);

  const end = new Date(date);
  end.setHours(eh, em, 0, 0);

  return date >= start && date <= end;
}

/* LOAD PREFS */
async function loadPreferences(uid) {
  const snap = await getDoc(doc(db, "doctorProfiles", uid));
  if (!snap.exists()) return;

  const p = snap.data();
  doctorPrefs.upcomingWindowMinutes =
    p.upcomingWindowMinutes ?? doctorPrefs.upcomingWindowMinutes;
  doctorPrefs.minGapMinutes =
    p.minGapMinutes ?? doctorPrefs.minGapMinutes;
  doctorPrefs.workingHours = p.workingHours || null;
}

/* LOAD DATA */
async function loadInsights() {
  if (!auth.currentUser) return;

  await loadPreferences(auth.currentUser.uid);

  const snap = await getDocs(
    query(
      collection(db, "schedules"),
      where("surgeonId", "==", auth.currentUser.uid)
    )
  );

  const schedules = snap.docs.map((d) => d.data());
  render(schedules);
}

/* RENDER */
function render(list) {
  if (!list.length) return;

  const now = new Date();
  const last7 = {};
  const otMap = {};
  const statusCount = { Completed: 0, Ongoing: 0, Scheduled: 0 };

  let overruns = 0;
  let totalDuration = 0;

  list.forEach((s) => {
    const start = t(s.startTime);
    const end = t(s.endTime);
    const planned = mins(end - start);

    // Ignore outside working hours
    if (!withinWorkingHours(start)) return;

    totalDuration += planned;
    statusCount[s.status] = (statusCount[s.status] || 0) + 1;

    /* Last 7 days */
    const diffDays = Math.floor((now - start) / 86400000);
    if (diffDays >= 0 && diffDays <= 6) {
      const key = dayKey(start);
      last7[key] = (last7[key] || 0) + 1;
    }

    /* Overrun */
    if (s.status === "Ongoing" && now > end) {
      overruns++;
    }

    /* OT utilization */
    otMap[s.otRoomName] = (otMap[s.otRoomName] || 0) + planned;
  });

  /* KPI STRIP */
  kpiStrip.innerHTML = `
    <div>Total Procedures<br><span class="text-sm">${list.length}</span></div>
    <div>Last 7 Days<br><span class="text-sm">${Object.values(last7).reduce((a,b)=>a+b,0)}</span></div>
    <div>Avg Duration<br><span class="text-sm">${Math.round(totalDuration / Math.max(list.length,1))}m</span></div>
    <div class="text-red-600">Overruns<br><span class="text-sm">${overruns}</span></div>
    <div>OT Rooms Used<br><span class="text-sm">${Object.keys(otMap).length}</span></div>
    <div>Departments<br><span class="text-sm">${new Set(list.map(s=>s.department)).size}</span></div>
  `;

  /* WORKLOAD CHART */
  const days = Object.keys(last7).sort();
  const counts = days.map((d) => last7[d]);

  workloadChart?.destroy();
  workloadChart = new Chart(
    document.getElementById("workloadChart"),
    {
      type: "bar",
      data: {
        labels: days,
        datasets: [{ data: counts }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    }
  );

  /* STATUS DISTRIBUTION */
  statusChart?.destroy();
  statusChart = new Chart(
    document.getElementById("statusChart"),
    {
      type: "doughnut",
      data: {
        labels: Object.keys(statusCount),
        datasets: [{ data: Object.values(statusCount) }]
      },
      options: {
        plugins: { legend: { position: "bottom" } }
      }
    }
  );

  /* OT UTILIZATION */
  otChart?.destroy();
  otChart = new Chart(
    document.getElementById("otChart"),
    {
      type: "bar",
      data: {
        labels: Object.keys(otMap),
        datasets: [{ data: Object.values(otMap) }]
      },
      options: {
        indexAxis: "y",
        plugins: { legend: { display: false } }
      }
    }
  );

  /* PROCEDURE EFFICIENCY */
  efficiencyList.innerHTML = "";

  list
    .slice(-5)
    .reverse()
    .forEach((s) => {
      const start = t(s.startTime);
      const end = t(s.endTime);
      const planned = mins(end - start);

      if (!withinWorkingHours(start)) return;

      const actual =
        s.status === "Completed"
          ? planned
          : mins(Math.min(now - start, end - start));

      const over = actual > planned;

      const row = document.createElement("div");
      row.innerHTML = `
        <div class="flex justify-between">
          <span>${s.procedure}</span>
          <span class="${over ? "text-red-600 font-semibold" : ""}">
            ${actual}m / ${planned}m
          </span>
        </div>
      `;
      efficiencyList.appendChild(row);
    });
}

/* INIT */
auth.onAuthStateChanged((u) => {
  if (u) loadInsights();
});
