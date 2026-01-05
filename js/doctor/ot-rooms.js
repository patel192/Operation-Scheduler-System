import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const otGrid = document.getElementById("otGrid");
const otSummary = document.getElementById("otSummary");

/* HELPERS */
const t = ts => ts.toDate();
const mins = ms => Math.round(ms / 60000);

function sameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

/* STATE */
let schedules = [];

/* LOAD */
function listen() {
  const q = query(collection(db, "schedules"));

  onSnapshot(q, snap => {
    schedules = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    render();
  });
}

/* RENDER */
function render() {
  const today = new Date();

  const todaySchedules = schedules.filter(s =>
    sameDay(t(s.startTime), today)
  );

  const otMap = {};

  todaySchedules.forEach(s => {
    if (!otMap[s.otRoomId]) {
      otMap[s.otRoomId] = {
        id: s.otRoomId,
        name: s.otRoomName,
        list: []
      };
    }
    otMap[s.otRoomId].list.push(s);
  });

  const otRooms = Object.values(otMap);

  /* SUMMARY */
  const active = todaySchedules.filter(s => s.status === "Ongoing").length;
  const total = otRooms.length;
  const usedMinutes = todaySchedules.reduce(
    (a, s) => a + mins(t(s.endTime) - t(s.startTime)),
    0
  );

  otSummary.innerHTML = `
    <div>Total OT Rooms<br><span class="text-sm">${total}</span></div>
    <div class="text-red-600">Ongoing Surgeries<br><span class="text-sm">${active}</span></div>
    <div>Total Procedures<br><span class="text-sm">${todaySchedules.length}</span></div>
    <div>Utilized Minutes<br><span class="text-sm">${usedMinutes}</span></div>
    <div>Date<br><span class="text-sm">${today.toLocaleDateString()}</span></div>
  `;

  /* GRID */
  otGrid.innerHTML = "";

  otRooms.forEach(ot => {
    const list = ot.list.sort(
      (a, b) => t(a.startTime) - t(b.startTime)
    );

    const current = list.find(s => s.status === "Ongoing");
    const upcoming = list.find(s => s.status === "Scheduled");

    const overrun =
      current && new Date() > t(current.endTime);

    const card = document.createElement("div");
    card.className = `
      glass rounded-2xl border p-4 space-y-3
      ${overrun ? "pulse border-red-600" : ""}
    `;

    card.innerHTML = `
      <div class="flex justify-between items-center">
        <h2 class="font-semibold">${ot.name}</h2>
        <span class="text-xs px-2 py-0.5 rounded-full
          ${
            current
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }">
          ${current ? "Occupied" : "Idle"}
        </span>
      </div>

      <div class="text-sm space-y-1">
        ${
          current
            ? `
              <div>
                <p class="text-xs text-slate-500">Current Surgery</p>
                <p class="font-semibold">${current.procedure}</p>
                <p class="text-xs text-slate-500">
                  ${current.patientName} · ${current.department}
                </p>
              </div>
            `
            : `<p class="text-xs text-slate-500">No active surgery</p>`
        }
      </div>

      ${
        upcoming
          ? `
            <div class="pt-2 border-t text-xs">
              <p class="text-slate-500">Next:</p>
              <p class="font-semibold">${upcoming.procedure}</p>
              <p class="text-slate-500">
                ${t(upcoming.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
          `
          : `<p class="text-xs text-slate-400 pt-2">No upcoming surgery</p>`
      }

      ${
        current
          ? `
            <div class="pt-2 text-right">
              <a
                href="/doctor/schedule-details.html?id=${current.id}"
                class="text-xs font-semibold text-blue-600 hover:underline">
                View Details →
              </a>
            </div>
          `
          : ""
      }
    `;

    otGrid.appendChild(card);
  });
}

/* INIT */
auth.onAuthStateChanged(u => {
  if (u) listen();
});
