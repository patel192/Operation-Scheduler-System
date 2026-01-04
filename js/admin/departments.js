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

/* ELEMENTS */
const tbody = document.getElementById("departmentTableBody");
const kpiTotal = document.getElementById("kpiTotal");
const kpiActive = document.getElementById("kpiActive");
const kpiDoctors = document.getElementById("kpiDoctors");
const kpiOTs = document.getElementById("kpiOTs");

async function loadDepartments() {
  const deptSnap = await getDocs(collection(db, "departments"));
  const usersSnap = await getDocs(
    query(collection(db, "users"), where("role", "==", "Doctor"))
  );

  tbody.innerHTML = "";

  let total = 0,
    active = 0,
    totalDoctors = 0;
  const otSet = new Set();
  const doctorCountMap = {};

  usersSnap.forEach((d) => {
    const u = d.data();
    if (!u.department) return;
    doctorCountMap[u.department] = (doctorCountMap[u.department] || 0) + 1;
    totalDoctors++;
  });

  deptSnap.forEach((docSnap) => {
    const d = docSnap.data();
    total++;

    if (d.status === "active") active++;

    const doctorCount = doctorCountMap[d.name] || 0;
    (d.otRooms || []).forEach((ot) => otSet.add(ot));

    const tr = document.createElement("tr");
    tr.className = "table-row";

    tr.innerHTML = `
    <!-- DEPARTMENT -->
    <td class="px-6 py-4">
      <div class="font-semibold text-slate-900">
        ${d.name}
      </div>
      <div class="text-xs text-slate-500 mt-0.5">
        ID · ${docSnap.id.slice(0, 6)}…
      </div>
    </td>

    <!-- HEAD -->
    <td class="px-6 py-4 text-sm">
      ${d.headDoctorName || "<span class='text-slate-400'>Unassigned</span>"}
    </td>

    <!-- DOCTORS -->
    <td class="px-6 py-4">
      <span class="font-semibold text-slate-900">
        ${doctorCount}
      </span>
      <span class="text-xs text-slate-500 ml-1">Doctors</span>
    </td>

    <!-- OT ROOMS -->
    <td class="px-6 py-4">
      ${
        (d.otRooms || []).length
          ? d.otRooms.map((ot) => `<span class="chip">${ot}</span>`).join("")
          : "<span class='text-slate-400'>—</span>"
      }
    </td>

    <!-- STATUS -->
    <td class="px-6 py-4">
      <span
        class="px-3 py-1 rounded-full text-xs font-semibold
        ${
          d.status === "active"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-red-100 text-red-700"
        }">
        ${d.status === "active" ? "Active" : "Disabled"}
      </span>
    </td>

    <!-- ACTIONS -->
    <td class="px-6 py-4 text-right">
      <div class="flex justify-end items-center gap-4 text-sm">

        <a
          href="/admin/department-details.html?id=${docSnap.id}"
          class="flex items-center gap-1 text-indigo-600 font-semibold hover:underline">
          View
        </a>

        <button
          data-id="${docSnap.id}"
          data-status="${d.status}"
          class="toggleBtn flex items-center gap-1 font-semibold
          ${
            d.status === "active"
              ? "text-amber-600 hover:underline"
              : "text-emerald-600 hover:underline"
          }">
          ${d.status === "active" ? "Disable" : "Enable"}
        </button>

      </div>
    </td>
  `;

    tbody.appendChild(tr);
  });

  kpiTotal.textContent = total;
  kpiActive.textContent = active;
  kpiDoctors.textContent = totalDoctors;
  kpiOTs.textContent = otSet.size;

  bindToggleButtons();
}

function bindToggleButtons() {
  document.querySelectorAll(".toggleBtn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const nextStatus =
        btn.dataset.status === "active" ? "disabled" : "active";

      if (nextStatus === "disabled") {
        const deptDoc = (
          await getDocs(collection(db, "departments"))
        ).docs.find((d) => d.id === id);
        const deptName = deptDoc.data().name;

        const doctors = await getDocs(
          query(
            collection(db, "users"),
            where("role", "==", "Doctor"),
            where("department", "==", deptName)
          )
        );
        if (!doctors.empty) return alert("Doctors assigned.");

        const schedules = await getDocs(
          query(
            collection(db, "schedules"),
            where("department", "==", deptName),
            where("status", "in", ["Upcoming", "Ongoing"])
          )
        );
        if (!schedules.empty) return alert("Active schedules exist.");
      }

      await updateDoc(doc(db, "departments", id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });

      loadDepartments();
    };
  });
}

loadDepartments();
