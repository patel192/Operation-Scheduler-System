import { auth, db } from "../firebase.js";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const topSummary = document.getElementById("topSummary");
const coreDetails = document.getElementById("coreDetails");
const statusPanel = document.getElementById("statusPanel");
const notesList = document.getElementById("notesList");

const noteInput = document.getElementById("noteInput");
const addNoteBtn = document.getElementById("addNoteBtn");
const markCompletedBtn = document.getElementById("markCompletedBtn");

/* ================= HELPERS ================= */
const t = (ts) => ts.toDate();
const time = (ts) =>
  t(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const params = new URLSearchParams(window.location.search);
const scheduleId = params.get("id");
let timerInterval = null;

function formatDuration(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
const liveTimer = document.getElementById("liveTimer");
const elapsedEl = document.getElementById("elapsedTime");
const remainingEl = document.getElementById("remainingTime");
const progressBar = document.getElementById("progressBar");
const overrunLabel = document.getElementById("overrunLabel");

/* ================= LOAD ================= */
function loadSchedule() {
  if (!auth.currentUser || !scheduleId) return;

  const ref = doc(db, "schedules", scheduleId);

  onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;

    const s = snap.data();
    render(s);
  });
}

/* ================= RENDER ================= */
function render(s) {
  /* TOP SUMMARY */
  topSummary.innerHTML = `
    <div>Patient<br><span class="text-sm">${s.patientName}</span></div>
    <div>Procedure<br><span class="text-sm">${s.procedure}</span></div>
    <div>OT Room<br><span class="text-sm">${s.otRoomName}</span></div>
    <div>Status<br><span class="text-sm">${s.status}</span></div>
    <div>Start<br><span class="text-sm">${time(s.startTime)}</span></div>
    <div>End<br><span class="text-sm">${time(s.endTime)}</span></div>
  `;

  /* CORE DETAILS */
  coreDetails.innerHTML = `
    <div>
      <p class="text-xs text-slate-500">Department</p>
      <p class="font-semibold">${s.department}</p>
    </div>

    <div>
      <p class="text-xs text-slate-500">Surgeon</p>
      <p class="font-semibold">${s.surgeonName}</p>
    </div>

    <div>
      <p class="text-xs text-slate-500">Time Window</p>
      <p class="font-semibold">${time(s.startTime)} – ${time(s.endTime)}</p>
    </div>

    <div>
      <p class="text-xs text-slate-500">Patient ID</p>
      <p class="font-semibold">${s.patientId}</p>
    </div>
  `;

  /* STATUS PANEL */
  const isOverrun = s.status === "Ongoing" && new Date() > t(s.endTime);

  statusPanel.innerHTML = `
    <div class="flex justify-between">
      <span>Status</span>
      <span class="font-semibold ${isOverrun ? "text-red-600 pulse" : ""}">
        ${s.status}${isOverrun ? " (Overrun)" : ""}
      </span>
    </div>

    <div class="flex justify-between">
      <span>Department</span>
      <span>${s.department}</span>
    </div>

    <div class="flex justify-between">
      <span>OT Room</span>
      <span>${s.otRoomName}</span>
    </div>
  `;
  /* ================= LIVE TIMER ================= */

  /* clear previous timer */
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (s.status === "Ongoing") {
    liveTimer.classList.remove("hidden");

    const start = t(s.startTime);
    const planned = t(s.endTime) - start;

    timerInterval = setInterval(() => {
      const now = new Date();
      const elapsed = now - start;

      elapsedEl.textContent = formatDuration(elapsed);

      const remaining = planned - elapsed;
      remainingEl.textContent =
        remaining > 0 ? formatDuration(remaining) + " left" : "Overrun";

      const pct = Math.min((elapsed / planned) * 100, 100);
      progressBar.style.width = pct + "%";

      if (elapsed > planned) {
        progressBar.classList.remove("bg-blue-600");
        progressBar.classList.add("bg-red-600");
        overrunLabel.classList.remove("hidden");
      } else {
        progressBar.classList.remove("bg-red-600");
        progressBar.classList.add("bg-blue-600");
        overrunLabel.classList.add("hidden");
      }
    }, 1000);
  } else {
    liveTimer.classList.add("hidden");
  }

  /* NOTES */
  notesList.innerHTML = "";

  if (Array.isArray(s.notes)) {
    s.notes
      .slice()
      .sort((a, b) => a.at?.toMillis() - b.at?.toMillis())
      .forEach((n) => {
        const div = document.createElement("div");
        div.className = "border rounded-lg p-2 bg-slate-50 text-sm";

        div.innerHTML = `
          <div class="flex justify-between text-xs text-slate-500 mb-1">
            <span>${n.by === auth.currentUser.uid ? "You" : "Doctor"}</span>
            <span>${
              n.at ? new Date(n.at.toMillis()).toLocaleString() : ""
            }</span>
          </div>
          <div>${n.text}</div>
        `;

        notesList.appendChild(div);
      });
  }

  /* ACTIONS */
  markCompletedBtn.classList.toggle("hidden", s.status !== "Ongoing");

  addNoteBtn.onclick = async () => {
    const note = noteInput.value.trim();
    if (!note) return;

    await updateDoc(doc(db, "schedules", scheduleId), {
      notes: arrayUnion({
        text: note,
        by: auth.currentUser.uid,
        at: Timestamp.now(),
      }),
      updatedAt: serverTimestamp(),
    });

    noteInput.value = "";
  };

  markCompletedBtn.onclick = async () => {
    if (!confirm("Mark this surgery as completed?")) return;

    await updateDoc(doc(db, "schedules", scheduleId), {
      status: "Completed",
      updatedAt: serverTimestamp(),
    });
  };
}

/* ================= INIT ================= */
auth.onAuthStateChanged((u) => {
  if (!u) return;
  loadSchedule();
});
