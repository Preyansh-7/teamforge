/**
 * One-time script to grant the "admin" custom claim to a user.
 *
 * Run this locally with Node.js, never in the browser and never committed with real
 * credentials. This is the ONLY correct way to create an administrator account -
 * never hardcode an admin check based on email/username in frontend JavaScript.
 *
 * Setup:
 *   1. In Firebase Console -> Project settings -> Service accounts, click
 *      "Generate new private key". Save the downloaded JSON file as
 *      admin-scripts/service-account.json (this file must NEVER be committed to git -
 *      add it to .gitignore immediately).
 *   2. npm install firebase-admin   (run inside admin-scripts/, or adjust the require path)
 *   3. Create the target user's account normally through the app's sign-up page first,
 *      so a Firebase Auth user (and a users/{uid} Firestore doc) already exists.
 *   4. Find that user's UID in Firebase Console -> Authentication -> Users.
 *   5. Run:  node set-admin-claim.js <uid>
 *   6. Have that user sign out and sign back in (or call getIdToken(true) in the app)
 *      so their ID token picks up the new claim.
 *
 * You do not need to run this again for the same account. Run it once per admin you want
 * to create - for a two-person college project, once is usually enough.
 */

const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error("Usage: node set-admin-claim.js <uid>");
    process.exit(1);
  }
  await admin.auth().setCustomUserClaims(uid, { admin: true });

  // Keep the Firestore doc's role field in sync purely for readability in the console -
  // the ACTUAL security decision always comes from the custom claim above, never this field.
  await admin.firestore().collection("users").doc(uid).update({ role: "admin" });

  console.log(`Granted admin claim to uid: ${uid}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
