import { auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

async function loadNavbar() {
  const res = await fetch("/components/admin-navbar.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("afterbegin", html);

  // Mobile toggle
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  menuBtn?.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  // Logout
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document.getElementById("logoutBtnMobile")?.addEventListener("click", logout);

  // Active link highlight
  highlightActiveNav();
}

function highlightActiveNav() {
  const current = window.location.pathname;
  document.querySelectorAll("[data-nav]").forEach(link => {
    if (current === link.getAttribute("href")) {
      link.classList.add("active");
    }
  });
}

async function logout() {
  await signOut(auth);
  window.location.href = "/login.html";
}

loadNavbar();
