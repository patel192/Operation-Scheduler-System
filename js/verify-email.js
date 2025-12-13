// ================================
// IMPORTS
// ================================
import { auth } from "./firebase.js";
import {
  sendEmailVerification,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// ================================
// ELEMENTS
// ================================
const emailDisplay = document.getElementById("user-email");
const resendBtn = document.getElementById("resend-btn");
const goLoginBtn = document.getElementById("go-login");

// ================================
// LOAD USER EMAIL + AUTO VERIFY CHECK
// ================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // If no user is logged in, send them to login
    window.location.href = "login.html";
    return;
  }

  // Show user's email
  emailDisplay.textContent = user.email;

  // If already verified, skip this screen
  if (user.emailVerified) {
    window.location.href = "login.html";
  }
});

// ================================
// RESEND EMAIL VERIFICATION
// ================================
resendBtn.addEventListener("click", async () => {
  const user = auth.currentUser;

  if (!user) {
    alert("No user found. Please log in again.");
    return;
  }

  resendBtn.disabled = true;
  resendBtn.textContent = "Sending...";

  try {
    await sendEmailVerification(user);

    alert("Verification email sent! Check your inbox.");

    // Begin 30-second cooldown timer
    startCooldown(30);

  } catch (err) {
    console.error(err);
    alert("Failed to send verification email. Try again.");
    resendBtn.disabled = false;
    resendBtn.textContent = "Resend Verification Email";
  }
});

// ================================
// COOLDOWN TIMER (prevents spam)
// ================================
function startCooldown(seconds) {
  let remaining = seconds;

  const interval = setInterval(() => {
    resendBtn.textContent = `Resend in ${remaining}s`;
    remaining--;

    if (remaining < 0) {
      clearInterval(interval);
      resendBtn.disabled = false;
      resendBtn.textContent = "Resend Verification Email";
    }
  }, 1000);
}

// ================================
// CONTINUE TO LOGIN
// ================================
goLoginBtn.addEventListener("click", () => {
  window.location.href = "login.html";
});
