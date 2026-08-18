import { db } from "../firebase-config.js";
import {
  collection, getDocs, addDoc, updateDoc, doc, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function listActiveCategories() {
  const q = query(collection(db, "categories"), where("active", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function listAllCategories() {
  const snap = await getDocs(collection(db, "categories"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function addCategory(name) {
  return addDoc(collection(db, "categories"), { name, active: true });
}

export async function setCategoryActive(categoryId, active) {
  return updateDoc(doc(db, "categories", categoryId), { active });
}
