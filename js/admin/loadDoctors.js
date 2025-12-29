import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export async function loadDoctors(selectEl) {
  selectEl.innerHTML = `<option value="">Select Surgeon</option>`;

  const q = query(collection(db, "users"), where("role", "==", "Doctor"));

  const snapshot = await getDocs(q);

  console.log("Doctors loaded:", snapshot.size);

  snapshot.forEach((d) => {
    const data = d.data();
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = data.displayName || data.name || "Unnamed Doctor";
    selectEl.appendChild(opt);
  });
}
