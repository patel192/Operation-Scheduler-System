// /js/doctor/alerts.js

import { auth, db } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const alertList = document.getElementById("alertList");
const emptyState = document.getElementById("emptyState");

auth.onAuthStateChanged(user => {
  if (!user) return;

  const q = query(
    collection(db, "alerts"),
    where("doctorId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, snap => {
    if (snap.empty) {
      emptyState.classList.remove("hidden");
      alertList.innerHTML = "";
      return;
    }

    emptyState.classList.add("hidden");
    alertList.innerHTML = "";

    snap.docs.forEach(d => {
      const a = { id: d.id, ...d.data() };
      renderAlert(a);
    });
  });
});

function renderAlert(a) {
  const row = document.createElement("div");

  row.className = `
    border rounded-xl p-4 flex justify-between items-start gap-4
    ${a.read ? "bg-white" : "bg-red-50 border-red-200"}
  `;

  row.innerHTML = `
    <div>
      <p class="font-semibold text-sm">
        ${a.type === "OVERRUN" ? "⏱ Surgery Overrun" : "⚠ Alert"}
      </p>
      <p class="text-xs text-slate-600 mt-1">${a.message}</p>
      <p class="text-[11px] text-slate-500 mt-1">
        Patient name: ${a.meta}
      </p>
    </div>

    <div class="flex flex-col gap-2 text-right">
      <button
        class="text-xs text-blue-600 hover:underline"
        data-id="${a.id}"
      >
        View
      </button>

      ${!a.read ? `
        <button
          class="text-[11px] text-slate-500 hover:underline"
          data-read="${a.id}"
        >
          Mark read
        </button>
      ` : ""}
    </div>
  `;

  // View details
  row.querySelector("[data-id]").onclick = async () => {
    await markRead(a.id);
    window.location.href = `/doctor/schedule-details.html?id=${a.scheduleId}`;
  };

  // Mark read only
  row.querySelector("[data-read]")?.addEventListener("click", async () => {
    await markRead(a.id);
  });

  alertList.appendChild(row);
}

async function markRead(id) {
  await updateDoc(doc(db, "alerts", id), { read: true });
}
