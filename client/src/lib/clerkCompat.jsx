/* eslint-disable react-refresh/only-export-components */
import {
  ClerkProvider,
  SignIn as ClerkSignIn,
  SignUp as ClerkSignUp,
  UserButton as ClerkUserButton,
  useAuth as useClerkAuth,
  useUser as useClerkUser,
} from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { isNativeApp } from "./platform";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const isClerkConfigured = Boolean(CLERK_KEY);
const isNative = isNativeApp();

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
  return (
    <ClerkProvider 
      publishableKey={CLERK_KEY}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
      allowedRedirectOrigins={
        isNative
          ? ["https://resolve--it.vercel.app"]
          : [typeof window !== "undefined" ? window.location.origin : "https://resolve--it.vercel.app"]
      }
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#10b981',
          colorBackground: 'transparent',
          colorInputBackground: 'rgba(255,255,255,0.06)',
          colorInputText: '#ffffff',
          borderRadius: '18px',
        },
        elements: {
          card: "bg-black/60 border border-white/10 backdrop-blur-3xl rounded-4xl p-8",
          headerTitle: "font-heading font-black text-2xl text-white",
          headerSubtitle: "hidden",
          footer: "mt-4",
          formFieldLabel: "text-xs font-bold text-slate-400",
          formFieldInput: "bg-white/5 border-white/10 text-white rounded-2xl focus:border-primary/50 transition-colors",
          socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-2xl",
          socialButtonsBlockButtonText: "font-bold text-sm text-white",
          dividerLine: "bg-white/10",
          dividerText: "text-slate-500 font-bold text-xs",
          formButtonPrimary: "bg-primary hover:bg-emerald-400 text-black font-black rounded-2xl transition-colors",
          footerActionText: "text-slate-400 font-bold",
          footerActionLink: "text-primary hover:text-emerald-400 font-black"
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}
