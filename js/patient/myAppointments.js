import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { autoUpdateScheduleStatus } from "../utils/autoUpdateScheduleStatus.js";

/* ================= ELEMENTS ================= */
const loadingEl = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");
const listEl = document.getElementById("appointmentsList");

/* ================= AUTH INIT ================= */
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.replace("/login.html");
    return;
  }

  try {
    await autoUpdateScheduleStatus();

    // Load user profile
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (!userSnap.exists()) {
      throw new Error("User profile not found");
    }

    const userData = userSnap.data();
    const patientName = userData.displayName;

    if (!patientName) {
      throw new Error("User name missing on account");
    }

    await loadAppointmentsByName(patientName);

  } catch (err) {
    console.error("❌ My Appointments Error:", err);
    loadingEl.innerHTML = `<p class="text-red-600">Failed to load appointments</p>`;
  }
});

/* ================= LOAD APPOINTMENTS ================= */
async function loadAppointmentsByName(patientName) {
  loadingEl.classList.add("hidden");
  listEl.classList.remove("hidden");

  const q = query(
    collection(db, "schedules"),
    where("patientName", "==", patientName),
    orderBy("startTime", "asc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    listEl.classList.add("hidden");
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
      "glass border border-[--border] rounded-2xl p-5 shadow-sm cursor-pointer hover:border-blue-500 transition";

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-bold text-lg">${s.procedure}</h3>
          <p class="text-sm text-slate-500 mt-1">
            ${start.toLocaleDateString()} •
            ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –
            ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p class="text-sm text-slate-500">
            OT: ${s.otRoomName} • Dr. ${s.surgeonName}
          </p>
        </div>

        <span class="px-3 py-1 text-xs rounded-full font-semibold ${statusClass(s.status)}">
          ${s.status}
        </span>
      </div>
    `;

    card.onclick = () => {
      window.location.href = `/patient/appointment-details.html?id=${id}`;
    };

    listEl.appendChild(card);
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
