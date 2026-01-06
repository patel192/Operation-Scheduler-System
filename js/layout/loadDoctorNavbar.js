// js/load-doctor-navbar.js

import { auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

async function loadNavbar() {
  try {
    const res = await fetch("/components/doctor-navbar.html");
    const html = await res.text();

    // Insert navbar at top
    document.body.insertAdjacentHTML("afterbegin", html);

    // Mobile menu toggle
    const menuBtn = document.getElementById("menuBtn");
    const mobileMenu = document.getElementById("mobileMenu");
    const alertBtn = document.getElementById("alertBtn");

    if (alertBtn) {
      alertBtn.addEventListener("click", () => {
        window.location.href = "/doctor/alerts.html";
      });
    }

    menuBtn?.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });

    // Logout buttons
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
    document
      .getElementById("logoutBtnMobile")
      ?.addEventListener("click", logout);

    // Highlight active link
    highlightActiveNav();
  } catch (err) {
    console.error("Failed to load doctor navbar:", err);
  }
}

function highlightActiveNav() {
  const current = window.location.pathname;

  document.querySelectorAll("[data-nav]").forEach((link) => {
    const href = link.getAttribute("href");

    if (current.startsWith(href)) {
      link.classList.add("active");
    }
  });
}

async function logout() {
  await signOut(auth);
  window.location.href = "/login.html";
}

loadNavbar();
