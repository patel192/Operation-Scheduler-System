import { auth, db } from "../firebase.js";
import {
  collection,
  addDoc,
  Timestamp,
  serverTimestamp,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { loadOtStaff } from "./loadOtStaff.js";
import { loadDoctors } from "./loadDoctors.js";

/* ================= PATIENT ID GENERATOR ================= */
function generatePatientId() {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `PAT-${year}-${timestamp}`;
}

/* ================= STATE ================= */
const steps = document.querySelectorAll(".form-section");
const scheduleDraft = {};

/* ================= ELEMENTS ================= */
const otStaffSelect = document.getElementById("otStaffSelect");
const surgeonSelect = document.getElementById("surgeonSelect");

/* ================= LOAD DROPDOWNS ================= */
await loadOtStaff(otStaffSelect);
await loadDoctors(surgeonSelect);

/* ================= STEP CONTROL ================= */
function showStep(i) {
  steps.forEach((s, idx) => (s.style.display = idx === i ? "block" : "none"));
}
showStep(0);

/* ================= STEP 1 ================= */
steps[0].querySelector("button").onclick = () => {
  const patientIdInput = document.getElementById("patientIdInput");
  const patientNameInput = document.getElementById("patientNameInput");
  const departmentSelect = document.getElementById("departmentSelect");
  const procedureInput = document.getElementById("procedureInput");
  const notesInput = document.getElementById("notesInput");

  if (!procedureInput.value.trim()) {
    alert("Procedure is required");
    return;
  }

  scheduleDraft.patientName = patientNameInput.value.trim();
  scheduleDraft.patientId = patientIdInput.value.trim() || null;
  scheduleDraft.department = departmentSelect.value;
  scheduleDraft.procedure = procedureInput.value.trim();
  scheduleDraft.notes = notesInput.value.trim();

  showStep(1);
};

/* ================= STEP 2 ================= */
const [back2, next2] = steps[1].querySelectorAll("button");
back2.onclick = () => showStep(0);

next2.onclick = () => {
  const [date, otRoom, , startTime, endTime] =
    steps[1].querySelectorAll("input,select");

  const staffIds = Array.from(otStaffSelect.selectedOptions).map(o => o.value);

  if (!date.value || !otRoom.value || !startTime.value || !endTime.value) {
    alert("OT room, date and time are required");
    return;
  }

  if (!staffIds.length) {
    alert("Select at least one OT staff");
    return;
  }

  Object.assign(scheduleDraft, {
    date: date.value,
    otRoom: otRoom.value,
    startTime: startTime.value,
    endTime: endTime.value,
    otStaffIds: staffIds,
  });

  showStep(2);
};

/* ================= STEP 3 ================= */
const [back3, next3] = steps[2].querySelectorAll("button");
back3.onclick = () => showStep(1);

next3.onclick = () => {
  if (!surgeonSelect.value) {
    alert("Select surgeon");
    return;
  }

  scheduleDraft.surgeonId = surgeonSelect.value;
  scheduleDraft.surgeonName =
    surgeonSelect.options[surgeonSelect.selectedIndex].textContent;

  if (!scheduleDraft.patientId) {
    scheduleDraft.patientId = generatePatientId();
  }

  steps[3].querySelector(".bg-slate-100").innerHTML = `
    <p><strong>Patient Name:</strong> ${scheduleDraft.patientName}</p>
    <p><strong>Patient ID:</strong> ${scheduleDraft.patientId}</p>
    <p><strong>Procedure:</strong> ${scheduleDraft.procedure}</p>
    <p><strong>OT Room:</strong> ${scheduleDraft.otRoom}</p>
    <p><strong>Surgeon:</strong> ${scheduleDraft.surgeonName}</p>
    <p><strong>OT Staff Count:</strong> ${scheduleDraft.otStaffIds.length}</p>
  `;

  showStep(3);
};

/* ================= STEP 4 ================= */
const [back4, confirm] = steps[3].querySelectorAll("button");
back4.onclick = () => showStep(2);

confirm.onclick = async () => {
  try {
    const start = new Date(`${scheduleDraft.date}T${scheduleDraft.startTime}`);
    const end = new Date(`${scheduleDraft.date}T${scheduleDraft.endTime}`);

    if (start >= end) {
      alert("Invalid time range");
      return;
    }

    /* ✅ CREATE SCHEDULE */
    await addDoc(collection(db, "schedules"), {
      ...scheduleDraft,
      startTime: Timestamp.fromDate(start),
      endTime: Timestamp.fromDate(end),
      status: "Upcoming",
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });

    /* 🔒 MARK DOCTOR AS BUSY */
    await updateDoc(doc(db, "users", scheduleDraft.surgeonId), {
      availability: "busy",
    });

    /* 🔒 MARK OT STAFF AS BUSY */
    for (const staffId of scheduleDraft.otStaffIds) {
      await updateDoc(doc(db, "users", staffId), {
        availability: "busy",
      });
    }

    alert("Schedule created successfully");
    window.location.href = "/admin/schedule-board.html";

  } catch (err) {
    console.error("Schedule creation failed:", err);
    alert("Error creating schedule");
  }
};
