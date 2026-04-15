import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, SignIn, SignUp } from '@clerk/clerk-react';
import { Dashboard } from './pages/Dashboard';
import { ReportIssue } from './pages/ReportIssue';
import { IssueDetail } from './pages/IssueDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import { OfficerKanban } from './pages/OfficerKanban';

function App() {
  const { isLoaded, isSignedIn } = useAuth();

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
          element={<div className="flex min-h-screen items-center justify-center py-20"><SignIn routing="path" path="/sign-in" /></div>} 
        />
        <Route 
          path="/sign-up/*" 
          element={<div className="flex min-h-screen items-center justify-center py-20"><SignUp routing="path" path="/sign-up" /></div>} 
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
          path="/leaderboard" 
          element={
            isSignedIn ? 
              <Leaderboard /> :
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
      </Routes>
    </div>
  );
}

export default App;