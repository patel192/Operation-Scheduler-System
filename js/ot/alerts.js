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
  if (!ts) return "";
  return new Date(ts.toMillis()).toLocaleString();
}

function severityStyle(severity) {
  switch (severity) {
    case "critical":
      return "border-red-500 bg-red-50 text-red-700";
    case "warning":
      return "border-orange-500 bg-orange-50 text-orange-700";
    case "info":
      return "border-blue-500 bg-blue-50 text-blue-700";
    default:
      return "border-slate-300 bg-slate-50 text-slate-700";
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

  snapshot.forEach(docSnap => {
    const a = docSnap.data();

    const div = document.createElement("div");
    div.className = `
      border-l-4 p-4 rounded-lg bg-white shadow-sm
      ${severityStyle(a.severity)}
    `;

    div.innerHTML = `
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="font-semibold">
            ${a.title || "Alert"}
          </p>
          <p class="text-sm mt-1">
            ${a.message || ""}
          </p>
          ${
            a.meta
              ? `<p class="text-xs mt-1 text-slate-500">${a.meta}</p>`
              : ""
          }
        </div>
        <div class="text-xs text-slate-500 whitespace-nowrap">
          ${formatTime(a.createdAt)}
        </div>
      </div>
    `;

    alertsContainer.appendChild(div);
  });
});
