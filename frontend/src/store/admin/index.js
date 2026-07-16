import { create } from "zustand";

import { createUiSlice } from "./slices/uiSlice";
import { createAcademicSessionSlice } from "./slices/academicSessionSlice";
import { createFacultySlice } from "./slices/facultySlice";
import { createCourseSlice } from "./slices/courseSlice";
import { createCourseAssignmentSlice } from "./slices/courseAssignmentSlice";
import { createBatchSlice } from "./slices/batchSlice";
import { createUserManagementSlice } from "./slices/userManagementSlice";
import { createTimetableEngineSlice } from "./slices/timetableEngineSlice";
import { createSlotsSlice } from "./slices/slotsSlice";
import { createScheduleSlice } from "./slices/scheduleSlice";
import { createSkeletonSlice } from "./slices/skeletonSlice";

// The public API is unchanged: useAdminStore() and
// useAdminStore((s) => s.someField) both still work exactly as before.
// Only the import path changes for consumers:
//   - useAdminStore from "../../store/useAdminStore"
//   + useAdminStore from "../../store/admin"
const useAdminStore = create((set, get, api) => ({
  ...createUiSlice(set, get, api),
  ...createAcademicSessionSlice(set, get, api),
  ...createFacultySlice(set, get, api),
  ...createCourseSlice(set, get, api),
  ...createCourseAssignmentSlice(set, get, api),
  ...createBatchSlice(set, get, api),
  ...createUserManagementSlice(set, get, api),
  ...createTimetableEngineSlice(set, get, api),
  ...createSlotsSlice(set, get, api),
  ...createScheduleSlice(set, get, api),
  ...createSkeletonSlice(set, get, api),
}));

export default useAdminStore;
