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

/* ================= STATE ================= */
const steps = document.querySelectorAll(".form-section");
const stepDots = document.querySelectorAll(".step-dot");

const scheduleDraft = {
  equipmentIds: [],
};

/* ================= ELEMENTS ================= */
const departmentSelect = document.getElementById("departmentSelect");
const otRoomSelect = document.getElementById("otRoomSelect");
const otStaffSelect = document.getElementById("otStaffSelect");
const surgeonSelect = document.getElementById("surgeonSelect");
const startTimeInput = document.getElementById("startTimeInput");
const endTimeInput = document.getElementById("endTimeInput");
const equipmentGrid = document.getElementById("equipmentGrid");

/* ================= INIT DROPDOWNS ================= */
await loadDepartments(departmentSelect);
await loadOtStaff(otStaffSelect);
await loadDoctors(surgeonSelect);

/* ================= STEPPER ================= */
function showStep(i) {
  steps.forEach((s, idx) => s.classList.toggle("hidden-step", idx !== i));
  stepDots.forEach((d, idx) => d.classList.toggle("active", idx === i));
}
showStep(0);

/* ======================================================
   STEP 1 — PATIENT & PROCEDURE
====================================================== */
steps[0].querySelector("button").onclick = async () => {
  const patientId =
    document.getElementById("patientIdInput").value.trim() ||
    `PAT-${Date.now()}`;

  const patientName = document.getElementById("patientNameInput").value.trim();

  const procedure = document.getElementById("procedureInput").value.trim();

  const notes = document.getElementById("notesInput").value.trim();

  const department = departmentSelect.value;

  if (!department) return alert("Select department");
  if (!procedure) return alert("Procedure is required");

  Object.assign(scheduleDraft, {
    patientId,
    patientName,
    department,
    procedure,
    notes,
  });

  // Load OT rooms by department
  await loadOtRooms(otRoomSelect, department);

  // Reset equipment
  equipmentGrid.innerHTML = "";
  scheduleDraft.equipmentIds = [];

  showStep(1);
};

/* ======================================================
   LOAD EQUIPMENT WHEN OT ROOM SELECTED
====================================================== */
otRoomSelect.onchange = async () => {
  equipmentGrid.innerHTML = "";
  scheduleDraft.equipmentIds = [];

  if (!otRoomSelect.value) return;

  const otSnap = await getDocs(
    query(collection(db, "otRooms"), where("name", "==", otRoomSelect.value))
  );

  if (otSnap.empty) return;

  const otRoom = otSnap.docs[0].data();
  const equipmentIds = otRoom.equipmentIds || [];

  if (!equipmentIds.length) {
    equipmentGrid.innerHTML = `<p class="text-xs text-slate-400">No equipment assigned to this OT Room</p>`;
    return;
  }

  const eqSnap = await getDocs(collection(db, "equipment"));

  eqSnap.forEach((docSnap) => {
    if (!equipmentIds.includes(docSnap.id)) return;

    const eq = docSnap.data();
    const selected = scheduleDraft.equipmentIds.includes(docSnap.id);

    const card = document.createElement("div");
    card.className = `
      border rounded-xl p-3 cursor-pointer transition
      ${selected ? "border-blue-500 bg-blue-50" : "hover:border-slate-300"}
    `;

    card.innerHTML = `
      <div class="aspect-square bg-slate-100 rounded mb-2 flex items-center justify-center text-xs text-slate-400">
        Equipment
      </div>
      <p class="text-sm font-semibold text-center">${eq.name}</p>
    `;

    card.onclick = () => {
      const id = docSnap.id;

      if (scheduleDraft.equipmentIds.includes(id)) {
        scheduleDraft.equipmentIds = scheduleDraft.equipmentIds.filter(
          (eid) => eid !== id
        );

        card.classList.remove("border-blue-500", "bg-blue-50");
      } else {
        scheduleDraft.equipmentIds.push(id);

        card.classList.add("border-blue-500", "bg-blue-50");
      }
    };

    equipmentGrid.appendChild(card);
  });
};

/* ======================================================
   STEP 2 — OT, DATE, STAFF, TIME
====================================================== */
const [back2, next2] = steps[1].querySelectorAll("button");

back2.onclick = () => showStep(0);

