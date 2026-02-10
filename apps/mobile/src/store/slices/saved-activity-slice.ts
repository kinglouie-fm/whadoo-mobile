import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiDelete, apiGet, apiPost } from "../../lib/api";

export interface SavedActivitySnapshot {
  title: string;
  thumbnailUrl: string | null;
  city: string | null;
  priceFrom: string | null;
  catalogGroupId: string | null;
  catalogGroupTitle: string | null;
  catalogGroupKind: string | null;
}

export interface SavedActivityItem {
  activityId: string;
  savedAt: string;
  snapshot: SavedActivitySnapshot;
}

interface SavedActivitiesState {
  items: SavedActivityItem[];
  loading: boolean;
  error: string | null;
  nextCursor: string | null;
  selectedIds: string[];
  multiSelectMode: boolean;
}

const initialState: SavedActivitiesState = {
  items: [],
  loading: false,
  error: null,
  nextCursor: null,
  selectedIds: [],
  multiSelectMode: false,
};

// Async thunks
export const saveActivity = createAsyncThunk(
  "savedActivities/save",
  async (activityId: string) => {
    const result = await apiPost<{ 
      success: boolean; 
      saved: { 
        activityId: string; 
        savedAt: string;
        snapshot: any;
      } 
    }>(
      "/saved-activities",
      { activityId }
    );
    return result;
  }
);

export const unsaveActivity = createAsyncThunk(
  "savedActivities/unsave",
  async (activityId: string) => {
    await apiDelete(`/saved-activities/${activityId}`);
    return activityId;
  }
);

export const fetchSavedActivities = createAsyncThunk(
  "savedActivities/fetchList",
  async (options?: { cursor?: string }) => {
    const params = new URLSearchParams();
    if (options?.cursor) {
      params.append("cursor", options.cursor);
    }
    const result = await apiGet<{ items: SavedActivityItem[]; nextCursor: string | null }>(
      `/saved-activities?${params.toString()}`
    );
    return result;
  }
);

export const bulkDeleteSavedActivities = createAsyncThunk(
  "savedActivities/bulkDelete",
  async (activityIds: string[]) => {
    await apiPost("/saved-activities/bulk-delete", { activityIds });
    return activityIds;
  }
);

export const checkSaved = createAsyncThunk(
  "savedActivities/check",
  async (activityId: string) => {
    const result = await apiGet<{ isSaved: boolean }>(`/saved-activities/${activityId}/check`);
    return { activityId, isSaved: result.isSaved };
  }
);

const savedActivitiesSlice = createSlice({
  name: "savedActivities",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    toggleSelectActivity: (state, action: PayloadAction<string>) => {
      const activityId = action.payload;
      const index = state.selectedIds.indexOf(activityId);
      if (index > -1) {
        state.selectedIds.splice(index, 1);
      } else {
        state.selectedIds.push(activityId);
      }
    },
    toggleMultiSelectMode: (state) => {
      state.multiSelectMode = !state.multiSelectMode;
      if (!state.multiSelectMode) {
        state.selectedIds = [];
      }
    },
    clearSelection: (state) => {
      state.selectedIds = [];
    },
  },
  extraReducers: (builder) => {
    // Save activity
    builder.addCase(saveActivity.pending, (state, action) => {
      state.error = null;
      // Optimistically add to items immediately
      const activityId = action.meta.arg;
      const alreadySaved = state.items.some(item => item.activityId === activityId);
      if (!alreadySaved) {
        state.items.unshift({
          activityId,
          savedAt: new Date().toISOString(),
          snapshot: {
            title: "Loading...",
            thumbnailUrl: null,
            city: null,
            priceFrom: null,
            catalogGroupId: null,
            catalogGroupTitle: null,
            catalogGroupKind: null,
          },
        });
      }
    });
    builder.addCase(saveActivity.fulfilled, (state, action) => {
      // Update with real data from server
      const activityId = action.meta.arg;
      const index = state.items.findIndex(item => item.activityId === activityId);
      if (index > -1 && action.payload.saved) {
        state.items[index] = {
          activityId: action.payload.saved.activityId,
          savedAt: action.payload.saved.savedAt,
          snapshot: action.payload.saved.snapshot as SavedActivitySnapshot,
        };
      }
    });
    builder.addCase(saveActivity.rejected, (state, action) => {
      state.error = action.error.message || "Failed to save activity";
      // Remove optimistic item on failure
      const activityId = action.meta.arg;
      state.items = state.items.filter(item => item.activityId !== activityId);
    });

    // Unsave activity
    builder.addCase(unsaveActivity.pending, (state) => {
      state.error = null;
    });
    builder.addCase(unsaveActivity.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.activityId !== action.payload);
      const index = state.selectedIds.indexOf(action.payload);
      if (index > -1) {
        state.selectedIds.splice(index, 1);
      }
    });
    builder.addCase(unsaveActivity.rejected, (state, action) => {
      state.error = action.error.message || "Failed to unsave activity";
    });

    // Fetch saved activities
    builder.addCase(fetchSavedActivities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSavedActivities.fulfilled, (state, action) => {
      state.loading = false;
      if (action.meta.arg?.cursor) {
        // Append for pagination
        state.items = [...state.items, ...action.payload.items];
      } else {
        // Replace for initial load
        state.items = action.payload.items;
      }
      state.nextCursor = action.payload.nextCursor;
    });
    builder.addCase(fetchSavedActivities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch saved activities";
    });

    // Bulk delete
    builder.addCase(bulkDeleteSavedActivities.pending, (state) => {
      state.error = null;
    });
    builder.addCase(bulkDeleteSavedActivities.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => !action.payload.includes(item.activityId));
      state.selectedIds = state.selectedIds.filter((id) => !action.payload.includes(id));
      state.multiSelectMode = false;
    });
    builder.addCase(bulkDeleteSavedActivities.rejected, (state, action) => {
      state.error = action.error.message || "Failed to delete activities";
    });
  },
});

export const { clearError, toggleSelectActivity, toggleMultiSelectMode, clearSelection } = savedActivitiesSlice.actions;
export default savedActivitiesSlice.reducer;
