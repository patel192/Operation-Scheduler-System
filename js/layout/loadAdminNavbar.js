import { auth } from "../firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

async function loadNavbar() {
  const res = await fetch("/components/admin-navbar.html");
  const html = await res.text();

  document.body.insertAdjacentHTML("afterbegin", html);

  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  menuBtn?.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document.getElementById("logoutBtnMobile")?.addEventListener("click", logout);
}

async function logout() {
  await signOut(auth);
  window.location.href = "/login.html";
}

loadNavbar();
