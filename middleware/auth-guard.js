import { auth, db } from "/js/firebase.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, getDoc } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

console.log("🛡️ AUTH GUARD LOADED");

/* ================= CONFIG ================= */
const ROLE_CONFIG = {
  Admin: { base: "/admin/", dashboard: "/admin/dashboard.html" },
  Doctor: { base: "/doctor/", dashboard: "/doctor/dashboard.html" },
  "OT Staff": { base: "/ot/", dashboard: "/ot/dashboard.html" },
  Patient: { base: "/patient/", dashboard: "/patient/dashboard.html" },
};

/* PUBLIC PAGES — NEVER GUARD */
const PUBLIC_PAGES = [
  "/login.html",
  "/register.html",
  "/pending-approval.html",
  "/",
  "/index.html",
];

/* ================= AUTH GUARD ================= */
onAuthStateChanged(auth, async (user) => {
  const currentPath = window.location.pathname;

  console.log("🔐 Auth state changed:", currentPath);

  /* ✅ Allow public pages without interference */
  if (PUBLIC_PAGES.includes(currentPath)) {
    console.log("🟢 Public page — skipping guard");
    return;
  }

  /* NOT LOGGED IN */
  if (!user) {
    console.warn("🚫 Not logged in");
    window.location.replace("/login.html");
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    window.location.replace("/register.html?step=profile");
    return;
  }

  const { role, status, approved } = snap.data();

  /* STATUS */
  if (status === "disabled") {
    await signOut(auth);
    alert("Your account has been disabled.");
    window.location.replace("/login.html");
    return;
  }

  /* APPROVAL */
  if (!approved) {
    window.location.replace("/pending-approval.html");
    return;
  }

  const roleConfig = ROLE_CONFIG[role];
  if (!roleConfig) {
    window.location.replace("/register.html?step=role");
    return;
  }

  const { base, dashboard } = roleConfig;

  /* 🚫 Block cross-role access ONLY inside protected area */
  if (currentPath.startsWith("/admin") ||
      currentPath.startsWith("/doctor") ||
      currentPath.startsWith("/ot") ||
      currentPath.startsWith("/patient")) {

    if (!currentPath.startsWith(base)) {
      console.warn("🚫 Cross-role access blocked");
      window.location.replace(dashboard.html);
      return;
    }
  }

  /* ROOT OF ROLE → DASHBOARD */
  if (
    currentPath === base ||
    currentPath === `${base}index.html`
  ) {
    window.location.replace(dashboard.html);
    return;
  }

  console.log("✅ Access granted");
});
