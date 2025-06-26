
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GlobalStyles } from './styles/GlobalStyles';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Import components (will be created later)
import { AuthProvider } from './components/auth/AuthProvider';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LobbyPage } from './pages/LobbyPage';
import { GamePage } from './pages/GamePage';
import { HallOfFamePage } from './pages/HallOfFamePage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { NotificationProvider } from './components/ui/NotificationProvider';
import { AudioControlWidget } from './components/ui/AudioSettings';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ThemeProvider>
            <GlobalStyles />
            <NotificationProvider>
            <AuthProvider>
              <Router>
                <Layout>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/hall-of-fame" element={<HallOfFamePage />} />
                    
                    {/* Protected routes */}
                    <Route path="/lobby" element={
                      <ProtectedRoute>
                        <LobbyPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/lobby/:code" element={
                      <ProtectedRoute>
                        <LobbyPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/game/:code" element={
                      <ProtectedRoute>
                        <GamePage />
                      </ProtectedRoute>
                    } />
                    
                    {/* Catch all route */}
                    <Route path="*" element={<div>Page not found</div>} />
                  </Routes>
                </Layout>
                <AudioControlWidget />
              </Router>
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
        </LanguageProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
