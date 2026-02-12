import { apiGet } from "@/src/lib/api";
import { signOut as fbSignOut, FirebaseAuthTypes, getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Role = "user" | "business";

export type AppUser = {
    id: string;
    firebaseUid: string;
    role: Role;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    city?: string | null;
    photoAsset?: {
        storageKey?: string | null;
        downloadToken?: string | null;
    } | null;
};

type AppStats = {
    totalBookings: number;
    bookingsCompleted: number;
};

type AuthContextValue = {
    firebaseUser: FirebaseAuthTypes.User | null;
    loadingAuth: boolean;

    appUser: AppUser | null;
    stats: AppStats | null;
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
    const [stats, setStats] = useState<AppStats | null>(null);
    const [loadingRole, setLoadingRole] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsub = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            setLoadingAuth(false);

            if (!user) {
                setAppUser(null);
                setStats(null);
                setLoadingRole(false);
                return;
            }

            setLoadingRole(true);
            try {
                const data = await apiGet<{ user: AppUser; stats: AppStats }>("/me");
                setAppUser(data.user);
                setStats(data.stats);
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
            const data = await apiGet<{ user: AppUser; stats: AppStats }>("/me");
            setAppUser(data.user);
            setStats(data.stats);
        } finally {
            setLoadingRole(false);
        }
    };

    const signOut = async () => {
        const auth = getAuth();
        await fbSignOut(auth);
    };

    const role: Role = appUser?.role ?? "user";

    const value = useMemo<AuthContextValue>(
        () => ({
            firebaseUser,
            loadingAuth,
            appUser,
            stats,
            role,
            loadingRole,
            refreshMe,
            signOut,
        }),
        [firebaseUser, loadingAuth, appUser, stats, role, loadingRole]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}
