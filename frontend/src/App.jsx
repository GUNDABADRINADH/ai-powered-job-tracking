import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useUiStore } from './store/uiStore';
import LoginPage from './pages/LoginPage';
import ResumePage from './pages/ResumePage';
import JobFeedPage from './pages/JobFeedPage';
import DashboardPage from './pages/DashboardPage';
import ChatBubble from './components/ChatBubble';

function PrivateRoute({ children }) {
 const { isAuthenticated } = useAuthStore();
 return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
 const { isAuthenticated } = useAuthStore();
 const { darkMode } = useUiStore();

 // Sync dark mode class to <html> so Tailwind dark: variants work everywhere
 useEffect(() => {
 const root = document.documentElement;
 if (darkMode) {
 root.classList.add('dark');
 } else {
 root.classList.remove('dark');
 }
 }, [darkMode]);

 return (
 <BrowserRouter>
 <Toaster
 position="top-right"
          toastOptions={{
            className: '!bg-white dark:!bg-neutral-900 !text-slate-800 dark:!text-neutral-200 !border !border-slate-200 dark:!border-white/10 !shadow-xl',
            style: {
              borderRadius: '16px',
            },
          }}
 />
 <Routes>
 <Route
 path="/login"
 element={isAuthenticated ? <Navigate to="/jobs" replace /> : <LoginPage />}
 />
 <Route
 path="/resume"
 element={
 <PrivateRoute>
 <ResumePage />
 </PrivateRoute>
 }
 />
 <Route
 path="/jobs"
 element={
 <PrivateRoute>
 <JobFeedPage />
 </PrivateRoute>
 }
 />
 <Route
 path="/dashboard"
 element={
 <PrivateRoute>
 <DashboardPage />
 </PrivateRoute>
 }
 />
 <Route path="*" element={<Navigate to={isAuthenticated ? '/jobs' : '/login'} replace />} />
 </Routes>
 {isAuthenticated && <ChatBubble />}
 </BrowserRouter>
 );
}

export default App;
