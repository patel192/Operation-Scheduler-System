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
  window.location.href = "/admin/doctors.html";
}

/* ================= ELEMENTS ================= */
const doctorNameEl = document.getElementById("doctorName");
const doctorEmailEl = document.getElementById("doctorEmail");
const statusBadgeEl = document.getElementById("statusBadge");
const availabilityEl = document.getElementById("availability");
const departmentEl = document.getElementById("department");
const toggleStatusBtn = document.getElementById("toggleStatusBtn");

const timelineList = document.getElementById("timelineList");
const timelineEmpty = document.getElementById("timelineEmpty");

const filterStatus = document.getElementById("filterStatus");
const filterDate = document.getElementById("filterDate");

const tabUpcoming = document.getElementById("tabUpcoming");
const tabPast = document.getElementById("tabPast");

/* ================= STATE ================= */
let allSchedules = [];
let activeTab = "upcoming";

/* ================= HELPERS ================= */
function statusStyle(status) {
  if (status === "Completed") return "border-green-500 text-green-700";
  if (status === "Ongoing") return "border-yellow-500 text-yellow-700";
  if (status === "Cancelled") return "border-red-500 text-red-700";
  return "border-blue-500 text-blue-700";
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

function groupByDate(list) {
  const map = {};
  list.forEach(s => {
    const key = s.startTime.toDate().toISOString().slice(0, 10);
    if (!map[key]) map[key] = [];
    map[key].push(s);
  });
  return map;
}

/* ================= LOAD DOCTOR ================= */
async function loadDoctor() {
  const snap = await getDoc(doc(db, "users", doctorId));
  if (!snap.exists()) return;

  const d = snap.data();

  doctorNameEl.textContent = d.displayName || "—";
  doctorEmailEl.textContent = d.email || "—";
  availabilityEl.textContent = d.availability || "—";
  departmentEl.textContent = d.department || "—";

  statusBadgeEl.textContent = d.status || "active";
  statusBadgeEl.className =
    `inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
      d.status === "disabled"
        ? "bg-red-100 text-red-700"
        : "bg-emerald-100 text-emerald-700"
    }`;

  toggleStatusBtn.textContent =
    d.status === "disabled" ? "Enable Doctor" : "Disable Doctor";

  toggleStatusBtn.className =
    d.status === "disabled"
      ? "px-5 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-semibold"
      : "px-5 py-2 rounded-xl bg-red-100 text-red-700 font-semibold";

  await loadTimeline();
}

/* ================= LOAD TIMELINE ================= */
async function loadTimeline() {
  const q = query(
    collection(db, "schedules"),
    where("surgeonId", "==", doctorId),
    orderBy("startTime", "asc")
  );

  const snap = await getDocs(q);
  allSchedules = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  applyFilters();
}

/* ================= FILTER + TABS ================= */
function applyFilters() {
  timelineList.innerHTML = "";
  timelineEmpty.classList.add("hidden");

  let list = [...allSchedules];

  // TAB FILTER
  if (activeTab === "upcoming") {
    list = list.filter(s =>
      ["Upcoming", "Ongoing"].includes(s.status)
    );
  } else {
    list = list.filter(s =>
      ["Completed", "Cancelled"].includes(s.status)
    );
  }

  // STATUS FILTER
  if (filterStatus.value) {
    list = list.filter(s => s.status === filterStatus.value);
  }

  // DATE FILTER
  if (filterDate.value) {
    list = list.filter(s =>
      s.startTime.toDate().toISOString().slice(0, 10) === filterDate.value
    );
  }

  if (!list.length) {
    timelineEmpty.classList.remove("hidden");
    return;
  }

  const grouped = groupByDate(list);
  Object.entries(grouped).forEach(([date, schedules]) =>
    renderDateGroup(date, schedules)
  );
}

/* ================= RENDER ================= */
function renderDateGroup(date, schedules) {
  const wrapper = document.createElement("div");

  const header = document.createElement("div");
  header.className =
    "flex justify-between items-center bg-slate-100 px-4 py-2 rounded cursor-pointer font-semibold";

  header.innerHTML = `
    <span>${new Date(date).toDateString()}</span>
    <span class="text-sm text-slate-500">(${schedules.length})</span>
  `;

  const content = document.createElement("div");
  content.className = "mt-3 space-y-3";

  schedules.forEach(s => {
    const item = document.createElement("div");
    item.className =
      `border-l-4 pl-4 py-3 rounded ${statusStyle(s.status)}`;

    item.innerHTML = `
      <p class="font-semibold">${s.procedure}</p>
      <p class="text-sm text-slate-600">
        Patient: ${s.patientName} • ${s.otRoom}
      </p>
      <p class="text-xs text-slate-500">
        ${formatDate(s.startTime)} •
        ${formatTime(s.startTime)} – ${formatTime(s.endTime)}
      </p>
      <span class="text-xs font-semibold uppercase">${s.status}</span>
    `;

    content.appendChild(item);
  });

  let collapsed = false;
  header.onclick = () => {
    collapsed = !collapsed;
    content.classList.toggle("hidden", collapsed);
  };

  wrapper.appendChild(header);
  wrapper.appendChild(content);
  timelineList.appendChild(wrapper);
}

/* ================= EVENTS ================= */
tabUpcoming.onclick = () => {
  activeTab = "upcoming";
  tabUpcoming.classList.add("bg-[--primary]", "text-white");
  tabPast.classList.remove("bg-[#0a6cff]","text-white");
  applyFilters();
};

tabPast.onclick = () => {
  activeTab = "past";
  tabPast.classList.add("bg-[#0a6cff]","text-white");
  tabUpcoming.classList.remove("bg-[--primary]", "text-white");
  applyFilters();
};

filterStatus.addEventListener("change", applyFilters);
filterDate.addEventListener("change", applyFilters);

toggleStatusBtn.onclick = async () => {
  const ref = doc(db, "users", doctorId);
  const snap = await getDoc(ref);
  const d = snap.data();

  if (d.availability === "busy" && d.status !== "disabled") {
    alert("Cannot disable a doctor with active schedules");
    return;
  }

  await updateDoc(ref, {
    status: d.status === "disabled" ? "active" : "disabled",
  });

  loadDoctor();
};

/* ================= INIT ================= */
loadDoctor();
