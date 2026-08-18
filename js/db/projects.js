import { db } from "../firebase-config.js";
import {
  collection, addDoc, doc, getDoc, updateDoc, getDocs, query, where, orderBy,
  serverTimestamp, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function createProject(ownerUid, data) {
  return addDoc(collection(db, "projects"), {
    ...data,
    ownerUid,
    members: [{ uid: ownerUid, role: "Owner" }],
    memberUids: [ownerUid],
    status: "open",
    createdAt: serverTimestamp()
  });
}

export async function getProject(projectId) {
  const snap = await getDoc(doc(db, "projects", projectId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listOpenProjects() {
  const q = query(
    collection(db, "projects"),
    where("status", "in", ["open", "in_progress"]),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Admin only.
export async function listAllProjects() {
  const snap = await getDocs(query(collection(db, "projects"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listProjectsByOwner(uid) {
  const q = query(collection(db, "projects"), where("ownerUid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listJoinedProjects(uid) {
  const q = query(collection(db, "projects"), where("memberUids", "array-contains", uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateProject(projectId, data) {
  return updateDoc(doc(db, "projects", projectId), data);
}

// Runs inside a Firestore transaction so two applicants can't both get accepted
// past maxTeamSize if they're approved at nearly the same time.
export async function addMemberTransactional(projectId, uid, role) {
  const ref = doc(db, "projects", projectId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Project not found");
    const project = snap.data();
    if ((project.members || []).length >= project.maxTeamSize) {
      throw new Error("This team is already full");
    }
    if ((project.memberUids || []).includes(uid)) {
      throw new Error("This student is already a member");
    }
    tx.update(ref, {
      members: [...(project.members || []), { uid, role: role || "Member" }],
      memberUids: [...(project.memberUids || []), uid]
    });
  });
}
