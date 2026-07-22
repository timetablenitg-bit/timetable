"""
slot_generator.py  –  v8
=============================================
Changes from v7:

  * NEW: `locks` param (from Node's SlotLock collection, reshaped by
    timetableController.js::buildLocksPayload into
    { course: { assignment_id: slot_name }, empty: { slot_name: [batch_id,...] } }).

    Two effects:

    1. COURSE LOCKS are resolved *before* anything else touches
       `assignments`. A locked assignment is pulled out of the normal
       classify/group/place pipeline entirely and force-placed directly
       into its target bucket (see `_apply_course_locks`). This applies
       equally to lab and non-lab assignments — a lock's slot_name can be
       a theory label ("B") or a concrete lab bucket ("LAB_MONDAY"), and
       forcing works the same way for both since buckets are just
       label -> [entries] either way.

       Forcing does NOT run through _can_place — the whole point of a
       lock is "put it here regardless." But we still *check* for a
       faculty/batch double-book or adjacency clash against whatever's
       already in that bucket, and surface it as a `lock_warnings` entry
       instead of silently ignoring it. Nothing about a locked
       assignment is ever routed to manual_review — locking is
       definitionally "the admin already decided where this goes."

       If two course locks target the same assignment (shouldn't happen —
       slotLockController.js upserts per-assignment — but defensively) the
       later one in iteration order wins.

    2. EMPTY LOCKS remove a label from the eligible-candidate list for any
       group whose batch set overlaps the lock's batch_ids, for both the
       theory path (_rank_candidates candidates are filtered before
       ranking) and the lab path (a day is skipped if occurrence_counts'
       equivalent LAB_<DAY> key is empty-locked against the group's
       batches). This is a soft steer at generation time only — it does
       not touch cells directly, it just keeps the generator from ever
       proposing a placement there for those batches. A course lock
       ALWAYS wins over an empty lock if they'd conflict (forcing bypasses
       eligibility filtering entirely) — that's an admin contradiction and
       we let the more specific/explicit instruction (the course lock) win,
       surfaced via lock_warnings if it actually collides.

  * `build_slots` signature gains `locks=None` (defaults to no-op so
    existing callers/tests don't break) and now returns a 3-tuple:
    `(slots_dict, manual_review, lock_warnings)`. main.py/engine.py need
    the one-line change to thread the third value through as
    `result["lock_warnings"]`.

Everything from v7 (priority ordering, 0-credit filtering, unplaced vs
overflow, shared_lab_with anti-affinity, faculty adjacency soft-tolerance)
is unchanged and still applies to every assignment that ISN'T locked.
"""

import sys
import uuid
import random
from collections import defaultdict

LAB_DAYS = ["Monday", "Tuesday", "Thursday"]
LAB_LABEL = "LAB"

MAX_FACULTY_ADJACENCY_VIOLATIONS = 2
PRIORITY_CREDITS = (3, 4)

SPECIAL_CLASSIFICATION = {
    "G": "minor",
    "H": "oe",
    "TUT": "tutorial",
    "1-CREDIT": "1credit",
}

# ── entry builders ──────────────────────────────────────────────────────────

def _make_entry(a, sync_group_id=None):
    return {
        "id": str(uuid.uuid4()),
        "course": a["course_id"]["course_code"],
        "faculty": a["faculty_id"]["faculty_code"],
        "faculty_id": str(a["faculty_id"]["_id"]),
        "batches": [b["batch_name"] for b in a["batch_ids"]],
        "batch_ids": [str(b["_id"]) for b in a["batch_ids"]],
        "assignment_id": str(a["_id"]),
        "component_type": a.get("component_type", "lecture"),
        "sync_group_id": sync_group_id,
        "adjacency_soft_violation": False,
        # NEW — purely informational, lets the frontend badge a cell as
        # admin-pinned rather than engine-placed.
        "is_locked": False,
    }

def _make_lab_entry(a, sync_group_id=None, shared_group_id=None):
    entry = _make_entry(a, sync_group_id)
    entry.update({
        "is_lab": True,
        "duration": a.get("duration", 3),
        "shared_group_id": shared_group_id,
        "sessions_per_week": 1,
    })
    return entry

def _classify(a):
    component = a.get("component_type", "lecture")
    duration = a.get("duration", 1)
    atype = a.get("assignment_type", "regular")

    if component == "lab" or duration > 1:
        return "lab"
    if atype == "minor" or component == "minor":
        return "minor"
    if atype in ("oe", "open_elective") or component in ("oe", "open_elective"):
        return "oe"
    if atype == "tutorial" or component == "tutorial":
        return "tutorial"
    credits = int(a.get("course_id", {}).get("credits", a.get("sessions_per_week", 1)))
    if credits == 1:
        return "1credit"
    return "theory"

