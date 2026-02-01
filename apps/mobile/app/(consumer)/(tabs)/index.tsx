import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { Activity, fetchPublishedActivities } from "@/src/store/slices/activity-slice";
import { fetchTypeDefinitions } from "@/src/store/slices/activity-type-slice";
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
import { SafeAreaView } from "react-native-safe-area-context";

export default function DiscoveryScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { publishedActivities, loading, error } = useAppSelector((state) => state.activities);
    const { typeDefinitions } = useAppSelector((state) => state.activityTypes);
    const [refreshing, setRefreshing] = useState(false);
    const [cityFilter, setCityFilter] = useState("");

    // Load type definitions for display names
    useEffect(() => {
        dispatch(fetchTypeDefinitions());
    }, []);

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

    const getTypeDisplayName = (typeId: string): string => {
        const typeDef = typeDefinitions.find((t) => t.typeId === typeId);
        return typeDef?.displayName || typeId;
    };

    const getConfigFieldLabel = (typeId: string, fieldName: string): string => {
        const typeDef = typeDefinitions.find((t) => t.typeId === typeId);
        const field = typeDef?.configSchema.fields.find((f) => f.name === fieldName);
        return field?.label || fieldName;
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
                <Text style={styles.activityType}>{getTypeDisplayName(item.typeId)}</Text>
                {item.description && (
                    <Text style={styles.activityDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
                <View style={styles.activityMeta}>
                    {item.city && <Text style={styles.metaText}>📍 {item.city}</Text>}
                    {item.priceFrom && <Text style={styles.metaText}>💰 From ${item.priceFrom}</Text>}
                </View>
                {/* Display key config fields with proper labels */}
                {item.config && Object.keys(item.config).length > 0 && (
                    <View style={styles.configSection}>
                        {Object.entries(item.config).slice(0, 3).map(([key, value]) => {
                            if (value === null || value === undefined) return null;

                            // Skip arrays and objects (like packages array)
                            if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
                                // Special handling for packages
                                if (key === "packages" && Array.isArray(value)) {
                                    const packageCount = value.length;
                                    const defaultPackage = value.find((pkg: any) => pkg.is_default) || value[0];
                                    return (
                                        <Text key={key} style={styles.configText}>
                                            Packages: {packageCount} available
                                            {defaultPackage?.title && ` (${defaultPackage.title})`}
                                        </Text>
                                    );
                                }
                                return null; // Skip other objects/arrays
                            }

                            const label = getConfigFieldLabel(item.typeId, key);
                            return (
                                <Text key={key} style={styles.configText}>
                                    {label}: {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                                </Text>
                            );
                        })}
                    </View>
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
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
        </SafeAreaView>
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
    configSection: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
    },
    configText: {
        fontSize: 12,
        color: "#666",
        marginTop: 2,
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
