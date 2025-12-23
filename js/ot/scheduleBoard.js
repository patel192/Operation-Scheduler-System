import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ---------- WAIT FOR AUTH ---------- */
auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  loadOtStaffSchedules(user.uid);
});

/* ---------- LOAD SCHEDULES ---------- */
async function loadOtStaffSchedules(otStaffUid) {
  const container = document.getElementById("scheduleRows");
  container.innerHTML = "";

  const q = query(
    collection(db, "schedules"),
    where("otStaffIds", "array-contains", otStaffUid)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = `
      <p class="text-sm text-slate-500">
        No schedules assigned to you.
      </p>
    `;
    return;
  }

  // Group schedules by OT Room
  const grouped = {};

  snap.forEach((doc) => {
    const s = { id: doc.id, ...doc.data() };

    if (!grouped[s.otRoom]) grouped[s.otRoom] = [];
    grouped[s.otRoom].push(s);
  });

  Object.entries(grouped).forEach(([otRoom, schedules]) => {
    container.appendChild(renderOtRow(otRoom, schedules));
  });
}

/* ---------- RENDER OT ROW ---------- */
function renderOtRow(otRoom, schedules) {
  const row = document.createElement("div");
  row.className = "grid grid-cols-[100px_repeat(6,1fr)] gap-2";

  // OT label
  const label = document.createElement("div");
  label.className = "font-semibold text-sm flex items-center";
  label.textContent = otRoom;
  row.appendChild(label);

  // Empty columns (time grid)
  for (let i = 0; i < 6; i++) {
    row.appendChild(document.createElement("div"));
  }

  // Render schedule cards (simple placement)
  schedules.forEach((s) => {
    const card = document.createElement("div");
    card.className =
      getStatusClass(s.status) + " cursor-pointer hover:shadow-md transition";

    card.innerHTML = `
    <p class="font-semibold text-sm">${s.procedure}</p>
    <p class="text-xs text-slate-500">${s.surgeonName || ""}</p>
    <p class="text-xs text-slate-500">
      ${formatTime(s.startTime)} – ${formatTime(s.endTime)}
    </p>
    <span class="inline-block mt-2 px-2 py-0.5 text-xs rounded-full">
      ${s.status}
    </span>
  `;

    // ✅ CLICK HANDLER
    card.onclick = () => {
      window.location.href = `/ot/schedule-details.html?id=${s.id}`;
    };

    row.children[1].appendChild(card);
  });

  return row;
}

/* ---------- HELPERS ---------- */
function formatTime(ts) {
  return ts.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClass(status) {
  const base = "col-span-2 rounded-xl p-3 border ";

  if (status === "Upcoming")
    return base + "bg-blue-50 border-blue-200 text-blue-700";

  if (status === "Ongoing")
    return base + "bg-yellow-50 border-yellow-200 text-yellow-700";

  if (status === "Completed")
    return base + "bg-green-50 border-green-200 text-green-700";

  return base + "bg-slate-50 border-slate-200 text-slate-700";
}