def _credits(a):
    return int(a.get("course_id", {}).get("credits", a.get("sessions_per_week", 1)))

def _sessions_per_week(a):
    return int(a.get("sessions_per_week") or a.get("course_id", {}).get("credits", 1))

def _eligible_labels(classification, occurrence_counts):
    labels = []
    for label, count in occurrence_counts.items():
        if label == LAB_LABEL:
            continue
        kind = SPECIAL_CLASSIFICATION.get(label, "theory")
        if kind == classification:
            labels.append(label)
    return labels

# ── connected components for synced_with ────────────────────────────────────

def _resolve_sync_groups(assignments):
    by_id = {str(a["_id"]): a for a in assignments}
    adj = defaultdict(set)

    for a in assignments:
        aid = str(a["_id"])
        for other in a.get("synced_with", []) or []:
            oid = str(other)
            if oid in by_id:
                adj[aid].add(oid)
                adj[oid].add(aid)

    visited = set()
    groups = []
    for a in assignments:
        aid = str(a["_id"])
        if aid in visited:
            continue
        stack = [aid]
        component = []
        while stack:
            node = stack.pop()
            if node in visited:
                continue
            visited.add(node)
            component.append(node)
            stack.extend(adj[node] - visited)
        groups.append([by_id[nid] for nid in component])

    return groups

# ── priority ordering (v7) ───────────────────────────────────────────────────

def _group_priority(group):
    return 0 if any(_credits(a) in PRIORITY_CREDITS for a in group) else 1

# ── hard-constraint checks ───────────────────────────────────────────────────

def _occupants(bucket):
    faculty_ids = set()
    batch_ids = set()
    for e in bucket:
        faculty_ids.add(e["faculty_id"])
        batch_ids.update(e["batch_ids"])
    return faculty_ids, batch_ids

def _clashes_in_bucket(entries_to_place, bucket, sync_group_id):
    existing_faculty, existing_batches = _occupants(bucket)

    for e in entries_to_place:
        others_in_batch_check = [
            o for o in entries_to_place
            if o is not e and not (
                sync_group_id is not None
                and o.get("sync_group_id") == sync_group_id
                and o["faculty_id"] == e["faculty_id"]
            )
        ]
        combined_faculty = existing_faculty | {
            o["faculty_id"] for o in others_in_batch_check
        }
        combined_batches = existing_batches | set().union(
            *(set(o["batch_ids"]) for o in others_in_batch_check)
        ) if others_in_batch_check else existing_batches

        if e["faculty_id"] in combined_faculty:
            return True
        if set(e["batch_ids"]) & combined_batches:
            return True

    return False

def _clashes_with_adjacency(entries_to_place, label, buckets, adjacency_map,
                             faculty_violation_counts,
                             max_violations=MAX_FACULTY_ADJACENCY_VIOLATIONS):
    neighbor_labels = adjacency_map.get(label, [])
    soft_hits = set()
    for neighbor_label in neighbor_labels:
        neighbor_bucket = buckets.get(neighbor_label, [])
        n_faculty, _ = _occupants(neighbor_bucket)
        for e in entries_to_place:
            if e["faculty_id"] in n_faculty:
                if faculty_violation_counts.get(e["faculty_id"], 0) >= max_violations:
                    return True, soft_hits
                soft_hits.add(e["faculty_id"])
    return False, soft_hits

def _can_place(entries_to_place, label, buckets, adjacency_map, sync_group_id,
                faculty_violation_counts):
    bucket = buckets.get(label, [])
    if _clashes_in_bucket(entries_to_place, bucket, sync_group_id):
        return False, set()
    blocked, soft_hits = _clashes_with_adjacency(
        entries_to_place, label, buckets, adjacency_map, faculty_violation_counts,
    )
    if blocked:
        return False, set()
    return True, soft_hits

# ── candidate ranking ────────────────────────────────────────────────────────

def _rank_candidates(eligible_labels, occurrence_counts, spw, rng):
    exact = [l for l in eligible_labels if occurrence_counts.get(l, 0) == spw]
    over = sorted(
        (l for l in eligible_labels if occurrence_counts.get(l, 0) > spw),
        key=lambda l: occurrence_counts[l],
    )
    under = sorted(
        (l for l in eligible_labels if 0 < occurrence_counts.get(l, 0) < spw),
        key=lambda l: -occurrence_counts[l],
    )
    rng.shuffle(exact)
    return exact + over + under

