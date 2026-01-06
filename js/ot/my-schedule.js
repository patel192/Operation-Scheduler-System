import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ---------- Helpers ---------- */

function formatTime(ts) {
  return new Date(ts.toMillis()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mins(ms) {
  return Math.max(0, Math.ceil(ms / 60000)) + "m";
}

function statusBadge(status) {
  const base = "px-2 py-0.5 rounded text-xs font-semibold";
  if (status === "Ongoing")
    return `<span class="${base} bg-orange-100 text-orange-700">Ongoing</span>`;
  if (status === "Upcoming")
    return `<span class="${base} bg-blue-100 text-blue-700">Upcoming</span>`;
  if (status === "Completed")
    return `<span class="${base} bg-green-100 text-green-700">Completed</span>`;
  return `<span class="${base} bg-slate-100 text-slate-600">${status}</span>`;
}

/* ---------- Main ---------- */

auth.onAuthStateChanged((user) => {
  if (!user) return;

  const dateInput = document.getElementById("dateFilter");
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;

  document.getElementById("selectedDateLabel").textContent = new Date(
    today
  ).toDateString();

  loadSchedule(user.uid, new Date(today));

  dateInput.addEventListener("change", () => {
    const d = new Date(dateInput.value);
    document.getElementById("selectedDateLabel").textContent = d.toDateString();
    loadSchedule(user.uid, d);
  });
});

/* ---------- Load ---------- */

async function loadSchedule(userId, date) {
  const table = document.getElementById("scheduleTable");
  const empty = document.getElementById("emptyState");
  const focusPanel = document.getElementById("focusPanel");

  table.innerHTML = "";
  empty.classList.add("hidden");
  focusPanel.classList.add("hidden");

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, "schedules"),
    where("otStaffIds", "array-contains", userId),
    where("startTime", ">=", Timestamp.fromDate(start)),
    where("startTime", "<=", Timestamp.fromDate(end)),
    orderBy("startTime", "asc")
  );

  const snap = await getDocs(q);
  if (snap.empty) {
    empty.classList.remove("hidden");
    return;
  }

  const schedules = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  renderFocus(schedules);

  schedules.forEach((s) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-3 py-2">${formatTime(s.startTime)} – ${formatTime(
      s.endTime
    )}</td>
      <td class="px-3 py-2">${statusBadge(s.status)}</td>
      <td class="px-3 py-2 font-medium">${s.patientName}</td>
      <td class="px-3 py-2">${s.surgeonName || "—"}</td>
      <td class="px-3 py-2">${s.otRoomName}</td>
      <td class="px-3 py-2">${s.department || "—"}</td>
    `;
    table.appendChild(tr);
  });
}

/* ---------- Focus + Details ---------- */

async function renderFocus(schedules) {
  const now = Date.now();
  const focusPanel = document.getElementById("focusPanel");

  const ongoing = schedules.find(
    (s) =>
      s.status === "Ongoing" &&
      now >= s.startTime.toMillis() &&
      now <= s.endTime.toMillis()
  );

  const upcoming = schedules.find(
    (s) => s.status === "Upcoming" && s.startTime.toMillis() > now
  );

  const s = ongoing || upcoming;
  if (!s) return;

  focusPanel.classList.remove("hidden");

  document.getElementById("focusStatus").textContent =
    s.status === "Ongoing" ? "ONGOING SURGERY" : "NEXT SURGERY";

  document.getElementById("focusPatient").textContent = s.patientName;
  document.getElementById("focusProcedure").textContent = s.procedure || "—";
  document.getElementById("focusSurgeon").textContent = s.surgeonName || "—";
  document.getElementById("focusOT").textContent = s.otRoomName;
  document.getElementById("focusDept").textContent = s.department || "—";
  document.getElementById("focusTime").textContent = `${formatTime(
    s.startTime
  )} – ${formatTime(s.endTime)}`;

  // Equipment
  const eqContainer = document.getElementById("focusEquipment");
  eqContainer.innerHTML = "";

  if (!Array.isArray(s.equipmentIds) || s.equipmentIds.length === 0) {
    eqContainer.innerHTML = `<p class="text-xs text-slate-500">No equipment assigned.</p>`;
  } else {
    for (const eqId of s.equipmentIds) {
      const ref = doc(db, "equipment", eqId);
      const snap = await getDoc(ref);

      if (!snap.exists()) continue;

      const eq = snap.data();

      const div = document.createElement("div");
      div.className =
        "flex items-center gap-2 text-xs bg-slate-100 rounded p-2";

      div.innerHTML = `
      <img
        src="${eq.imageUrl || "/assets/equipment/default.png"}"
        alt="${eq.name}"
        class="w-10 h-10 rounded object-cover border"
      />
      <div>
        <p class="font-semibold text-slate-800">
          ${eq.name}
        </p>
        <p class="text-slate-500">
          ${eq.category} · ${eq.status}
        </p>
      </div>
    `;

      eqContainer.appendChild(div);
    }
  }

  // Notes
  const notes = document.getElementById("focusNotes");
  notes.innerHTML = "";
  (s.notes || []).forEach((n) => {
    const d = document.createElement("div");
    d.className = "bg-slate-100 rounded p-1";
    d.textContent = n.text || n;
    notes.appendChild(d);
  });
  if (!s.notes?.length)
    notes.innerHTML = "<p class='text-slate-500'>No notes</p>";

  updateTimer(s);
  setInterval(() => updateTimer(s), 60000);
}

function updateTimer(s) {
  const bar = document.getElementById("focusBar");
  const countdown = document.getElementById("focusCountdown");
  const now = Date.now();

  if (s.status === "Ongoing") {
    const total = s.endTime.toMillis() - s.startTime.toMillis();
    const elapsed = now - s.startTime.toMillis();
    bar.style.width = Math.min(100, (elapsed / total) * 100) + "%";
    bar.className = "h-2 rounded bg-orange-500";
    countdown.textContent = mins(s.endTime.toMillis() - now);
  } else {
    const diff = s.startTime.toMillis() - now;
    bar.style.width = Math.max(0, 100 - (diff / (60 * 60000)) * 100) + "%";
    bar.className = "h-2 rounded bg-blue-500";
    countdown.textContent = mins(diff);
  }
}
