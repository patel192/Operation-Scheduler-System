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

const equipmentGrid = document.getElementById("equipmentGrid");
const saveEquipmentBtn = document.getElementById("saveEquipmentBtn");

const timelineList = document.getElementById("timelineList");
const timelineEmpty = document.getElementById("timelineEmpty");

/* ================= STATE ================= */
let otRoomData = null;
let selectedEquipmentIds = new Set();

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
  const snap = await getDoc(doc(db, "otRooms", otId));
  if (!snap.exists()) return;

  otRoomData = snap.data();
  selectedEquipmentIds = new Set(otRoomData.equipmentIds || []);

  otNameEl.textContent = otRoomData.name;
  otDepartmentEl.textContent = otRoomData.department || "—";
  statusBadgeEl.textContent = otRoomData.status;
  statusBadgeEl.className =
    `inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${statusClass(otRoomData.status)}`;

  equipmentCountEl.textContent = selectedEquipmentIds.size;
  lastUpdatedEl.textContent = formatDate(otRoomData.updatedAt || otRoomData.createdAt);

  await loadEquipmentGrid();
  await renderAssignedEquipment();
  await loadTimeline(otRoomData.name);
}

/* ================= EQUIPMENT GRID ================= */
async function loadEquipmentGrid() {
  equipmentGrid.innerHTML = "";

  const snap = await getDocs(
    query(collection(db, "equipment"), where("status", "==", "active"))
  );

  snap.forEach((docSnap) => {
    const eq = docSnap.data();
    const selected = selectedEquipmentIds.has(docSnap.id);

    const card = document.createElement("div");
    card.className = `
      border rounded-xl p-3 cursor-pointer transition
      ${selected ? "border-blue-500 bg-blue-50" : "hover:border-slate-300"}
    `;

    card.innerHTML = `
      <img src="${eq.imageUrl}" class="w-full h-28 object-contain mb-2" />
      <p class="text-sm font-semibold text-center">${eq.name}</p>
    `;

    card.onclick = () => {
      selected
        ? selectedEquipmentIds.delete(docSnap.id)
        : selectedEquipmentIds.add(docSnap.id);
      loadEquipmentGrid();
    };

    equipmentGrid.appendChild(card);
  });
}

/* ================= ASSIGNED EQUIPMENT ================= */
async function renderAssignedEquipment() {
  equipmentListEl.innerHTML = "";
  emptyEquipmentEl.classList.toggle("hidden", selectedEquipmentIds.size > 0);

  if (!selectedEquipmentIds.size) return;

  const snap = await getDocs(collection(db, "equipment"));
  snap.forEach((docSnap) => {
    if (selectedEquipmentIds.has(docSnap.id)) {
      const li = document.createElement("li");
      li.textContent = docSnap.data().name;
      equipmentListEl.appendChild(li);
    }
  });
}

/* ================= SAVE ================= */
saveEquipmentBtn.onclick = async () => {
  await updateDoc(doc(db, "otRooms", otId), {
    equipmentIds: Array.from(selectedEquipmentIds),
    updatedAt: serverTimestamp(),
  });

  alert("Equipment updated successfully");
  loadOtRoom();
};

/* ================= TIMELINE ================= */
async function loadTimeline(otName) {
  timelineList.innerHTML = "";
  timelineEmpty.classList.add("hidden");

  const snap = await getDocs(
    query(
      collection(db, "schedules"),
      where("otRoom", "==", otName),
      orderBy("startTime", "asc")
    )
  );

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

    timelineList.appendChild(card);
  });
}

/* ================= INIT ================= */
loadOtRoom();
