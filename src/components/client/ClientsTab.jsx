// src/components/client/ClientsTab.jsx - FIXED with internship props
import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import ClientDetail from './ClientDetail';
import { getPSTDate } from '../../utils/dateUtils';
import { getClientInitials } from '../../utils/helpers';

const ClientsTab = ({ 
  clients,
  coaches,
  schedules,
  timeSlots,
  userProfile,
  selectedClient,
  onClientSelect,
  onBackToClients,
  clientActions,
  scheduleActions,
  internships = [], // ADD: Accept internships prop
  internshipActions // ADD: Accept internshipActions prop
}) => {
  const [clientFilter, setClientFilter] = useState('all');
  
  if (selectedClient) {
    return (
      <ClientDetail 
        client={selectedClient} 
        onBack={onBackToClients}
        clientActions={clientActions}
        scheduleActions={scheduleActions}
        timeSlots={timeSlots}
        coaches={coaches}
        internships={internships} // ADD: Pass internships to ClientDetail
        internshipActions={internshipActions} // ADD: Pass internshipActions to ClientDetail
        userProfile={userProfile} // ADD: Pass userProfile (was missing!)
      />
    );
  }

  // Filter clients based on selected program
  const filteredClients = clientFilter === 'all' 
    ? clients 
    : clients.filter(client => (client.program || 'limitless') === clientFilter);

  const today = getPSTDate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-[#292929]">All Clients</h2>
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-[#9B97A2]" />
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
          >
            <option value="all">All Programs</option>
            <option value="limitless">Limitless</option>
            <option value="new-options">New Options</option>
            <option value="bridges">Bridges</option>
            <option value="grace">Grace</option>
          </select>
          <div className="flex space-x-2 text-sm">
            <span className="bg-[#BED2D8] text-[#292929] px-2 py-1 rounded">
              Limitless: {clients.filter(c => (c.program || 'limitless') === 'limitless').length}
            </span>
            <span className="bg-[#BED2D8] text-[#292929] px-2 py-1 rounded">
              New Options: {clients.filter(c => c.program === 'new-options').length}
            </span>
            <span className="bg-[#BED2D8] text-[#292929] px-2 py-1 rounded">
              Bridges: {clients.filter(c => c.program === 'bridges').length}
            </span>
            <span className="bg-[#F5F5F5] text-[#292929] px-2 py-1 rounded">
              Grace: {clients.filter(c => c.program === 'grace').length}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => {
          const todaySchedule = scheduleActions.getTodaysScheduleForClient(client.id, today);
          const todayCoach = todaySchedule.length > 0 ? 
            coaches.find(c => c.uid === todaySchedule[0].coachId || c.id === todaySchedule[0].coachId) : null;
          
          // ADD: Get internship info for Bridges clients
          const clientInternships = internships.filter(i => i.clientId === client.id);
          const activeInternship = clientInternships.find(i => i.status === 'in_progress');
          const completedInternships = clientInternships.filter(i => i.status === 'completed').length;
          
          return (
            <div 
              key={client.id} 
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onClientSelect(client)}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0 h-12 w-12 bg-[#6D858E] rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-medium">
                    {getClientInitials(client.name)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#292929]">{client.name}</h3>
                  <p className="text-[#707070]">
                    {client.program === 'limitless' ? (client.businessName || client.jobGoal) :
                     client.program === 'new-options' ? (client.jobGoal || 'Community Job Focus') :
                     client.program === 'bridges' ? (client.jobGoal || 'Career Development') :
                     client.program === 'grace' ? 'Enrichment Program' :
                     (client.businessName || client.jobGoal)}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      client.program === 'limitless' ? 'bg-[#BED2D8] text-[#292929]' :
                      client.program === 'new-options' ? 'bg-[#BED2D8] text-[#292929]' :
                      client.program === 'bridges' ? 'bg-[#BED2D8] text-[#292929]' :
                      client.program === 'grace' ? 'bg-[#F5F5F5] text-[#292929]' :
                      'bg-[#BED2D8] text-[#292929]'
                    }`}>
                      {client.program === 'limitless' ? 'Limitless' :
                       client.program === 'new-options' ? 'New Options' :
                       client.program === 'bridges' ? 'Bridges' :
                       client.program === 'grace' ? 'Grace' :
                       'Limitless'}
                    </span>
                    {todayCoach && (
                      <p className="text-sm text-[#6D858E]">Today with: {todayCoach.name}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#707070]">
                      {client.program === 'limitless' ? 'Business Progress' :
                       client.program === 'new-options' ? 'Job Readiness' :
                       client.program === 'bridges' ? 'Skill Development' :
                       client.program === 'grace' ? 'Program Progress' :
                       'Progress'}
                    </span>
                    <span className="text-[#292929]">{client.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-[#F5F5F5] rounded-full h-2">
                    <div 
                      className="bg-[#6D858E] h-2 rounded-full" 
                      style={{width: `${client.progress || 0}%`}}
                    ></div>
                  </div>
                </div>
                
                {/* ADD: Show internship info for Bridges clients */}
                {client.program === 'bridges' && (
                  <div className="bg-[#5A4E69] bg-opacity-10 p-3 rounded border-l-4 border-[#5A4E69]">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#5A4E69] font-medium">Internships:</span>
                      <span className="text-[#292929]">{completedInternships}/3 completed</span>
                    </div>
                    {activeInternship ? (
                      <div className="mt-1 text-xs text-[#5A4E69]">
                        🏢 {activeInternship.companyName} ({activeInternship.completedDays || 0}/{activeInternship.totalBusinessDays || 30} days)
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-[#707070]">
                        {completedInternships > 0 ? 'Ready for next internship' : 'No active internship'}
                      </div>
                    )}
                  </div>
                )}
                
                {client.equipment && client.program === 'limitless' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#707070]">Equipment:</span>
                    <span className="font-medium text-[#292929]">{client.equipment}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-[#707070]">Status:</span>
                  <span className="font-medium text-[#6D858E]">{client.status || 'Active'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-8 text-[#9B97A2]">
          <p>No clients found for the selected program filter!</p>
        </div>
      )}
    </div>
  );
};

export default ClientsTab;