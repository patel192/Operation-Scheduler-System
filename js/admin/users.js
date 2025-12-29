import { auth, db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const tableBody = document.getElementById("usersTable");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");
const statusFilter = document.getElementById("statusFilter");

/* STATE */
let allUsers = [];

/* LOAD USERS */
async function loadUsers() {
  tableBody.innerHTML = "";
  emptyState.classList.add("hidden");

  const snap = await getDocs(collection(db, "users"));

  if (snap.empty) {
    emptyState.classList.remove("hidden");
    return;
  }

  allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderUsers(allUsers);
}

/* RENDER */
function renderUsers(users) {
  tableBody.innerHTML = "";

  if (!users.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  users.forEach(u => {
    const isSelf = auth.currentUser?.uid === u.id;
    const isPending = u.status === "pending" || u.approved === false;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition";

    tr.innerHTML = `
      <td class="px-6 py-4 font-semibold">
        ${u.displayName || "—"}
        ${isSelf ? `<span class="ml-1 text-xs text-blue-600">(You)</span>` : ""}
        ${isPending ? `<span class="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Pending</span>` : ""}
      </td>

      <td class="px-6 py-4">${u.email || "—"}</td>

      <td class="px-6 py-4">
        <select data-id="${u.id}"
          class="roleSelect filter-input bg-white"
          ${isSelf ? "disabled" : ""}>
          ${renderRoleOptions(u.role)}
        </select>
      </td>

      <td class="px-6 py-4">
        <span class="px-3 py-1 rounded-full text-xs font-semibold
          ${
            u.status === "active"
              ? "bg-emerald-100 text-emerald-700"
              : u.status === "disabled"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }">
          ${u.status || "pending"}
        </span>
      </td>

      <td class="px-6 py-4 space-y-1">
        ${renderExtraControls(u)}
      </td>

      <td class="px-6 py-4 text-right space-x-3">
        ${
          !isSelf && isPending
            ? `
          <button data-id="${u.id}" class="approveBtn action-link text-emerald-600 text-xs">
            Approve
          </button>
          <button data-id="${u.id}" class="rejectBtn action-link text-red-600 text-xs">
            Reject
          </button>
        `
            : ""
        }

        <button data-id="${u.id}"
          class="saveBtn action-link text-[--primary] text-xs opacity-50 cursor-not-allowed"
          disabled>
          Save
        </button>
      </td>
    `;

    tableBody.appendChild(tr);
  });

  attachEvents();
}

/* ROLE OPTIONS */
function renderRoleOptions(current) {
  return ["Admin","Doctor","OT Staff","Patient"]
    .map(r => `<option ${r === current ? "selected" : ""}>${r}</option>`)
    .join("");
}

/* EXTRA CONTROLS */
function renderExtraControls(u) {
  if (u.role === "Doctor") {
    return `
      <input class="extraInput filter-input"
        data-id="${u.id}" data-field="specialization"
        placeholder="Specialization"
        value="${u.specialization || ""}"/>
      <select class="extraInput filter-input bg-white"
        data-id="${u.id}" data-field="availability">
        <option value="available" ${u.availability==="available"?"selected":""}>Available</option>
        <option value="on-leave" ${u.availability==="on-leave"?"selected":""}>On Leave</option>
        <option value="busy" ${u.availability==="busy"?"selected":""}>Busy</option>
      </select>`;
  }

  if (u.role === "OT Staff") {
    return `
      <select class="extraInput filter-input bg-white"
        data-id="${u.id}" data-field="shift">
        <option value="morning" ${u.shift==="morning"?"selected":""}>Morning</option>
        <option value="evening" ${u.shift==="evening"?"selected":""}>Evening</option>
        <option value="night" ${u.shift==="night"?"selected":""}>Night</option>
      </select>
      <select class="extraInput filter-input bg-white"
        data-id="${u.id}" data-field="availability">
        <option value="available" ${u.availability==="available"?"selected":""}>Available</option>
        <option value="busy" ${u.availability==="busy"?"selected":""}>Busy</option>
      </select>`;
  }

  return `<span class="text-xs text-slate-400">—</span>`;
}

/* EVENTS */
function attachEvents() {
  document.querySelectorAll("tr").forEach(row => {
    const roleSelect = row.querySelector(".roleSelect");
    const saveBtn = row.querySelector(".saveBtn");
    const approveBtn = row.querySelector(".approveBtn");
    const rejectBtn = row.querySelector(".rejectBtn");
    const extraInputs = row.querySelectorAll(".extraInput");

    const enableSave = () => {
      saveBtn.disabled = false;
      saveBtn.classList.remove("opacity-50","cursor-not-allowed");
    };

    roleSelect?.addEventListener("change", enableSave);
    extraInputs.forEach(i => i.addEventListener("change", enableSave));

    saveBtn.addEventListener("click", async () => {
      const id = saveBtn.dataset.id;
      const payload = {};
      if (roleSelect) payload.role = roleSelect.value;
      extraInputs.forEach(i => payload[i.dataset.field] = i.value);

      await updateDoc(doc(db,"users",id), payload);
      saveBtn.disabled = true;
      saveBtn.classList.add("opacity-50","cursor-not-allowed");
      alert("User updated");
    });

    approveBtn && (approveBtn.onclick = async () => {
      await updateDoc(doc(db,"users",approveBtn.dataset.id), {
        status:"active", approved:true
      });
      loadUsers();
    });

    rejectBtn && (rejectBtn.onclick = async () => {
      await updateDoc(doc(db,"users",rejectBtn.dataset.id), {
        status:"disabled", approved:false
      });
      loadUsers();
    });
  });
}

/* FILTERS */
function applyFilters() {
  let list = [...allUsers];
  const q = searchInput.value.toLowerCase();
  const role = roleFilter.value;
  const status = statusFilter.value;

  if (q) list = list.filter(u =>
    (u.displayName||"").toLowerCase().includes(q) ||
    (u.email||"").toLowerCase().includes(q)
  );

  if (role) list = list.filter(u => u.role === role);
  if (status) list = list.filter(u => u.status === status);

  renderUsers(list);
}

searchInput.addEventListener("input", applyFilters);
roleFilter.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);

/* INIT */
auth.onAuthStateChanged(user => {
  if (user) loadUsers();
});
