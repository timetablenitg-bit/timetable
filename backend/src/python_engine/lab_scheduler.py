import uuid

def build_lab_slots(assignments):
    """
    Labs and major-project components each become a named LAB slot.
    They are always placed in the afternoon block (2–5 pm) by the generator.
    """
    lab_slots   = {}
    lab_counter = 1

    for a in assignments:
        component = a.get("component_type", "lecture")
        duration  = a.get("duration", 1)
        atype     = a.get("assignment_type", "regular")

        is_lab     = component == "lab" or duration > 1
        is_project = component in ("major_project", "project")

        if not (is_lab or is_project):
            continue

        slot_name = f"LAB{lab_counter}"
        lab_counter += 1

        lab_slots[slot_name] = [{
            "id":            str(uuid.uuid4()),
            "course":        a["course_id"]["course_code"],
            "faculty":       a["faculty_id"]["faculty_code"],
            "faculty_id":    str(a["faculty_id"]["_id"]),
            "batches":       [b["batch_name"] for b in a["batch_ids"]],
            "batch_ids":     [str(b["_id"])   for b in a["batch_ids"]],
            "assignment_id": str(a["_id"]),
            "is_lab":        True,
            "is_project":    is_project,
            "duration":      duration,
            "lab_group":     a.get("lab_group"),
            # Labs always repeat once per week
            "sessions_per_week": 1,
        }]

    return lab_slots