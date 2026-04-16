import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthCompat, SignInCompat, SignUpCompat } from './lib/clerkCompat';
import { Dashboard } from './pages/Dashboard';
import { ReportIssue } from './pages/ReportIssue';
import { IssueDetail } from './pages/IssueDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { Profile } from './pages/Profile';
import { OfficerKanban } from './pages/OfficerKanban';
import { MapExplorer } from './pages/MapExplorer';
import { AIInsights } from './pages/AIInsights';

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
          element={<div className="flex min-h-screen items-center justify-center py-20"><SignInCompat routing="path" path="/sign-in" /></div>} 
        />
        <Route 
          path="/sign-up/*" 
          element={<div className="flex min-h-screen items-center justify-center py-20"><SignUpCompat routing="path" path="/sign-up" /></div>} 
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
