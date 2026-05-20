import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { api } from './api';
import { useQueryClient } from '@tanstack/react-query';

// 1. Clerk Publishable Key Configuration
const CLERK_PUBLISHABLE_KEY = "pk_test_aGVscGVkLWJsdWVqYXktMjkuY2xlcmsuYWNjb3VudHMuZGV2JA";

// 2. High-security SecureStore Caching Adapter for Clerk Credentials
export const tokenCache = {
  async getToken(key) {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item || null;
    } catch (error) {
      console.error("Clerk TokenCache GET Error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("Clerk TokenCache SET Error: ", err);
    }
  },
};

// 3. ResolveIt Custom Context for Session and Role management
const AuthContext = createContext({
  isSignedIn: false,
  isLoaded: false,
  role: "CITIZEN",
  userProfile: null,
  syncLoading: false,
  logout: async () => {},
});

export const useResolveItAuth = () => useContext(AuthContext);

function AuthSyncProvider({ children }) {
  const { getToken, isSignedIn, isLoaded, signOut } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [role, setRole] = useState("CITIZEN");
  const [userProfile, setUserProfile] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [internalSessionLoaded, setInternalSessionLoaded] = useState(false);

  useEffect(() => {
    const synchronizeSession = async () => {
      if (isLoaded && isSignedIn && user) {
        setSyncLoading(true);
        try {
          // A. Fetch the latest active Clerk session token
          const clerkToken = await getToken();
          if (!clerkToken) throw new Error("Clerk token unavailable");

          // B. Exchange Clerk token for custom internal JWT session token
          const { data } = await api.post("/auth/session", {
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName || user.firstName || "Anonymous Citizen",
            city: "Bengaluru",
          }, {
            headers: { Authorization: `Bearer ${clerkToken}` }
          });

          // C. Save ResolveIt session details securely
          if (data?.token) {
            await SecureStore.setItemAsync("resolveit_token", data.token);
          }
          if (data?.user?.role) {
            await SecureStore.setItemAsync("resolveit_user_role", data.user.role);
            setRole(data.user.role);
          }
          if (data?.user) {
            setUserProfile(data.user);
          }

          // D. Refresh data lists following sign-in
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          queryClient.invalidateQueries({ queryKey: ["issues"] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        } catch (err) {
          console.error("ResolveIt Session Sync Failed:", err);
        } finally {
          setSyncLoading(false);
          setInternalSessionLoaded(true);
        }
      } else if (isLoaded && !isSignedIn) {
        // Sign-out state: Clean credentials
        try {
          await SecureStore.deleteItemAsync("resolveit_token");
          await SecureStore.deleteItemAsync("resolveit_user_role");
        } catch (e) {
          // ignore
        }
        setRole("CITIZEN");
        setUserProfile(null);
        queryClient.clear();
        setInternalSessionLoaded(true);
      }
    };

    synchronizeSession();
  }, [isLoaded, isSignedIn, user]);

  const logout = async () => {
    try {
      await signOut();
      await SecureStore.deleteItemAsync("resolveit_token");
      await SecureStore.deleteItemAsync("resolveit_user_role");
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{
      isSignedIn: !!isSignedIn,
      isLoaded: isLoaded && internalSessionLoaded,
      role,
      userProfile,
      syncLoading,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function ResolveItAuthProvider({ children }) {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <AuthSyncProvider>
        {children}
      </AuthSyncProvider>
    </ClerkProvider>
  );
}
