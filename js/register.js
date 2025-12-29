// ================================
// IMPORTS
// ================================
import { googleProvider, auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ================================
// ELEMENTS
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
// STATE
// ================================
const isGoogleSignup =
  new URLSearchParams(window.location.search).get("google") === "1";

let userData = {
  displayName: "",
  email: "",
  password: "",
  phone: "",
  department: "",
  role: "",
  roles: [],
};

// ================================
// STEP NAVIGATION
// ================================
next1.onclick = () => {
  const name = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !email || (!isGoogleSignup && !password)) {
    alert("Fill all fields");
    return;
  }

  Object.assign(userData, { displayName: name, email, password });
  step1.classList.add("hidden");
  step2.classList.remove("hidden");
};

next2.onclick = () => {
  const phone = document.getElementById("phone").value.trim();
  const dept = document.getElementById("department").value;

  if (!phone || !dept) {
    alert("Fill all fields");
    return;
  }

  Object.assign(userData, { phone, department: dept });
  step2.classList.add("hidden");
  step3.classList.remove("hidden");
};

back2.onclick = () => {
  step2.classList.add("hidden");
  step1.classList.remove("hidden");
};

back3.onclick = () => {
  step3.classList.add("hidden");
  step2.classList.remove("hidden");
};

// ================================
// ROLE SELECTION
// ================================
document.querySelectorAll(".roleCard").forEach((card) => {
  card.onclick = () => {
    document
      .querySelectorAll(".roleCard")
      .forEach((c) => c.classList.remove("border-blue-500", "bg-blue-100"));

    card.classList.add("border-blue-500", "bg-blue-100");
    userData.role = card.dataset.role;
    userData.roles = [userData.role];
  };
});

// ================================
// SUBMIT
// ================================
submitAccount.onclick = async () => {
  if (!userData.role) {
    alert("Select role");
    return;
  }

  try {
    // GOOGLE USER → ONLY UPDATE FIRESTORE
    if (isGoogleSignup) {
      const user = auth.currentUser;

      await updateDoc(doc(db, "users", user.uid), {
        phone: userData.phone,
        department: userData.department,
        role: userData.role,
        roles: [userData.role],
        "metaData.lastLogin": serverTimestamp(),
      });

      window.location.href = "/login.html";
      return;
    }

    // EMAIL USER → CREATE AUTH + FIRESTORE
    const cred = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );

    await updateProfile(cred.user, {
      displayName: userData.displayName,
    });

    await sendEmailVerification(cred.user);

    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      displayName: userData.displayName,
      email: userData.email,
      phone: userData.phone,
      department: userData.department,
      role: userData.role,
      roles: [userData.role],
      status: "pending",
      approved:false,
      emailVerified: false,
      metaData: {
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      },
    });

    window.location.href = "/verify-email.html";
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

// ================================
// GOOGLE SIGNUP BUTTON
// ================================
googleBtn.onclick = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const ref = doc(db, "users", result.user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: result.user.uid,
      email: result.user.email,
      role: "",
      metaData: { createdAt: serverTimestamp() },
      approved:false,
      status: "pending",
    });
  }

  window.location.href = "/register.html?google=1";
};
