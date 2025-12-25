import { auth, db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const tableBody = document.getElementById("usersTable");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");
const statusFilter = document.getElementById("statusFilter");

/* ================= STATE ================= */
let allUsers = [];

/* ================= LOAD USERS ================= */
async function loadUsers() {
  tableBody.innerHTML = "";
  emptyState.classList.add("hidden");

  const snap = await getDocs(collection(db, "users"));

  if (snap.empty) {
    emptyState.classList.remove("hidden");
    return;
  }

  allUsers = snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }));

  renderUsers(allUsers);
}

/* ================= RENDER USERS ================= */
function renderUsers(users) {
  tableBody.innerHTML = "";

  if (!users.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  users.forEach(u => {
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
        <select
          data-id="${u.id}"
          class="roleSelect border rounded px-2 py-1 text-xs">
          ${renderRoleOptions(u.role)}
        </select>
      </td>

      <td class="px-4 py-3">
        <select
          data-id="${u.id}"
          class="statusSelect border rounded px-2 py-1 text-xs">
          <option value="active" ${u.status === "active" ? "selected" : ""}>Active</option>
          <option value="disabled" ${u.status === "disabled" ? "selected" : ""}>Disabled</option>
        </select>
      </td>

      <td class="px-4 py-3 text-right">
        <button
          data-id="${u.id}"
          class="saveBtn text-sm font-semibold text-[--primary] hover:underline">
          Save
        </button>
      </td>
    `;

    tableBody.appendChild(tr);
  });

  attachEvents();
}

/* ================= ROLE OPTIONS ================= */
function renderRoleOptions(current) {
  const roles = ["Admin", "Doctor", "OT Staff", "Patient"];
  return roles
    .map(r =>
      `<option ${r === current ? "selected" : ""}>${r}</option>`
    )
    .join("");
}

/* ================= EVENTS ================= */
function attachEvents() {
  document.querySelectorAll(".saveBtn").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;

      const role = document.querySelector(`.roleSelect[data-id="${id}"]`).value;
      const status = document.querySelector(`.statusSelect[data-id="${id}"]`).value;

      await updateDoc(doc(db, "users", id), {
        role,
        status,
      });

      alert("User updated");
    };
  });
}

/* ================= FILTERS ================= */
function applyFilters() {
  let filtered = [...allUsers];

  const q = searchInput.value.toLowerCase();
  const role = roleFilter.value;
  const status = statusFilter.value;

  if (q) {
    filtered = filtered.filter(u =>
      (u.displayName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  }

  if (role) {
    filtered = filtered.filter(u => u.role === role);
  }

  if (status) {
    filtered = filtered.filter(u => u.status === status);
  }

  renderUsers(filtered);
}

searchInput.addEventListener("input", applyFilters);
roleFilter.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);

/* ================= INIT ================= */
auth.onAuthStateChanged(user => {
  if (!user) return;
  loadUsers();
});