next2.onclick = () => {
  const dateInput = steps[1].querySelector('input[type="date"]');
  const staffIds = [...otStaffSelect.selectedOptions].map((o) => o.value);
  const selectedOption = otRoomSelect.selectedOptions[0];

  if (
    !dateInput.value ||
    !otRoomSelect.value ||
    !startTimeInput.value ||
    !endTimeInput.value
  ) {
    return alert("Date, OT room and time are required");
  }

  if (!staffIds.length) {
    return alert("Select at least one OT staff");
  }

  Object.assign(scheduleDraft, {
    date: dateInput.value,
    otRoomId: selectedOption.dataset.id,
    otRoomName: selectedOption.value,
    startTime: startTimeInput.value,
    endTime: endTimeInput.value,
    otStaffIds: staffIds,
  });

  showStep(2);
};

/* ======================================================
   STEP 3 — SURGEON
====================================================== */
const [back3, next3] = steps[2].querySelectorAll("button");

back3.onclick = () => showStep(1);

next3.onclick = () => {
  if (!surgeonSelect.value) return alert("Select surgeon");

  scheduleDraft.surgeonId = surgeonSelect.value;
  scheduleDraft.surgeonName =
    surgeonSelect.options[surgeonSelect.selectedIndex].textContent;

  document.getElementById("rvPatient").textContent =
    scheduleDraft.patientName || "—";
  document.getElementById("rvPatientId").textContent = scheduleDraft.patientId;
  document.getElementById("rvProcedure").textContent = scheduleDraft.procedure;
  document.getElementById("rvOT").textContent = scheduleDraft.otRoomName;
  document.getElementById("rvSurgeon").textContent = scheduleDraft.surgeonName;
  document.getElementById("rvStaff").textContent =
    scheduleDraft.otStaffIds.length;

  showStep(3);
};

/* ======================================================
   STEP 4 — CONFIRM & CREATE
====================================================== */
const [back4, confirm] = steps[3].querySelectorAll("button");

back4.onclick = () => showStep(2);

confirm.onclick = async () => {
  try {
    const start = new Date(`${scheduleDraft.date}T${scheduleDraft.startTime}`);
    const end = new Date(`${scheduleDraft.date}T${scheduleDraft.endTime}`);
    const now = new Date();

    if (start >= end) return alert("Invalid time range");

    // ✅ compute initial status
    let initialStatus = "Upcoming";
    if (now >= start && now < end) initialStatus = "Ongoing";
    if (now >= end) initialStatus = "Completed";

    const docRef = await addDoc(collection(db, "schedules"), {
      patientId: scheduleDraft.patientId,
      patientName: scheduleDraft.patientName,
      department: scheduleDraft.department,
      procedure: scheduleDraft.procedure,
      notes: scheduleDraft.notes,

      otRoomId: scheduleDraft.otRoomId,
      otRoomName: scheduleDraft.otRoomName,
      otStaffIds: scheduleDraft.otStaffIds,
      equipmentIds: scheduleDraft.equipmentIds,

      surgeonId: scheduleDraft.surgeonId,
      surgeonName: scheduleDraft.surgeonName,

      startTime: Timestamp.fromDate(start),
      endTime: Timestamp.fromDate(end),
      status: initialStatus,
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });

    /* ======================================================
       🔒 LOCK RESOURCES IF ONGOING
    ====================================================== */
    if (initialStatus === "Ongoing") {
      for (const eqId of scheduleDraft.equipmentIds) {
        await updateDoc(doc(db, "equipment", eqId), {
          status: "in-use",
          currentScheduleId: docRef.id,
          currentOtRoomId: scheduleDraft.otRoomId,
          currentOtRoomName: scheduleDraft.otRoomName,
          lastUsedAt: serverTimestamp(),
        });
      }

      await updateDoc(doc(db, "otRooms", scheduleDraft.otRoomId), {
        status: "in-use",
        activeScheduleId: docRef.id,
      });
    }

    /* ======================================================
       ✅ ADD THIS BLOCK (CRITICAL FIX)
    ====================================================== */
    await syncAvailabilityForUser(scheduleDraft.surgeonId, "Doctor");

    for (const staffId of scheduleDraft.otStaffIds) {
      await syncAvailabilityForUser(staffId, "OT Staff");
    }

    alert("Schedule created successfully");
    window.location.href = "/admin/schedule-board.html";
  } catch (err) {
    console.error(err);
    alert("Error creating schedule");
  }
};

