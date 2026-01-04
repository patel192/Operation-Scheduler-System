import { auth, db } from "../firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ELEMENTS */
const el = {
  img: document.getElementById("profileImage"),
  name: document.getElementById("doctorName"),
  dept: document.getElementById("doctorDepartment"),
  statusDot: document.getElementById("statusDot"),
  roleBadge: document.getElementById("roleBadge"),
  statusBadge: document.getElementById("statusBadge"),

  fullName: document.getElementById("fullName"),
  email: document.getElementById("email"),
  phone: document.getElementById("phone"),
  department: document.getElementById("department"),
  role: document.getElementById("role"),
  accountStatus: document.getElementById("accountStatus"),
  joinedOn: document.getElementById("joinedOn"),
  lastLogin: document.getElementById("lastLogin"),
};

/* HELPERS */
const formatDate = (ts) =>
  ts ? ts.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

function applyStatus(status) {
  const active = status === "active";

  el.statusDot.className =
    "absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white " +
    (active ? "bg-green-500" : "bg-red-500");

  el.statusBadge.textContent = active ? "Active" : "Disabled";
  el.statusBadge.className =
    "px-3 py-1 rounded-full text-xs font-semibold " +
    (active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700");

  el.accountStatus.textContent = active ? "Active" : "Disabled";
  el.accountStatus.className =
    "font-semibold text-base " +
    (active ? "text-green-600" : "text-red-600");
}

/* LOAD PROFILE */
async function loadProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return;

  const d = snap.data();

  /* RANDOM STABLE IMAGE */
  el.img.src = `https://picsum.photos/seed/${user.uid}/160`;

  el.name.textContent = d.displayName || "Doctor";
  el.dept.textContent = d.department || "Unassigned";

  el.roleBadge.textContent = d.role || "Doctor";
  el.roleBadge.className =
    "px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700";

  applyStatus(d.status);

  el.fullName.textContent = d.displayName || "—";
  el.email.textContent = d.email || "—";
  el.phone.textContent = d.phone || "—";
  el.department.textContent = d.department || "—";
  el.role.textContent = d.role || "—";
  el.joinedOn.textContent = formatDate(d.metaData?.createdAt);
  el.lastLogin.textContent = formatDate(d.metaData?.lastLogin);
}

/* INIT */
auth.onAuthStateChanged((u) => u && loadProfile());
