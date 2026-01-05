import { auth, db } from "../firebase.js";
import { collection, query, where, getDocs } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { autoUpdateScheduleStatus } from "../utils/autoUpdateScheduleStatus.js";

const dateInput = document.getElementById("selectedDate");
const list = document.getElementById("scheduleList");
const spine = document.getElementById("timeSpine");
const contextStrip = document.getElementById("contextStrip");
const statusButtons = document.querySelectorAll(".status-btn");

let schedules = [];
let statusFilter = "all";

dateInput.valueAsDate = new Date();

/* HELPERS */
const t = ts => ts.toDate();
const fmt = d => d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

function overlapRisk(s, all) {
  return all.some(o =>
    o !== s &&
    t(o.startTime) < t(s.endTime) &&
    t(o.endTime) > t(s.startTime)
  );
}

/* LOAD */
async function load() {
  const u = auth.currentUser;
  if (!u) return;

  const snap = await getDocs(
    query(collection(db, "schedules"), where("surgeonId", "==", u.uid))
  );

  schedules = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  render();
}

/* RENDER */
function render() {
  list.innerHTML = "";
  spine.innerHTML = "";

  const day = new Date(dateInput.value).toDateString();
  let daySchedules = schedules.filter(
    s => t(s.startTime).toDateString() === day
  );

  if (statusFilter !== "all") {
    daySchedules = daySchedules.filter(s => s.status === statusFilter);
  }

  // Context strip
  const now = Date.now();
  const ongoing = daySchedules.find(s => s.status === "Ongoing");
  const next = daySchedules
    .filter(s => t(s.startTime).getTime() > now)
    .sort((a,b)=>t(a.startTime)-t(b.startTime))[0];

  contextStrip.innerHTML = `
    <div class="bg-white rounded-2xl p-4 shadow border">
      <p class="text-xs text-[--muted]">Now</p>
      <p class="font-semibold">${ongoing?.patientName || "—"}</p>
    </div>
    <div class="bg-white rounded-2xl p-4 shadow border">
      <p class="text-xs text-[--muted]">Next</p>
      <p class="font-semibold">${next?.patientName || "—"}</p>
    </div>
    <div class="bg-white rounded-2xl p-4 shadow border">
      <p class="text-xs text-[--muted]">Later</p>
      <p class="font-semibold">${daySchedules.length}</p>
    </div>
  `;

  // Time spine
  const hours = [...new Set(daySchedules.map(s => t(s.startTime).getHours()))];
  hours.sort().forEach(h => {
    const div = document.createElement("div");
    div.textContent = `${String(h).padStart(2,"0")}:00`;
    spine.appendChild(div);
  });

  // Cards
  daySchedules
    .sort((a,b)=>t(a.startTime)-t(b.startTime))
    .forEach(s => {
      const risk = overlapRisk(s, daySchedules);
      const card = document.createElement("div");
      card.className = `
        bg-white rounded-2xl shadow border-l-4 p-4 cursor-pointer
        ${s.status==="Ongoing"?"pulse":""}
        ${risk?"border-red-500":"border-blue-500"}
      `;

      card.innerHTML = `
        <div class="flex justify-between">
          <div>
            <h3 class="font-semibold">${s.patientName}</h3>
            <p class="text-xs text-[--muted]">${s.procedure}</p>
            <p class="text-xs text-[--muted]">OT ${s.otRoomName}</p>
          </div>
          <div class="text-xs text-right text-[--muted]">
            ${fmt(t(s.startTime))} – ${fmt(t(s.endTime))}
          </div>
        </div>
      `;

      card.onclick = () =>
        location.href = `/doctor/schedule-details.html?id=${s.id}`;

      list.appendChild(card);
    });
}

/* EVENTS */
dateInput.addEventListener("change", render);
statusButtons.forEach(b => {
  b.className += " px-3 py-1.5 rounded-full border text-sm font-semibold bg-white";
  b.onclick = () => {
    statusFilter = b.dataset.status;
    render();
  };
});

/* INIT */
auth.onAuthStateChanged(async u => {
  if (!u) return;
  await autoUpdateScheduleStatus();
  await load();
});
