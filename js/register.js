// ================================
// IMPORTS
// ================================
import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  doc,
  setDoc,
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


// ================================
// USER DATA (TEMP STORAGE)
// ================================
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
  createdBy: "self", // later replaced with uid
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
// ROLE SELECTOR
// ================================
const roleCards = document.querySelectorAll(".roleCard");
let selectedRole = null;

roleCards.forEach((card) => {
  card.addEventListener("click", () => {
    // remove highlights
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
// FINAL SUBMISSION → Firebase
// ================================
submitAccount.addEventListener("click", async () => {
  if (!selectedRole) {
    alert("Please select a role.");
    return;
  }

  try {
    // 1️⃣ Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );

    const uid = userCredential.user.uid;

    // 2️⃣ Update Firebase Auth profile
    await updateProfile(userCredential.user, {
      displayName: userData.displayName,
    });

    // 3️⃣ Prepare Firestore user object
    const saveUser = {
      uid,
      displayName: userData.displayName,
      email: userData.email,
      phone: userData.phone,
      department: userData.department,
      role: userData.role,
      roles: userData.roles,
      profilePic: userData.profilePic || "",
      status: "active",
      createdBy: uid,
      metaData: {
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      },
    };

    // 4️⃣ Save into Firestore
    await setDoc(doc(db, "users", uid), saveUser);

    // 5️⃣ Redirect
    window.location.href = "/dashboard.html";

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});
