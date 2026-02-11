import { PrimaryButton, SecondaryButton } from "@/src/components/Button";
import { ConfigSchemaRenderer } from "@/src/components/ConfigSchemaRenderer";
import { FormInput, TextArea } from "@/src/components/Input";
import { MultiImageUpload } from "@/src/components/MultiImageUpload";
import { PackagesEditor } from "@/src/components/PackagesEditor";
// import { PricingSchemaRenderer } from "@/src/components/PricingSchemaRenderer";
import { useBusiness } from "@/src/providers/business-context";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  clearCurrentActivity,
  createActivity,
  CreateActivityData,
  fetchActivity,
  updateActivity,
  UpdateActivityData,
} from "@/src/store/slices/activity-slice";
import {
  fetchTypeDefinition,
  fetchTypeDefinitions,
} from "@/src/store/slices/activity-type-slice";
import { fetchTemplates } from "@/src/store/slices/availability-template-slice";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ActivityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const dispatch = useAppDispatch();
  const { business } = useBusiness();
  const { currentActivity, loading } = useAppSelector(
    (state) => state.activities,
  );
  const { templates } = useAppSelector((state) => state.availabilityTemplates);
  const { typeDefinitions, currentTypeDefinition } = useAppSelector(
    (state) => state.activityTypes,
  );

  const isEditMode = !!id;

  const [title, setTitle] = useState("");
  const [typeId, setTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [availabilityTemplateId, setAvailabilityTemplateId] = useState("");
  const [catalogGroupId, setCatalogGroupId] = useState("");
  const [catalogGroupTitle, setCatalogGroupTitle] = useState("");
  const [catalogGroupKind, setCatalogGroupKind] = useState("");

  const [config, setConfig] = useState<Record<string, any>>({});
  const [pricing, setPricing] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(fetchTypeDefinitions());
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && id) dispatch(fetchActivity(id));
    return () => {
      dispatch(clearCurrentActivity());
    };
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (business?.id) dispatch(fetchTemplates(business.id));
  }, [dispatch, business?.id]);

  useEffect(() => {
    if (currentActivity && isEditMode) {
      setTitle(currentActivity.title);
      setTypeId(currentActivity.typeId);
      setDescription(currentActivity.description || "");
      setCategory(currentActivity.category || "");
      setCity(currentActivity.city || "");
      setAddress(currentActivity.address || "");
      setPriceFrom(currentActivity.priceFrom?.toString() || "");
      setAvailabilityTemplateId(currentActivity.availabilityTemplateId || "");
      setCatalogGroupId(currentActivity.catalogGroupId || "");
      setCatalogGroupTitle(currentActivity.catalogGroupTitle || "");
      setCatalogGroupKind(currentActivity.catalogGroupKind || "");
      setConfig(currentActivity.config || {});
      setPricing(currentActivity.pricing || {});

      if (currentActivity.typeId)
        dispatch(fetchTypeDefinition(currentActivity.typeId));
    }
  }, [dispatch, currentActivity, isEditMode]);

  useEffect(() => {
    if (typeId && !isEditMode) {
      dispatch(fetchTypeDefinition(typeId));

      const newConfig: Record<string, any> = {};
      if (typeId === "karting") {
        newConfig.packages = [
          {
            code: "standard",
            title: "Standard Session",
            track_type: "indoor",
            pricing_type: "per_person",
            is_default: true,
            sort_order: 0,
          },
        ];
      } else if (typeId === "cooking_class") {
        newConfig.packages = [
          {
            code: "standard",
            title: "Standard Seat",
            description: "Individual seat with all materials included",
            base_price: 79,
            currency: "EUR",
            pricing_type: "per_person",
            is_default: true,
            sort_order: 0,
          },
        ];
      } else if (typeId === "escape_room") {
        newConfig.packages = [
          {
            code: "3-4-players",
            title: "3-4 Players",
            description: "Most popular option for small groups",
            base_price: 22,
            currency: "EUR",
            pricing_type: "per_person",
            is_default: true,
            sort_order: 0,
            min_participants: 3,
            max_participants: 4,
            player_count: "3-4",
          },
        ];
      }

      setConfig(newConfig);
      setPricing({});
    }
  }, [
    dispatch,
    typeId,
    isEditMode,
    business,
    catalogGroupId,
    catalogGroupTitle,
    catalogGroupKind,
  ]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic required fields
    if (!title.trim()) newErrors.title = "Title is required";
    if (!typeId.trim()) newErrors.typeId = "Type is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!category.trim()) newErrors.category = "Category is required";
    if (!city.trim()) newErrors.city = "City is required";
    if (!address.trim()) newErrors.address = "Address is required";
    if (!priceFrom.trim() || isNaN(parseFloat(priceFrom))) {
      newErrors.priceFrom = "Valid price is required";
    }

    // Catalog group fields (required for discovery)
    if (!catalogGroupId.trim()) {
      newErrors.catalogGroupId = "Catalog Group ID is required";
    }
    if (!catalogGroupTitle.trim()) {
      newErrors.catalogGroupTitle = "Catalog Group Title is required";
    }

    // Availability template is required
    if (!availabilityTemplateId) {
      newErrors.availabilityTemplateId = "Availability template is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors before saving");
      return;
    }
    if (!business?.id) {
      Alert.alert("Error", "Business not found");
      return;
    }

    try {
      if (isEditMode && id) {
        const updateData: UpdateActivityData = {
          title,
          typeId,
          description: description || undefined,
          category: category || undefined,
          city: city || undefined,
          address: address || undefined,
          priceFrom: priceFrom ? parseFloat(priceFrom) : undefined,
          config,
          pricing,
          availabilityTemplateId: availabilityTemplateId || undefined,
          catalogGroupId: catalogGroupId || undefined,
          catalogGroupTitle: catalogGroupTitle || undefined,
          catalogGroupKind: catalogGroupKind || undefined,
        };
        await dispatch(
          updateActivity({ activityId: id, data: updateData }),
        ).unwrap();
        Alert.alert("Success", "Activity updated successfully");
      } else {
        const createData: CreateActivityData = {
          businessId: business.id,
          title,
          typeId,
          description: description || undefined,
          category: category || undefined,
          city: city || undefined,
          address: address || undefined,
          priceFrom: priceFrom ? parseFloat(priceFrom) : undefined,
          config,
          pricing,
          availabilityTemplateId: availabilityTemplateId || undefined,
          catalogGroupId: catalogGroupId || undefined,
          catalogGroupTitle: catalogGroupTitle || undefined,
          catalogGroupKind: catalogGroupKind || undefined,
        };
        await dispatch(createActivity(createData)).unwrap();
        Alert.alert("Success", "Activity created successfully");
      }

      router.back();
    } catch (error: any) {
      console.error("Failed to save activity:", error);
      Alert.alert("Error", error.message || "Failed to save activity");
    }
  };

  if (loading && isEditMode) {
    return (
      <View style={ui.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={ui.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <SecondaryButton
          title="Cancel"
          onPress={() => router.back()}
          style={styles.headerButton}
        />
        <Text style={[typography.h4, styles.headerTitle]}>
          {isEditMode ? "Edit" : "Create"} Activity
        </Text>
        <PrimaryButton
          title="Save"
          onPress={handleSave}
          style={styles.headerButton}
        />
      </View>

      <ScrollView
        style={ui.scrollView}
        contentContainerStyle={[ui.contentPadding, styles.scrollContent]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <FormInput
          label="Title *"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Go-Kart Racing"
          error={errors.title}
        />

        {/* Type Dropdown */}
        <View style={ui.section}>
          <Text style={[typography.label, styles.labelSpacing]}>Type *</Text>
          <View style={styles.typeDropdown}>
            {typeDefinitions.map((type) => (
              <TouchableOpacity
                key={type.typeId}
                style={[
                  styles.typeOption,
                  typeId === type.typeId && styles.typeOptionSelected,
                ]}
                onPress={() => setTypeId(type.typeId)}
                disabled={isEditMode}
              >
                <Text
                  style={[
                    typography.caption,
                    typeId === type.typeId && styles.typeOptionTextSelected,
                  ]}
                >
                  {type.displayName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.typeId && (
            <Text style={[typography.captionSmall, styles.errorText]}>
              {errors.typeId}
            </Text>
          )}
          {isEditMode && (
            <Text style={[typography.captionSmall, styles.helperText]}>
              Type cannot be changed after creation
            </Text>
          )}
        </View>

        {/* Description */}
        <TextArea
          label="Description *"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your activity..."
          error={errors.description}
        />

        {/* City */}
        <FormInput
          label="City *"
          value={city}
          onChangeText={setCity}
          placeholder="e.g., Amsterdam"
          error={errors.city}
        />

        {/* Address */}
        <FormInput
          label="Address *"
          value={address}
          onChangeText={setAddress}
          placeholder="Street address"
          error={errors.address}
        />

        {/* Category */}
        <FormInput
          label="Category *"
          value={category}
          onChangeText={setCategory}
          placeholder="e.g., Sports, Food, Entertainment"
          error={errors.category}
        />

        {/* Price From */}
        <View style={ui.section}>
          <FormInput
            label="Price From (€) *"
            value={priceFrom}
            onChangeText={setPriceFrom}
            placeholder="0.00"
            keyboardType="decimal-pad"
            error={errors.priceFrom}
            containerStyle={{ marginBottom: theme.spacing.sm }}
          />
          <Text style={[typography.captionSmall, styles.helperText]}>
            {"Display price for discovery feed."}
          </Text>
        </View>

        {/* Catalog Group Fields */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h4, styles.sectionTitle]}>
            Discovery Settings
          </Text>
          <Text style={[typography.captionMuted, styles.sectionSubtitle]}>
            Required for customers to find your activity.
          </Text>
        </View>

        <FormInput
          label="Catalog Group ID *"
          value={catalogGroupId}
          onChangeText={setCatalogGroupId}
          placeholder="e.g., businessname-escape-room"
          error={errors.catalogGroupId}
          containerStyle={{ marginBottom: theme.spacing.sm }}
        />
        <Text style={[typography.captionSmall, styles.helperText]}>
          Unique ID for grouping related activities.
        </Text>

        <FormInput
          label="Catalog Group Title *"
          value={catalogGroupTitle}
          onChangeText={setCatalogGroupTitle}
          placeholder="e.g., Escape Room at YourBusiness"
          error={errors.catalogGroupTitle}
          containerStyle={{ marginBottom: theme.spacing.sm }}
        />
        <Text style={[typography.captionSmall, styles.helperText]}>
          Display name shown in discovery feed.
        </Text>

        <FormInput
          label="Catalog Group Kind"
          value={catalogGroupKind}
          onChangeText={setCatalogGroupKind}
          placeholder={typeId || "activity_type"}
          containerStyle={{ marginBottom: theme.spacing.sm }}
        />
        <Text style={[typography.captionSmall, styles.helperText]}>
          Activity type identifier.
        </Text>

        {/* Activity Images */}
        {isEditMode && id && (
          <MultiImageUpload
            activityId={id}
            currentImages={
              currentActivity?.images?.map((img: any) => ({
                id: img.id,
                url: img.imageUrl,
                isThumbnail: img.isThumbnail,
              })) || []
            }
            onImagesChange={() => dispatch(fetchActivity(id))}
          />
        )}

        {/* Dynamic Config / Packages */}
        {currentTypeDefinition && (
          <>
            {["karting", "cooking_class", "escape_room"].includes(typeId) ? (
              <PackagesEditor
                packages={config.packages || []}
                onChange={(packages) => {
                  setConfig({ ...config, packages });
                  const prices = packages
                    .map((pkg) => pkg.base_price)
                    .filter((p) => p !== undefined && p !== null);
                  if (prices.length > 0)
                    setPriceFrom(Math.min(...prices).toString());
                }}
              />
            ) : (
              <ConfigSchemaRenderer
                typeDefinition={currentTypeDefinition}
                currentConfig={config}
                onConfigChange={setConfig}
                errors={errors}
              />
            )}

            {/* <PricingSchemaRenderer
              typeDefinition={currentTypeDefinition}
              currentPricing={pricing}
              onPricingChange={setPricing}
              errors={errors}
            /> */}
          </>
        )}

        {/* Availability Template Picker */}
        <View style={ui.section}>
          <View style={[ui.rowBetween, styles.labelRow]}>
            <Text style={[typography.label, styles.labelSpacing]}>
              Availability Template *
            </Text>
            {!availabilityTemplateId && (
              <View style={styles.requiredIndicator}>
                <Text style={[typography.captionSmall, styles.requiredText]}>
                  ⚠️ Required
                </Text>
              </View>
            )}
          </View>

          {errors.availabilityTemplateId && (
            <Text style={[typography.captionSmall, styles.errorText]}>
              {errors.availabilityTemplateId}
            </Text>
          )}

          {templates.length > 0 ? (
            <View style={styles.templatePicker}>
              {templates
                .filter((t) => t.status === "active")
                .map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateOption,
                      availabilityTemplateId === template.id &&
                        styles.templateOptionSelected,
                    ]}
                    onPress={() => setAvailabilityTemplateId(template.id)}
                    disabled={
                      isEditMode && currentActivity?.status === "published"
                    }
                  >
                    <Text style={typography.caption}>{template.name}</Text>
                    <Text
                      style={[typography.captionSmall, styles.templateDetails]}
                    >
                      {template.daysOfWeek?.length || 0} days •{" "}
                      {template.capacity} capacity
                    </Text>
                  </TouchableOpacity>
                ))}

              {availabilityTemplateId &&
                currentActivity?.status !== "published" && (
                  <SecondaryButton
                    title="Clear Selection"
                    onPress={() => setAvailabilityTemplateId("")}
                    style={styles.templateClearButton}
                  />
                )}
            </View>
          ) : (
            <View style={styles.warningBox}>
              <Text style={[typography.caption, styles.warningText]}>
                ⚠️ No active templates found. Create one in the Availability tab
                first.
              </Text>
            </View>
          )}

          {isEditMode && currentActivity?.status === "published" && (
            <View style={styles.infoBox}>
              <Text style={[typography.caption, styles.infoText]}>
                ✓ Template is linked and cannot be changed while published
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.xxl },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  headerTitle: { flex: 1, textAlign: "center" as const },
  headerButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minWidth: 70,
  },

  labelSpacing: { marginBottom: theme.spacing.sm },
  helperText: {
    marginBottom: theme.spacing.lg,
    color: theme.colors.muted,
  },
  errorText: {
    color: theme.colors.danger,
    marginTop: theme.spacing.sm,
  },

  typeDropdown: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  typeOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
  },
  typeOptionSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  typeOptionTextSelected: {
    color: theme.colors.buttonTextOnAccent,
  },

  templatePicker: { marginTop: theme.spacing.sm, gap: theme.spacing.md },
  templateOption: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
  },
  templateOptionSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  templateDetails: {
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
  },

  templateClearButton: {
    height: 40,
    borderRadius: 20,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignSelf: "flex-start",
  },

  labelRow: { marginBottom: theme.spacing.sm },
  requiredIndicator: {
    backgroundColor: "rgba(255,77,77,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,77,77,0.25)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
  },
  requiredText: { color: theme.colors.danger },

  warningBox: {
    backgroundColor: "rgba(245,158,11,0.14)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.25)",
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginTop: theme.spacing.sm,
  },
  warningText: { color: "#F59E0B" },

  infoBox: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.22)",
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginTop: theme.spacing.sm,
  },
  infoText: { color: "#22C55E" },

  sectionHeader: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  sectionTitle: { marginBottom: theme.spacing.sm },
  sectionSubtitle: { lineHeight: 18 },
});
