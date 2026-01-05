import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const grid = document.getElementById("patientGrid");
const priorityLane = document.getElementById("priorityLane");
const todayStrip = document.getElementById("todayStrip");
const emptyState = document.getElementById("emptyState");

let patients = [];
let filterStatus = "all";

/* HELPERS */
const avatar = id => `https://picsum.photos/seed/${id}/120`;

function statusBadge(s) {
  return s === "Ongoing"
    ? "bg-red-100 text-red-700"
    : s === "Scheduled"
    ? "bg-blue-100 text-blue-700"
    : "bg-green-100 text-green-700";
}

function relativeTime(ts) {
  const diff = ts.toMillis() - Date.now();
  const min = Math.round(diff / 60000);
  if (min < 0) return `Started ${Math.abs(min)} min ago`;
  return `Starts in ${min} min`;
}

/* LOAD */
async function loadPatients() {
  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDocs(
    query(
      collection(db, "schedules"),
      where("surgeonId", "==", user.uid)
    )
  );

  const map = new Map();

  snap.docs.forEach(d => {
    const s = d.data();
    if (!map.has(s.patientId)) {
      map.set(s.patientId, {
        patientId: s.patientId,
        patientName: s.patientName,
        department: s.department,
        schedules: [],
      });
    }
    map.get(s.patientId).schedules.push(s);
  });

  patients = [...map.values()];
  render();
}

/* RENDER */
function render() {
  grid.innerHTML = "";
  priorityLane.innerHTML = "";
  todayStrip.innerHTML = "";

  if (!patients.length) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  const now = Date.now();

  /* TODAY STRIP */
  const today = patients.flatMap(p => p.schedules)
    .filter(s => new Date(s.startTime.toMillis()).toDateString() === new Date().toDateString());

  todayStrip.innerHTML = `
    <div class="bg-white rounded-2xl p-4 shadow border">
      <p class="text-xs text-[--muted]">Today</p>
      <p class="text-2xl font-bold">${today.length}</p>
    </div>
    <div class="bg-white rounded-2xl p-4 shadow border">
      <p class="text-xs text-[--muted]">Ongoing</p>
      <p class="text-2xl font-bold text-red-600">
        ${today.filter(s => s.status === "Ongoing").length}
      </p>
    </div>
    <div class="bg-white rounded-2xl p-4 shadow border">
      <p class="text-xs text-[--muted]">Next</p>
      <p class="text-2xl font-bold">
        ${today.filter(s => s.status === "Scheduled").length}
      </p>
    </div>
    <div class="bg-white rounded-2xl p-4 shadow border">
      <p class="text-xs text-[--muted]">OT Rooms</p>
      <p class="text-2xl font-bold">
        ${new Set(today.map(s => s.otRoomName)).size}
      </p>
    </div>
  `;

  /* PATIENT CARDS */
  patients.forEach(p => {
    const latest = p.schedules.sort(
      (a, b) => b.startTime.toMillis() - a.startTime.toMillis()
    )[0];

    if (filterStatus !== "all" && latest.status !== filterStatus) return;

    const card = document.createElement("div");
    card.className = "card-enter bg-white rounded-3xl shadow border p-5";

    card.innerHTML = `
      <div class="flex gap-4">
        <img src="${avatar(p.patientId)}"
             class="w-14 h-14 rounded-2xl border object-cover" />
        <div class="flex-1">
          <h3 class="font-bold">${p.patientName}</h3>
          <p class="text-xs text-[--muted]">${p.department}</p>
          <p class="text-xs mt-1">${latest.procedure} · ${latest.otRoomName}</p>

          <div class="mt-3 flex items-center justify-between">
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(latest.status)}">
              ${latest.status}
            </span>
            <span class="text-xs text-[--muted]">
              ${relativeTime(latest.startTime)}
            </span>
          </div>
        </div>
      </div>
    `;

    if (
      latest.status === "Ongoing" ||
      (latest.status === "Scheduled" &&
        latest.startTime.toMillis() - now < 30 * 60000)
    ) {
      priorityLane.appendChild(card.cloneNode(true));
    }

    grid.appendChild(card);
  });
}

/* FILTER */
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.className += " px-4 py-2 rounded-full border bg-white text-sm font-semibold";
  btn.onclick = () => {
    filterStatus = btn.dataset.filter;
    render();
  };
});

/* INIT */
auth.onAuthStateChanged(u => u && loadPatients());
