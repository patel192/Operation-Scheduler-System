// ================================
// IMPORTS
// ================================
import { googleProvider, auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ================================
// STEP ELEMENTS
// ================================
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");

const next1 = document.getElementById("next1");
const next2 = document.getElementById("next2");
const back2 = document.getElementById("back2");
const back3 = document.getElementById("back3");
const submitAccount = document.getElementById("submitAccount");

const stepLabel = document.getElementById("stepLabel");

const googleBtn = document.getElementById("googleSignUp");

// ================================
// STATE VARIABLES
// ================================
let isGoogleSignup = false;

let userData = {
  displayName: "",
  email: "",
  password: "",
  phone: "",
  department: "",
  role: "",
  roles: [],
  profilePic: "",
  status: "active",
  createdBy: "self",
  metaData: {},
};

// ================================
// STEP 1 → STEP 2
// ================================
next1.addEventListener("click", () => {
  const displayName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!displayName || !email || !password) {
    alert("Please fill all fields.");
    return;
  }

  userData.displayName = displayName;
  userData.email = email;
  userData.password = password;

  step1.classList.add("hidden");
  step2.classList.remove("hidden");
  stepLabel.textContent = "Step 2 of 3";
});

// ================================
// STEP 2 → STEP 3
// ================================
next2.addEventListener("click", () => {
  const phone = document.getElementById("phone").value.trim();
  const department = document.getElementById("department").value;

  if (!phone || !department) {
    alert("Please enter phone number & department.");
    return;
  }

  userData.phone = phone;
  userData.department = department;

  step2.classList.add("hidden");
  step3.classList.remove("hidden");
  stepLabel.textContent = "Step 3 of 3";
});

// ================================
// BACK BUTTONS
// ================================
back2.addEventListener("click", () => {
  step2.classList.add("hidden");
  step1.classList.remove("hidden");
  stepLabel.textContent = "Step 1 of 3";
});

back3.addEventListener("click", () => {
  step3.classList.add("hidden");
  step2.classList.remove("hidden");
  stepLabel.textContent = "Step 2 of 3";
});

// ================================
// ROLE SELECTION
// ================================
const roleCards = document.querySelectorAll(".roleCard");
let selectedRole = null;

roleCards.forEach((card) => {
  card.addEventListener("click", () => {
    roleCards.forEach((c) =>
      c.classList.remove("border-blue-500", "bg-blue-100")
    );

    card.classList.add("border-blue-500", "bg-blue-100");

    selectedRole = card.dataset.role;

    userData.role = selectedRole;
    userData.roles = [selectedRole];

    console.log("Selected Role:", selectedRole);
  });
});

// ================================
// FINAL SUBMISSION (NORMAL + GOOGLE SIGNUP)
// ================================
submitAccount.addEventListener("click", async () => {
  if (!selectedRole) {
    alert("Please select a role.");
    return;
  }

  try {
    let uid;

    // ⭐ GOOGLE SIGNUP FLOW (ALWAYS setDoc)
    if (isGoogleSignup) {
      const user = auth.currentUser;
      uid = user.uid;

      const saveUser = {
        uid,
        displayName: user.displayName,
        email: user.email,
        phone: userData.phone || "",
        department: userData.department || "",
        role: userData.role,
        roles: [userData.role],
        profilePic: user.photoURL || "",
        status: "active",
        createdBy: uid,
        metaData: {
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        },
      };

      await setDoc(doc(db, "users", uid), saveUser);

      window.location.href = "login.html";
      return;
    }

    // ⭐ NORMAL EMAIL/PASSWORD SIGNUP
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );

    uid = userCredential.user.uid;

    await updateProfile(userCredential.user, {
      displayName: userData.displayName,
    });

    const saveUser = {
      uid,
      displayName: userData.displayName,
      email: userData.email,
      phone: userData.phone,
      department: userData.department,
      role: userData.role,
      roles: [userData.role],
      profilePic: "",
      status: "active",
      createdBy: uid,
      metaData: {
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      },
    };

    await setDoc(doc(db, "users", uid), saveUser);

    window.location.href = "login.html";
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

// ================================
// GOOGLE SIGN-UP
// ================================
googleBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    // ⭐ NEW GOOGLE USER → Continue with Step-3
    if (!userSnap.exists()) {
      isGoogleSignup = true;

      userData.displayName = user.displayName;
      userData.email = user.email;
      userData.profilePic = user.photoURL || "";
      userData.createdBy = user.uid;

      step1.classList.add("hidden");
      step2.classList.add("hidden");
      step3.classList.remove("hidden");
      stepLabel.textContent = "Step 3 of 3";

      return;
    }

    // ⭐ EXISTING GOOGLE USER → update timestamp
    await updateDoc(userRef, {
      "metaData.lastLogin": serverTimestamp(),
    });

    const data = userSnap.data();

    if (!data.role) {
      step1.classList.add("hidden");
      step2.classList.add("hidden");
      step3.classList.remove("hidden");
      stepLabel.textContent = "Step 3 of 3";
      return;
    }

    if (data.role === "Admin") {
      window.location.href = "/admin/dashboard.html";
    } else {
      window.location.href = "/user/dashboard.html";
    }
  } catch (err) {
    console.error(err);
    alert("Google SignUp Failed. Try Again.");
  }
});
