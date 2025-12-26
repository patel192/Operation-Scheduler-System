// ================================
// IMPORTS
// ================================
import { auth, db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ================================
// ELEMENTS
// ================================
const tableBody = document.getElementById("pendingUsersTable");
const emptyState = document.getElementById("emptyState");

// ================================
// LOAD PENDING USERS
// ================================
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
    const u = { id: docSnap.id, ...docSnap.data() };
    renderRow(u);
  });
}

// ================================
// RENDER ROW
// ================================
function renderRow(u) {
  const tr = document.createElement("tr");
  tr.className = "hover:bg-slate-50";

  tr.innerHTML = `
    <td class="px-4 py-3 font-semibold">
      ${u.displayName || "—"}
    </td>

    <td class="px-4 py-3">
      ${u.email || "—"}
    </td>

    <td class="px-4 py-3">
      ${u.role || "Not selected"}
    </td>

    <td class="px-4 py-3 text-right space-x-2">
      <button
        class="approveBtn px-3 py-1 text-xs font-semibold rounded bg-green-100 text-green-700 hover:bg-green-200"
        data-id="${u.id}">
        Approve
      </button>

      <button
        class="rejectBtn px-3 py-1 text-xs font-semibold rounded bg-red-100 text-red-700 hover:bg-red-200"
        data-id="${u.id}">
        Reject
      </button>
    </td>
  `;

  tableBody.appendChild(tr);

  attachRowEvents(tr, u.id);
}

// ================================
// EVENTS
// ================================
function attachRowEvents(row, userId) {
  const approveBtn = row.querySelector(".approveBtn");
  const rejectBtn = row.querySelector(".rejectBtn");

  // ✅ APPROVE USER
  approveBtn.onclick = async () => {
    if (!confirm("Approve this user?")) return;

    await updateDoc(doc(db, "users", userId), {
      approved: true,
      status: "active",
    });

    row.remove();
    checkEmpty();
  };

  // ❌ REJECT USER
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

// ================================
// EMPTY STATE CHECK
// ================================
function checkEmpty() {
  if (!tableBody.children.length) {
    emptyState.classList.remove("hidden");
  }
}

// ================================
// INIT
// ================================
auth.onAuthStateChanged((user) => {
  if (!user) return;
  loadPendingUsers();
});
