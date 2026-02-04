import { configureStore } from "@reduxjs/toolkit";
import activityReducer from "./slices/activity-slice";
import activityTypeReducer from "./slices/activity-type-slice";
import availabilityTemplateReducer from "./slices/availability-template-slice";
import consumerActivityReducer from "./slices/consumer-activity-slice";
import groupedCardsReducer from "./slices/grouped-card-slice";
import savedActivitiesReducer from "./slices/saved-activity-slice";

export const store = configureStore({
  reducer: {
    availabilityTemplates: availabilityTemplateReducer,
    activities: activityReducer,
    activityTypes: activityTypeReducer,
    groupedCards: groupedCardsReducer,
    consumerActivity: consumerActivityReducer,
    savedActivities: savedActivitiesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
