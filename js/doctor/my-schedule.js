import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const grid = document.getElementById("scheduleGrid");
const detailsPanel = document.getElementById("detailsPanel");
const detailsEmpty = document.getElementById("detailsEmpty");

const filterDate = document.getElementById("filterDate");
const filterStatus = document.getElementById("filterStatus");

const todayCount = document.getElementById("todayCount");
const ongoingCount = document.getElementById("ongoingCount");

let schedules = [];
let selectedId = null;

/* HELPERS */
const t = ts => ts.toDate();
const time = ts => t(ts).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
const date = ts => t(ts).toLocaleDateString();

function badge(status) {
  if (status === "Ongoing") return "bg-red-100 text-red-700";
  if (status === "Completed") return "bg-green-100 text-green-700";
  return "bg-blue-100 text-blue-700";
}

function minutesLeft(end) {
  return Math.round((t(end) - Date.now()) / 60000);
}

/* LOAD */
async function load() {
  if (!auth.currentUser) return;

  const snap = await getDocs(
    query(collection(db, "schedules"),
      where("surgeonId", "==", auth.currentUser.uid))
  );

  schedules = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  render();
}

/* RENDER */
function render() {
  grid.innerHTML = "";

  let list = [...schedules];

  if (filterStatus.value)
    list = list.filter(s => s.status === filterStatus.value);

  if (filterDate.value) {
    const d = new Date(filterDate.value).toDateString();
    list = list.filter(s => t(s.startTime).toDateString() === d);
  }

  todayCount.textContent =
    list.filter(s =>
      t(s.startTime).toDateString() === new Date().toDateString()
    ).length;

  ongoingCount.textContent =
    list.filter(s => s.status === "Ongoing").length;

  list.forEach(s => {
    const card = document.createElement("div");
    card.className = `
      glass rounded-xl border p-3 cursor-pointer hover:shadow transition
      ${s.status === "Ongoing" ? "pulse" : ""}
      ${s.id === selectedId ? "ring-2 ring-blue-400" : ""}
    `;

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-semibold text-sm">${s.patientName}</h3>
          <p class="text-xs text-[--muted]">${s.procedure}</p>
        </div>
        <span class="text-xs font-semibold ${badge(s.status)} px-2 py-0.5 rounded-full">
          ${s.status}
        </span>
      </div>

      <div class="mt-2 text-xs text-[--muted] grid grid-cols-2 gap-1">
        <span>OT ${s.otRoomName}</span>
        <span>${time(s.startTime)}</span>
      </div>
    `;

    card.onclick = () => selectSchedule(s.id);
    grid.appendChild(card);
  });

  if (selectedId) selectSchedule(selectedId);
}

/* DETAILS */
function selectSchedule(id) {
  selectedId = id;
  const s = schedules.find(x => x.id === id);
  if (!s) return;

  detailsEmpty.classList.add("hidden");
  detailsPanel.classList.remove("hidden");

  const remaining = minutesLeft(s.endTime);

  detailsPanel.innerHTML = `
    <!-- PRIMARY -->
    <div class="${s.status === "Ongoing" ? "pulse" : ""}">
      <p class="text-xs font-semibold text-[--muted]">Procedure</p>
      <p class="text-xl font-bold">${s.procedure}</p>
      <p class="text-sm text-[--muted]">${s.department}</p>
    </div>

    <!-- PATIENT -->
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p class="text-xs text-[--muted]">Patient</p>
        <p class="font-semibold">${s.patientName}</p>
      </div>
      <div>
        <p class="text-xs text-[--muted]">Patient ID</p>
        <p class="font-semibold">${s.patientId}</p>
      </div>
    </div>

    <!-- TIME -->
    <div class="grid grid-cols-3 gap-3 text-sm">
      <div>
        <p class="text-xs text-[--muted]">Start</p>
        <p class="font-semibold">${time(s.startTime)}</p>
      </div>
      <div>
        <p class="text-xs text-[--muted]">End</p>
        <p class="font-semibold">${time(s.endTime)}</p>
      </div>
      <div>
        <p class="text-xs text-[--muted]">Remaining</p>
        <p class="font-semibold ${remaining < 0 ? "text-red-600" : ""}">
          ${remaining > 0 ? remaining + " min" : "Overrun"}
        </p>
      </div>
    </div>

    <!-- RESOURCES -->
    <div class="grid grid-cols-3 gap-3 text-sm">
      <div>
        <p class="text-xs text-[--muted]">OT Room</p>
        <p class="font-semibold">${s.otRoomName}</p>
      </div>
      <div>
        <p class="text-xs text-[--muted]">Staff</p>
        <p class="font-semibold">${s.otStaffIds?.length || 0}</p>
      </div>
      <div>
        <p class="text-xs text-[--muted]">Equipment</p>
        <p class="font-semibold">${s.equipmentIds?.length || 0}</p>
      </div>
    </div>

    <!-- NOTES -->
    <div>
      <p class="text-xs text-[--muted]">Notes</p>
      <p class="text-sm">${s.notes || "No notes recorded"}</p>
    </div>

    <!-- STATUS -->
    <div>
      <span class="px-3 py-1 rounded-full text-xs font-semibold ${badge(s.status)}">
        ${s.status}
      </span>
    </div>
  `;

  render();
}

/* EVENTS */
filterDate.addEventListener("change", render);
filterStatus.addEventListener("change", render);

/* INIT */
auth.onAuthStateChanged(u => u && load());
