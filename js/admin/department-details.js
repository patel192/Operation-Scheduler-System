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

const params = new URLSearchParams(window.location.search);
const deptId = params.get("id");

if (!deptId) {
  alert("Invalid department");
  location.href = "/admin/departments.html";
}

const deptNameEl = document.getElementById("deptName");
const deptStatusEl = document.getElementById("deptStatus");
const toggleBtn = document.getElementById("toggleStatusBtn");
const doctorCountEl = document.getElementById("doctorCount");
const otRoomsEl = document.getElementById("otRooms");
const doctorsTable = document.getElementById("doctorsTable");
const emptyDoctors = document.getElementById("emptyDoctors");

async function loadDepartment() {
  const snap = await getDoc(doc(db, "departments", deptId));
  if (!snap.exists()) {
    alert("Department not found");
    location.href = "/admin/departments.html";
    return;
  }

  const d = snap.data();

  deptNameEl.textContent = d.name;
  deptStatusEl.textContent = d.status;
  deptStatusEl.className =
    `px-4 py-2 rounded-full text-sm font-semibold ${
      d.status === "active"
        ? "bg-emerald-200 text-emerald-800"
        : "bg-red-200 text-red-800"
    }`;

  toggleBtn.textContent =
    d.status === "active" ? "Disable Department" : "Activate Department";

  otRoomsEl.textContent = (d.otRooms || []).join(", ");

  loadDoctors(d.name);
}

async function loadDoctors(deptName) {
  doctorsTable.innerHTML = "";
  emptyDoctors.classList.add("hidden");

  const snap = await getDocs(
    query(
      collection(db, "users"),
      where("role", "==", "Doctor"),
      where("department", "==", deptName)
    )
  );

  doctorCountEl.textContent = snap.size;

  if (snap.empty) {
    emptyDoctors.classList.remove("hidden");
    return;
  }

  snap.forEach(docSnap => {
    const d = docSnap.data();

    doctorsTable.innerHTML += `
      <tr>
        <td class="px-6 py-4 font-semibold">${d.displayName}</td>
        <td class="px-6 py-4">${d.email}</td>
        <td class="px-6 py-4 capitalize">${d.availability || "available"}</td>
      </tr>
    `;
  });
}

toggleBtn.onclick = async () => {
  const ref = doc(db, "departments", deptId);
  const snap = await getDoc(ref);
  const d = snap.data();

  if (d.status === "active") {
    alert("Disable blocked if doctors or schedules exist");
    return;
  }

  await updateDoc(ref, {
    status: d.status === "active" ? "disabled" : "active",
  });

  loadDepartment();
};

loadDepartment();
