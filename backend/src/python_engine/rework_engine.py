# python-engine/rework_engine.py
import random
from scorer import score_timetable

MAX_SWAPS = 500  # increased for better exploration

def _build_grid(timetable):
    grid = {}
    for day, cells in timetable.items():
        grid[day] = {}
        for cell in cells:
            track = cell.get("track", 1)
            pi = cell["period_index"]
            grid[day][(track, pi)] = cell.get("slot_name")  # may be None
    return grid

def _grid_to_timetable(grid):
    result = {}
    DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    TIME_LABELS = {0: "9:00-10:00", 1: "10:00-11:00", 2: "11:00-12:00", 3: "12:00-1:00",
                   4: "2:00-3:00", 5: "3:00-4:00", 6: "4:00-5:00"}
    for day in DAYS:
        cells = []
        for (track, pi), slot_name in sorted(grid.get(day, {}).items()):
            cells.append({
                "period_index": pi,
                "time_label": TIME_LABELS.get(pi, ""),
                "slot_name": slot_name,  # can be None
                "track": track,
                "slot_type": "free" if slot_name is None else (
                    "break" if slot_name == "BREAK"
                    else "lab" if slot_name.startswith("LAB")
                    else "minor" if slot_name == "G"
                    else "oe" if slot_name == "H"
                    else "lecture"
                ),
            })
        result[day] = cells
    return result

def _get_swappable_keys(grid, locked_set):
    keys = []
    for day, cells in grid.items():
        for (track, pi), slot_name in cells.items():
            key = f"{day}:{track}:{pi}"
            if key in locked_set:
                continue
            if slot_name == "BREAK":
                continue
            # allow swapping even if slot_name is None (empty cell)
            keys.append((day, track, pi))
    return keys

def rework(timetable, slots, locked_cells):
    locked_set = set(locked_cells)
    rng = random.Random(42)
    grid = _build_grid(timetable)
    best_tt = _grid_to_timetable(grid)
    best_score = score_timetable(best_tt, slots)

    for _ in range(MAX_SWAPS):
        swappable = _get_swappable_keys(grid, locked_set)
        if len(swappable) < 2:
            break
        (d1, t1, p1), (d2, t2, p2) = rng.sample(swappable, 2)
        # swap values (None allowed)
        grid[d1][(t1, p1)], grid[d2][(t2, p2)] = grid[d2][(t2, p2)], grid[d1][(t1, p1)]
        candidate_tt = _grid_to_timetable(grid)
        candidate_score = score_timetable(candidate_tt, slots)
        if candidate_score >= best_score:
            best_score = candidate_score
            best_tt = candidate_tt
        else:
            # revert
            grid[d1][(t1, p1)], grid[d2][(t2, p2)] = grid[d2][(t2, p2)], grid[d1][(t1, p1)]

    return best_tt, best_score