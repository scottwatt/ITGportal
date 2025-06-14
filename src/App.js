// src/App.js - Corrected with proper Global Theme integration
import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Core components
import AppLayout from './components/layout/AppLayout';
import LoginScreen from './components/auth/LoginScreen';
import LoadingScreen from './components/shared/LoadingScreen';
import ThemeWrapper from './components/theme/ThemeWrapper';

// Custom hooks
import { useAuth } from './hooks/useAuth';
import { useAppState } from './hooks/useAppState';
import { useInternships } from './hooks/useInternships';

// Styles and contexts
import './App.css';
import './styles/themes.css';
import { GlobalThemeProvider, useGlobalTheme } from './contexts/GlobalThemeContext';

// Global error boundary fallback
const GlobalErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
      <p className="text-gray-600 mb-4">
        We're sorry, but something went wrong. Please try refreshing the page or contact support if the problem persists.
      </p>
      <details className="text-left bg-gray-100 p-3 rounded mb-4">
        <summary className="cursor-pointer font-medium">Technical Details</summary>
        <pre className="text-sm mt-2 whitespace-pre-wrap">{error.message}</pre>
      </details>
      <div className="flex space-x-3 justify-center">
        <button 
          onClick={() => window.location.reload()}
          className="bg-[#6D858E] text-white px-4 py-2 rounded hover:bg-[#5A4E69]"
        >
          Refresh Page
        </button>
        <button 
          onClick={resetErrorBoundary}
          className="bg-[#9B97A2] text-white px-4 py-2 rounded hover:bg-[#707070]"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

