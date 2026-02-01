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
                pkg.code.toLowerCase().trim() === normalizedCode
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
            ]
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
                                    setEditingPackage((prev) => ({ ...prev!, track_type: "indoor" }))
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
                                    setEditingPackage((prev) => ({ ...prev!, track_type: "outdoor" }))
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
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>
                            Format Details (one per line)
                        </Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={editingPackage?.format_lines || ""}
                            onChangeText={(text) =>
                                setEditingPackage((prev) => ({ ...prev!, format_lines: text }))
                            }
                            placeholder="e.g., 8 min qualifying&#10;16 min race"
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
                            <Text style={styles.label}>Request Only (not bookable online)</Text>
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
        marginVertical: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    headerText: {
        fontSize: 18,
        fontWeight: "600",
    },
    addButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    emptyText: {
        color: "#666",
        fontStyle: "italic",
        textAlign: "center",
        padding: 20,
    },
    packagesList: {
        maxHeight: 400,
    },
    packageCard: {
        backgroundColor: "#f5f5f5",
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    packageHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    packageInfo: {
        flex: 1,
    },
    packageTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    defaultBadge: {
        color: "#007AFF",
        fontSize: 14,
    },
    packageCode: {
        fontSize: 14,
        color: "#666",
    },
    packageTrackType: {
        fontSize: 14,
        color: "#007AFF",
        marginTop: 2,
    },
    packageDescription: {
        fontSize: 14,
        color: "#333",
        marginTop: 8,
    },
    packagePrice: {
        fontSize: 14,
        color: "#333",
        marginTop: 4,
        fontWeight: "500",
    },
    packageActions: {
        flexDirection: "row",
        gap: 4,
    },
    actionButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    actionButtonDisabled: {
        backgroundColor: "#ccc",
    },
    actionButtonText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    removeButton: {
        backgroundColor: "#FF3B30",
    },
    removeButtonText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        paddingTop: 40,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "700",
    },
    closeButton: {
        fontSize: 28,
        color: "#666",
    },
    formGroup: {
        marginBottom: 16,
    },
    formRow: {
        flexDirection: "row",
        gap: 12,
    },
    formGroupHalf: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 8,
    },
    required: {
        color: "#FF3B30",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    switchRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    modalActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 24,
        marginBottom: 40,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
    },
    cancelButton: {
        backgroundColor: "#666",
    },
    saveButton: {
        backgroundColor: "#007AFF",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    trackTypeRow: {
        flexDirection: "row",
        gap: 12,
    },
    trackTypeOption: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        alignItems: "center",
    },
    trackTypeOptionSelected: {
        backgroundColor: "#007AFF",
        borderColor: "#007AFF",
    },
    trackTypeText: {
        fontSize: 16,
        color: "#333",
    },
    trackTypeTextSelected: {
        color: "#fff",
        fontWeight: "600",
    },
});
