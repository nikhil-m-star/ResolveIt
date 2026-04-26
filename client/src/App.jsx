import { Routes, Route, Navigate } from 'react-router-dom';
import { Shield, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import { useAuthCompat, SignInCompat, SignUpCompat } from './lib/clerkCompat';
import { Dashboard } from './pages/Dashboard';
import { ReportIssue } from './pages/ReportIssue';
import { IssueDetail } from './pages/IssueDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { Profile } from './pages/Profile';
import { OfficerKanban } from './pages/OfficerKanban';
import { MapExplorer } from './pages/MapExplorer';
import { AIInsights } from './pages/AIInsights';
import { UserManagement } from './pages/UserManagement';
import { Alerts } from './pages/Alerts';

function AuthLayout({ type = 'sign-in' }) {
  const isSignIn = type === 'sign-in';

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto grid w-full max-w-6xl items-stretch gap-8 lg:grid-cols-[1.1fr_1fr]">
        <section className="glass-card relative overflow-hidden rounded-5xl border border-primary/30 bg-black/70 p-8 md:p-12">
          <div className="absolute -top-20 -left-20 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative flex h-full flex-col gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">ResolveIt Premium Access</span>
            </div>
            <div className="space-y-4">
              <h1 className="font-heading text-4xl font-black leading-tight md:text-5xl">
                Civic Reporting
                <span className="block text-primary">Made Reliable</span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
                Sign in to report local issues, view live status updates, and track action from your city teams in one place.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 inline-flex rounded-full bg-primary/20 p-2">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-bold text-white">Live Map Tracking</p>
                <p className="mt-1 text-xs text-slate-400">Search areas, view nearby reports, and follow real-time issue progress.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 inline-flex rounded-full bg-blue-500/20 p-2">
                  <Shield className="h-4 w-4 text-blue-300" />
                </div>
                <p className="text-sm font-bold text-white">Trusted Access</p>
                <p className="mt-1 text-xs text-slate-400">Secure auth synced directly to your ResolveIt account role and session.</p>
              </div>
            </div>
            <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              <span>{isSignIn ? "Returning Citizen" : "New Citizen"}</span>
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary">{isSignIn ? "Sign In" : "Create Account"}</span>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-5xl border border-white/10 bg-black/75 p-4 md:p-6 lg:p-8">
          <div className="mx-auto flex min-h-600 w-full max-w-md items-center justify-center">
            {isSignIn ? (
              <SignInCompat
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                forceRedirectUrl="/dashboard"
                fallbackRedirectUrl="/dashboard"
              />
            ) : (
              <SignUpCompat
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                forceRedirectUrl="/dashboard"
                fallbackRedirectUrl="/dashboard"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function App() {
  const { isLoaded, isSignedIn } = useAuthCompat();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative">
      <Routes>
        <Route 
          path="/sign-in/*" 
          element={<AuthLayout type="sign-in" />} 
        />
        <Route 
          path="/sign-up/*" 
          element={<AuthLayout type="sign-up" />} 
        />
        <Route 
          path="/" 
          element={
            isSignedIn ? 
              <Dashboard /> :
              <Navigate to="/sign-in" />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isSignedIn ? 
              <Dashboard /> :
              <Navigate to="/sign-in" />
          } 
        />
        <Route 
          path="/report" 
          element={
            isSignedIn ? 
              <ReportIssue /> :
              <Navigate to="/sign-in" />
          } 
        />
        <Route 
          path="/issues/:id" 
          element={
            isSignedIn ? 
              <IssueDetail /> :
              <Navigate to="/sign-in" />
          } 
        />
        <Route 
          path="/admin" 
          element={
            isSignedIn ? 
              <AdminDashboard /> :
              <Navigate to="/sign-in" />
          } 
        />
        <Route 
          path="/kanban" 
          element={
            isSignedIn ? 
              <OfficerKanban /> :
              <Navigate to="/sign-in" />
          } 
        />
        <Route 
          path="/map" 
          element={
            isSignedIn ? 
              <MapExplorer /> : 
              <Navigate to="/sign-in" />
          } 
        />
        <Route 
          path="/ai-insights" 
          element={
            isSignedIn ? 
              <AIInsights /> : 
              <Navigate to="/sign-in" />
          } 
        />
        <Route 
          path="/users" 
          element={
            isSignedIn ? 
              <UserManagement /> : 
              <Navigate to="/sign-in" />
          } 
        />
        <Route 
          path="/alerts" 
          element={
            isSignedIn ? 
              <Alerts /> :
              <Navigate to="/sign-in" />
          } 
        />
        <Route 
          path="/profile" 
          element={
            isSignedIn ? 
              <Profile /> :
              <Navigate to="/sign-in" />
          } 
        />
        <Route path="*" element={<Navigate to={isSignedIn ? "/" : "/sign-in"} replace />} />
      </Routes>
    </div>
  );
}

export default App;
