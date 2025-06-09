// src/components/shared/Dashboard.jsx - Fixed with defensive programming and exact mileage display
import React from 'react';
import { Building2, User, Clock, TrendingUp, Car } from 'lucide-react';
import { getPSTDate, formatDatePST } from '../../utils/dateUtils';
import { getSchedulableClients, safeFilter } from '../../utils/helpers';
import { getOrderedGroupedSchedule } from '../../utils/scheduleHelpers';
import { MILEAGE_FORMATS } from '../../utils/constants';

const Dashboard = ({
  userProfile,
  clients = [], // Default to empty array
  coaches = [], // Default to empty array
  schedules = [], // Default to empty array
  timeSlots = [], // Default to empty array
  onClientSelect,
  mileageRecords = [] // Add mileage records prop
}) => {
  const today = getPSTDate();
  
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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">
          ITG {userProfile?.role === 'scheduler' ? 'Scheduler' : 'Coach'} Dashboard
        </h2>
        <p className="text-[#BED2D8]">Supporting adults with disabilities in their development journey</p>
      </div>
      
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