import { auth, db } from "../firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */
const form = document.getElementById("addEquipmentForm");
const nameInput = document.getElementById("nameInput");
const categoryInput = document.getElementById("categoryInput");
const departmentsSelect = document.getElementById("departmentsSelect");
const descriptionInput = document.getElementById("descriptionInput");
const imageUrlInput = document.getElementById("imageUrlInput");

/* ================= LOAD DEPARTMENTS ================= */
async function loadDepartments() {
  const snap = await getDocs(collection(db, "departments"));

  snap.forEach((doc) => {
    const opt = document.createElement("option");
    opt.value = doc.data().name;
    opt.textContent = doc.data().name;
    departmentsSelect.appendChild(opt);
  });
}

/* ================= SUBMIT ================= */
form.onsubmit = async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const category = categoryInput.value.trim();

  if (!name || !category) {
    alert("Equipment name and category are required");
    return;
  }

  const departments = [...departmentsSelect.selectedOptions].map(
    (o) => o.value
  );

  await addDoc(collection(db, "equipment"), {
    name,
    category,
    departments,
    description: descriptionInput.value.trim() || "",
    imageUrl: imageUrlInput.value.trim() || "",

    // 🔒 SYSTEM-CONTROLLED FIELDS
    status: "active",
    currentOtRoomId: null,
    currentOtRoomName: null,
    currentScheduleId: null,
    lastUsedAt: null,

    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  });

  window.location.href = "/admin/resources.html";
};

/* ================= INIT ================= */
loadDepartments();
