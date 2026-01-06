import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= HELPERS ================= */

function formatTime(ts) {
  return new Date(ts.toMillis()).toLocaleString();
}

function alertStyle(type) {
  switch (type) {
    case "overrun":
      return "border-red-500 bg-red-50 text-red-700";
    case "upcoming":
      return "border-blue-500 bg-blue-50 text-blue-700";
    case "schedule_update":
      return "border-orange-500 bg-orange-50 text-orange-700";
    default:
      return "border-slate-300 bg-slate-50 text-slate-700";
  }
}

function alertTitle(type) {
  switch (type) {
    case "overrun":
      return "Surgery Overrun";
    case "upcoming":
      return "Upcoming Surgery";
    case "schedule_update":
      return "Schedule Update";
    default:
      return "Alert";
  }
}

/* ================= MAIN ================= */

auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  const alertsContainer = document.getElementById("alertsContainer");
  const emptyState = document.getElementById("emptyState");

  alertsContainer.innerHTML = "";
  emptyState.classList.add("hidden");

  const q = query(
    collection(db, "alerts"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    emptyState.classList.remove("hidden");
    return;
  }

  snapshot.forEach(doc => {
    const a = doc.data();

    const div = document.createElement("div");
    div.className = `
      border-l-4 p-4 rounded-lg bg-white shadow-sm
      ${alertStyle(a.type)}
    `;

    div.innerHTML = `
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="font-semibold">
            ${alertTitle(a.type)}
          </p>
          <p class="text-sm mt-1">
            ${a.message}
          </p>
        </div>
        <div class="text-xs text-slate-500 whitespace-nowrap">
          ${a.createdAt ? formatTime(a.createdAt) : ""}
        </div>
      </div>
    `;

    alertsContainer.appendChild(div);
  });
});
