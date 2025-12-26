// ================================
// IMPORTS
// ================================
import { auth, db } from "../js/firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ================================
// ELEMENTS
// ================================
const emailEl = document.getElementById("userEmail");
const roleEl = document.getElementById("userRole");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");

// ================================
// ROLE ROUTES
// ================================
const ROLE_ROUTES = {
  Admin: "/admin/dashboard.html",
  Doctor: "/doctor/dashboard.html",
  "OT Staff": "/ot/dashboard.html",
  Patient: "/patient/dashboard.html",
};

// ================================
// CHECK APPROVAL STATUS
// ================================
async function checkApproval(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // User doc missing → go to registration
    window.location.href = "/register.html";
    return;
  }

  const data = snap.data();

  // UI INFO
  emailEl.textContent = data.email || "—";
  roleEl.textContent = data.role || "—";

  // 🚫 Disabled user
  if (data.status === "disabled") {
    await signOut(auth);
    alert("Your account has been disabled by admin.");
    window.location.href = "/login.html";
    return;
  }

  // ✅ Approved → redirect
  if (data.approved === true && ROLE_ROUTES[data.role]) {
    window.location.href = ROLE_ROUTES[data.role];
    return;
  }

  // ⏳ Still pending → stay here
  console.log("User pending approval");
}

// ================================
// AUTH WATCH
// ================================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  checkApproval(user);
});

// ================================
// BUTTON ACTIONS
// ================================
refreshBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  refreshBtn.textContent = "Checking...";
  refreshBtn.disabled = true;

  await checkApproval(user);

  refreshBtn.textContent = "Check Again";
  refreshBtn.disabled = false;
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/login.html";
});
