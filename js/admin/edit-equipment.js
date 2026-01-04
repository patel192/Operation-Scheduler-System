import { db } from "../firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= PARAMS ================= */
const params = new URLSearchParams(window.location.search);
const equipmentId = params.get("id");

if (!equipmentId) {
  alert("Invalid equipment");
  window.location.href = "/admin/resources.html";
}

/* ================= ELEMENTS ================= */
const form = document.getElementById("editEquipmentForm");

const nameInput = document.getElementById("nameInput");
const categoryInput = document.getElementById("categoryInput");
const departmentsSelect = document.getElementById("departmentsSelect");
const descriptionInput = document.getElementById("descriptionInput");
const imageUrlInput = document.getElementById("imageUrlInput");

const statusText = document.getElementById("statusText");
const currentOtText = document.getElementById("currentOtText");
const currentScheduleText = document.getElementById("currentScheduleText");

/* ================= LOAD DEPARTMENTS ================= */
async function loadDepartments() {
  const snap = await getDocs(collection(db, "departments"));

  snap.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.data().name;
    opt.textContent = d.data().name;
    departmentsSelect.appendChild(opt);
  });
}

/* ================= LOAD EQUIPMENT ================= */
async function loadEquipment() {
  const ref = doc(db, "equipment", equipmentId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    alert("Equipment not found");
    window.location.href = "/admin/resources.html";
    return;
  }

  const e = snap.data();

  nameInput.value = e.name || "";
  categoryInput.value = e.category || "";
  descriptionInput.value = e.description || "";
  imageUrlInput.value = e.imageUrl || "";

  statusText.textContent = e.status || "—";
  currentOtText.textContent = e.currentOtRoomName || "—";
  currentScheduleText.textContent = e.currentScheduleId || "—";

  // Select departments
  [...departmentsSelect.options].forEach((opt) => {
    opt.selected = (e.departments || []).includes(opt.value);
  });
}

/* ================= SUBMIT ================= */
form.onsubmit = async (e) => {
  e.preventDefault();

  const updated = {
    name: nameInput.value.trim(),
    category: categoryInput.value.trim(),
    description: descriptionInput.value.trim() || "",
    imageUrl: imageUrlInput.value.trim() || "",
    departments: [...departmentsSelect.selectedOptions].map(
      (o) => o.value
    ),
  };

  if (!updated.name || !updated.category) {
    alert("Name and category are required");
    return;
  }

  await updateDoc(doc(db, "equipment", equipmentId), updated);

  window.location.href = "/admin/resources.html";
};

/* ================= INIT ================= */
await loadDepartments();
await loadEquipment();
