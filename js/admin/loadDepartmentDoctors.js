import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/**
 * Load doctors for a specific department
 * Used for assigning Department Head
 */
export async function loadDepartmentDoctors(selectEl, departmentName) {
  selectEl.innerHTML = `<option value="">Select Department Head</option>`;

  if (!departmentName) return;

  const q = query(
    collection(db, "users"),
    where("role", "==", "Doctor"),
    where("department", "==", departmentName)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    const opt = document.createElement("option");
    opt.disabled = true;
    opt.textContent = "No doctors in this department";
    selectEl.appendChild(opt);
    return;
  }

  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    const opt = document.createElement("option");
    opt.value = docSnap.id;
    opt.textContent = d.displayName || d.name || "Unnamed Doctor";
    selectEl.appendChild(opt);
    console.log("Loaded doctor:", d);
  });
}
