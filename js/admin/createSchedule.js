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

/* ===== STATE ===== */
const steps = document.querySelectorAll(".form-section");
const stepDots = document.querySelectorAll(".step-dot");
const scheduleDraft = {};

/* ===== ELEMENTS ===== */
const otStaffSelect = document.getElementById("otStaffSelect");
const surgeonSelect = document.getElementById("surgeonSelect");

/* ===== LOAD DROPDOWNS ===== */
await loadOtStaff(otStaffSelect);
await loadDoctors(surgeonSelect);

/* ===== STEP CONTROL ===== */
function showStep(i) {
  steps.forEach((s, idx) =>
    s.classList.toggle("hidden-step", idx !== i)
  );
  stepDots.forEach((d, idx) =>
    d.classList.toggle("active", idx === i)
  );
}
showStep(0);

/* ===== STEP 1 ===== */
steps[0].querySelector("button").onclick = () => {
  const patientId = document.getElementById("patientIdInput").value.trim();
  const patientName = document.getElementById("patientNameInput").value.trim();
  const department = document.getElementById("departmentSelect").value;
  const procedure = document.getElementById("procedureInput").value.trim();
  const notes = document.getElementById("notesInput").value.trim();

  if (!procedure) return alert("Procedure required");

  Object.assign(scheduleDraft, {
    patientId: patientId || `PAT-${Date.now()}`,
    patientName,
    department,
    procedure,
    notes,
  });

  showStep(1);
};

/* ===== STEP 2 ===== */
const [back2, next2] = steps[1].querySelectorAll("button");

back2.onclick = () => showStep(0);

next2.onclick = () => {
  const [date, otRoom, , startTime, endTime] =
    steps[1].querySelectorAll("input,select");

  const staffIds = [...otStaffSelect.selectedOptions].map(o => o.value);

  if (!date.value || !otRoom.value || !startTime.value || !endTime.value)
    return alert("Date, OT and time required");

  if (!staffIds.length)
    return alert("Select OT staff");

  Object.assign(scheduleDraft, {
    date: date.value,
    otRoom: otRoom.value,
    startTime: startTime.value,
    endTime: endTime.value,
    otStaffIds: staffIds,
  });

  showStep(2);
};

/* ===== STEP 3 ===== */
const [back3, next3] = steps[2].querySelectorAll("button");

back3.onclick = () => showStep(1);

next3.onclick = () => {
  if (!surgeonSelect.value) return alert("Select surgeon");

  scheduleDraft.surgeonId = surgeonSelect.value;
  scheduleDraft.surgeonName =
    surgeonSelect.options[surgeonSelect.selectedIndex].textContent;

  document.getElementById("rvPatient").textContent = scheduleDraft.patientName || "—";
  document.getElementById("rvPatientId").textContent = scheduleDraft.patientId;
  document.getElementById("rvProcedure").textContent = scheduleDraft.procedure;
  document.getElementById("rvOT").textContent = scheduleDraft.otRoom;
  document.getElementById("rvSurgeon").textContent = scheduleDraft.surgeonName;
  document.getElementById("rvStaff").textContent = scheduleDraft.otStaffIds.length;

  showStep(3);
};

/* ===== STEP 4 ===== */
const [back4, confirm] = steps[3].querySelectorAll("button");

back4.onclick = () => showStep(2);

confirm.onclick = async () => {
  try {
    const start = new Date(`${scheduleDraft.date}T${scheduleDraft.startTime}`);
    const end = new Date(`${scheduleDraft.date}T${scheduleDraft.endTime}`);

    if (start >= end) return alert("Invalid time range");

    await addDoc(collection(db, "schedules"), {
      ...scheduleDraft,
      startTime: Timestamp.fromDate(start),
      endTime: Timestamp.fromDate(end),
      status: "Upcoming",
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "users", scheduleDraft.surgeonId), {
      availability: "busy",
    });

    for (const id of scheduleDraft.otStaffIds) {
      await updateDoc(doc(db, "users", id), { availability: "busy" });
    }

    alert("Schedule created successfully");
    window.location.href = "/admin/schedule-board.html";

  } catch (err) {
    console.error(err);
    alert("Error creating schedule");
  }
};
