import { auth, db } from "../firebase.js";
import {
  collection, addDoc, Timestamp, serverTimestamp,
  getDocs, doc, updateDoc, query, where
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { syncAvailabilityForUser } from "../utils/syncAvailability.js";
import { loadOtStaff } from "./loadOtStaff.js";
import { loadDoctors } from "./loadDoctors.js";
import { loadOtRooms } from "./loadOtRooms.js";
import { loadDepartments } from "./loadDepartments.js";

/* ================= STATE ================= */
const steps = document.querySelectorAll(".form-section");
const dots = document.querySelectorAll(".step-dot");

const state = {
  equipmentIds: [],
};

/* ================= ELEMENTS ================= */
const el = {
  step1Next: document.getElementById("step1NextBtn"),
  step2Back: document.getElementById("step2BackBtn"),
  step2Next: document.getElementById("step2NextBtn"),
  step3Back: document.getElementById("step3BackBtn"),
  step3Next: document.getElementById("step3NextBtn"),
  step4Back: document.getElementById("step4BackBtn"),
  confirm: document.getElementById("confirmScheduleBtn"),

  department: document.getElementById("departmentSelect"),
  otRoom: document.getElementById("otRoomSelect"),
  equipmentGrid: document.getElementById("equipmentGrid"),
  loadExternalEq: document.getElementById("loadExternalEquipmentBtn"),

  date: document.getElementById("scheduleDateInput"),
  start: document.getElementById("startTimeInput"),
  end: document.getElementById("endTimeInput"),

  staff: document.getElementById("otStaffSelect"),
  surgeon: document.getElementById("surgeonSelect"),
};

/* ================= INIT ================= */
await loadDepartments(el.department);
await loadOtStaff(el.staff);
await loadDoctors(el.surgeon);

function showStep(i) {
  steps.forEach((s, idx) => s.classList.toggle("hidden-step", idx !== i));
  dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
}
showStep(0);

/* ================= STEP 1 ================= */
el.step1Next.onclick = async () => {
  state.patientId =
    document.getElementById("patientIdInput").value || `PAT-${Date.now()}`;
  state.patientName =
    document.getElementById("patientNameInput").value;
  state.procedure =
    document.getElementById("procedureInput").value;
  state.notes =
    document.getElementById("notesInput").value;
  state.department = el.department.value;

  if (!state.department || !state.procedure)
    return alert("Department & procedure required");

  await loadOtRooms(el.otRoom, state.department);
  state.equipmentIds = [];
  el.equipmentGrid.innerHTML = "";

  showStep(1);
};

/* ================= EQUIPMENT ================= */
function renderEquipment(docSnap, borrowed = false) {
  const eq = docSnap.data();
  const id = docSnap.id;

  const card = document.createElement("div");
  card.className = "border rounded-xl p-3 cursor-pointer";
  card.innerHTML = `
    <p class="text-sm font-semibold text-center">${eq.name}</p>
    ${borrowed ? `<p class="text-xs text-center">From ${eq.currentOtRoomName}</p>` : ""}
  `;

  card.onclick = () => {
    if (state.equipmentIds.includes(id)) {
      state.equipmentIds = state.equipmentIds.filter(e => e !== id);
      card.classList.remove("bg-blue-50");
    } else {
      state.equipmentIds.push(id);
      card.classList.add("bg-blue-50");
    }
  };

  el.equipmentGrid.appendChild(card);
}

el.otRoom.onchange = async () => {
  el.equipmentGrid.innerHTML = "";
  state.equipmentIds = [];

  const otSnap = await getDocs(
    query(collection(db, "otRooms"), where("name", "==", el.otRoom.value))
  );
  if (otSnap.empty) return;

  const eqIds = otSnap.docs[0].data().equipmentIds || [];
  const eqSnap = await getDocs(collection(db, "equipment"));

  eqSnap.forEach(d => {
    if (eqIds.includes(d.id)) renderEquipment(d);
  });
};

el.loadExternalEq.onclick = async () => {
  const snap = await getDocs(
    query(collection(db, "equipment"), where("status", "==", "active"))
  );
  snap.forEach(d => {
    if (!state.equipmentIds.includes(d.id))
      renderEquipment(d, true);
  });
};

/* ================= STEP NAV ================= */
el.step2Back.onclick = () => showStep(0);
el.step2Next.onclick = () => {
  state.date = el.date.value;
  state.startTime = el.start.value;
  state.endTime = el.end.value;
  state.otRoomName = el.otRoom.value;
  state.otRoomId = el.otRoom.selectedOptions[0]?.dataset.id;
  state.staffIds = [...el.staff.selectedOptions].map(o => o.value);

  if (!state.date || !state.startTime || !state.endTime)
    return alert("Date & time required");

  showStep(2);
};

el.step3Back.onclick = () => showStep(1);
el.step3Next.onclick = () => {
  state.surgeonId = el.surgeon.value;
  state.surgeonName =
    el.surgeon.selectedOptions[0]?.textContent;

  document.getElementById("rvPatient").textContent = state.patientName;
  document.getElementById("rvProcedure").textContent = state.procedure;
  document.getElementById("rvOT").textContent = state.otRoomName;
  document.getElementById("rvSurgeon").textContent = state.surgeonName;

  showStep(3);
};

el.step4Back.onclick = () => showStep(2);

/* ================= CONFIRM ================= */
el.confirm.onclick = async () => {
  const start = new Date(`${state.date}T${state.startTime}`);
  const end = new Date(`${state.date}T${state.endTime}`);
  const now = new Date();

  let status = "Upcoming";
  if (now >= start && now < end) status = "Ongoing";
  if (now >= end) status = "Completed";

  const ref = await addDoc(collection(db, "schedules"), {
    ...state,
    startTime: Timestamp.fromDate(start),
    endTime: Timestamp.fromDate(end),
    status,
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  });

  await syncAvailabilityForUser(state.surgeonId, "Doctor");
  for (const id of state.staffIds || []) {
    await syncAvailabilityForUser(id, "OT Staff");
  }

  window.location.href = "/admin/schedule-board.html";
};
