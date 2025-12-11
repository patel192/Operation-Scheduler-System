import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDA2kBvEpF6WU5J54XyY7vIU6zAVKukkF8",
  authDomain: "operation-scheduler-a44f8.firebaseapp.com",
  projectId: "operation-scheduler-a44f8",
  storageBucket: "operation-scheduler-a44f8.firebasestorage.app",
  messagingSenderId: "186568524950",
  appId: "1:186568524950:web:26b335e2d8866aa240eeb7",
  measurementId: "G-HX7YXB9ET7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