# ── manual review item builders ─────────────────────────────────────────────

def _overflow_item(a, sessions_needed, reason):
    return {
        "assignment_id": str(a["_id"]),
        "kind": "overflow",
        "sessions_needed": sessions_needed,
        "reason": reason,
    }

def _unplaced_item(a, sessions_needed, reason):
    return {
        "assignment_id": str(a["_id"]),
        "kind": "unplaced",
        "sessions_needed": sessions_needed,
        "reason": reason,
    }

def _choose_occurrences_item(a, anchor_label, available_days, sessions_to_choose, reason):
    return {
        "assignment_id": str(a["_id"]),
        "kind": "choose_occurrences",
        "anchor_label": anchor_label,
        "available_days": available_days,
        "sessions_to_choose": sessions_to_choose,
        "reason": reason,
    }

def _days_for_label(label, skeleton_days_by_label):
    return skeleton_days_by_label.get(label, [])

# ── NEW (v8): lock application ───────────────────────────────────────────────

def _lock_warning(a, slot_name, message):
    return {
        "assignment_id": str(a["_id"]),
        "slot_name": slot_name,
        "message": message,
    }

def _empty_locked_batches_for(label, empty_locks):
    """Which batch_ids are locked OFF this label. `label` here is already the
    concrete bucket key — a theory label like 'B', or a lab bucket like
    'LAB_MONDAY' — matching how empty locks are stored (slotLockController
    expands the 'LAB' skeleton placeholder into the three concrete names at
    lock-creation time, so no further expansion is needed here)."""
    return set(empty_locks.get(label, []))

def _group_blocked_by_empty_lock(group_batch_ids, label, empty_locks):
    locked_batches = _empty_locked_batches_for(label, empty_locks)
    if not locked_batches:
        return False
    return bool(set(group_batch_ids) & locked_batches)

def _apply_course_locks(assignments, occurrence_counts, buckets, locks,
                         faculty_violation_counts, lock_warnings):
    """
    Pulls every course-locked assignment out of `assignments` and force-places
    it directly into its target bucket. Returns the remaining (unlocked)
    assignments for the normal pipeline to process.

    Force-place means: skip _can_place entirely (the admin's decision
    overrides eligibility/clash checks), but still detect what it collides
    with and report it via lock_warnings rather than silently corrupting the
    conflict-detection state other unlocked placements rely on.
    """
    course_locks = locks.get("course") or {}
    if not course_locks:
        return list(assignments)

    remaining = []
    for a in assignments:
        aid = str(a["_id"])
        target = course_locks.get(aid)
        if target is None:
            remaining.append(a)
            continue

        entry = _make_entry(a)
        entry["is_locked"] = True
        if a.get("component_type") == "lab" or a.get("duration", 1) > 1:
            entry.update({"is_lab": True, "duration": a.get("duration", 3)})

        bucket = buckets.setdefault(target, [])

        existing_faculty, existing_batches = _occupants(bucket)
        if entry["faculty_id"] in existing_faculty:
            lock_warnings.append(_lock_warning(
                a, target,
                f"{a['course_id']['course_code']} is locked to '{target}', but "
                f"its faculty is already teaching something else there.",
            ))
        if set(entry["batch_ids"]) & existing_batches:
            lock_warnings.append(_lock_warning(
                a, target,
                f"{a['course_id']['course_code']} is locked to '{target}', but "
                f"one of its batches already has a class there.",
            ))

        bucket.append(entry)

        if occurrence_counts.get(target, 0) == 0:
            lock_warnings.append(_lock_warning(
                a, target,
                f"'{target}' isn't a recognized recurring label in the active "
                f"skeleton — {a['course_id']['course_code']} was still pinned "
                f"there, but check it prints correctly.",
            ))

    return remaining

# ── theory / minor / oe / 1-credit placement (unified) ─────────────────────

