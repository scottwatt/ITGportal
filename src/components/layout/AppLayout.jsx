// src/components/layout/AppLayout.jsx - Fixed with defensive programming + Mileage Tracker
import React, { lazy, Suspense, useEffect } from 'react'; // ADDED useEffect
import { ErrorBoundary } from 'react-error-boundary';

// Core components (always loaded)
import Navigation from '../shared/Navigation';
import LoadingScreen from '../shared/LoadingScreen';
import PasswordChangeModal from '../auth/PasswordChangeModal';
import Dashboard from '../shared/Dashboard';
import Resources from '../shared/Resources';
import MileageTracker from '../mileage/MileageTracker'; 
import { loadGoogleMapsAPI } from '../../utils/googleMapsLoader'; 
import { canAccessMileageTracking } from '../../utils/constants';

// Regular client components
import ClientDashboard from '../client/ClientDashboard';
import ClientScheduleView from '../client/ClientScheduleView';
import ClientGoalsView from '../client/ClientGoalsView';
import ClientTaskView from '../client/ClientTaskView';

// Grace-specific components
import GraceClientDashboard from '../grace/GraceClientDashboard';
import GraceScheduleView from '../grace/GraceScheduleView';
import GraceAttendancePage from '../grace/GraceAttendancePage';

// Task components
import DailyTaskScheduler from '../schedule/DailyTaskScheduler';

// Utils and constants
import { 
  getNavigationItemsForUser, 
  canAccessGraceAttendance,
  USER_ROLES, 
  TIME_SLOTS,        // For coaching schedules (2-hour blocks)
  TIME_BLOCKS,       // For task scheduling (30-minute blocks)
  BUSINESS_TYPES, 
  EQUIPMENT_OPTIONS, 
  PROGRAMS_DETAILED as PROGRAMS, 
  COACH_TYPES_DETAILED as COACH_TYPES 
} from '../../utils/constants';

// Lazy load heavy components for better performance
const AdminPanel = lazy(() => import('../admin/AdminPanel'));
const MonthlyScheduleView = lazy(() => import('../schedule/MonthlyScheduleView'));
const MyScheduleTab = lazy(() => import('../schedule/MyScheduleTab'));
const ClientsTab = lazy(() => import('../client/ClientsTab'));

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
      <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="bg-[#6D858E] text-white px-4 py-2 rounded hover:bg-[#5A4E69]"
      >
        Try again
      </button>
    </div>
  </div>
);

// Loading wrapper for lazy components
const LazyComponentWrapper = ({ children }) => (
  <Suspense fallback={<LoadingScreen message="Loading component..." />}>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  </Suspense>
);

