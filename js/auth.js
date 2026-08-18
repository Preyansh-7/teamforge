import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function signUp(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    email,
    role: "student",
    avatarUrl: null,
    bio: "",
    skills: [],
    interests: [],
    experience: "beginner",
    status: "active",
    profileComplete: false,
    createdAt: serverTimestamp()
  });
  return cred.user;
}

export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export function logOut() {
  return signOut(auth);
}

// Fires callback(user, profile, isAdmin) on every auth change, including page load.
// profile is the Firestore users/{uid} document (or null if not created yet / suspended fetch failed).
// isAdmin comes from the verified ID token's custom claim - never from a Firestore field.
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) { callback(null, null, false); return; }
    const tokenResult = await user.getIdTokenResult();
    const isAdmin = tokenResult.claims.admin === true;
    let profile = null;
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      profile = snap.exists() ? snap.data() : null;
    } catch (e) {
      console.error("Could not load profile:", e);
    }
    // A suspended student's Auth session is still technically valid, but they should be
    // treated as signed out everywhere in the UI. Firestore rules independently block their
    // writes too (isActiveUser()) - this is just so the app doesn't keep showing them as
    // logged in while every action silently fails.
    if (profile && profile.status === "suspended" && !isAdmin) {
      await signOut(auth);
      callback(null, null, false);
      return;
    }
    callback(user, profile, isAdmin);
  });
}

// Convenience for pages that require a signed-in user.
// onReady(user, profile, isAdmin) fires once auth resolves to a signed-in user.
// onGuest() fires if there is no signed-in user (use it to redirect to /login.html).
export function requireAuth(onReady, onGuest) {
  return watchAuthState((user, profile, isAdmin) => {
    if (!user) { if (onGuest) onGuest(); return; }
    if (onReady) onReady(user, profile, isAdmin);
  });
}
