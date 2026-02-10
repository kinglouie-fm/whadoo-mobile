import React from "react";
import { Pressable, Text, View } from "react-native";

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
            style={{
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: "#333",
                opacity: onPress ? 1 : 0.7,
            }}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{title}</Text>
                {right ? <Text style={{ color: "#aaa" }}>{right}</Text> : null}
            </View>

            {subtitle ? <Text style={{ color: "#777", marginTop: 6 }}>{subtitle}</Text> : null}
        </Pressable>
    );
}
