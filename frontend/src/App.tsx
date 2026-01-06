import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import BottomNavigation from './components/BottomNavigation';
import CalendarPage from './pages/CalendarPage';
import CreateSessionPage from './pages/CreateSessionPage';
import UpcomingPage from './pages/UpcomingPage';

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <div className="flex flex-col h-screen bg-gray-50">
          {/* Main Content Area */}
          <main className="flex-1 flex flex-col overflow-hidden pb-14">
            <Routes>
              <Route path="/" element={<CalendarPage />} />
              <Route path="/create" element={<CreateSessionPage />} />
              <Route path="/upcoming" element={<UpcomingPage />} />
            </Routes>
          </main>

          {/* Bottom Navigation */}
          <BottomNavigation />
        </div>
      </SessionProvider>
    </BrowserRouter>
  );
}

export default App;
