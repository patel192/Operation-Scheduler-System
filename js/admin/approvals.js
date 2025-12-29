import { auth, db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const tableBody = document.getElementById("pendingUsersTable");
const emptyState = document.getElementById("emptyState");

/* LOAD */
async function loadPendingUsers() {
  tableBody.innerHTML = "";
  emptyState.classList.add("hidden");

  const q = query(
    collection(db, "users"),
    where("status", "==", "pending"),
    where("approved", "==", false)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    emptyState.classList.remove("hidden");
    return;
  }

  snap.forEach((docSnap) => {
    renderRow({ id: docSnap.id, ...docSnap.data() });
  });
}

/* RENDER ROW */
function renderRow(u) {
  const tr = document.createElement("tr");
  tr.className = "hover:bg-slate-50 transition";

  tr.innerHTML = `
    <td class="px-6 py-4 font-semibold">
      ${u.displayName || "—"}
    </td>

    <td class="px-6 py-4">
      ${u.email || "—"}
    </td>

    <td class="px-6 py-4">
      ${u.role || "Not selected"}
    </td>

    <td class="px-6 py-4 text-right space-x-3">
      <button
        class="approve action-btn approve"
        data-id="${u.id}">
        Approve
      </button>

      <button
        class="reject action-btn reject"
        data-id="${u.id}">
        Reject
      </button>
    </td>
  `;

  tableBody.appendChild(tr);
  attachRowEvents(tr, u.id);
}

/* EVENTS */
function attachRowEvents(row, userId) {
  const approveBtn = row.querySelector(".approve");
  const rejectBtn = row.querySelector(".reject");

  approveBtn.onclick = async () => {
    if (!confirm("Approve this user?")) return;

    await updateDoc(doc(db, "users", userId), {
      approved: true,
      status: "active",
    });

    row.remove();
    checkEmpty();
  };

  rejectBtn.onclick = async () => {
    if (!confirm("Reject and disable this user?")) return;

    await updateDoc(doc(db, "users", userId), {
      approved: false,
      status: "disabled",
    });

    row.remove();
    checkEmpty();
  };
}

/* EMPTY CHECK */
function checkEmpty() {
  if (!tableBody.children.length) {
    emptyState.classList.remove("hidden");
  }
}

/* INIT */
auth.onAuthStateChanged((user) => {
  if (user) loadPendingUsers();
});
