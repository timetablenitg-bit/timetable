// utils/scheduleWarnings.js
//
// Shared clash/warning detector for a TimetableSchedule.grid. Used by
// scheduleEditController (whole-grid rework save) and
// batchCellEditController (single-batch cell edit). Never mutates
// anything — reads the grid + a slot_name -> entries map and returns a
// flat list of warnings. Purely advisory: nothing here blocks a save,
// matching the rest of this codebase's "admin can override, but sees
// what they're overriding" stance.

const CONSECUTIVE_LIMIT = 4; // periods in a row before we flag fatigue

function resolveCellOccupants(cell, slotMap) {
  const out = [];
  const hidden = new Set((cell.hidden_assignment_ids ?? []).map(String));

  for (const m of cell.manual_entries ?? []) {
    for (const b of m.batch_names ?? []) {
      out.push({
        batchName: b,
        facultyCode: m.faculty_code,
        courseCode: m.course_code,
        componentType: m.component_type,
      });
    }
  }

  if (cell.slot_name && cell.slot_name !== "BREAK") {
    const entries = slotMap[cell.slot_name] ?? [];
    for (const e of entries) {
      const aid = String(e.assignment_id ?? "");
      if (hidden.has(aid)) continue;
      for (const b of e.batch_names ?? e.batches ?? []) {
        out.push({
          batchName: b,
          facultyCode: e.faculty_code ?? e.faculty,
          courseCode: e.course_code ?? e.course,
          componentType: e.component_type,
        });
      }
    }
  }
  return out;
}

export function computeScheduleWarnings(grid, slotMap) {
  const warnings = [];
  const byDayPeriod = {};
  const byDayTrack = {};

  for (const cell of grid) {
    const dpKey = `${cell.day}::${cell.period_index}`;
    (byDayPeriod[dpKey] ??= []).push(cell);
    const dtKey = `${cell.day}::${cell.track}`;
    (byDayTrack[dtKey] ??= []).push(cell);
  }

  // ── 1. simultaneous cross-track clash — same batch/faculty in Track 1
  // AND Track 2 at the same day+period. Covers labs too, since it just
  // looks at what's occupying each cell, not the cell's type. ──────────
  for (const [dpKey, cells] of Object.entries(byDayPeriod)) {
    if (cells.length < 2) continue;
    const [day, piStr] = dpKey.split("::");
    const byTrack = cells.map((c) => ({
      track: c.track,
      occupants: resolveCellOccupants(c, slotMap),
    }));

    for (let i = 0; i < byTrack.length; i++) {
      for (let j = i + 1; j < byTrack.length; j++) {
        const a = byTrack[i];
        const b = byTrack[j];
        if (a.track === b.track) continue;

        for (const oa of a.occupants) {
          for (const ob of b.occupants) {
            const isLab =
              oa.componentType === "lab" || ob.componentType === "lab";

            if (oa.batchName && oa.batchName === ob.batchName) {
              warnings.push({
                type: isLab ? "lab_clash" : "batch_clash",
                severity: "error",
                day,
                period_index: Number(piStr),
                message: `${oa.batchName} is scheduled in both Track ${a.track} and Track ${b.track} on ${day} (period ${piStr}) — a batch can't be in two places at once.`,
              });
            }
            if (oa.facultyCode && oa.facultyCode === ob.facultyCode) {
              warnings.push({
                type: isLab ? "lab_clash" : "faculty_clash",
                severity: "error",
                day,
                period_index: Number(piStr),
                message: `${oa.facultyCode} is scheduled in both Track ${a.track} and Track ${b.track} on ${day} (period ${piStr}) — a faculty member can't teach two classes at once.`,
              });
            }
          }
        }
      }
    }
  }

  // ── 2. same-track checks: back-to-back overlap + consecutive runs ────
  for (const [dtKey, cells] of Object.entries(byDayTrack)) {
    const [day, trackStr] = dtKey.split("::");
    const track = Number(trackStr);
    const sorted = [...cells].sort((a, b) => a.period_index - b.period_index);

    // back-to-back same faculty teaching two DIFFERENT courses
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (curr.period_index - prev.period_index !== 1) continue;

      const prevOcc = resolveCellOccupants(prev, slotMap);
      const currOcc = resolveCellOccupants(curr, slotMap);

      for (const po of prevOcc) {
        for (const co of currOcc) {
          if (
            po.facultyCode &&
            po.facultyCode === co.facultyCode &&
            po.courseCode !== co.courseCode
          ) {
            warnings.push({
              type: "faculty_back_to_back",
              severity: "warning",
              day,
              track,
              period_index: curr.period_index,
              message: `${po.facultyCode} has back-to-back classes on ${day} track ${track} (periods ${prev.period_index}–${curr.period_index}) — ${po.courseCode} then ${co.courseCode}.`,
            });
          }
        }
      }
    }

    // consecutive-period runs, per batch and per faculty
    const active = {};
    let lastPi = null;
    for (const cell of sorted) {
      if (["BREAK", "LUNCH"].includes(cell.slot_name)) {
        Object.keys(active).forEach((k) => delete active[k]);
        lastPi = null;
        continue;
      }
      const occupants = resolveCellOccupants(cell, slotMap);
      const presentKeys = new Set();
      occupants.forEach((o) => {
        if (o.batchName) presentKeys.add(`batch:${o.batchName}`);
        if (o.facultyCode) presentKeys.add(`faculty:${o.facultyCode}`);
      });

      const contiguous = lastPi !== null && cell.period_index - lastPi === 1;
      for (const key of presentKeys) {
        if (contiguous && active[key]) {
          active[key].count += 1;
          active[key].end = cell.period_index;
        } else {
          active[key] = {
            count: 1,
            start: cell.period_index,
            end: cell.period_index,
          };
        }
      }
      Object.keys(active).forEach((k) => {
        if (!presentKeys.has(k)) delete active[k];
      });

      for (const key of presentKeys) {
        if (active[key].count === CONSECUTIVE_LIMIT + 1) {
          const [kind, name] = key.split(":");
          warnings.push({
            type: "consecutive_run",
            severity: "warning",
            day,
            track,
            period_index: active[key].start,
            message: `${name} (${kind}) has ${active[key].count} consecutive periods on ${day} track ${track} (P${active[key].start}–P${active[key].end}) with no break.`,
          });
        }
      }
      lastPi = cell.period_index;
    }
  }

  return warnings;
}
