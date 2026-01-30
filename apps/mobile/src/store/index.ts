import { configureStore } from "@reduxjs/toolkit";
import availabilityTemplateReducer from "./slices/availability-template-slice";

export const store = configureStore({
  reducer: {
    availabilityTemplates: availabilityTemplateReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
