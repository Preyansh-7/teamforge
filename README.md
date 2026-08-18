# TeamForge — MVP

A working first slice of the platform described in the architecture doc: auth, profiles,
the project marketplace, applications, skill matching, and an admin dashboard for skills,
categories, users, and projects.

Not included in this pass (Phase 2, per the plan): the team workspace/task board, project
update logs, and moderation/reports. The folder structure and Firestore schema already leave
room for them — `tasks`, `updates`, and `reports` collections and rules are stubbed in
`firestore.rules` ready to build against.

## What's here

```
teamforge/
├── index.html            Landing page
├── login.html / signup.html
├── profile-setup.html    First-time profile creation
├── profile-edit.html
├── dashboard.html        My projects / joined projects / applications
├── projects.html         Marketplace: browse, search, filter, sort, match %
├── project-new.html      Create a project
├── project-detail.html   Full detail, apply flow, owner's applications inbox
├── project-chat.html     Live team chat + typing indicators (members only)
├── profile-view.html     Read-only public profile view (?uid=...)
├── admin/index.html      Admin dashboard: users, projects, skills, categories, stats
├── css/base.css, css/components.css
├── js/firebase-config.js  <- put your Firebase project config here
├── js/auth.js
├── js/ui.js
├── js/matching.js         The skill-match algorithm, pure functions
├── js/db/*.js              One file per Firestore collection (includes messages.js for chat)
├── firestore.rules
└── admin-scripts/set-admin-claim.js   One-time script to create your first admin
```

## 1. Set up Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com), create a new project.
2. Add a **Web app** to the project (the `</>` icon on the project overview page). Copy the
   `firebaseConfig` object it gives you.
3. Paste those values into `js/firebase-config.js`, replacing the placeholders. This file is
   safe to expose publicly — it's not a secret; security comes from the rules below, not from
   hiding this file.
4. In the console, enable:
   - **Authentication** → Sign-in method → Email/Password
   - **Firestore Database** → Create database (start in production mode)

## 2. Deploy the security rules

Install the Firebase CLI once: `npm install -g firebase-tools`

```bash
firebase login
firebase init firestore   # point it at this folder, accept the existing firestore.rules
firebase deploy --only firestore:rules
```

If Firestore complains about a missing index the first time you run a query in the app
(e.g. the marketplace's category+status+date query), it will print a direct link in the
browser console to create that index with one click — that's expected, not a bug.

## 3. Seed the skill and category lists

The app expects skills/categories to exist before students can build profiles or post
projects. Two options:

- **Manual (fastest for a demo):** log in as your first user, temporarily grant yourself
  admin (see step 4), and use `/admin/index.html` → Skills / Categories tabs to add a
  starter list (Python, JavaScript, React, Firebase, UI/UX, AI/ML, etc.).
- **Scripted:** write a small one-off Node script using the Admin SDK to bulk-insert your
  starter list — useful if you want the exact same seed data every time you reset Firestore
  during development.

## 4. Create your first admin account

Admin access is granted through a **Firebase custom claim**, never a hardcoded email check
in JavaScript. See `admin-scripts/set-admin-claim.js` for the full one-time script and
instructions. Summary:

1. Sign up normally through `signup.html` with the account you want to be admin.
2. Download a service account key from Firebase Console → Project settings → Service accounts.
3. Run `node admin-scripts/set-admin-claim.js <that user's uid>`.
4. Log out and back in — `/admin/index.html` will now be reachable for that account.

Never commit the service account JSON file to git.

## 5. Team chat

Live chat and typing indicators live at `projects/{projectId}/messages` and
`projects/{projectId}/typing` — subcollections of each project, not a flat top-level
collection. That's deliberate: it lets the security rule check membership once against the
parent project doc (`get()`), so no matching `where()` clause is needed on the query side.
See the long comment in `firestore.rules` if you want the full reasoning — it's the same
underlying Firestore quirk ("security rules aren't filters") that required a fix in
`js/db/applications.js` earlier in development.

No extra composite index is needed for chat — each message query is scoped to a single
project's subcollection with a single `orderBy`, which Firestore handles automatically.

## 6. Run it locally

This is plain static HTML/CSS/JS — no build step. Serve the folder with any static server, e.g.:

```bash
npx serve .
```

or the VS Code "Live Server" extension. Opening the HTML files directly via `file://` will
generally **not** work because Firebase Auth requires a proper origin.

## 7. Deploy

Push this folder to a GitHub repo and import it into [Vercel](https://vercel.com) as a static
site (no framework preset needed — set the root directory to this folder, leave build command
empty). Firebase stays exactly as configured; nothing changes between local dev and production
since the config in `firebase-config.js` is the same either way.

## Known limitations in this MVP pass

- **Team-join writes.** Accepting an application currently adds the member to the project via
  a client-side Firestore transaction, which means the security rule for `projects` has to be
  a bit looser than ideal (see the long comment in `firestore.rules`). The clean fix is a small
  Cloud Function triggered on an application's status flipping to `accepted`. Worth doing before
  a real deployment; fine for a college demo as-is.
- **No image/avatar upload yet.** Firebase Storage isn't wired up. Profile pictures currently
  just use `avatarUrl: null`. Low effort to add later — Storage rules would mirror the
  `users/{uid}` pattern (a user can only write to their own avatar path).
- **No composite indexes pre-declared.** You'll create them on-demand via the console link the
  first time each query runs in a real Firestore project (see step 2).
- **Chat has no history limits or moderation.** Messages aren't editable/deletable by students
  and there's no profanity filtering, rate limiting, or pagination beyond the 200-message cap
  in `watchMessages`. Fine for a college demo; would need hardening for real public use.
- **Phase 2 features still stubbed, not built:** task board, project progress %, standalone
  update logs, reports/moderation queue. The collections and rules are ready; the UI isn't.
  (Team chat and the profile view page, originally also Phase 2/cut items, are now built.)

## Next steps, in the order I'd build them

1. Seed real data and walk through the full flow yourself: sign up two accounts, post a
   project as one, apply as the other, accept, confirm the team size updates, then try the
   team chat from both accounts side by side.
2. Add the Cloud Function for accept-application (closes the security gap above).
3. Build the Phase 2 workspace: `project-workspace.html` with a task list scoped to
   `tasks` where `projectId == this project` and the current user is in `memberUids`.
4. Add the "Recommended for You" section to the dashboard using the same `computeMatch`
   function already in `js/matching.js`, run against `listOpenProjects()`.
