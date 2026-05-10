# python-engine/main.py
import sys
import json
from engine import run
from scorer import score_timetable
from rework_engine import rework


def main():
    try:
        data = json.load(sys.stdin)

        if isinstance(data, dict):
            mode = data.get("mode")

            if mode == "evaluate":
                timetable = data["timetable"]
                slots     = data["slots"]
                score     = score_timetable(timetable, slots)
                print(json.dumps({"score": score, "violations": []}))
                return

            if mode == "rework":
                timetable     = data["timetable"]
                slots         = data["slots"]
                locked_cells  = data.get("locked_cells", [])
                best_tt, score = rework(timetable, slots, locked_cells)
                print(json.dumps({"timetable": best_tt, "score": score}))
                return

        # Default: full generation from assignments list
        result = run(data)
        print(json.dumps(result))

    except Exception as e:
        import traceback
        print(
            json.dumps({"error": str(e), "trace": traceback.format_exc()}),
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()