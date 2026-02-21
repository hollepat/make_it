import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { ProgramProvider } from './context/ProgramContext';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNavigation from './components/BottomNavigation';
import CalendarPage from './pages/CalendarPage';
import CreateSessionPage from './pages/CreateSessionPage';
import UpcomingPage from './pages/UpcomingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InvitesPage from './pages/InvitesPage';
import ProgramsPage from './pages/ProgramsPage';
import CreateProgramPage from './pages/CreateProgramPage';
import ProgramDetailPage from './pages/ProgramDetailPage';
import AssistantPage from './pages/AssistantPage';
import AthleteProfilePage from './pages/AthleteProfilePage';
import { AssistantProvider } from './context/AssistantContext';

function ProtectedLayout() {
  return (
    <ProgramProvider>
      <SessionProvider>
        <AssistantProvider>
          <div className="flex flex-col h-screen bg-gray-50">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden pb-14">
              <Routes>
                <Route path="/" element={<CalendarPage />} />
                <Route path="/create" element={<CreateSessionPage />} />
                <Route path="/upcoming" element={<UpcomingPage />} />
                <Route path="/settings" element={<InvitesPage />} />
                <Route path="/programs" element={<ProgramsPage />} />
                <Route path="/programs/new" element={<CreateProgramPage />} />
                <Route path="/programs/:id" element={<ProgramDetailPage />} />
                <Route path="/programs/:id/edit" element={<CreateProgramPage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/profile" element={<AthleteProfilePage />} />
              </Routes>
            </main>

            {/* Bottom Navigation */}
            <BottomNavigation />
          </div>
        </AssistantProvider>
      </SessionProvider>
    </ProgramProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <ProtectedLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
