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

/* PARAM */
const otId = new URLSearchParams(window.location.search).get("id");
if (!otId) location.href = "/admin/ot-rooms.html";

/* ELEMENTS */
const otNameEl = document.getElementById("otName");
const otDepartmentEl = document.getElementById("otDepartment");
const statusBadgeEl = document.getElementById("statusBadge");
const equipmentGrid = document.getElementById("equipmentGrid");
const equipmentCountEl = document.getElementById("equipmentCount");
const lastUpdatedEl = document.getElementById("lastUpdated");
const saveEquipmentBtn = document.getElementById("saveEquipmentBtn");
const timelineList = document.getElementById("timelineList");
const timelineEmpty = document.getElementById("timelineEmpty");

let selectedEquipment = new Set();
let otRoom;

/* HELPERS */
const statusStyle = s =>
  s === "available"
    ? "bg-emerald-100 text-emerald-700"
    : s === "in-use"
    ? "bg-blue-100 text-blue-700 pulse-blue"
    : "bg-amber-100 text-amber-700";

/* LOAD OT */
async function loadOt() {
  const snap = await getDoc(doc(db, "otRooms", otId));
  if (!snap.exists()) return;

  otRoom = snap.data();
  selectedEquipment = new Set(otRoom.equipmentIds || []);

  otNameEl.textContent = otRoom.name;
  otDepartmentEl.textContent = otRoom.department || "—";
  statusBadgeEl.textContent = otRoom.status;
  statusBadgeEl.className =
    `px-5 py-2 rounded-full text-sm font-semibold ${statusStyle(otRoom.status)}`;

  equipmentCountEl.textContent = selectedEquipment.size;
  lastUpdatedEl.textContent =
    otRoom.updatedAt?.toDate().toLocaleString() || "—";

  await renderEquipment();
  await renderTimeline();
}

/* EQUIPMENT GRID */
async function renderEquipment() {
  equipmentGrid.innerHTML = "";
  const snap = await getDocs(collection(db, "equipment"));

  snap.forEach(d => {
    const eq = d.data();
    const active = selectedEquipment.has(d.id);

    const card = document.createElement("div");
    card.className =
      `relative border rounded-xl p-3 cursor-pointer transition
       ${active ? "border-indigo-500 bg-indigo-50" : "hover:border-slate-300"}`;

    card.innerHTML = `
      <img src="${eq.imageUrl}"
           class="w-full h-28 object-contain mb-2"/>
      <p class="text-sm font-semibold text-center">${eq.name}</p>
    `;

    card.onclick = () => {
      active ? selectedEquipment.delete(d.id) : selectedEquipment.add(d.id);
      renderEquipment();
    };

    equipmentGrid.appendChild(card);
  });
}

/* SAVE */
saveEquipmentBtn.onclick = async () => {
  await updateDoc(doc(db, "otRooms", otId), {
    equipmentIds: [...selectedEquipment],
    updatedAt: serverTimestamp(),
  });
  alert("Equipment updated");
  loadOt();
};

/* TIMELINE */
async function renderTimeline() {
  timelineList.innerHTML = "";
  timelineEmpty.classList.add("hidden");

  const snap = await getDocs(
    query(
      collection(db, "schedules"),
      where("otRoomId", "==", otId),
      orderBy("startTime", "desc")
    )
  );

  if (snap.empty) {
    timelineEmpty.classList.remove("hidden");
    return;
  }

  snap.forEach(d => {
    const s = d.data();
    const card = document.createElement("div");
    card.className =
      "border-l-4 pl-4 py-3 rounded hover:bg-slate-50";

    card.innerHTML = `
      <p class="font-semibold">${s.procedure}</p>
      <p class="text-sm text-slate-600">
        ${s.patientName} • ${s.surgeonName || "—"}
      </p>
      <p class="text-xs text-slate-500">
        ${s.startTime.toDate().toLocaleString()}
      </p>
      <span class="text-xs font-semibold uppercase">${s.status}</span>
    `;

    timelineList.appendChild(card);
  });
}

/* INIT */
loadOt();
