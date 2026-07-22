// utils/scheduleWarnings.js
//
// Shared clash/warning detector for a TimetableSchedule.grid. Used by
// scheduleEditController (whole-grid rework save) and
// batchCellEditController (single-batch cell edit). Never mutates
// anything — reads the grid + a slot_name -> entries map and returns a
// flat list of warnings. Purely advisory: nothing here blocks a save,
// matching the rest of this codebase's "admin can override, but sees
// what they're overriding" stance.
//
// CHANGED — removed the cross-track (track1 vs track2, same day+period)
// clash check entirely. Track is a per-batch DISPLAY PROJECTION of which
// arrangement to show that batch under (see resolveBatchTrack.js /
// timetableScheduleModel.js's track_assignments comments), not two
// independent real placements — so "batch X is in both Track 1 and
// Track 2 at period N" was never an actual double-booking, just the
// same batch's week rendered two ways. Flagging it as an error was a
// false positive by construction. Only same-track checks (back-to-back,
// consecutive runs) reflect a real scheduling conflict and are kept.

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
  const byDayTrack = {};

  for (const cell of grid) {
    const dtKey = `${cell.day}::${cell.track}`;
    (byDayTrack[dtKey] ??= []).push(cell);
  }

  // ── same-track checks: back-to-back overlap + consecutive runs ───────
  // (Cross-track comparison removed — see file header comment.)
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
              batch_names: [po.batchName, co.batchName].filter(Boolean),
              faculty_codes: [po.facultyCode],
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
            batch_names: kind === "batch" ? [name] : [],
            faculty_codes: kind === "faculty" ? [name] : [],
            message: `${name} (${kind}) has ${active[key].count} consecutive periods on ${day} track ${track} (P${active[key].start}–P${active[key].end}) with no break.`,
          });
        }
      }
      lastPi = cell.period_index;
    }
  }

  return warnings;
}
