import { apiGet } from "@/src/lib/api";
import { signOut as fbSignOut, FirebaseAuthTypes, getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Role = "user" | "business";

type AppUser = {
    id: string;
    firebaseUid: string;
    role: Role;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    city?: string | null;
    phoneNumber?: string | null;
    photoUrl?: string | null;
};

type AuthContextValue = {
    firebaseUser: FirebaseAuthTypes.User | null;
    loadingAuth: boolean;

    appUser: AppUser | null;
    role: Role;
    loadingRole: boolean;

    refreshMe: () => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [loadingRole, setLoadingRole] = useState(true);

    // Track Firebase auth (modular API)
    useEffect(() => {
        const auth = getAuth();

        const unsub = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            setLoadingAuth(false);

            // When logged out: clear app user and role loading
            if (!user) {
                setAppUser(null);
                setLoadingRole(false);
                return;
            }

            // When logged in: fetch /me
            setLoadingRole(true);
            try {
                const data = await apiGet<{ user: AppUser }>("/me");
                setAppUser(data.user);
            } finally {
                setLoadingRole(false);
            }
        });

        return unsub;
    }, []);

    const refreshMe = async () => {
        const user = getAuth().currentUser;
        if (!user) return;

        setLoadingRole(true);
        try {
            const data = await apiGet<{ user: AppUser }>("/me");
            setAppUser(data.user);
        } finally {
            setLoadingRole(false);
        }
    };

    const signOut = async () => {
        await fbSignOut(getAuth());
    };

    const role: Role = appUser?.role ?? "user"; // safe fallback while loading

    const value = useMemo<AuthContextValue>(
        () => ({
            firebaseUser,
            loadingAuth,
            appUser,
            role,
            loadingRole,
            refreshMe,
            signOut,
        }),
        [firebaseUser, loadingAuth, appUser, role, loadingRole]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}
