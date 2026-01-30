import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiGet, apiPatch, apiPost, apiPut } from "../../lib/api";

export interface ActivityImage {
  id: string;
  imageUrl: string;
  isThumbnail: boolean;
  sortOrder: number;
}

export interface Activity {
  id: string;
  businessId: string;
  status: "draft" | "published" | "inactive";
  typeId: string;
  title: string;
  description?: string;
  category?: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  priceFrom?: number;
  config: Record<string, any>;
  pricing: Record<string, any>;
  availabilityTemplateId?: string;
  images: ActivityImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityData {
  businessId: string;
  title: string;
  typeId: string;
  description?: string;
  category?: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  priceFrom?: number;
  config?: Record<string, any>;
  pricing?: Record<string, any>;
  availabilityTemplateId?: string;
  images?: Omit<ActivityImage, "id">[];
}

export interface UpdateActivityData {
  title?: string;
  typeId?: string;
  description?: string;
  category?: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
  priceFrom?: number;
  config?: Record<string, any>;
  pricing?: Record<string, any>;
  availabilityTemplateId?: string;
  images?: Omit<ActivityImage, "id">[];
}

interface ActivityState {
  activities: Activity[];
  publishedActivities: Activity[];
  currentActivity: Activity | null;
  loading: boolean;
  error: string | null;
}

const initialState: ActivityState = {
  activities: [],
  publishedActivities: [],
  currentActivity: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchActivities = createAsyncThunk(
  "activities/fetchActivities",
  async ({ businessId, status }: { businessId: string; status?: string }) => {
    const url = status
      ? `/activities/business/${businessId}?status=${status}`
      : `/activities/business/${businessId}`;
    const activities = await apiGet<Activity[]>(url);
    return activities;
  }
);

export const fetchPublishedActivities = createAsyncThunk(
  "activities/fetchPublishedActivities",
  async (filters?: { city?: string; typeId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.city) params.append("city", filters.city);
    if (filters?.typeId) params.append("typeId", filters.typeId);
    const query = params.toString();
    const url = query ? `/activities/published?${query}` : "/activities/published";
    const activities = await apiGet<Activity[]>(url);
    return activities;
  }
);

export const fetchActivity = createAsyncThunk("activities/fetchActivity", async (activityId: string) => {
  const activity = await apiGet<Activity>(`/activities/${activityId}`);
  return activity;
});

export const createActivity = createAsyncThunk(
  "activities/createActivity",
  async (data: CreateActivityData) => {
    const activity = await apiPost<Activity>("/activities", data);
    return activity;
  }
);

export const updateActivity = createAsyncThunk(
  "activities/updateActivity",
  async ({ activityId, data }: { activityId: string; data: UpdateActivityData }) => {
    const activity = await apiPut<Activity>(`/activities/${activityId}`, data);
    return activity;
  }
);

export const publishActivity = createAsyncThunk("activities/publishActivity", async (activityId: string) => {
  const activity = await apiPatch<Activity>(`/activities/${activityId}/publish`, {});
  return activity;
});

export const unpublishActivity = createAsyncThunk(
  "activities/unpublishActivity",
  async (activityId: string) => {
    const activity = await apiPatch<Activity>(`/activities/${activityId}/unpublish`, {});
    return activity;
  }
);

export const deactivateActivity = createAsyncThunk(
  "activities/deactivateActivity",
  async (activityId: string) => {
    const activity = await apiPatch<Activity>(`/activities/${activityId}/deactivate`, {});
    return activity;
  }
);

const activitySlice = createSlice({
  name: "activities",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentActivity: (state) => {
      state.currentActivity = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch activities
    builder.addCase(fetchActivities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchActivities.fulfilled, (state, action: PayloadAction<Activity[]>) => {
      state.loading = false;
      state.activities = action.payload;
    });
    builder.addCase(fetchActivities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch activities";
    });

    // Fetch published activities
    builder.addCase(fetchPublishedActivities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPublishedActivities.fulfilled, (state, action: PayloadAction<Activity[]>) => {
      state.loading = false;
      state.publishedActivities = action.payload;
    });
    builder.addCase(fetchPublishedActivities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch published activities";
    });

    // Fetch single activity
    builder.addCase(fetchActivity.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchActivity.fulfilled, (state, action: PayloadAction<Activity>) => {
      state.loading = false;
      state.currentActivity = action.payload;
    });
    builder.addCase(fetchActivity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch activity";
    });

    // Create activity
    builder.addCase(createActivity.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createActivity.fulfilled, (state, action: PayloadAction<Activity>) => {
      state.loading = false;
      state.activities.unshift(action.payload);
    });
    builder.addCase(createActivity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to create activity";
    });

    // Update activity
    builder.addCase(updateActivity.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateActivity.fulfilled, (state, action: PayloadAction<Activity>) => {
      state.loading = false;
      const index = state.activities.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.activities[index] = action.payload;
      }
      if (state.currentActivity?.id === action.payload.id) {
        state.currentActivity = action.payload;
      }
    });
    builder.addCase(updateActivity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to update activity";
    });

    // Publish activity
    builder.addCase(publishActivity.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(publishActivity.fulfilled, (state, action: PayloadAction<Activity>) => {
      state.loading = false;
      const index = state.activities.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.activities[index] = action.payload;
      }
      if (state.currentActivity?.id === action.payload.id) {
        state.currentActivity = action.payload;
      }
    });
    builder.addCase(publishActivity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to publish activity";
    });

    // Unpublish activity
    builder.addCase(unpublishActivity.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(unpublishActivity.fulfilled, (state, action: PayloadAction<Activity>) => {
      state.loading = false;
      const index = state.activities.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.activities[index] = action.payload;
      }
      if (state.currentActivity?.id === action.payload.id) {
        state.currentActivity = action.payload;
      }
    });
    builder.addCase(unpublishActivity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to unpublish activity";
    });

    // Deactivate activity
    builder.addCase(deactivateActivity.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deactivateActivity.fulfilled, (state, action: PayloadAction<Activity>) => {
      state.loading = false;
      const index = state.activities.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.activities[index] = action.payload;
      }
      if (state.currentActivity?.id === action.payload.id) {
        state.currentActivity = action.payload;
      }
    });
    builder.addCase(deactivateActivity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to deactivate activity";
    });
  },
});

export const { clearError, clearCurrentActivity } = activitySlice.actions;
export default activitySlice.reducer;
