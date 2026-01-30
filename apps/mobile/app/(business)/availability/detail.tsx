import { useBusiness } from "@/src/lib/use-business";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
    const { currentTemplate, loading } = useAppSelector((state) => state.availabilityTemplates);

    const isEditMode = !!id;

    // Form state
    const [name, setName] = useState("");
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [startTime, setStartTime] = useState("09:00:00");
    const [endTime, setEndTime] = useState("17:00:00");
    const [slotDuration, setSlotDuration] = useState("60");
    const [capacity, setCapacity] = useState("1");
    const [imageUrl, setImageUrl] = useState("");
    const [exceptions, setExceptions] = useState<Omit<AvailabilityException, "id">[]>([]);
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
            setImageUrl(currentTemplate.imageUrl || "");
            setExceptions(
                currentTemplate.exceptions.map((ex) => ({
                    startDate: ex.startDate,
                    endDate: ex.endDate,
                    reason: ex.reason,
                }))
            );
        }
    }, [currentTemplate, isEditMode]);

    const formatTimeForInput = (timeStr: string): string => {
        try {
            const date = new Date(timeStr);
            const hours = date.getUTCHours().toString().padStart(2, "0");
            const minutes = date.getUTCMinutes().toString().padStart(2, "0");
            const seconds = date.getUTCSeconds().toString().padStart(2, "0");
            return `${hours}:${minutes}:${seconds}`;
        } catch {
            return timeStr;
        }
    };

    const toggleDay = (dayNumber: number) => {
        setSelectedDays((prev) =>
            prev.includes(dayNumber) ? prev.filter((d) => d !== dayNumber) : [...prev, dayNumber]
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
                newErrors[`exception${i}`] = "Start date must be before or equal to end date";
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
                    imageUrl: imageUrl || undefined,
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
                    imageUrl: imageUrl || undefined,
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
        setExceptions([...exceptions, { startDate: today, endDate: today, reason: "" }]);
    };

    const removeException = (index: number) => {
        setExceptions(exceptions.filter((_, i) => i !== index));
    };

    const updateException = (index: number, field: keyof typeof exceptions[0], value: string) => {
        const updated = [...exceptions];
        updated[index] = { ...updated[index], [field]: value };
        setExceptions(updated);
    };

    if (loading && isEditMode) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.cancelButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{isEditMode ? "Edit" : "Create"} Template</Text>
                    <TouchableOpacity onPress={handleSave}>
                        <Text style={styles.saveButton}>Save</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    {/* Name */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Name *</Text>
                        <TextInput
                            style={[styles.input, errors.name && styles.inputError]}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g., Weekend Hours"
                        />
                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                    </View>

                    {/* Days of Week */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Days of Week *</Text>
                        <View style={styles.daySelector}>
                            {DAY_NAMES.map((day, index) => {
                                const dayNumber = index + 1;
                                const isSelected = selectedDays.includes(dayNumber);
                                return (
                                    <TouchableOpacity
                                        key={day}
                                        style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                                        onPress={() => toggleDay(dayNumber)}
                                    >
                                        <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextSelected]}>
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        {errors.days && <Text style={styles.errorText}>{errors.days}</Text>}
                    </View>

                    {/* Time Range */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Time Range *</Text>
                        <View style={styles.timeRow}>
                            <View style={styles.timeField}>
                                <Text style={styles.subLabel}>Start</Text>
                                <TextInput
                                    style={[styles.input, errors.time && styles.inputError]}
                                    value={startTime}
                                    onChangeText={setStartTime}
                                    placeholder="HH:MM:SS"
                                />
                            </View>
                            <Text style={styles.timeSeparator}>—</Text>
                            <View style={styles.timeField}>
                                <Text style={styles.subLabel}>End</Text>
                                <TextInput
                                    style={[styles.input, errors.time && styles.inputError]}
                                    value={endTime}
                                    onChangeText={setEndTime}
                                    placeholder="HH:MM:SS"
                                />
                            </View>
                        </View>
                        {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
                    </View>

                    {/* Slot Duration */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Slot Duration (minutes) *</Text>
                        <TextInput
                            style={[styles.input, errors.slotDuration && styles.inputError]}
                            value={slotDuration}
                            onChangeText={setSlotDuration}
                            keyboardType="numeric"
                            placeholder="60"
                        />
                        {errors.slotDuration && <Text style={styles.errorText}>{errors.slotDuration}</Text>}
                    </View>

                    {/* Capacity */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Capacity *</Text>
                        <TextInput
                            style={[styles.input, errors.capacity && styles.inputError]}
                            value={capacity}
                            onChangeText={setCapacity}
                            keyboardType="numeric"
                            placeholder="1"
                        />
                        {errors.capacity && <Text style={styles.errorText}>{errors.capacity}</Text>}
                    </View>

                    {/* Image URL (optional) */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Image URL (optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={imageUrl}
                            onChangeText={setImageUrl}
                            placeholder="https://example.com/image.jpg"
                        />
                    </View>

                    {/* Exceptions */}
                    <View style={styles.field}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.label}>Exceptions</Text>
                            <TouchableOpacity style={styles.addButton} onPress={addException}>
                                <Text style={styles.addButtonText}>+ Add</Text>
                            </TouchableOpacity>
                        </View>
                        {exceptions.map((exception, index) => (
                            <View key={index} style={styles.exceptionCard}>
                                <View style={styles.exceptionRow}>
                                    <View style={styles.exceptionField}>
                                        <Text style={styles.subLabel}>Start Date</Text>
                                        <TextInput
                                            style={[styles.input, errors[`exception${index}`] && styles.inputError]}
                                            value={exception.startDate}
                                            onChangeText={(val) => updateException(index, "startDate", val)}
                                            placeholder="YYYY-MM-DD"
                                        />
                                    </View>
                                    <View style={styles.exceptionField}>
                                        <Text style={styles.subLabel}>End Date</Text>
                                        <TextInput
                                            style={[styles.input, errors[`exception${index}`] && styles.inputError]}
                                            value={exception.endDate}
                                            onChangeText={(val) => updateException(index, "endDate", val)}
                                            placeholder="YYYY-MM-DD"
                                        />
                                    </View>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={exception.reason || ""}
                                    onChangeText={(val) => updateException(index, "reason", val)}
                                    placeholder="Reason (optional)"
                                />
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removeException(index)}
                                >
                                    <Text style={styles.removeButtonText}>Remove</Text>
                                </TouchableOpacity>
                                {errors[`exception${index}`] && (
                                    <Text style={styles.errorText}>{errors[`exception${index}`]}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
    },
    cancelButton: {
        color: "#007AFF",
        fontSize: 16,
    },
    saveButton: {
        color: "#007AFF",
        fontSize: 16,
        fontWeight: "600",
    },
    form: {
        padding: 16,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
        color: "#333",
    },
    subLabel: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
        color: "#666",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    inputError: {
        borderColor: "#FF3B30",
    },
    errorText: {
        color: "#FF3B30",
        fontSize: 12,
        marginTop: 4,
    },
    daySelector: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
    },
    dayButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ccc",
        backgroundColor: "#fff",
    },
    dayButtonSelected: {
        backgroundColor: "#007AFF",
        borderColor: "#007AFF",
    },
    dayButtonText: {
        fontSize: 14,
        color: "#333",
    },
    dayButtonTextSelected: {
        color: "#fff",
    },
    timeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    timeField: {
        flex: 1,
    },
    timeSeparator: {
        fontSize: 18,
        color: "#666",
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    addButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    addButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
    exceptionCard: {
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    exceptionRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 8,
    },
    exceptionField: {
        flex: 1,
    },
    removeButton: {
        backgroundColor: "#FF3B30",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        alignSelf: "flex-start",
        marginTop: 8,
    },
    removeButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
});
