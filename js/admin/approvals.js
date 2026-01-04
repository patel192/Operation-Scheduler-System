import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const approvalList = document.getElementById("approvalList");
const emptyState = document.getElementById("emptyState");

const kpiTotal = document.getElementById("kpiTotal");
const kpiDoctors = document.getElementById("kpiDoctors");
const kpiOtStaff = document.getElementById("kpiOtStaff");
const kpiOthers = document.getElementById("kpiOthers");

/* LOAD */
async function loadApprovals() {
  approvalList.innerHTML = "";
  emptyState.classList.add("hidden");

  const q = query(
    collection(db, "users"),
    where("status", "==", "pending"),
    where("approved", "==", false),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  const users = snap.docs.map(d => ({ id:d.id, ...d.data() }));

  renderKPIs(users);

  if (!users.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  users.forEach(renderCard);
}

/* KPI */
function renderKPIs(users) {
  kpiTotal.textContent = users.length;
  kpiDoctors.textContent = users.filter(u => u.role === "Doctor").length;
  kpiOtStaff.textContent = users.filter(u => u.role === "OT Staff").length;
  kpiOthers.textContent = users.filter(
    u => !["Doctor","OT Staff"].includes(u.role)
  ).length;
}

/* CARD */
function renderCard(u) {
  const div = document.createElement("div");
  div.className = "px-6 py-4 hover:bg-slate-50 transition";

  div.innerHTML = `
    <div class="flex justify-between items-start">
      <div>
        <p class="font-semibold text-lg">${u.displayName || "—"}</p>
        <p class="text-sm text-slate-500">${u.email || "—"}</p>
        <span class="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold
          ${
            u.role === "Doctor"
              ? "bg-indigo-100 text-indigo-700"
              : u.role === "OT Staff"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-700"
          }">
          ${u.role || "Unspecified"}
        </span>
      </div>

      <div class="flex gap-3">
        <button
          class="approve px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
          Approve
        </button>

        <button
          class="reject px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
          Reject
        </button>
      </div>
    </div>
  `;

  div.querySelector(".approve").onclick = () => approveUser(u.id, div);
  div.querySelector(".reject").onclick = () => rejectUser(u.id, div);

  approvalList.appendChild(div);
}

/* ACTIONS */
async function approveUser(id, row) {
  if (!confirm("Approve this user?")) return;

  await updateDoc(doc(db, "users", id), {
    approved: true,
    status: "active",
  });

  row.remove();
  checkEmpty();
}

async function rejectUser(id, row) {
  if (!confirm("Reject and disable this user?")) return;

  await updateDoc(doc(db, "users", id), {
    approved: false,
    status: "disabled",
  });

  row.remove();
  checkEmpty();
}

function checkEmpty() {
  if (!approvalList.children.length) {
    emptyState.classList.remove("hidden");
  }
}

/* INIT */
loadApprovals();
