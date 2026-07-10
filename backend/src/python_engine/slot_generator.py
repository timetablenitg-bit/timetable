"""
slot_generator.py  –  v5
=============================================
Changes from v4:

  * BUGFIX: `shared_lab_with` anti-affinity was silently unenforced
    whenever the two linked assignments belonged to the SAME course.
    `_group_lab_assignments_by_course` grouped every lab assignment for
    a course into a single atomic placement block *before* the
    exclusion map was ever consulted, and that block is always placed
    on one single day. Two same-course assignments therefore always
    landed on the same day together, and the exclusion check (which
    only compares a group being placed against *other already-placed
    groups*) never got a chance to fire, because they were the same
    group.

    This is exactly the most common real case for the field (two
    batch-split lab sections of the same course sharing one physical
    lab room, needing to run on different days). Fixed by building the
    lab exclusion map first and passing it into
    `_group_lab_assignments_by_course`, which now splits a course's
    assignments into separate singleton placement groups whenever an
    exclusion edge exists between any of them. Course-level batch-split
    convenience grouping is otherwise unchanged for courses with no
    internal shared_lab_with links.

Changes from v3 (still in effect):

  * shared_lab_with SEMANTICS FLIP (schema change: ref went from Course
    to CourseAssignment). Previously this field meant "merge these lab
    assignments into one combined block" — two linked assignments got a
    shared shared_group_id and were placed together on purpose, with
    same-faculty overlap explicitly waived for members of that group.
    That's gone. The field is now an ANTI-AFFINITY constraint: linked
    assignments compete for the same physical lab resource and must NOT
    land on the same lab day, full stop, regardless of faculty/batch.

    Course-level batch-split grouping (assignments sharing a course_id
    auto-placed together) is UNCHANGED in spirit but is now
    exclusion-aware — see the v5 bugfix above — and is otherwise
    independent of shared_lab_with — `_resolve_shared_lab_groups` (course-id
    graph + shared_lab_with union-find) is gone, replaced by
    `_group_lab_assignments_by_course` (grouping, now exclusion-aware) and
    `_build_lab_exclusion_map` (pairwise exclusion, built over
    assignment ids, no transitive closure — only direct explicit pairs
    are honored, per the "ONLY if explicitly linked" rule).

    NOTE: `_build_lab_exclusion_map` only recognizes ids that belong to
    another *lab*-classified assignment in this run (`valid_ids` is
    scoped to `lab_assignments`). If shared_lab_with references a
    non-lab assignment, that reference is silently ignored here — see
    the "flag elsewhere" notes for why this should be validated
    upstream instead.

Changes from v2 (still in effect):

  * BUGFIX (rule 2.1): `_clashes_with_adjacency` was blocking on BOTH
    faculty overlap AND batch overlap between neighboring labels. The
    rule only ever asked for faculty back-to-back to be avoided — a
    batch sitting in two consecutive periods is completely normal
    timetable structure, and same-slot batch collision is already
    handled separately by `_clashes_in_bucket`. The batch check here was
    silently killing placement for almost any reasonably full course
    load, which is why so much was overflowing to manual review. Removed.

  * RULE 5: faculty back-to-back was previously a hard, zero-tolerance
    block. Rule 5 asks for up to 2 instances per faculty to be *allowed*
    with a scoring penalty rather than forced into manual review. Each
    label now threads a shared `faculty_violation_counts` dict through
    placement; the first two adjacency hits for a given faculty are
    permitted and the placed entries are flagged
    `adjacency_soft_violation=True` so scorer.py can penalize them. Only
    the 3rd+ hit for that faculty is a hard block.

  * RULE 1 (TUT): tutorial-classified assignments are no longer run
    through the normal placement path at all. TUT slots are reserved
    for the admin's discretion, not auto-filled by the generator, so
    every tutorial-classified assignment is routed straight to manual
    review regardless of whether a TUT label technically had room.

No more blind bin-packing into a fixed A-F/G/H/TUT/1-CREDIT alphabet.
Instead:

  * `occurrence_counts`  (label -> how many distinct days/week it occurs,
     derived Node-side from the active skeleton via
     utils/skeletonDerivation.js::getSlotOccurrenceCount)
  * `adjacency_map`      (label -> [labels that ever sit immediately next
     to it, unioned across both possible tracks — see decision #5)

...are passed in as part of the engine's stdin payload and drive every
placement decision. Nothing here assumes "there are exactly slots A-F and
each repeats 3x" any more — that was the old hardcoded behaviour.

Anything that can't be cleanly auto-placed (no label offers enough
occurrences, or every candidate clashes) is NOT dropped silently and NOT
overflowed into whatever special slot happens to be free. It's returned
in `manual_review_items` for the Node layer to persist and surface to the
admin (models/manualReviewModel.js).

synced_with groups: resolved into connected components first. The whole
group is anchored to the smallest-sessions_per_week member's label/days.
Members needing MORE sessions than the anchor offers get the excess
routed into the same overflow manual-review path as an ordinary
overflow course. Members needing FEWER occurrences than the anchor
label's total count get a choose_occurrences manual-review item, scoped
to the anchor's actual days — same mechanism a standalone 2-credit
course goes through. There is no separate sync-specific placement path;
sync only decides which label a group is anchored to (decision #6).

shared_lab_with: two lab assignments linked this way must NOT be placed
on the same lab day (anti-affinity, see the v4 changelog above). This is
now the only meaning of shared_lab_with; it no longer merges entries.
Same-faculty/batch collision within a single course's own batch-split
group is still checked like anything else. No room/resource concept
exists anywhere else in this system (decision #1) — this exclusion map
is effectively standing in for "same physical lab" without modeling labs
as a resource generally.
"""

