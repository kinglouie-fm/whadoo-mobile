import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiGet } from "../../lib/api";

export interface FieldDefinition {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox" | "textarea";
  required: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  placeholder?: string;
  pattern?: string;
  help?: string;
}

export interface Schema {
  fields: FieldDefinition[];
}

export interface ActivityTypeDefinition {
  typeId: string;
  schemaVersion: number;
  displayName: string;
  configSchema: Schema;
  pricingSchema: Schema;
  createdAt: string;
  updatedAt: string;
}

interface ActivityTypeState {
  typeDefinitions: ActivityTypeDefinition[];
  currentTypeDefinition: ActivityTypeDefinition | null;
  loading: boolean;
  error: string | null;
}

const initialState: ActivityTypeState = {
  typeDefinitions: [],
  currentTypeDefinition: null,
  loading: false,
  error: null,
};

// Thunks
export const fetchTypeDefinitions = createAsyncThunk(
  "activityTypes/fetchAll",
  async () => {
    const data = await apiGet<{ typeDefinitions: ActivityTypeDefinition[] }>(
      "/activity-type-definitions"
    );
    return data.typeDefinitions;
  }
);

export const fetchTypeDefinition = createAsyncThunk(
  "activityTypes/fetchOne",
  async (typeId: string) => {
    const data = await apiGet<{ typeDefinition: ActivityTypeDefinition }>(
      `/activity-type-definitions/${typeId}`
    );
    return data.typeDefinition;
  }
);

const activityTypeSlice = createSlice({
  name: "activityTypes",
  initialState,
  reducers: {
    clearCurrentType: (state) => {
      state.currentTypeDefinition = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all type definitions
      .addCase(fetchTypeDefinitions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTypeDefinitions.fulfilled, (state, action) => {
        state.loading = false;
        state.typeDefinitions = action.payload;
      })
      .addCase(fetchTypeDefinitions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch type definitions";
      })
      // Fetch single type definition
      .addCase(fetchTypeDefinition.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTypeDefinition.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTypeDefinition = action.payload;
      })
      .addCase(fetchTypeDefinition.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch type definition";
      });
  },
});

export const { clearCurrentType, clearError } = activityTypeSlice.actions;
export default activityTypeSlice.reducer;
