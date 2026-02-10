import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import React, { ReactNode } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  noBorder?: boolean;
}

interface DetailCardProps {
  label: string;
  value: string | ReactNode;
  style?: ViewStyle;
}

interface PriceItem {
  label: string;
  value: string;
}

interface PriceSummaryCardProps {
  items: PriceItem[];
  total: string;
  currency?: string;
  style?: ViewStyle;
}

export function Card({ children, style, noBorder }: CardProps) {
  return (
    <View style={[noBorder ? ui.cardNoBorder : ui.card, style]}>
      {children}
    </View>
  );
}

export function DetailCard({ label, value, style }: DetailCardProps) {
  return (
    <View style={[styles.detailRow, style]}>
      <Text style={styles.detailLabel}>{label}</Text>
      {typeof value === "string" ? (
        <Text style={styles.detailValue}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

export function PriceSummaryCard({
  items,
  total,
  currency = "EUR",
  style,
}: PriceSummaryCardProps) {
  return (
    <Card style={style}>
      {items.map((item, index) => (
        <View key={index} style={styles.priceRow}>
          <Text style={styles.priceLabel}>{item.label}</Text>
          <Text style={styles.priceValue}>{item.value}</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>
          {currency === "EUR" ? "€" : "$"}
          {total}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  detailLabel: {
    ...typography.body,
    color: theme.colors.muted,
  },
  detailValue: {
    ...typography.body,
    color: theme.colors.text,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    ...typography.body,
    color: theme.colors.muted,
  },
  priceValue: {
    ...typography.body,
    color: theme.colors.text,
  },
  totalRow: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    ...typography.h4,
    color: theme.colors.text,
  },
  totalValue: {
    ...typography.price,
    color: theme.colors.accent,
  },
});
