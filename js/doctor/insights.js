import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const kpiStrip = document.getElementById("kpiStrip");
const efficiencyList = document.getElementById("efficiencyList");

let workloadChart, statusChart, otChart;

/* HELPERS */
const t = ts => ts.toDate();
const mins = ms => Math.round(ms / 60000);

function dayKey(d) {
  return d.toISOString().slice(0,10);
}

/* LOAD */
async function loadInsights() {
  if (!auth.currentUser) return;

  const snap = await getDocs(
    query(
      collection(db, "schedules"),
      where("surgeonId", "==", auth.currentUser.uid)
    )
  );

  const schedules = snap.docs.map(d => d.data());
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

  list.forEach(s => {
    const start = t(s.startTime);
    const end = t(s.endTime);
    const planned = mins(end - start);

    totalDuration += planned;
    statusCount[s.status] = (statusCount[s.status] || 0) + 1;

    // last 7 days
    const diff = Math.floor((now - start) / 86400000);
    if (diff <= 6) {
      const key = dayKey(start);
      last7[key] = (last7[key] || 0) + 1;
    }

    // overrun
    if (s.status === "Ongoing" && now > end) overruns++;

    // OT usage
    otMap[s.otRoomName] = (otMap[s.otRoomName] || 0) + planned;
  });

  /* KPI STRIP */
  kpiStrip.innerHTML = `
    <div>Total Procedures<br><span class="text-sm">${list.length}</span></div>
    <div>Last 7 Days<br><span class="text-sm">${Object.values(last7).reduce((a,b)=>a+b,0)}</span></div>
    <div>Avg Duration<br><span class="text-sm">${Math.round(totalDuration / list.length)}m</span></div>
    <div class="text-red-600">Overruns<br><span class="text-sm">${overruns}</span></div>
    <div>OT Rooms Used<br><span class="text-sm">${Object.keys(otMap).length}</span></div>
    <div>Departments<br><span class="text-sm">${new Set(list.map(s=>s.department)).size}</span></div>
  `;

  /* WORKLOAD CHART */
  const days = Object.keys(last7).sort();
  const counts = days.map(d => last7[d]);

  workloadChart?.destroy();
  workloadChart = new Chart(
    document.getElementById("workloadChart"),
    {
      type: "bar",
      data: {
        labels: days,
        datasets: [{
          label: "Procedures",
          data: counts
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    }
  );

  /* STATUS CHART */
  statusChart?.destroy();
  statusChart = new Chart(
    document.getElementById("statusChart"),
    {
      type: "doughnut",
      data: {
        labels: Object.keys(statusCount),
        datasets: [{
          data: Object.values(statusCount)
        }]
      },
      options: {
        plugins: { legend: { position: "bottom" } }
      }
    }
  );

  /* OT UTILIZATION */
  const otNames = Object.keys(otMap);
  const otValues = Object.values(otMap);

  otChart?.destroy();
  otChart = new Chart(
    document.getElementById("otChart"),
    {
      type: "bar",
      data: {
        labels: otNames,
        datasets: [{
          data: otValues
        }]
      },
      options: {
        indexAxis: "y",
        plugins: { legend: { display: false } }
      }
    }
  );

  /* EFFICIENCY LIST */
  efficiencyList.innerHTML = "";
  list.slice(-5).reverse().forEach(s => {
    const planned = mins(t(s.endTime)-t(s.startTime));
    const actual =
      s.status === "Completed"
        ? planned
        : mins(Math.min(Date.now()-t(s.startTime), t(s.endTime)-t(s.startTime)));

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
auth.onAuthStateChanged(u => {
  if (u) loadInsights();
});
