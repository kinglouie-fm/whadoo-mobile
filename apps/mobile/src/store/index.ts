import { configureStore } from "@reduxjs/toolkit";
import activityReducer from "./slices/activity-slice";
import availabilityTemplateReducer from "./slices/availability-template-slice";

export const store = configureStore({
  reducer: {
    availabilityTemplates: availabilityTemplateReducer,
    activities: activityReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
