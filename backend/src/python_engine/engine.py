"""
engine.py  –  New approach
============================
1. slot_generator assigns courses → slot names (A-F, G, H, TUT, 1-CREDIT, LABn).
2. timetable_generator stamps those names into the fixed weekly grid.
3. scorer evaluates the result.

The retry loop is kept (but shortened) in case the slot_generator
needs a few seeds to find a clash-free assignment for theory slots A-F.
"""

import time
from slot_generator      import build_slots
from timetable_generator import generate_timetable
from scorer              import score_timetable

MAX_ATTEMPTS    = 1000   # rarely needs more than 1-2 with fixed structure
SCORE_THRESHOLD = 85


def _flatten_slots_for_scorer(slots):
    """
    scorer.py expects every slot value to be a list of entries.
    Lab slots from build_slots() are dicts with "entry" and "days".
    Flatten them here.
    """
    flat = {}
    for k, v in slots.items():
        if k.startswith("LAB") and isinstance(v, dict):
            flat[k] = [v["entry"]]
        else:
            flat[k] = v
    return flat


def run(assignments):
    start = time.time()
    best  = {"timetable": None, "slots": None, "score": -1}

    for attempt in range(1, MAX_ATTEMPTS + 1):
        slots     = build_slots(assignments, seed=attempt)
        flat      = _flatten_slots_for_scorer(slots)
        timetable = generate_timetable(slots)
        score     = score_timetable(timetable, flat)

        if score > best["score"]:
            best = {
                "timetable": timetable,
                "slots":     flat,
                "score":     score,
            }

        if score >= SCORE_THRESHOLD:
            break

    elapsed = int((time.time() - start) * 1000)

    # Identify track-2 batches for the frontend
    from collections import Counter
    lab_count = Counter()
    for k, v in slots.items():
        if not k.startswith("LAB"):
            continue
        entry = v["entry"] if isinstance(v, dict) else v[0]
        for b in entry["batches"]:
            lab_count[b] += 1
    track2_batches = [b for b, cnt in lab_count.items() if cnt >= 3]

    return {
        "slots":          best["slots"],
        "timetable":      best["timetable"],
        "score":          best["score"],
        "track2_batches": track2_batches,
        "meta": {
            "total_attempts":     attempt,
            "generation_time_ms": elapsed,
        },
    }