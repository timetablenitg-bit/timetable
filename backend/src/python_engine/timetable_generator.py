"""
timetable_generator.py  –  v2
================================
No more hardcoded TEMPLATE dict. The skeleton (list of
{day, track, period_index, time_label, slot_label} cells) comes from the
active TimetableSkeleton document, passed in through the engine payload
Node builds. This is the same skeleton getSlotOccurrenceCount /
getAdjacencyMap were derived from, so what gets stamped here is always
consistent with what slot_generator.py placed against.

"LAB" placeholder cells resolve to the concrete LAB_<DAY> slot name built
by slot_generator.py's lab pass (e.g. "LAB_MONDAY"), so the frontend can
identify which lab block a cell belongs to.
"""

from collections import defaultdict

LAB_LABEL = "LAB"


def _slot_type(label):
    if label is None:
        return "free"
    if label in ("BREAK", "LUNCH"):
        return "break"
    if label.startswith("LAB"):
        return "lab"
    if label == "G":
        return "minor"
    if label == "H":
        return "oe"
    if label == "TUT":
        return "tutorial"
    if label == "1-CREDIT":
        return "lecture"   # or "tutorial", depending on your curriculum's convention
    return "lecture"


def _resolve_cell_name(label, day):
    """Map a skeleton placeholder label to the concrete slot name that
    should be stamped into the grid for this cell."""
    if label == LAB_LABEL:
        return f"LAB_{day.upper()}"
    return label


def generate_timetable(skeleton_cells, lab_entries_by_day):
    """
    skeleton_cells: flat list of skeleton cell dicts (see module docstring).
    lab_entries_by_day: { "Monday": [...], "Tuesday": [...], "Thursday": [...] }
                         — whether or not each day actually has any lab
                         entries determines if the LAB placeholder resolves
                         to a real slot name or stays empty.

    Returns { day: { "track1": [...cells], "track2": [...cells] | None } }
    """
    by_day_track = defaultdict(list)
    for cell in skeleton_cells:
        by_day_track[(cell["day"], cell["track"])].append(cell)

    days = sorted({c["day"] for c in skeleton_cells},
                  key=lambda d: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].index(d))

    result = {}
    for day in days:
        track1_cells = sorted(
            by_day_track.get((day, 1), []), key=lambda c: c["period_index"]
        )
        track2_cells = sorted(
            by_day_track.get((day, 2), []), key=lambda c: c["period_index"]
        )

        has_labs_today = bool(lab_entries_by_day.get(day))

        def build(cells, track):
            out = []
            for c in cells:
                label = c.get("slot_label")
                if label == LAB_LABEL and not has_labs_today:
                    # skeleton has a lab placeholder but nothing got
                    # placed there this run -> leave the cell empty
                    # rather than stamping a phantom lab block.
                    resolved_name = None
                else:
                    resolved_name = _resolve_cell_name(label, day)

                out.append({
                    "period_index": c["period_index"],
                    "time_label": c.get("time_label", ""),
                    "slot_name": resolved_name,
                    "slot_type": _slot_type(resolved_name),
                    "track": track,
                    "is_lab_anchor": bool(resolved_name and resolved_name.startswith("LAB")),
                })
            return out

        result[day] = {
            "track1": build(track1_cells, 1),
            "track2": build(track2_cells, 2) if track2_cells else None,
        }

    return result


def suggest_track_assignments(lab_entries_by_day):
    """
    Suggestion-only helper (decision #6) — balances which batches would
    sit on track 1 vs track 2 for each lab day, purely as a starting
    point for the admin. NEVER auto-applied; the caller returns this as
    result["suggested_track_assignments"] and the admin accepts/edits it
    via PATCH .../schedule/:id/track.

    Simple heuristic: split each day's lab batches roughly in half by
    order of appearance, alternating which half is "track 2" per lab
    entry so AM/PM lab load balances out.
    """
    suggestions = []
    for day, entries in lab_entries_by_day.items():
        all_batch_ids = []
        for e in entries:
            all_batch_ids.extend(e.get("batch_ids", []))
        # de-dupe preserving order
        seen = set()
        ordered = []
        for b in all_batch_ids:
            if b not in seen:
                seen.add(b)
                ordered.append(b)

        for i, batch_id in enumerate(ordered):
            track = 2 if i % 2 == 1 else 1
            suggestions.append({
                "day": day,
                "batch_id": batch_id,
                "track": track,
            })

    return suggestions
