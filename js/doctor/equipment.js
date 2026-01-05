import { auth, db } from "../firebase.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const equipmentGrid = document.getElementById("equipmentGrid");
const equipmentSummary = document.getElementById("equipmentSummary");

/* HELPERS */
const t = ts => ts.toDate();
function sameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

/* LOAD */
async function load() {
  if (!auth.currentUser) return;

  const [equipmentSnap, scheduleSnap] = await Promise.all([
    getDocs(collection(db, "equipment")),
    getDocs(
      query(
        collection(db, "schedules"),
        where("surgeonId", "==", auth.currentUser.uid)
      )
    )
  ]);

  const equipment = equipmentSnap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  const schedules = scheduleSnap.docs.map(d => d.data());

  render(equipment, schedules);
}

/* RENDER */
function render(equipment, schedules) {
  const today = new Date();

  const todaySchedules = schedules.filter(s =>
    sameDay(t(s.startTime), today)
  );

  const equipmentUsage = {};
  todaySchedules.forEach(s => {
    (s.equipmentIds || []).forEach(id => {
      equipmentUsage[id] = (equipmentUsage[id] || 0) + 1;
    });
  });

  /* KPI STRIP */
  equipmentSummary.innerHTML = `
    <div>Total Equipment<br><span class="text-sm">${equipment.length}</span></div>
    <div class="text-red-600">In Use Today<br><span class="text-sm">
      ${Object.keys(equipmentUsage).length}
    </span></div>
    <div>Linked to Me<br><span class="text-sm">
      ${equipment.filter(e => equipmentUsage[e.id]).length}
    </span></div>
    <div>Categories<br><span class="text-sm">
      ${new Set(equipment.map(e => e.category)).size}
    </span></div>
    <div>Departments<br><span class="text-sm">
      ${new Set(equipment.flatMap(e => e.departments || [])).size}
    </span></div>
  `;

  /* GRID */
  equipmentGrid.innerHTML = "";

  equipment.forEach(e => {
    const usedCount = equipmentUsage[e.id] || 0;
    const risk = usedCount > 1;

    const card = document.createElement("div");
    card.className = `
      glass rounded-2xl border p-4 space-y-3
      ${risk ? "border-red-600 pulse" : ""}
    `;

    card.innerHTML = `
      <div class="flex justify-between items-center">
        <h2 class="font-semibold text-sm">${e.name}</h2>
        <span class="text-xs px-2 py-0.5 rounded-full
          ${usedCount ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}">
          ${usedCount ? "In Use" : "Idle"}
        </span>
      </div>

      <div class="text-xs text-slate-500">
        Category: <span class="font-semibold">${e.category}</span>
      </div>

      <div class="text-xs">
        Departments:
        <span class="font-semibold">
          ${(e.departments || []).join(", ") || "—"}
        </span>
      </div>

      <div class="text-xs">
        Linked Surgeries Today:
        <span class="font-semibold">${usedCount}</span>
      </div>

      ${
        risk
          ? `<div class="text-xs text-red-600 font-semibold">
               ⚠ High utilization today
             </div>`
          : ""
      }

      ${
        usedCount
          ? `
            <div class="pt-2 text-right">
              <a
                href="/doctor/my-schedule.html"
                class="text-xs font-semibold text-blue-600 hover:underline">
                View Schedules →
              </a>
            </div>
          `
          : ""
      }
    `;

    equipmentGrid.appendChild(card);
  });
}

/* INIT */
auth.onAuthStateChanged(u => {
  if (u) load();
});
