import { db } from "../firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= PARAM ================= */
const params = new URLSearchParams(window.location.search);
const doctorId = params.get("id");

if (!doctorId) {
  alert("Invalid doctor");
  location.href = "/admin/doctors.html";
}

/* ================= ELEMENTS ================= */
const doctorNameEl = document.getElementById("doctorName");
const doctorEmailEl = document.getElementById("doctorEmail");
const statusBadgeEl = document.getElementById("statusBadge");
const departmentEl = document.getElementById("department");
const availabilityEl = document.getElementById("availability");
const toggleStatusBtn = document.getElementById("toggleStatusBtn");

const upcomingCountEl = document.getElementById("upcomingCount");
const completedCountEl = document.getElementById("completedCount");

const timelineList = document.getElementById("timelineList");
const timelineEmpty = document.getElementById("timelineEmpty");

const tabUpcoming = document.getElementById("tabUpcoming");
const tabPast = document.getElementById("tabPast");

/* ================= STATE ================= */
let allSchedules = [];
let activeTab = "upcoming";

/* ================= HELPERS ================= */
function badgeClass(status) {
  return status === "disabled"
    ? "bg-red-200 text-red-800"
    : "bg-emerald-200 text-emerald-800";
}

function formatDate(ts) {
  return ts.toDate().toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(ts) {
  return ts.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ================= LOAD DOCTOR ================= */
async function loadDoctor() {
  const snap = await getDoc(doc(db, "users", doctorId));
  if (!snap.exists()) return;

  const d = snap.data();

  doctorNameEl.textContent = d.displayName || "—";
  doctorEmailEl.textContent = d.email || "—";
  departmentEl.textContent = d.department || "—";
  availabilityEl.textContent = d.availability || "available";

  statusBadgeEl.textContent = d.status || "active";
  statusBadgeEl.className =
    `px-4 py-2 rounded-full text-sm font-semibold ${badgeClass(d.status)}`;

  toggleStatusBtn.textContent =
    d.status === "disabled" ? "Enable Doctor" : "Disable Doctor";

  loadSchedules();
}

/* ================= LOAD SCHEDULES ================= */
async function loadSchedules() {
  const q = query(
    collection(db, "schedules"),
    where("surgeonId", "==", doctorId),
    orderBy("startTime", "asc")
  );

  const snap = await getDocs(q);
  allSchedules = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  upcomingCountEl.textContent =
    allSchedules.filter(s => ["Upcoming", "Ongoing"].includes(s.status)).length;

  completedCountEl.textContent =
    allSchedules.filter(s => s.status === "Completed").length;

  renderTimeline();
}

/* ================= RENDER ================= */
function renderTimeline() {
  timelineList.innerHTML = "";
  timelineEmpty.classList.add("hidden");

  let list =
    activeTab === "upcoming"
      ? allSchedules.filter(s => ["Upcoming", "Ongoing"].includes(s.status))
      : allSchedules.filter(s => ["Completed", "Cancelled"].includes(s.status));

  if (!list.length) {
    timelineEmpty.classList.remove("hidden");
    return;
  }

  list.forEach(s => {
    const card = document.createElement("div");
    card.className =
      "border-l-4 pl-4 py-3 rounded bg-slate-50";

    card.style.borderColor =
      s.status === "Completed"
        ? "#22c55e"
        : s.status === "Ongoing"
        ? "#f59e0b"
        : "#3b82f6";

    card.innerHTML = `
      <p class="font-semibold">${s.procedure}</p>
      <p class="text-sm text-slate-600">
        Patient: ${s.patientName || "—"} · ${s.otRoomName}
      </p>
      <p class="text-xs text-slate-500">
        ${formatDate(s.startTime)} ·
        ${formatTime(s.startTime)} – ${formatTime(s.endTime)}
      </p>
      <span class="text-xs font-semibold uppercase">${s.status}</span>
    `;

    timelineList.appendChild(card);
  });
}

/* ================= EVENTS ================= */
tabUpcoming.onclick = () => {
  activeTab = "upcoming";
  tabUpcoming.classList.add("bg-indigo-600", "text-white");
  tabPast.classList.remove("bg-indigo-600", "text-white");
  renderTimeline();
};

tabPast.onclick = () => {
  activeTab = "past";
  tabPast.classList.add("bg-indigo-600", "text-white");
  tabUpcoming.classList.remove("bg-indigo-600", "text-white");
  renderTimeline();
};

toggleStatusBtn.onclick = async () => {
  const ref = doc(db, "users", doctorId);
  const snap = await getDoc(ref);
  const d = snap.data();

  if (d.availability === "busy" && d.status !== "disabled") {
    alert("Cannot disable doctor with active schedules");
    return;
  }

  await updateDoc(ref, {
    status: d.status === "disabled" ? "active" : "disabled",
  });

  loadDoctor();
};

/* ================= INIT ================= */
loadDoctor();
