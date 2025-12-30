import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export async function loadAllDoctors(selectEl) {
  selectEl.innerHTML = `<option value="">Select Department Head</option>`;

  const q = query(
    collection(db, "users"),
    where("role", "==", "Doctor")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    const opt = document.createElement("option");
    opt.disabled = true;
    opt.textContent = "No doctors found";
    selectEl.appendChild(opt);
    return;
  }

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const opt = document.createElement("option");
    opt.value = docSnap.id;
    opt.textContent = d.displayName || d.name || "Unnamed Doctor";
    selectEl.appendChild(opt);
  });
}
