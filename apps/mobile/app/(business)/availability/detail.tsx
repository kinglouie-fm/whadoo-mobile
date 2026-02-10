import {
  DangerButton,
  PrimaryButton,
  SecondaryButton,
} from "@/src/components/Button";
import { FormInput } from "@/src/components/Input";
import { useBusiness } from "@/src/providers/business-context";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  AvailabilityException,
  clearCurrentTemplate,
  createTemplate,
  CreateTemplateData,
  fetchTemplate,
  updateTemplate,
  UpdateTemplateData,
} from "@/src/store/slices/availability-template-slice";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AvailabilityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const dispatch = useAppDispatch();
  const { business } = useBusiness();
  const { currentTemplate, loading } = useAppSelector(
    (state) => state.availabilityTemplates,
  );

  const isEditMode = !!id;

  // Form state
  const [name, setName] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("09:00:00");
  const [endTime, setEndTime] = useState("17:00:00");
  const [slotDuration, setSlotDuration] = useState("60");
  const [capacity, setCapacity] = useState("1");
  const [exceptions, setExceptions] = useState<
    Omit<AvailabilityException, "id">[]
  >([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load template if editing
  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchTemplate(id));
    }
    return () => {
      dispatch(clearCurrentTemplate());
    };
  }, [id, isEditMode]);

  // Populate form when template loads
  useEffect(() => {
    if (currentTemplate && isEditMode) {
      setName(currentTemplate.name);
      setSelectedDays(currentTemplate.daysOfWeek);
      setStartTime(formatTimeForInput(currentTemplate.startTime));
      setEndTime(formatTimeForInput(currentTemplate.endTime));
      setSlotDuration(currentTemplate.slotDurationMinutes.toString());
      setCapacity(currentTemplate.capacity.toString());
      setExceptions(
        currentTemplate.exceptions.map((ex) => ({
          startDate: ex.startDate,
          endDate: ex.endDate,
          reason: ex.reason,
        })),
      );
    }
  }, [currentTemplate, isEditMode]);

  const formatTimeForInput = (timeStr: string): string => {
    try {
      const date = new Date(timeStr);

      // Extract time in Luxembourg timezone
      const luxTime = date.toLocaleString("en-US", {
        timeZone: "Europe/Luxembourg",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      // Format is "HH:mm:ss" from toLocaleString
      return luxTime;
    } catch {
      return timeStr;
    }
  };

  const toggleDay = (dayNumber: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayNumber)
        ? prev.filter((d) => d !== dayNumber)
        : [...prev, dayNumber],
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (selectedDays.length === 0) {
      newErrors.days = "Select at least one day";
    }

    const slotDur = parseInt(slotDuration);
    if (isNaN(slotDur) || slotDur <= 0) {
      newErrors.slotDuration = "Slot duration must be greater than 0";
    }

    const cap = parseInt(capacity);
    if (isNaN(cap) || cap < 1) {
      newErrors.capacity = "Capacity must be at least 1";
    }

    // Time validation
    const startSeconds = timeToSeconds(startTime);
    const endSeconds = timeToSeconds(endTime);
    if (startSeconds >= endSeconds) {
      newErrors.time = "Start time must be before end time";
    }

    // Exception validation
    for (let i = 0; i < exceptions.length; i++) {
      const ex = exceptions[i];
      const start = new Date(ex.startDate);
      const end = new Date(ex.endDate);
      if (start > end) {
        newErrors[`exception${i}`] =
          "Start date must be before or equal to end date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const timeToSeconds = (time: string): number => {
    const [h, m, s] = time.split(":").map(Number);
    return h * 3600 + m * 60 + (s || 0);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors in the form");
      return;
    }

    try {
      if (isEditMode && id) {
        const data: UpdateTemplateData = {
          name,
          daysOfWeek: selectedDays.sort((a, b) => a - b),
          startTime,
          endTime,
          slotDurationMinutes: parseInt(slotDuration),
          capacity: parseInt(capacity),
          exceptions: exceptions.length > 0 ? exceptions : undefined,
        };
        await dispatch(updateTemplate({ templateId: id, data })).unwrap();
        Alert.alert("Success", "Template updated successfully");
      } else {
        if (!business?.id) {
          Alert.alert("Error", "Business ID not found. Please try again.");
          return;
        }
        const data: CreateTemplateData = {
          businessId: business.id,
          name,
          daysOfWeek: selectedDays.sort((a, b) => a - b),
          startTime,
          endTime,
          slotDurationMinutes: parseInt(slotDuration),
          capacity: parseInt(capacity),
          exceptions: exceptions.length > 0 ? exceptions : undefined,
        };
        await dispatch(createTemplate(data)).unwrap();
        Alert.alert("Success", "Template created successfully");
      }
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save template");
    }
  };

  const addException = () => {
    const today = new Date().toISOString().split("T")[0];
    setExceptions([
      ...exceptions,
      { startDate: today, endDate: today, reason: "" },
    ]);
  };

  const removeException = (index: number) => {
    setExceptions(exceptions.filter((_, i) => i !== index));
  };

  const updateException = (
    index: number,
    field: keyof (typeof exceptions)[0],
    value: string,
  ) => {
    const updated = [...exceptions];
    updated[index] = { ...updated[index], [field]: value };
    setExceptions(updated);
  };

  if (loading && isEditMode) {
    return (
      <View style={ui.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={ui.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <SecondaryButton
          title="Cancel"
          onPress={() => router.back()}
          style={styles.headerButton}
        />
        <Text style={[typography.h4, styles.headerTitle]}>
          {isEditMode ? "Edit" : "Create"} Template
        </Text>
        <PrimaryButton
          title="Save"
          onPress={handleSave}
          style={styles.headerButton}
        />
      </View>
      <ScrollView
        style={ui.scrollView}
        contentContainerStyle={[ui.contentPadding, styles.scrollContent]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <FormInput
          label="Name *"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Weekend Hours"
          error={errors.name}
        />

        {/* Days of Week */}
        <View style={ui.section}>
          <Text style={[typography.label, styles.labelSpacing]}>
            Days of Week *
          </Text>
          <View style={styles.daySelector}>
            {DAY_NAMES.map((day, index) => {
              const dayNumber = index + 1;
              const isSelected = selectedDays.includes(dayNumber);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    isSelected && styles.dayButtonSelected,
                  ]}
                  onPress={() => toggleDay(dayNumber)}
                >
                  <Text
                    style={[
                      typography.caption,
                      isSelected && styles.dayButtonTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.days && (
            <Text style={[typography.captionSmall, styles.errorText]}>
              {errors.days}
            </Text>
          )}
        </View>

        {/* Time Range */}
        <View style={ui.section}>
          <Text style={[typography.label, styles.labelSpacing]}>
            Time Range *
          </Text>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <FormInput
                label="Start"
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:MM:SS"
                error={errors.time}
              />
            </View>
            <View style={styles.timeField}>
              <FormInput
                label="End"
                value={endTime}
                onChangeText={setEndTime}
                placeholder="HH:MM:SS"
              />
            </View>
          </View>
        </View>

        {/* Slot Duration */}
        <FormInput
          label="Slot Duration (minutes) *"
          value={slotDuration}
          onChangeText={setSlotDuration}
          keyboardType="numeric"
          placeholder="60"
          error={errors.slotDuration}
        />

        {/* Capacity */}
        <FormInput
          label="Capacity *"
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="numeric"
          placeholder="1"
          error={errors.capacity}
        />

        {/* Exceptions */}
        <View style={ui.section}>
          <View style={[ui.rowBetween, styles.sectionHeader]}>
            <Text style={[typography.label, styles.labelSpacing]}>
              Exceptions
            </Text>
            <SecondaryButton
              title="+ Add"
              onPress={addException}
              style={styles.addButton}
            />
          </View>
          {exceptions.map((exception, index) => (
            <View key={index} style={styles.exceptionCard}>
              <View style={styles.exceptionRow}>
                <View style={styles.exceptionField}>
                  <FormInput
                    label="Start Date"
                    value={exception.startDate}
                    onChangeText={(val) =>
                      updateException(index, "startDate", val)
                    }
                    placeholder="YYYY-MM-DD"
                    error={errors[`exception${index}`]}
                  />
                </View>
                <View style={styles.exceptionField}>
                  <FormInput
                    label="End Date"
                    value={exception.endDate}
                    onChangeText={(val) =>
                      updateException(index, "endDate", val)
                    }
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>
              <FormInput
                label="Reason"
                value={exception.reason || ""}
                onChangeText={(val) => updateException(index, "reason", val)}
                placeholder="Optional"
              />
              <DangerButton
                title="Remove"
                onPress={() => removeException(index)}
                style={styles.removeButton}
              />
              {errors[`exception${index}`] && (
                <Text style={[typography.captionSmall, styles.errorText]}>
                  {errors[`exception${index}`]}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.xxl },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    backgroundColor: theme.colors.bg,
  },
  headerTitle: { flex: 1, textAlign: "center" as const },
  headerButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minWidth: 70,
  },

  labelSpacing: { marginBottom: theme.spacing.sm },
  errorText: {
    color: theme.colors.danger,
    marginTop: theme.spacing.sm,
  },

  daySelector: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: theme.spacing.sm,
  },
  dayButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
  },
  dayButtonSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  dayButtonTextSelected: {
    color: theme.colors.buttonTextOnAccent,
  },

  timeRow: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    gap: theme.spacing.md,
  },
  timeField: { flex: 1 },

  sectionHeader: { marginBottom: theme.spacing.md },
  addButton: {
    height: 40,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 17,
  },

  exceptionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    gap: theme.spacing.md,
  },
  exceptionRow: {
    flexDirection: "row" as const,
    gap: theme.spacing.md,
  },
  exceptionField: { flex: 1 },

  removeButton: {
    height: 36,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 18,
    alignSelf: "flex-start",
  },
});
