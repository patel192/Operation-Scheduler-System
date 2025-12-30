import { db } from "../firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const nameInput = document.getElementById("deptName");
const otInput = document.getElementById("otRooms");
const statusSelect = document.getElementById("status");
const saveBtn = document.getElementById("saveBtn");

/* ================= SAVE ================= */
saveBtn.onclick = async () => {
  const name = nameInput.value.trim();
  const status = statusSelect.value;

  if (!name) {
    alert("Department name is required");
    return;
  }

  const otRooms = otInput.value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  try {
    await addDoc(collection(db, "departments"), {
      name,
      status,
      otRooms,
      doctorCount: 0,
      headIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    alert("Department created successfully");
    window.location.href = "/admin/departments.html";

  } catch (err) {
    console.error(err);
    alert("Failed to create department");
  }
};
