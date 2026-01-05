import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const kpiStrip = document.getElementById("kpiStrip");
const durationTable = document.getElementById("durationTable");
const distribution = document.getElementById("distribution");

/* HELPERS */
const t = ts => ts.toDate();
const minutes = ms => Math.round(ms / 60000);

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

  let completed = 0;
  let overruns = 0;
  let totalActual = 0;
  const otSet = new Set();
  const byDay = {};
  const statusCount = {};

  list.forEach(s => {
    const planned = t(s.endTime) - t(s.startTime);
    const actual =
      s.status === "Completed"
        ? planned
        : Math.min(Date.now() - t(s.startTime), planned);

    totalActual += actual;
    otSet.add(s.otRoomId);

    if (s.status === "Completed") completed++;
    if (actual > planned) overruns++;

    const day = t(s.startTime).toLocaleDateString("en-US",{ weekday:"short" });
    byDay[day] = (byDay[day] || 0) + 1;

    statusCount[s.status] = (statusCount[s.status] || 0) + 1;
  });

  /* KPIs */
  kpiStrip.innerHTML = `
    <div>Total Surgeries<br><span class="text-sm">${list.length}</span></div>
    <div>Completed<br><span class="text-sm">
      ${Math.round((completed / list.length) * 100)}%
    </span></div>
    <div>Avg Duration<br><span class="text-sm">
      ${minutes(totalActual / list.length)}m
    </span></div>
    <div class="text-red-600">Overruns<br><span class="text-sm">
      ${overruns}
    </span></div>
    <div>OT Used<br><span class="text-sm">${otSet.size}</span></div>
  `;

  /* DURATION TABLE */
  durationTable.innerHTML = "";
  list
    .slice()
    .sort((a,b)=> t(b.startTime)-t(a.startTime))
    .slice(0,10)
    .forEach(s => {
      const planned = minutes(t(s.endTime)-t(s.startTime));
      const actual = minutes(
        Math.min(Date.now()-t(s.startTime), t(s.endTime)-t(s.startTime))
      );
      const over = actual > planned;

      const row = document.createElement("div");
      row.className = "grid grid-cols-[1fr_80px_80px] gap-3 py-2";

      row.innerHTML = `
        <div>
          <div class="font-semibold">${s.procedure}</div>
          <div class="text-xs text-slate-500">
            ${s.patientName} · ${s.otRoomName}
          </div>
        </div>

        <div class="text-xs">${planned}m</div>
        <div class="text-xs ${over ? "text-red-600 font-semibold" : ""}">
          ${actual}m
        </div>
      `;

      durationTable.appendChild(row);
    });

  /* DISTRIBUTION */
  distribution.innerHTML = `
    <div>
      <p class="text-xs text-slate-500 mb-1">Weekly Load</p>
      ${Object.entries(byDay)
        .map(([d,v])=>`
          <div class="flex justify-between">
            <span>${d}</span><span>${v}</span>
          </div>
        `).join("")}
    </div>

    <div class="pt-2 border-t">
      <p class="text-xs text-slate-500 mb-1">Status Breakdown</p>
      ${Object.entries(statusCount)
        .map(([s,v])=>`
          <div class="flex justify-between">
            <span>${s}</span><span>${v}</span>
          </div>
        `).join("")}
    </div>
  `;
}

/* INIT */
auth.onAuthStateChanged(u => {
  if (u) loadInsights();
});
