import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const tableBody = document.getElementById("otTableBody");
const otGrid = document.getElementById("otGrid");
const activeOtList = document.getElementById("activeOtList");
const riskList = document.getElementById("riskList");

let capacityChart;

/* ================= LOAD ================= */
async function loadOtRooms() {
  const snap = await getDocs(collection(db, "otRooms"));

  tableBody.innerHTML = "";
  otGrid.innerHTML = "";
  activeOtList.innerHTML = "";
  riskList.innerHTML = "";

  let total = 0;
  let available = 0;
  let inUse = 0;
  let maintenance = 0;

  const riskyOts = [];

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const id = docSnap.id;
    total++;

    /* ---------- STATUS COUNT ---------- */
    if (d.status === "available") available++;
    else if (d.status === "in-use") inUse++;
    else maintenance++;

    /* ---------- ACTIVE OT LIST ---------- */
    if (d.status === "in-use") {
      activeOtList.innerHTML += `
        <li class="flex justify-between bg-slate-50 px-4 py-2 rounded">
          <span class="font-semibold">${d.name}</span>
          <span class="text-xs text-amber-600 font-semibold">IN USE</span>
        </li>
      `;

      if (!d.activeScheduleId) {
        riskyOts.push(`${d.name}: In-use without active schedule`);
      }
    }

    /* ---------- OT GRID CARD ---------- */
    otGrid.innerHTML += `
  <div class="ot-card fade-scale bg-white rounded-2xl border p-5">

    <!-- HEADER -->
    <div class="flex justify-between items-start">
      <div>
        <h4 class="font-semibold text-lg tracking-tight">
          ${d.name}
        </h4>
        <p class="text-xs text-slate-500 mt-0.5">
          ${d.department || "Unassigned Department"}
        </p>
      </div>

      <span class="px-3 py-1 rounded-full text-xs font-semibold
        ${
          d.status === "available"
            ? "bg-emerald-100 text-emerald-700"
            : d.status === "in-use"
            ? "bg-blue-100 text-blue-700 status-pulse"
            : "bg-amber-100 text-amber-700"
        }">
        ${d.status}
      </span>
    </div>

    <!-- META -->
    <div class="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
      <div>
        <span class="block font-semibold text-slate-800">
          ${(d.equipment || []).length}
        </span>
        Equipment
      </div>

      <div>
        <span class="block font-semibold text-slate-800">
          ${d.capacity || "—"}
        </span>
        Capacity
      </div>
    </div>

    <!-- ACTION -->
    <a
      href="/admin/ot-room-details.html?id=${id}"
      class="group mt-5 inline-flex items-center gap-2 text-indigo-600
             text-sm font-semibold">

      View Details
      <span class="transition-transform group-hover:translate-x-1">→</span>
    </a>

  </div>
`;

    /* ---------- TABLE ROW ---------- */
    const tr = document.createElement("tr");
    tr.className = "table-row";

    tr.innerHTML = `
  <!-- STATUS INDICATOR -->
  <td class="pl-4">
    <div class="row-indicator h-8
      ${
        d.status === "available"
          ? "bg-emerald-500"
          : d.status === "in-use"
          ? "bg-blue-500"
          : "bg-amber-500"
      }">
    </div>
  </td>

  <!-- OT NAME -->
  <td class="px-4 py-4">
    <div class="font-semibold text-slate-900">
      ${d.name}
    </div>
    <div class="text-xs text-slate-500">
      ID: ${id.slice(0, 6)}…
    </div>
  </td>

  <!-- DEPARTMENT -->
  <td class="px-4 py-4 text-sm text-slate-700">
    ${d.department || "—"}
  </td>

  <!-- EQUIPMENT -->
  <td class="px-4 py-4 text-xs text-slate-600 max-w-[220px] truncate">
    ${
      (d.equipment || []).length
        ? d.equipment.join(", ")
        : "No equipment linked"
    }
  </td>

  <!-- STATUS BADGE -->
  <td class="px-4 py-4">
    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
      ${
        d.status === "available"
          ? "bg-emerald-100 text-emerald-700"
          : d.status === "in-use"
          ? "bg-blue-100 text-blue-700"
          : "bg-amber-100 text-amber-700"
      }">
      <span class="w-2 h-2 rounded-full
        ${
          d.status === "available"
            ? "bg-emerald-500"
            : d.status === "in-use"
            ? "bg-blue-500"
            : "bg-amber-500"
        }">
      </span>
      ${d.status}
    </span>
  </td>

  <!-- ACTION -->
  <td class="px-4 py-4 text-right">
    <button
      data-id="${id}"
      data-status="${d.status}"
      class="action-btn text-amber-600">
      ${d.status === "disabled" ? "Enable" : "Disable"}
    </button>
  </td>
`;

    tableBody.appendChild(tr);
  });

  renderCapacityChart(available, inUse, maintenance);
  renderRisks(riskyOts);
  bindToggles();
}

/* ================= CHART ================= */
function renderCapacityChart(available, inUse, maintenance) {
  capacityChart?.destroy();

  capacityChart = new Chart(document.getElementById("capacityChart"), {
    type: "doughnut",
    data: {
      labels: ["Available", "In Use", "Maintenance"],
      datasets: [
        {
          data: [available, inUse, maintenance],
          backgroundColor: ["#10b981", "#3b82f6", "#f59e0b"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      cutout: "65%",
    },
  });
}

/* ================= RISKS ================= */
function renderRisks(risks) {
  if (!risks.length) {
    riskList.innerHTML = `
      <li class="text-emerald-600 font-semibold">
        ✓ No operational risks detected
      </li>
    `;
    return;
  }

  risks.forEach(
    (r) =>
      (riskList.innerHTML += `
      <li class="bg-rose-50 border border-rose-200 px-4 py-2 rounded text-sm">
        ${r}
      </li>
    `)
  );
}

/* ================= TOGGLES ================= */
function bindToggles() {
  document.querySelectorAll(".toggleBtn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const current = btn.dataset.status;

      if (current === "in-use") {
        alert("Cannot disable OT Room currently in use");
        return;
      }

      const next = current === "disabled" ? "available" : "disabled";

      if (!confirm(`Set OT Room as ${next}?`)) return;

      await updateDoc(doc(db, "otRooms", id), {
        status: next,
        updatedAt: serverTimestamp(),
      });

      loadOtRooms();
    };
  });
}

/* ================= INIT ================= */
loadOtRooms();
