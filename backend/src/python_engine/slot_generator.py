"""
slot_generator.py  –  v8
=============================================
Changes from v7 (backlog support — cases 3 & 4):

  * CASE 3 — drop_course_id (>2 backlogs, admin has the student drop a
    current-sem course). A backlog CourseAssignment's batch_ids still
    overlap with the batch's other courses (same batch, whole-batch
    semantics), so without this change a backlog row could never share a
    slot with any of the batch's own regular courses — _clashes_in_bucket
    would always flag the batch overlap as a hard clash. drop_course_id
    is the admin's explicit signal that THIS ONE current-sem assignment is
    being dropped by the backlog-taking students, so the batch-overlap
    check is now exempted for that one specific pair only. Faculty-overlap
    is NOT exempted — a faculty genuinely can't be in two places, drop or
    not. Threaded through as a plain field on the placement entry
    (_make_entry), read by the rewritten _clashes_in_bucket.

  * CASE 4 — parallel_with (disjoint backlog groups sharing a slot, e.g.
    Maths-backlog + Chem-backlog run at the same time because no student
    has both). This is NOT synced_with — members stay separate sessions
    with their own faculty, they just need to land on the SAME skeleton
    label together. Resolved as connected components OVER the already
    -resolved synced_with groups (union-find on sync-group indices, edges
    from parallel_with, backlog assignments only) via
    _resolve_parallel_units(). Clusters of >1 sync-group are placed as one
    atomic unit by _place_parallel_unit(): every candidate label is tried
    by simulating each sub-group's entries landing in it in turn (so they
    still clash-check against each other, same as anything else sharing a
    bucket) — only committed if ALL sub-groups fit. If no single label
    works for the whole cluster, the WHOLE cluster is reported unplaced
    (all-or-nothing — partially honoring an explicit parallel grouping
    would silently ignore what the admin asked for). Scope: only resolved
    over non-lab groups — labs already have their own affinity mechanism
    (shared_lab_with, anti-affinity) and case 4 in the spec was a
    theory-slot scenario; parallel labs are out of scope for this pass.

Everything below this point (v7 and earlier changelog) is unchanged in
behaviour — priority credits, 0-credit filtering, lab exclusion via
shared_lab_with, rule 1 (TUT), rule 5 (soft faculty adjacency), sync
group resolution, unplaced-vs-overflow distinction — see prior changelog
entries preserved below for context.
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

# Credit values that get first pick of slots (v7 priority rule).
PRIORITY_CREDITS = (3, 4)

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
        # 🔥 NEW (case 3) — carried through so _clashes_in_bucket can exempt
        # this entry from a batch clash against the ONE current-sem
        # assignment it's explicitly marked to replace. None for anything
        # that isn't a backlog row with drop_course_id set.
        "drop_course_id": (
            str(a["drop_course_id"]) if a.get("drop_course_id") else None
        ),
        # 🔥 NEW (case 4) — set to a shared id post-hoc by
        # _place_parallel_unit when this entry is part of a parallel_with
        # unit; None otherwise (matches drop_course_id's default pattern).
        "parallel_group_id": None,
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
    """Course credit count, used for the 0-credit exclusion and the
    3/4-credit priority rule (v7). Falls back to sessions_per_week the
    same way _classify() does, so it stays consistent with how the rest
    of the engine already infers credits when course_id.credits is
    missing.
    """
    return int(a.get("course_id", {}).get("credits", a.get("sessions_per_week", 1)))

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

# ── connected components for parallel_with (case 4, NEW) ───────────────────

def _resolve_parallel_units(sync_groups):
    """
    Groups sync_groups together when any of their (backlog) members share a
    parallel_with edge with a member of a DIFFERENT sync_group. Returns a
    list of "units" — each unit is a list of one-or-more sync_groups that
    must all land on the SAME skeleton label together (case 4: disjoint
    backlog groups sharing a slot, e.g. Maths backlog + Chem backlog).

    Only assignment_type == "backlog" participates. A parallel_with edge
    pointing at something not present in this run (already filtered/lab/
    whatever) is silently ignored, same spirit as shared_lab_with's
    "only recognized valid ids" handling.

    Units of length 1 behave exactly like a bare sync_group did before —
    callers should treat len(unit) == 1 as "business as usual".
    """
    id_to_group_idx = {}
    for idx, group in enumerate(sync_groups):
        for a in group:
            id_to_group_idx[str(a["_id"])] = idx

    parent = list(range(len(sync_groups)))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        rx, ry = find(x), find(y)
        if rx != ry:
            parent[rx] = ry

    for group in sync_groups:
        for a in group:
            if a.get("assignment_type") != "backlog":
                continue
            aid = str(a["_id"])
            for other_id in a.get("parallel_with", []) or []:
                oid = str(other_id)
                if oid in id_to_group_idx:
                    union(id_to_group_idx[aid], id_to_group_idx[oid])

    clusters = defaultdict(list)
    for idx in range(len(sync_groups)):
        clusters[find(idx)].append(sync_groups[idx])

    return list(clusters.values())

# ── priority ordering (v7) ───────────────────────────────────────────────────

def _group_priority(group):
    """0 = top priority (placed first), 1 = everything else.

    A synced_with group gets top priority if ANY member is a 3- or
    4-credit course — the group is anchored/placed as a unit anyway, so
    if the admin bundled a priority course into the sync, the whole
    bundle should get first pick of slots along with it.
    """
    return 0 if any(_credits(a) in PRIORITY_CREDITS for a in group) else 1

def _unit_priority(unit):
    """Same idea as _group_priority, extended to a parallel-merged unit
    (list of sync_groups) — top priority if ANY sync_group inside it is
    top priority."""
    return min(_group_priority(g) for g in unit)

# ── hard-constraint checks ───────────────────────────────────────────────────

def _occupants(bucket):
    """(faculty_ids used, batch_ids used) currently in a label's bucket."""
    faculty_ids = set()
    batch_ids = set()
    for e in bucket:
        faculty_ids.add(e["faculty_id"])
        batch_ids.update(e["batch_ids"])
    return faculty_ids, batch_ids

