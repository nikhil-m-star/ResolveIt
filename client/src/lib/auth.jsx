import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!CLERK_KEY) {
  throw new Error("Missing Publishable Key");
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// A component that intercepts Clerk state and Syncs it with our internal API session
const AuthSync = ({ children }) => {
  const { getToken, isSignedIn, isLoaded, user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    let interceptor;

    const syncSession = async () => {
      // Setup the Axios token interceptor so all requests attach the JWT
      interceptor = api.interceptors.request.use(
        async (config) => {
          // If we have an internal session token, use it.
          // Fallback to clerk token to exchange for internal.
          const token = localStorage.getItem("resolveit_token") || await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Once standard auth finishes loading & user is signed in...
      if (isLoaded && isSignedIn && user) {
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
          
          localStorage.setItem("resolveit_token", data.token);
          api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
          
          // Re-fetch standard user profiles after identity established
          queryClient.invalidateQueries(["userProfile"]);
        } catch (err) {
            console.error("Session sync failed", err);
        }
      } else if (isLoaded && !isSignedIn) {
          localStorage.removeItem("resolveit_token");
          delete api.defaults.headers.common["Authorization"];
      }
    };

    syncSession();

    return () => {
      if (interceptor) api.interceptors.request.eject(interceptor);
    };
  }, [isSignedIn, isLoaded, getToken, user, queryClient]);

  return children;
};

// Wrap the generic configured Clerk Provider
export const ResolveItAuthProvider = ({ children }) => {
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <AuthSync>
        {children}
      </AuthSync>
    </ClerkProvider>
  );
};
