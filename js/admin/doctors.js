import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const table = document.getElementById("doctorTable");

const kpiTotal = document.getElementById("kpiTotal");
const kpiActive = document.getElementById("kpiActive");
const kpiBusy = document.getElementById("kpiBusy");
const kpiDepartments = document.getElementById("kpiDepartments");

let availabilityChart, departmentChart;

async function loadDoctors() {
  const snap = await getDocs(
    query(collection(db, "users"), where("role", "==", "Doctor"))
  );

  table.innerHTML = "";

  let total = 0, active = 0, busy = 0, free = 0;
  const deptCount = {};

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    total++;

    if (d.status !== "disabled") active++;
    if (d.availability === "busy") busy++;
    else free++;

    if (d.department)
      deptCount[d.department] = (deptCount[d.department] || 0) + 1;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition";

    tr.innerHTML = `
      <td class="px-6 py-4 font-semibold">${d.displayName || "—"}</td>
      <td class="px-6 py-4">${d.department || "—"}</td>
      <td class="px-6 py-4">
        <span class="px-3 py-1 rounded-full text-xs font-semibold
          ${d.availability === "busy"
            ? "bg-amber-100 text-amber-700"
            : "bg-emerald-100 text-emerald-700"}">
          ${d.availability || "available"}
        </span>
      </td>
      <td class="px-6 py-4">
        <span class="px-3 py-1 rounded-full text-xs font-semibold
          ${d.status === "disabled"
            ? "bg-red-100 text-red-700"
            : "bg-emerald-100 text-emerald-700"}">
          ${d.status || "active"}
        </span>
      </td>
      <td class="px-6 py-4 text-right">
        <div class="flex justify-end gap-3">
          <a href="/admin/doctor-details.html?id=${docSnap.id}"
             class="text-indigo-600 font-semibold">View</a>
          <button
            data-id="${docSnap.id}"
            data-status="${d.status || "active"}"
            class="toggleBtn text-amber-600 font-semibold">
            ${d.status === "disabled" ? "Enable" : "Disable"}
          </button>
        </div>
      </td>
    `;

    table.appendChild(tr);
  });

  kpiTotal.textContent = total;
  kpiActive.textContent = active;
  kpiBusy.textContent = busy;
  kpiDepartments.textContent = Object.keys(deptCount).length;

  renderCharts(busy, free, deptCount);
  bindToggles();
}

function renderCharts(busy, free, deptCount) {
  availabilityChart?.destroy();
  departmentChart?.destroy();

  availabilityChart = new Chart(
    document.getElementById("availabilityChart"),
    {
      type: "doughnut",
      data: {
        labels: ["Busy", "Available"],
        datasets: [{
          data: [busy, free],
          backgroundColor: ["#f59e0b", "#10b981"],
          borderWidth: 0,
        }],
      },
      options: {
        plugins: { legend: { position: "bottom" } },
        cutout: "65%",
      },
    }
  );

  departmentChart = new Chart(
    document.getElementById("departmentChart"),
    {
      type: "bar",
      data: {
        labels: Object.keys(deptCount),
        datasets: [{
          data: Object.values(deptCount),
          backgroundColor: "#6366f1",
          borderRadius: 6,
        }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { display: false } },
        },
      },
    }
  );
}

function bindToggles() {
  document.querySelectorAll(".toggleBtn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const next = btn.dataset.status === "disabled" ? "active" : "disabled";

      if (!confirm(`Are you sure you want to ${next} this doctor?`)) return;

      await updateDoc(doc(db, "users", id), {
        status: next,
        updatedAt: serverTimestamp(),
      });

      loadDoctors();
    };
  });
}

loadDoctors();
