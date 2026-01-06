import { auth, db } from "../firebase.js";
import {
  collection,
  addDoc,
  Timestamp,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { syncAvailabilityForUser } from "../utils/syncAvailability.js";
import { loadOtStaff } from "./loadOtStaff.js";
import { loadDoctors } from "./loadDoctors.js";
import { loadOtRooms } from "./loadOtRooms.js";
import { loadDepartments } from "./loadDepartments.js";
import { createScheduleCreatedAlerts } from "../automation/createScheduleAlerts.js";
/* ================= STATE ================= */
const steps = document.querySelectorAll(".form-section");
const dots = document.querySelectorAll(".step-dot");

const state = {
  equipmentIds: [],
  otStaffIds: [],
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
const review = {
  patient: document.getElementById("rvPatient"),
  procedure: document.getElementById("rvProcedure"),
  ot: document.getElementById("rvOT"),
  surgeon: document.getElementById("rvSurgeon"),
};

// Helper Functions
function renderReview() {
  review.patient.textContent = `${state.patientName || "—"} (${
    state.patientId
  })`;

  review.procedure.textContent = `${state.procedure} — ${state.department}`;

  review.ot.textContent = `${state.otRoomName} | ${state.date} ${state.startTime}–${state.endTime}`;

  review.surgeon.textContent = state.surgeonName || "—";
}

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
  state.patientName = document.getElementById("patientNameInput").value;
  state.procedure = document.getElementById("procedureInput").value;
  state.notes = document.getElementById("notesInput").value;
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
  card.className = "eq-card";
  card.innerHTML = `
    <p class="text-sm font-semibold">${eq.name}</p>
    <p class="text-xs text-slate-500 mt-1">
      ${
        borrowed
          ? `From ${eq.currentOtRoomName || "Other OT"}`
          : eq.category || ""
      }
    </p>
  `;

  card.onclick = () => {
    if (state.equipmentIds.includes(id)) {
      state.equipmentIds = state.equipmentIds.filter((e) => e !== id);
      card.classList.remove("selected");
    } else {
      state.equipmentIds.push(id);
      card.classList.add("selected");
    }
  };

  el.equipmentGrid.appendChild(card);
}

el.otRoom.onchange = async () => {
  el.equipmentGrid.innerHTML = "";
  state.equipmentIds = [];

  const otRoomId = el.otRoom.selectedOptions[0]?.dataset.id;
  if (!otRoomId) return;

  const otSnap = await getDocs(
    query(collection(db, "otRooms"), where("__name__", "==", otRoomId))
  );

  if (otSnap.empty) return;

  const eqIds = otSnap.docs[0].data().equipmentIds || [];
  const eqSnap = await getDocs(collection(db, "equipment"));

  eqSnap.forEach((d) => {
    if (eqIds.includes(d.id) && d.data().currentScheduleId === null) {
      renderEquipment(d);
    }
  });
};

el.loadExternalEq.onclick = async () => {
  const snap = await getDocs(
    query(
      collection(db, "equipment"),
      where("status", "==", "active"),
      where("currentScheduleId", "==", null)
    )
  );

  snap.forEach((d) => {
    if (!state.equipmentIds.includes(d.id)) {
      renderEquipment(d, true);
    }
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
  state.otStaffIds = [...el.staff.selectedOptions].map((o) => o.value);

  if (!state.date || !state.startTime || !state.endTime)
    return alert("Date & time required");

  showStep(2);
};

el.step3Back.onclick = () => showStep(1);

el.step3Next.onclick = () => {
  state.surgeonId = el.surgeon.value;
  state.surgeonName = el.surgeon.selectedOptions[0]?.textContent;
  renderReview();
  showStep(3);
};

el.step4Back.onclick = () => showStep(2);

/* ================= CONFIRM ================= */
el.confirm.onclick = async () => {
  const start = new Date(`${state.date}T${state.startTime}`);
  const end = new Date(`${state.date}T${state.endTime}`);
  const now = new Date();

  let status;
  if (now < start) status = "Upcoming";
  else if (now >= start && now < end) status = "Ongoing";
  else status = "Completed";

  const ref = await addDoc(collection(db, "schedules"), {
    patientId: state.patientId,
    patientName: state.patientName,
    department: state.department,
    procedure: state.procedure,
    notes: state.notes,

    otRoomId: state.otRoomId,
    otRoomName: state.otRoomName,

    otStaffIds: state.otStaffIds,
    equipmentIds: state.equipmentIds,

    surgeonId: state.surgeonId,
    surgeonName: state.surgeonName,

    startTime: Timestamp.fromDate(start),
    endTime: Timestamp.fromDate(end),
    status,

    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  });

  const scheduleId = ref.id;
  await createScheduleCreatedAlerts({
    id: scheduleId,
    patientName: state.patientName,
    procedure: state.procedure,
    otRoomName: state.otRoomName,
    surgeonId: state.surgeonId,
    otStaffIds: state.otStaffIds,
  });
  /* 🔒 LOCK RESOURCES IF ONGOING */
  if (status === "Ongoing") {
    await updateDoc(doc(db, "otRooms", state.otRoomId), {
      status: "in-use",
      activeScheduleId: scheduleId,
      activeScheduleTime: {
        start: Timestamp.fromDate(start),
        end: Timestamp.fromDate(end),
      },
    });

    for (const eqId of state.equipmentIds) {
      await updateDoc(doc(db, "equipment", eqId), {
        status: "in-use",
        currentScheduleId: scheduleId,
        currentOtRoomId: state.otRoomId,
        currentOtRoomName: state.otRoomName,
        lastUsedAt: serverTimestamp(),
      });
    }
  }

  /* 🔄 SYNC AVAILABILITY */
  await syncAvailabilityForUser(state.surgeonId, "Doctor");
  for (const id of state.otStaffIds) {
    await syncAvailabilityForUser(id, "OT Staff");
  }

  window.location.href = "/admin/schedule-board.html";
};
