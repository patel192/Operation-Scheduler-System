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
// ENSURE FIRESTORE USER DOC
// ================================
async function ensureUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  // 🆕 FIRST LOGIN → CREATE USER DOC (PENDING)
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
      status: "pending",
      approved: false,
      createdBy: user.uid,
      metaData: {
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      },
    });

    return "__PENDING__";
  }

  const data = snap.data();

  // 🚫 DISABLED USER
  if (data.status === "disabled") {
    await signOut(auth);
    alert("Your account has been disabled by admin.");
    return "__BLOCKED__";
  }

  // ⏳ NOT APPROVED YET → DO NOT SIGN OUT
  if (data.approved !== true || data.status === "pending") {
    alert("Your account is awaiting admin approval.");
    return "__PENDING__";
  }

  // ✅ UPDATE LAST LOGIN
  await updateDoc(ref, {
    "metaData.lastLogin": serverTimestamp(),
  });

  return data;
}

// ================================
// EMAIL + PASSWORD LOGIN
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

    if (userData === "__BLOCKED__") return;

    // ⏳ PENDING → SEND TO WAITING PAGE
    if (userData === "__PENDING__") {
      window.location.replace("/pending-approval.html");
      return;
    }

    redirectUser(userData.role);

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

    if (userData === "__BLOCKED__") return;

    if (userData === "__PENDING__") {
      window.location.replace("/pending-approval.html");
      return;
    }

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
// ROLE REDIRECT
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

  window.location.href = ROLE_ROUTES[role] || "/login.html";
}
