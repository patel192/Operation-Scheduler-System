import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

function t(ts) {
  return new Date(ts.toMillis());
}
function time(ts) {
  return t(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function mins(ms) {
  return Math.max(0, Math.ceil(ms / 60000)) + "m";
}

auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  document.getElementById("todayDate").textContent =
    new Date().toDateString();

  setInterval(() => {
    document.getElementById("nowTime").textContent =
      new Date().toLocaleTimeString();
  }, 1000);

  const q = query(
    collection(db, "schedules"),
    where("otStaffIds", "array-contains", user.uid),
    orderBy("startTime", "asc")
  );

  const snap = await getDocs(q);
  const schedules = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  document.getElementById("totalToday").textContent = schedules.length;

  render(schedules);
});

function render(schedules) {
  const now = Date.now();

  const ongoing = schedules.find(s =>
    s.status === "Ongoing" &&
    now >= s.startTime.toMillis() &&
    now <= s.endTime.toMillis()
  );

  const upcoming = schedules.find(s =>
    s.status === "Upcoming" &&
    s.startTime.toMillis() > now
  );

  if (ongoing) renderCurrent(ongoing);
  if (upcoming) renderNext(upcoming);

  if (!ongoing && !upcoming) {
    document.getElementById("emptyState").classList.remove("hidden");
  }
}

function renderCurrent(s) {
  document.getElementById("currentBlock").classList.remove("hidden");
  setAvailability("In Surgery", "orange");

  document.getElementById("currentPatient").textContent = s.patientName;
  document.getElementById("currentProcedure").textContent = s.procedure || "—";
  document.getElementById("currentSurgeon").textContent = s.surgeonName || "—";
  document.getElementById("currentOT").textContent = s.otRoomName;
  document.getElementById("currentTime").textContent =
    `${time(s.startTime)} – ${time(s.endTime)}`;

  updateCurrent(s);
  setInterval(() => updateCurrent(s), 60000);
}

function updateCurrent(s) {
  const total = s.endTime.toMillis() - s.startTime.toMillis();
  const elapsed = Date.now() - s.startTime.toMillis();
  const percent = Math.min(100, (elapsed / total) * 100);

  document.getElementById("currentRemaining").textContent =
    mins(s.endTime.toMillis() - Date.now());

  document.getElementById("currentBar").style.width = percent + "%";
}

function renderNext(s) {
  document.getElementById("nextBlock").classList.remove("hidden");

  document.getElementById("nextPatient").textContent = s.patientName;
  document.getElementById("nextProcedure").textContent = s.procedure || "—";
  document.getElementById("nextSurgeon").textContent = s.surgeonName || "—";
  document.getElementById("nextOT").textContent = s.otRoomName;
  document.getElementById("nextTime").textContent = time(s.startTime);

  updateNext(s);
  setInterval(() => updateNext(s), 60000);
}

function updateNext(s) {
  const diff = s.startTime.toMillis() - Date.now();
  const percent = Math.max(0, 100 - (diff / (60 * 60000)) * 100);

  document.getElementById("nextCountdown").textContent = mins(diff);
  document.getElementById("nextBar").style.width = percent + "%";
}

function setAvailability(text, color) {
  const el = document.getElementById("availability");
  el.textContent = text;
  el.className =
    `px-3 py-1 rounded-full text-xs font-bold bg-${color}-100 text-${color}-700`;
}
