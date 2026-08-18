import { db } from "../firebase-config.js";
import {
  collection, addDoc, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Both messages and typing status live as subcollections under the project doc
// (projects/{projectId}/messages, projects/{projectId}/typing) rather than a flat top-level
// collection. That lets the security rule check membership once against the parent project
// (via get()) instead of needing every query to carry a matching where() clause - see the long
// comment in firestore.rules if you want the full "why" on that pattern.

export function watchMessages(projectId, callback, messageLimit = 200) {
  const q = query(
    collection(db, "projects", projectId, "messages"),
    orderBy("createdAt", "asc"),
    limit(messageLimit)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error("Message listener error:", err);
    callback(null, err);
  });
}

export async function sendMessage(projectId, authorUid, authorName, text) {
  return addDoc(collection(db, "projects", projectId, "messages"), {
    authorUid,
    authorName, // denormalized so the chat can render without an extra profile read per message
    text,
    createdAt: serverTimestamp()
  });
}

const TYPING_STALE_MS = 4000; // a typing doc older than this is treated as "stopped typing"

export function watchTyping(projectId, currentUid, callback) {
  const q = collection(db, "projects", projectId, "typing");
  return onSnapshot(q, (snap) => {
    const now = Date.now();
    const typers = snap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter(t => t.uid !== currentUid && t.updatedAt && (now - t.updatedAt.toMillis()) < TYPING_STALE_MS);
    callback(typers);
  }, (err) => console.error("Typing listener error:", err));
}

export async function setTyping(projectId, uid, name) {
  return setDoc(doc(db, "projects", projectId, "typing", uid), { name, updatedAt: serverTimestamp() });
}

export async function clearTyping(projectId, uid) {
  return deleteDoc(doc(db, "projects", projectId, "typing", uid)).catch(() => {});
}
