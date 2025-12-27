import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export async function loadOtStaff(selectEl) {
  selectEl.innerHTML = `<option value="">Select OT Staff</option>`;
  selectEl.disabled = true;

  const q = query(
    collection(db, "users"),
    where("role", "==", "OT Staff"),
    where("approved", "==", true),
    where("status", "==", "active"),
    where("availability", "==", "available")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    const opt = document.createElement("option");
    opt.disabled = true;
    opt.textContent = "No available OT staff";
    selectEl.appendChild(opt);
    return;
  }

  snap.forEach((docSnap) => {
    const staff = docSnap.data();
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent =
      staff.displayName || staff.name || "Unnamed OT Staff";
    selectEl.appendChild(option);
  });

  selectEl.disabled = false;
}
