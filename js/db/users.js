import { db } from "../firebase-config.js";
import {
  doc, getDoc, updateDoc, collection, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(uid, data) {
  return updateDoc(doc(db, "users", uid), data);
}

// Admin only (enforced by Firestore rules, not just this function).
export async function listAllUsers() {
  const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setUserStatus(uid, status) {
  return updateDoc(doc(db, "users", uid), { status });
}
