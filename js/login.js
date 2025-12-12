import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const loginBtn = document.getElementById("login-btn");
loginForm.addEventListener("submit",async (e)=>{
   e.preventDefault();

   const email = emailInput.value.trim();
   const password = passwordInput.value.trim();

   if(!email || !password){
    alert("Please enter both email and password.");
    return;
   }

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try{
    const result = await signInWithEmailAndPassword(auth,email,password);
    const user = result.user;

    const userRef = doc(db,"users",user.uid);
    const userSnap = await getDoc(userRef);

    if(!userSnap.exists()){
        alert("No User Data Found!");
        return;
    }

    const userData = userSnap.data();
    await updateDoc(userRef,{
        "metaData.lastLogin":serverTimestamp(),
    });

    if(userData.role === "admin"){
        window.location.href = "/admin/dashboard.html";
    }else{
        window.location.href = "/user/dashboard.html";
    }
    }catch(err){
   console.error("Login Error:",err);
    let message = "Login failed. Try again.";

    if (err.code === "auth/user-not-found") message = "No user found with this email.";
    if (err.code === "auth/wrong-password") message = "Incorrect password.";
    if (err.code === "auth/invalid-email") message = "Invalid email format.";

    alert(message);
    }finally{
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
    }
});