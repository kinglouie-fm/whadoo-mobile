import { useBusiness } from "@/src/lib/use-business";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
    Activity,
    deactivateActivity,
    fetchActivities,
    publishActivity,
    unpublishActivity,
} from "@/src/store/slices/activity-slice";
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
import Toast from "react-native-toast-message";

type FilterStatus = "all" | "draft" | "published" | "inactive";

export default function ActivitiesScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { business, loading: businessLoading } = useBusiness();
    const { activities, loading, error } = useAppSelector((state) => state.activities);
    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

    const businessId = business?.id;

    const loadActivities = async () => {
        if (!businessId) return;
        try {
            const status = filterStatus === "all" ? undefined : filterStatus;
            await dispatch(fetchActivities({ businessId, status })).unwrap();
        } catch (err) {
            console.error("Failed to load activities:", err);
        }
    };

    useEffect(() => {
        if (businessId) {
            loadActivities();
        }
    }, [businessId, filterStatus]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadActivities();
        setRefreshing(false);
    };

    const handlePublishError = (error: any) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        const missingFields = error.missingFields;

        switch (errorCode) {
            case "TEMPLATE_REQUIRED":
                Alert.alert(
                    "Link Availability Template",
                    "You must link an availability template before publishing.",
                    [{ text: "OK" }]
                );
                break;

            case "TEMPLATE_NOT_FOUND":
                Alert.alert(
                    "Template Not Found",
                    "The linked availability template no longer exists. Please link a different template.",
                    [{ text: "OK" }]
                );
                break;

            case "TEMPLATE_INACTIVE":
                Alert.alert(
                    "Template Inactive",
                    "The linked availability template is inactive. Activate it or link a different template.",
                    [{ text: "OK" }]
                );
                break;

            case "REQUIRED_FIELDS_MISSING":
                const fields = missingFields?.join(", ") || "unknown";
                Alert.alert("Missing Required Fields", `Please fill in: ${fields}`, [{ text: "OK" }]);
                break;

            default:
                Alert.alert("Publish Failed", errorMessage || "An error occurred while publishing.", [
                    { text: "OK" },
                ]);
        }
    };

    const handlePublish = async (activityId: string) => {
        try {
            await dispatch(publishActivity(activityId)).unwrap();
            Toast.show({
                type: "success",
                text1: "Success",
                text2: "Activity published successfully",
            });
        } catch (err: any) {
            handlePublishError(err);
        }
    };

    const handleUnpublish = async (activityId: string) => {
        try {
            await dispatch(unpublishActivity(activityId)).unwrap();
            Toast.show({
                type: "success",
                text1: "Success",
                text2: "Activity unpublished successfully",
            });
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to unpublish activity");
        }
    };

    const handleDeactivate = (activityId: string) => {
        Alert.alert("Deactivate Activity", "Are you sure you want to deactivate this activity?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Deactivate",
                style: "destructive",
                onPress: async () => {
                    try {
                        await dispatch(deactivateActivity(activityId)).unwrap();
                        Toast.show({
                            type: "success",
                            text1: "Success",
                            text2: "Activity deactivated successfully",
                        });
                    } catch (err: any) {
                        Alert.alert("Error", err.message || "Failed to deactivate activity");
                    }
                },
            },
        ]);
    };

    const renderActivity = ({ item }: { item: Activity }) => {
        const canPublish = item.status === "draft" && item.availabilityTemplateId;

        // Determine publish readiness status
        const getPublishStatus = () => {
            if (item.status === "published") return { label: "Published", style: styles.publishedBadge };
            if (item.status === "draft" && !item.availabilityTemplateId) return { label: "Needs Template", style: styles.warningBadge };
            if (item.status === "draft" && item.availabilityTemplateId) return { label: "Ready to Publish", style: styles.readyBadge };
            return { label: item.status, style: styles.inactiveBadge };
        };

        const publishStatus = getPublishStatus();

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(business)/activities/detail?id=${item.id}`)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                        <Text style={styles.activityTitle}>{item.title}</Text>
                        <View style={[styles.statusBadge, publishStatus.style]}>
                            <Text style={styles.statusText}>{publishStatus.label}</Text>
                        </View>
                    </View>
                </View>
                <Text style={styles.detailText}>Type: {item.typeId}</Text>
                {item.city && <Text style={styles.detailText}>City: {item.city}</Text>}
                {item.priceFrom && <Text style={styles.detailText}>From: ${item.priceFrom}</Text>}
                {item.status === "draft" && !item.availabilityTemplateId && (
                    <Text style={styles.warningText}>⚠️ Link an availability template to publish</Text>
                )}

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => router.push(`/(business)/activities/detail?id=${item.id}`)}
                    >
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    {item.status === "draft" && (
                        <TouchableOpacity
                            style={[styles.publishButton, !canPublish && styles.disabledButton]}
                            onPress={() => canPublish && handlePublish(item.id)}
                            disabled={!canPublish}
                        >
                            <Text style={styles.publishButtonText}>Publish</Text>
                        </TouchableOpacity>
                    )}
                    {item.status === "published" && (
                        <TouchableOpacity
                            style={styles.unpublishButton}
                            onPress={() => handleUnpublish(item.id)}
                        >
                            <Text style={styles.unpublishButtonText}>Unpublish</Text>
                        </TouchableOpacity>
                    )}
                    {item.status !== "inactive" && (
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
    };

    if (businessLoading || !businessId) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.emptyText}>Loading business information...</Text>
            </View>
        );
    }

    if (loading && activities.length === 0) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Activities</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => router.push("/(business)/activities/detail")}
                >
                    <Text style={styles.createButtonText}>+ Create</Text>
                </TouchableOpacity>
            </View>

            {/* Filter tabs */}
            <View style={styles.filterTabs}>
                {(["all", "draft", "published", "inactive"] as FilterStatus[]).map((status) => (
                    <TouchableOpacity
                        key={status}
                        style={[styles.filterTab, filterStatus === status && styles.filterTabActive]}
                        onPress={() => setFilterStatus(status)}
                    >
                        <Text
                            style={[
                                styles.filterTabText,
                                filterStatus === status && styles.filterTabTextActive,
                            ]}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {error && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={loadActivities}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={activities}
                renderItem={renderActivity}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No activities.</Text>
                        <Text style={styles.emptySubtext}>Create your first activity to get started.</Text>
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
    filterTabs: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    filterTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: "#f0f0f0",
    },
    filterTabActive: {
        backgroundColor: "#007AFF",
    },
    filterTabText: {
        fontSize: 14,
        color: "#666",
    },
    filterTabTextActive: {
        color: "#fff",
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
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    activityTitle: {
        fontSize: 18,
        fontWeight: "600",
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    publishedBadge: {
        backgroundColor: "#4CAF50",
    },
    readyBadge: {
        backgroundColor: "#2196F3",
    },
    warningBadge: {
        backgroundColor: "#FF9800",
    },
    draftBadge: {
        backgroundColor: "#9E9E9E",
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
    warningText: {
        fontSize: 12,
        color: "#FF9800",
        marginTop: 4,
        fontStyle: "italic",
    },
    actions: {
        flexDirection: "row",
        marginTop: 12,
        gap: 8,
        flexWrap: "wrap",
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
    publishButton: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    publishButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
    unpublishButton: {
        backgroundColor: "#FF9800",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    unpublishButtonText: {
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
    disabledButton: {
        backgroundColor: "#ccc",
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
