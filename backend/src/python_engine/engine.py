# python-engine/engine.py
#
# FIXED: generate_timetable now requires `assignments` to detect 3-lab batches.
# The old call `generate_timetable(all_slots, attempt_seed=attempt)` didn't
# pass assignments, so _classify_batches() always returned an empty set and
# track2 was never built.

import time
import sys
from slot_generator      import build_lecture_slots
from lab_scheduler       import build_lab_slots
from timetable_generator import generate_timetable
from scorer              import score_timetable

MAX_ATTEMPTS    = 30
SCORE_THRESHOLD = 80


def run(assignments):
    start = time.time()
    best  = {"timetable": None, "slots": None, "score": -1}

    # Lab slots don't change across attempts
    lab_slots = build_lab_slots(assignments)

    # Detect which batch names have 3+ labs (for Track-2 classification)
    from collections import Counter
    lab_count = Counter()
    for a in assignments:
        comp = a.get("component_type", "lecture")
        dur  = a.get("duration", 1)
        if comp == "lab" or dur > 1:
            for b in a.get("batch_ids", []):
                name = b if isinstance(b, str) else b.get("batch_name", str(b))
                lab_count[name] += 1
    track2_batches = [name for name, cnt in lab_count.items() if cnt >= 3]

    for attempt in range(1, MAX_ATTEMPTS + 1):
        lecture_slots = build_lecture_slots(assignments, seed=attempt)
        all_slots     = {**lecture_slots, **lab_slots}

        # Pass assignments so generate_timetable can classify 3-lab batches
        timetable = generate_timetable(all_slots, assignments=assignments, attempt_seed=attempt)
        score     = score_timetable(timetable, all_slots)

        if score > best["score"]:
            best = {
                "timetable":      timetable,
                "slots":          all_slots,
                "score":          score,
                "track2_batches": track2_batches,
            }

        if score >= SCORE_THRESHOLD:
            break

    return {
        "slots":          best["slots"],
        "timetable":      best["timetable"],
        "score":          best["score"],
        "track2_batches": best.get("track2_batches", []),
        "meta": {
            "total_attempts":    attempt,
            "generation_time_ms": int((time.time() - start) * 1000),
        },
    }