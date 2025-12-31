import { auth, db } from "../firebase.js";
import {
  collection,
  addDoc,
  Timestamp,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { syncAvailabilityForUser } from "../utils/syncAvailability.js";
import { loadOtStaff } from "./loadOtStaff.js";
import { loadDoctors } from "./loadDoctors.js";
import { loadOtRooms } from "./loadOtRooms.js";
import { loadDepartments } from "./loadDepartments.js";

/* ================= STATE ================= */
const steps = document.querySelectorAll(".form-section");
const stepDots = document.querySelectorAll(".step-dot");
const scheduleDraft = {};

/* ================= ELEMENTS ================= */
const departmentSelect = document.getElementById("departmentSelect");
const otStaffSelect = document.getElementById("otStaffSelect");
const surgeonSelect = document.getElementById("surgeonSelect");
const otRoomSelect = document.getElementById("otRoomSelect");
const startTimeInput = document.getElementById("startTimeInput");
const endTimeInput = document.getElementById("endTimeInput");

/* ================= LOAD DROPDOWNS ================= */
await loadDepartments(departmentSelect);
await loadOtStaff(otStaffSelect);
await loadDoctors(surgeonSelect);

/* ================= STEP CONTROL ================= */
function showStep(i) {
  steps.forEach((s, idx) =>
    s.classList.toggle("hidden-step", idx !== i)
  );
  stepDots.forEach((d, idx) =>
    d.classList.toggle("active", idx === i)
  );
}
showStep(0);

/* ================= STEP 1: PATIENT & PROCEDURE ================= */
steps[0].querySelector("button").onclick = async () => {
  const patientId = document.getElementById("patientIdInput").value.trim();
  const patientName = document.getElementById("patientNameInput").value.trim();
  const department = departmentSelect.value;
  const procedure = document.getElementById("procedureInput").value.trim();
  const notes = document.getElementById("notesInput").value.trim();

  if (!procedure) return alert("Procedure is required");
  if (!department) return alert("Select department");

  Object.assign(scheduleDraft, {
    patientId: patientId || `PAT-${Date.now()}`,
    patientName,
    department,
    procedure,
    notes,
  });

  // 🔥 Load OT rooms based on department
  await loadOtRooms(otRoomSelect, department);

  showStep(1);
};

/* ================= STEP 2: OT, DATE & STAFF ================= */
const [back2, next2] = steps[1].querySelectorAll("button");

back2.onclick = () => showStep(0);

next2.onclick = () => {
  const dateInput = steps[1].querySelector('input[type="date"]');
  const staffIds = [...otStaffSelect.selectedOptions].map(o => o.value);

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
    otRoom: otRoomSelect.value,
    startTime: startTimeInput.value,
    endTime: endTimeInput.value,
    otStaffIds: staffIds,
  });

  showStep(2);
};

/* ================= STEP 3: SURGEON ================= */
const [back3, next3] = steps[2].querySelectorAll("button");

back3.onclick = () => showStep(1);

next3.onclick = () => {
  if (!surgeonSelect.value) return alert("Select surgeon");

  scheduleDraft.surgeonId = surgeonSelect.value;
  scheduleDraft.surgeonName =
    surgeonSelect.options[surgeonSelect.selectedIndex].textContent;

  document.getElementById("rvPatient").textContent =
    scheduleDraft.patientName || "—";
  document.getElementById("rvPatientId").textContent =
    scheduleDraft.patientId;
  document.getElementById("rvProcedure").textContent =
    scheduleDraft.procedure;
  document.getElementById("rvOT").textContent =
    scheduleDraft.otRoom;
  document.getElementById("rvSurgeon").textContent =
    scheduleDraft.surgeonName;
  document.getElementById("rvStaff").textContent =
    scheduleDraft.otStaffIds.length;

  showStep(3);
};

/* ================= STEP 4: CONFIRM ================= */
const [back4, confirm] = steps[3].querySelectorAll("button");

back4.onclick = () => showStep(2);

confirm.onclick = async () => {
  try {
    const start = new Date(`${scheduleDraft.date}T${scheduleDraft.startTime}`);
    const end = new Date(`${scheduleDraft.date}T${scheduleDraft.endTime}`);

    if (isNaN(start) || isNaN(end)) {
      return alert("Invalid time selected");
    }

    if (start >= end) {
      return alert("End time must be after start time");
    }

    await addDoc(collection(db, "schedules"), {
      ...scheduleDraft,
      startTime: Timestamp.fromDate(start),
      endTime: Timestamp.fromDate(end),
      status: "Upcoming",
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });

    // 🔁 Availability sync
    await syncAvailabilityForUser(scheduleDraft.surgeonId, "Doctor");
    for (const staffId of scheduleDraft.otStaffIds) {
      await syncAvailabilityForUser(staffId, "OT Staff");
    }

    alert("Schedule created successfully");
    window.location.href = "/admin/schedule-board.html";
  } catch (err) {
    console.error("Create schedule error:", err);
    alert("Error creating schedule");
  }
};
