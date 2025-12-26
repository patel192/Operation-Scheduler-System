// ================================
// IMPORTS
// ================================
import { auth, db, googleProvider } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ================================
// ELEMENTS
// ================================
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const loginBtn = document.getElementById("login-btn");
const googleBtn = document.getElementById("googleBtn");

// ================================
// ENSURE FIRESTORE USER
// ================================
async function ensureUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  // 🆕 AUTO-CREATE USER DOC IF MISSING
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || "",
      email: user.email,
      phone: user.phoneNumber || "",
      profilePic: user.photoURL || "",
      department: "",
      role: "",
      roles: [],
      status: "active",
      createdBy: user.uid,
      metaData: {
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      },
    });
    return null;
  }

  const data = snap.data();

  // 🚫 BLOCK DISABLED USERS
  if (data.status === "disabled") {
    await signOut(auth);
    alert("Your account has been disabled by admin.");
    return "__BLOCKED__";
  }

  // ✅ UPDATE LAST LOGIN
  await updateDoc(ref, {
    "metaData.lastLogin": serverTimestamp(),
  });

  return data;
}

// ================================
// EMAIL LOGIN
// ================================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userData = await ensureUserDoc(result.user);

    // 🚫 BLOCKED USER
    if (userData === "__BLOCKED__") return;

    redirectUser(userData?.role);
  } catch (err) {
    console.error("Login Error:", err);
    alert("Invalid email or password.");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
  }
});

// ================================
// GOOGLE LOGIN
// ================================
googleBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const userData = await ensureUserDoc(result.user);

    // 🚫 BLOCKED USER
    if (userData === "__BLOCKED__") return;

    if (!userData?.role) {
      window.location.href = "/register.html?google=1";
      return;
    }

    redirectUser(userData.role);
  } catch (err) {
    console.error("Google Login Error:", err);
    alert("Google Sign-In failed.");
  }
});

// ================================
// REDIRECT USER BY ROLE
// ================================
function redirectUser(role) {
  if (!role) {
    window.location.href = "/register.html?step=role";
    return;
  }

  const ROLE_ROUTES = {
    Admin: "/admin/dashboard.html",
    Doctor: "/doctor/dashboard.html",
    "OT Staff": "/ot/dashboard.html",
    Patient: "/patient/dashboard.html",
  };

  const target = ROLE_ROUTES[role];
  window.location.href = target || "/login.html";
}