def _place_group(group, classification, buckets, occurrence_counts,
                  adjacency_map, skeleton_days_by_label, manual_review, rng,
                  faculty_violation_counts, empty_locks):
    sync_group_id = str(uuid.uuid4()) if len(group) > 1 else None

    anchor = min(group, key=_sessions_per_week)
    anchor_spw = _sessions_per_week(anchor)

    group_batch_ids = {
        str(b["_id"]) for a in group for b in a["batch_ids"]
    }

    eligible = _eligible_labels(classification, occurrence_counts)
    # NEW (v8): drop any label this group is empty-locked out of.
    eligible = [
        l for l in eligible
        if not _group_blocked_by_empty_lock(group_batch_ids, l, empty_locks)
    ]
    candidates = _rank_candidates(eligible, occurrence_counts, anchor_spw, rng)

    entries_by_assignment = {
        str(a["_id"]): _make_entry(a, sync_group_id) for a in group
    }
    all_entries = list(entries_by_assignment.values())

    placed_label = None
    placed_soft_hits = set()
    for label in candidates:
        ok, soft_hits = _can_place(
            all_entries, label, buckets, adjacency_map, sync_group_id,
            faculty_violation_counts,
        )
        if ok:
            placed_label = label
            placed_soft_hits = soft_hits
            break

    if placed_label is None:
        for a in group:
            manual_review.append(_unplaced_item(
                a, _sessions_per_week(a),
                f"No skeleton label of type '{classification}' could fit "
                f"{a['course_id']['course_code']} without a faculty/batch "
                f"or adjacency clash (or every eligible label is locked empty "
                f"for its batch). Can only be placed into an empty minor/OE "
                f"period at admin discretion, or locked to a specific slot.",
            ))
        return

    buckets.setdefault(placed_label, []).extend(all_entries)

    if placed_soft_hits:
        for fid in placed_soft_hits:
            faculty_violation_counts[fid] = faculty_violation_counts.get(fid, 0) + 1
        for e in all_entries:
            if e["faculty_id"] in placed_soft_hits:
                e["adjacency_soft_violation"] = True

    anchor_count = occurrence_counts.get(placed_label, 0)
    anchor_days = _days_for_label(placed_label, skeleton_days_by_label)

    for a in group:
        spw = _sessions_per_week(a)
        if spw > anchor_count:
            manual_review.append(_overflow_item(
                a, spw - anchor_count,
                f"{a['course_id']['course_code']} needs {spw}/week but its "
                f"{'sync anchor' if len(group) > 1 else 'assigned'} label "
                f"'{placed_label}' only occurs {anchor_count}x/week.",
            ))
        elif spw < anchor_count:
            manual_review.append(_choose_occurrences_item(
                a, placed_label, anchor_days, spw,
                f"{a['course_id']['course_code']} only needs {spw}/week; "
                f"pick {spw} of the {anchor_count} days label "
                f"'{placed_label}' occurs on ({', '.join(anchor_days)}).",
            ))

# ── lab placement ────────────────────────────────────────────────────────────

def _group_lab_assignments_by_course(lab_assignments, exclusion_map):
    by_course = defaultdict(list)
    for a in lab_assignments:
        by_course[str(a["course_id"]["_id"])].append(a)

    groups = []
    for course_assignments in by_course.values():
        ids = {str(a["_id"]) for a in course_assignments}
        has_internal_exclusion = any(
            exclusion_map.get(str(a["_id"]), set()) & (ids - {str(a["_id"])})
            for a in course_assignments
        )
        if has_internal_exclusion:
            groups.extend([a] for a in course_assignments)
        else:
            groups.append(course_assignments)
    return groups

def _build_lab_exclusion_map(lab_assignments):
    valid_ids = {str(a["_id"]) for a in lab_assignments}
    exclusion = defaultdict(set)
    for a in lab_assignments:
        aid = str(a["_id"])
        for other_id in a.get("shared_lab_with", []) or []:
            oid = str(other_id)
            if oid in valid_ids:
                exclusion[aid].add(oid)
                exclusion[oid].add(aid)
    return exclusion