// Global Theme Change Notification Component
const GlobalThemeNotification = () => {
  const { currentTheme, getCurrentTheme, lastChangedBy, lastChangedAt } = useGlobalTheme();
  const [showNotification, setShowNotification] = useState(false);
  const [previousTheme, setPreviousTheme] = useState('default');

  useEffect(() => {
    // Show notification when theme changes (but not on initial load)
    if (currentTheme !== previousTheme && previousTheme !== 'default') {
      if (currentTheme !== 'default' && lastChangedBy) {
        setShowNotification(true);
        
        // Auto-hide notification after 5 seconds
        const timer = setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
    setPreviousTheme(currentTheme);
  }, [currentTheme, previousTheme, lastChangedBy]);

  if (!showNotification || currentTheme === 'default') return null;

  const themeData = getCurrentTheme();
  
  return (
    <div 
      className="fixed top-4 right-4 max-w-sm"
      style={{ zIndex: 2147483645 }}
    >
      <div 
        className="bg-white rounded-lg shadow-lg border-l-4 p-4 transition-all duration-300"
        style={{ 
          borderLeftColor: themeData.colors.primary,
          zIndex: 2147483645
        }}
      >
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{themeData.emoji}</span>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              Theme Changed to {themeData.name}!
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {lastChangedBy?.name || 'An admin'} switched the portal theme for everyone.
            </p>
          </div>
          <button
            onClick={() => setShowNotification(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Content (wrapped by theme provider)
const AppContent = () => {
  // Authentication state and methods
  const auth = useAuth();
  
  // Application state and data (only initialize if authenticated)
  const appState = useAppState(auth.isAuthenticated);

  // Internship management hook (only initialize if authenticated)
  const internshipHook = useInternships(null, auth.isAuthenticated);

  // Get current theme for global animations
  const { getCurrentTheme, currentTheme } = useGlobalTheme();

  // Handle authentication loading
  if (auth.loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  // Handle authentication errors
  if (auth.error && !auth.user) {
    return <LoginScreen onLogin={auth.login} error={auth.error} />;
  }

  // Show login screen if not authenticated
  if (!auth.isAuthenticated || !auth.userProfile) {
    return <LoginScreen onLogin={auth.login} error={auth.error} />;
  }

  // Handle app state loading (include internship loading)
  if (appState.loading || internshipHook.loading) {
    return <LoadingScreen message="Loading application data..." />;
  }

  // Handle app state errors (include internship errors)
  const allErrors = [...appState.errors];
  if (internshipHook.error) {
    allErrors.push(`Internships: ${internshipHook.error}`);
  }
  
  if (allErrors.length > 0) {
    const errorMessage = allErrors.join(', ');
    return (
      <ThemeWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="theme-card max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Data Loading Error</h2>
            <p className="theme-text-secondary mb-4">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#6D858E] text-white px-4 py-2 rounded hover:bg-[#5A4E69]"
            >
              Refresh Application
            </button>
          </div>
        </div>
      </ThemeWrapper>
    );
  }

  // Create internship actions object
  const internshipActions = {
    add: internshipHook.add,
    update: internshipHook.update,
    remove: internshipHook.remove,
    getForClient: internshipHook.getForClient,
    getById: internshipHook.getById,
    markDay: internshipHook.markDay,
    addEvaluation: internshipHook.addEvaluation,
    start: internshipHook.start,
    complete: internshipHook.complete,
    cancel: internshipHook.cancel,
    getClientStats: internshipHook.getClientStats
  };

  // Render main application with theme notification and seasonal animations
  return (
    <>
      {/* Global Seasonal Animations */}
      {currentTheme === 'christmas' && (
        <div className="christmas-snow fixed inset-0 pointer-events-none" style={{ zIndex: -1 }} />
      )}
      {currentTheme === 'halloween' && (
        <div className="halloween-bats fixed inset-0 pointer-events-none" style={{ zIndex: -1 }} />
      )}
      {currentTheme === 'valentine' && (
        <div className="valentine-hearts fixed inset-0 pointer-events-none" style={{ zIndex: -1 }} />
      )}
      {currentTheme === 'stPatricks' && (
        <div className="stpatricks-shamrocks fixed inset-0 pointer-events-none" style={{ zIndex: -1 }} />
      )}
      {currentTheme === 'thanksgiving' && (
        <div className="thanksgiving-leaves fixed inset-0 pointer-events-none" style={{ zIndex: -1 }} />
      )}
      {currentTheme === 'fourthOfJuly' && (
        <div className="fourth-july-fireworks fixed inset-0 pointer-events-none" style={{ zIndex: -1 }} />
      )}

      <ThemeWrapper>
        <AppLayout 
          // Auth props
          user={auth.user}
          userProfile={auth.userProfile}
          onLogout={auth.logout}
          
          // App state props
          activeTab={appState.activeTab}
          setActiveTab={appState.setActiveTab}
          selectedClient={appState.selectedClient}
          setSelectedClient={appState.setSelectedClient}
          showPasswordModal={appState.showPasswordModal}
          setShowPasswordModal={appState.setShowPasswordModal}
          isMobileMenuOpen={appState.isMobileMenuOpen}
          setIsMobileMenuOpen={appState.setIsMobileMenuOpen}
          
          // Data props
          clients={appState.clients}
          coaches={appState.coaches}
          schedules={appState.schedules}
          tasks={appState.tasks}
          mileageRecords={appState.mileageRecords}
          internships={internshipHook.internships} 
          makerspaceRequests={appState.makerspaceRequests}
          makerspaceSchedule={appState.makerspaceSchedule}
          coordinatorRequests={appState.coordinatorRequests || []} 
          walkthroughs={appState.walkthroughs}
          
          // Action props
          clientActions={appState.clientActions}
          coachActions={appState.coachActions}
          scheduleActions={appState.scheduleActions}
          availabilityActions={appState.availabilityActions}
          graceAttendanceActions={appState.graceAttendanceActions}
          taskActions={appState.taskActions}
          mileageActions={appState.mileageActions}
          internshipActions={internshipActions}
          makerspaceActions={appState.makerspaceActions}
        />
      </ThemeWrapper>
      
      {/* Global Theme Change Notification */}
      <GlobalThemeNotification />
    </>
  );
};

function App() {
  // Get user profile for theme provider
  const auth = useAuth();

  return (
    <div className="App">
      <ErrorBoundary
        FallbackComponent={GlobalErrorFallback}
        onError={(error, errorInfo) => {
          // Log error to console and potentially to error reporting service
          console.error('Application Error:', error);
          console.error('Error Info:', errorInfo);
          
          // You could add error reporting here
          // errorReportingService.captureException(error, { extra: errorInfo });
        }}
      >
        <GlobalThemeProvider userProfile={auth.userProfile}>
          <AppContent />
        </GlobalThemeProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;