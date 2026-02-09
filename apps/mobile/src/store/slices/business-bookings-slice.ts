import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiGet } from "../../lib/api";
import type { Booking } from "./bookings-slice";

interface BusinessStats {
  todayCount: number;
  upcomingCount: number;
  totalRevenue: number;
}

interface BusinessBookingsState {
  bookings: Booking[];
  stats: BusinessStats | null;
  loading: boolean;
  error: string | null;
  cursor: string | null;
  hasMore: boolean;
}

const initialState: BusinessBookingsState = {
  bookings: [],
  stats: null,
  loading: false,
  error: null,
  cursor: null,
  hasMore: false,
};

// Fetch business bookings
export const fetchBusinessBookings = createAsyncThunk(
  "businessBookings/fetch",
  async (params: {
    businessId: string;
    kind?: "upcoming" | "past" | "today";
    status?: "active" | "cancelled" | "completed";
    cursor?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.kind) queryParams.append("kind", params.kind);
    if (params.status) queryParams.append("status", params.status);
    if (params.cursor) queryParams.append("cursor", params.cursor);

    const result = await apiGet<{ items: Booking[]; nextCursor: string | null }>(
      `/bookings/business/${params.businessId}/list?${queryParams.toString()}`,
    );
    return result;
  },
);

// Fetch business stats
export const fetchBusinessStats = createAsyncThunk(
  "businessBookings/fetchStats",
  async (businessId: string) => {
    const result = await apiGet<BusinessStats>(
      `/bookings/business/${businessId}/stats`,
    );
    return result;
  },
);

const businessBookingsSlice = createSlice({
  name: "businessBookings",
  initialState,
  reducers: {
    clearBusinessBookings: (state) => {
      state.bookings = [];
      state.cursor = null;
      state.hasMore = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch bookings
      .addCase(fetchBusinessBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBusinessBookings.fulfilled, (state, action) => {
        state.loading = false;
        const { items, nextCursor } = action.payload;
        
        // If cursor was provided, append; otherwise replace
        if (action.meta.arg.cursor) {
          state.bookings = [...state.bookings, ...items];
        } else {
          state.bookings = items;
        }
        
        state.cursor = nextCursor;
        state.hasMore = nextCursor !== null;
      })
      .addCase(fetchBusinessBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch bookings";
      })
      
      // Fetch stats
      .addCase(fetchBusinessStats.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchBusinessStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchBusinessStats.rejected, (state, action) => {
        state.error = action.error.message || "Failed to fetch stats";
      });
  },
});

export const { clearBusinessBookings } = businessBookingsSlice.actions;
export default businessBookingsSlice.reducer;
