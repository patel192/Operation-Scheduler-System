import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import {autoUpdateScheduleStatus} from "../utils/autoUpdateScheduleStatus.js"
// ------------------
// ELEMENTS
// ------------------
const listEl = document.getElementById("scheduleList");
const emptyState = document.getElementById("emptyState");
const filterDate = document.getElementById("filterDate");
const filterStatus = document.getElementById("filterStatus");

// ------------------
// HELPERS
// ------------------
function formatTime(ts) {
  return ts.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status) {
  if (status === "Completed")
    return "bg-green-100 text-green-700";
  if (status === "Ongoing")
    return "bg-yellow-100 text-yellow-700";
  return "bg-blue-100 text-blue-700";
}

// ------------------
// LOAD SCHEDULES
// ------------------
async function loadMySchedules() {
  listEl.innerHTML = "";
  emptyState.classList.add("hidden");

  const user = auth.currentUser;
  if (!user) return;

  let q = query(
    collection(db, "schedules"),
    where("surgeonId", "==", user.uid)
  );

  const snap = await getDocs(q);

  let schedules = snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }));

  // DATE FILTER
  if (filterDate.value) {
    schedules = schedules.filter(s => {
      const d = s.startTime.toDate().toISOString().slice(0, 10);
      return d === filterDate.value;
    });
  }

  // STATUS FILTER
  if (filterStatus.value) {
    schedules = schedules.filter(s => s.status === filterStatus.value);
  }

  if (!schedules.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  schedules.forEach(s => {
    const card = document.createElement("div");
    card.className =
      "bg-white rounded-xl shadow-sm border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4";

    card.innerHTML = `
      <div>
        <h3 class="font-semibold text-lg text-[--primary]">
          ${s.procedure}
        </h3>
        <p class="text-sm text-[--muted] mt-1">
          Patient: ${s.patientName} • ${s.otRoom}
        </p>
        <p class="text-sm text-[--muted]">
          ${formatTime(s.startTime)} – ${formatTime(s.endTime)}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <span class="px-3 py-1 text-xs rounded-full font-semibold ${statusBadge(
          s.status
        )}">
          ${s.status}
        </span>

        <a
          href="/doctor/schedule-details.html?id=${s.id}"
          class="text-sm font-semibold text-[--primary] hover:underline">
          View
        </a>
      </div>
    `;

    listEl.appendChild(card);
  });
}

// ------------------
// EVENTS
// ------------------
filterDate.addEventListener("change", loadMySchedules);
filterStatus.addEventListener("change", loadMySchedules);

// INITIAL LOAD
auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  // ✅ AUTO UPDATE STATUS (ONCE)
  await autoUpdateScheduleStatus();

  // ✅ THEN LOAD DOCTOR SCHEDULES
  await loadMySchedules();
});

