import { auth, db } from "../js/firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ================= ROLE ROUTES ================= */
const ROLE_ROUTES = {
  Admin: "/admin/",
  Doctor: "/doctor/",
  "OT Staff": "/ot/",
  Patient: "/patient/",
};

console.log("✅ AUTH GUARD LOADED");

/* ================= AUTH GUARD ================= */
onAuthStateChanged(auth, async (user) => {
  /* 🚫 NOT LOGGED IN */
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  /* 🚫 USER DOC MISSING */
  if (!snap.exists()) {
    window.location.href = "/register.html?step=profile";
    return;
  }

  const data = snap.data();
  const { role, status, approved } = data;
  const currentPath = window.location.pathname;

  /* 🚫 BLOCK DISABLED USERS */
  if (status === "disabled") {
    await signOut(auth);
    alert("Your account has been disabled by admin.");
    window.location.href = "/login.html";
    return;
  }

  /* ⏳ USER NOT APPROVED YET */
  if (approved === false) {
    // Allow only pending-approval page
    if (!currentPath.includes("pending-approval.html")) {
      window.location.href = "/pending-approval.html";
    }
    return;
  }

  /* 🚫 ROLE NOT SET */
  if (!role || !ROLE_ROUTES[role]) {
    window.location.href = "/register.html?step=role";
    return;
  }

  const allowedBasePath = ROLE_ROUTES[role];

  /* ✅ ALLOW ACCESS INSIDE ROLE FOLDER */
  if (currentPath.startsWith(allowedBasePath)) {
    return;
  }

  /* 🚫 PREVENT CROSS-ROLE ACCESS */
  window.location.href = `${allowedBasePath}dashboard.html`;
});
