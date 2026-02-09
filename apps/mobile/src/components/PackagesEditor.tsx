import { theme } from "@/src/theme/theme";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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

const stylesVars = {
  cardBg: "rgba(255,255,255,0.08)",
  inputBg: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  subText: "rgba(255,255,255,0.78)",
  subText2: "rgba(255,255,255,0.62)",
};

export const PackagesEditor: React.FC<PackagesEditorProps> = ({
  packages,
  onChange,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  const inputProps = useMemo(
    () => ({
      underlineColorAndroid: "transparent" as const, // ✅ remove Android blue underline
      selectionColor: theme.colors.accent,
      cursorColor: theme.colors.accent,
      placeholderTextColor: stylesVars.subText2,
      keyboardAppearance: "dark" as const,
    }),
    [],
  );

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
        <Text style={styles.headerText}>Packages / Formulas</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>+ Add Package</Text>
        </TouchableOpacity>
      </View>

      {packages.length === 0 ? (
        <Text style={styles.emptyText}>
          No packages defined. Add at least one package to publish.
        </Text>
      ) : (
        <ScrollView style={styles.packagesList}>
          {packages.map((pkg, index) => (
            <View key={index} style={styles.packageCard}>
              <View style={styles.packageHeader}>
                <View style={styles.packageInfo}>
                  <Text style={styles.packageTitle} numberOfLines={1}>
                    {pkg.title}
                    {pkg.is_default ? (
                      <Text style={styles.defaultBadge}> (Default)</Text>
                    ) : null}
                  </Text>
                  <Text style={styles.packageCode}>Code: {pkg.code}</Text>
                  {pkg.track_type ? (
                    <Text style={styles.packageTrackType}>
                      {pkg.track_type === "indoor" ? "🏢 Indoor" : "🌳 Outdoor"}
                    </Text>
                  ) : null}
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
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {pkg.description ? (
                <Text style={styles.packageDescription}>{pkg.description}</Text>
              ) : null}
              {pkg.base_price != null ? (
                <Text style={styles.packagePrice}>
                  Price: {pkg.currency || "EUR"} {pkg.base_price}
                </Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView
          style={styles.modalContainer}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingIndex !== null ? "Edit Package" : "Add Package"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Package Code <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              {...inputProps}
              style={styles.input}
              value={editingPackage?.code || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({ ...prev!, code: text }))
              }
              placeholder="e.g., standard, mini-gp, grand-gp"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Package Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              {...inputProps}
              style={styles.input}
              value={editingPackage?.title || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({ ...prev!, title: text }))
              }
              placeholder="e.g., Standard Session, Mini GP"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Track Type <Text style={styles.required}>*</Text>
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              {...inputProps}
              style={[styles.input, styles.textArea]}
              value={editingPackage?.description || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({ ...prev!, description: text }))
              }
              placeholder="Describe this package..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Format Details (one per line)</Text>
            <TextInput
              {...inputProps}
              style={[styles.input, styles.textArea]}
              value={editingPackage?.format_lines || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({ ...prev!, format_lines: text }))
              }
              placeholder={"e.g., 8 min qualifying\n16 min race"}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Base Price</Text>
              <TextInput
                {...inputProps}
                style={styles.input}
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

            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Currency</Text>
              <TextInput
                {...inputProps}
                style={styles.input}
                value={editingPackage?.currency || ""}
                onChangeText={(text) =>
                  setEditingPackage((prev) => ({ ...prev!, currency: text }))
                }
                placeholder="EUR"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Pricing Model <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.trackTypeRow}>
              <TouchableOpacity
                style={[
                  styles.trackTypeOption,
                  (editingPackage?.pricing_type || "per_person") === "per_person" &&
                    styles.trackTypeOptionSelected,
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
                    (editingPackage?.pricing_type || "per_person") === "per_person" &&
                      styles.trackTypeTextSelected,
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Minimum Participants</Text>
            <TextInput
              {...inputProps}
              style={styles.input}
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
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Minimum Age</Text>
              <TextInput
                {...inputProps}
                style={styles.input}
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

            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Maximum Age</Text>
              <TextInput
                {...inputProps}
                style={styles.input}
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Schedule Note</Text>
            <TextInput
              {...inputProps}
              style={styles.input}
              value={editingPackage?.schedule_note || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({ ...prev!, schedule_note: text }))
              }
              placeholder="e.g., First Wednesday of month at 17:15"
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Default Package</Text>
              <Switch
                value={editingPackage?.is_default || false}
                onValueChange={(value) =>
                  setEditingPackage((prev) => ({ ...prev!, is_default: value }))
                }
                trackColor={{
                  false: "rgba(255,255,255,0.18)",
                  true: theme.colors.accent,
                }}
                thumbColor={"#fff"}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>
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

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: theme.spacing.lg },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "900",
    color: stylesVars.subText2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  addButton: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: stylesVars.cardBg,
    borderWidth: 1,
    borderColor: stylesVars.border,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },

  emptyText: {
    color: stylesVars.subText2,
    textAlign: "center",
    paddingVertical: 18,
    fontWeight: "700",
  },
  packagesList: { maxHeight: 420 },

  packageCard: {
    backgroundColor: stylesVars.cardBg,
    padding: theme.spacing.md,
    borderRadius: 18,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: stylesVars.border,
  },

  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  packageInfo: { flex: 1, minWidth: 0 },

  packageTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 4,
  },
  defaultBadge: { color: theme.colors.accent, fontSize: 12, fontWeight: "900" },

  packageCode: { fontSize: 12, color: stylesVars.subText2, fontWeight: "700" },
  packageTrackType: {
    fontSize: 12,
    color: stylesVars.subText,
    marginTop: 4,
    fontWeight: "800",
  },

  packageDescription: {
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 10,
    fontWeight: "600",
  },
  packagePrice: {
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 8,
    fontWeight: "900",
  },

  packageActions: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    maxWidth: 180,
  },

  actionButton: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: stylesVars.border,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonDisabled: { opacity: 0.4 },
  actionButtonText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "900",
  },

  removeButton: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  removeButtonText: { color: "#fff", fontSize: 12, fontWeight: "900" },

  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingTop: theme.spacing.lg,
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
  closeButton: { fontSize: 22, color: stylesVars.subText2, fontWeight: "900" },

  formGroup: { marginBottom: 14 },
  formRow: { flexDirection: "row", gap: 10 },
  formGroupHalf: { flex: 1 },

  label: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
    color: stylesVars.subText2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  required: { color: theme.colors.danger, fontWeight: "900" },

  input: {
    borderWidth: 1,
    borderColor: stylesVars.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: stylesVars.inputBg,
    color: theme.colors.text,
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: { backgroundColor: "#2A2A2A" },
  saveButton: { backgroundColor: theme.colors.accent },
  buttonText: { color: "#fff", fontSize: 13, fontWeight: "900" },

  trackTypeRow: { flexDirection: "row", gap: 10 },
  trackTypeOption: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: stylesVars.border,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: stylesVars.inputBg,
  },
  trackTypeOptionSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  trackTypeText: { fontSize: 13, fontWeight: "900", color: theme.colors.text },
  trackTypeTextSelected: { color: "#0B0B0B" }, // ✅ readable on accent
  fieldHint: {
    fontSize: 12,
    color: stylesVars.subText2,
    marginTop: 8,
  },
});
