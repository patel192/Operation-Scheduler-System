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
const toggleBtn = document.getElementById("toggleStatusBtn");

const doctorsTable = document.getElementById("doctorsTable");
const emptyDoctors = document.getElementById("emptyDoctors");

/* ================= LOAD ================= */
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
  doctorCountEl.textContent = d.doctorCount || 0;
  otRoomsEl.textContent = (d.otRooms || []).join(", ") || "—";

  deptStatusEl.textContent = d.status;
  deptStatusEl.className =
    `inline-block px-3 py-1 rounded-full text-xs font-semibold ${
      d.status === "active"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-red-100 text-red-700"
    }`;

  toggleBtn.textContent =
    d.status === "active" ? "Disable Department" : "Enable Department";

  toggleBtn.className =
    d.status === "active"
      ? "px-4 py-2 rounded-xl bg-red-100 text-red-700 font-semibold hover:bg-red-200"
      : "px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200";

  toggleBtn.onclick = async () => {
    await updateDoc(ref, {
      status: d.status === "active" ? "disabled" : "active",
    });
    loadDepartment();
  };

  loadDoctors(d.name);
}

/* ================= LOAD DOCTORS ================= */
async function loadDoctors(departmentName) {
  doctorsTable.innerHTML = "";
  emptyDoctors.classList.add("hidden");

  const q = query(
    collection(db, "users"),
    where("role", "==", "Doctor"),
    where("department", "==", departmentName)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    emptyDoctors.classList.remove("hidden");
    return;
  }

  snap.forEach((docSnap) => {
    const u = docSnap.data();

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50";

    tr.innerHTML = `
      <td class="px-6 py-4 font-semibold">${u.displayName || "—"}</td>
      <td class="px-6 py-4">${u.email || "—"}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-full text-xs font-semibold
          ${
            u.availability === "busy"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          }">
          ${u.availability || "available"}
        </span>
      </td>
    `;

    doctorsTable.appendChild(tr);
  });
}

/* ================= INIT ================= */
loadDepartment();
