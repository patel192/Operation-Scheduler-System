import { db } from "../firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { loadDepartmentDoctors } from "../admin/loadDepartmentDoctors.js";

/* ================= PARAM ================= */
const params = new URLSearchParams(window.location.search);
const deptId = params.get("id");

if (!deptId) {
  alert("Invalid department");
  window.location.href = "/admin/departments.html";
}

/* ================= ELEMENTS ================= */
const deptNameEl = document.getElementById("deptName");
const deptStatusEl = document.getElementById("deptStatus");
const doctorCountEl = document.getElementById("doctorCount");
const otRoomsEl = document.getElementById("otRooms");
const toggleStatusBtn = document.getElementById("toggleStatusBtn");

const headDoctorSelect = document.getElementById("headDoctorSelect");
const saveHeadBtn = document.getElementById("saveHead");

const doctorsTable = document.getElementById("doctorsTable");
const emptyDoctors = document.getElementById("emptyDoctors");

/* ================= HELPERS ================= */
function statusBadge(status) {
  return status === "active"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-red-100 text-red-700";
}

/* ================= LOAD DEPARTMENT ================= */
async function loadDepartment() {
  const ref = doc(db, "departments", deptId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Department not found");
    window.location.href = "/admin/departments.html";
    return;
  }

  const d = snap.data();

  deptNameEl.textContent = d.name;
  deptStatusEl.textContent = d.status;
  deptStatusEl.className = `inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
    d.status
  )}`;

  otRoomsEl.textContent = (d.otRooms || []).join(", ");

  toggleStatusBtn.textContent =
    d.status === "active" ? "Disable Department" : "Activate Department";

  toggleStatusBtn.className =
    d.status === "active"
      ? "px-5 py-2 rounded-xl bg-red-100 text-red-700 font-semibold"
      : "px-5 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-semibold";

  /* ----- Department Head ----- */
  await loadDepartmentDoctors(headDoctorSelect, d.name);

  if (d.headDoctorId) {
    headDoctorSelect.value = d.headDoctorId;
  }

  /* ----- Load Doctors ----- */
  await loadDepartmentDoctorsList(d.name);
}

/* ================= DOCTORS LIST ================= */
async function loadDepartmentDoctorsList(departmentName) {
  doctorsTable.innerHTML = "";
  emptyDoctors.classList.add("hidden");

  const q = query(
    collection(db, "users"),
    where("role", "==", "Doctor"),
    where("department", "==", departmentName)
  );

  const snap = await getDocs(q);

  doctorCountEl.textContent = snap.size;

  if (snap.empty) {
    emptyDoctors.classList.remove("hidden");
    return;
  }

  snap.forEach((docSnap) => {
    const u = docSnap.data();

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-6 py-4 font-semibold">${u.displayName || "—"}</td>
      <td class="px-6 py-4">${u.email || "—"}</td>
      <td class="px-6 py-4">
  <span class="px-3 py-1 rounded-full text-xs font-semibold
    ${
      u.availability === "busy"
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700"
    }">
    ${u.availability || "unknown"}
  </span>
</td>

    `;

    doctorsTable.appendChild(tr);
  });
}

/* ================= ACTIONS ================= */
toggleStatusBtn.onclick = async () => {
  const ref = doc(db, "departments", deptId);
  const snap = await getDoc(ref);
  const d = snap.data();

  const nextStatus = d.status === "active" ? "disabled" : "active";

  if (nextStatus === "disabled") {
    // 1️⃣ Doctors check
    const doctorsSnap = await getDocs(
      query(
        collection(db, "users"),
        where("role", "==", "Doctor"),
        where("department", "==", d.name)
      )
    );

    if (!doctorsSnap.empty) {
      alert("Cannot disable department: doctors are assigned.");
      return;
    }

    // 2️⃣ Active schedules check
    const schedulesSnap = await getDocs(
      query(
        collection(db, "schedules"),
        where("department", "==", d.name),
        where("status", "in", ["Upcoming", "Ongoing"])
      )
    );

    if (!schedulesSnap.empty) {
      alert("Cannot disable department: active schedules exist.");
      return;
    }
  }

  await updateDoc(ref, {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });

  loadDepartment();
};

saveHeadBtn.onclick = async () => {
  const ref = doc(db, "departments", deptId);

  const headDoctorId = headDoctorSelect.value || null;
  const headDoctorName =
    headDoctorSelect.selectedOptions[0]?.textContent || null;

  await updateDoc(ref, {
    headDoctorId,
    headDoctorName,
  });

  alert("Department head updated");
};

/* ================= INIT ================= */
loadDepartment();
