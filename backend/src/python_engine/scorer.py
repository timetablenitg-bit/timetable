"""
scorer.py  –  v3
==========================================
Changes from v2:

  * RULE 5: faculty_consecutive is back, but not as a from-scratch grid
    scan. slot_generator.py v3 now tolerates up to 2 faculty back-to-back
    instances per faculty (hard-blocking only the 3rd+) and flags the
    entries it let through with `adjacency_soft_violation=True`. This
    scorer just sums those flags out of `slots` (the bucket dict, not the
    grid — the flag lives on the entry dict, which the grid cells in
    `timetable` don't carry) and applies a penalty per hit. batch_consecutive
    and missing_sessions remain dropped — those still can't happen through
    normal generation (batch adjacency was never a real rule to begin with,
    and missing_sessions routes to manual_review instead of silently
    happening).

NOTE: the rework path (admin hand-edits the saved grid directly) CAN
reintroduce a hard violation, since it bypasses slot_generator.py
entirely, and reworked grids won't carry adjacency_soft_violation flags
on their cells at all (the flag lives on generator-side entries, not
grid cells). reworkTimetable / saveAndEvaluate should run its own
adjacency + double-booking check against the edited grid before saving
(see controllers/scheduleEditController.js) — this scorer intentionally
does not catch that class of problem on rework.
"""

WEIGHTS = {
    "gap_penalty": 1,
    "uneven_distribution": 0.5,
    # Rule 5: tolerated (up to 2x/faculty) but still penalized so the
    # engine's "best of N seeds" selection prefers arrangements with
    # fewer soft violations when manual_review counts tie.
    "faculty_consecutive": 3,
}

def _flatten_day(day_value):
    """Accept flat list or {"track1": [...], "track2": [...]} dict."""
    if isinstance(day_value, list):
        return day_value
    if isinstance(day_value, dict):
        return day_value.get("track1") or []
    return []

def score_timetable(timetable, slots=None):
    """Returns 0-100. Higher = better."""
    total_penalty = 0
    max_possible = 0

    for day, day_value in timetable.items():
        periods = _flatten_day(day_value)
        slot_names = [
            p.get("slot_name") if isinstance(p, dict) else None
            for p in periods
        ]
        for i in range(1, len(slot_names) - 1):
            if (slot_names[i] in (None, "BREAK", "LUNCH")
                    and slot_names[i - 1] not in (None, "BREAK", "LUNCH")
                    and slot_names[i + 1] not in (None, "BREAK", "LUNCH")):
                total_penalty += WEIGHTS["gap_penalty"]
                max_possible += WEIGHTS["gap_penalty"]

    slot_freq = {}
    for day, day_value in timetable.items():
        periods = _flatten_day(day_value)
        for p in periods:
            if not isinstance(p, dict):
                continue
            sn = p.get("slot_name")
            if sn and sn not in ("BREAK", "LUNCH"):
                slot_freq[sn] = slot_freq.get(sn, 0) + 1

    if slot_freq:
        avg = sum(slot_freq.values()) / len(slot_freq)
        variance = sum((v - avg) ** 2 for v in slot_freq.values()) / len(slot_freq)
        total_penalty += variance * WEIGHTS["uneven_distribution"]
        max_possible += 25

    # Rule 5: sum flagged soft adjacency violations out of the bucket
    # entries. `slots` here is the label -> [entries] dict built by
    # slot_generator.py (engine.py's _flatten_for_scorer), not the grid —
    # the flag lives on the entry, not on a timetable cell.
    if slots:
        entry_count = 0
        violation_count = 0
        for label, entries in slots.items():
            if not isinstance(entries, list):
                continue
            for e in entries:
                if not isinstance(e, dict):
                    continue
                entry_count += 1
                if e.get("adjacency_soft_violation"):
                    violation_count += 1
        if entry_count:
            total_penalty += violation_count * WEIGHTS["faculty_consecutive"]
            max_possible += entry_count * WEIGHTS["faculty_consecutive"]

    DENOM_OFFSET = 50
    if max_possible + DENOM_OFFSET == 0:
        return 100

    raw_score = 100 - (total_penalty / (max_possible + DENOM_OFFSET)) * 100
    return round(max(0, min(100, raw_score)), 2)