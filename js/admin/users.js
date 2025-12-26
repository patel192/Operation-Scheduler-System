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

  allUsers = snap.docs.map((d) => ({
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

  users.forEach((u) => {
    const isSelf = auth.currentUser?.uid === u.id;
    const isPending = u.status === "pending" || u.approved === false;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50";

    tr.innerHTML = `
      <td class="px-4 py-3 font-semibold">
        ${u.displayName || "—"}
        ${isSelf ? `<span class="text-xs text-blue-600 ml-1">(You)</span>` : ""}
        ${
          isPending
            ? `<span class="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Pending</span>`
            : ""
        }
      </td>

      <td class="px-4 py-3">${u.email || "—"}</td>

      <td class="px-4 py-3">
        <select data-id="${u.id}"
          class="roleSelect border rounded px-2 py-1 text-xs"
          ${isSelf ? "disabled" : ""}>
          ${renderRoleOptions(u.role)}
        </select>
      </td>

      <td class="px-4 py-3">
        <span class="text-xs px-2 py-1 rounded
          ${
            u.status === "active"
              ? "bg-green-100 text-green-700"
              : u.status === "disabled"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }">
          ${u.status || "pending"}
        </span>
      </td>

      <td class="px-4 py-3 space-y-1">
        ${renderExtraControls(u)}
      </td>

      <td class="px-4 py-3 text-right space-x-2">
        ${
          !isSelf && isPending
            ? `
          <button data-id="${u.id}"
            class="approveBtn text-xs font-semibold text-green-600 hover:underline">
            Approve
          </button>
          <button data-id="${u.id}"
            class="rejectBtn text-xs font-semibold text-red-600 hover:underline">
            Disapprove
          </button>
        `
            : ""
        }

        <button data-id="${u.id}"
          class="saveBtn text-xs font-semibold text-[--primary] hover:underline opacity-50 cursor-not-allowed"
          disabled>
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
    .map((r) => `<option ${r === current ? "selected" : ""}>${r}</option>`)
    .join("");
}

/* ================= EXTRA CONTROLS ================= */
function renderExtraControls(u) {
  if (u.role === "Doctor") {
    return `
      <input
        class="extraInput border rounded px-2 py-1 text-xs w-full"
        data-field="specialization"
        data-id="${u.id}"
        placeholder="Specialization"
        value="${u.specialization || ""}"
      />
      <select
        class="extraInput border rounded px-2 py-1 text-xs w-full"
        data-field="availability"
        data-id="${u.id}">
        <option value="available" ${u.availability === "available" ? "selected" : ""}>Available</option>
        <option value="on-leave" ${u.availability === "on-leave" ? "selected" : ""}>On Leave</option>
      </select>
    `;
  }

  if (u.role === "OT Staff") {
    return `
      <select
        class="extraInput border rounded px-2 py-1 text-xs w-full"
        data-field="shift"
        data-id="${u.id}">
        <option value="morning" ${u.shift === "morning" ? "selected" : ""}>Morning</option>
        <option value="evening" ${u.shift === "evening" ? "selected" : ""}>Evening</option>
        <option value="night" ${u.shift === "night" ? "selected" : ""}>Night</option>
      </select>
      <select
        class="extraInput border rounded px-2 py-1 text-xs w-full"
        data-field="availability"
        data-id="${u.id}">
        <option value="available" ${u.availability === "available" ? "selected" : ""}>Available</option>
        <option value="busy" ${u.availability === "busy" ? "selected" : ""}>Busy</option>
      </select>
    `;
  }

  return `<span class="text-xs text-slate-400">—</span>`;
}

/* ================= EVENTS ================= */
function attachEvents() {
  document.querySelectorAll("tr").forEach((row) => {
    const roleSelect = row.querySelector(".roleSelect");
    const saveBtn = row.querySelector(".saveBtn");
    const approveBtn = row.querySelector(".approveBtn");
    const rejectBtn = row.querySelector(".rejectBtn");
    const extraInputs = row.querySelectorAll(".extraInput");

    if (!saveBtn) return;

    /* ENABLE SAVE */
    const enableSave = () => {
      saveBtn.disabled = false;
      saveBtn.classList.remove("opacity-50", "cursor-not-allowed");
    };

    if (roleSelect) roleSelect.addEventListener("change", enableSave);
    extraInputs.forEach((input) => input.addEventListener("change", enableSave));

    /* SAVE */
    saveBtn.addEventListener("click", async () => {
      const id = saveBtn.dataset.id;
      const payload = {};

      if (roleSelect) payload.role = roleSelect.value;

      extraInputs.forEach((input) => {
        payload[input.dataset.field] = input.value;
      });

      await updateDoc(doc(db, "users", id), payload);

      saveBtn.disabled = true;
      saveBtn.classList.add("opacity-50", "cursor-not-allowed");

      alert("User updated successfully");
    });

    /* APPROVE */
    if (approveBtn) {
      approveBtn.onclick = async () => {
        await updateDoc(doc(db, "users", approveBtn.dataset.id), {
          status: "active",
          approved: true,
        });
        loadUsers();
      };
    }

    /* REJECT */
    if (rejectBtn) {
      rejectBtn.onclick = async () => {
        await updateDoc(doc(db, "users", rejectBtn.dataset.id), {
          status: "disabled",
          approved: false,
        });
        loadUsers();
      };
    }
  });
}

/* ================= FILTERS ================= */
function applyFilters() {
  let filtered = [...allUsers];

  const q = searchInput.value.toLowerCase();
  const role = roleFilter.value;
  const status = statusFilter.value;

  if (q) {
    filtered = filtered.filter(
      (u) =>
        (u.displayName || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
  }

  if (role) filtered = filtered.filter((u) => u.role === role);
  if (status) filtered = filtered.filter((u) => u.status === status);

  renderUsers(filtered);
}

searchInput.addEventListener("input", applyFilters);
roleFilter.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);

/* ================= INIT ================= */
auth.onAuthStateChanged((user) => {
  if (!user) return;
  loadUsers();
});
