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

const steps = document.querySelectorAll(".form-section");
let currentStep = 0;

const scheduleDraft = {};

function showStep(i) {
  steps.forEach((s, idx) => (s.style.display = idx === i ? "block" : "none"));
  currentStep = i;
}
showStep(0);

// STEP 1
steps[0].querySelector("button").onclick = () => {
  const [name, id, dept, proc, notes] =
    steps[0].querySelectorAll("input,select,textarea");

  if (!name.value || !proc.value) {
    alert("Patient name & procedure required");
    return;
  }

  scheduleDraft.patientName = name.value;
  scheduleDraft.patientId = id.value;
  scheduleDraft.department = dept.value;
  scheduleDraft.procedure = proc.value;
  scheduleDraft.notes = notes.value;

  showStep(1);
};

// STEP 2
const [back2, next2] = steps[1].querySelectorAll("button");
back2.onclick = () => showStep(0);
next2.onclick = () => {
  const [date, ot, , start, end] =
    steps[1].querySelectorAll("input,select");

  if (!date.value || !ot.value || !start.value || !end.value) {
    alert("OT & time required");
    return;
  }

  scheduleDraft.date = date.value;
  scheduleDraft.otRoom = ot.value;
  scheduleDraft.startTime = start.value;
  scheduleDraft.endTime = end.value;

  showStep(2);
};

// STEP 3
const [back3, next3] = steps[2].querySelectorAll("button");
back3.onclick = () => showStep(1);
next3.onclick = () => {
  const [surgeon, anesth] = steps[2].querySelectorAll("select");
  if (!surgeon.value) {
    alert("Select surgeon");
    return;
  }

  scheduleDraft.surgeon = surgeon.value;
  scheduleDraft.anesthesiologist = anesth.value;

  steps[3].querySelector(".bg-slate-50").innerHTML = `
    <p><strong>Patient:</strong> ${scheduleDraft.patientName}</p>
    <p><strong>Procedure:</strong> ${scheduleDraft.procedure}</p>
    <p><strong>OT:</strong> ${scheduleDraft.otRoom}</p>
    <p><strong>Doctors:</strong> ${scheduleDraft.surgeon}</p>
  `;
  showStep(3);
};

// STEP 4
const [back4, confirm] = steps[3].querySelectorAll("button");
back4.onclick = () => showStep(2);

confirm.onclick = async () => {
  if (!auth.currentUser) {
    alert("Please login again.");
    return;
  }

  const start = new Date(`${scheduleDraft.date}T${scheduleDraft.startTime}`);
  const end = new Date(`${scheduleDraft.date}T${scheduleDraft.endTime}`);

  if (start >= end) {
    alert("Invalid time range");
    return;
  }

  // OT conflict
  const otQ = query(
    collection(db, "schedules"),
    where("otRoom", "==", scheduleDraft.otRoom)
  );
  const otSnap = await getDocs(otQ);

  for (const d of otSnap.docs) {
    const s = d.data();
    if (start < s.endTime.toDate() && end > s.startTime.toDate()) {
      alert("OT already booked");
      return;
    }
  }

  // Doctor conflict
  const docQ = query(
    collection(db, "schedules"),
    where("surgeon", "==", scheduleDraft.surgeon)
  );
  const docSnap = await getDocs(docQ);

  for (const d of docSnap.docs) {
    const s = d.data();
    if (start < s.endTime.toDate() && end > s.startTime.toDate()) {
      alert("Doctor busy");
      return;
    }
  }

  await addDoc(collection(db, "schedules"), {
    ...scheduleDraft,
    startTime: Timestamp.fromDate(start),
    endTime: Timestamp.fromDate(end),
    status: "Upcoming",
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  });

  alert("Schedule created");
  window.location.href = "/admin/schedule-board.html";
};
