// src/components/client/ClientDashboard.jsx
import React from 'react';
import { Target, Building2, Clock } from 'lucide-react';
import { getPSTDate } from '../../utils/dateUtils';

const ClientDashboard = ({ userProfile, clients, schedules, coaches, timeSlots }) => {
  // Find the current client's data
  const clientData = clients.find(c => c.email === userProfile.email) || clients[0];
  
  if (!clientData) {
    return (
      <div className="text-center py-8">
        <p className="text-[#9B97A2]">No client data found. Please contact your coach.</p>
      </div>
    );
  }

  const today = getPSTDate();
  
  // Get today's sessions for this client
  const getTodaysSchedule = () => {
    return schedules.filter(s => 
      s.date === today && s.clientId === clientData.id
    );
  };

  const todaysSessions = getTodaysSchedule();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Welcome, {clientData.name}!</h2>
        <p className="text-[#BED2D8]">Your ITG Business Journey Dashboard</p>
      </div>

      {/* Current Goals and Business Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
            <Target className="mr-2 text-[#6D858E]" size={20} />
            Current Goals
          </h3>
          <div className="space-y-3">
            <p className="text-[#292929]">
              {clientData.currentGoals || 'Work with your coach to set specific business goals.'}
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#707070]">Overall Progress</span>
                <span className="text-[#292929]">{clientData.progress || 0}%</span>
              </div>
              <div className="w-full bg-[#F5F5F5] rounded-full h-3">
                <div 
                  className="bg-[#6D858E] h-3 rounded-full transition-all duration-300" 
                  style={{width: `${clientData.progress || 0}%`}}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
            <Building2 className="mr-2 text-[#6D858E]" size={20} />
            My Business
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-[#707070]">Business Name:</span>
              <p className="font-medium text-[#6D858E]">{clientData.businessName}</p>
            </div>
            <div>
              <span className="text-sm text-[#707070]">Business Type:</span>
              <p className="font-medium text-[#292929]">{clientData.jobGoal}</p>
            </div>
            <div>
              <span className="text-sm text-[#707070]">Equipment:</span>
              <p className="font-medium text-[#292929]">{clientData.equipment}</p>
            </div>
            {clientData.businessDescription && (
              <div>
                <span className="text-sm text-[#707070]">Description:</span>
                <p className="text-sm text-[#292929] bg-[#F5F5F5] p-2 rounded mt-1">
                  {clientData.businessDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
          <Clock className="mr-2 text-[#5A4E69]" size={20} />
          Today's Schedule
        </h3>
        {todaysSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {todaysSessions.map(session => {
              const slot = timeSlots.find(s => s.id === session.timeSlot);
              const coach = coaches.find(c => c.uid === session.coachId || c.id === session.coachId);
              return (
                <div key={session.id} className="bg-[#BED2D8] p-4 rounded-lg border border-[#6D858E]">
                  <h4 className="font-semibold text-[#292929]">{slot?.label}</h4>
                  <p className="text-[#6D858E]">with {coach?.name || 'Coach TBD'}</p>
                  <p className="text-sm text-[#707070] mt-2">
                    Ready to work on your business goals!
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-[#9B97A2]">
            <Clock size={48} className="mx-auto mb-2 text-[#9B97A2]" />
            <p>No sessions scheduled for today</p>
            <p className="text-sm">Check your weekly schedule below</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;