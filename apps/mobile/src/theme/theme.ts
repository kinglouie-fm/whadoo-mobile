export const theme = {
  colors: {
    bg: "#1F1F1F",
    surface: "#232323",
    text: "#FFFFFF",
    muted: "#9B9B9B",
    card: "#1C1C1C",
    divider: "#2A2A2A",
    accent: "#CDFF49",
    danger: "#FF4D4D",
    avatarFallback: "#DDDDDD",

    // buttons
    buttonTextOnAccent: "#111111",

    // tab bar
    tabBarBg: "#1A1A1A",
    tabIconInactive: "#9A9A9A",
    tabIconActive: "#111111",
  },
  radius: {
    md: 12,
    lg: 16,
    xl: 24,
  },
  spacing: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  fonts: {
    regular: "Roboto_400Regular",
    medium: "Roboto_500Medium",
    bold: "Roboto_700Bold",
  },
  typography: {
    h1: { fontSize: 28, fontWeight: "800" as const },
    h2: { fontSize: 24, fontWeight: "800" as const },
    h3: { fontSize: 20, fontWeight: "800" as const },
    h4: { fontSize: 18, fontWeight: "700" as const },
    body: { fontSize: 16, fontWeight: "600" as const },
    bodyLarge: { fontSize: 16, fontWeight: "700" as const },
    caption: { fontSize: 14, fontWeight: "600" as const },
    captionSmall: { fontSize: 12, fontWeight: "600" as const },
    label: { fontSize: 12, fontWeight: "800" as const, textTransform: "uppercase" as const },
    button: { fontSize: 18, fontWeight: "800" as const },
    price: { fontSize: 24, fontWeight: "800" as const },
  },
} as const;
