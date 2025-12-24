import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { autoUpdateScheduleStatus } from "../utils/autoUpdateScheduleStatus.js";
/* ================= ELEMENTS ================= */
const patientIdSection = document.getElementById("patientIdSection");
const appointmentsSection = document.getElementById("appointmentsSection");
const appointmentsList = document.getElementById("appointmentsList");
const emptyState = document.getElementById("emptyState");

const patientIdInput = document.getElementById("patientIdInput");
const loadBtn = document.getElementById("loadBtn");
const changeIdBtn = document.getElementById("changeIdBtn");

/* ================= INIT ================= */
const savedPatientId = localStorage.getItem("patientId");

if (savedPatientId) {
  patientIdInput.value = savedPatientId;

  (async () => {
    // ✅ sync statuses once
    await autoUpdateScheduleStatus();

    // ✅ then load appointments
    await loadAppointments(savedPatientId);
  })();
}

/* ================= EVENTS ================= */
loadBtn.onclick = async () => {
  const patientId = patientIdInput.value.trim();

  if (!patientId) {
    alert("Please enter Patient ID");
    return;
  }

  localStorage.setItem("patientId", patientId);

  // ✅ sync statuses once per load
  await autoUpdateScheduleStatus();

  loadAppointments(patientId);
};


changeIdBtn.onclick = () => {
  localStorage.removeItem("patientId");
  appointmentsSection.classList.add("hidden");
  patientIdSection.classList.remove("hidden");
};

/* ================= LOAD APPOINTMENTS ================= */
async function loadAppointments(patientId) {
  appointmentsList.innerHTML = "";
  emptyState.classList.add("hidden");

  patientIdSection.classList.add("hidden");
  appointmentsSection.classList.remove("hidden");

  const q = query(
    collection(db, "schedules"),
    where("patientId", "==", patientId),
    orderBy("startTime", "asc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    emptyState.classList.remove("hidden");
    return;
  }

  snap.forEach((docSnap) => {
    const s = docSnap.data();
    const id = docSnap.id;

    const start = s.startTime.toDate();
    const end = s.endTime.toDate();

    const card = document.createElement("div");
    card.className =
      "bg-white p-4 rounded-xl shadow border cursor-pointer hover:border-blue-400 transition";

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <p class="font-semibold">${s.procedure}</p>
          <p class="text-sm text-slate-500">
            ${start.toLocaleDateString()} •
            ${start.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            –
            ${end.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p class="text-sm text-slate-500">
            OT Room: ${s.otRoom} • Dr. ${s.surgeonName}
          </p>
        </div>

        <span class="px-3 py-1 text-xs rounded-full font-semibold
          ${statusClass(s.status)}">
          ${s.status}
        </span>
      </div>
    `;

    card.onclick = () => {
      window.location.href = `/patient/appointment-details.html?id=${id}`;
    };

    appointmentsList.appendChild(card);
  });
}

/* ================= STATUS BADGE ================= */
function statusClass(status) {
  switch (status) {
    case "Upcoming":
      return "bg-blue-100 text-blue-700";
    case "Ongoing":
      return "bg-yellow-100 text-yellow-700";
    case "Completed":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
