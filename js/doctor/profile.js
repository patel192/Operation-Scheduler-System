import { auth, db } from "../firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const doctorName = document.getElementById("doctorName");
const doctorEmail = document.getElementById("doctorEmail");
const doctorDepartment = document.getElementById("doctorDepartment");

const upcomingWindow = document.getElementById("upcomingWindow");
const minGap = document.getElementById("minGap");
const workStart = document.getElementById("workStart");
const workEnd = document.getElementById("workEnd");
const alertToggle = document.getElementById("alertToggle");

const saveBtn = document.getElementById("savePrefsBtn");
const saveStatus = document.getElementById("saveStatus");

/* LOAD PROFILE + PREFS */
async function loadProfile(uid, user) {
  doctorName.textContent = user.displayName || "Doctor";
  doctorEmail.textContent = user.email || "—";

  const ref = doc(db, "doctorProfiles", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data();

  doctorDepartment.textContent = data.department || "—";

  upcomingWindow.value = data.upcomingWindowMinutes ?? 15;
  minGap.value = data.minGapMinutes ?? 30;

  if (data.workingHours) {
    workStart.value = data.workingHours.start || "";
    workEnd.value = data.workingHours.end || "";
  }

  alertToggle.checked = data.enableAlerts !== false;
}

/* SAVE PREFS */
async function savePreferences(uid) {
  const payload = {
    upcomingWindowMinutes: Number(upcomingWindow.value) || 15,
    minGapMinutes: Number(minGap.value) || 30,
    enableAlerts: alertToggle.checked,
    workingHours: {
      start: workStart.value || null,
      end: workEnd.value || null
    },
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, "doctorProfiles", uid), payload, { merge: true });

  saveStatus.classList.remove("hidden");
  setTimeout(() => saveStatus.classList.add("hidden"), 2500);
}

/* INIT */
auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  await loadProfile(user.uid, user);

  saveBtn.onclick = () => savePreferences(user.uid);
});
