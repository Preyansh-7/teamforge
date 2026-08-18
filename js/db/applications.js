import { db } from "../firebase-config.js";
import {
  collection, addDoc, doc, getDocs, updateDoc, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { addMemberTransactional } from "./projects.js";

export async function applyToProject(projectId, ownerUid, applicantUid, message, matchScore) {
  // Block duplicate active applications from the same student to the same project.
  const existing = await getDocs(query(
    collection(db, "applications"),
    where("projectId", "==", projectId),
    where("applicantUid", "==", applicantUid)
  ));
  const activeDuplicate = existing.docs.find(d => ["pending", "accepted"].includes(d.data().status));
  if (activeDuplicate) throw new Error("You already have an active application for this project.");

  return addDoc(collection(db, "applications"), {
    projectId,
    ownerUid,
    applicantUid,
    message: message || null,
    matchScore: matchScore || 0,
    status: "pending",
    createdAt: serverTimestamp()
  });
}

export async function withdrawApplication(applicationId) {
  return updateDoc(doc(db, "applications", applicationId), { status: "withdrawn" });
}

export async function listApplicationsForApplicant(uid) {
  const snap = await getDocs(query(collection(db, "applications"), where("applicantUid", "==", uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listApplicationsForProject(projectId) {
  const snap = await getDocs(query(collection(db, "applications"), where("projectId", "==", projectId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Firestore rejects a query up front if it can't prove every possible result would pass the
// security rule - it doesn't post-filter. The "applications" read rule checks ownerUid == you,
// so a project owner's query has to filter on ownerUid directly (not just projectId) or Firestore
// throws "Missing or insufficient permissions" even though every matching doc would be theirs.
// Use this from project-detail.html; the unfiltered version above stays for admin use, where the
// isAdmin() rule branch doesn't depend on resource.data at all, so no matching filter is needed.
export async function listApplicationsForOwner(projectId, ownerUid) {
  const q = query(
    collection(db, "applications"),
    where("projectId", "==", projectId),
    where("ownerUid", "==", ownerUid)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function acceptApplication(applicationId, projectId, applicantUid, role) {
  await addMemberTransactional(projectId, applicantUid, role);
  return updateDoc(doc(db, "applications", applicationId), { status: "accepted" });
}

export async function rejectApplication(applicationId) {
  return updateDoc(doc(db, "applications", applicationId), { status: "rejected" });
}
