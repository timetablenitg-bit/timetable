"""
slot_generator.py  –  New approach
===================================
Responsibilities:
  1. Classify every assignment into theory, minor(G), OE(H), tutorial(TUT), 1-credit, lab.
  2. Assign theory courses to slots A–F (clash-free). Overflow into H, then drop.
  3. Build G, H, TUT, 1-credit slots from matching assignments.
  4. Build LAB slots: three arrays – LAB_MONDAY, LAB_TUESDAY, LAB_THURSDAY.
     Each array holds multiple lab entries (like theory slots).
     Same batch/faculty/course cannot have two labs on the same day.
"""

import uuid
import sys
import random
from collections import defaultdict, Counter

THEORY_SLOT_NAMES = ["A", "B", "C", "D", "E", "F"]
LAB_DAYS = ["Monday", "Tuesday", "Thursday"]

def _make_theory_entry(a):
    spw = int(a.get("sessions_per_week") or a.get("course_id", {}).get("credits", 1))
    return {
        "id":                str(uuid.uuid4()),
        "course":            a["course_id"]["course_code"],
        "faculty":           a["faculty_id"]["faculty_code"],
        "faculty_id":        str(a["faculty_id"]["_id"]),
        "batches":           [b["batch_name"] for b in a["batch_ids"]],
        "batch_ids":         [str(b["_id"])   for b in a["batch_ids"]],
        "assignment_id":     str(a["_id"]),
        "sessions_per_week": spw,
    }

def _make_lab_entry(a):
    return {
        "id":            str(uuid.uuid4()),
        "course":        a["course_id"]["course_code"],
        "faculty":       a["faculty_id"]["faculty_code"],
        "faculty_id":    str(a["faculty_id"]["_id"]),
        "batches":       [b["batch_name"] for b in a["batch_ids"]],
        "batch_ids":     [str(b["_id"])   for b in a["batch_ids"]],
        "assignment_id": str(a["_id"]),
        "is_lab":        True,
        "is_project":    a.get("component_type") in ("major_project", "project"),
        "duration":      a.get("duration", 3),
        "lab_group":     a.get("lab_group"),
        "sessions_per_week": 1,
    }

def _clashes(entry, bucket):
    """True if faculty or any batch is already in the bucket."""
    for e in bucket:
        if e["faculty"] == entry["faculty"]:
            return True
        if set(e["batches"]) & set(entry["batches"]):
            return True
    return False

def _classify(a):
    component = a.get("component_type", "lecture")
    duration  = a.get("duration", 1)
    atype     = a.get("assignment_type", "regular")
    credits   = int(a.get("course_id", {}).get("credits", 1))

    if component == "lab" or duration > 1:
        return "lab"
    if component in ("major_project", "project"):
        return "lab"
    if atype == "minor" or component == "minor":
        return "minor"
    if atype in ("oe", "open_elective") or component in ("oe", "open_elective"):
        return "oe"
    if atype == "tutorial" or component == "tutorial":
        return "tutorial"
    if credits == 1:
        return "1credit"
    return "theory"

