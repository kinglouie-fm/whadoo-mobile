import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiGet } from "../../lib/api";
import { Activity } from "./activity-slice";

export interface ActivityGroup {
  catalogGroupId: string;
  catalogGroupTitle: string | null;
  businessName: string | null;
  businessCity: string | null;
  businessAddress: string | null;
  businessImages: string[];
  activities: Array<{
    id: string;
    title: string;
    description: string | null;
    typeId: string;
    priceFrom: string | null;
    config: any;
    pricing: any;
    images: any[];
    duration: number | null;
    capacity: number | null;
    availabilityTemplate: any;
  }>;
}

interface ConsumerActivityState {
  currentActivity: Activity | null;
  currentGroup: ActivityGroup | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConsumerActivityState = {
  currentActivity: null,
  currentGroup: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchConsumerActivity = createAsyncThunk(
  "consumerActivity/fetchActivity",
  async (activityId: string) => {
    const activity = await apiGet<Activity>(`/activities/consumer/${activityId}`);
    return activity;
  }
);

export const fetchActivityGroup = createAsyncThunk(
  "consumerActivity/fetchGroup",
  async (catalogGroupId: string) => {
    const group = await apiGet<ActivityGroup>(`/activities/group/${catalogGroupId}`);
    return group;
  }
);

const consumerActivitySlice = createSlice({
  name: "consumerActivity",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentActivity: (state) => {
      state.currentActivity = null;
    },
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch single activity
    builder.addCase(fetchConsumerActivity.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchConsumerActivity.fulfilled, (state, action: PayloadAction<Activity>) => {
      state.loading = false;
      state.currentActivity = action.payload;
    });
    builder.addCase(fetchConsumerActivity.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch activity";
    });

    // Fetch activity group
    builder.addCase(fetchActivityGroup.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchActivityGroup.fulfilled, (state, action: PayloadAction<ActivityGroup>) => {
      state.loading = false;
      state.currentGroup = action.payload;
    });
    builder.addCase(fetchActivityGroup.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch activity group";
    });
  },
});

export const { clearError, clearCurrentActivity, clearCurrentGroup } = consumerActivitySlice.actions;
export default consumerActivitySlice.reducer;
