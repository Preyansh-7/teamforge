import { db } from "../firebase-config.js";
import {
  collection, getDocs, addDoc, updateDoc, doc, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function listActiveSkills() {
  const q = query(collection(db, "skills"), where("active", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name));
}

// Admin only.
export async function listAllSkills() {
  const snap = await getDocs(collection(db, "skills"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function addSkill(name, category, adminUid) {
  return addDoc(collection(db, "skills"), {
    name, category: category || null, active: true, createdBy: adminUid
  });
}

// Soft-disable rather than hard delete, so existing profiles/projects that reference
// this skillId don't silently break.
export async function setSkillActive(skillId, active) {
  return updateDoc(doc(db, "skills", skillId), { active });
}
