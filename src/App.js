// src/App.js - Updated with Grace Attendance support + Mileage Tracking + INTERNSHIPS
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Core components
import AppLayout from './components/layout/AppLayout';
import LoginScreen from './components/auth/LoginScreen';
import LoadingScreen from './components/shared/LoadingScreen';

// Custom hooks
import { useAuth } from './hooks/useAuth';
import { useAppState } from './hooks/useAppState';
import { useInternships } from './hooks/useInternships'; // ADD: Import internships hook

// Styles
import './App.css';

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

function App() {
  // Authentication state and methods
  const auth = useAuth();
  
  // Application state and data (only initialize if authenticated)
  const appState = useAppState(auth.isAuthenticated);

  // ADD: Internship management hook (only initialize if authenticated)
  const internshipHook = useInternships(null, auth.isAuthenticated);

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
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Data Loading Error</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#6D858E] text-white px-4 py-2 rounded hover:bg-[#5A4E69]"
          >
            Refresh Application
          </button>
        </div>
      </div>
    );
  }

  // ADD: Create internship actions object
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

  // Render main application
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
      </ErrorBoundary>
    </div>
  );
}

export default App;