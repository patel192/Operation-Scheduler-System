import { auth, db } from "../firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const minGapMinutes = document.getElementById("minGapMinutes");
const maxDailySurgeries = document.getElementById("maxDailySurgeries");
const workdayEls = document.querySelectorAll(".workday");
const workStart = document.getElementById("workStart");
const workEnd = document.getElementById("workEnd");

const alertOverrun = document.getElementById("alertOverrun");
const alertTightGap = document.getElementById("alertTightGap");
const alertUpcoming = document.getElementById("alertUpcoming");
const alertUpcomingMinutes = document.getElementById("alertUpcomingMinutes");

const saveBtn = document.getElementById("saveBtn");

/* LOAD */
async function loadPreferences(uid) {
  const ref = doc(db, "doctorPreferences", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const p = snap.data();

  minGapMinutes.value = p.minGapMinutes ?? 30;
  maxDailySurgeries.value = p.maxDailySurgeries ?? 6;

  workdayEls.forEach(cb => {
    cb.checked = p.workingHours?.days?.includes(cb.value);
  });

  workStart.value = p.workingHours?.start || "09:00";
  workEnd.value = p.workingHours?.end || "18:00";

  alertOverrun.checked = p.alertSettings?.overrun ?? true;
  alertTightGap.checked = p.alertSettings?.tightGap ?? true;
  alertUpcoming.checked = p.alertSettings?.upcoming ?? true;
  alertUpcomingMinutes.value = p.alertSettings?.upcomingMinutes ?? 15;
}

/* SAVE */
async function savePreferences(uid) {
  const days = [...workdayEls]
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  const payload = {
    minGapMinutes: Number(minGapMinutes.value),
    maxDailySurgeries: Number(maxDailySurgeries.value),
    workingHours: {
      days,
      start: workStart.value,
      end: workEnd.value
    },
    alertSettings: {
      overrun: alertOverrun.checked,
      tightGap: alertTightGap.checked,
      upcoming: alertUpcoming.checked,
      upcomingMinutes: Number(alertUpcomingMinutes.value)
    },
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, "doctorPreferences", uid), payload, { merge: true });
  alert("Preferences saved");
}

/* INIT */
auth.onAuthStateChanged(user => {
  if (!user) return;

  loadPreferences(user.uid);
  saveBtn.onclick = () => savePreferences(user.uid);
});
