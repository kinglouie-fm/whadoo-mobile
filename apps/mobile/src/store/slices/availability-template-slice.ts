import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiGet, apiPatch, apiPost, apiPut } from "../../lib/api";

export interface AvailabilityException {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface AvailabilityTemplate {
  id: string;
  businessId: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  capacity: number;
  imageUrl?: string;
  status: "active" | "inactive";
  exceptions: AvailabilityException[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateData {
  businessId: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  capacity: number;
  imageUrl?: string;
  exceptions?: Omit<AvailabilityException, "id">[];
}

export interface UpdateTemplateData {
  name?: string;
  daysOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  slotDurationMinutes?: number;
  capacity?: number;
  imageUrl?: string;
  exceptions?: Omit<AvailabilityException, "id">[];
}

interface AvailabilityTemplateState {
  templates: AvailabilityTemplate[];
  currentTemplate: AvailabilityTemplate | null;
  loading: boolean;
  error: string | null;
}

const initialState: AvailabilityTemplateState = {
  templates: [],
  currentTemplate: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchTemplates = createAsyncThunk(
  "availabilityTemplates/fetchTemplates",
  async (businessId: string) => {
    const templates = await apiGet<AvailabilityTemplate[]>(`/availability-templates/business/${businessId}`);
    return templates;
  }
);

export const fetchTemplate = createAsyncThunk(
  "availabilityTemplates/fetchTemplate",
  async (templateId: string) => {
    const template = await apiGet<AvailabilityTemplate>(`/availability-templates/${templateId}`);
    return template;
  }
);

export const createTemplate = createAsyncThunk(
  "availabilityTemplates/createTemplate",
  async (data: CreateTemplateData) => {
    const template = await apiPost<AvailabilityTemplate>("/availability-templates", data);
    return template;
  }
);

export const updateTemplate = createAsyncThunk(
  "availabilityTemplates/updateTemplate",
  async ({ templateId, data }: { templateId: string; data: UpdateTemplateData }) => {
    const template = await apiPut<AvailabilityTemplate>(`/availability-templates/${templateId}`, data);
    return template;
  }
);

export const deactivateTemplate = createAsyncThunk(
  "availabilityTemplates/deactivateTemplate",
  async (templateId: string) => {
    const template = await apiPatch<AvailabilityTemplate>(`/availability-templates/${templateId}/deactivate`, {});
    return template;
  }
);

const availabilityTemplateSlice = createSlice({
  name: "availabilityTemplates",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTemplate: (state) => {
      state.currentTemplate = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch templates
    builder.addCase(fetchTemplates.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTemplates.fulfilled, (state, action: PayloadAction<AvailabilityTemplate[]>) => {
      state.loading = false;
      state.templates = action.payload;
    });
    builder.addCase(fetchTemplates.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch templates";
    });

    // Fetch single template
    builder.addCase(fetchTemplate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTemplate.fulfilled, (state, action: PayloadAction<AvailabilityTemplate>) => {
      state.loading = false;
      state.currentTemplate = action.payload;
    });
    builder.addCase(fetchTemplate.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch template";
    });

    // Create template
    builder.addCase(createTemplate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createTemplate.fulfilled, (state, action: PayloadAction<AvailabilityTemplate>) => {
      state.loading = false;
      state.templates.unshift(action.payload);
    });
    builder.addCase(createTemplate.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to create template";
    });

    // Update template
    builder.addCase(updateTemplate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateTemplate.fulfilled, (state, action: PayloadAction<AvailabilityTemplate>) => {
      state.loading = false;
      const index = state.templates.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.templates[index] = action.payload;
      }
      if (state.currentTemplate?.id === action.payload.id) {
        state.currentTemplate = action.payload;
      }
    });
    builder.addCase(updateTemplate.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to update template";
    });

    // Deactivate template
    builder.addCase(deactivateTemplate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deactivateTemplate.fulfilled, (state, action: PayloadAction<AvailabilityTemplate>) => {
      state.loading = false;
      const index = state.templates.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.templates[index] = action.payload;
      }
      if (state.currentTemplate?.id === action.payload.id) {
        state.currentTemplate = action.payload;
      }
    });
    builder.addCase(deactivateTemplate.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to deactivate template";
    });
  },
});

export const { clearError, clearCurrentTemplate } = availabilityTemplateSlice.actions;
export default availabilityTemplateSlice.reducer;
