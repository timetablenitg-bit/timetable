"""
timetable_generator.py  –  New approach
=========================================
Now expects lab slots as arrays: LAB_MONDAY, LAB_TUESDAY, LAB_THURSDAY.
For each lab block (Monday T1 PM, Monday T2 AM, etc.), it picks the first
available lab from the corresponding day's array (or rotates if needed).
"""

import sys

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
TIME_LABELS = {
    0: "9:00-9:55", 1: "10:00-10:55", 2: "11:00-11:55", 3: "12:00-12:55",
    4: "LUNCH", 5: "14:00-14:55", 6: "15:00-15:55", 7: "16:00-16:55",
}

TEMPLATE = {
    ("Monday", 1): [(0,"A"),(1,"B"),(2,"C"),(3,"D"),(4,"BREAK"),(5,"LAB"),(6,"LAB"),(7,"LAB")],
    ("Monday", 2): [(0,"A"),(1,"LAB"),(2,"LAB"),(3,"LAB"),(4,"BREAK"),(5,"B"),(6,"C"),(7,"D")],
    ("Tuesday",1): [(0,"E"),(1,"F"),(2,"A"),(3,"G"),(4,"BREAK"),(5,"LAB"),(6,"LAB"),(7,"LAB")],
    ("Tuesday",2): [(0,"LAB"),(1,"LAB"),(2,"LAB"),(3,"G"),(4,"BREAK"),(5,"E"),(6,"F"),(7,"A")],
    ("Wednesday",1): [(0,"B"),(1,"C"),(2,"D"),(3,"E"),(4,"BREAK"),(5,"G"),(6,"H"),(7,"TUT")],
    ("Wednesday",2): [(0,None),(1,None),(2,None),(3,None),(4,"BREAK"),(5,None),(6,None),(7,None)],
    ("Thursday",1): [(0,"F"),(1,"A"),(2,"B"),(3,"H"),(4,"BREAK"),(5,"LAB"),(6,"LAB"),(7,"LAB")],
    ("Thursday",2): [(0,None),(1,None),(2,None),(3,None),(4,"BREAK"),(5,None),(6,None),(7,None)],
    ("Friday",1): [(0,"C"),(1,"D"),(2,"E"),(3,"F"),(4,"BREAK"),(5,"G"),(6,"H"),(7,"1-CREDIT")],
    ("Friday",2): [(0,None),(1,None),(2,None),(3,None),(4,"BREAK"),(5,None),(6,None),(7,None)],
}

LAB_SLOT_NAMES = {
    "Monday":   "LAB_MONDAY",
    "Tuesday":  "LAB_TUESDAY",
    "Thursday": "LAB_THURSDAY",
}

def _slot_type(name):
    if name is None: return "free"
    if name == "BREAK": return "break"
    if name and name.startswith("LAB_"): return "lab"
    if name == "G": return "minor"
    if name == "H": return "oe"
    if name == "TUT": return "tutorial"
    if name == "1-CREDIT": return "1credit"
    return "lecture"

def _build_day_track(template_row, day_lab_entries, track, day_lab_slot_name=None):
    """
    day_lab_entries: list of lab entry dicts for that day (from LAB_MONDAY etc.)
    day_lab_slot_name: the slot name string e.g. "LAB_MONDAY" — stamped into all
                       LAB placeholder cells so the frontend can identify the block.
    """
    resolved = {}

    for (pidx, placeholder) in template_row:
        if placeholder == "LAB":
            if day_lab_entries and day_lab_slot_name:
                resolved[pidx] = day_lab_slot_name  # e.g. "LAB_MONDAY"
            else:
                resolved[pidx] = None   # no lab assigned
        else:
            resolved[pidx] = placeholder

    AM_LAB_BLOCK = {1, 2, 3}
    PM_LAB_BLOCK = {5}
    cells = []
    for i in range(8):
        name = resolved.get(i)
        stype = _slot_type(name)
        is_anchor = False
        if name and name.startswith("LAB_"):
            if track == 1 and i in PM_LAB_BLOCK: is_anchor = True
            if track == 2 and i in AM_LAB_BLOCK: is_anchor = True
        cells.append({
            "period_index": i,
            "time_label":   TIME_LABELS[i],
            "slot_name":    name,
            "slot_type":    stype,
            "track":        track,
            "is_lab_anchor": is_anchor,
        })
    return cells

def generate_timetable(slots, **_kwargs):
    """
    slots: output of slot_generator.build_slots()
    Now expects slots["LAB_MONDAY"] = [entry1, entry2, ...]
    """
    # Extract lab arrays
    lab_entries = {
        "Monday":   slots.get("LAB_MONDAY",   []),
        "Tuesday":  slots.get("LAB_TUESDAY",  []),
        "Thursday": slots.get("LAB_THURSDAY", []),
    }

    result = {}
    for day in DAYS:
        t1_template = TEMPLATE[(day, 1)]
        t2_template = TEMPLATE[(day, 2)]
        day_lab_slot_name = LAB_SLOT_NAMES.get(day)

        t1_cells = _build_day_track(
            t1_template,
            lab_entries.get(day, []),
            track=1,
            day_lab_slot_name=day_lab_slot_name,
        )

        needs_track2 = bool(lab_entries.get(day, [])) or day in ["Monday", "Tuesday", "Thursday"]
        t2_cells = _build_day_track(
            t2_template,
            lab_entries.get(day, []),
            track=2,
            day_lab_slot_name=day_lab_slot_name,
        ) if needs_track2 else None

        result[day] = {"track1": t1_cells, "track2": t2_cells}

    return result