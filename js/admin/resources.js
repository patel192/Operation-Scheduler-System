import { db } from "../firebase.js";
import { collection, getDocs } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
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

/* STATE */
let equipmentList = [];

/* HELPERS */
const badge = s =>
  s === "in-use"
    ? "bg-amber-100 text-amber-700"
    : s === "maintenance"
    ? "bg-rose-100 text-rose-700"
    : "bg-emerald-100 text-emerald-700";

/* LOAD */
async function loadEquipment() {
  const snap = await getDocs(collection(db, "equipment"));
  equipmentList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  populateFilters();
  render();
}

/* FILTERS */
function populateFilters() {
  const cats = new Set(), depts = new Set();
  equipmentList.forEach(e => {
    e.category && cats.add(e.category);
    (e.departments || []).forEach(d => depts.add(d));
  });

  categoryFilter.innerHTML =
    `<option value="">All Categories</option>` +
    [...cats].map(c => `<option>${c}</option>`).join("");

  departmentFilter.innerHTML =
    `<option value="">All Departments</option>` +
    [...depts].map(d => `<option>${d}</option>`).join("");
}

/* RENDER */
function render() {
  tableBody.innerHTML = "";

  const list = equipmentList.filter(e =>
    (!searchInput.value || e.name?.toLowerCase().includes(searchInput.value.toLowerCase())) &&
    (!categoryFilter.value || e.category === categoryFilter.value) &&
    (!statusFilter.value || e.status === statusFilter.value) &&
    (!departmentFilter.value || (e.departments || []).includes(departmentFilter.value))
  );

  updateSummary(list);

  if (!list.length) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  list.forEach(e => {
    tableBody.innerHTML += `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-4 py-3 font-semibold">${e.name}</td>
        <td class="px-4 py-3">${e.category || "—"}</td>
        <td class="px-4 py-3">${(e.departments || []).join(", ") || "—"}</td>
        <td class="px-4 py-3">
          <span class="px-3 py-1 rounded-full text-xs font-semibold ${badge(e.status)}">
            ${e.status}
          </span>
        </td>
        <td class="px-4 py-3">${e.currentOtRoomName || "—"}</td>
        <td class="px-4 py-3">${e.lastUsedAt?.toDate().toLocaleString() || "—"}</td>
        <td class="px-4 py-3 text-right">
          <a href="/admin/equipment-details.html?id=${e.id}"
             class="text-indigo-600 font-semibold hover:underline">
            View
          </a>
        </td>
      </tr>`;
  });
}

/* SUMMARY */
function updateSummary(list) {
  totalEl.textContent = list.length;
  inUseEl.textContent = list.filter(e => e.status === "in-use").length;
  maintenanceEl.textContent = list.filter(e => e.status === "maintenance").length;
  availableEl.textContent = list.filter(e => e.status === "active").length;
}

/* EVENTS */
[searchInput, categoryFilter, departmentFilter, statusFilter]
  .forEach(el => el.oninput = render);

/* INIT */
loadEquipment();