import sys
import uuid
import random
from collections import defaultdict

LAB_DAYS = ["Monday", "Tuesday", "Thursday"]
LAB_LABEL = "LAB"

# Faculty back-to-back is a soft constraint (rule 5): the first two
# adjacency hits for a given faculty in a run are allowed (and penalized
# in scorer.py); the 3rd+ is a hard block.
MAX_FACULTY_ADJACENCY_VIOLATIONS = 2

# Label -> classification, purely by naming convention (matches the
# default skeleton seeded from the old hardcoded TEMPLATE). If the admin
# introduces new label names via the skeleton editor, they fall through
# to "theory" unless they match one of these reserved names.
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
        # Rule 5: set True if this entry landed next to a label already
        # holding the same faculty, within the tolerated allowance.
        "adjacency_soft_violation": False,
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

def _sessions_per_week(a):
    return int(a.get("sessions_per_week") or a.get("course_id", {}).get("credits", 1))

def _eligible_labels(classification, occurrence_counts):
    """Which skeleton labels are valid targets for a given classification.

    Note: "tutorial" classified assignments never reach this function —
    build_slots() routes them straight to manual review before calling
    _place_group (rule 1: TUT is admin-discretion only, not auto-filled).
    """
    labels = []
    for label, count in occurrence_counts.items():
        if label == LAB_LABEL:
            continue  # labs are handled by the dedicated lab pass below
        kind = SPECIAL_CLASSIFICATION.get(label, "theory")
        if kind == classification:
            labels.append(label)
    return labels

# ── connected components for synced_with ────────────────────────────────────

def _resolve_sync_groups(assignments):
    """
    synced_with holds CourseAssignment _ids, possibly not symmetric in the
    data (A lists B, but B might not list A). Build an undirected graph
    and return connected components as lists of assignment dicts.
    Assignments with no synced_with (or empty) are their own singleton
    group.
    """
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
        # BFS
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

# ── hard-constraint checks ───────────────────────────────────────────────────

def _occupants(bucket):
    """(faculty_ids used, batch_ids used) currently in a label's bucket."""
    faculty_ids = set()
    batch_ids = set()
    for e in bucket:
        faculty_ids.add(e["faculty_id"])
        batch_ids.update(e["batch_ids"])
    return faculty_ids, batch_ids

