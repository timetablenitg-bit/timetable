"""
main.py  –  v2
=================
"rework" mode is gone. Rework is now a Node-only, no-subprocess path
(admin hand-edits the grid, Node persists + rescoring calls scorer.py
logic directly or via a one-off invocation with mode="evaluate" — see
controllers/scheduleEditController.js). rework_engine.py has been
deleted.
"""

import sys
import json

from engine import run
from scorer import score_timetable


def main():
    try:
        data = json.load(sys.stdin)

        if isinstance(data, dict) and data.get("mode") == "evaluate":
            timetable = data["timetable"]
            slots = data.get("slots")
            score = score_timetable(timetable, slots)
            print(json.dumps({"score": score}))
            return

        # Default: full generation from the payload Node built
        # (assignments + derived skeleton data — see engine.py docstring).
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
