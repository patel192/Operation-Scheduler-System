import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export async function loadDoctors(selectEl) {
  selectEl.innerHTML = `<option value="">Select Surgeon</option>`;

  const q = query(
    collection(db, "users"),
    where("role", "==", "Doctor")
  );

  const snapshot = await getDocs(q);

  snapshot.forEach(doc => {
    const d = doc.data();
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = d.displayName || d.name;
    selectEl.appendChild(opt);
  });
}
