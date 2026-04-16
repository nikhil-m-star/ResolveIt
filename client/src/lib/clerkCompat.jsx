/* eslint-disable react-refresh/only-export-components */
import {
  ClerkProvider,
  SignIn as ClerkSignIn,
  SignUp as ClerkSignUp,
  UserButton as ClerkUserButton,
  useAuth as useClerkAuth,
  useUser as useClerkUser,
} from "@clerk/clerk-react";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const isClerkConfigured = Boolean(CLERK_KEY);

const MissingAuthNotice = ({ title }) => (
  <div className="w-full max-w-md rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-center text-red-100">
    <h2 className="mb-2 text-lg font-semibold">{title}</h2>
    <p className="text-sm leading-relaxed text-red-100/90">
      Authentication is temporarily unavailable because the Clerk publishable key is not configured.
      Please set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in the frontend environment.
    </p>
  </div>
);

const FallbackSignIn = () => <MissingAuthNotice title="Sign-in unavailable" />;
const FallbackSignUp = () => <MissingAuthNotice title="Sign-up unavailable" />;
const FallbackUserButton = () => null;

const fallbackAuth = {
  getToken: async () => null,
  isLoaded: true,
  isSignedIn: false,
  sessionId: null,
  userId: null,
};

const fallbackUser = {
  isLoaded: true,
  isSignedIn: false,
  user: null,
};

export const useAuthCompat = isClerkConfigured ? useClerkAuth : () => fallbackAuth;
export const useUserCompat = isClerkConfigured ? useClerkUser : () => fallbackUser;
export const SignInCompat = isClerkConfigured ? ClerkSignIn : FallbackSignIn;
export const SignUpCompat = isClerkConfigured ? ClerkSignUp : FallbackSignUp;
export const UserButtonCompat = isClerkConfigured ? ClerkUserButton : FallbackUserButton;

export function ClerkProviderCompat({ children }) {
  if (!isClerkConfigured) return children;
  return <ClerkProvider publishableKey={CLERK_KEY}>{children}</ClerkProvider>;
}
