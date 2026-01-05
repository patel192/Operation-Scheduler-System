import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const patientList = document.getElementById("patientList");

const statTotal = document.getElementById("statTotal");
const statToday = document.getElementById("statToday");
const statActive = document.getElementById("statActive");
const statCompleted = document.getElementById("statCompleted");
const statRisk = document.getElementById("statRisk");

const patientEmpty = document.getElementById("patientEmpty");
const patientPanel = document.getElementById("patientPanel");
const patientDetails = document.getElementById("patientDetails");
const patientTimeline = document.getElementById("patientTimeline");

/* ================= STATE ================= */
let schedules = [];
let selectedPatientId = null;
let unsubscribe = null;

/* ================= HELPERS ================= */
const t = ts => ts.toDate();

const sameDay = (a, b) =>
  a.toDateString() === b.toDateString();

/* ================= REALTIME ================= */
function listenToSchedules() {
  if (!auth.currentUser) return;

  const q = query(
    collection(db, "schedules"),
    where("surgeonId", "==", auth.currentUser.uid)
  );

  if (unsubscribe) unsubscribe();

  unsubscribe = onSnapshot(q, snap => {
    schedules = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    render();
  });
}

/* ================= DERIVE PATIENTS ================= */
function derivePatients() {
  const map = {};

  schedules.forEach(s => {
    if (!map[s.patientId]) {
      map[s.patientId] = {
        patientId: s.patientId,
        name: s.patientName,
        department: s.department,
        schedules: [],
        hasRisk: false
      };
    }

    if (s.status === "Ongoing" && new Date() > t(s.endTime)) {
      map[s.patientId].hasRisk = true;
    }

    map[s.patientId].schedules.push(s);
  });

  return Object.values(map);
}

/* ================= RENDER ================= */
function render() {
  const patients = derivePatients();
  const today = new Date();

  /* ---------- STATS ---------- */
  statTotal.textContent = patients.length;
  statToday.textContent =
    patients.filter(p =>
      p.schedules.some(s => sameDay(t(s.startTime), today))
    ).length;

  statActive.textContent =
    patients.filter(p =>
      p.schedules.some(s => s.status === "Ongoing")
    ).length;

  statCompleted.textContent =
    patients.filter(p =>
      p.schedules.every(s => s.status === "Completed")
    ).length;

  statRisk.textContent =
    patients.filter(p => p.hasRisk).length;

  /* ---------- LIST ---------- */
  patientList.innerHTML = "";

  patients.forEach(p => {
    const latest =
      p.schedules
        .slice()
        .sort((a, b) => t(b.startTime) - t(a.startTime))[0];

    const row = document.createElement("div");
    row.className = `
      grid grid-cols-[1fr_90px_90px] gap-3 py-2 cursor-pointer
      hover:bg-slate-50 transition
      ${p.patientId === selectedPatientId ? "bg-slate-100" : ""}
      ${p.hasRisk ? "border-l-4 border-red-600 bg-red-50" : ""}
    `;

    row.innerHTML = `
      <div>
        <div class="font-semibold">${p.name}</div>
        <div class="text-xs text-slate-500">${p.department}</div>
      </div>

      <div class="text-xs font-semibold">
        ${latest.status}
      </div>

      <div class="text-xs text-slate-500">
        ${latest.procedure}
      </div>
    `;

    row.onclick = () => inspectPatient(p.patientId);
    patientList.appendChild(row);
  });

  if (selectedPatientId) inspectPatient(selectedPatientId);
}

/* ================= INSPECT ================= */
function inspectPatient(patientId) {
  selectedPatientId = patientId;
  const p = derivePatients().find(x => x.patientId === patientId);
  if (!p) return;

  patientEmpty.classList.add("hidden");
  patientPanel.classList.remove("hidden");

  const sorted = p.schedules
    .slice()
    .sort((a, b) => t(b.startTime) - t(a.startTime));

  patientDetails.innerHTML = `
    <div>
      <p class="text-xs text-slate-500">Patient</p>
      <p class="font-semibold">${p.name}</p>
    </div>

    <div>
      <p class="text-xs text-slate-500">Department</p>
      <p class="font-semibold">${p.department}</p>
    </div>

    <div>
      <p class="text-xs text-slate-500">Total Procedures</p>
      <p class="font-semibold">${p.schedules.length}</p>
    </div>

    <div>
      <p class="text-xs text-slate-500">Risk Flag</p>
      <p class="font-semibold ${p.hasRisk ? "text-red-600" : "text-green-600"}">
        ${p.hasRisk ? "Yes" : "No"}
      </p>
    </div>
  `;

  patientTimeline.innerHTML = "";

  sorted.forEach(s => {
    const div = document.createElement("div");
    div.className = "border rounded-lg p-2 bg-slate-50";

    div.innerHTML = `
      <div class="flex justify-between text-xs text-slate-500 mb-1">
        <span>${t(s.startTime).toLocaleDateString()}</span>
        <span>${s.status}</span>
      </div>
      <div class="font-semibold text-sm">${s.procedure}</div>
      <div class="text-xs text-slate-500">
        OT ${s.otRoomName}
      </div>
    `;

    patientTimeline.appendChild(div);
  });
}

/* ================= INIT ================= */
auth.onAuthStateChanged(user => {
  if (!user) return;
  listenToSchedules();
});
