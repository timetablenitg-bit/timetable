// ====================== Generic Helpers ======================
// Global loading/saving/error flags shared across the admin store.
// Domain-specific loading flags (isSavingSlots, isFetchingSkeleton, etc.)
// live in their own slices, not here.

export const createUiSlice = (set) => ({
  isLoading: false,
  isSaving: false,
  error: null,

  setLoading: (value) => set({ isLoading: value }),
  setSaving: (value) => set({ isSaving: value }),
  clearError: () => set({ error: null }),
});
