import { db } from "../firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= PARAM ================= */
const params = new URLSearchParams(window.location.search);
const otId = params.get("id");

if (!otId) {
  alert("Invalid OT Room");
  window.location.href = "/admin/ot-rooms.html";
}

/* ================= ELEMENTS ================= */
const otNameEl = document.getElementById("otName");
const otDepartmentEl = document.getElementById("otDepartment");
const statusBadgeEl = document.getElementById("statusBadge");
const equipmentListEl = document.getElementById("equipmentList");
const equipmentCountEl = document.getElementById("equipmentCount");
const emptyEquipmentEl = document.getElementById("emptyEquipment");
const lastUpdatedEl = document.getElementById("lastUpdated");
const toggleStatusBtn = document.getElementById("toggleStatusBtn");

const timelineList = document.getElementById("timelineList");
const timelineEmpty = document.getElementById("timelineEmpty");

/* ================= HELPERS ================= */
function statusClass(status) {
  if (status === "available") return "bg-emerald-100 text-emerald-700";
  if (status === "in-use") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
}

function formatDate(ts) {
  if (!ts) return "—";
  return ts.toDate().toLocaleString();
}

/* ================= LOAD OT ROOM ================= */
async function loadOtRoom() {
  const ref = doc(db, "otRooms", otId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("OT Room not found");
    window.location.href = "/admin/ot-rooms.html";
    return;
  }

  const d = snap.data();

  otNameEl.textContent = d.name || "—";
  otDepartmentEl.textContent = d.department || "—";

  statusBadgeEl.textContent = d.status;
  statusBadgeEl.className =
    `inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${statusClass(d.status)}`;

  equipmentCountEl.textContent = (d.equipment || []).length;
  lastUpdatedEl.textContent = formatDate(d.updatedAt || d.createdAt);

  toggleStatusBtn.textContent =
    d.status === "disabled" ? "Enable OT Room" : "Disable OT Room";

  toggleStatusBtn.className =
    d.status === "disabled"
      ? "px-5 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-semibold"
      : "px-5 py-2 rounded-xl bg-red-100 text-red-700 font-semibold";

  renderEquipment(d.equipment || []);
  await loadTimeline(d.name);
}

/* ================= EQUIPMENT ================= */
function renderEquipment(list) {
  equipmentListEl.innerHTML = "";
  emptyEquipmentEl.classList.add("hidden");

  if (!list.length) {
    emptyEquipmentEl.classList.remove("hidden");
    return;
  }

  list.forEach((eq) => {
    const li = document.createElement("li");
    li.textContent = eq;
    equipmentListEl.appendChild(li);
  });
}

/* ================= TIMELINE ================= */
async function loadTimeline(otName) {
  timelineList.innerHTML = "";
  timelineEmpty.classList.add("hidden");

  const q = query(
    collection(db, "schedules"),
    where("otRoom", "==", otName),
    orderBy("startTime", "asc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    timelineEmpty.classList.remove("hidden");
    return;
  }

  snap.forEach((docSnap) => {
    const s = docSnap.data();

    const card = document.createElement("div");
    card.className =
      "border-l-4 border-blue-500 pl-4 py-3 rounded hover:bg-slate-50 cursor-pointer";

    card.innerHTML = `
      <p class="font-semibold">${s.procedure}</p>
      <p class="text-sm text-slate-600">
        Patient: ${s.patientName} • Surgeon: ${s.surgeonName || "—"}
      </p>
      <p class="text-xs text-slate-500">
        ${s.startTime.toDate().toLocaleString()} – ${s.endTime.toDate().toLocaleString()}
      </p>
      <span class="text-xs font-semibold uppercase">${s.status}</span>
    `;

    card.onclick = () => {
      window.location.href = `/admin/schedule-details.html?id=${docSnap.id}`;
    };

    timelineList.appendChild(card);
  });
}

/* ================= ACTION ================= */
toggleStatusBtn.onclick = async () => {
  const ref = doc(db, "otRooms", otId);
  const snap = await getDoc(ref);
  const d = snap.data();

  if (d.status === "in-use") {
    alert("Cannot disable an OT Room currently in use");
    return;
  }

  const nextStatus = d.status === "disabled" ? "available" : "disabled";

  await updateDoc(ref, {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });

  loadOtRoom();
};

/* ================= INIT ================= */
loadOtRoom();
