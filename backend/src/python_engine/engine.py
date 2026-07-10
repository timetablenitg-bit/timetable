"""
engine.py  –  v2
===================
Orchestrates one generation run:

  1. slot_generator.build_slots()       -> buckets + manual_review_items
  2. timetable_generator.generate_timetable() -> stamps buckets into the
     skeleton's grid shape
  3. scorer.score_timetable()           -> soft-preference score only
  4. timetable_generator.suggest_track_assignments() -> suggestion only

Since placement is now constraint-based (hard-checked at insertion time)
rather than blind-then-score, we don't need hundreds of random-seed
retries to dig a clash-free arrangement out of luck — a handful of seeds
is just for load-balancing ties (see slot_generator._rank_candidates'
shuffle of same-tier candidates). We still take the best of a few seeds
since bucket assignment order can affect how much overflows to manual
review.
"""

import time
from collections import defaultdict

from slot_generator import build_slots
from timetable_generator import generate_timetable, suggest_track_assignments
from scorer import score_timetable

ATTEMPTS = 1000


def _flatten_for_scorer(slots):
    flat = {}
    for k, v in slots.items():
        flat[k] = v
    return flat


def _lab_entries_by_day(slots):
    by_day = {}
    for k, v in slots.items():
        if k.startswith("LAB_"):
            day = k[len("LAB_"):].capitalize()
            by_day[day] = v
    return by_day


def run(payload):
    """
    payload = {
        "assignments": [...populated CourseAssignment docs...],
        "skeleton_cells": [...],               # active TimetableSkeleton.cells
        "occurrence_counts": {...},             # from getSlotOccurrenceCount
        "adjacency_map": {...},                 # from getAdjacencyMap (serialized)
        "skeleton_days_by_label": {...},        # label -> [days], for choose_occurrences scoping
    }
    """
    start = time.time()

    assignments = payload["assignments"]
    skeleton_cells = payload["skeleton_cells"]
    occurrence_counts = payload["occurrence_counts"]
    adjacency_map = payload["adjacency_map"]
    skeleton_days_by_label = payload["skeleton_days_by_label"]

    best = None

    for attempt in range(1, ATTEMPTS + 1):
        slots, manual_review = build_slots(
            assignments, occurrence_counts, adjacency_map,
            skeleton_days_by_label, seed=attempt,
        )
        lab_entries_by_day = _lab_entries_by_day(slots)
        timetable = generate_timetable(skeleton_cells, lab_entries_by_day)
        score = score_timetable(timetable, _flatten_for_scorer(slots))

        # Fewer manual-review items is the real tie-breaker — a
        # higher-scoring arrangement that dumps more courses on the
        # admin isn't actually better.
        candidate = {
            "slots": _flatten_for_scorer(slots),
            "timetable": timetable,
            "score": score,
            "manual_review": manual_review,
            "lab_entries_by_day": lab_entries_by_day,
        }

        if best is None or (
            len(candidate["manual_review"]) < len(best["manual_review"])
            or (
                len(candidate["manual_review"]) == len(best["manual_review"])
                and candidate["score"] > best["score"]
            )
        ):
            best = candidate

    elapsed = int((time.time() - start) * 1000)

    suggested_tracks = suggest_track_assignments(best["lab_entries_by_day"])

    return {
        "slots": best["slots"],
        "timetable": best["timetable"],
        "score": best["score"],
        "manual_review_items": best["manual_review"],
        "suggested_track_assignments": suggested_tracks,
        "meta": {
            "total_attempts": ATTEMPTS,
            "generation_time_ms": elapsed,
        },
    }