def _clashes_in_bucket(entries_to_place, bucket, sync_group_id):
    """
    entries_to_place: the (one or more, if synced) entries that would all
    land in this same bucket together.
    Same-faculty members of the SAME sync group count as one occupant
    (genuine combined class) — they don't clash with each other, but they
    DO still clash with anything else already in the bucket, and
    different-faculty sync members are independently checked like normal
    entries (decision #6).
    """
    existing_faculty, existing_batches = _occupants(bucket)

    for e in entries_to_place:
        # skip comparison against fellow group members with the same
        # faculty — that's the intentional combined-class case.
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
    """
    Rule 2.1 / rule 5: only FACULTY back-to-back is constrained — a batch
    sitting in two consecutive periods is normal timetable structure, not
    a clash (same-slot batch collision is handled separately by
    _clashes_in_bucket, and that check is untouched).

    Rule 5: a given faculty is allowed up to `max_violations` back-to-back
    instances across the whole run before this becomes a hard block.
    Instances under that limit are permitted here but reported back as
    soft hits so the caller can flag the entries and bump the shared
    counter — scorer.py penalizes flagged entries.

    Returns (blocked: bool, soft_violation_faculty_ids: set)
    """
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
    """Returns (can_place: bool, soft_violation_faculty_ids: set)."""
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
    """
    Prefer an exact match (count == spw, no admin follow-up needed).
    Then prefer the smallest count >= spw (least excess -> smaller
    choose_occurrences ask). Then, as a last resort, the largest count
    < spw (best partial placement -> smallest overflow ask).
    Shuffled within each tier for load balancing across generation runs.
    """
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

# ── theory / minor / oe / 1-credit placement (unified) ─────────────────────
# (tutorial is intercepted earlier in build_slots and never reaches here)

def _place_group(group, classification, buckets, occurrence_counts,
                  adjacency_map, skeleton_days_by_label, manual_review, rng,
                  faculty_violation_counts):
    """
    group: list of assignment dicts that are all synced together (size 1
    if not synced). Anchored to the member with the smallest spw.
    """
    sync_group_id = str(uuid.uuid4()) if len(group) > 1 else None

    anchor = min(group, key=_sessions_per_week)
    anchor_spw = _sessions_per_week(anchor)

    eligible = _eligible_labels(classification, occurrence_counts)
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
        # Could not place the group at all -> everyone goes to manual
        # review for their full session count.
        for a in group:
            manual_review.append(_overflow_item(
                a, _sessions_per_week(a),
                f"No skeleton label of type '{classification}' could fit "
                f"{a['course_id']['course_code']} without a faculty/batch "
                f"or adjacency clash.",
            ))
        return

    buckets.setdefault(placed_label, []).extend(all_entries)

    # Rule 5: commit the soft violations — bump the shared per-faculty
    # counter and flag the placed entries so scorer.py can penalize them.
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
        # spw == anchor_count -> perfectly placed, nothing further needed.

# ── lab placement ────────────────────────────────────────────────────────────

