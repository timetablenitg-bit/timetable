# python-engine/slot_generator.py
#
# Builds lecture slots (A-F) and minor slot (G).
#
# KEY FIX: Removed the sessions_per_week clash check.
# The original code rejected entries whose SPW differed from others already
# in the same bucket.  With 19 batches / 5 departments this instantly fills
# every bucket for many courses, causing dozens of HARD CONFLICTs.
#
# The SPW constraint belongs to the *timetable arranger*, not the slot grouper.
# Slots don't need to repeat at the same frequency to coexist in the same
# column — the arranger simply places each slot the correct number of times.
# The only hard constraints at slot-grouping time are:
#   1. A faculty cannot appear twice in the same slot.
#   2. A batch cannot appear twice in the same slot.

import uuid
import random
import sys

SLOT_NAMES = ["A", "B", "C", "D", "E", "F"]
MINOR_SLOT = "G"

# How many extra overflow buckets to allow beyond the base 6.
# Each backlog course can need +1 bucket; institute allows max 2 backlogs → 8.
EXTRA_BUCKETS = 2   # gives slots A-H for overflow


def make_entry(a):
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


def clashes(entry, bucket):
    """
    Returns True if placing `entry` into `bucket` would double-book a
    faculty member or a batch.  SPW differences are NOT a clash.
    """
    for e in bucket:
        if e["faculty"] == entry["faculty"]:
            return True
        if set(e["batches"]) & set(entry["batches"]):
            return True
    return False


def build_lecture_slots(assignments, seed=1):
    rng = random.Random(seed)

    regular = []
    minor   = []

    for a in assignments:
        component = a.get("component_type", "lecture")
        duration  = a.get("duration", 1)
        atype     = a.get("assignment_type", "regular")

        # Labs are handled by lab_scheduler
        if component == "lab" or duration > 1:
            continue

        entry = make_entry(a)

        if atype in ("minor", "oe"):
            minor.append(entry)
        else:
            regular.append(entry)

    # Shuffle for attempt diversity, hardest-to-place (most batches) first
    rng.shuffle(regular)
    regular.sort(key=lambda x: len(x["batches"]), reverse=True)

    # ── Build buckets ─────────────────────────────────────────────────────────
    # Start with 6 (A-F); expand up to 6+EXTRA_BUCKETS if needed.
    all_names = SLOT_NAMES + [chr(ord("A") + len(SLOT_NAMES) + i) for i in range(EXTRA_BUCKETS)]
    buckets   = [[] for _ in all_names]

    for entry in regular:
        placed = False

        # Pass 1: try the first bucket with no clash
        for bucket in buckets:
            if not clashes(entry, bucket):
                bucket.append(entry)
                placed = True
                break

        if not placed:
            # All buckets have a real clash (faculty or batch double-book).
            # This is a genuine data problem — report it clearly.
            print(
                f"[slot_generator] HARD CONFLICT: {entry['course']} "
                f"({entry['faculty']}, {entry['batches']}) "
                f"could not fit into any of the {len(all_names)} slots. "
                f"Faculty or batch is assigned to too many courses.",
                file=sys.stderr,
            )

    # Build result — only non-empty buckets
    result = {}
    for i, bucket in enumerate(buckets):
        if bucket:
            result[all_names[i]] = bucket

    # ── Minor / OE slot G ─────────────────────────────────────────────────────
    if minor:
        minor_bucket = []
        for entry in minor:
            # Only faculty-clash check between minor courses themselves
            if not any(e["faculty"] == entry["faculty"] for e in minor_bucket):
                minor_bucket.append(entry)
            else:
                print(
                    f"[slot_generator] Minor slot conflict: {entry['course']} "
                    f"skipped (faculty {entry['faculty']} already in G)",
                    file=sys.stderr,
                )
        if minor_bucket:
            result[MINOR_SLOT] = minor_bucket

    return result