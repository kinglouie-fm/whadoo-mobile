import { StyleSheet } from "react-native";
import { theme } from "./theme";

export const typography = StyleSheet.create({
  h1: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  h2: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  h3: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  h4: {
    ...theme.typography.h4,
    color: theme.colors.text,
  },
  body: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  bodyMuted: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  caption: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  captionMuted: {
    ...theme.typography.caption,
    color: theme.colors.muted,
  },
  captionSmall: {
    ...theme.typography.captionSmall,
    color: theme.colors.muted,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.muted,
  },
  price: {
    ...theme.typography.price,
    color: theme.colors.accent,
  },
});