def _place_labs(lab_assignments, occurrence_counts, adjacency_map, manual_review, rng,
                 faculty_violation_counts, empty_locks):
    lab_slots = {day: [] for day in LAB_DAYS}
    lab_label_days = [d for d in LAB_DAYS if occurrence_counts.get(LAB_LABEL, 0) > 0]
    if not lab_label_days:
        lab_label_days = LAB_DAYS

    exclusion_map = _build_lab_exclusion_map(lab_assignments)
    placed_day_by_assignment = {}

    groups = _group_lab_assignments_by_course(lab_assignments, exclusion_map)
    groups.sort(key=lambda g: (_group_priority(g), -sum(len(a["batch_ids"]) for a in g)))

    for group in groups:
        shared_group_id = str(uuid.uuid4()) if len(group) > 1 else None
        entries = [_make_lab_entry(a, shared_group_id=shared_group_id) for a in group]
        group_ids = {str(a["_id"]) for a in group}
        group_batch_ids = {str(b["_id"]) for a in group for b in a["batch_ids"]}

        placed_day = None
        placed_soft_hits = set()
        for day in rng.sample(lab_label_days, len(lab_label_days)):
            bucket_key = f"LAB_{day.upper()}"

            # NEW (v8): skip this day if the group is empty-locked out of it.
            if _group_blocked_by_empty_lock(group_batch_ids, bucket_key, empty_locks):
                continue

            blocked_by_exclusion = any(
                placed_day_by_assignment.get(linked_id) == day
                for aid in group_ids
                for linked_id in exclusion_map.get(aid, ())
            )
            if blocked_by_exclusion:
                continue

            fake_buckets = {f"LAB@{day}": lab_slots[day]}
            fake_adjacency = {f"LAB@{day}": adjacency_map.get(LAB_LABEL, [])}
            ok, soft_hits = _can_place(
                entries, f"LAB@{day}", fake_buckets, fake_adjacency, shared_group_id,
                faculty_violation_counts,
            )
            if ok:
                placed_day = day
                placed_soft_hits = soft_hits
                break

        if placed_day:
            if placed_soft_hits:
                for fid in placed_soft_hits:
                    faculty_violation_counts[fid] = faculty_violation_counts.get(fid, 0) + 1
                for e in entries:
                    if e["faculty_id"] in placed_soft_hits:
                        e["adjacency_soft_violation"] = True
            lab_slots[placed_day].extend(entries)
            for aid in group_ids:
                placed_day_by_assignment[aid] = placed_day
        else:
            for a in group:
                manual_review.append(_unplaced_item(
                    a, 1,
                    f"Lab {a['course_id']['course_code']} could not be placed "
                    f"on any of {', '.join(lab_label_days)} without a clash, a "
                    f"lab-resource conflict with a linked assignment, or every "
                    f"day being locked empty for its batch.",
                ))

    return lab_slots

# ── entry point ───────────────────────────────────────────────────────────

def build_slots(assignments, occurrence_counts, adjacency_map,
                 skeleton_days_by_label, seed=1, locks=None):
    """
    Returns (slots_dict, manual_review, lock_warnings).

    `locks`: { "course": { assignment_id: slot_name }, "empty": { slot_name:
    [batch_id,...] } }. Defaults to empty on both keys if not provided, so
    existing callers see identical behaviour to v7.
    """
    locks = locks or {}
    course_locks = locks.get("course") or {}
    empty_locks = locks.get("empty") or {}

    rng = random.Random(seed)
    manual_review = []
    lock_warnings = []
    faculty_violation_counts = {}

    assignments = [a for a in assignments if _credits(a) != 0]

    buckets = {}

    # NEW (v8): resolve every course lock FIRST, against the full assignment
    # list (before lab/non-lab split — a lock can target a lab bucket just as
    # well as a theory label). Locked assignments never enter the normal
    # pipeline below.
    assignments = _apply_course_locks(
        assignments, occurrence_counts, buckets, {"course": course_locks},
        faculty_violation_counts, lock_warnings,
    )

    lab_assignments = [a for a in assignments if _classify(a) == "lab"]
    non_lab = [a for a in assignments if _classify(a) != "lab"]

    sync_groups = _resolve_sync_groups(non_lab)
    sync_groups.sort(key=_group_priority)

    for group in sync_groups:
        classifications = {_classify(a) for a in group}
        if len(classifications) > 1:
            print(
                f"[slot_generator] WARNING: synced_with group mixes "
                f"classifications {classifications} — using anchor's.",
                file=sys.stderr,
            )
        anchor = min(group, key=_sessions_per_week)
        classification = _classify(anchor)

        if classification == "tutorial":
            for a in group:
                manual_review.append(_overflow_item(
                    a, _sessions_per_week(a),
                    f"{a['course_id']['course_code']} is a tutorial-hour "
                    f"course; TUT slots are reserved for admin discretion "
                    f"and are not auto-assigned by the generator.",
                ))
            continue

        _place_group(
            group, classification, buckets, occurrence_counts,
            adjacency_map, skeleton_days_by_label, manual_review, rng,
            faculty_violation_counts, empty_locks,
        )

    lab_slots = _place_labs(
        lab_assignments, occurrence_counts, adjacency_map, manual_review, rng,
        faculty_violation_counts, empty_locks,
    )

    result = dict(buckets)
    for day, entries in lab_slots.items():
        if entries:
            result.setdefault(f"LAB_{day.upper()}", [])
            result[f"LAB_{day.upper()}"].extend(entries)

    return result, manual_review, lock_warnings