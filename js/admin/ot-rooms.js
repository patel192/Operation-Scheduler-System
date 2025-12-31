import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const tbody = document.getElementById("otTableBody");
const emptyState = document.getElementById("emptyState");

const kpiTotal = document.getElementById("kpiTotal");
const kpiAvailable = document.getElementById("kpiAvailable");
const kpiInUse = document.getElementById("kpiInUse");
const kpiMaintenance = document.getElementById("kpiMaintenance");

/* ================= LOAD OT ROOMS ================= */
async function loadOtRooms() {
  const snap = await getDocs(collection(db, "otRooms"));

  tbody.innerHTML = "";
  emptyState.classList.add("hidden");

  let total = 0;
  let available = 0;
  let inUse = 0;
  let maintenance = 0;

  if (snap.empty) {
    emptyState.classList.remove("hidden");
    return;
  }

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    total++;

    if (d.status === "available") available++;
    else if (d.status === "in-use") inUse++;
    else maintenance++;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition";

    tr.innerHTML = `
      <td class="px-6 py-4 font-semibold">${d.name}</td>
      <td class="px-6 py-4">${d.department || "—"}</td>
      <td class="px-6 py-4 text-xs">
        ${(d.equipment || []).join(", ") || "—"}
      </td>
      <td class="px-6 py-4">
        <span class="px-3 py-1 rounded-full text-xs font-semibold
          ${
            d.status === "available"
              ? "bg-emerald-100 text-emerald-700"
              : d.status === "in-use"
              ? "bg-blue-100 text-blue-700"
              : "bg-amber-100 text-amber-700"
          }">
          ${d.status}
        </span>
      </td>
      <td class="px-6 py-4 text-right">
        <div class="flex justify-end gap-4">
          <a href="/admin/ot-room-details.html?id=${docSnap.id}"
             class="font-semibold text-[--primary] hover:underline">
            View
          </a>

          <button
            data-id="${docSnap.id}"
            data-status="${d.status}"
            class="toggleBtn font-semibold text-amber-600 hover:underline">
            ${d.status === "disabled" ? "Enable" : "Disable"}
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  /* ================= KPIs ================= */
  kpiTotal.textContent = total;
  kpiAvailable.textContent = available;
  kpiInUse.textContent = inUse;
  kpiMaintenance.textContent = maintenance;

  bindToggleButtons();
}

/* ================= ENABLE / DISABLE ================= */
function bindToggleButtons() {
  document.querySelectorAll(".toggleBtn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const current = btn.dataset.status;

      if (current === "in-use") {
        alert("Cannot disable OT Room currently in use");
        return;
      }

      const nextStatus = current === "disabled" ? "available" : "disabled";

      const ok = confirm(`Set OT Room as ${nextStatus}?`);
      if (!ok) return;

      await updateDoc(doc(db, "otRooms", id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });

      loadOtRooms();
    };
  });
}

/* ================= INIT ================= */
loadOtRooms();
