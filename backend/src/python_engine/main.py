"""
main.py
"""
import sys
import json
from engine  import run
from scorer  import score_timetable

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

            # "rework" mode is deprecated with fixed structure –
            # re-run full generation instead.
            if mode == "rework":
                print(
                    json.dumps({
                        "error": "rework mode is not supported with the fixed-structure engine. "
                                 "Submit assignments list for a fresh generation."
                    }),
                    file=sys.stderr,
                )
                sys.exit(1)

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