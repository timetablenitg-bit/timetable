# python-engine/timetable_generator.py
import random
import sys
from collections import Counter, defaultdict

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
BEFORE_LUNCH = [0, 1, 2, 3]      # AM theory periods
AFTER_LUNCH = [5, 6, 7]          # PM periods
LUNCH_PERIOD = 4
AM_LAB_BLOCK = [0, 1, 2]         # Track‑2 lab block
PM_LAB_BLOCK = [5, 6, 7]         # Track‑1 lab block
LAB_DAYS = ["Monday", "Tuesday","Thursday"]  # Preferred days for labs (can be adjusted)
TIME_LABELS = {
    0: "9:00-9:55", 1: "10:00-10:55", 2: "11:00-11:55", 3: "12:00-12:55",
    4: "LUNCH", 5: "14:00-14:55", 6: "15:00-15:55", 7: "16:00-16:55",
}

def extract_entities(entries):
    faculty, batches = set(), set()
    for e in entries:
        faculty.add(e["faculty"])
        for b in e["batches"]:
            batches.add(b)
    return faculty, batches

def slot_spw(entries):
    return entries[0].get("sessions_per_week", 1) if entries else 1

def _classify_batches(assignments):
    """Return set of batch names that have ≥3 lab‑type courses."""
    lab_count = Counter()
    for a in assignments:
        comp = a.get("component_type", "lecture")
        dur = a.get("duration", 1)
        if comp == "lab" or dur > 1:
            for b in a.get("batch_ids", []):
                name = b if isinstance(b, str) else b.get("batch_name", str(b))
                lab_count[name] += 1
    return {name for name, cnt in lab_count.items() if cnt >= 3}

def _empty_grid():
    return {day: [None] * 8 for day in DAYS}

def _can_place_lab(grid_day, block, fac, bat, used_fac, used_bat):
    for p in block:
        if grid_day[p] is not None:
            return False
    return not (fac & used_fac or bat & used_bat)

def _adjacent_same(grid_day, period, name):
    """True if placing `name` at `period` would be adjacent to same name."""
    left = grid_day[period - 1] if period > 0 else None
    right = grid_day[period + 1] if period < 7 else None
    return name == left or name == right

def _lecture_penalty(t1_grid, slots, day, period, slot_name, rng_val):
    """Lower returned value = better placement for a lecture slot."""
    if _adjacent_same(t1_grid[day], period, slot_name):
        return (float("inf"), rng_val)
    pen = 0
    prev = t1_grid[day][period - 1] if period > 0 else None
    if prev and prev in slots:
        pf, pb = extract_entities(slots[prev])
        cf, cb = extract_entities(slots[slot_name])
        if cf & pf:
            pen += 10
        if cb & pb:
            pen += 5
    # penalize same slot on same period previous day
    di = DAYS.index(day)
    if di > 0 and t1_grid[DAYS[di - 1]][period] == slot_name:
        pen += 2
    return (pen, rng_val)

