import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export async function loadDoctors(selectEl) {
  selectEl.innerHTML = `<option value="">Select Surgeon</option>`;
  selectEl.disabled = true;

  const q = query(
    collection(db, "users"),
    where("role", "==", "Doctor"),
    where("approved", "==", true),
    where("status", "==", "active"),
    where("availability", "==", "available")
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    const opt = document.createElement("option");
    opt.disabled = true;
    opt.textContent = "No available doctors";
    selectEl.appendChild(opt);
    return;
  }

  snapshot.forEach((docSnap) => {
    const d = docSnap.data();
    const opt = document.createElement("option");
    opt.value = docSnap.id;
    opt.textContent = d.displayName || d.name || "Unnamed Doctor";
    selectEl.appendChild(opt);
  });

  selectEl.disabled = false;
}
