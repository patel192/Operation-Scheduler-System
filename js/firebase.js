// Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";


// Firebase Services
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDA2kBvEpF6WU5J54XyY7vIU6zAVKukkF8",
  authDomain: "operation-scheduler-a44f8.firebaseapp.com",
  projectId: "operation-scheduler-a44f8",
  storageBucket: "operation-scheduler-a44f8.firebasestorage.app",
  messagingSenderId: "186568524950",
  appId: "1:186568524950:web:26b335e2d8866aa240eeb7",
  measurementId: "G-HX7YXB9ET7",
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Export services to use anywhere
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();
