import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export async function loadPatients(selectEl) {
  // Default option
  selectEl.innerHTML = `<option value="">Select Patient</option>`;

  // Query only approved patients
  const q = query(
    collection(db, "users"),
    where("role", "==", "Patient"),
    where("approved", "==", true)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    const opt = document.createElement("option");
    opt.disabled = true;
    opt.textContent = "No patients found";
    selectEl.appendChild(opt);
    return;
  }

  snap.forEach(docSnap => {
    const u = docSnap.data();

    const opt = document.createElement("option");
    opt.value = u.patientId || docSnap.id;
    opt.dataset.name = u.displayName || u.name || "Unnamed Patient";
    opt.textContent = u.patientId
      ? `${u.displayName || "Unnamed"} (${u.patientId})`
      : `${u.displayName || "Unnamed Patient"}`;

    selectEl.appendChild(opt);
  });
}
