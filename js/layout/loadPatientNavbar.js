import { auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

async function loadNavbar() {
  try {
    const res = await fetch("/components/patient-navbar.html");
    const html = await res.text();

    // Insert navbar
    document.body.insertAdjacentHTML("afterbegin", html);

    // Mobile menu toggle
    const menuBtn = document.getElementById("menuBtn");
    const mobileMenu = document.getElementById("mobileMenu");

    menuBtn?.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });

    // Logout
    document.getElementById("logoutBtnMobile")?.addEventListener("click", logout);

    // Highlight active nav
    highlightActiveNav();

  } catch (err) {
    console.error("Failed to load patient navbar:", err);
  }
}

function highlightActiveNav() {
  const currentPath = window.location.pathname;

  document.querySelectorAll("[data-nav]").forEach(link => {
    if (currentPath === link.getAttribute("href")) {
      link.classList.add("active");
    }
  });
}

async function logout() {
  await signOut(auth);
  window.location.href = "/login.html";
}

loadNavbar();
