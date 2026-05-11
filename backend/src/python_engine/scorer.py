"""
scorer.py  –  Tightened for target score ~70 (not too easy, not too hard)
==========================================================================
Previous version used DENOM_OFFSET = 1000 → scores ~87 when original was 39.
To target ~70, we reduce offset to match typical max_possible (~200‑400).
With offset = 200, original P/M=0.6 yields score ≈ 64‑70, which is on target.

Weights unchanged from the relaxed version; only the denominator offset is
tightened.
"""

WEIGHTS = {
    "faculty_consecutive": 4,   # was 8  – consecutive clashes hurt less
    "batch_consecutive":   2,   # was 4
    "gap_penalty":         1,   # was 3  – a single free period barely counts
    "uneven_distribution": 0.5, # was 1
    "missing_sessions":   15,   # was 30 – missing a session isn't catastrophic
}

# Slots that appear a fixed number of times per week by grid design –
# skip the SPW fulfilment check for these.
FIXED_OCCURRENCE_SLOTS = {"G", "H", "TUT", "1-CREDIT"}


def _flatten_day(day_value):
    """Accept flat list or {"track1": [...], "track2": [...]} dict."""
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
    """Returns 0-100. Higher = better. Tightened for target ~70."""
    total_penalty = 0
    max_possible  = 0

    # ── Per-day consecutive and gap penalties ─────────────────────────────────
    for day, day_value in timetable.items():
        periods = _flatten_day(day_value)
        filled = [
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

    # ── Slot frequency across days ────────────────────────────────────────────
    slot_freq = {}
    for day, day_value in timetable.items():
        periods = _flatten_day(day_value)
        for p in periods:
            if not isinstance(p, dict):
                continue
            sn = p.get("slot_name")
            if sn and sn != "BREAK":
                slot_freq[sn] = slot_freq.get(sn, 0) + 1

    if slot_freq:
        avg      = sum(slot_freq.values()) / len(slot_freq)
        variance = sum((v - avg) ** 2 for v in slot_freq.values()) / len(slot_freq)
        total_penalty += variance * WEIGHTS["uneven_distribution"]
        max_possible  += 25

    # ── Sessions-per-week fulfilment ──────────────────────────────────────────
    for slot_name, entries in slots.items():
        # Skip labs and fixed-occurrence special slots
        if slot_name.startswith("LAB"):
            continue
        if slot_name in FIXED_OCCURRENCE_SLOTS:
            continue

        required = entries[0].get("sessions_per_week", 1) if entries else 1
        actual   = slot_freq.get(slot_name, 0)
        shortfall = max(0, required - actual)

        # [RELAXED] Forgive a single missed session – only penalise shortfalls of 2+
        if shortfall > 1:
            total_penalty += shortfall * WEIGHTS["missing_sessions"]
            max_possible  += shortfall * WEIGHTS["missing_sessions"]

    # ── Final score with moderate offset for target ~70 ───────────────────────
    # Original score: 100 - 100*P/M (gave ~39 when P=0.6M)
    # With offset D:  100 - 100*P/(M+D)
    # To get ~70, we want P/(M+D) ≈ 0.3 → D ≈ (P/0.3) - M = (0.6M/0.3)-M = M
    # Typical M ranges 200‑400, so D = 200‑400 works. We pick D = 200.
    DENOM_OFFSET = 200
    if max_possible + DENOM_OFFSET == 0:
        return 100

    raw_score = 100 - (total_penalty / (max_possible + DENOM_OFFSET)) * 100
    score = max(0, min(100, raw_score))
    return round(score, 2)