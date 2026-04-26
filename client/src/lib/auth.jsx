/* eslint-disable react-refresh/only-export-components */
import axios from "axios";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ClerkProviderCompat, useAuthCompat, useUserCompat } from "./clerkCompat";

const isNative = typeof window !== 'undefined' && !!window.Capacitor?.isNative;
const isLocalHost = !isNative && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const PROD_API_URL = import.meta.env.VITE_API_URL || "https://resolveit-3xtz.onrender.com/api";
const LOCAL_API_URL = "http://localhost:5000/api";

// Native apps always use the production backend
// Localhost dev uses local backend
// Deployed web uses the env variable or production backend
const finalBaseURL = isNative ? PROD_API_URL : (isLocalHost ? LOCAL_API_URL : PROD_API_URL);

export const api = axios.create({
  baseURL: finalBaseURL,
  withCredentials: !isNative, // Native uses Bearer tokens, not cookies
  headers: { "Content-Type": "application/json" },
});

// Attach internal ResolveIt token to protected API calls.
api.interceptors.request.use(
  (config) => {
    if (typeof window === "undefined") return config;
    if (config.url === "/auth/session") return config;

    const internalToken = window.localStorage.getItem("resolveit_token");
    if (internalToken) {
      config.headers.Authorization = `Bearer ${internalToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      window.localStorage.removeItem("resolveit_token");
    }
    return Promise.reject(error);
  }
);

// A component that intercepts Clerk state and Syncs it with our internal API session
const AuthSync = ({ children }) => {
  const { getToken, isSignedIn, isLoaded } = useAuthCompat();
  const { user, isLoaded: isUserLoaded } = useUserCompat();
  const queryClient = useQueryClient();
  const [authBridgeTick, setAuthBridgeTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onNativeAuthRedirect = () => setAuthBridgeTick((count) => count + 1);
    window.addEventListener("resolveit:auth-redirected", onNativeAuthRedirect);
    return () => window.removeEventListener("resolveit:auth-redirected", onNativeAuthRedirect);
  }, []);

  useEffect(() => {
    let interceptor;

    const syncSession = async () => {
      // Setup the Axios token interceptor so all requests attach the JWT
      interceptor = api.interceptors.request.use(
        async (config) => {
          // Send clerk token only for /auth/session endpoint
          if (config.url === "/auth/session") {
            const token = await getToken();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Once standard auth finishes loading & user is signed in...
      if (isLoaded && isUserLoaded && isSignedIn && user) {
        try {
          // Exchange clerk token for an internal JWT session token
          const clerkToken = await getToken();
          const { data } = await api.post("/auth/session", {
              email: user.primaryEmailAddress?.emailAddress,
              name: user.fullName || user.firstName,
              city: "Bengaluru",
          }, {
              headers: { Authorization: `Bearer ${clerkToken}` }
          });

          if (data?.user?.role) {
            localStorage.setItem("resolveit_user_role", data.user.role);
          }
          if (data?.token) {
            localStorage.setItem("resolveit_token", data.token);
          }
          
          // Re-fetch app data after identity is established to recover from initial 401s.
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          queryClient.invalidateQueries({
            predicate: (query) =>
              ["issues", "issue", "notifications", "kanbanIssues", "adminStats", "adminIssues"].includes(query.queryKey?.[0]),
          });
        } catch (err) {
            console.error("Session sync failed", err);
        }
      } else if (isLoaded && !isSignedIn) {
          // Server will clear cookie or handle session expiration
          localStorage.removeItem("resolveit_user_role");
          localStorage.removeItem("resolveit_token");
          queryClient.removeQueries({
            predicate: (query) =>
              ["issues", "issue", "notifications", "kanbanIssues", "adminStats", "adminIssues", "profile"].includes(query.queryKey?.[0]),
          });
      }
    };

    syncSession();

    return () => {
      if (interceptor) api.interceptors.request.eject(interceptor);
    };
  }, [isSignedIn, isLoaded, isUserLoaded, getToken, user, queryClient, authBridgeTick]);

  return children;
};

// Wrap the generic configured Clerk Provider
export const ResolveItAuthProvider = ({ children }) => {
  return (
    <ClerkProviderCompat>
      <AuthSync>
        {children}
      </AuthSync>
    </ClerkProviderCompat>
  );
};
