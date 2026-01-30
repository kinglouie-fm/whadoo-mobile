import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
    AvailabilityTemplate,
    deactivateTemplate,
    fetchTemplates,
} from "@/src/store/slices/availability-template-slice";
import { useBusiness } from "@/src/lib/use-business";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AvailabilityScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { business, loading: businessLoading } = useBusiness();
    const { templates, loading, error } = useAppSelector((state) => state.availabilityTemplates);
    const [refreshing, setRefreshing] = useState(false);

    const businessId = business?.id;

    const loadTemplates = async () => {
        if (!businessId) return;
        try {
            await dispatch(fetchTemplates(businessId)).unwrap();
        } catch (err) {
            console.error("Failed to load templates:", err);
        }
    };

    useEffect(() => {
        if (businessId) {
            loadTemplates();
        }
    }, [businessId]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadTemplates();
        setRefreshing(false);
    };

    const handleDeactivate = (templateId: string) => {
        Alert.alert(
            "Deactivate Template",
            "Are you sure you want to deactivate this template? It cannot be deactivated if linked to published activities.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Deactivate",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await dispatch(deactivateTemplate(templateId)).unwrap();
                            Alert.alert("Success", "Template deactivated successfully");
                        } catch (err: any) {
                            Alert.alert("Error", err.message || "Failed to deactivate template");
                        }
                    },
                },
            ]
        );
    };

    const formatTime = (timeStr: string) => {
        // timeStr is a Date object string, extract time portion
        try {
            const date = new Date(timeStr);
            return date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });
        } catch {
            return timeStr;
        }
    };

    const formatDays = (days: number[]) => {
        return days
            .sort((a, b) => a - b)
            .map((d) => DAY_NAMES[d])
            .join(", ");
    };

    const renderTemplate = ({ item }: { item: AvailabilityTemplate }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(business)/availability/detail?id=${item.id}`)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.templateName}>{item.name}</Text>
                <View style={[styles.statusBadge, item.status === "active" ? styles.activeBadge : styles.inactiveBadge]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>
            <Text style={styles.detailText}>
                Days: {formatDays(item.daysOfWeek)}
            </Text>
            <Text style={styles.detailText}>
                Time: {formatTime(item.startTime)} - {formatTime(item.endTime)}
            </Text>
            <Text style={styles.detailText}>
                Duration: {item.slotDurationMinutes} min | Capacity: {item.capacity}
            </Text>
            {item.exceptions && item.exceptions.length > 0 && (
                <Text style={styles.detailText}>
                    Exceptions: {item.exceptions.length}
                </Text>
            )}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => router.push(`/(business)/availability/detail?id=${item.id}`)}
                >
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                {item.status === "active" && (
                    <TouchableOpacity
                        style={styles.deactivateButton}
                        onPress={() => handleDeactivate(item.id)}
                    >
                        <Text style={styles.deactivateButtonText}>Deactivate</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    if (businessLoading || !businessId) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.emptyText}>Loading business information...</Text>
            </View>
        );
    }

    if (loading && templates.length === 0) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Availability Templates</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => router.push("/(business)/availability/detail")}
                >
                    <Text style={styles.createButtonText}>+ Create</Text>
                </TouchableOpacity>
            </View>

            {error && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={loadTemplates}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={templates}
                renderItem={renderTemplate}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No availability templates.</Text>
                        <Text style={styles.emptySubtext}>Create your first one to get started.</Text>
                    </View>
                }
            />
        </View>
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
        fontSize: 24,
        fontWeight: "bold",
    },
    createButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    createButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    templateName: {
        fontSize: 18,
        fontWeight: "600",
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    activeBadge: {
        backgroundColor: "#4CAF50",
    },
    inactiveBadge: {
        backgroundColor: "#9E9E9E",
    },
    statusText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    detailText: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    actions: {
        flexDirection: "row",
        marginTop: 12,
        gap: 8,
    },
    editButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    editButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
    deactivateButton: {
        backgroundColor: "#FF3B30",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    deactivateButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#666",
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#999",
    },
    errorBanner: {
        backgroundColor: "#FFEBEE",
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    errorText: {
        color: "#C62828",
        fontSize: 14,
        flex: 1,
    },
    retryText: {
        color: "#007AFF",
        fontSize: 14,
        fontWeight: "600",
    },
});