def _is_drop_pair(x, y):
    """
    True if x and y are the explicit drop_course_id pair in EITHER
    direction. drop_course_id is stored one-directionally on the model
    (only the backlog row carries it, pointing at the current-sem
    assignment its students dropped), but which of the two entries is
    already sitting in the bucket vs. being newly placed depends purely
    on placement order (priority-credit tier, then original array order)
    — the backlog row is not guaranteed to always be placed first. A
    one-directional check here would make the exemption silently stop
    working whenever the dropped course happens to land in the bucket
    AFTER the backlog row, so both directions are checked.
    """
    return (x.get("drop_course_id") and x["drop_course_id"] == y.get("assignment_id")) or (
        y.get("drop_course_id") and y["drop_course_id"] == x.get("assignment_id")
    )

def _clashes_in_bucket(entries_to_place, bucket, sync_group_id):
    """
    entries_to_place: the (one or more, if synced) entries that would all
    land in this same bucket together.

    Same-faculty members of the SAME sync group count as one occupant
    (genuine combined class) — they don't clash with each other, but they
    DO still clash with anything else already in the bucket, and
    different-faculty sync members are independently checked like normal
    entries (decision #6).

    🔥 NEW (case 3) — batch overlap between an entry and a bucket occupant
    is exempted when either side's drop_course_id names the other's
    assignment_id (i.e. the admin explicitly marked those backlog students
    as having dropped that specific course) — see _is_drop_pair for why
    both directions are checked. Faculty overlap is never exempted by
    drop_course_id — a faculty member can't be in two places regardless of
    who dropped what.

    Rewritten as pairwise checks (rather than aggregate faculty/batch sets)
    so the drop_course_id exemption can apply per-pair instead of
    all-or-nothing.
    """
    for e in entries_to_place:
        peers = [
            o for o in entries_to_place
            if o is not e and not (
                sync_group_id is not None
                and o.get("sync_group_id") == sync_group_id
                and o["faculty_id"] == e["faculty_id"]
            )
        ]

        for occ in bucket:
            if occ["faculty_id"] == e["faculty_id"]:
                return True
            if _is_drop_pair(e, occ):
                continue  # 🔥 exempted — one side's students dropped the other
            if set(e["batch_ids"]) & set(occ["batch_ids"]):
                return True

        for o in peers:
            if o["faculty_id"] == e["faculty_id"]:
                return True
            if _is_drop_pair(e, o):
                continue
            if set(e["batch_ids"]) & set(o["batch_ids"]):
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

