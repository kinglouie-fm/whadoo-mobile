import { SwipeCard } from "@/src/components/SwipeCard";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { advanceCard, fetchGroupedCards, recordSwipe, resetFeed } from "@/src/store/slices/grouped-card-slice";
import { theme } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions, Pressable, StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Swiper from "react-native-deck-swiper";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

export default function DiscoverySwipeScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const dispatch = useAppDispatch();
    const { groups, currentIndex, loading, error, hasMore, nextCursor } = useAppSelector((state) => state.groupedCards);
    const [cityFilter, setCityFilter] = useState("");
    const swiperRef = useRef<any>(null);

    useEffect(() => {
        loadCards();
    }, [cityFilter]);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Discover",
            headerLeft: () => null,
            headerRight: () => (
                <View style={styles.headerRight}>

                    <Pressable
                        style={styles.headerIconBtn}
                    >
                        <Ionicons
                            name={"ellipsis-horizontal"}
                            size={22}
                            color={theme.colors.text}
                        />
                    </Pressable>
                </View>
            ),
        });
    }, [navigation]);

    const loadCards = async () => {
        dispatch(resetFeed());
        try {
            await dispatch(fetchGroupedCards({ city: cityFilter || undefined })).unwrap();
        } catch (err) {
            console.error("Failed to load grouped cards:", err);
        }
    };

    const loadMore = async () => {
        if (!hasMore || loading || !nextCursor) return;
        try {
            await dispatch(fetchGroupedCards({ city: cityFilter || undefined, cursor: nextCursor })).unwrap();
        } catch (err) {
            console.error("Failed to load more cards:", err);
        }
    };

    const handleSwipeLeft = (cardIndex: number) => {
        const card = groups[cardIndex];
        if (card) {
            dispatch(recordSwipe({
                direction: "left",
                catalogGroupId: card.catalogGroupId,
                activityId: card.representativeActivityId,
                city: card.city,
                typeId: card.typeId,
            }));
        }
        dispatch(advanceCard());
        checkLoadMore(cardIndex);
    };

    const handleSwipeRight = (cardIndex: number) => {
        const card = groups[cardIndex];
        if (card) {
            dispatch(recordSwipe({
                direction: "right",
                catalogGroupId: card.catalogGroupId,
                activityId: card.representativeActivityId,
                city: card.city,
                typeId: card.typeId,
            }));
            // Navigate to detail screen
            router.push({
                pathname: "/(consumer)/activity-detail",
                params: { activityId: card.representativeActivityId },
            });
        }
        dispatch(advanceCard());
        checkLoadMore(cardIndex);
    };

    const handleSwipeTop = (cardIndex: number) => {
        const card = groups[cardIndex];
        if (card) {
            dispatch(recordSwipe({
                direction: "up",
                catalogGroupId: card.catalogGroupId,
                activityId: card.representativeActivityId,
                city: card.city,
                typeId: card.typeId,
            }));
            // Navigate to detail screen
            router.push({
                pathname: "/(consumer)/activity-detail",
                params: { activityId: card.representativeActivityId },
            });
        }
        dispatch(advanceCard());
        checkLoadMore(cardIndex);
    };

    const handleSwipeBottom = (cardIndex: number) => {
        const card = groups[cardIndex];
        if (card) {
            dispatch(recordSwipe({
                direction: "down",
                catalogGroupId: card.catalogGroupId,
                activityId: card.representativeActivityId,
                city: card.city,
                typeId: card.typeId,
            }));
            // TODO: Add to saved list
            alert("Saved to favorites!");
        }
        dispatch(advanceCard());
        checkLoadMore(cardIndex);
    };

    const checkLoadMore = (cardIndex: number) => {
        // Load more when we're 3 cards away from the end
        if (cardIndex >= groups.length - 3) {
            loadMore();
        }
    };

    if (loading && groups.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                    <Text style={styles.loadingText}>Loading activities...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error && groups.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load activities</Text>
                    <Text style={styles.errorSubtext}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadCards}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (groups.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No activities found</Text>
                    <Text style={styles.emptySubtext}>
                        {cityFilter
                            ? "Try a different city or clear the filter."
                            : "Check back later for new activities!"}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>

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

            <View style={styles.swipeContainer}>
                <Swiper
                    ref={swiperRef}
                    cards={groups}
                    renderCard={(card) => (card ? <SwipeCard card={card} /> : <View />)}
                    onSwipedLeft={handleSwipeLeft}
                    onSwipedRight={handleSwipeRight}
                    onSwipedTop={handleSwipeTop}
                    onSwipedBottom={handleSwipeBottom}
                    cardIndex={currentIndex}
                    backgroundColor="transparent"
                    stackSize={3}
                    stackSeparation={15}
                    overlayLabels={{
                        left: {
                            title: "SKIP",
                            style: {
                                label: {
                                    backgroundColor: "#FF6B6B",
                                    color: "white",
                                    fontSize: 24,
                                    fontWeight: "800",
                                    padding: 10,
                                    borderRadius: 12,
                                },
                                wrapper: {
                                    flexDirection: "column",
                                    alignItems: "flex-end",
                                    justifyContent: "flex-start",
                                    marginTop: 30,
                                    marginLeft: -30,
                                },
                            },
                        },
                        right: {
                            title: "BOOK",
                            style: {
                                label: {
                                    backgroundColor: theme.colors.accent,
                                    color: "white",
                                    fontSize: 24,
                                    fontWeight: "800",
                                    padding: 10,
                                    borderRadius: 12,
                                },
                                wrapper: {
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    justifyContent: "flex-start",
                                    marginTop: 30,
                                    marginLeft: 30,
                                },
                            },
                        },
                        top: {
                            title: "DETAILS",
                            style: {
                                label: {
                                    backgroundColor: "#4ECDC4",
                                    color: "white",
                                    fontSize: 24,
                                    fontWeight: "800",
                                    padding: 10,
                                    borderRadius: 12,
                                },
                                wrapper: {
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                },
                            },
                        },
                        bottom: {
                            title: "SAVE",
                            style: {
                                label: {
                                    backgroundColor: "#FFD700",
                                    color: "white",
                                    fontSize: 24,
                                    fontWeight: "800",
                                    padding: 10,
                                    borderRadius: 12,
                                },
                                wrapper: {
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                },
                            },
                        },
                    }}
                    animateOverlayLabelsOpacity
                    animateCardOpacity
                    verticalSwipe
                    horizontalSwipe
                    disableBottomSwipe={false}
                    disableTopSwipe={false}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: theme.colors.text,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 0
    },
    searchInput: {
        flex: 1,
        height: 40,
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        paddingHorizontal: 16,
        fontSize: 15,
        color: theme.colors.text,
    },
    clearButton: {
        marginLeft: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.card,
        alignItems: "center",
        justifyContent: "center",
    },
    clearButtonText: {
        fontSize: 18,
        color: theme.colors.muted,
    },
    swipeContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: "600",
        color: theme.colors.muted,
    },
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        fontWeight: "700",
        color: theme.colors.danger,
        marginBottom: 8,
    },
    errorSubtext: {
        fontSize: 14,
        color: theme.colors.muted,
        textAlign: "center",
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: theme.colors.bg,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: "700",
        color: theme.colors.text,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 15,
        color: theme.colors.muted,
        textAlign: "center",
    },
    headerRight: { flexDirection: "row", gap: theme.spacing.sm, marginRight: theme.spacing.md },
    headerIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.surface,
    },
});
