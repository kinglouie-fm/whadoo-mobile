import { theme } from "@/src/theme/theme";
import React, { useState } from "react";
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
  min_participants?: number;
  age_min?: number;
  age_max?: number;
  is_default?: boolean;
  sort_order?: number;
  schedule_note?: string;
  request_only?: boolean;
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

    // Validate required fields
    if (!editingPackage.code?.trim()) {
      Alert.alert("Validation Error", "Package code is required");
      return;
    }
    if (!editingPackage.title?.trim()) {
      Alert.alert("Validation Error", "Package title is required");
      return;
    }
    if (!editingPackage.track_type) {
      Alert.alert("Validation Error", "Track type is required");
      return;
    }

    // Check for duplicate codes
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
      // Update existing
      updatedPackages = [...packages];
      updatedPackages[editingIndex] = editingPackage;
    } else {
      // Add new
      updatedPackages = [...packages, editingPackage];
    }

    // If this package is set as default, unset others
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
    // Update sort_order
    updatedPackages.forEach((pkg, idx) => {
      pkg.sort_order = idx;
    });
    onChange(updatedPackages);
  };

  const handleMoveDown = (index: number) => {
    if (index === packages.length - 1) return;
    const updatedPackages = [...packages];
    [updatedPackages[index], updatedPackages[index + 1]] = [
      updatedPackages[index + 1],
      updatedPackages[index],
    ];
    // Update sort_order
    updatedPackages.forEach((pkg, idx) => {
      pkg.sort_order = idx;
    });
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
                  <Text style={styles.packageTitle}>
                    {pkg.title}
                    {pkg.is_default && (
                      <Text style={styles.defaultBadge}> (Default)</Text>
                    )}
                  </Text>
                  <Text style={styles.packageCode}>Code: {pkg.code}</Text>
                  {pkg.track_type && (
                    <Text style={styles.packageTrackType}>
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
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {pkg.description && (
                <Text style={styles.packageDescription}>{pkg.description}</Text>
              )}
              {pkg.base_price && (
                <Text style={styles.packagePrice}>
                  Price: {pkg.currency || "EUR"} {pkg.base_price}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Edit/Add Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView style={styles.modalContainer}>
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
              style={styles.input}
              value={editingPackage?.code || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({ ...prev!, code: text }))
              }
              placeholder="e.g., standard, mini-gp, grand-gp"
              placeholderTextColor={theme.colors.muted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Package Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={editingPackage?.title || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({ ...prev!, title: text }))
              }
              placeholder="e.g., Standard Session, Mini GP"
              placeholderTextColor={theme.colors.muted}
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
              style={[styles.input, styles.textArea]}
              value={editingPackage?.description || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({ ...prev!, description: text }))
              }
              placeholder="Describe this package..."
              placeholderTextColor={theme.colors.muted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Format Details (one per line)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editingPackage?.format_lines || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({ ...prev!, format_lines: text }))
              }
              placeholder="e.g., 8 min qualifying&#10;16 min race"
              placeholderTextColor={theme.colors.muted}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Base Price</Text>
              <TextInput
                style={styles.input}
                value={editingPackage?.base_price?.toString() || ""}
                onChangeText={(text) =>
                  setEditingPackage((prev) => ({
                    ...prev!,
                    base_price: text ? parseFloat(text) : undefined,
                  }))
                }
                placeholder="0.00"
                placeholderTextColor={theme.colors.muted}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Currency</Text>
              <TextInput
                style={styles.input}
                value={editingPackage?.currency || ""}
                onChangeText={(text) =>
                  setEditingPackage((prev) => ({ ...prev!, currency: text }))
                }
                placeholder="EUR"
                placeholderTextColor={theme.colors.muted}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Minimum Participants</Text>
            <TextInput
              style={styles.input}
              value={editingPackage?.min_participants?.toString() || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({
                  ...prev!,
                  min_participants: text ? parseInt(text) : undefined,
                }))
              }
              placeholder="e.g., 5 karts minimum"
              placeholderTextColor={theme.colors.muted}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Minimum Age</Text>
              <TextInput
                style={styles.input}
                value={editingPackage?.age_min?.toString() || ""}
                onChangeText={(text) =>
                  setEditingPackage((prev) => ({
                    ...prev!,
                    age_min: text ? parseInt(text) : undefined,
                  }))
                }
                placeholder="e.g., 8"
                placeholderTextColor={theme.colors.muted}
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.formGroup, styles.formGroupHalf]}>
              <Text style={styles.label}>Maximum Age</Text>
              <TextInput
                style={styles.input}
                value={editingPackage?.age_max?.toString() || ""}
                onChangeText={(text) =>
                  setEditingPackage((prev) => ({
                    ...prev!,
                    age_max: text ? parseInt(text) : undefined,
                  }))
                }
                placeholder="e.g., 12"
                placeholderTextColor={theme.colors.muted}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Schedule Note</Text>
            <TextInput
              style={styles.input}
              value={editingPackage?.schedule_note || ""}
              onChangeText={(text) =>
                setEditingPackage((prev) => ({ ...prev!, schedule_note: text }))
              }
              placeholder="e.g., First Wednesday of month at 17:15"
              placeholderTextColor={theme.colors.muted}
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
  container: {
    marginVertical: theme.spacing.lg,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.text,
  },

  addButton: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 13,
  },

  emptyText: {
    color: theme.colors.muted,
    textAlign: "center",
    paddingVertical: 18,
    fontWeight: "600",
  },

  packagesList: {
    maxHeight: 420,
  },

  packageCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  packageInfo: {
    flex: 1,
    minWidth: 0,
  },
  packageTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 4,
  },
  defaultBadge: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  packageCode: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: "600",
  },
  packageTrackType: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 4,
    fontWeight: "700",
  },
  packageDescription: {
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 10,
    fontWeight: "500",
  },
  packagePrice: {
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 8,
    fontWeight: "800",
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
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "800",
  },

  removeButton: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  // Modal
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
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  closeButton: {
    fontSize: 22,
    color: theme.colors.muted,
    fontWeight: "800",
  },

  formGroup: {
    marginBottom: 14,
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
  },
  formGroupHalf: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    color: theme.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  required: {
    color: theme.colors.danger,
    fontWeight: "900",
  },

  input: {
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },

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
  cancelButton: {
    backgroundColor: "#2A2A2A",
  },
  saveButton: {
    backgroundColor: theme.colors.accent,
  },
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },

  trackTypeRow: {
    flexDirection: "row",
    gap: 10,
  },
  trackTypeOption: {
    flex: 1,
    paddingVertical: 12,
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
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.text,
  },
  trackTypeTextSelected: {
    color: theme.colors.bg,
  },
});
