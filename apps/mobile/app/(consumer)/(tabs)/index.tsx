import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { Activity, fetchPublishedActivities } from "@/src/store/slices/activity-slice";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function DiscoveryScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { publishedActivities, loading, error } = useAppSelector((state) => state.activities);
    const [refreshing, setRefreshing] = useState(false);
    const [cityFilter, setCityFilter] = useState("");

    const loadActivities = async () => {
        try {
            await dispatch(fetchPublishedActivities({ city: cityFilter || undefined })).unwrap();
        } catch (err) {
            console.error("Failed to load activities:", err);
        }
    };

    useEffect(() => {
        loadActivities();
    }, [cityFilter]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadActivities();
        setRefreshing(false);
    };

    const renderActivity = ({ item }: { item: Activity }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                // Navigate to activity detail (consumer view)
                // For now, just show alert
                alert(`Activity: ${item.title}\n${item.description || "No description"}`);
            }}
        >
            <View style={styles.cardContent}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activityType}>{item.typeId}</Text>
                {item.description && <Text style={styles.activityDescription} numberOfLines={2}>{item.description}</Text>}
                <View style={styles.activityMeta}>
                    {item.city && <Text style={styles.metaText}>📍 {item.city}</Text>}
                    {item.priceFrom && <Text style={styles.metaText}>💰 From ${item.priceFrom}</Text>}
                </View>
                {item.config?.duration && (
                    <Text style={styles.metaText}>⏱️ {item.config.duration} minutes</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading && publishedActivities.length === 0) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Discover Activities</Text>
            </View>

            {/* Search/Filter Bar */}
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.searchInput}
                    value={cityFilter}
                    onChangeText={setCityFilter}
                    placeholder="Filter by city..."
                    placeholderTextColor="#999"
                />
                {cityFilter !== "" && (
                    <TouchableOpacity onPress={() => setCityFilter("")} style={styles.clearButton}>
                        <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
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
                data={publishedActivities}
                renderItem={renderActivity}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No activities found.</Text>
                        <Text style={styles.emptySubtext}>
                            {cityFilter
                                ? "Try a different city or clear the filter."
                                : "Check back later for new activities!"}
                        </Text>
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
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 20,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    clearButton: {
        marginLeft: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
    },
    clearButtonText: {
        fontSize: 18,
        color: "#666",
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: "#f9f9f9",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardContent: {
        gap: 8,
    },
    activityTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    activityType: {
        fontSize: 14,
        color: "#007AFF",
        fontWeight: "600",
        textTransform: "capitalize",
    },
    activityDescription: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
    },
    activityMeta: {
        flexDirection: "row",
        gap: 16,
        marginTop: 4,
    },
    metaText: {
        fontSize: 13,
        color: "#666",
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
        textAlign: "center",
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
