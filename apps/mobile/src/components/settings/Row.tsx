import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";

export function Row({
    title,
    right,
    subtitle,
    onPress,
}: {
    title: string;
    right?: string;
    subtitle?: string;
    onPress?: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={[styles.container, { opacity: onPress ? 1 : 0.7 }]}
        >
            <View style={ui.rowBetween}>
                <Text style={typography.body}>{title}</Text>
                {right && <Text style={typography.bodyMuted}>{right}</Text>}
            </View>

            {subtitle && <Text style={[typography.captionMuted, styles.subtitle]}>{subtitle}</Text>}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    subtitle: {
        marginTop: 6,
    },
});
