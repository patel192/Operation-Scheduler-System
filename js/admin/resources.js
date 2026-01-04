import { db } from "../firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const tableBody = document.getElementById("equipmentTableBody");
const emptyState = document.getElementById("emptyState");

const totalEl = document.getElementById("totalEquipment");
const inUseEl = document.getElementById("inUseEquipment");
const availableEl = document.getElementById("availableEquipment");
const maintenanceEl = document.getElementById("maintenanceEquipment");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const departmentFilter = document.getElementById("departmentFilter");
const statusFilter = document.getElementById("statusFilter");

/* ================= STATE ================= */
let equipmentList = [];

/* ================= HELPERS ================= */
function formatDate(ts) {
  if (!ts) return "—";
  return ts.toDate().toLocaleString();
}

function statusBadge(status) {
  if (status === "in-use")
    return `<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">In Use</span>`;
  if (status === "maintenance")
    return `<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Maintenance</span>`;
  return `<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>`;
}

/* ================= LOAD ================= */
async function loadEquipment() {
  const snap = await getDocs(collection(db, "equipment"));

  equipmentList = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  populateFilters();
  render();
}

/* ================= FILTER SETUP ================= */
function populateFilters() {
  const categories = new Set();
  const departments = new Set();

  equipmentList.forEach((e) => {
    if (e.category) categories.add(e.category);
    (e.departments || []).forEach((d) => departments.add(d));
  });

  categoryFilter.innerHTML =
    `<option value="">All Categories</option>` +
    [...categories].map((c) => `<option value="${c}">${c}</option>`).join("");

  departmentFilter.innerHTML =
    `<option value="">All Departments</option>` +
    [...departments].map((d) => `<option value="${d}">${d}</option>`).join("");
}

/* ================= RENDER ================= */
function render() {
  tableBody.innerHTML = "";

  const filtered = equipmentList.filter((e) => {
    const searchMatch =
      !searchInput.value ||
      e.name?.toLowerCase().includes(searchInput.value.toLowerCase());

    const categoryMatch =
      !categoryFilter.value || e.category === categoryFilter.value;

    const statusMatch = !statusFilter.value || e.status === statusFilter.value;

    const departmentMatch =
      !departmentFilter.value ||
      (e.departments || []).includes(departmentFilter.value);

    return searchMatch && categoryMatch && statusMatch && departmentMatch;
  });

  updateSummary(filtered);

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  filtered.forEach(renderRow);
}

/* ================= ROW ================= */
function renderRow(eq) {
  const tr = document.createElement("tr");
  tr.className = "border-b last:border-0";

  tr.innerHTML = `
    <td class="px-4 py-3 font-medium">${eq.name}</td>
    <td class="px-4 py-3">${eq.category || "—"}</td>
    <td class="px-4 py-3">${(eq.departments || []).join(", ") || "—"}</td>
    <td class="px-4 py-3">${statusBadge(eq.status)}</td>
    <td class="px-4 py-3">${eq.currentOtRoomName || "—"}</td>
    <td class="px-4 py-3">${formatDate(eq.lastUsedAt)}</td>
    
<td class="px-4 py-3 text-right">
  <a
    href="/admin/edit-equipment.html?id=${eq.id}"
    class="text-blue-600 hover:underline text-sm">
    Edit
  </a>
</td>

  `;

  tableBody.appendChild(tr);
}

/* ================= SUMMARY ================= */
function updateSummary(list) {
  totalEl.textContent = list.length;
  inUseEl.textContent = list.filter((e) => e.status === "in-use").length;
  maintenanceEl.textContent = list.filter(
    (e) => e.status === "maintenance"
  ).length;
  availableEl.textContent = list.filter((e) => e.status === "active").length;
}

/* ================= EVENTS ================= */
searchInput.oninput = render;
categoryFilter.onchange = render;
departmentFilter.onchange = render;
statusFilter.onchange = render;

/* ================= INIT ================= */
loadEquipment();
