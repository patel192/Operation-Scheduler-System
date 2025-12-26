// ================================
// IMPORTS
// ================================
import { auth, db, googleProvider } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
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

  await updateDoc(ref, {
    "metaData.lastLogin": serverTimestamp(),
  });

  return snap.data();
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
    redirectUser(userData?.role);
  } catch (err) {
    console.error(err);
    alert("Invalid credentials.");
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

    if (!userData?.role) {
      window.location.href = "/register.html?google=1";
      return;
    }

    redirectUser(userData.role);
  } catch (err) {
    console.error(err);
    alert("Google Sign-in failed");
  }
});

// ================================
// REDIRECT
// ================================
function redirectUser(role) {
  if (!role) {
    window.location.href = "/register.html?step=role";
    return;
  }

  const map = {
    Admin: "/admin/dashboard.html",
    Doctor: "/doctor/dashboard.html",
    "OT Staff": "/ot/dashboard.html",
    Patient: "/patient/dashboard.html",
  };

  window.location.href = map[role] || "/login.html";
}
