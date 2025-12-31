import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const tbody = document.getElementById("departmentTableBody");

const kpiTotal = document.getElementById("kpiTotal");
const kpiActive = document.getElementById("kpiActive");
const kpiDoctors = document.getElementById("kpiDoctors");
const kpiOTs = document.getElementById("kpiOTs");

/* ================= LOAD DEPARTMENTS ================= */
async function loadDepartments() {
  const deptSnap = await getDocs(collection(db, "departments"));
  const usersSnap = await getDocs(
    query(collection(db, "users"), where("role", "==", "Doctor"))
  );

  tbody.innerHTML = "";

  let total = 0;
  let active = 0;
  let totalDoctors = 0;
  const otSet = new Set();

  /* ---------- GROUP DOCTORS BY DEPARTMENT ---------- */
  const doctorCountMap = {};
  usersSnap.forEach((docSnap) => {
    const u = docSnap.data();
    if (!u.department) return;

    doctorCountMap[u.department] =
      (doctorCountMap[u.department] || 0) + 1;

    totalDoctors++;
  });

  /* ---------- RENDER DEPARTMENTS ---------- */
  deptSnap.forEach((docSnap) => {
    const d = docSnap.data();
    total++;

    if (d.status === "active") active++;

    const doctorCount = doctorCountMap[d.name] || 0;

    (d.otRooms || []).forEach((ot) => otSet.add(ot));

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition";

    tr.innerHTML = `
      <td class="px-6 py-4 font-semibold">${d.name}</td>

      <td class="px-6 py-4">
        ${d.headDoctorName || "—"}
      </td>

      <td class="px-6 py-4 font-semibold">
        ${doctorCount}
      </td>

      <td class="px-6 py-4">
        ${(d.otRooms || []).join(", ") || "—"}
      </td>

      <td class="px-6 py-4">
        <span class="px-3 py-1 rounded-full text-xs font-semibold
          ${
            d.status === "active"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }">
          ${d.status}
        </span>
      </td>

      <td class="px-6 py-4">
        <div class="flex justify-end gap-4">
          <a
            href="/admin/department-details.html?id=${docSnap.id}"
            class="action-link text-[--primary]">
            View
          </a>

          <button
            data-id="${docSnap.id}"
            data-status="${d.status}"
            class="action-link text-amber-600 toggleBtn">
            ${d.status === "active" ? "Disable" : "Enable"}
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  /* ================= KPI UPDATE ================= */
  kpiTotal.textContent = total;
  kpiActive.textContent = active;
  kpiDoctors.textContent = totalDoctors;
  kpiOTs.textContent = otSet.size;

  bindToggleButtons();
}

/* ================= ENABLE / DISABLE ================= */
function bindToggleButtons() {
  document.querySelectorAll(".toggleBtn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const current = btn.dataset.status;
      const nextStatus = current === "active" ? "disabled" : "active";

      const ok = confirm(
        `Are you sure you want to ${nextStatus} this department?`
      );
      if (!ok) return;

      await updateDoc(doc(db, "departments", id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });

      loadDepartments();
    };
  });
}

/* ================= INIT ================= */
loadDepartments();
