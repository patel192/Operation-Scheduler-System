import { db } from "../firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= PARAMS ================= */
const params = new URLSearchParams(window.location.search);
const equipmentId = params.get("id");

if (!equipmentId) {
  alert("Invalid equipment");
  window.location.href = "/admin/resources.html";
}

/* ================= ELEMENTS ================= */
const nameEl = document.getElementById("equipmentName");
const categoryEl = document.getElementById("equipmentCategory");
const departmentsEl = document.getElementById("equipmentDepartments");
const descriptionEl = document.getElementById("equipmentDescription");

const statusEl = document.getElementById("equipmentStatus");
const currentOtEl = document.getElementById("currentOtRoom");
const currentScheduleEl = document.getElementById("currentSchedule");
const lastUsedEl = document.getElementById("lastUsedAt");

const imageEl = document.getElementById("equipmentImage");
const editBtn = document.getElementById("editEquipmentBtn");

const markMaintenanceBtn = document.getElementById("markMaintenanceBtn");
const restoreActiveBtn = document.getElementById("restoreActiveBtn");
const maintenanceHint = document.getElementById("maintenanceHint");

/* ================= HELPERS ================= */
function statusBadge(status) {
  if (status === "in-use")
    return `<span class="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-700">In Use</span>`;
  if (status === "maintenance")
    return `<span class="px-3 py-1 text-sm rounded-full bg-red-100 text-red-700">Maintenance</span>`;
  return `<span class="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700">Active</span>`;
}

function formatDate(ts) {
  if (!ts) return "—";
  return ts.toDate().toLocaleString();
}

/* ================= LOAD ================= */
async function loadEquipment() {
  const ref = doc(db, "equipment", equipmentId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Equipment not found");
    window.location.href = "/admin/resources.html";
    return;
  }

  const e = snap.data();

  nameEl.textContent = e.name || "—";
  categoryEl.textContent = e.category || "—";
  departmentsEl.textContent = (e.departments || []).join(", ") || "—";
  descriptionEl.textContent = e.description || "—";

  statusEl.innerHTML = statusBadge(e.status);
  currentOtEl.textContent = e.currentOtRoomName || "—";
  lastUsedEl.textContent = formatDate(e.lastUsedAt);

  if (e.currentScheduleId) {
    currentScheduleEl.innerHTML = `
      <a
        href="/admin/schedule-details.html?id=${e.currentScheduleId}"
        class="text-blue-600 hover:underline">
        View Schedule
      </a>
    `;
  } else {
    currentScheduleEl.textContent = "—";
  }

  // IMAGE
  if (e.imageUrl) {
    imageEl.src = e.imageUrl;
    imageEl.classList.remove("hidden");
  }

  editBtn.href = `/admin/edit-equipment.html?id=${equipmentId}`;

  // ===== MAINTENANCE BUTTON VISIBILITY RULES =====
  markMaintenanceBtn.classList.add("hidden");
  restoreActiveBtn.classList.add("hidden");
  maintenanceHint.classList.add("hidden");

  if (e.status === "active") {
    markMaintenanceBtn.classList.remove("hidden");
  }

  if (e.status === "maintenance") {
    restoreActiveBtn.classList.remove("hidden");
  }

  if (e.status === "in-use") {
    maintenanceHint.classList.remove("hidden");
  }
}

/* ================= ACTIONS ================= */

// ➕ Put under maintenance
markMaintenanceBtn.onclick = async () => {
  if (!confirm("Put this equipment under maintenance?")) return;

  await updateDoc(doc(db, "equipment", equipmentId), {
    status: "maintenance",
  });

  await loadEquipment();
};

// ➖ Restore to active
restoreActiveBtn.onclick = async () => {
  if (!confirm("Restore this equipment to active state?")) return;

  await updateDoc(doc(db, "equipment", equipmentId), {
    status: "active",
  });

  await loadEquipment();
};

/* ================= INIT ================= */
loadEquipment();