def build_slots(assignments, seed=1):
    rng = random.Random(seed)

    theory   = []
    minor    = []
    oe       = []
    tutorial = []
    one_credit = []
    labs     = []

    for a in assignments:
        kind = _classify(a)
        if kind == "lab":
            labs.append(a)
        elif kind == "minor":
            minor.append(_make_theory_entry(a))
        elif kind == "oe":
            oe.append(_make_theory_entry(a))
        elif kind == "tutorial":
            tutorial.append(_make_theory_entry(a))
        elif kind == "1credit":
            one_credit.append(_make_theory_entry(a))
        else:
            theory.append(a)

    result = {}

    # ---------- 1. Theory slots A–F ----------
    theory_entries = [_make_theory_entry(a) for a in theory]
    rng.shuffle(theory_entries)
    theory_entries.sort(key=lambda x: len(x["batches"]), reverse=True)

    buckets = [[] for _ in THEORY_SLOT_NAMES]
    overflow = []
    for entry in theory_entries:
        placed = False
        for bucket in buckets:
            if not _clashes(entry, bucket):
                bucket.append(entry)
                placed = True
                break
        if not placed:
            overflow.append(entry)
            print(f"[slot_generator] OVERFLOW: {entry['course']} ...", file=sys.stderr)

    for i, bucket in enumerate(buckets):
        if bucket:
            result[THEORY_SLOT_NAMES[i]] = bucket

    for entry in overflow:
        if "H" not in result:
            result["H"] = [entry]
        else:
            print(f"[slot_generator] DROPPED: {entry['course']}", file=sys.stderr)

    # ---------- 2. Special slots ----------
    def _build_special(entries, slot_name):
        bucket = []
        for entry in entries:
            if any(e["faculty"] == entry["faculty"] for e in bucket):
                print(f"[slot_generator] {slot_name} faculty clash: {entry['course']} skipped.", file=sys.stderr)
                continue
            bucket.append(entry)
        if bucket:
            result[slot_name] = bucket

    _build_special(minor, "G")
    if "H" not in result:
        _build_special(oe, "H")
    elif oe:
        print("[slot_generator] OE dropped (H occupied)", file=sys.stderr)
    _build_special(tutorial, "TUT")
    _build_special(one_credit, "1-CREDIT")

    # ---------- 3. Lab slots – three arrays (Monday, Tuesday, Thursday) ----------
    # Count labs per batch to identify track‑2 batches (≥3 labs)
    lab_count = Counter()
    for a in labs:
        for b in a.get("batch_ids", []):
            lab_count[str(b["_id"])] += 1
    track2_batches = {str(b["_id"]) for a in labs for b in a["batch_ids"] if lab_count[str(b["_id"])] >= 3}

    # Priority: labs that contain track-2 batches first, then more batches
    def priority(a):
        batch_ids = {str(b["_id"]) for b in a["batch_ids"]}
        return (1 if batch_ids & track2_batches else 0, -len(batch_ids))

    labs_sorted = sorted(labs, key=priority, reverse=True)

    # Initialize three lab slots as empty lists
    lab_slots = {day: [] for day in LAB_DAYS}
    # Track used batches per day
    used_batches_per_day = {day: set() for day in LAB_DAYS}
    # Track used faculty per day
    used_faculty_per_day = {day: set() for day in LAB_DAYS}
    # Track used course codes per day (prevent duplicate lab)
    used_courses_per_day = {day: set() for day in LAB_DAYS}

    for a in labs_sorted:
        entry = _make_lab_entry(a)
        course_code = entry["course"]
        batch_ids = set(entry["batch_ids"])
        faculty_id = entry["faculty_id"]

        # Try to assign to a day where no conflict occurs
        assigned_day = None
        for day in LAB_DAYS:
            if batch_ids & used_batches_per_day[day]:
                continue
            if faculty_id in used_faculty_per_day[day]:
                continue
            if course_code in used_courses_per_day[day]:
                continue
            # Optional limit (e.g., max 18 labs per day)
            if len(lab_slots[day]) >= 18:
                continue
            assigned_day = day
            break

        if assigned_day:
            lab_slots[assigned_day].append(entry)
            used_batches_per_day[assigned_day].update(batch_ids)
            used_faculty_per_day[assigned_day].add(faculty_id)
            used_courses_per_day[assigned_day].add(course_code)
        else:
            print(f"[slot_generator] WARNING: Lab {entry['course']} could not be placed on any lab day (conflict or limit).", file=sys.stderr)

    # Add the three lab arrays to result
    for day, entries in lab_slots.items():
        if entries:
            result[f"LAB_{day.upper()}"] = entries   # e.g., LAB_MONDAY, LAB_TUESDAY, LAB_THURSDAY

    return result

# Legacy wrapper
def build_lecture_slots(assignments, seed=1):
    slots = build_slots(assignments, seed=seed)
    return {k: v for k, v in slots.items() if not k.startswith("LAB_")}