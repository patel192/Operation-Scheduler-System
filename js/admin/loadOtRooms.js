import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/**
 * Load OT Rooms into select
 * Only active & available OTs
 */
export async function loadOtRooms(selectEl, department = null) {
  selectEl.innerHTML = `<option value="">Select OT</option>`;

  let q = query(
    collection(db, "otRooms"),
    where("status", "in", ["available", "in-use"])
  );

  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const d = docSnap.data();

    // Optional department filter
    if (department && d.department !== department) return;

    const opt = document.createElement("option");
    opt.value = d.name; // IMPORTANT: schedule stores OT name
    opt.textContent = `${d.name} (${d.department})`;

    selectEl.appendChild(opt);
  });

  if (selectEl.options.length === 1) {
    const opt = document.createElement("option");
    opt.disabled = true;
    opt.textContent = "No OT rooms available";
    selectEl.appendChild(opt);
  }
}