const AppLayout = ({ 
  // Auth props
  user,
  userProfile,
  onLogout,
  
  // App state props
  activeTab,
  setActiveTab,
  selectedClient,
  setSelectedClient,
  showPasswordModal,
  setShowPasswordModal,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  
  // Data props - ADD DEFAULT VALUES TO PREVENT UNDEFINED ERRORS
  clients = [],
  coaches = [],
  schedules = [],
  tasks = [],
  mileageRecords = [], // ADDED
  
  // Action props
  clientActions,
  coachActions,
  scheduleActions,
  availabilityActions,
  graceAttendanceActions,
  taskActions,
  mileageActions // ADDED
}) => {
  
  // ADDED: Load Google Maps API when mileage tab is accessed
  useEffect(() => {
    if (activeTab === 'mileage') {
      loadGoogleMapsAPI().catch(error => {
        console.warn('Google Maps API failed to load:', error);
        // Mileage tracker will still work with manual entry
      });
    }
  }, [activeTab]);

  // Helper function to check if user is a Grace client
  const isGraceClient = () => {
    if (userProfile?.role !== USER_ROLES.CLIENT) return false;
    if (!Array.isArray(clients)) return false;
    const clientData = clients.find(c => c.email === userProfile.email);
    return clientData?.program === 'grace';
  };

  const isGraceCoach = () => {
    return userProfile?.role === USER_ROLES.COACH && userProfile?.coachType === 'grace';
  };

  // Get navigation items for current user
  const getNavigationItems = () => {
    return getNavigationItemsForUser(userProfile);
  };

  // Navigation event handlers
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handlePasswordModalShow = () => {
    setShowPasswordModal(true);
    setIsMobileMenuOpen(false);
  };

  const handlePasswordModalHide = () => {
    setShowPasswordModal(false);
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setActiveTab('clients');
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
  };

  // ADDED: Safe array filtering for Grace clients
  const safeFilterGraceClients = () => {
    if (!Array.isArray(clients)) return [];
    return clients.filter(client => client?.program === 'grace');
  };

  // Route to correct component based on active tab and user role
  const renderContent = () => {
    // Grace Client views (special handling)
    if (userProfile?.role === USER_ROLES.CLIENT && isGraceClient()) {
      switch (activeTab) {
        case 'dashboard':
          return (
            <GraceClientDashboard 
              userProfile={userProfile} 
              clients={clients}
              graceAttendanceActions={graceAttendanceActions}
            />
          );
        case 'my-schedule':
          return (
            <GraceScheduleView 
              userProfile={userProfile} 
              clients={clients}
            />
          );
        case 'my-goals':
          return (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-2">My Grace Journey</h2>
                <p className="text-[#BED2D8]">Track your enrichment program progress</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-[#292929]">Personal Growth Goals</h3>
                <p className="text-[#707070]">
                  Work with your Grace coach to set and track your personal development goals 
                  in community engagement, skill building, and enrichment activities.
                </p>
              </div>
            </div>
          );
        case 'resources':
          return <Resources userRole={userProfile?.role} />;
        default:
          return (
            <GraceClientDashboard 
              userProfile={userProfile} 
              clients={clients}
              graceAttendanceActions={graceAttendanceActions}
            />
          );
      }
    }

    // Grace Coach views (special handling)
    if (isGraceCoach()) {
      switch (activeTab) {
        case 'dashboard':
          return (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-2">Grace Coach Dashboard</h2>
                <p className="text-[#BED2D8]">Welcome, {userProfile?.name}! Manage Grace enrichment activities.</p>
              </div>
              
              <GraceClientDashboard 
                userProfile={userProfile} 
                clients={clients}
                graceAttendanceActions={graceAttendanceActions}
              />
            </div>
          );
        case 'grace-schedule':
        case 'schedule':
          return (
            <GraceScheduleView 
              userProfile={userProfile} 
              clients={clients}
            />
          );
        case 'grace-attendance':
          return (
            <GraceAttendancePage
              clients={clients}
              graceAttendanceActions={graceAttendanceActions}
            />
          );
        case 'clients':
          return (
            <LazyComponentWrapper>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-6 rounded-lg">
                  <h2 className="text-2xl font-bold mb-2">Grace Participants</h2>
                  <p className="text-[#BED2D8]">Manage Grace program participants</p>
                </div>
                
                <ClientsTab 
                  clients={safeFilterGraceClients()} 
                  coaches={coaches}
                  schedules={schedules}
                  timeSlots={TIME_SLOTS}
                  userProfile={userProfile}
                  selectedClient={selectedClient}
                  onClientSelect={handleClientSelect}
                  onBackToClients={handleBackToClients}
                  clientActions={clientActions}
                  scheduleActions={scheduleActions}
                />
              </div>
            </LazyComponentWrapper>
          );
        // ADDED: Mileage tab for Grace coaches
        case 'mileage':
          return canAccessMileageTracking(userProfile) && (
            <MileageTracker 
              userProfile={userProfile}
              mileageActions={mileageActions}
              mileageRecords={mileageRecords}
            />
          );
        case 'resources':
          return <Resources userRole={userProfile?.role} />;
        default:
          return (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-2">Grace Coach Dashboard</h2>
                <p className="text-[#BED2D8]">Welcome, {userProfile?.name}! Manage Grace enrichment activities.</p>
              </div>
              
              <GraceClientDashboard 
                userProfile={userProfile} 
                clients={clients}
                graceAttendanceActions={graceAttendanceActions}
              />
            </div>
          );
      }
    }

    // Regular Client views (non-Grace)
    if (userProfile?.role === USER_ROLES.CLIENT) {
      switch (activeTab) {
        case 'dashboard':
          return (
            <ClientDashboard 
              userProfile={userProfile} 
              clients={clients} 
              schedules={schedules} 
              coaches={coaches} 
              timeSlots={TIME_SLOTS}
            />
          );
        case 'my-schedule':
          return (
            <ClientScheduleView 
              userProfile={userProfile} 
              clients={clients} 
              schedules={schedules} 
              coaches={coaches} 
              timeSlots={TIME_SLOTS}
            />
          );
        case 'my-goals':
          return (
            <ClientGoalsView 
              userProfile={userProfile} 
              clients={clients} 
            />
          );
        case 'my-tasks':
          return (
            <ClientTaskView 
              userProfile={userProfile} 
              clients={clients}
              taskActions={taskActions}
            />
          );
        case 'resources':
          return <Resources userRole={userProfile?.role} />;
        default:
          return (
            <ClientDashboard 
              userProfile={userProfile} 
              clients={clients} 
              schedules={schedules} 
              coaches={coaches} 
              timeSlots={TIME_SLOTS}
            />
          );
      }
    }

    // Success Coach and other staff views (Limitless/New Options/Bridges programs)
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            userProfile={userProfile}
            clients={clients}
            coaches={coaches}
            schedules={schedules}
            timeSlots={TIME_SLOTS}
            onClientSelect={handleClientSelect}
          />
        );
        
      case 'schedule':
        return (
          <LazyComponentWrapper>
            <MyScheduleTab 
              user={user}
              userProfile={userProfile}
              clients={clients}
              coaches={coaches}
              schedules={schedules}
              timeSlots={TIME_SLOTS}
              onClientSelect={handleClientSelect}
              scheduleActions={scheduleActions}
            />
          </LazyComponentWrapper>
        );
        
      case 'monthly-schedule':
        return (
          <LazyComponentWrapper>
            <MonthlyScheduleView 
              schedules={schedules}
              clients={clients}
              coaches={coaches}
              timeSlots={TIME_SLOTS}
              scheduleActions={scheduleActions}
            />
          </LazyComponentWrapper>
        );
        
      case 'clients':
        return (
          <LazyComponentWrapper>
            <ClientsTab 
              clients={clients}
              coaches={coaches}
              schedules={schedules}
              timeSlots={TIME_SLOTS}
              userProfile={userProfile}
              selectedClient={selectedClient}
              onClientSelect={handleClientSelect}
              onBackToClients={handleBackToClients}
              clientActions={clientActions}
              scheduleActions={scheduleActions}
            />
          </LazyComponentWrapper>
        );

      case 'grace-attendance':
        // Check if user can access Grace attendance
        if (!canAccessGraceAttendance(userProfile)) {
          return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
              <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
                <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                <p className="text-gray-600 mb-4">
                  You do not have permission to access Grace attendance tracking.
                </p>
              </div>
            </div>
          );
        }
        
        return (
          <GraceAttendancePage
            clients={clients}
            graceAttendanceActions={graceAttendanceActions}
          />
        );

      case 'daily-tasks':
        return (
          <DailyTaskScheduler 
            clients={clients}
            coaches={coaches}
            schedules={schedules}
            userProfile={userProfile}
            taskActions={taskActions}
            tasks={tasks} // Pass tasks directly
          />
        );

      // ADDED: Mileage tab for all coaches, admins, and schedulers
      case 'mileage':
        return canAccessMileageTracking(userProfile) && (
          <MileageTracker 
            userProfile={userProfile}
            mileageActions={mileageActions}
            mileageRecords={mileageRecords}
          />
        );
        
      case 'resources':
        return <Resources userRole={userProfile?.role} />;
        
      case 'admin':
        return userProfile?.role === USER_ROLES.ADMIN && (
          <LazyComponentWrapper>
            <AdminPanel 
              clients={clients}
              coaches={coaches}
              schedules={schedules}
              timeSlots={TIME_SLOTS}
              businessTypes={BUSINESS_TYPES}
              equipmentOptions={EQUIPMENT_OPTIONS}
              programs={PROGRAMS}
              coachTypes={COACH_TYPES}
              clientActions={clientActions}
              coachActions={coachActions}
              scheduleActions={scheduleActions}
              availabilityActions={availabilityActions}
            />
          </LazyComponentWrapper>
        );
        
      default:
        return (
          <Dashboard 
            userProfile={userProfile}
            clients={clients}
            coaches={coaches}
            schedules={schedules}
            timeSlots={TIME_SLOTS}
            onClientSelect={handleClientSelect}
          />
        );
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen bg-[#F5F5F5]">
        <Navigation 
          userProfile={userProfile}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          navigationItems={getNavigationItems()}
          onLogout={onLogout}
          onShowPasswordModal={handlePasswordModalShow}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        
        <main className="container mx-auto p-4">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            {renderContent()}
          </ErrorBoundary>
        </main>

        {/* Password Change Modal */}
        <PasswordChangeModal 
          isOpen={showPasswordModal}
          onClose={handlePasswordModalHide}
          user={user}
        />
      </div>
    </ErrorBoundary>
  );
};

export default AppLayout;