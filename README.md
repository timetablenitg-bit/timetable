# 📅 ATMS — Academic Timetable Management System

> Automated timetable generation for NIT Goa. Feed it courses, faculty, batches, and constraints — get back a clash-free timetable, a short list of items that need a human's judgment, and clean student/faculty/admin portals to view and manage it all.

This project is organized as **three layers working together**:

```
   🗄️  DATA LAYER              🧠  THE BRAIN               👀  THE FACE
  (Node + MongoDB)      →     (Python engine)       →     (React frontend)
   source of truth for          places everything it          shows each role
   courses/faculty/              can, flags what it            their view and
   batches/rules                 can't                          the admin's
                                                                  review queue
```

Knowing which of these three layers a piece of logic belongs to before you go looking for it will save you most of the time you'd otherwise spend hunting.

---

## 🧭 Table of Contents

1. [Why this exists](#1-why-this-exists)
2. [Tech stack](#2-tech-stack)
3. [Repo map](#3-repo-map)
4. [Running it locally](#4-running-it-locally)
5. [The data model](#5-the-data-model)
6. [The scheduling engine, in depth](#6-the-scheduling-engine-in-depth)
7. [Auth model — Google sign-in only](#7-auth-model--google-sign-in-only)
8. [Other features](#8-other-features)
9. [Deployment notes](#9-deployment-notes)
10. [Common workflows — "where do I look?"](#10-common-workflows--where-do-i-look)
11. [Known limitations & rough edges](#11-known-limitations--rough-edges)
12. [Future roadmap & optimization ideas](#12-future-roadmap--optimization-ideas)
13. [A note on scope](#13-a-note-on-scope)

---

## 1. Why this exists

Building a college timetable by hand is a constraint-satisfaction problem: a 5-day × multi-period × 2-track grid, professors who can't be in two places at once, labs that occupy two periods at a time, and courses that need to run in sync with each other. It's not something a spreadsheet handles well.

So the system is split into three layers that each own one part of the problem:

| Layer                       | Owns                                                                                  | Lives in                         |
| --------------------------- | ------------------------------------------------------------------------------------- | -------------------------------- |
| 🗄️ **Data setup**           | Source of truth — sessions, batches, courses, faculty, rooms, and the grid "skeleton" | Node/Express + MongoDB           |
| 🧠 **Scheduling**           | The actual placement algorithm                                                        | Python (spawned as a subprocess) |
| 👀 **Review & consumption** | Manual conflict resolution, slot locking, and everyone's view of the final timetable  | React frontend                   |

---

## 2. Tech stack

| Layer                | Tech                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 🎨 Frontend          | React 19 · Vite · Tailwind v4 · Zustand 5 · React Router v7 · Axios · Recharts · Chart.js · Framer Motion · react-joyride (guided tour) · jsPDF |
| ⚙️ Backend API       | Node.js (ESM) · Express 5 · Mongoose 9 · MongoDB driver 7                                                                                       |
| 🧠 Scheduling engine | Python 3, standard library only — no `requirements.txt`, no `pip install`                                                                       |
| 🔐 Auth              | Google OAuth only, locked to `@nitgoa.ac.in` — see 7                                                                                            |
| 📤 Exports           | ExcelJS (admin `.xlsx`) · jsPDF (student/faculty PDF)                                                                                           |
| ☁️ Deployment        | Backend → Render · Frontend → Vercel                                                                                                            |

---

## 3. Repo map

```
majorfinal/
├── backend/
│   ├── index.js                       Express entry point — every route gets mounted here
│   ├── config/initDB.js               Mongo connection
│   └── src/
│       ├── controllers/
│       │   ├── admin/                 One file per admin resource
│       │   ├── student/               Student-facing controllers
│       │   ├── Publictimetablecontroller.js   Public reads (no login needed)
│       │   └── authController.js
│       ├── routes/
│       │   ├── admin/  student/       Route files, mirror the controllers
│       │   ├── Timetablepublicroutes.js
│       │   └── exportRoutes.js
│       ├── models/                    Mongoose schemas — see 5
│       ├── middleware/authMiddleware.js
│       ├── engine/bridge/timetableEngine.js   Node ↔ Python bridge
│       ├── python_engine/             The algorithm — see 6
│       ├── services/excelExportService.js
│       └── utils/                     Skeleton derivation, availability calc, admin logging
│
└── frontend/
    └── src/
        ├── pages/                     Student.jsx, Faculty.jsx, Incharge.jsx (= admin), HomePage, Documentation, etc.
        ├── components/                Feature-grouped (Batch/, Course/, Incharge/, Faculty/, Student/, Auth/, ...)
        ├── store/                     Zustand — one store per domain
        ├── services/                  Axios wrappers
        ├── tour/                      Guided onboarding walkthrough (react-joyride)
        └── utils/apiPaths.js          BASE_URL + every API path
```

The three **portals** are the three `role` values on `User`:

| Portal            | Route      | Role      | How you get there                                                               |
| ----------------- | ---------- | --------- | ------------------------------------------------------------------------------- |
| 🛠️ `Incharge.jsx` | `/admin`   | `admin`   | Sign in with Google, then get promoted by an existing admin (see 7)             |
| 🎓 `Faculty.jsx`  | `/faculty` | `faculty` | Sign in with Google, only after an admin has added you to the Faculty directory |
| 📘 `Student.jsx`  | `/student` | `student` | Sign in with Google — that's it, your first sign-in creates the account         |

> New to the codebase? A first-year-friendly way to explore is to sign in as a student first (4), poke around, then read 7 to understand how the other two roles get created — nothing else in the frontend or backend cares about anything other than these three roles.

---

## 4. Running it locally

### You'll need

- Node.js 18+
- Python 3 (nothing to `pip install` — stdlib only)
- A MongoDB instance (local or a free MongoDB Atlas cluster works fine)
- A Google Cloud OAuth 2.0 Client ID (see the note below)

### Backend

```bash
cd backend
npm install
```

There's no `.env.example` committed, so here's the full list reverse-engineered from every `process.env.*` in the code:

```env
PORT=5001
MONGO_URI=mongodb+srv://...
JWT_SECRET=some-long-random-string
FRONTEND_URL=http://localhost:5173
OAUTH_CLIENT_ID=your-google-oauth-client-id
```

```bash
npm run dev     # nodemon
```

`timetableEngine.js` spawns Python with `spawn("python3", [...])` by name, so make sure `python3` resolves on your `PATH` before running generation.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

`frontend/src/utils/apiPaths.js` hardcodes `BASE_URL` to `http://localhost:5173`'s backend counterpart — check that it's pointing at your actual backend before assuming your changes are hitting the right server (see 11).

Also drop `VITE_OAUTH_CLIENT_ID` in `frontend/.env` for Google sign-in — this must be the **same** client ID as the backend's `OAUTH_CLIENT_ID`.

### A note on Google sign-in for local dev

The backend only accepts Google accounts ending in `@nitgoa.ac.in` (7). To develop locally against your own Google account, you'll need to either:

- change the domain check in `authController.js` to your own email domain, or
- use a `@nitgoa.ac.in`-style test account if you have access to one.

There's no local email/password login exposed anywhere in the app — every real path into the system goes through Google.

### Getting your first admin account

There's no seed script. The bootstrap path is:

1. Sign in once with Google — this creates you as a `student`.
2. In MongoDB directly, add yourself to the `Faculty` collection (with your email) and flip your `User.role` to `"faculty"`.
3. Sign in again to refresh your session, then manually set your own `User.role` to `"admin"` in the database (the in-app "promote to admin" action requires an _existing_ admin, so the very first one has to be created by hand).

---

## 5. The data model

| Model                | What it is                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`               | Login identity for all 3 roles. Created automatically on first Google sign-in; role-specific fields (`faculty_code`, `student_code`, `current_sem`...) sit unused for roles that don't need them. |
| `Faculty`            | The faculty _directory_ — separate from `User`. Adding someone here auto-provisions a matching `User` record with `role: "faculty"` (see 7).                                                      |
| `AcademicSession`    | A term — `{ academic_year, term: ODD\|EVEN }`. Almost everything else is scoped to one of these.                                                                                                  |
| `Batch`              | A dept/year/semester cohort (e.g. "CSE Year 2 Sem 3").                                                                                                                                            |
| `Course`             | Catalog entry — type (`THEORY`/`LAB`), nature (`CORE`/`MINOR`/`ELECTIVE`/`PROJECT`/`SEMINAR`), weekly hours, credits.                                                                             |
| `CourseAssignment`   | Links a `Course` to a `Batch` and `Faculty` for a session — the actual unit the engine schedules. Carries `synced_with` and `shared_lab_with` links used by rules 6–7 in 6.3.                     |
| `Room`               | A physical room directory (`LECTURE`/`LAB`, capacity, building). Currently a standalone directory — see 11 for its integration status.                                                            |
| `TimetableSkeleton`  | The grid shape itself — days, periods, and which periods are labs vs. theory vs. minor/OE slots, per session. One active skeleton per session.                                                    |
| `SlotLock`           | An admin's explicit override: force a course into a specific slot, or keep a slot empty for a set of batches. Read by the engine on every generation run — see 6.                                 |
| `Timetable`          | The generated (or hand-edited) result — a grid of placed sessions plus the manual-review items the engine couldn't place.                                                                         |
| `CourseRegistration` | A student's per-session backlog course selections, submitted through the student portal.                                                                                                          |
| `Feedback`           | Bug reports / suggestions / general feedback students submit from the portal, with an optional star rating; admins triage these in the Incharge dashboard.                                        |
| `AdminLog`           | An audit trail of sensitive admin actions (promotions, deletions, etc.).                                                                                                                          |

---

## 6. The scheduling engine, in depth

`backend/src/python_engine/` is the core of the project and the part most worth understanding in depth rather than skimming. Every file in it carries a changelog at the top explaining _why_ rules changed, not just what they do now — worth reading if you're modifying constraint logic.

### 6.1 The cast of files

```
main.py               ── stdin/stdout adapter. One JSON in, one JSON out.
engine.py              ── the conductor: runs multiple attempts, keeps the best
slot_generator.py      ── the heavy lifter — all constraint logic
timetable_generator.py ── turns "buckets" into an actual grid
scorer.py              ── judges how "nice" a valid arrangement is
```

### 6.2 The flow of one generation run

1. **Locks are applied first.** Any `SlotLock` an admin has set is resolved before anything else touches the assignment list — a course lock force-places that assignment into its target slot (and is never sent to manual review); an empty lock removes a slot from the candidate list for the batches it targets.
2. **`build_slots()`** (in `slot_generator.py`) buckets every remaining `CourseAssignment` into a skeleton label (`"A"`, `"LAB_MONDAY"`, etc.), respecting every hard constraint below. Anything it can't cleanly fit gets punted into `manual_review_items` instead of forced somewhere wrong.
3. **`generate_timetable()`** stamps those buckets onto the actual grid shape.
4. **`score_timetable()`** grades the result on _soft_ preferences only — this never affects whether something got placed, only how "good" the placement looks.
5. **`suggest_track_assignments()`** offers a best-guess for which lab-day arrangement (track 1 vs 2) suits each batch — purely a suggestion, the admin can ignore it entirely.

`engine.py` runs this whole flow **many times with different random seeds** and keeps the winner. The tie-break priority is: fewest `manual_review` items wins first, and score is only the tiebreaker after that — a lower-scoring arrangement that leaves nothing for the admin to clean up beats a higher-scoring one that doesn't. Locked placements are identical across every attempt (locking never uses randomness), so only the unlocked portion of the grid actually varies seed-to-seed.

### 6.3 The actual placement rules

These are the rules `slot_generator.py` hard-codes today:

| #   | Rule                                                | What it means                                                                                                                                                                                                                                                                                    |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Course locks win over everything**                | An admin-set `SlotLock` is force-placed regardless of what the algorithm would otherwise choose. It isn't checked against `_can_place` — the whole point of a lock is "put it here regardless" — but a clash against what's already there is surfaced as a warning rather than silently ignored. |
| 2   | **Empty locks steer generation away**               | A slot an admin has locked "empty" for a set of batches is removed from the candidate list for those batches, for both theory and lab placement.                                                                                                                                                 |
| 3   | **0-credit filter**                                 | 0-credit "courses" are dropped before anything else even looks at them. No slot, no manual-review entry — they just don't exist for this run.                                                                                                                                                    |
| 4   | **Priority placement**                              | Higher-credit courses get first pick of slots (stable sort — ties keep their original order, so shuffling/load-balancing within a priority tier still works normally).                                                                                                                           |
| 5   | **Tutorials are never auto-placed**                 | Any `tutorial`-classified assignment goes straight to manual review, no matter how empty the tutorial label looks. This is by design — tutorial timing is admin discretion, not something worth automating.                                                                                      |
| 6   | **Faculty back-to-back — tolerated, not forbidden** | A faculty member can be scheduled in two adjacent periods a limited number of times before it's blocked. Those tolerated hits are flagged (`adjacency_soft_violation`) so the scorer dings them — anything beyond the tolerance is a hard block.                                                 |
| 7   | **Batch back-to-back — totally fine**               | Unlike faculty, a batch sitting in back-to-back periods is normal timetable structure and isn't restricted at all.                                                                                                                                                                               |
| 8   | **`synced_with` groups**                            | Linked assignments get resolved into connected components and anchored to whichever member needs the _fewest_ sessions/week. Members needing _more_ than the anchor offers → overflow. Members needing _fewer_ → choose-occurrences.                                                             |
| 9   | **`shared_lab_with` = anti-affinity, not merge**    | Two linked lab assignments are **forbidden** from landing on the same lab day — they're competing for the same physical lab slot. Only recognized between two lab-classified assignments in the same run; a link to a non-lab assignment is silently ignored.                                    |
| 10  | **Zero-placement vs partial-placement**             | If literally nothing could be placed → `"unplaced"` (only fixable by squeezing into an empty minor/OE slot). If _some_ sessions placed but not enough → `"overflow"` (fixable into any free/shared-ok cell). These are deliberately different admin actions.                                     |

### 6.4 The manual-review pile — the 3 flavors

When the engine can't cleanly place something, it hands it to a human, tagged with exactly why:

| Kind                    | Trigger                                                                                                    | Admin's fix                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 🟠 `overflow`           | Needs _more_ sessions/week than any single label offers, OR it's a tutorial (always, by rule 5)            | Manually assign each leftover session to any free/allowed cell                 |
| 🔵 `choose_occurrences` | Needs _fewer_ sessions than the label it landed on provides                                                | Pick which N of the label's available days to actually keep                    |
| 🔴 `unplaced`           | Got **zero** placement anywhere — usually because a batch has more courses than the regular slots can hold | Squeeze it into an otherwise-empty minor or OE period — the _only_ option here |

### 6.5 Scoring — what "good" even means

`scorer.py` grades an already-valid grid on a small set of weighted soft preferences: gaps in a batch's day, how evenly load is spread across the week, and how many tolerated faculty back-to-back hits it contains. This file only ever judges a grid that's already valid — it can't rescue a bad placement, and it can't fully validate a hand-edited grid either: when an admin reworks the schedule directly, that path bypasses `slot_generator.py` entirely, so the soft-violation flags this scorer relies on won't exist on those cells. `scheduleEditController.js` is expected to run its own clash-check on save (see 11).

### 6.6 The Node ↔ Python contract

`engine/bridge/timetableEngine.js` spawns `python3 main.py`, pipes one JSON blob into stdin (including the `locks` payload built by `timetableController.js`), and expects exactly one JSON blob back on stdout (or a JSON error on stderr + non-zero exit). There's no schema validation between the two sides, so keep `timetableEngine.js` and `engine.py`'s `run()` docstring in lockstep if the payload shape changes (see 11).

Want to poke the engine without going through Node at all?

```bash
cd backend/src/python_engine
python3 main.py < sample_payload.json
```

---

## 7. Auth model — Google sign-in only

**There is exactly one way into this app for real users: Google OAuth, restricted to `@nitgoa.ac.in` accounts.** The login page only shows a "Sign in with Google" button — there's no register/sign-up form wired into the app's routes.

- 📘 **Students just sign in.** The first time a `@nitgoa.ac.in` student email signs in with Google, a `User` account is created automatically with `role: "student"`. If your email looks like a roll number (e.g. `24CSE1002@...`), the backend parses the enrollment year and department out of it and auto-fills your semester and year against whichever `AcademicSession` is currently active. If it can't parse your email, or no session is active yet, those fields come back empty and you'll be prompted to fill them in yourself.
- 🎓 **Faculty accounts are seeded by an admin, then claimed via Google.** An admin adds you to the Faculty directory with your `@nitgoa.ac.in` email. That immediately creates a matching `User` record with `role: "faculty"` and `invite_status: "pending"` behind the scenes. The first time you sign in with that same email through Google, your account is automatically activated (`invite_status` flips to `"accepted"`) — no separate invite step needed.
- 🔒 **Promotion to admin requires an existing admin.** Only an account that's already `faculty` can be promoted, and only another admin can do the promoting, from inside the admin dashboard. There's no self-service path to becoming an admin — see 4 for how to bootstrap the very first one.
- 🔒 **Google login is locked to `@nitgoa.ac.in`.** Anything else gets rejected before any database lookup happens.
- `authMiddleware.js` provides two building blocks: `protect` (verify JWT, load the user, attach `req.user`) and `authorizeRoles(...roles)` (403 if the role doesn't match). The pattern elsewhere is `router.use(protect)` then layering `authorizeRoles("admin")` on individual mutating routes.

---

## 8. Other features

A few things worth knowing exist, beyond the core scheduling loop:

- **Course registration.** Students submit their backlog course selections for a session through `CourseRegistrationForm.jsx`; admins review the submissions from the Incharge dashboard.
- **Feedback.** Students can leave a rated bug report / suggestion / general note from anywhere in the portal; admins triage it from `FeedbackList.jsx`.
- **Exports.** Admins can download the generated timetable as an Excel workbook; students and faculty can export their own personal timetable as a PDF.
- **In-app documentation and a guided tour.** `pages/Documentation.jsx` (and its visual variant) plus a `react-joyride`-powered walkthrough (`tour/`) help new users orient themselves without leaving the app.
- **Admin audit log.** Sensitive admin actions (role changes, deletions) are recorded to `AdminLog` and viewable per-admin.

---

## 9. Deployment notes

- **Frontend** → Vercel (`frontend/vercel.json` present).
- **Backend** → Render. Whatever host you use, make sure `python3` is actually available in that runtime — the engine subprocess needs it — and all the env vars from 4 are set. Double-check `BASE_URL` in the frontend points at your actual backend URL before deploying (see 11).

---

## 10. Common workflows — "where do I look?"

| I want to...                                       | Go here                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add a new admin-manageable resource                | Model in `models/` → controller in `controllers/admin/` → route in `routes/admin/` (mount with `protect` + `authorizeRoles("admin")`) → mount in `index.js` → a new file in `services/` and `store/admin/` → UI in `components/Incharge/`                                                            |
| Change _how_ the engine schedules things           | `slot_generator.py` (placement rules) · `scorer.py` (quality judging) · `timetable_generator.py` (bucket → grid). Keep `timetableEngine.js` and `engine.py`'s docstring in sync if the payload shape changes, and bump the version note — this codebase treats those docstrings as a real changelog. |
| Figure out why something landed in manual review   | Check the review item's `kind` (6.4) → trace back through `manualReviewController.js` / `scheduleEditController.js` → the matching call in `slot_generator.py`                                                                                                                                       |
| Change what a student/faculty sees                 | `pages/Student.jsx` and `pages/Faculty.jsx` → `components/Student/` and `components/Faculty/` → the matching `services` file → the matching `store` file. Shared reads go through `Publictimetablecontroller.js` (public, no login — see 11)                                                         |
| Touch auth / add a role                            | `authController.js` + `authMiddleware.js` (backend) · `User.role` enum · `ProtectedRoute.jsx` + `getRoleHome.js` (frontend)                                                                                                                                                                          |
| Change the grid shape itself (days/periods/tracks) | `TimetableSkeleton` + `skeletonController.js` (backend, one active skeleton per session) · `utils/skeletonDerivation.js` (how the shape becomes engine input) · `SkeletonEditor.jsx` (frontend)                                                                                                      |
| Lock or unlock a specific slot                     | `SlotLock` model · `slotLockController.js` (backend) · locks are read by `timetableController.js::buildLocksPayload` and consumed in `slot_generator.py` (6.3, rules 1–2)                                                                                                                            |

---

## 11. Known limitations & rough edges

- 🔴 **`admin/timetableRoutes.js` has zero auth middleware.** Generation, schedule reads, manual-review resolution, slot editing, and slot locking — all of it — is currently reachable with no token at all, unlike every other admin route file. This should be fixed before any real-world deployment.
- 🟡 **Faculty aren't notified automatically.** Adding a faculty to the directory provisions their account right away, but there's no notification step — faculty currently need to be told out-of-band (in person, over email, etc.) that they can now sign in with Google.
- 🟡 **Rooms aren't wired into scheduling yet.** The `Room` model and its admin CRUD exist as a standalone directory, but nothing in `slot_generator.py` or `GeneratedSlot` currently checks room availability — two courses can be validly placed in the same slot with no awareness of whether a physical room is free. `shared_lab_with` covers one specific case, not a general resource model.
- **Hardcoded `BASE_URL`** in `apiPaths.js` — should be a `VITE_API_BASE_URL` env var.
- **No `.env.example`** anywhere — see 4 for the reconstructed list.
- **An empty, unused `routes/adminRoutes.js`** mounted at `/api/admin` — worth confirming nothing depends on it before removing.
- **`routes/student/timetableRoutes.js` exists but is never imported/mounted** in `index.js`.
- **Inconsistent casing** across controller/route filenames (`Publictimetablecontroller.js`, `.Admin.js` vs `.admin.js` vs `.student.js` suffixes). Cosmetic, but annoying to grep around.
- **No automated tests, no CI.** The engine is pure, deterministic-given-a-seed functions with no Mongo/Express dependency — it's the single best ROI place to start testing.
- **`shared_lab_with` silently no-ops** if it points at a non-lab assignment — no warning, no error.
- **No schema validation between Node and the Python engine.** A payload-shape change on one side without the other produces a raw JSON-parse crash rather than a helpful error.
- **Rework can reintroduce hard violations** the scorer won't catch — see 6.5.
- Google OAuth throws if its env vars are missing and that code path gets hit — worth guarding for a clean no-secrets local dev experience.
- The whole auth layer is NIT-Goa-specific (domain check + roll-number regex) — reusing this elsewhere means editing `authController.js`.

---

## 12. Future roadmap & optimization ideas

Stuff that would meaningfully level this project up, roughly ordered by bang-for-buck:

### 🏗️ Foundation-level (do these first)

- **Lock down `admin/timetableRoutes.js`.** This is a real security hole, not a style nitpick — fix it before anything else on this list.
- **Add tests around the engine.** `slot_generator.py`/`scorer.py` are pure and deterministic-given-a-seed — a handful of fixture payloads covering the rules in 6.3 would catch regressions immediately.
- **Basic CI**: lint on push + a smoke test that runs `main.py` against a saved sample payload and asserts it doesn't crash.
- **A real `.env.example`** in both `backend/` and `frontend/`, generated once and kept in sync.

### ⚙️ Engine improvements

- **Finish wiring `Room` into the engine.** The directory already exists — the missing piece is a room-conflict check at placement time, which would remove a whole class of manual overrides admins currently have to catch themselves.
- **Give rework a real clash-checker.** Right now `scheduleEditController.js` is expected to catch adjacency/double-booking problems on manual saves — making that an explicit, tested function (reusing the same clash logic `slot_generator.py` already has) would close the one remaining hole where a bad timetable can get saved.
- **Configurable rule weights.** The faculty back-to-back tolerance and the scorer's weights are hardcoded — exposing these as session-level or institution-level settings would make the engine reusable beyond NIT Goa's specific preferences.

### 🎨 Frontend / UX

- Turn the manual-review queue into something closer to a checklist with visible progress, rather than a flat list.
- Add a lightweight diff/preview view before an admin commits a rework edit, so they can see exactly what changed against the last generated version.
- Wire the notice board up to a real backend collection instead of the placeholder data it currently ships with.

### 🧹 Housekeeping

- Remove the unused/unmounted route files flagged in 11 once confirmed unused.
- Standardize file-naming casing across controllers/routes.
- Move `BASE_URL` to a proper env var.
- Consider generalizing the NIT-Goa-specific auth logic (domain check, roll-number regex) behind a config value if this project is ever meant to be reused by another institution.

### 📈 Longer-term / ambitious

- **Multi-institution support** — parameterize the domain restriction, the roll-number parsing, and the skeleton's default template so this could genuinely be handed to another college without code edits.
- **Historical scoring analytics** — store score + manual-review-count per generation over time, so admins can see whether tweaking constraints session-over-session is actually helping.
- **A proper conflict simulator** for admins to test "what if I add this course" against the _current_ schedule without spawning a full regeneration.

---

## 13. A note on scope

This was built iteratively, under time constraints, and the engine in particular has been rewritten several times as requirements became clearer (it's now on its 8th major revision of the placement logic, with slot locking as the latest addition). Some parts of the codebase — the auth coverage on a couple of route files, the lack of tests and CI — would be structured differently starting from a clean slate. 11 and 12 above lay out what's known and what a next pass would prioritize.

---