def _unplaced_item(a, sessions_needed, reason):
    """
    v6 — for assignments that got ZERO automatic placement (no eligible
    label had room at all, or no lab day worked). Distinct from
    "overflow": the admin's only legal move here is a minor/OE override
    (see manualReviewController.js::resolveUnplacedItem /
    computeMinorOeAvailability.js), not "place anywhere free".
    """
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
        # review as UNPLACED (not overflow, v6) — the admin's only real
        # option here is a minor/OE override at their discretion, not
        # "place anywhere free" (that's reserved for genuine overflow).
        for a in group:
            manual_review.append(_unplaced_item(
                a, _sessions_per_week(a),
                f"No skeleton label of type '{classification}' could fit "
                f"{a['course_id']['course_code']} without a faculty/batch "
                f"or adjacency clash. Can only be placed into an empty "
                f"minor/OE period at admin discretion.",
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

# ── parallel unit placement (case 4, NEW) ───────────────────────────────────

def _place_parallel_unit(unit, buckets, occurrence_counts, adjacency_map,
                          skeleton_days_by_label, manual_review, rng,
                          faculty_violation_counts):
    """
    unit: list of >= 2 sync_groups (each usually a singleton backlog
    assignment, but could itself be a synced_with group) that the admin
    explicitly marked to run in parallel on the same slot (parallel_with).
    They stay as SEPARATE sessions with their own faculty — unlike
    synced_with, there's no "combined class" waiver — but must all land on
    the SAME skeleton label together.

    All-or-nothing: if no single label can fit every sub-group at once,
    the WHOLE cluster is reported unplaced rather than silently placing
    some members elsewhere — partially honoring an explicit parallel
    grouping would defeat the point of the admin's request.
    """
    sync_group_ids = [
        str(uuid.uuid4()) if len(group) > 1 else None for group in unit
    ]
    all_assignments = [a for group in unit for a in group]

    anchors = [min(group, key=_sessions_per_week) for group in unit]
    classifications = {_classify(a) for a in anchors}
    if len(classifications) > 1:
        print(
            f"[slot_generator] WARNING: parallel_with cluster mixes "
            f"classifications {classifications} — using the first "
            f"member's.",
            file=sys.stderr,
        )
    classification = _classify(anchors[0])

    if classification == "tutorial":
        # Same rule-1 reasoning as the singleton path: TUT is always
        # admin-discretion, parallel grouping or not.
        for a in all_assignments:
            manual_review.append(_overflow_item(
                a, _sessions_per_week(a),
                f"{a['course_id']['course_code']} is a tutorial-hour "
                f"course; TUT slots are reserved for admin discretion "
                f"and are not auto-assigned by the generator.",
            ))
        return

    max_anchor_spw = max(_sessions_per_week(a) for a in anchors)
    eligible = _eligible_labels(classification, occurrence_counts)
    candidates = _rank_candidates(eligible, occurrence_counts, max_anchor_spw, rng)

    entries_by_group = [
        [_make_entry(a, sgid) for a in group]
        for group, sgid in zip(unit, sync_group_ids)
    ]

    placed_label = None
    placed_soft_hits_by_group = None

    for label in candidates:
        had_existing = label in buckets
        original_bucket = buckets.get(label, [])
        trial_bucket = list(original_bucket)
        buckets[label] = trial_bucket

        ok_all = True
        trial_soft_hits = []
        for entries, sgid in zip(entries_by_group, sync_group_ids):
            ok, soft_hits = _can_place(
                entries, label, buckets, adjacency_map, sgid,
                faculty_violation_counts,
            )
            if not ok:
                ok_all = False
                break
            trial_bucket.extend(entries)
            trial_soft_hits.append(soft_hits)

        if ok_all:
            placed_label = label
            placed_soft_hits_by_group = trial_soft_hits
            break  # buckets[label] already holds every sub-group's entries

        # restore — this candidate didn't work for the whole cluster
        if had_existing:
            buckets[label] = original_bucket
        else:
            del buckets[label]

    if placed_label is None:
        for a in all_assignments:
            manual_review.append(_unplaced_item(
                a, _sessions_per_week(a),
                f"{a['course_id']['course_code']} is part of a parallel "
                f"backlog group and no single skeleton label of type "
                f"'{classification}' could fit the whole group together "
                f"without a clash. Can only be placed into an empty "
                f"minor/OE period at admin discretion.",
            ))
        return

    # 🔥 NEW — every entry across every sub-group of this unit shares one
    # parallel_group_id, so the frontend (which otherwise has no way to
    # distinguish "these two entries happen to both match this batch" from
    # "these two were explicitly placed together via parallel_with") can
    # render them as one shared cell instead of picking just one.
    parallel_group_id = str(uuid.uuid4())
    for entries in entries_by_group:
        for e in entries:
            e["parallel_group_id"] = parallel_group_id

    for entries, soft_hits in zip(entries_by_group, placed_soft_hits_by_group):
        if soft_hits:
            for fid in soft_hits:
                faculty_violation_counts[fid] = faculty_violation_counts.get(fid, 0) + 1
            for e in entries:
                if e["faculty_id"] in soft_hits:
                    e["adjacency_soft_violation"] = True

    anchor_count = occurrence_counts.get(placed_label, 0)
    anchor_days = _days_for_label(placed_label, skeleton_days_by_label)

    for group in unit:
        for a in group:
            spw = _sessions_per_week(a)
            if spw > anchor_count:
                manual_review.append(_overflow_item(
                    a, spw - anchor_count,
                    f"{a['course_id']['course_code']} needs {spw}/week but "
                    f"its parallel-group label '{placed_label}' only "
                    f"occurs {anchor_count}x/week.",
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

    v7: groups are ordered priority-first (any 3- or 4-credit course in
    the group jumps the queue), then by batch-size as before, so
    priority labs get first pick of days just like priority theory
    courses get first pick of labels.

    NOTE: parallel_with (case 4) grouping is NOT applied to labs — out of
    scope for this pass (see module docstring).
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
    groups.sort(key=lambda g: (_group_priority(g), -sum(len(a["batch_ids"]) for a in g)))

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
            # v6: no day worked at all for this group -> UNPLACED, not
            # overflow. Same rationale as the theory-side branch above.
            for a in group:
                manual_review.append(_unplaced_item(
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

    # v7 priority rule: a 0-credit course is no course at all — filter it
    # out before anything else (lab/non-lab split, sync resolution,
    # placement, manual_review) ever sees it. No slot, no manual_review
    # entry, nothing.
    assignments = [a for a in assignments if _credits(a) != 0]

    lab_assignments = [a for a in assignments if _classify(a) == "lab"]
    non_lab = [a for a in assignments if _classify(a) != "lab"]

    sync_groups = _resolve_sync_groups(non_lab)

    # v7 priority rule: 4- and 3-credit courses get first pick of slots.
    # Stable sort — groups that are equally (non-)priority keep their
    # original relative order, so this only changes which priority tier
    # goes first, not the load-balancing behaviour within a tier.
    sync_groups.sort(key=_group_priority)

    # 🔥 NEW (case 4) — merge sync_groups that share a parallel_with edge
    # into a single placement unit. A unit of length 1 is just the
    # original sync_group, business as usual.
    placement_units = _resolve_parallel_units(sync_groups)
    placement_units.sort(key=_unit_priority)

    buckets = {}
    for unit in placement_units:
        if len(unit) == 1:
            group = unit[0]
            # All members of a sync group are expected to share a
            # classification (they're meant to occupy the same slot). If
            # they don't, we classify by the anchor (smallest-spw member)
            # and flag the mismatch for the admin rather than silently
            # guessing.
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
                # Rule 1: TUT slots are reserved for the admin's
                # discretion. The generator does not auto-place
                # tutorial-classified assignments at all, regardless of
                # TUT's occurrence count — every member goes straight to
                # manual review. This stays "overflow" (not "unplaced") —
                # it's categorical admin-discretion-by-design, not a
                # capacity failure, and isn't restricted to minor/OE like
                # a true unplaced item.
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
        else:
            _place_parallel_unit(
                unit, buckets, occurrence_counts, adjacency_map,
                skeleton_days_by_label, manual_review, rng,
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