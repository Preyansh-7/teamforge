// Paste your Firebase project's config below.
// Find it in Firebase Console -> Project settings -> General -> "Your apps" -> SDK setup and configuration.
// This config is safe to expose publicly - it is NOT a secret. Real security comes from Firestore
// security rules (firestore.rules) and Firebase Auth, not from hiding these values.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAOblY63PFj_4V-cp-X3kGfLGMcjIoCe8w",
  authDomain: "teamforge-d51cd.firebaseapp.com",
  projectId: "teamforge-d51cd",
  storageBucket: "teamforge-d51cd.firebasestorage.app",
  messagingSenderId: "132174351338",
  appId: "1:132174351338:web:782e93442eddee9b8bc093",
  measurementId: "G-8BSHK3F3NH"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
