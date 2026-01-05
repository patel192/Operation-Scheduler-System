import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const identityPanel = document.getElementById("identityPanel");
const performanceStrip = document.getElementById("performanceStrip");
const opsPanel = document.getElementById("opsPanel");
const activityFeed = document.getElementById("activityFeed");

/* HELPERS */
const t = ts => ts.toDate();
const mins = ms => Math.round(ms / 60000);

/* LOAD */
async function loadProfile() {
  if (!auth.currentUser) return;

  const user = auth.currentUser;

  const snap = await getDocs(
    query(
      collection(db, "schedules"),
      where("surgeonId", "==", user.uid)
    )
  );

  const schedules = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  render(user, schedules);
}

/* RENDER */
function render(user, schedules) {
  /* IDENTITY */
  identityPanel.innerHTML = `
    <div>
      <p class="text-xs text-slate-500">Name</p>
      <p class="font-semibold">${user.displayName || "Doctor"}</p>
    </div>

    <div>
      <p class="text-xs text-slate-500">Email</p>
      <p class="font-semibold">${user.email}</p>
    </div>

    <div>
      <p class="text-xs text-slate-500">Role</p>
      <p class="font-semibold">Doctor</p>
    </div>

    <div>
      <p class="text-xs text-slate-500">Account Status</p>
      <p class="font-semibold text-green-600">Active</p>
    </div>

    <div>
      <p class="text-xs text-slate-500">Joined</p>
      <p class="font-semibold">
        ${user.metadata.creationTime
          ? new Date(user.metadata.creationTime).toLocaleDateString()
          : "—"}
      </p>
    </div>

    <div>
      <p class="text-xs text-slate-500">Last Login</p>
      <p class="font-semibold">
        ${user.metadata.lastSignInTime
          ? new Date(user.metadata.lastSignInTime).toLocaleString()
          : "—"}
      </p>
    </div>
  `;

  /* PERFORMANCE */
  const completed = schedules.filter(s => s.status === "Completed").length;
  const ongoing = schedules.filter(s => s.status === "Ongoing").length;
  const overruns = schedules.filter(
    s => s.status === "Ongoing" && new Date() > t(s.endTime)
  ).length;

  const avg =
    schedules.length
      ? Math.round(
          schedules.reduce(
            (a,s)=>a+mins(t(s.endTime)-t(s.startTime)),0
          ) / schedules.length
        )
      : 0;

  performanceStrip.innerHTML = `
    <div>Total<br><span class="text-sm">${schedules.length}</span></div>
    <div class="text-green-600">Completed<br><span class="text-sm">${completed}</span></div>
    <div class="text-red-600">Ongoing<br><span class="text-sm">${ongoing}</span></div>
    <div class="text-red-700">Overruns<br><span class="text-sm">${overruns}</span></div>
    <div>Avg Duration<br><span class="text-sm">${avg}m</span></div>
  `;

  /* OPS CONTEXT */
  opsPanel.innerHTML = `
    <div>Departments: <span class="font-semibold">
      ${new Set(schedules.map(s=>s.department)).size}
    </span></div>

    <div>OT Rooms Used: <span class="font-semibold">
      ${new Set(schedules.map(s=>s.otRoomName)).size}
    </span></div>

    <div>Patients Handled: <span class="font-semibold">
      ${new Set(schedules.map(s=>s.patientId)).size}
    </span></div>

    <div>Equipment Touched: <span class="font-semibold">
      ${new Set(schedules.flatMap(s=>s.equipmentIds||[])).size}
    </span></div>
  `;

  /* ACTIVITY FEED */
  activityFeed.innerHTML = "";

  schedules
    .slice()
    .sort((a,b)=>t(b.startTime)-t(a.startTime))
    .slice(0,5)
    .forEach(s => {
      const row = document.createElement("div");
      row.className = "border rounded-lg p-2 bg-slate-50";

      row.innerHTML = `
        <div class="flex justify-between">
          <span class="font-semibold">${s.procedure}</span>
          <span class="text-xs">${s.status}</span>
        </div>
        <div class="text-xs text-slate-500">
          ${t(s.startTime).toLocaleString()} · ${s.otRoomName}
        </div>
        <div class="text-right mt-1">
          <a
            href="/doctor/schedule-details.html?id=${s.id}"
            class="text-xs font-semibold text-blue-600 hover:underline">
            View Details →
          </a>
        </div>
      `;

      activityFeed.appendChild(row);
    });
}

/* INIT */
auth.onAuthStateChanged(u => {
  if (u) loadProfile();
});
