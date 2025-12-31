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

/* ELEMENTS */
const table = document.getElementById("doctorTable");

const kpiTotal = document.getElementById("kpiTotal");
const kpiActive = document.getElementById("kpiActive");
const kpiBusy = document.getElementById("kpiBusy");
const kpiDepartments = document.getElementById("kpiDepartments");

/* LOAD DOCTORS */
async function loadDoctors() {
  const q = query(collection(db, "users"), where("role", "==", "Doctor"));
  const snap = await getDocs(q);

  table.innerHTML = "";

  let total = 0;
  let active = 0;
  let busy = 0;
  const deptSet = new Set();

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    total++;

    if (d.status !== "disabled") active++;
    if (d.availability === "busy") busy++;
    if (d.department) deptSet.add(d.department);

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition";

    tr.innerHTML = `
      <td class="px-6 py-4 font-semibold">
        ${d.displayName || "—"}
      </td>

      <td class="px-6 py-4">
        ${d.email || "—"}
      </td>

      <td class="px-6 py-4">
        ${d.department || "—"}
      </td>

      <td class="px-6 py-4 capitalize">
        ${d.availability || "unknown"}
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
        <div class="flex justify-end gap-4">
          <a
            href="/admin/doctor-details.html?id=${docSnap.id}"
            class="font-semibold text-[--primary]">
            View
          </a>

          <button
            data-id="${docSnap.id}"
            data-status="${d.status || "active"}"
            class="toggleBtn font-semibold text-amber-600">
            ${d.status === "disabled" ? "Enable" : "Disable"}
          </button>
        </div>
      </td>
    `;

    table.appendChild(tr);
  });

  /* KPIs */
  kpiTotal.textContent = total;
  kpiActive.textContent = active;
  kpiBusy.textContent = busy;
  kpiDepartments.textContent = deptSet.size;

  bindToggleButtons();
}

/* ENABLE / DISABLE DOCTOR */
function bindToggleButtons() {
  document.querySelectorAll(".toggleBtn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const current = btn.dataset.status;
      const next = current === "disabled" ? "active" : "disabled";

      const ok = confirm(`Are you sure you want to ${next} this doctor?`);
      if (!ok) return;

      await updateDoc(doc(db, "users", id), {
        status: next,
        updatedAt: serverTimestamp(),
      });

      loadDoctors();
    };
  });
}

/* INIT */
loadDoctors();
