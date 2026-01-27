import { apiGet, apiPatch, apiPost } from "@/src/lib/api";
import { useAuth } from "@/src/providers/auth-context";
import React, { useEffect, useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

type Business = {
    id: string;
    ownerUserId: string;
    name: string;
    description?: string | null;
    category?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    address?: string | null;
    city?: string | null;
    status: "active" | "inactive";
};

export default function BusinessProfileScreen() {
    const { refreshMe } = useAuth();

    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    // form fields
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [category, setCategory] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const data = await apiGet<{ business: Business | null }>("/businesses/my");
            setBusiness(data.business);

            if (data.business) {
                setName(data.business.name ?? "");
                setCity(data.business.city ?? "");
                setCategory(data.business.category ?? "");
                setContactEmail(data.business.contactEmail ?? "");
                setContactPhone(data.business.contactPhone ?? "");
                setAddress(data.business.address ?? "");
                setDescription(data.business.description ?? "");
            }
        } catch (e: any) {
            Alert.alert("Load failed", e?.message ?? String(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const create = async () => {
        if (!name.trim()) {
            Alert.alert("Missing", "Business name is required.");
            return;
        }

        setBusy(true);
        try {
            const data = await apiPost<{ business: Business }>("/businesses", {
                name: name.trim(),
                city: city.trim() || undefined,
                category: category.trim() || undefined,
                contactEmail: contactEmail.trim() || undefined,
                contactPhone: contactPhone.trim() || undefined,
                address: address.trim() || undefined,
                description: description.trim() || undefined,
            });

            setBusiness(data.business);

            // important: role may have been promoted to business in backend
            await refreshMe();

            Alert.alert("Created", "Business created.");
        } catch (e: any) {
            Alert.alert("Create failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    const save = async () => {
        if (!business) return;

        setBusy(true);
        try {
            const data = await apiPatch<{ business: Business }>(`/businesses/${business.id}`, {
                name: name.trim() || undefined,
                city: city.trim() || undefined,
                category: category.trim() || undefined,
                contactEmail: contactEmail.trim() || undefined,
                contactPhone: contactPhone.trim() || undefined,
                address: address.trim() || undefined,
                description: description.trim() || undefined,
            });

            setBusiness(data.business);
            Alert.alert("Saved", "Business updated.");
        } catch (e: any) {
            Alert.alert("Save failed", e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text>Loading...</Text>
            </View>
        );
    }

    const isNew = !business;

    return (
        <View style={{ flex: 1, padding: 24, gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "700" }}>
                {isNew ? "Create Business" : "Business Profile"}
            </Text>

            <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Business name *"
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />
            <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="City"
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />
            <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Category"
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />
            <TextInput
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="Contact email"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />
            <TextInput
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="Contact phone"
                keyboardType="phone-pad"
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />
            <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Address"
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 }}
            />
            <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                multiline
                style={{ borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12, minHeight: 90 }}
            />

            {isNew ? (
                <Button title={busy ? "Creating..." : "Create"} onPress={create} disabled={busy} />
            ) : (
                <Button title={busy ? "Saving..." : "Save"} onPress={save} disabled={busy} />
            )}

            <Button title="Reload" onPress={load} />
        </View>
    );
}
