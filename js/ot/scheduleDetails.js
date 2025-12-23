import { auth, db } from "../firebase.js";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ---------- GET SCHEDULE ID ---------- */
const params = new URLSearchParams(window.location.search);
const scheduleId = params.get("id");

if (!scheduleId) {
  alert("Invalid schedule");
}

/* ---------- AUTH CHECK ---------- */
auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  loadScheduleDetails(scheduleId);
});

/* ---------- LOAD DETAILS ---------- */
async function loadScheduleDetails(id) {
  const ref = doc(db, "schedules", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Schedule not found");
    return;
  }

  const s = snap.data();

  /* BASIC INFO */
  document.getElementById("procedure").textContent = s.procedure;
  document.getElementById("otRoom").textContent = s.otRoom;
  document.getElementById("doctor").textContent = s.surgeonName || "—";
  document.getElementById("patient").textContent = s.patientName;
  document.getElementById("notes").textContent = s.notes || "—";

  document.getElementById("timeRange").textContent =
    `${formatTime(s.startTime)} – ${formatTime(s.endTime)}`;

  /* STATUS BADGE */
  const badge = document.getElementById("statusBadge");
  badge.textContent = s.status;

  badge.className =
    "inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold " +
    getStatusClass(s.status);

  /* LOAD OT STAFF NAMES */
  loadStaffNames(s.otStaffIds || []);
}

/* ---------- LOAD STAFF ---------- */
async function loadStaffNames(ids) {
  const list = document.getElementById("staffList");
  list.innerHTML = "";

  if (!ids.length) {
    list.innerHTML = "<li>No staff assigned</li>";
    return;
  }

  const q = query(
    collection(db, "users"),
    where("__name__", "in", ids)
  );

  const snap = await getDocs(q);

  snap.forEach(doc => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${doc.data().displayName || doc.data().name}</strong>`;
    list.appendChild(li);
  });
}

/* ---------- HELPERS ---------- */
function formatTime(ts) {
  return ts.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClass(status) {
  if (status === "Upcoming") return "bg-blue-100 text-blue-700";
  if (status === "Ongoing") return "bg-yellow-100 text-yellow-700";
  if (status === "Completed") return "bg-green-100 text-green-700";
  return "bg-slate-100 text-slate-700";
}
