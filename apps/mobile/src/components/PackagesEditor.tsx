import { FormInput, TextArea } from "@/src/components/Input";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton, SecondaryButton } from "./Button";

interface Package {
  code: string;
  title: string;
  track_type?: "indoor" | "outdoor";
  description?: string;
  format_lines?: string;
  base_price?: number;
  currency?: string;
  pricing_type?: "per_person" | "fixed";
  min_participants?: number;
  max_participants?: number;
  age_min?: number;
  age_max?: number;
  is_default?: boolean;
  sort_order?: number;
  schedule_note?: string;
  request_only?: boolean;
  player_count?: string;
  includes_wine?: boolean;
  includes_extras?: boolean;
  difficulty_level?: string;
}

interface PackagesEditorProps {
  packages: Package[];
  onChange: (packages: Package[]) => void;
}

export const PackagesEditor: React.FC<PackagesEditorProps> = ({
  packages,
  onChange,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  const insets = useSafeAreaInsets();

  const handleAdd = () => {
    const newPackage: Package = {
      code: "",
      title: "",
      is_default: packages.length === 0,
      sort_order: packages.length,
    };
    setEditingPackage(newPackage);
    setEditingIndex(null);
    setModalVisible(true);
  };

  const handleEdit = (index: number) => {
    setEditingPackage({ ...packages[index] });
    setEditingIndex(index);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!editingPackage) return;

    if (!editingPackage.code?.trim()) {
      Alert.alert("Validation Error", "Package code is required");
      return;
    }
    if (!editingPackage.title?.trim()) {
      Alert.alert("Validation Error", "Package title is required");
      return;
    }

    const normalizedCode = editingPackage.code.toLowerCase().trim();
    const isDuplicate = packages.some(
      (pkg, idx) =>
        idx !== editingIndex &&
        pkg.code.toLowerCase().trim() === normalizedCode,
    );
    if (isDuplicate) {
      Alert.alert("Validation Error", "Package code must be unique");
      return;
    }

    let updatedPackages: Package[];
    if (editingIndex !== null) {
      updatedPackages = [...packages];
      updatedPackages[editingIndex] = editingPackage;
    } else {
      updatedPackages = [...packages, editingPackage];
    }

    if (editingPackage.is_default) {
      updatedPackages = updatedPackages.map((pkg, idx) => ({
        ...pkg,
        is_default: idx === (editingIndex ?? packages.length),
      }));
    }

    onChange(updatedPackages);
    setModalVisible(false);
    setEditingPackage(null);
    setEditingIndex(null);
  };

  const handleRemove = (index: number) => {
    Alert.alert(
      "Remove Package",
      "Are you sure you want to remove this package?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const updatedPackages = packages.filter((_, idx) => idx !== index);
            onChange(updatedPackages);
          },
        },
      ],
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updatedPackages = [...packages];
    [updatedPackages[index - 1], updatedPackages[index]] = [
      updatedPackages[index],
      updatedPackages[index - 1],
    ];
    updatedPackages.forEach((pkg, idx) => (pkg.sort_order = idx));
    onChange(updatedPackages);
  };

  const handleMoveDown = (index: number) => {
    if (index === packages.length - 1) return;
    const updatedPackages = [...packages];
    [updatedPackages[index], updatedPackages[index + 1]] = [
      updatedPackages[index + 1],
      updatedPackages[index],
    ];
    updatedPackages.forEach((pkg, idx) => (pkg.sort_order = idx));
    onChange(updatedPackages);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.label}>Packages / Formulas</Text>
        <SecondaryButton
          title="+ Add Package"
          style={styles.headerButton}
          onPress={handleAdd}
        />
      </View>

      {packages.length === 0 ? (
        <Text style={[typography.bodyMuted, styles.emptyText]}>
          No packages defined. Add at least one package to publish.
        </Text>
      ) : (
        <ScrollView style={styles.packagesList}>
          {packages.map((pkg, index) => (
            <View key={index} style={styles.packageCard}>
              <View style={styles.packageHeader}>
                <View style={styles.packageInfo}>
                  <Text style={typography.body} numberOfLines={1}>
                    {pkg.title}
                    {pkg.is_default && (
                      <Text style={styles.defaultBadge}> (Default)</Text>
                    )}
                  </Text>
                  <Text style={typography.captionSmall}>Code: {pkg.code}</Text>
                  {pkg.track_type && (
                    <Text style={typography.caption}>
                      {pkg.track_type === "indoor" ? "🏢 Indoor" : "🌳 Outdoor"}
                    </Text>
                  )}
                </View>

                <View style={styles.packageActions}>
                  <TouchableOpacity
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                    style={[
                      styles.actionButton,
                      index === 0 && styles.actionButtonDisabled,
                    ]}
                  >
                    <Text style={styles.actionButtonText}>↑</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleMoveDown(index)}
                    disabled={index === packages.length - 1}
                    style={[
                      styles.actionButton,
                      index === packages.length - 1 &&
                        styles.actionButtonDisabled,
                    ]}
                  >
                    <Text style={styles.actionButtonText}>↓</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleEdit(index)}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleRemove(index)}
                    style={[styles.actionButton, styles.removeButton]}
                  >
                    <Text style={[styles.actionButtonText, { color: "#fff" }]}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {pkg.description && (
                <Text style={[typography.body, styles.packageDescription]}>
                  {pkg.description}
                </Text>
              )}
              {pkg.base_price != null && (
                <Text style={[typography.body, styles.packagePrice]}>
                  Price: {pkg.currency || "EUR"} {pkg.base_price}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
          <View
            style={[
              styles.modalHeaderBar,
              {
                paddingTop: insets.top + theme.spacing.md,
                paddingBottom: theme.spacing.md,
              },
            ]}
          >
            <SecondaryButton
              title="Cancel"
              onPress={() => setModalVisible(false)}
              style={styles.headerButton}
            />
            <Text style={[typography.h4, styles.headerTitle]}>
              {editingIndex !== null ? "Edit Package" : "Add Package"}
            </Text>
            <PrimaryButton
              title="Save"
              onPress={handleSave}
              style={styles.headerButton}
            />
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={[
              styles.modalScrollContent,
              { paddingBottom: 40 + insets.bottom },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FormInput
              label="Package Code *"
              value={editingPackage?.code || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({ ...prev!, code: text }))
              }
              placeholder="e.g., standard, mini-gp, grand-gp"
            />

            <FormInput
              label="Package Title *"
              value={editingPackage?.title || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({ ...prev!, title: text }))
              }
              placeholder="e.g., Standard Session, Mini GP"
            />

            <View>
              <Text
                style={[typography.label, { marginBottom: theme.spacing.sm }]}
              >
                Track Type <Text style={{ color: theme.colors.danger }}>*</Text>
              </Text>
              <View style={styles.trackTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.trackTypeOption,
                    editingPackage?.track_type === "indoor" &&
                      styles.trackTypeOptionSelected,
                  ]}
                  onPress={() =>
                    setEditingPackage((prev) => ({
                      ...prev!,
                      track_type: "indoor",
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.trackTypeText,
                      editingPackage?.track_type === "indoor" &&
                        styles.trackTypeTextSelected,
                    ]}
                  >
                    Indoor
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.trackTypeOption,
                    editingPackage?.track_type === "outdoor" &&
                      styles.trackTypeOptionSelected,
                  ]}
                  onPress={() =>
                    setEditingPackage((prev) => ({
                      ...prev!,
                      track_type: "outdoor",
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.trackTypeText,
                      editingPackage?.track_type === "outdoor" &&
                        styles.trackTypeTextSelected,
                    ]}
                  >
                    Outdoor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextArea
              label="Description"
              value={editingPackage?.description || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({ ...prev!, description: text }))
              }
              placeholder="Describe this package..."
              numberOfLines={3}
            />

            <TextArea
              label="Format Details (one per line)"
              value={editingPackage?.format_lines || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({
                  ...prev!,
                  format_lines: text,
                }))
              }
              placeholder={"e.g., 8 min qualifying\n16 min race"}
              numberOfLines={4}
            />

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <FormInput
                  label="Base Price"
                  value={editingPackage?.base_price?.toString() || ""}
                  onChangeText={(text) =>
                    setEditingPackage((prev) => ({
                      ...prev!,
                      base_price: text ? parseFloat(text) : undefined,
                    }))
                  }
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroupHalf}>
                <FormInput
                  label="Currency"
                  value={editingPackage?.currency || ""}
                  onChangeText={(text) =>
                    setEditingPackage((prev) => ({ ...prev!, currency: text }))
                  }
                  placeholder="EUR"
                />
              </View>
            </View>

            <View>
              <Text
                style={[typography.label, { marginBottom: theme.spacing.sm }]}
              >
                Pricing Model{" "}
                <Text style={{ color: theme.colors.danger }}>*</Text>
              </Text>
              <View style={styles.trackTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.trackTypeOption,
                    (editingPackage?.pricing_type || "per_person") ===
                      "per_person" && styles.trackTypeOptionSelected,
                  ]}
                  onPress={() =>
                    setEditingPackage((prev) => ({
                      ...prev!,
                      pricing_type: "per_person",
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.trackTypeText,
                      (editingPackage?.pricing_type || "per_person") ===
                        "per_person" && styles.trackTypeTextSelected,
                    ]}
                  >
                    Per Person
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.trackTypeOption,
                    editingPackage?.pricing_type === "fixed" &&
                      styles.trackTypeOptionSelected,
                  ]}
                  onPress={() =>
                    setEditingPackage((prev) => ({
                      ...prev!,
                      pricing_type: "fixed",
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.trackTypeText,
                      editingPackage?.pricing_type === "fixed" &&
                        styles.trackTypeTextSelected,
                    ]}
                  >
                    Fixed (Group Rate)
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.fieldHint}>
                {(editingPackage?.pricing_type || "per_person") === "per_person"
                  ? "Price multiplied by number of participants"
                  : "Fixed price regardless of participant count"}
              </Text>
            </View>

            <FormInput
              label="Minimum Participants"
              value={editingPackage?.min_participants?.toString() || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({
                  ...prev!,
                  min_participants: text ? parseInt(text) : undefined,
                }))
              }
              placeholder="e.g., 5"
              keyboardType="number-pad"
            />

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <FormInput
                  label="Minimum Age"
                  value={editingPackage?.age_min?.toString() || ""}
                  onChangeText={(text) =>
                    setEditingPackage((prev) => ({
                      ...prev!,
                      age_min: text ? parseInt(text) : undefined,
                    }))
                  }
                  placeholder="e.g., 8"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.formGroupHalf}>
                <FormInput
                  label="Maximum Age"
                  value={editingPackage?.age_max?.toString() || ""}
                  onChangeText={(text) =>
                    setEditingPackage((prev) => ({
                      ...prev!,
                      age_max: text ? parseInt(text) : undefined,
                    }))
                  }
                  placeholder="e.g., 12"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <FormInput
              label="Schedule Note"
              value={editingPackage?.schedule_note || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({
                  ...prev!,
                  schedule_note: text,
                }))
              }
              placeholder="e.g., First Wednesday of month at 17:15"
            />

            <View>
              <View style={styles.switchRow}>
                <Text style={typography.label}>Default Package</Text>
                <Switch
                  value={editingPackage?.is_default || false}
                  onValueChange={(value) =>
                    setEditingPackage((prev) => ({
                      ...prev!,
                      is_default: value,
                    }))
                  }
                  trackColor={{
                    false: "rgba(255,255,255,0.18)",
                    true: theme.colors.accent,
                  }}
                  thumbColor={"#fff"}
                />
              </View>
            </View>

            <View>
              <View style={styles.switchRow}>
                <Text style={typography.label}>
                  Request Only (not bookable online)
                </Text>
                <Switch
                  value={editingPackage?.request_only || false}
                  onValueChange={(value) =>
                    setEditingPackage((prev) => ({
                      ...prev!,
                      request_only: value,
                    }))
                  }
                  trackColor={{
                    false: "rgba(255,255,255,0.18)",
                    true: theme.colors.accent,
                  }}
                  thumbColor={"#fff"}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.lg,
  },

  header: {
    ...ui.rowBetween,
    marginBottom: theme.spacing.md,
  },
  headerButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minWidth: 70,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center" as const,
  },

  emptyText: {
    textAlign: "center",
    paddingVertical: theme.spacing.lg,
  },
  packagesList: {
    maxHeight: 420,
  },

  packageCard: {
    ...ui.card,
    marginBottom: theme.spacing.md,
  },

  packageHeader: {
    ...ui.rowBetween,
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  packageInfo: {
    flex: 1,
    minWidth: 0,
  },

  defaultBadge: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "900",
  },

  packageDescription: {
    marginTop: theme.spacing.sm,
  },
  packagePrice: {
    marginTop: theme.spacing.sm,
    fontWeight: "900",
  },

  packageActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    maxWidth: 180,
  },

  actionButton: {
    height: 30,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonText: {
    ...typography.captionSmall,
    fontWeight: "900",
  },

  removeButton: {
    backgroundColor: theme.colors.danger,
  },

  modalHeaderBar: {
    ...ui.rowBetween,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  modalScroll: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  modalScrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },

  formRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  formGroupHalf: {
    flex: 1,
  },

  switchRow: {
    ...ui.rowBetween,
    gap: theme.spacing.md,
  },

  trackTypeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  trackTypeOption: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
  },
  trackTypeOptionSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  trackTypeText: {
    ...typography.caption,
    fontWeight: "900",
  },
  trackTypeTextSelected: {
    color: "#0B0B0B",
  },
  fieldHint: {
    ...typography.captionSmall,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
});
