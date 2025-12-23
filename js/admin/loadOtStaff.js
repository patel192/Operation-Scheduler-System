import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

export async function loadOtStaff(selectEl) {
  selectEl.innerHTML = "";

  const q = query(collection(db, "users"), where("role", "==", "OT Staff"));
  const snap = await getDocs(q);

  snap.forEach(doc => {
    const staff = doc.data();
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = staff.displayName || staff.name;
    selectEl.appendChild(option);
  });
}
