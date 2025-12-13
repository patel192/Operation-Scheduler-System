// ================================
// IMPORTS
// ================================
import { auth } from "./firebase.js";

import {
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// ================================
// ELEMENTS
// ================================
const form = document.getElementById("forgot-form");
const emailInput = document.getElementById("forgot-email");
const resetBtn = document.getElementById("reset-btn");

// ================================
// HANDLER
// ================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();

  if (!email) {
    alert("Please enter your email.");
    return;
  }

  resetBtn.disabled = true;
  resetBtn.textContent = "Sending...";

  try {
    await sendPasswordResetEmail(auth, email);

    alert("Password reset link sent! Check your email inbox.");

    // Optional redirect after 1.5 sec
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);

  } catch (err) {
    console.error("Reset error:", err);

    let message = "Failed to send reset link.";

    if (err.code === "auth/user-not-found") {
      message = "No account found with this email.";
    }
    if (err.code === "auth/invalid-email") {
      message = "Invalid email format.";
    }
    if (err.code === "auth/too-many-requests") {
      message = "Too many attempts. Try again later.";
    }

    alert(message);

  } finally {
    resetBtn.disabled = false;
    resetBtn.textContent = "Send Reset Link";
  }
});
