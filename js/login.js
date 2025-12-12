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
// NORMAL LOGIN
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
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User data not found.");
      return;
    }

    const userData = userSnap.data();

    await updateDoc(userRef, {
      "metaData.lastLogin": serverTimestamp(),
    });

    // ROLE-BASED REDIRECTION
    redirectUser(userData.role);

  } catch (err) {
    console.error("Login Error:", err);
    let msg = "Login failed.";

    if (err.code === "auth/user-not-found") msg = "No user found.";
    if (err.code === "auth/wrong-password") msg = "Incorrect password.";
    if (err.code === "auth/invalid-email") msg = "Invalid email.";

    alert(msg);
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
    const user = result.user;
    const uid = user.uid;

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    // ⭐ NEW GOOGLE USER → Send to register to complete steps
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid,
        displayName: user.displayName,
        email: user.email,
        phone: user.phoneNumber || "",
        profilePic: user.photoURL || "",
        department: "",
        role: "",
        roles: [],
        status: "active",
        createdBy: uid,
        metaData: {
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        },
      });

      window.location.href = "/register.html?google=1";
      return;
    }

    // ⭐ EXISTING USER → Update login time
    await updateDoc(userRef, {
      "metaData.lastLogin": serverTimestamp(),
    });

    const data = userSnap.data();

    // ⭐ USER EXISTS BUT HAS NO ROLE → Continue registration
    if (!data.role || data.role.trim() === "") {
      window.location.href = "/register.html?google=1";
      return;
    }

    // ⭐ ROLE FOUND → Redirect properly
    redirectUser(data.role);

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
    // Should not happen normally
    window.location.href = "/register.html?google=1";
    return;
  }

  const lower = role.toLowerCase();

  if (lower === "admin") {
    window.location.href = "/admin/dashboard.html";
  } else {
    window.location.href = "/user/dashboard.html";
  }
}
