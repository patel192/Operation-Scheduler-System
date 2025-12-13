import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const ROLE_ROUTES = {
  Admin: "/admin/",
  Doctor: "/doctor/",
  "OT Staff": "/ot/",
  Patient: "/patient/",
};
console.log("AUTH GUARD LOADED");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    window.location.href = "/register.html";
    return;
  }

  const { role } = snap.data();

  if (!role || !ROLE_ROUTES[role]) {
    window.location.href = "/register.html?step=role";
    return;
  }

  const allowedPath = ROLE_ROUTES[role];
  const currentPath = window.location.pathname;

  // 🚫 Block unauthorized dashboard access
  if (!currentPath.startsWith(allowedPath)) {
    window.location.href = `${allowedPath}dashboard.html`;
  }
});
