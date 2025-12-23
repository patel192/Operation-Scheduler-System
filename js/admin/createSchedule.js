import { auth, db } from "../firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { loadOtStaff } from "./loadOtStaff.js";
import { loadDoctors } from "./loadDoctors.js";

/* ---------- STATE ---------- */
const steps = document.querySelectorAll(".form-section");
let currentStep = 0;
const scheduleDraft = {};

/* ---------- ELEMENTS ---------- */
const otStaffSelect = document.getElementById("otStaffSelect");
const surgeonSelect = document.getElementById("surgeonSelect");

/* ---------- LOAD DROPDOWNS ---------- */
await loadOtStaff(otStaffSelect);
await loadDoctors(surgeonSelect);

/* ---------- STEP CONTROL ---------- */
function showStep(i) {
  steps.forEach((s, idx) => (s.style.display = idx === i ? "block" : "none"));
  currentStep = i;
}
showStep(0);

/* ---------- STEP 1 ---------- */
steps[0].querySelector("button").onclick = () => {
  const [name, id, dept, proc, notes] =
    steps[0].querySelectorAll("input,select,textarea");

  if (!name.value || !proc.value) {
    alert("Patient name & procedure required");
    return;
  }

  Object.assign(scheduleDraft, {
    patientName: name.value,
    patientId: id.value,
    department: dept.value,
    procedure: proc.value,
    notes: notes.value,
  });

  showStep(1);
};

/* ---------- STEP 2 ---------- */
const [back2, next2] = steps[1].querySelectorAll("button");
back2.onclick = () => showStep(0);

next2.onclick = () => {
  const [date, otRoom, , start, end] =
    steps[1].querySelectorAll("input,select");

  const staffIds = Array.from(otStaffSelect.selectedOptions).map(o => o.value);

  if (!date.value || !otRoom.value || !start.value || !end.value) {
    alert("OT & time required");
    return;
  }

  if (!staffIds.length) {
    alert("Select at least one OT staff");
    return;
  }

  Object.assign(scheduleDraft, {
    date: date.value,
    otRoom: otRoom.value,
    startTime: start.value,
    endTime: end.value,
    otStaffIds: staffIds,
  });

  showStep(2);
};

/* ---------- STEP 3 ---------- */
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

  steps[3].querySelector(".bg-slate-100").innerHTML = `
    <p><strong>Patient:</strong> ${scheduleDraft.patientName}</p>
    <p><strong>Procedure:</strong> ${scheduleDraft.procedure}</p>
    <p><strong>OT:</strong> ${scheduleDraft.otRoom}</p>
    <p><strong>Surgeon:</strong> ${scheduleDraft.surgeonName}</p>
    <p><strong>OT Staff:</strong> ${scheduleDraft.otStaffIds.length}</p>
  `;

  showStep(3);
};

/* ---------- STEP 4 ---------- */
const [back4, confirm] = steps[3].querySelectorAll("button");
back4.onclick = () => showStep(2);

confirm.onclick = async () => {
  if (!auth.currentUser) {
    alert("Please login again");
    return;
  }

  const start = new Date(`${scheduleDraft.date}T${scheduleDraft.startTime}`);
  const end = new Date(`${scheduleDraft.date}T${scheduleDraft.endTime}`);

  if (start >= end) {
    alert("Invalid time range");
    return;
  }

  await addDoc(collection(db, "schedules"), {
    ...scheduleDraft,
    startTime: Timestamp.fromDate(start),
    endTime: Timestamp.fromDate(end),
    status: "Upcoming",
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  });

  alert("Schedule created successfully");
  window.location.href = "/admin/schedule-board.html";
};
