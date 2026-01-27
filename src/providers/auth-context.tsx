import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Role = 'user' | 'business';

type AuthContextValue = {
    firebaseUser: any | null; // later: FirebaseAuthTypes.User | null
    loadingAuth: boolean;
    role: Role;
    setRole: (role: Role) => void;
    loadingRole: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // TEMP: role is local for now; later load from Firestore/backend
    const [role, setRole] = useState<Role>('user');
    const [loadingRole] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
            setLoadingAuth(false);
        });
        return unsubscribe;
    }, []);

    const value = useMemo(
        () => ({
            firebaseUser,
            loadingAuth,
            role,
            setRole,
            loadingRole,
        }),
        [firebaseUser, loadingAuth, role, loadingRole]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
