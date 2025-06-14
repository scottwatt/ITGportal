// src/components/shared/Dashboard.jsx - Enhanced with coordinator requests and title animations
import React from 'react';
import { Building2, User, Clock, TrendingUp, Car, AlertCircle, Calendar, Wrench, Briefcase, ClipboardList } from 'lucide-react';
import { getPSTDate, formatDatePST } from '../../utils/dateUtils';
import { getSchedulableClients, safeFilter } from '../../utils/helpers';
import { getOrderedGroupedSchedule } from '../../utils/scheduleHelpers';
import { MILEAGE_FORMATS, USER_ROLES, MAKERSPACE_TIME_SLOTS, getCoordinatorById } from '../../utils/constants';
import { useGlobalTheme } from '../../contexts/GlobalThemeContext';

const Dashboard = ({
  userProfile,
  clients = [], // Default to empty array
  coaches = [], // Default to empty array
  schedules = [], // Default to empty array
  timeSlots = [], // Default to empty array
  onClientSelect,
  mileageRecords = [], // Add mileage records prop
  makerspaceRequests = [], // NEW: Add coordinator requests
  onNavigate // NEW: Add navigation handler for quick actions
}) => {
  const today = getPSTDate();
  const { getCurrentTheme, currentTheme } = useGlobalTheme();
  
  // Get today's schedule based on user role with safe filtering
  const getTodaysSchedule = () => {
    if (!Array.isArray(schedules)) return [];
    
    if (userProfile?.role === 'admin') {
      return schedules.filter(s => s?.date === today);
    }
    return schedules.filter(s => s?.date === today && s?.coachId === userProfile?.uid);
  };

  const myTodaySchedule = getTodaysSchedule();
  
  // Filter clients to exclude Grace clients from general stats since they don't use daily scheduling
  const schedulableClients = getSchedulableClients(clients);

  // Get properly ordered and grouped schedule with safe data
  const orderedSchedule = getOrderedGroupedSchedule(myTodaySchedule, clients, coaches);

  // Calculate average progress with safe array operations
  const averageProgress = Array.isArray(clients) && clients.length > 0 
    ? Math.round(clients.reduce((acc, client) => acc + (client?.progress || 0), 0) / clients.length)
    : 0;

  // Safe coach filtering
  const totalCoaches = safeFilter(coaches, c => c?.role === 'coach').length;
  const successCoaches = safeFilter(coaches, c => (c?.coachType || 'success') === 'success').length;
  const graceCoaches = safeFilter(coaches, c => c?.coachType === 'grace').length;
  const graceClientsCount = safeFilter(clients, c => c?.program === 'grace').length;

  // Calculate monthly mileage for current user (if they have mileage access)
  const getCurrentMonthMileage = () => {
    if (!Array.isArray(mileageRecords) || !userProfile?.uid) return 0;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const monthlyMiles = mileageRecords
      .filter(record => {
        if (record.coachId !== userProfile.uid) return false;
        const recordDate = new Date(record.date);
        return recordDate.getMonth() + 1 === currentMonth && recordDate.getFullYear() === currentYear;
      })
      .reduce((total, record) => total + (record.mileage || 0), 0);
    
    return monthlyMiles;
  };

  const currentMonthMiles = getCurrentMonthMileage();
  const canTrackMileage = ['coach', 'admin', 'scheduler'].includes(userProfile?.role);

  // NEW: Get pending coordinator requests for current user
  const getMyPendingRequests = () => {
    if (!Array.isArray(makerspaceRequests) || !userProfile?.role) return [];
    
    // Map user roles to coordinator types
    const roleToCoordinatorType = {
      [USER_ROLES.MERCHANDISE_COORDINATOR]: 'makerspace',
      [USER_ROLES.VOCATIONAL_DEV_COORDINATOR]: 'vocational', 
      [USER_ROLES.ADMIN_DEV_COORDINATOR]: 'admin'
    };
    
    const myCoordinatorType = roleToCoordinatorType[userProfile.role];
    if (!myCoordinatorType) return [];
    
    return makerspaceRequests.filter(request => 
      request.coordinatorType === myCoordinatorType && 
      request.status === 'pending'
    ).sort((a, b) => new Date(a.requestedAt) - new Date(b.requestedAt)); // Oldest first
  };

  const myPendingRequests = getMyPendingRequests();

  // NEW: Get coordinator info for display
  const getMyCoordinatorInfo = () => {
    const roleToCoordinatorType = {
      [USER_ROLES.MERCHANDISE_COORDINATOR]: 'makerspace',
      [USER_ROLES.VOCATIONAL_DEV_COORDINATOR]: 'vocational', 
      [USER_ROLES.ADMIN_DEV_COORDINATOR]: 'admin'
    };
    
    const myCoordinatorType = roleToCoordinatorType[userProfile?.role];
    return myCoordinatorType ? getCoordinatorById(myCoordinatorType) : null;
  };

  const myCoordinatorInfo = getMyCoordinatorInfo();

  // NEW: Get coordinator icon
  const getCoordinatorIcon = (coordinatorType) => {
    switch (coordinatorType) {
      case 'makerspace': return <Wrench size={20} className="text-blue-600" />;
      case 'vocational': return <Briefcase size={20} className="text-green-600" />;
      case 'admin': return <ClipboardList size={20} className="text-purple-600" />;
      default: return <AlertCircle size={20} className="text-yellow-600" />;
    }
  };

  // Get holiday-specific dashboard title with animations
  const getDashboardTitle = () => {
    const baseTitle = `ITG ${userProfile?.role === 'scheduler' ? 'Scheduler' : 'Coach'} Dashboard`;
    
    switch (currentTheme) {
      case 'christmas':
        return (
          <span className="flex items-center">
            {baseTitle}
            <span className="ml-2 christmas-title-sparkle">🎄</span>
            <span className="ml-1 christmas-snow-text">❄️</span>
          </span>
        );
      case 'halloween':
        return (
          <span className="flex items-center">
            {baseTitle}
            <span className="ml-2 halloween-bob">🎃</span>
            <span className="ml-1 halloween-float">👻</span>
          </span>
        );
      case 'fourthOfJuly':
        return (
          <span className="flex items-center">
            {baseTitle}
            <span className="ml-2 fourth-july-wave-flag">🇺🇸</span>
            <span className="ml-1 fourth-july-sparkle">✨</span>
          </span>
        );
      case 'stPatricks':
        return (
          <span className="flex items-center">
            {baseTitle}
            <span className="ml-2 stpatricks-spin">🍀</span>
            <span className="ml-1 stpatricks-rainbow">🌈</span>
          </span>
        );
      case 'valentine':
        return (
          <span className="flex items-center">
            {baseTitle}
            <span className="ml-2 valentine-heartbeat">💕</span>
            <span className="ml-1 valentine-float">💖</span>
          </span>
        );
      case 'thanksgiving':
        return (
          <span className="flex items-center">
            {baseTitle}
            <span className="ml-2 thanksgiving-bob">🦃</span>
            <span className="ml-1 thanksgiving-leaf-fall">🍂</span>
          </span>
        );
      default:
        return baseTitle;
    }
  };

  // Get holiday greeting for dashboard
  const getDashboardGreeting = () => {
    switch (currentTheme) {
      case 'christmas':
        return 'Supporting adult entrepreneurs with Christmas spirit! 🎁';
      case 'halloween':
        return 'Spooktacularly supporting adult entrepreneurs with disabilities! 🦇';
      case 'fourthOfJuly':
        return 'Celebrating independence through entrepreneurship! 🎆';
      case 'stPatricks':
        return 'Finding the luck of the entrepreneurial Irish! 🍀';
      case 'valentine':
        return 'Supporting adult entrepreneurs with love and care! 💝';
      case 'thanksgiving':
        return 'Grateful for our amazing entrepreneurial community! 🙏';
      default:
        return 'Supporting adults with disabilities in their development journey';
    }
  };

  // NEW: Render coordinator pending requests section
  const renderCoordinatorRequests = () => {
    if (myPendingRequests.length === 0 || !myCoordinatorInfo) return null;

    const coordinatorType = myCoordinatorInfo.id;
    const requestTabMap = {
      'makerspace': 'makerspace-requests',
      'vocational': 'vocational-requests', 
      'admin': 'admin-requests'
    };

    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getCoordinatorIcon(coordinatorType)}
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">
                🔔 You have {myPendingRequests.length} pending request{myPendingRequests.length !== 1 ? 's' : ''}!
              </h3>
              <p className="text-sm text-yellow-700">
                Client{myPendingRequests.length !== 1 ? 's have' : ' has'} requested time with you for {myCoordinatorInfo.name.toLowerCase()}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate && onNavigate(requestTabMap[coordinatorType])}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors text-sm font-medium"
          >
            Review Requests
          </button>
        </div>

        <div className="space-y-3">
          {myPendingRequests.slice(0, 3).map(request => {
            const timeSlot = MAKERSPACE_TIME_SLOTS.find(slot => slot.id === request.timeSlot);
            const isUpcoming = new Date(request.date) >= new Date(today);
            
            return (
              <div key={request.id} className="bg-white p-3 rounded border border-yellow-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <User size={14} className="text-yellow-600" />
                      <span className="font-medium text-gray-900">{request.clientName}</span>
                      {isUpcoming && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          Upcoming
                        </span>
                      )}
                      {!isUpcoming && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                          Past Date
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Calendar size={12} />
                          <span>{formatDatePST(request.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={12} />
                          <span>{timeSlot?.label || request.timeSlot}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Purpose: {request.purpose}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Requested: {new Date(request.requestedAt).toLocaleDateString()} at {new Date(request.requestedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {myPendingRequests.length > 3 && (
            <div className="text-center">
              <button
                onClick={() => onNavigate && onNavigate(requestTabMap[coordinatorType])}
                className="text-yellow-700 hover:text-yellow-800 text-sm font-medium"
              >
                View all {myPendingRequests.length} requests →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Get theme-aware gradient
  const themeData = getCurrentTheme();
  const getHeaderStyle = () => {
    return {
      background: `linear-gradient(135deg, ${themeData.colors.primary} 0%, ${themeData.colors.secondary} 100%)`,
    };
  };

  return (
    <div className="space-y-6">
      <div className="text-white p-6 rounded-lg" style={getHeaderStyle()}>
        <h2 className="text-2xl font-bold mb-2">
          {getDashboardTitle()}
        </h2>
        <p style={{ color: themeData.colors.accent }}>
          {getDashboardGreeting()}
        </p>
      </div>

      {/* NEW: Coordinator Pending Requests Section */}
      {renderCoordinatorRequests()}
      
      {/* Stats Cards - Updated with mileage if applicable */}
      <div className={`grid grid-cols-1 md:grid-cols-${canTrackMileage ? '5' : '4'} gap-6`}>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#707070]">Scheduled Clients</p>
              <p className="text-3xl font-bold text-[#6D858E]">{schedulableClients.length}</p>
            </div>
            <Building2 className="text-[#6D858E]" size={40} />
          </div>
          <div className="mt-2 text-xs text-[#9B97A2]">
            <div>Grace: {graceClientsCount} (separate)</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#707070]">Active Coaches</p>
              <p className="text-3xl font-bold text-[#6D858E]">{totalCoaches}</p>
            </div>
            <User className="text-[#6D858E]" size={40} />
          </div>
          <div className="mt-2 text-xs text-[#9B97A2]">
            <div>Success: {successCoaches}</div>
            <div>Grace: {graceCoaches}</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#707070]">Today's Sessions</p>
              <p className="text-3xl font-bold text-[#5A4E69]">{myTodaySchedule.length}</p>
            </div>
            <Clock className="text-[#5A4E69]" size={40} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#707070]">Avg. Progress</p>
              <p className="text-3xl font-bold text-[#5A4E69]">{averageProgress}%</p>
            </div>
            <TrendingUp className="text-[#5A4E69]" size={40} />
          </div>
        </div>

        {/* Mileage Card - Only show for coaches, admins, and schedulers */}
        {canTrackMileage && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#707070]">This Month Miles</p>
                <p className="text-3xl font-bold text-[#5A4E69]">
                  {currentMonthMiles.toFixed(MILEAGE_FORMATS.DISPLAY)}
                </p>
              </div>
              <Car className="text-[#5A4E69]" size={40} />
            </div>
            <div className="mt-2 text-xs text-[#9B97A2]">
              <div>Exact precision for billing</div>
            </div>
          </div>
        )}
      </div>

      {/* Today's Schedule with proper grouping and ordering */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-[#292929]">
          Today's Schedule - {formatDatePST(today)}
        </h3>
        {Array.isArray(orderedSchedule) && orderedSchedule.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {orderedSchedule.map(timeSlot => (
              <div key={timeSlot.id} className="border rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-2 text-[#292929]">{timeSlot.label}</h4>
                <div className="space-y-3">
                  {Array.isArray(timeSlot.coachGroups) && timeSlot.coachGroups.length > 0 ? (
                    timeSlot.coachGroups.map((coachGroup, index) => (
                      <div key={`${timeSlot.id}-${coachGroup.coach?.uid || coachGroup.coach?.id || index}`} 
                           className="bg-[#BED2D8] p-3 rounded">
                        {/* Coach Header */}
                        <p className="font-medium text-[#292929] mb-2">
                          {coachGroup.coach?.name || 'Unknown Coach'}
                        </p>
                        
                        {/* Clients for this coach */}
                        <div className="space-y-1">
                          {Array.isArray(coachGroup.clients) && coachGroup.clients.map(client => (
                            <div key={client.id} className="text-sm">
                              <p 
                                className="text-[#6D858E] cursor-pointer hover:text-[#5A4E69] hover:underline font-medium"
                                onClick={() => onClientSelect && onClientSelect(client)}
                                title="Click to view client details"
                              >
                                {client.name}
                              </p>
                              <div className="flex justify-between items-center">
                                <p 
                                  className="text-xs text-[#707070] cursor-pointer hover:text-[#292929] hover:underline"
                                  onClick={() => onClientSelect && onClientSelect(client)}
                                  title="Click to view client details"
                                >
                                  {client.program === 'limitless' ? client.businessName :
                                   client.program === 'new-options' ? 'Community Job' :
                                   client.program === 'bridges' ? 'Career Dev' :
                                   client.businessName}
                                </p>
                                <span className={`text-xs px-1 rounded ${
                                  client.program === 'limitless' ? 'bg-white text-[#6D858E]' :
                                  client.program === 'new-options' ? 'bg-white text-[#6D858E]' :
                                  client.program === 'bridges' ? 'bg-white text-[#5A4E69]' :
                                  'bg-white text-[#9B97A2]'
                                }`}>
                                  {client.program === 'limitless' ? 'L' :
                                   client.program === 'new-options' ? 'NO' :
                                   client.program === 'bridges' ? 'B' :
                                   'L'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#9B97A2] italic text-sm">No sessions scheduled</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#9B97A2]">
            <Clock size={48} className="mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No Sessions Scheduled</h4>
            <p>No sessions scheduled for today.</p>
          </div>
        )}
      </div>

      {/* Quick Mileage Summary - Only for users who can track mileage */}
      {canTrackMileage && mileageRecords.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-[#292929] flex items-center">
            <Car className="mr-2 text-[#6D858E]" size={24} />
            Recent Mileage Activity
          </h3>
          <div className="space-y-2">
            {mileageRecords
              .filter(record => record.coachId === userProfile.uid)
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 3)
              .map(record => (
                <div key={record.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-[#292929]">
                      {record.startLocation} → {record.endLocation}
                    </p>
                    <p className="text-xs text-[#707070]">{record.purpose}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#5A4E69]">
                      {record.mileage.toFixed(MILEAGE_FORMATS.DISPLAY)} mi
                    </p>
                    <p className="text-xs text-[#9B97A2]">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
          </div>
          {mileageRecords.filter(record => record.coachId === userProfile.uid).length === 0 && (
            <p className="text-center text-[#9B97A2] py-4">No mileage records yet this month</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;