import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiDelete, apiGet, apiPost } from "../../lib/api";

export interface BookingSnapshot {
  title: string;
  description?: string;
  city?: string;
  address?: string;
  thumbnailUrl?: string;
  typeId: string;
  catalogGroupKind?: string;
}

export interface BusinessSnapshot {
  name: string;
  contactPhone?: string;
  contactEmail?: string;
  city?: string;
  address?: string;
}

export interface SelectionSnapshot {
  typeId: string;
  activityId: string;
  packageName?: string;
  durationMinutes: number;
  participantsCount: number;
  data: any;
}

export interface PriceSnapshot {
  total: string;
  currency: string;
  breakdown?: any;
}

export interface Booking {
  id: string;
  userId: string;
  businessId: string;
  activityId: string;
  slotStart: string;
  participantsCount: number;
  status: 'active' | 'cancelled' | 'completed';
  activitySnapshot: BookingSnapshot;
  businessSnapshot?: BusinessSnapshot;
  selectionSnapshot: SelectionSnapshot;
  priceSnapshot: PriceSnapshot;
  paymentAmount?: number;
  paymentCurrency?: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingsState {
  upcoming: {
    items: Booking[];
    nextCursor: string | null;
    loading: boolean;
    error: string | null;
  };
  past: {
    items: Booking[];
    nextCursor: string | null;
    loading: boolean;
    error: string | null;
  };
  currentBooking: Booking | null;
  bookingLoading: boolean;
  bookingError: string | null;
}

const initialState: BookingsState = {
  upcoming: {
    items: [],
    nextCursor: null,
    loading: false,
    error: null,
  },
  past: {
    items: [],
    nextCursor: null,
    loading: false,
    error: null,
  },
  currentBooking: null,
  bookingLoading: false,
  bookingError: null,
};

// Create booking
export const createBooking = createAsyncThunk(
  "bookings/create",
  async (data: {
    activityId: string;
    slotStart: string;
    participantsCount: number;
    selectionData: any;
  }) => {
    const result = await apiPost<Booking>("/bookings", data);
    return result;
  }
);

// Cancel booking
export const cancelBooking = createAsyncThunk(
  "bookings/cancel",
  async (data: { bookingId: string; reason?: string }) => {
    const result = await apiPost<Booking>(
      `/bookings/${data.bookingId}/cancel`,
      { reason: data.reason }
    );
    return result;
  }
);

// Fetch bookings list
export const fetchBookings = createAsyncThunk(
  "bookings/fetchList",
  async (params: { kind: 'upcoming' | 'past'; cursor?: string }) => {
    const queryParams = new URLSearchParams();
    queryParams.append('kind', params.kind);
    if (params.cursor) {
      queryParams.append('cursor', params.cursor);
    }
    
    const result = await apiGet<{ items: Booking[]; nextCursor: string | null }>(
      `/bookings?${queryParams.toString()}`
    );
    return { ...result, kind: params.kind };
  }
);

// Fetch single booking
export const fetchBooking = createAsyncThunk(
  "bookings/fetchOne",
  async (bookingId: string) => {
    const result = await apiGet<Booking>(`/bookings/${bookingId}`);
    return result;
  }
);

const bookingsSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    clearBookingError: (state) => {
      state.bookingError = null;
    },
  },
  extraReducers: (builder) => {
    // Create booking
    builder.addCase(createBooking.pending, (state) => {
      state.bookingLoading = true;
      state.bookingError = null;
    });
    builder.addCase(createBooking.fulfilled, (state, action) => {
      state.bookingLoading = false;
      // Add to upcoming list
      state.upcoming.items.unshift(action.payload);
    });
    builder.addCase(createBooking.rejected, (state, action) => {
      state.bookingLoading = false;
      state.bookingError = action.error.message || "Failed to create booking";
    });

    // Cancel booking
    builder.addCase(cancelBooking.pending, (state) => {
      state.bookingLoading = true;
      state.bookingError = null;
    });
    builder.addCase(cancelBooking.fulfilled, (state, action) => {
      state.bookingLoading = false;
      // Update in lists
      const updateInList = (items: Booking[]) => 
        items.map(b => b.id === action.payload.id ? action.payload : b);
      
      state.upcoming.items = updateInList(state.upcoming.items);
      state.past.items = updateInList(state.past.items);
      
      if (state.currentBooking?.id === action.payload.id) {
        state.currentBooking = action.payload;
      }
    });
    builder.addCase(cancelBooking.rejected, (state, action) => {
      state.bookingLoading = false;
      state.bookingError = action.error.message || "Failed to cancel booking";
    });

    // Fetch bookings list
    builder.addCase(fetchBookings.pending, (state, action) => {
      const kind = action.meta.arg.kind;
      state[kind].loading = true;
      state[kind].error = null;
    });
    builder.addCase(fetchBookings.fulfilled, (state, action) => {
      const kind = action.payload.kind;
      state[kind].loading = false;
      
      if (action.meta.arg.cursor) {
        // Append for pagination
        state[kind].items.push(...action.payload.items);
      } else {
        // Replace for initial fetch
        state[kind].items = action.payload.items;
      }
      
      state[kind].nextCursor = action.payload.nextCursor;
    });
    builder.addCase(fetchBookings.rejected, (state, action) => {
      const kind = action.meta.arg.kind;
      state[kind].loading = false;
      state[kind].error = action.error.message || "Failed to fetch bookings";
    });

    // Fetch single booking
    builder.addCase(fetchBooking.pending, (state) => {
      state.bookingLoading = true;
      state.bookingError = null;
    });
    builder.addCase(fetchBooking.fulfilled, (state, action) => {
      state.bookingLoading = false;
      state.currentBooking = action.payload;
    });
    builder.addCase(fetchBooking.rejected, (state, action) => {
      state.bookingLoading = false;
      state.bookingError = action.error.message || "Failed to fetch booking";
    });
  },
});

export const { clearCurrentBooking, clearBookingError } = bookingsSlice.actions;
export default bookingsSlice.reducer;
