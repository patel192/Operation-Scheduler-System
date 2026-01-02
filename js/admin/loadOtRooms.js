import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/**
 * Load OT Rooms into select
 * - Only AVAILABLE OTs
 * - Optionally filtered by department
 * - Stores BOTH name (value) and Firestore ID (data-id)
 */
export async function loadOtRooms(selectEl, department = null) {
  // Reset dropdown
  selectEl.innerHTML = `<option value="">Select OT</option>`;

  const q = query(
    collection(db, "otRooms"),
    where("status", "==", "available")
  );

  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const d = docSnap.data();

    // Optional department filter
    if (department && d.department !== department) return;

    const opt = document.createElement("option");

    // ✅ KEEP name as value (backward compatible)
    opt.value = d.name;

    // ✅ ADD Firestore ID (CRITICAL FIX)
    opt.dataset.id = docSnap.id;

    opt.textContent = `${d.name} (${d.department || "—"})`;

    selectEl.appendChild(opt);
  });

  // Empty state
  if (selectEl.options.length === 1) {
    const opt = document.createElement("option");
    opt.disabled = true;
    opt.textContent = "No OT rooms available";
    selectEl.appendChild(opt);
  }
}
