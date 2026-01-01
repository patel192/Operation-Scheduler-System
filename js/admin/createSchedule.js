import { auth, db } from "../firebase.js";
import {
  collection,
  addDoc,
  Timestamp,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
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
const otStaffSelect = document.getElementById("otStaffSelect");
const surgeonSelect = document.getElementById("surgeonSelect");
const otRoomSelect = document.getElementById("otRoomSelect");
const startTimeInput = document.getElementById("startTimeInput");
const endTimeInput = document.getElementById("endTimeInput");

const equipmentGrid = document.getElementById("equipmentGrid");
const equipmentEmpty = document.getElementById("equipmentEmpty");

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

/* ================= STEP 1 ================= */
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

  await loadOtRooms(otRoomSelect, department);

  // reset equipment
  equipmentGrid.innerHTML = "";
  equipmentEmpty.classList.add("hidden");
  scheduleDraft.equipmentIds = [];

  showStep(1);
};

/* ================= LOAD EQUIPMENT FOR OT ================= */
otRoomSelect.onchange = async () => {
  equipmentGrid.innerHTML = "";
  equipmentEmpty.classList.add("hidden");
  scheduleDraft.equipmentIds = [];

  if (!otRoomSelect.value) return;

  const otSnap = await getDocs(
    query(collection(db, "otRooms"), where("name", "==", otRoomSelect.value))
  );

  if (otSnap.empty) return;

  const otRoom = otSnap.docs[0].data();
  const equipmentIds = otRoom.equipmentIds || [];

  if (!equipmentIds.length) {
    equipmentEmpty.classList.remove("hidden");
    return;
  }

  const eqSnap = await getDocs(collection(db, "equipment"));

  eqSnap.forEach((docSnap) => {
    if (!equipmentIds.includes(docSnap.id)) return;

    const eq = docSnap.data();

    const card = document.createElement("div");
    card.className =
      "border rounded-xl p-3 cursor-pointer transition hover:border-blue-400";

    card.innerHTML = `
      <div class="aspect-square bg-slate-50 rounded mb-2 flex items-center justify-center">
        <span class="text-xs text-slate-400">Image</span>
      </div>
      <p class="text-sm font-semibold text-center">${eq.name}</p>
    `;

    card.onclick = () => {
      if (scheduleDraft.equipmentIds.includes(docSnap.id)) {
        scheduleDraft.equipmentIds =
          scheduleDraft.equipmentIds.filter((id) => id !== docSnap.id);
        card.classList.remove("border-blue-500", "bg-blue-50");
      } else {
        scheduleDraft.equipmentIds.push(docSnap.id);
        card.classList.add("border-blue-500", "bg-blue-50");
      }
    };

    equipmentGrid.appendChild(card);
  });
};

/* ================= STEP 2 ================= */
const [back2, next2] = steps[1].querySelectorAll("button");

back2.onclick = () => showStep(0);

next2.onclick = () => {
  const dateInput = steps[1].querySelector('input[type="date"]');
  const staffIds = [...otStaffSelect.selectedOptions].map((o) => o.value);

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

/* ================= STEP 3 ================= */
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

/* ================= STEP 4 ================= */
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
