import { db } from "../firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const otNameInput = document.getElementById("otName");
const departmentSelect = document.getElementById("departmentSelect");
const statusSelect = document.getElementById("statusSelect");
const notesInput = document.getElementById("notesInput");
const saveBtn = document.getElementById("saveBtn");

/* ================= LOAD DEPARTMENTS ================= */
async function loadDepartments() {
  const snap = await getDocs(collection(db, "departments"));

  snap.forEach((docSnap) => {
    const d = docSnap.data();

    if (d.status !== "active") return;

    const opt = document.createElement("option");
    opt.value = d.name;
    opt.textContent = d.name;
    departmentSelect.appendChild(opt);
  });
}

/* ================= HELPERS ================= */
function parseEquipment(value) {
  return value
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
}

/* ================= SAVE ================= */
saveBtn.onclick = async () => {
  try {
    const name = otNameInput.value.trim();
    const department = departmentSelect.value;
    const status = statusSelect.value;
    const notes = notesInput.value.trim();

    if (!name) {
      alert("OT Room name is required");
      return;
    }

    if (!department) {
      alert("Department is required");
      return;
    }

    /* ---- UNIQUE NAME CHECK ---- */
    const q = query(
      collection(db, "otRooms"),
      where("name", "==", name)
    );

    const existing = await getDocs(q);
    if (!existing.empty) {
      alert("OT Room with this name already exists");
      return;
    }

    /* ---- CREATE ---- */
    await addDoc(collection(db, "otRooms"), {
      name,
      department,
      status,
      equipmentIds:[],
      notes: notes || null,

      activeScheduleId: null,
      activeScheduleTime: null,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    alert("OT Room created successfully");
    window.location.href = "/admin/ot-rooms.html";

  } catch (err) {
    console.error("Add OT Room error:", err);
    alert("Failed to create OT Room");
  }
};

/* ================= INIT ================= */
loadDepartments();
