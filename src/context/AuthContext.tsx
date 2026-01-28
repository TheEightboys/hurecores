import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { docs, getDocument } from '../lib/firestore';
import { User, SystemRole, Profile, StaffPermissions } from '../types';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<FirebaseUser>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map Firebase user + Firestore profile to User type
async function mapFirebaseUserToUser(firebaseUser: FirebaseUser): Promise<User | null> {
    try {
        // Fetch profile from Firestore
        const profile = await getDocument<Profile>(docs.user(firebaseUser.uid));

        if (profile) {
            // Determine display role based on systemRole
            let displayRole: string = 'Staff';
            if (profile.isSuperAdmin) {
                displayRole = 'SuperAdmin';
            } else if (profile.systemRole === 'OWNER') {
                displayRole = 'Owner';
            } else if (profile.systemRole === 'ADMIN') {
                displayRole = 'Admin';
            } else if (profile.systemRole === 'MANAGER') {
                displayRole = 'Manager';
            } else if (profile.systemRole === 'EMPLOYEE') {
                displayRole = 'Staff';
            }

            return {
                id: profile.id,
                name: profile.fullName,
                email: profile.email,
                systemRole: profile.systemRole,
                jobTitle: profile.jobTitle,
                organizationId: profile.organizationId,
                locationId: profile.locationId,
                avatar: profile.avatarUrl,
                isSuperAdmin: profile.isSuperAdmin,
                permissions: profile.permissions,
                role: displayRole // Display role based on systemRole
            };
        }

        // No profile yet (new user) - return minimal user
        return {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            systemRole: 'EMPLOYEE' as SystemRole,
            role: 'Staff'
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        // Return minimal user to prevent logout loop
        return {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            systemRole: 'EMPLOYEE' as SystemRole,
            role: 'Staff'
        };
    }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const mappedUser = await mapFirebaseUserToUser(firebaseUser);
                setUser(mappedUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const mappedUser = await mapFirebaseUserToUser(result.user);
        setUser(mappedUser);
    };

    const signup = async (email: string, password: string): Promise<FirebaseUser> => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            signup,
            logout,
            resetPassword,
            isAuthenticated: !!user,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
