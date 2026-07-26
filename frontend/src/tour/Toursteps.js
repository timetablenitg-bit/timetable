const withDefaults = (steps) =>
  steps.map((step) => ({ disableBeacon: true, ...step }));

const baseSteps = [
  {
    target: ".sidebar-nav",
    content:
      "Use the sidebar to navigate between different sections of the admin panel.",
    placement: "right",
  },
];

const sessionShellSteps = [
  {
    target: '[data-tour="session-header"]',
    content:
      "This is the academic session you're currently managing — its year, term, and Active/Inactive status. Everything below (registration, assignments, timetable) happens inside this one session.",
    placement: "bottom",
  },
  {
    target: '[data-tour="session-tabs"]',
    content:
      "The full lifecycle runs left to right: students Register for courses, you Assign those courses to faculty, review the Finalized list, then Generate the Timetable. You can jump between tabs anytime — nothing here is locked in order, but this is the natural flow.",
    placement: "bottom",
  },
];

const viewSteps = {
  generate: [
    {
      target: '[data-tour="add-session-btn"]',
      content: "Create a new academic session (Even/Odd).",
      placement: "left",
    },
    {
      target: '[data-tour="session-list"]',
      content: "List of all academic sessions. Click any to view details.",
      placement: "bottom",
    },
  ],
  "academic-session-courseRegistration": [
    {
      target: '[data-tour="registration-list"]',
      content:
        "Every batch in this session, grouped by semester. Each row shows how many students have completed course registration versus how many haven't started — a quick way to see which batches are holding things up before you move to assignments.",
      placement: "top",
    },
    {
      target: '[data-tour="registration-batch-header"]',
      content:
        "Click a batch to expand it. You'll see per-student status, and for students who've completed registration, you can drill in further to see exactly which backlog courses and credits they registered for.",
      placement: "bottom",
    },
  ],

  "academic-session-assignments": [
    {
      target: '[data-tour="assignment-toolbar"]',
      content:
        "Filter batches by department or year, and sort them, to focus on the ones you need to assign faculty to right now instead of scrolling through everything.",
      placement: "bottom",
    },
    {
      target: '[data-tour="assignment-batch-list"]',
      content:
        "Every batch in scope for this term, one card each. Rows inside are generated automatically from the batch's semester and department curriculum — you're not starting from a blank sheet.",
      placement: "top",
    },
    {
      target: '[data-tour="assignment-batch-header"]',
      content:
        "Click to expand a batch. The bar shows assigned vs total rows — a quick read on how far along this batch is before you move to Finalized.",
      placement: "bottom",
    },
    {
      target: '[data-tour="assignment-course-cell"]',
      content:
        "For a curriculum course, this shows code/type/credits and a badge for how many students are registered. Violet rows are Elective Slots — pick which real elective fills the slot here. Rows you add manually let you search any course in the batch's department.",
      placement: "right",
    },
    {
      target: '[data-tour="assignment-faculty-cell"]',
      content:
        "Search and assign faculty. The pool is filtered to the department(s) relevant to this course, so you won't see unrelated faculty.",
      placement: "right",
    },
    {
      target: '[data-tour="assignment-type-cell"]',
      content:
        "Regular, Backlog, Minor, or Open Elective. This tags how the assignment counts, and backlog rows are the ones auto-injected for students carrying a backlog — see the amber row below.",
      placement: "right",
    },
    {
      target: '[data-tour="assignment-backlog-row"]',
      content:
        "Amber rows are backlog courses: the system found students in this batch registered for this course as a backlog and it doesn't have an assignment yet. Assign faculty here just like any other row — it flows into the timetable the same way.",
      placement: "top",
    },
    {
      target: '[data-tour="assignment-links-cell"]',
      content:
        "Two link icons live here. The flask icon (lab rows only) shares a lab room block with another batch's lab assignment. The chain icon syncs this slot with another saved assignment so they're always placed together — it's disabled until you save the row once.",
      placement: "left",
    },
    {
      target: '[data-tour="assignment-footer"]',
      content:
        "Add Course drops in a blank manual row for anything not already generated. Save Batch persists everything in this card — saving is per-batch, not global.",
      placement: "top",
    },
  ],

  "academic-session-finalized": [
    {
      target: '[data-tour="finalized-receipt"]',
      content:
        "A summary of everything assigned so far — total assignments and how many batches they span. Think of this as the final checkpoint before generation: if a batch is missing here, go back to Course Assignments first.",
      placement: "bottom",
    },
    {
      target: '[data-tour="finalized-batch-groups"]',
      content:
        "Every finalized assignment, grouped by batch — course, assigned faculty, component type (lecture/lab/tutorial), and whether it's a combined class shared across batches. Expand any batch to review the full list before generating.",
      placement: "top",
    },
    {
      target: '[data-tour="generate-timetable-btn"]',
      content:
        "Once everything above looks right, generate the timetable. This runs the placement engine against all finalized assignments for this session — it can take a moment, so don't close the page while it's running.",
      placement: "left",
    },
  ],

  "academic-session-timetable": [
    {
      target: '[data-tour="timetable-toolbar"]',
      content:
        "This bar travels with you across all four views below. The badge is the timetable's optimization score. Edit turns on inline editing for whichever view you're on. Publish pushes the current schedule live to students and faculty. The sheet icon exports to Excel, and the circular arrow refreshes everything from the server.",
      placement: "bottom",
    },
    {
      target: '[data-tour="timetable-subtabs"]',
      content:
        "Four views share this one generated timetable. Schedule (open right now) is the day-by-day grid. Slots is the raw batch × slot-label data the placement engine actually works from. Institute gives a cross-batch view you can filter by batch or faculty. Review surfaces anything the engine couldn't place on its own. Open any of the other three and you'll get a focused walkthrough the first time you do.",
      placement: "bottom",
    },
    {
      target: '[data-tour="schedule-grid"]',
      content:
        "This is the Schedule view: the day-by-day period grid. Some days show a dashed second row — that's a batch running on the other timing track. Lab sessions render as merged 3-period blocks with a flask icon.",
      placement: "top",
    },
    {
      target: '[data-tour="schedule-locked-legend"]',
      content:
        "Cells with the grey dot were placed via Manual Review and are locked here — change them from the Review or Institute tab instead.",
      placement: "top",
    },
    {
      target: '[data-tour="timetable-edit-btn"]',
      content:
        "Click Edit to start moving things around. Turn it on and you'll get a focused walkthrough of editing the moment it's active.",
      placement: "bottom",
    },
  ],

  "academic-session-timetable-schedule-editing": [
    {
      target: '[data-tour="schedule-edit-toolbar"]',
      content:
        "You're in Schedule edit mode. Drag any theory cell or lab block onto another to swap them — locked (grey-dot) cells from Manual Review can't be dragged or clicked. Click any other unlocked cell to open the slot picker and assign a slot directly, or clear it. Nothing is saved until you press Save here; Cancel throws away every change and reloads the last saved grid.",
      placement: "bottom",
    },
  ],

  "academic-session-timetable-slots": [
    {
      target: '[data-tour="slots-grid"]',
      content:
        'Batches run down the side, slot labels (A, B, C…) run across the top — this is the raw grid the placement engine works from, not a day-by-day calendar. A filled cell is a course/faculty pill; a plain "–" means that batch is free in that slot. Next to a batch name, an amber dot means it still has an unplaced course sitting in the pool on the right. On a slot\'s header, an amber "Clash" badge means two entries in that column share a faculty or a batch — a conflict worth resolving before you regenerate. If any entries couldn\'t be tied to a batch at all, they show up in their own "No batch" row at the very bottom.',
      placement: "top",
    },
    {
      target: '[data-tour="timetable-edit-btn"]',
      content:
        "Edit slots has to be on for any of this — dragging, adding, removing, and locking are all read-only until you switch it on. Nothing you do here touches the server until you press Save; Cancel throws away every change and reloads the last saved version. Turn it on and we'll walk you through the rest.",
      placement: "bottom",
    },
    {
      target: '[data-tour="slots-lock-btn"]',
      content:
        "Lock mode changes what clicking a cell does: click a filled cell to lock that exact course to this slot, or click an empty cell to lock a slot empty for that batch. Either way it's a toggle — click again to unlock. Locks are what \"Regenerate with Locks\" respects, so pin down anything you don't want the engine to move before you rerun it.",
      placement: "bottom",
    },
    {
      target: '[data-tour="regenerate-locks-btn"]',
      content:
        "Once you've saved the placements and locks you want to keep, this reruns the placement engine honoring every lock — handy after a batch of manual pins, so the engine only fills in what's left.",
      placement: "left",
    },
  ],

  "academic-session-timetable-slots-editing": [
    {
      target: '[data-tour="slots-grid"]',
      content: "Moving a course: drag its pill onto another slot. ...",
      placement: "top",
    },
    {
      target: '[data-tour="slots-grid"]',
      content: 'Adding a course: hover an empty "–" cell and a + appears. ...',
      placement: "top",
    },
    {
      target: '[data-tour="slots-lock-btn"]',
      content:
        'Lock mode works whether or not you\'re editing: click a filled cell to lock that course to this slot, or an empty cell to lock it empty for that batch — click again to unlock. Locks are what "Regenerate with Locks" respects.',
      placement: "bottom",
    },
    {
      target: '[data-tour="slots-add-btn"]',
      content: "Add slot brings in a new column ...",
      placement: "left",
    },
  ],

  "academic-session-timetable-institute": [
    {
      target: '[data-tour="institute-filters"]',
      content:
        "Filter by Batch and/or Faculty to narrow the cross-batch view. Unfiltered, you get one selected day at a time across every batch; filtered, you get all 5 days for just the matching batch(es).",
      placement: "bottom",
    },
    {
      target: '[data-tour="institute-grid"]',
      content:
        "The 🔁 T1/T2 toggle changes how a batch's AM/PM lab block displays for eligible days — a view preference only, it doesn't touch the score. An 'M' badge marks a cell placed manually via Review.",
      placement: "top",
    },
    {
      target: '[data-tour="institute-filters"]',
      content:
        "Now try it yourself: pick any one batch from the Batch dropdown (leave Faculty empty). That's what unlocks a dedicated weekly editor for that batch — select one to continue the tour.",
      placement: "bottom",
      hideFooter: true,
    },
  ],

  "academic-session-timetable-institute-filtered": [
    {
      target: '[data-tour="institute-batch-edit-btn"]',
      content:
        "There it is — the Edit button, now that exactly one batch is filtered. Click it to open the weekly editor and see how editing works.",
      placement: "left",
      hideFooter: true,
    },
  ],

  "academic-session-timetable-institute-editing": [
    {
      target: '[data-tour="institute-batch-edit-toolbar"]',
      content:
        "You're editing this batch's week directly. Drag any cell — theory or lab — to move or swap it within the batch's own days. Click a cell to open the detailed editor (fill from an unplaced assignment, or enter manually), × clears it, and a 🔒 marks a joint session shared with another batch that you can't touch from here. Nothing hits the server until you save.",
      placement: "bottom",
    },
    {
      target: '[data-tour="institute-batch-edit-grid"]',
      content:
        "Empty cells show a + — click to fill a free period or add an extra lab block for this batch. Save Week persists every pending change at once (the count shows how many); Cancel discards them and exits editing.",
      placement: "top",
    },
  ],

  "academic-session-timetable-review": [
    {
      target: '[data-tour="review-queue"]',
      content:
        "Pending items, grouped by batch — the number on the Review tab is how many are waiting overall. Each batch works through its own items in order: pick which days a recurring course actually runs, then place courses still missing sessions, then slot in unplaced Minor/Open-Elective courses.",
      placement: "top",
    },
    {
      target: '[data-tour="review-batch-header"]',
      content:
        "Each batch runs its own 3-stage flow — Pick Occurrences → Unplaced → Overflow — shown as pips here. Only the current stage's cards are shown; clear (or skip) everything in one stage to unlock the next. Green = done, amber = everything in that stage was skipped rather than resolved, grey lock = not reached yet. Click the header to expand or collapse the batch.",
      placement: "bottom",
    },
    {
      target: '[data-tour="review-active-card"]',
      content:
        "The active card for this batch's current stage. Recurring courses: tick which days it should run. Courses still missing sessions: click empty periods on the mini timetable to place them. Unplaced Minor/Open-Elective: pick from the free Minor/OE periods shown. Confirm resolves the card and refreshes the schedule; Skip defers it without blocking the rest of the batch.",
      placement: "top",
    },
  ],
};

// The steps that belong specifically to this view (no base/shell steps mixed
// in). Used by TourContext to tell "we found the view's own steps" apart from
// "we only had generic fallback steps renderable" — see start() in
// TourContext.jsx.
export const getViewSpecificSteps = (view) =>
  withDefaults(viewSteps[view] || []);

export const getStepsForView = (view, { includeShell = false } = {}) => {
  return withDefaults([
    ...baseSteps,
    ...(includeShell ? sessionShellSteps : []),
    ...(viewSteps[view] || []),
  ]);
};

export const getUndocumentedViews = () =>
  Object.entries(viewSteps)
    .filter(([, steps]) => steps.length === 0)
    .map(([view]) => view);