def _group_lab_assignments_by_course(lab_assignments, exclusion_map):
    """
    Assignments for the same course are still placed together as one lab
    block by default — this is a batch-split convenience, independent of
    shared_lab_with in the general case.

    BUGFIX (v5): if two assignments *within the same course* are linked
    via shared_lab_with, merging them unconditionally into one block
    would place them on the same day together, and the anti-affinity
    check would never get a chance to run (it only compares a group
    being placed against other, separately-placed groups). So: whenever
    a course's assignments contain an internal shared_lab_with edge, we
    don't merge that course at all — every assignment in it becomes its
    own singleton placement group instead, so each goes through
    placement (and therefore the exclusion check against each other)
    independently. Courses with no internal exclusion edges are grouped
    exactly as before.
    """
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
    """
    shared_lab_with now holds CourseAssignment _ids (was Course _ids).
    It's an anti-affinity constraint, not a merge request: linked
    assignments compete for the same physical lab and must NOT be placed
    on the same lab day, regardless of faculty/batch overlap. Only
    direct explicit pairs are honored (no transitive closure), and only
    ids that belong to another lab-classified assignment in this run are
    recognized — a reference to a non-lab assignment is silently dropped
    here (see the "flag elsewhere" notes: this really should be
    validated upstream instead of swallowed here).
    """
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
                 faculty_violation_counts):
    """
    Builds LAB_MONDAY / LAB_TUESDAY / LAB_THURSDAY arrays. Course-level
    batch-split groups are placed together as one block (see
    _group_lab_assignments_by_course), except where shared_lab_with
    forces a split within the course itself (v5 bugfix).
    shared_lab_with-linked assignments are kept OFF the same day as each
    other (see _build_lab_exclusion_map) — this is checked independently
    of, and in addition to, the normal faculty/batch clash and adjacency
    checks (decision #1, #4).
    """
    lab_slots = {day: [] for day in LAB_DAYS}
    lab_label_days = [d for d in LAB_DAYS if occurrence_counts.get(LAB_LABEL, 0) > 0]
    if not lab_label_days:
        lab_label_days = LAB_DAYS  # fall back if skeleton didn't report it

    # Build the exclusion map FIRST — grouping needs to know about it so
    # it doesn't merge mutually-excluded assignments into one atomic
    # block before the exclusion check ever gets a chance to run.
    exclusion_map = _build_lab_exclusion_map(lab_assignments)
    placed_day_by_assignment = {}  # assignment_id -> day it landed on

    groups = _group_lab_assignments_by_course(lab_assignments, exclusion_map)
    groups.sort(key=lambda g: -sum(len(a["batch_ids"]) for a in g))

    for group in groups:
        shared_group_id = str(uuid.uuid4()) if len(group) > 1 else None
        entries = [_make_lab_entry(a, shared_group_id=shared_group_id) for a in group]
        group_ids = {str(a["_id"]) for a in group}

        placed_day = None
        placed_soft_hits = set()
        for day in rng.sample(lab_label_days, len(lab_label_days)):
            # anti-affinity: skip this day if any assignment in the group
            # is linked (via shared_lab_with) to something already placed
            # here today.
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
                manual_review.append(_overflow_item(
                    a, 1,
                    f"Lab {a['course_id']['course_code']} could not be placed "
                    f"on any of {', '.join(lab_label_days)} without a clash "
                    f"or a lab-resource conflict with a linked assignment.",
                ))

    return lab_slots

# ── entry point ───────────────────────────────────────────────────────────

def build_slots(assignments, occurrence_counts, adjacency_map,
                 skeleton_days_by_label, seed=1):
    """
    occurrence_counts / adjacency_map: see utils/skeletonDerivation.js —
    computed Node-side from the active skeleton and passed straight
    through the JSON payload.
    skeleton_days_by_label: label -> [days it occurs on], also derived
    Node-side (companion to occurrence_counts; needed to scope
    choose_occurrences items to real days).
    """
    rng = random.Random(seed)
    manual_review = []

    # Rule 5: shared across the whole run so a faculty's violation count
    # accumulates across every label/group they're placed into, not just
    # within one group's placement attempt.
    faculty_violation_counts = {}

    lab_assignments = [a for a in assignments if _classify(a) == "lab"]
    non_lab = [a for a in assignments if _classify(a) != "lab"]

    sync_groups = _resolve_sync_groups(non_lab)

    buckets = {}
    for group in sync_groups:
        # All members of a sync group are expected to share a
        # classification (they're meant to occupy the same slot). If they
        # don't, we classify by the anchor (smallest-spw member) and flag
        # the mismatch for the admin rather than silently guessing.
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
            # Rule 1: TUT slots are reserved for the admin's discretion.
            # The generator does not auto-place tutorial-classified
            # assignments at all, regardless of TUT's occurrence count —
            # every member goes straight to manual review.
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
            faculty_violation_counts,
        )

    lab_slots = _place_labs(
        lab_assignments, occurrence_counts, adjacency_map, manual_review, rng,
        faculty_violation_counts,
    )

    result = dict(buckets)
    for day, entries in lab_slots.items():
        if entries:
            result[f"LAB_{day.upper()}"] = entries

    return result, manual_review