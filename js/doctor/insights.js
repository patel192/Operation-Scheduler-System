import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const rangeSelect = document.getElementById("rangeSelect");

const kpiTotal = document.getElementById("kpiTotal");
const kpiAvg = document.getElementById("kpiAvg");
const kpiOnTime = document.getElementById("kpiOnTime");
const kpiOverrun = document.getElementById("kpiOverrun");
const kpiDays = document.getElementById("kpiDays");

const insightList = document.getElementById("insightList");

/* CHART CONTEXTS */
const workloadCtx = document.getElementById("workloadChart");
const durationCtx = document.getElementById("durationChart");
const deptCtx = document.getElementById("deptChart");
const otCtx = document.getElementById("otChart");

let charts = [];

/* HELPERS */
const t = ts => ts.toDate();
const daysAgo = d => new Date(Date.now() - d * 86400000);

/* LOAD */
async function loadInsights() {
  if (!auth.currentUser) return;

  const range = Number(rangeSelect.value);
  const since = daysAgo(range);

  const snap = await getDocs(
    query(
      collection(db, "schedules"),
      where("surgeonId", "==", auth.currentUser.uid)
    )
  );

  const data = snap.docs
    .map(d => d.data())
    .filter(s => t(s.startTime) >= since);

  render(data);
}

/* RENDER */
function render(schedules) {
  charts.forEach(c => c.destroy());
  charts = [];

  if (!schedules.length) return;

  /* KPIs */
  kpiTotal.textContent = schedules.length;

  const durations = schedules.map(
    s => (t(s.endTime) - t(s.startTime)) / 60000
  );

  const avg = durations.reduce((a,b)=>a+b,0) / durations.length;
  kpiAvg.textContent = Math.round(avg) + " min";

  const overruns = schedules.filter(
    s => s.status === "Ongoing" && new Date() > t(s.endTime)
  ).length;

  kpiOverrun.textContent = overruns;

  const onTime = schedules.filter(
    s => s.status === "Completed"
  ).length;

  kpiOnTime.textContent =
    Math.round((onTime / schedules.length) * 100) + "%";

  kpiDays.textContent =
    new Set(schedules.map(s => t(s.startTime).toDateString())).size;

  /* WORKLOAD */
  const byDay = {};
  schedules.forEach(s => {
    const d = t(s.startTime).toLocaleDateString();
    byDay[d] = (byDay[d] || 0) + 1;
  });

  charts.push(new Chart(workloadCtx, {
    type: "bar",
    data: {
      labels: Object.keys(byDay),
      datasets: [{ data: Object.values(byDay) }]
    }
  }));

  /* DURATION TREND */
  charts.push(new Chart(durationCtx, {
    type: "line",
    data: {
      labels: Object.keys(byDay),
      datasets: [{
        data: Object.keys(byDay).map(
          d => {
            const ds = schedules.filter(
              s => t(s.startTime).toLocaleDateString() === d
            );
            return Math.round(
              ds.reduce((a,b)=>a+(t(b.endTime)-t(b.startTime)),0)
              / ds.length / 60000
            );
          }
        )
      }]
    }
  }));

  /* DEPARTMENT */
  const byDept = {};
  schedules.forEach(s => {
    byDept[s.department] = (byDept[s.department] || 0) + 1;
  });

  charts.push(new Chart(deptCtx, {
    type: "doughnut",
    data: {
      labels: Object.keys(byDept),
      datasets: [{ data: Object.values(byDept) }]
    }
  }));

  /* OT */
  const byOT = {};
  schedules.forEach(s => {
    byOT[s.otRoomName] = (byOT[s.otRoomName] || 0) + 1;
  });

  charts.push(new Chart(otCtx, {
    type: "bar",
    data: {
      labels: Object.keys(byOT),
      datasets: [{ data: Object.values(byOT) }]
    }
  }));

  /* INSIGHTS */
  insightList.innerHTML = `
    <li>• Highest workload day: <b>${
      Object.entries(byDay).sort((a,b)=>b[1]-a[1])[0][0]
    }</b></li>
    <li>• Average surgery duration: <b>${Math.round(avg)} min</b></li>
    <li>• Overruns detected: <b class="text-red-600">${overruns}</b></li>
    <li>• Most used OT: <b>${
      Object.entries(byOT).sort((a,b)=>b[1]-a[1])[0][0]
    }</b></li>
  `;
}

/* INIT */
auth.onAuthStateChanged(u => {
  if (!u) return;
  loadInsights();
});

rangeSelect.addEventListener("change", loadInsights);
