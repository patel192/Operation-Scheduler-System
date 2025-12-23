import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const scheduleList = document.getElementById("scheduleList");
const emptyState = document.getElementById("emptyState");
const filterDate = document.getElementById("filterDate");
const filterStatus = document.getElementById("filterStatus");

function formatTime(ts) {
  return ts.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(ts) {
  return ts.toDate().toLocaleDateString();
}

function statusClass(status) {
  if (status === "Completed") return "bg-green-100 text-green-700";
  if (status === "Ongoing") return "bg-yellow-100 text-yellow-700";
  return "bg-blue-100 text-blue-700";
}

async function loadSchedules() {
  if (!auth.currentUser) return;

  scheduleList.innerHTML = "";
  emptyState.classList.add("hidden");

  const q = query(
    collection(db, "schedules"),
    where("surgeonId", "==", auth.currentUser.uid)
  );

  const snapshot = await getDocs(q);
  let hasData = false;

  snapshot.forEach((docSnap) => {
    const s = docSnap.data();

    // STATUS FILTER
    if (filterStatus.value && s.status !== filterStatus.value) return;

    // DATE FILTER
    if (filterDate.value) {
      const selected = new Date(filterDate.value).toDateString();
      const scheduleDate = s.startTime.toDate().toDateString();
      if (selected !== scheduleDate) return;
    }

    hasData = true;

    const card = document.createElement("div");
    card.className =
      "bg-white rounded-xl shadow p-5 border-l-4 border-blue-500 cursor-pointer hover:shadow-md transition";

    card.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 class="font-semibold text-lg">${s.procedure}</h3>
          <p class="text-sm text-slate-500 mt-1">
            Patient: ${s.patientName} • ${s.otRoom}
          </p>
          <p class="text-sm text-slate-500">
            ${formatDate(s.startTime)} • ${formatTime(s.startTime)} – ${formatTime(s.endTime)}
          </p>
        </div>

        <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusClass(s.status)}">
          ${s.status}
        </span>
      </div>
    `;

    card.onclick = () => {
      window.location.href = `/doctor/schedule-details.html?id=${docSnap.id}`;
    };

    scheduleList.appendChild(card);
  });

  if (!hasData) {
    emptyState.classList.remove("hidden");
  }
}

// FILTER EVENTS
filterDate.addEventListener("change", loadSchedules);
filterStatus.addEventListener("change", loadSchedules);

// INITIAL LOAD
auth.onAuthStateChanged((user) => {
  if (user) loadSchedules();
});
