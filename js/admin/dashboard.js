import { db } from "../firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const els = {
  otUtil: document.getElementById("otUtilization"),
  eqUtil: document.getElementById("equipmentUtilization"),
  staffUtil: document.getElementById("staffUtilization"),
  health: document.getElementById("healthScore"),

  alerts: document.getElementById("alertsList"),
  liveOps: document.getElementById("liveOperations"),
  noLive: document.getElementById("noLiveOps"),
  today: document.getElementById("todayTable"),

  otList: document.getElementById("otList"),
  eqList: document.getElementById("equipmentList"),
  staffList: document.getElementById("staffList"),
};

/* HELPERS */
function pct(a, b) {
  return b === 0 ? "0%" : `${Math.round((a / b) * 100)}%`;
}

function time(ts) {
  return ts.toDate().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(ts) {
  const d = ts.toDate();
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

function renderUserChart(users) {
  const ctx = document.getElementById("userChart");
  if (!ctx) return;

  const counts = {
    doctorBusy: 0,
    doctorFree: 0,
    staffBusy: 0,
    staffFree: 0,
  };

  users.forEach((u) => {
    const d = u.data();
    if (d.role === "Doctor") {
      d.availability === "busy" ? counts.doctorBusy++ : counts.doctorFree++;
    }
    if (d.role === "OT Staff") {
      d.availability === "busy" ? counts.staffBusy++ : counts.staffFree++;
    }
  });

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [
        "Doctors Busy",
        "Doctors Available",
        "OT Staff Busy",
        "OT Staff Available",
      ],
      datasets: [
        {
          data: [
            counts.doctorBusy,
            counts.doctorFree,
            counts.staffBusy,
            counts.staffFree,
          ],
          backgroundColor: ["#f59e0b", "#6366f1", "#fbbf24", "#10b981"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12 },
        },
      },
    },
  });
}

function renderDeptChart(schedules) {
  const ctx = document.getElementById("deptChart");
  if (!ctx) return;

  const deptCount = {};

  schedules.forEach((s) => {
    if (s.department) {
      deptCount[s.department] = (deptCount[s.department] || 0) + 1;
    }
  });

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(deptCount),
      datasets: [
        {
          data: Object.values(deptCount),
          backgroundColor: "#38bdf8",
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: "y",
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { display: false } },
      },
    },
  });
}

