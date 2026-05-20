import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthCompat, SignInCompat, SignUpCompat } from './lib/clerkCompat';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ReportIssue = lazy(() => import('./pages/ReportIssue').then(m => ({ default: m.ReportIssue })));
const IssueDetail = lazy(() => import('./pages/IssueDetail').then(m => ({ default: m.IssueDetail })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const OfficerKanban = lazy(() => import('./pages/OfficerKanban').then(m => ({ default: m.OfficerKanban })));
const MapExplorer = lazy(() => import('./pages/MapExplorer').then(m => ({ default: m.MapExplorer })));
const AIInsights = lazy(() => import('./pages/AIInsights').then(m => ({ default: m.AIInsights })));
const UserManagement = lazy(() => import('./pages/UserManagement').then(m => ({ default: m.UserManagement })));
const Alerts = lazy(() => import('./pages/Alerts').then(m => ({ default: m.Alerts })));

function AuthLayout({ type = 'sign-in' }) {
  const isSignIn = type === 'sign-in';

  return (
    <div className="min-h-screen bg-black text-white px-4 py-12 flex items-center justify-center">
      <main className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center gap-4">
          <div className="glass-pill inline-flex items-center gap-3 px-5 py-3 border border-white/10 bg-white/5">
            <img src="/favicon.svg" alt="ResolveIt" className="h-8 w-8 object-contain" />
            <span className="text-sm font-black text-white">ResolveIt</span>
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-4xl font-black text-white">
              {isSignIn ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              {isSignIn ? "Sign in to continue to your city dashboard." : "Join the civic reporting board in a few seconds."}
            </p>
          </div>
        </div>

        <div className="w-full">
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
      </main>
    </div>
  );
}

const LoadingFallback = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
    <div className="relative flex items-center justify-center">
      <div className="absolute w-16 h-16 rounded-full border border-white/5 bg-white/5 backdrop-blur-md"></div>
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
    <div className="text-primary font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Initializing Feed...</div>
  </div>
);

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
      <Suspense fallback={<LoadingFallback />}>
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
      </Suspense>
    </div>
  );
}

export default App;
