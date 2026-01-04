import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const usersTable = document.getElementById("usersTable");
const attentionList = document.getElementById("attentionList");
const attentionEmpty = document.getElementById("attentionEmpty");

const kpiTotal = document.getElementById("kpiTotal");
const kpiActive = document.getElementById("kpiActive");
const kpiPending = document.getElementById("kpiPending");
const kpiDisabled = document.getElementById("kpiDisabled");

let roleChart, statusChart;

async function loadDashboard() {
  const snap = await getDocs(collection(db, "users"));
  const users = snap.docs.map(d => ({ id:d.id, ...d.data() }));

  renderKPIs(users);
  renderCharts(users);
  renderAttention(users);
  renderTable(users);
}

/* KPIs */
function renderKPIs(users) {
  kpiTotal.textContent = users.length;
  kpiActive.textContent = users.filter(u => u.status === "active").length;
  kpiPending.textContent = users.filter(u => u.status === "pending").length;
  kpiDisabled.textContent = users.filter(u => u.status === "disabled").length;
}

/* CHARTS */
function renderCharts(users) {
  const roleMap = {};
  const statusMap = {};

  users.forEach(u => {
    roleMap[u.role] = (roleMap[u.role] || 0) + 1;
    statusMap[u.status || "pending"] =
      (statusMap[u.status || "pending"] || 0) + 1;
  });

  roleChart?.destroy();
  statusChart?.destroy();

  roleChart = new Chart(document.getElementById("roleChart"), {
    type:"doughnut",
    data:{
      labels:Object.keys(roleMap),
      datasets:[{
        data:Object.values(roleMap),
        backgroundColor:["#6366f1","#10b981","#f59e0b","#94a3b8"]
      }]
    },
    options:{ cutout:"65%", plugins:{legend:{position:"bottom"}} }
  });

  statusChart = new Chart(document.getElementById("statusChart"), {
    type:"bar",
    data:{
      labels:Object.keys(statusMap),
      datasets:[{
        data:Object.values(statusMap),
        backgroundColor:"#0a6cff",
        borderRadius:6
      }]
    },
    options:{ plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}},y:{grid:{display:false}}}}
  });
}

/* ATTENTION */
function renderAttention(users) {
  attentionList.innerHTML = "";
  const risky = users.filter(
    u => u.status === "pending" ||
         (u.role === "Doctor" && u.availability === "busy")
  );

  if (!risky.length) {
    attentionEmpty.classList.remove("hidden");
    return;
  }

  attentionEmpty.classList.add("hidden");
  risky.slice(0,6).forEach(u => {
    attentionList.innerHTML += `
      <li class="flex justify-between bg-amber-50 border border-amber-200 px-4 py-2 rounded">
        <span class="font-semibold">${u.displayName || "—"}</span>
        <span class="text-xs text-amber-700">
          ${u.status === "pending" ? "Pending approval" : "Busy doctor"}
        </span>
      </li>`;
  });
}

/* TABLE */
function renderTable(users) {
  usersTable.innerHTML = "";

  users.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-6 py-3 font-semibold">${u.displayName || "—"}</td>
      <td class="px-6 py-3">${u.role}</td>
      <td class="px-6 py-3">
        <span class="px-2 py-0.5 rounded-full text-xs font-semibold
          ${u.status==="active"?"bg-emerald-100 text-emerald-700":
            u.status==="disabled"?"bg-red-100 text-red-700":
            "bg-amber-100 text-amber-700"}">
          ${u.status || "pending"}
        </span>
      </td>
      <td class="px-6 py-3 capitalize">${u.availability || "—"}</td>
      <td class="px-6 py-3 text-right">
        <a href="/admin/users.html" class="text-indigo-600 font-semibold">
          Manage →
        </a>
      </td>
    `;
    usersTable.appendChild(tr);
  });
}

loadDashboard();
