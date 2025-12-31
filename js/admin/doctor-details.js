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
const doctorId = params.get("id");

if (!doctorId) {
  alert("Invalid doctor");
  window.location.href = "/admin/doctors.html";
}

/* ================= ELEMENTS ================= */
const doctorNameEl = document.getElementById("doctorName");
const doctorEmailEl = document.getElementById("doctorEmail");
const statusBadgeEl = document.getElementById("statusBadge");
const availabilityEl = document.getElementById("availability");
const departmentEl = document.getElementById("department");
const toggleStatusBtn = document.getElementById("toggleStatusBtn");

const scheduleTable = document.getElementById("scheduleTable");
const emptySchedules = document.getElementById("emptySchedules");

/* ================= HELPERS ================= */
function statusBadge(status) {
  return status === "disabled"
    ? "bg-red-100 text-red-700"
    : "bg-emerald-100 text-emerald-700";
}

function formatTime(ts) {
  return ts.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ================= LOAD DOCTOR ================= */
async function loadDoctor() {
  const ref = doc(db, "users", doctorId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Doctor not found");
    window.location.href = "/admin/doctors.html";
    return;
  }

  const d = snap.data();

  doctorNameEl.textContent = d.displayName || "—";
  doctorEmailEl.textContent = d.email || "—";
  availabilityEl.textContent = d.availability || "unknown";
  departmentEl.textContent = d.department || "—";

  statusBadgeEl.textContent = d.status || "active";
  statusBadgeEl.className =
    `inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(d.status)}`;

  toggleStatusBtn.textContent =
    d.status === "disabled" ? "Enable Doctor" : "Disable Doctor";

  toggleStatusBtn.className =
    d.status === "disabled"
      ? "px-5 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-semibold"
      : "px-5 py-2 rounded-xl bg-red-100 text-red-700 font-semibold";

  await loadSchedules();
}

/* ================= LOAD SCHEDULES ================= */
async function loadSchedules() {
  scheduleTable.innerHTML = "";
  emptySchedules.classList.add("hidden");

  const q = query(
    collection(db, "schedules"),
    where("surgeonId", "==", doctorId)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    emptySchedules.classList.remove("hidden");
    return;
  }

  snap.forEach((docSnap) => {
    const s = docSnap.data();

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-6 py-4 font-semibold">${s.patientName || "—"}</td>
      <td class="px-6 py-4">${s.procedure || "—"}</td>
      <td class="px-6 py-4">${s.otRoom || "—"}</td>
      <td class="px-6 py-4">
        ${formatTime(s.startTime)} – ${formatTime(s.endTime)}
      </td>
      <td class="px-6 py-4 capitalize">${s.status}</td>
    `;

    scheduleTable.appendChild(tr);
  });
}

/* ================= ACTION ================= */
toggleStatusBtn.onclick = async () => {
  const ref = doc(db, "users", doctorId);
  const snap = await getDoc(ref);
  const d = snap.data();

  if (d.availability === "busy" && d.status !== "disabled") {
    alert("Cannot disable a doctor with active schedules");
    return;
  }

  const next = d.status === "disabled" ? "active" : "disabled";

  await updateDoc(ref, { status: next });
  loadDoctor();
};

/* ================= INIT ================= */
loadDoctor();
