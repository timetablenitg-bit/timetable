# python-engine/scorer.py
#
# Scores a timetable 0-100.  Higher = better.
#
# FIXED: timetable_generator now returns a dual-track structure:
#   { day: { "track1": [cells], "track2": [cells] | null } }
# The old scorer expected the flat format:
#   { day: [cells] }
# This version handles BOTH shapes so it works with engine.py as-is.

WEIGHTS = {
    "faculty_consecutive": 8,     # higher penalty for back‑to‑back
    "batch_consecutive":   4,     # students should not have same slot twice in a row
    "gap_penalty":         3,
    "uneven_distribution": 1,
    "missing_sessions":   30,     # heavy penalty if a slot appears fewer times than SPW
}


def _flatten_day(day_value):
    """
    Accept either:
      - a list of cell dicts  (old flat format)
      - a dict with "track1" / "track2" keys  (new dual-track format)
    Returns a flat list of cell dicts for track1 only
    (track2 mirrors track1 lectures so we don't double-count).
    """
    if isinstance(day_value, list):
        return day_value
    if isinstance(day_value, dict):
        return day_value.get("track1") or []
    return []


def extract_entities(slot_data):
    faculty, batches = set(), set()
    for s in slot_data:
        faculty.add(s["faculty"])
        for b in s["batches"]:
            batches.add(b)
    return faculty, batches


def score_timetable(timetable, slots):
    """
    Returns a 0-100 score. Higher = better.
    """
    total_penalty     = 0
    max_possible      = 0

    # ── Per-day consecutive and gap penalties ─────────────────────────────────
    for day, day_value in timetable.items():
        periods = _flatten_day(day_value)
        filled  = [
            p for p in periods
            if isinstance(p, dict)
            and p.get("slot_name")
            and p["slot_name"] not in ("BREAK", None)
        ]

        for i in range(1, len(filled)):
            curr_name = filled[i].get("slot_name")
            prev_name = filled[i - 1].get("slot_name")

            if curr_name not in slots or prev_name not in slots:
                continue

            cf, cb = extract_entities(slots[curr_name])
            pf, pb = extract_entities(slots[prev_name])

            if cf & pf:
                total_penalty += WEIGHTS["faculty_consecutive"]
            if cb & pb:
                total_penalty += WEIGHTS["batch_consecutive"]

            max_possible += WEIGHTS["faculty_consecutive"] + WEIGHTS["batch_consecutive"]

        # Gap penalty: free period sandwiched between two filled ones
        slot_names = [
            p.get("slot_name") if isinstance(p, dict) else None
            for p in periods
        ]
        for i in range(1, len(slot_names) - 1):
            if (slot_names[i] in (None, "BREAK")
                    and slot_names[i - 1] not in (None, "BREAK")
                    and slot_names[i + 1] not in (None, "BREAK")):
                total_penalty += WEIGHTS["gap_penalty"]
                max_possible  += WEIGHTS["gap_penalty"]

    # ── Slot frequency distribution across days ───────────────────────────────
    slot_freq = {}
    for day, day_value in timetable.items():
        periods = _flatten_day(day_value)
        for p in periods:
            if not isinstance(p, dict):
                continue
            sn = p.get("slot_name")
            if sn and sn not in ("BREAK",):
                slot_freq[sn] = slot_freq.get(sn, 0) + 1

    if slot_freq:
        avg      = sum(slot_freq.values()) / len(slot_freq)
        variance = sum((v - avg) ** 2 for v in slot_freq.values()) / len(slot_freq)
        total_penalty += variance * WEIGHTS["uneven_distribution"]
        max_possible  += 25

    # ── Sessions-per-week fulfilment penalty ──────────────────────────────────
    for slot_name, entries in slots.items():
        if slot_name.startswith("LAB") or slot_name in ("G", "H"):
            continue
        required = entries[0].get("sessions_per_week", 1) if entries else 1
        actual   = slot_freq.get(slot_name, 0)
        shortfall = max(0, required - actual)
        if shortfall:
            total_penalty += shortfall * WEIGHTS["missing_sessions"]
            max_possible  += shortfall * WEIGHTS["missing_sessions"]

    if max_possible == 0:
        return 100

    score = max(0, 100 - (total_penalty / max_possible) * 100)
    return round(score, 2)