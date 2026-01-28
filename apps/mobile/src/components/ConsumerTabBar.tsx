import { theme } from "@/src/theme/theme";
import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function iconFor(routeName: string): keyof typeof MaterialIcons.glyphMap {
    switch (routeName) {
        case "index":
            return "home";
        case "saved":
            return "bookmark";
        case "bookings":
            return "calendar-month";
        case "profile":
            return "person";
        default:
            return "circle";
    }
}

export function ConsumerTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={{
                paddingHorizontal: 18,
                paddingTop: 10,
                paddingBottom: insets.bottom + 10,
                backgroundColor: "transparent",
            }}
        >
            <View
                style={{
                    height: 66,
                    borderRadius: 33,
                    backgroundColor: theme.colors.tabBarBg,
                    borderWidth: 1,
                    borderColor: theme.colors.divider,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 14,

                    // light shadow (works iOS; Android uses elevation)
                    shadowColor: "#000",
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 10,
                }}
            >
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;
                    const { options } = descriptors[route.key];

                    const onPress = () => {
                        const event = navigation.emit({
                            type: "tabPress",
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name as never);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: "tabLongPress",
                            target: route.key,
                        });
                    };

                    const iconName = iconFor(route.name);

                    return (
                        <Pressable
                            key={route.key}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarButtonTestID}
                            style={{
                                width: 64,
                                height: 56,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <View
                                style={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: 23,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: isFocused ? theme.colors.accent : "transparent",
                                }}
                            >
                                <MaterialIcons
                                    name={iconName}
                                    size={26}
                                    color={isFocused ? theme.colors.tabIconActive : theme.colors.tabIconInactive}
                                />
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
