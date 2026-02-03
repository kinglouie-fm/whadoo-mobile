import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiGet, apiPost } from "../../lib/api";

export interface GroupedCard {
  catalogGroupId: string;
  businessId: string;
  businessName: string;
  typeId: string;
  typeLabel: string;
  city: string;
  locationSummary: string;
  thumbnailUrl?: string;
  priceFrom: number;
  tags: string[];
  activityCount: number;
  sampleDurations: number[];
  updatedAt: string;
  representativeActivityId: string;
}

export interface GroupedCardsResponse {
  groups: GroupedCard[];
  nextCursor: string | null;
}

export interface RecordSwipeData {
  direction: "left" | "right" | "up" | "down";
  catalogGroupId?: string;
  activityId?: string;
  city?: string;
  typeId?: string;
}

interface GroupedCardState {
  groups: GroupedCard[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
  nextCursor: string | null;
  hasMore: boolean;
}

const initialState: GroupedCardState = {
  groups: [],
  currentIndex: 0,
  loading: false,
  error: null,
  nextCursor: null,
  hasMore: true,
};

// Async thunks
export const fetchGroupedCards = createAsyncThunk(
  "groupedCards/fetch",
  async (filters?: { city?: string; typeId?: string; cursor?: string }) => {
    const params = new URLSearchParams();
    if (filters?.city) params.append("city", filters.city);
    if (filters?.typeId) params.append("typeId", filters.typeId);
    if (filters?.cursor) params.append("cursor", filters.cursor);
    const query = params.toString();
    const url = query ? `/activities/grouped-cards?${query}` : "/activities/grouped-cards";
    const response = await apiGet<GroupedCardsResponse>(url);
    return response;
  }
);

export const recordSwipe = createAsyncThunk(
  "groupedCards/recordSwipe",
  async (data: RecordSwipeData) => {
    await apiPost("/activities/swipe", data);
    return data;
  }
);

const groupedCardSlice = createSlice({
  name: "groupedCards",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    advanceCard: (state) => {
      if (state.currentIndex < state.groups.length - 1) {
        state.currentIndex += 1;
      }
    },
    resetFeed: (state) => {
      state.groups = [];
      state.currentIndex = 0;
      state.nextCursor = null;
      state.hasMore = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch grouped cards
    builder.addCase(fetchGroupedCards.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchGroupedCards.fulfilled, (state, action: PayloadAction<GroupedCardsResponse>) => {
      state.loading = false;
      // If cursor was provided, append; otherwise, replace
      if (action.meta.arg?.cursor) {
        state.groups = [...state.groups, ...action.payload.groups];
      } else {
        state.groups = action.payload.groups;
        state.currentIndex = 0;
      }
      state.nextCursor = action.payload.nextCursor;
      state.hasMore = action.payload.nextCursor !== null;
    });
    builder.addCase(fetchGroupedCards.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Failed to fetch grouped cards";
    });

    // Record swipe (no state changes needed, just tracking)
    builder.addCase(recordSwipe.fulfilled, (state) => {
      // Swipe recorded successfully, no state change needed
    });
    builder.addCase(recordSwipe.rejected, (state, action) => {
      // Silently fail for swipes, don't block UX
      console.warn("Failed to record swipe:", action.error.message);
    });
  },
});

export const { clearError, advanceCard, resetFeed } = groupedCardSlice.actions;
export default groupedCardSlice.reducer;
