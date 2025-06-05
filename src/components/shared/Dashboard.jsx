// src/components/shared/Dashboard.jsx - Updated with proper grouping and ordering
import React from 'react';
import { Building2, User, Clock, TrendingUp } from 'lucide-react';
import { getPSTDate, formatDatePST } from '../../utils/dateUtils';
import { getSchedulableClients } from '../../utils/helpers';
import { getOrderedGroupedSchedule } from '../../utils/scheduleHelpers';

const Dashboard = ({
  userProfile,
  clients,
  coaches,
  schedules,
  timeSlots,
  onClientSelect
}) => {
  const today = getPSTDate();
  
  // Get today's schedule based on user role
  const getTodaysSchedule = () => {
    if (userProfile?.role === 'admin') {
      return schedules.filter(s => s.date === today);
    }
    return schedules.filter(s => s.date === today && s.coachId === userProfile?.uid);
  };

  const myTodaySchedule = getTodaysSchedule();
  
  // Filter clients to exclude Grace clients from general stats since they don't use daily scheduling
  const schedulableClients = getSchedulableClients(clients);

  // UPDATED: Get properly ordered and grouped schedule
  const orderedSchedule = getOrderedGroupedSchedule(myTodaySchedule, clients, coaches);

  // Calculate average progress
  const averageProgress = clients.length > 0 
    ? Math.round(clients.reduce((acc, client) => acc + (client.progress || 0), 0) / clients.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">
          ITG {userProfile?.role === 'scheduler' ? 'Scheduler' : 'Coach'} Dashboard
        </h2>
        <p className="text-[#BED2D8]">Supporting adults with disabilities in their development journey</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#707070]">Scheduled Clients</p>
              <p className="text-3xl font-bold text-[#6D858E]">{schedulableClients.length}</p>
            </div>
            <Building2 className="text-[#6D858E]" size={40} />
          </div>
          <div className="mt-2 text-xs text-[#9B97A2]">
            <div>Grace: {clients.filter(c => c.program === 'grace').length} (separate)</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#707070]">Active Coaches</p>
              <p className="text-3xl font-bold text-[#6D858E]">
                {coaches.filter(c => c.role === 'coach').length}
              </p>
            </div>
            <User className="text-[#6D858E]" size={40} />
          </div>
          <div className="mt-2 text-xs text-[#9B97A2]">
            <div>Success: {coaches.filter(c => (c.coachType || 'success') === 'success').length}</div>
            <div>Grace: {coaches.filter(c => c.coachType === 'grace').length}</div>
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
      </div>

      {/* UPDATED: Today's Schedule with proper grouping and ordering */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-[#292929]">
          Today's Schedule - {formatDatePST(today)}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {orderedSchedule.map(timeSlot => (
            <div key={timeSlot.id} className="border rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-2 text-[#292929]">{timeSlot.label}</h4>
              <div className="space-y-3">
                {timeSlot.coachGroups.length > 0 ? (
                  timeSlot.coachGroups.map((coachGroup, index) => (
                    <div key={`${timeSlot.id}-${coachGroup.coach?.uid || coachGroup.coach?.id || index}`} 
                         className="bg-[#BED2D8] p-3 rounded">
                      {/* Coach Header */}
                      <p className="font-medium text-[#292929] mb-2">
                        {coachGroup.coach?.name || 'Unknown Coach'}
                      </p>
                      
                      {/* Clients for this coach */}
                      <div className="space-y-1">
                        {coachGroup.clients.map(client => (
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
      </div>
    </div>
  );
};

export default Dashboard;