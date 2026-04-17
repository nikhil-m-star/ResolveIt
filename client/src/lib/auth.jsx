/* eslint-disable react-refresh/only-export-components */
import axios from "axios";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ClerkProviderCompat, useAuthCompat, useUserCompat } from "./clerkCompat";

const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const DEFAULT_API_URL = isLocalHost
  ? "http://localhost:5000/api"
  : "https://resolveit-cyhu.onrender.com/api";

// Force local API during development to avoid "Ghost Backend" issues
const finalBaseURL = isLocalHost ? DEFAULT_API_URL : (import.meta.env.VITE_API_URL || DEFAULT_API_URL);

export const api = axios.create({
  baseURL: finalBaseURL,
  withCredentials: true,
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
  }, [isSignedIn, isLoaded, isUserLoaded, getToken, user, queryClient]);

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
