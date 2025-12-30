import { db } from "../firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import {loadAllDoctors} from "../admin/loadAllDoctors.js"

/* ================= ELEMENTS ================= */
const deptNameInput = document.getElementById("deptName");
const headDoctorSelect = document.getElementById("headDoctorSelect");
const otRoomsInput = document.getElementById("otRooms");
const statusSelect = document.getElementById("status");
const saveBtn = document.getElementById("saveBtn");

/* ================= INIT ================= */
(async () => {
  // ✅ Correct function for department head
  await loadAllDoctors(headDoctorSelect);
})();

/* ================= HELPERS ================= */
function parseOtRooms(value) {
  return value
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
}

/* ================= SAVE ================= */
saveBtn.addEventListener("click", async () => {
  try {
    const name = deptNameInput.value.trim();
    const status = statusSelect.value;
    const otRooms = parseOtRooms(otRoomsInput.value);

    const headDoctorId = headDoctorSelect.value || null;
    const headDoctorName =
      headDoctorSelect.selectedOptions[0]?.textContent || null;

    /* ---------- VALIDATION ---------- */
    if (!name) {
      alert("Department name is required");
      return;
    }

    if (!otRooms.length) {
      alert("At least one OT room is required");
      return;
    }

    /* ---------- FIRESTORE ---------- */
    await addDoc(collection(db, "departments"), {
      name,
      status,
      otRooms,
      headDoctorId,
      headDoctorName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    alert("Department created successfully");
    window.location.href = "/admin/departments.html";

  } catch (err) {
    console.error("Add department error:", err);
    alert("Failed to create department");
  }
});