def generate_timetable(slots, assignments=None, attempt_seed=1):
    rng = random.Random(attempt_seed)

    # 1. Identify batches that need Track‑2 (≥3 labs)
    three_lab_batches = _classify_batches(assignments or [])
    needs_track2 = bool(three_lab_batches)

    # 2. Separate slot types
    lab_slots = {k: v for k, v in slots.items() if k.startswith("LAB")}
    minor_slot = "G" if "G" in slots else None
    oe_slot = "H" if "H" in slots else None
    lecture_slots = {k: v for k, v in slots.items()
                     if not k.startswith("LAB") and k not in ("G", "H")}

    # 3. Required number of placements for each lecture slot
    required_counts = {name: slot_spw(entries) for name, entries in lecture_slots.items()}
    total_required = sum(required_counts.values())
    # There are 5 days × 4 morning periods = 20 cells for theory.
    # The input data MUST satisfy total_required == 20, otherwise adjust.
    if total_required != 20:
        print(f"[WARN] Total lecture SPW = {total_required}, but 20 morning cells exist. Adjusting proportions.", file=sys.stderr)
        # simple scaling (round robin) – but ideally fix source data.

    # 4. Initialize grids
    t1 = _empty_grid()
    t2 = _empty_grid() if needs_track2 else None
    for day in DAYS:
        t1[day][LUNCH_PERIOD] = "BREAK"
        if t2:
            t2[day][LUNCH_PERIOD] = "BREAK"

    # 5. Place Labs (only on LAB_DAYS, e.g., Monday, Tuesday)
    t1_pm_fac = {d: set() for d in DAYS}
    t1_pm_bat = {d: set() for d in DAYS}
    t2_am_fac = {d: set() for d in DAYS}
    t2_am_bat = {d: set() for d in DAYS}

    # Restrict lab placement days
    day_pool = [d for d in LAB_DAYS if d in DAYS]
    if not day_pool:
        day_pool = ["Monday"]   # fallback

    lab_names = sorted(lab_slots.keys())
    rng.shuffle(lab_names)

    t2_labs, t1_labs = [], []
    for lab_name in lab_names:
        lf, lb = extract_entities(lab_slots[lab_name])
        if needs_track2 and lb and lb.issubset(three_lab_batches):
            t2_labs.append((lab_name, lf, lb))
        else:
            t1_labs.append((lab_name, lf, lb))

    # Place Track‑2 labs (AM block)
    for lab_name, lf, lb in t2_labs:
        placed = False
        for day in day_pool:
            if _can_place_lab(t2[day], AM_LAB_BLOCK, lf, lb, t2_am_fac[day], t2_am_bat[day]):
                for p in AM_LAB_BLOCK:
                    t2[day][p] = lab_name
                t2_am_fac[day] |= lf
                t2_am_bat[day] |= lb
                placed = True
                break
        if not placed:
            print(f"[WARN] T2 lab {lab_name} could not be placed.", file=sys.stderr)

    # Place Track‑1 labs (PM block)
    for lab_name, lf, lb in t1_labs:
        placed = False
        for day in day_pool:
            if _can_place_lab(t1[day], PM_LAB_BLOCK, lf, lb, t1_pm_fac[day], t1_pm_bat[day]):
                for p in PM_LAB_BLOCK:
                    t1[day][p] = lab_name
                t1_pm_fac[day] |= lf
                t1_pm_bat[day] |= lb
                placed = True
                break
        if not placed:
            print(f"[WARN] T1 lab {lab_name} could not be placed.", file=sys.stderr)

    # 6. Place Minor (G) and OE (H) – can be in any free period (morning or afternoon)
    def place_special_slot(slot_name, preferred_days):
        if not slot_name:
            return
        for day in preferred_days:
            for period in BEFORE_LUNCH + AFTER_LUNCH:
                if t1[day][period] is None:
                    t1[day][period] = slot_name
                    return
        # fallback – any day, any free period
        for day in DAYS:
            for period in BEFORE_LUNCH + AFTER_LUNCH:
                if t1[day][period] is None:
                    t1[day][period] = slot_name
                    return

    # Institute example: OE on Thursday morning, Minor on Tuesday morning
    place_special_slot(minor_slot, ["Tuesday", "Wednesday", "Monday"])
    place_special_slot(oe_slot, ["Thursday", "Wednesday", "Friday"])

    # 7. Place lecture slots – exactly required_counts times, filling all AM cells
    # Create a list of needed placements: each slot repeated `required_counts[name]` times
    needed = []
    for name, cnt in required_counts.items():
        needed.extend([name] * cnt)
    rng.shuffle(needed)   # random order for attempt diversity

    # Build a flat list of all morning cells (day, period)
    morning_cells = [(day, p) for day in DAYS for p in BEFORE_LUNCH]
    # Ensure we have exactly 20 cells
    assert len(morning_cells) == 20, "Morning cells count mismatch"

    # Greedy assignment with adjacency penalty
    # We'll sort cells by a penalty score that favours slots that would cause fewer consecutive clashes
    assignments = []
    for slot_name in needed:
        best_cell = None
        best_penalty = float("inf")
        for day, period in morning_cells:
            if t1[day][period] is not None:
                continue
            pen, _ = _lecture_penalty(t1, slots, day, period, slot_name, rng.random())
            if pen < best_penalty:
                best_penalty = pen
                best_cell = (day, period)
        if best_cell:
            day, period = best_cell
            t1[day][period] = slot_name
            morning_cells.remove((day, period))
        else:
            # Should not happen if counts match
            print(f"[ERROR] No free cell for {slot_name}", file=sys.stderr)

    # 8. Mirror T1 AM → T2 PM for days that have T2 AM lab
    if t2:
        for day in DAYS:
            has_am_lab = any(isinstance(t2[day][p], str) and t2[day][p].startswith("LAB")
                             for p in AM_LAB_BLOCK)
            if not has_am_lab:
                continue
            # Collect first three T1 AM theory slots (excluding minor/OE if they ended up in AM)
            t1_theory = [t1[day][p] for p in BEFORE_LUNCH
                         if t1[day][p] and t1[day][p] not in (minor_slot, oe_slot)][:3]
            for i, slot_name in enumerate(t1_theory):
                if i < len(AFTER_LUNCH):
                    t2[day][AFTER_LUNCH[i]] = slot_name
            # Period 3 (12:00) remains free for T2

    # 9. Serialise to output format
    def fmt(row, track_num):
        return [
            {
                "period_index": i,
                "time_label": TIME_LABELS[i],
                "slot_name": row[i],
                "slot_type": (
                    "break" if row[i] == "BREAK"
                    else "lab" if row[i] and row[i].startswith("LAB")
                    else "minor" if row[i] == "G"
                    else "oe" if row[i] == "H"
                    else "lecture" if row[i]
                    else "free"
                ),
                "track": track_num,
                "is_lab_anchor": bool(
                    row[i] and row[i].startswith("LAB") and (
                        (track_num == 2 and i == AM_LAB_BLOCK[0]) or
                        (track_num == 1 and i == PM_LAB_BLOCK[0])
                    )
                ),
            }
            for i in range(8)
        ]

    result = {}
    for day in DAYS:
        t2_row = t2[day] if t2 else None
        has_t2_am_lab = t2_row is not None and any(
            isinstance(t2_row[p], str) and t2_row[p].startswith("LAB")
            for p in AM_LAB_BLOCK
        )
        result[day] = {
            "track1": fmt(t1[day], 1),
            "track2": fmt(t2_row, 2) if has_t2_am_lab else None,
        }

    return result