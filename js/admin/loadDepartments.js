import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/**
 * Load active departments into a <select>
 */
export async function loadDepartments(selectEl) {
  selectEl.innerHTML = `<option value="">Select department</option>`;

  const q = query(
    collection(db, "departments"),
    where("status", "==", "active")
  );

  const snap = await getDocs(q);

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const opt = document.createElement("option");
    opt.value = d.name;      // 🔑 name is used everywhere
    opt.textContent = d.name;
    selectEl.appendChild(opt);
  });
}