async function loadDashboard() {
  const [ots, eqs, sch, users] = await Promise.all([
    getDocs(collection(db, "otRooms")),
    getDocs(collection(db, "equipment")),
    getDocs(collection(db, "schedules")),
    getDocs(collection(db, "users")),
  ]);

  /* ================= SYSTEM HEALTH ================= */
  const otInUse = ots.docs.filter((o) => o.data().status === "in-use").length;
  const eqInUse = eqs.docs.filter((e) => e.data().status === "in-use").length;
  const staffBusy = users.docs.filter(
    (u) => u.data().availability === "busy"
  ).length;

  els.otUtil.textContent = pct(otInUse, ots.size);
  els.eqUtil.textContent = pct(eqInUse, eqs.size);
  els.staffUtil.textContent = pct(staffBusy, users.size);

  els.health.textContent = pct(
    otInUse + eqInUse + staffBusy,
    ots.size + eqs.size + users.size
  );

  /* ================= LIVE SURGERIES ================= */
  els.liveOps.innerHTML = "";
  const ongoing = sch.docs.filter((d) => d.data().status === "Ongoing");

  if (!ongoing.length) {
    els.noLive.classList.remove("hidden");
  } else {
    els.noLive.classList.add("hidden");
    ongoing.forEach((d) => {
      const s = d.data();
      els.liveOps.innerHTML += `
        <div class="p-4 pulse-amber cursor-pointer"
             onclick="location.href='/admin/schedule-details.html?id=${d.id}'">
          <div class="font-semibold text-amber-800">${s.procedure}</div>
          <div class="text-xs text-slate-600">
            ${s.otRoomName} · ${s.surgeonName} ·
            ${time(s.startTime)}–${time(s.endTime)}
          </div>
        </div>`;
    });
  }

  /* ================= TODAY OT SCHEDULE ================= */
  els.today.innerHTML = "";

  const todaySchedules = sch.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => s.startTime && isToday(s.startTime))
    .sort((a, b) => {
      const order = { Ongoing: 0, Upcoming: 1, Completed: 2, Cancelled: 3 };
      return order[a.status] - order[b.status];
    });

  todaySchedules.forEach((s) => {
    els.today.innerHTML += `
      <tr>
        <td class="p-3 font-medium">${s.patientName || "—"}</td>
        <td class="p-3 text-center">${s.otRoomName}</td>
        <td class="p-3 text-center">
          ${time(s.startTime)}–${time(s.endTime)}
        </td>
        <td class="p-3">${s.surgeonName || "—"}</td>
        <td class="p-3 font-semibold ${
          s.status === "Ongoing"
            ? "text-amber-600"
            : s.status === "Completed"
            ? "text-emerald-600"
            : s.status === "Cancelled"
            ? "text-red-600"
            : "text-blue-600"
        }">
          ${s.status}
        </td>
      </tr>`;
  });

  /* ================= OT ROOMS ================= */
  els.otList.innerHTML = ots.docs
    .map((o) => {
      const d = o.data();
      const inUse = d.status === "in-use";

      return `
      <li
        class="group flex items-center justify-between px-3 py-2 rounded-xl
               hover:bg-sky-50 transition-all duration-200">

        <!-- LEFT -->
        <div class="flex items-center gap-3">
          <!-- ICON -->
          <div class="
            w-9 h-9 rounded-lg flex items-center justify-center
            ${
              inUse
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }
          ">
            <i data-lucide="hospital" class="w-4 h-4"></i>
          </div>

          <!-- TEXT -->
          <div class="leading-tight">
            <p class="text-sm font-semibold text-slate-800">
              ${d.name}
            </p>
            <p class="text-xs text-slate-500">
              ${d.department || "General"}
            </p>
          </div>
        </div>

        <!-- RIGHT -->
        <span
          class="
            text-xs font-semibold px-3 py-1 rounded-full
            ${
              inUse
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }
          ">
          ${inUse ? "In Use" : "Available"}
        </span>
      </li>
    `;
    })
    .join("");

  // re-render icons (important when injecting HTML)
  lucide.createIcons();

  /* ================= EQUIPMENT IN USE ================= */
  const inUseEq = eqs.docs.filter((e) => e.data().status === "in-use");

  els.eqList.innerHTML = inUseEq.length
    ? inUseEq
        .map((e) => {
          const d = e.data();

          return `
          <li
            class="group flex items-center justify-between px-3 py-2 rounded-xl
                   hover:bg-sky-50 transition-all duration-200">

            <!-- LEFT -->
            <div class="flex items-center gap-3">
              <!-- ICON -->
              <div class="w-9 h-9 rounded-lg flex items-center justify-center
                          bg-blue-100 text-blue-700">
                <i data-lucide="cpu" class="w-4 h-4"></i>
              </div>

              <!-- TEXT -->
              <div class="leading-tight">
                <p class="text-sm font-semibold text-slate-800">
                  ${d.name}
                </p>
                <p class="text-xs text-slate-500">
                  ${d.category || "Equipment"}
                </p>
              </div>
            </div>

            <!-- RIGHT -->
            <div class="text-right">
              <span class="block text-xs font-semibold text-amber-700">
                In Use
              </span>
              <span class="block text-xs text-slate-500">
                ${d.currentOtRoomName || "—"}
              </span>
            </div>
          </li>
        `;
        })
        .join("")
    : `
    <li class="text-sm text-slate-400 text-center py-4">
      No equipment currently in use
    </li>
  `;

  // IMPORTANT: re-render lucide icons after DOM injection
  lucide.createIcons();

  /* ================= STAFF BUSY ================= */
  const busyStaff = users.docs.filter((u) => u.data().availability === "busy");

  els.staffList.innerHTML = busyStaff.length
    ? busyStaff
        .map((u) => {
          const d = u.data();
          const isDoctor = d.role === "Doctor";

          return `
          <li
            class="group flex items-center justify-between px-3 py-2 rounded-xl
                   hover:bg-sky-50 transition-all duration-200">

            <!-- LEFT -->
            <div class="flex items-center gap-3">
              <!-- AVATAR / ICON -->
              <div class="
                w-9 h-9 rounded-full flex items-center justify-center
                ${
                  isDoctor
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-emerald-100 text-emerald-700"
                }
              ">
                <i data-lucide="${isDoctor ? "stethoscope" : "user"}"
                   class="w-4 h-4"></i>
              </div>

              <!-- TEXT -->
              <div class="leading-tight">
                <p class="text-sm font-semibold text-slate-800">
                  ${d.displayName}
                </p>
                <p class="text-xs text-slate-500">
                  ${d.role}
                </p>
              </div>
            </div>

            <!-- RIGHT -->
            <span
              class="
                text-xs font-semibold px-3 py-1 rounded-full
                bg-amber-100 text-amber-700
              ">
              Busy
            </span>
          </li>
        `;
        })
        .join("")
    : `
    <li class="text-sm text-slate-400 text-center py-4">
      All staff currently available
    </li>
  `;

  // IMPORTANT: re-render lucide icons
  lucide.createIcons();

  renderUserChart(users.docs);

  renderDeptChart(
    sch.docs
      .map((d) => d.data())
      .filter((s) => s.startTime && isToday(s.startTime))
  );
}

loadDashboard();
