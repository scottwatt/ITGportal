// src/components/client/ClientDashboard.jsx - Updated with all coordinator request status
import React from 'react';
import { Target, Building2, Clock, User, Wrench, AlertCircle, CheckCircle, Briefcase, ClipboardList } from 'lucide-react';
import { getPSTDate, formatDatePST } from '../../utils/dateUtils';
import { MAKERSPACE_TIME_SLOTS, getCoordinatorById } from '../../utils/constants';

const ClientDashboard = ({ 
  userProfile, 
  clients, 
  schedules, 
  coaches, 
  timeSlots,
  makerspaceRequests = [] // Now contains all coordinator requests (makerspace, vocational, admin)
}) => {
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

  // Get client's coordinator requests (all types)
  const clientCoordinatorRequests = makerspaceRequests.filter(req => 
    req.clientId === clientData.id
  ).sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

  const pendingRequests = clientCoordinatorRequests.filter(req => req.status === 'pending');
  const upcomingApprovedRequests = clientCoordinatorRequests.filter(req => 
    req.status === 'approved' && req.date >= today
  ).slice(0, 3);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-600" size={16} />;
      case 'approved':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'declined':
        return <AlertCircle className="text-red-600" size={16} />;
      default:
        return <Clock className="text-gray-600" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCoordinatorIcon = (coordinatorType) => {
    switch (coordinatorType) {
      case 'makerspace':
        return <Wrench className="text-blue-600" size={16} />;
      case 'vocational':
        return <Briefcase className="text-green-600" size={16} />;
      case 'admin':
        return <ClipboardList className="text-purple-600" size={16} />;
      default:
        return <User className="text-gray-600" size={16} />;
    }
  };

  const getCoordinatorName = (coordinatorType) => {
    const coordinator = getCoordinatorById(coordinatorType);
    return coordinator?.coordinatorName || 'Coordinator';
  };

  // Determine if client should see coordinator requests section
  const shouldShowCoordinatorRequests = () => {
    // Grace clients don't use coordinator scheduling
    if (clientData.program === 'grace') return false;
    return true;
  };

  const getCoordinatorSectionTitle = () => {
    if (clientData.program === 'limitless') {
      return 'Makerspace & Coordinator Sessions';
    }
    return 'Coordinator Sessions';
  };

  const getNoRequestsMessage = () => {
    if (clientData.program === 'limitless') {
      return {
        title: 'No coordinator requests yet',
        subtitle: 'Use the "Schedule Time" tab to book sessions with coordinators including makerspace time, vocational coaching, and administrative support'
      };
    }
    return {
      title: 'No coordinator requests yet', 
      subtitle: 'Use the "Schedule Time" tab to book sessions with vocational development and administrative coordinators'
    };
  };

  const getQuickActionMessage = () => {
    const availableServices = [];
    if (clientData.program === 'limitless') {
      availableServices.push('makerspace time with equipment access');
    }
    if (['limitless', 'new-options', 'bridges'].includes(clientData.program)) {
      availableServices.push('vocational development coaching');
      availableServices.push('administrative support');
    }
    
    return `Need personalized support? Request sessions for ${availableServices.join(', ')}.`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Welcome, {clientData.name}!</h2>
        <p className="text-[#BED2D8]">
          {clientData.program === 'grace' ? 'Your Grace Enrichment Program Dashboard' :
           clientData.program === 'bridges' ? 'Your Career Development Journey Dashboard' : 
           'Your ITG Business Journey Dashboard'}
        </p>
      </div>

      {/* Current Goals and Program Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
            <Target className="mr-2 text-[#6D858E]" size={20} />
            Current Goals
          </h3>
          <div className="space-y-3">
            <p className="text-[#292929]">
              {clientData.currentGoals || `Work with your coach to set specific ${
                clientData.program === 'grace' ? 'enrichment program' :
                clientData.program === 'bridges' ? 'career development' : 
                'program'
              } goals.`}
            </p>
            {/* Only show progress bar for non-Grace clients */}
            {clientData.program !== 'grace' && (
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
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
            {clientData.program === 'grace' ? (
              <>
                <User className="mr-2 text-[#6D858E]" size={20} />
                My Grace Program
              </>
            ) : clientData.program === 'bridges' ? (
              <>
                <User className="mr-2 text-[#6D858E]" size={20} />
                My Career Development
              </>
            ) : (
              <>
                <Building2 className="mr-2 text-[#6D858E]" size={20} />
                My Business
              </>
            )}
          </h3>
          <div className="space-y-2">
            {/* Show different info based on program */}
            {clientData.program === 'grace' ? (
              <>
                {clientData.jobGoal && (
                  <div>
                    <span className="text-sm text-[#707070]">Enrichment Activities:</span>
                    <p className="font-medium text-[#6D858E]">{clientData.jobGoal}</p>
                  </div>
                )}
                {clientData.businessDescription && (
                  <div>
                    <span className="text-sm text-[#707070]">Program Goals:</span>
                    <p className="text-sm text-[#292929] bg-[#F5F5F5] p-2 rounded mt-1">
                      {clientData.businessDescription}
                    </p>
                  </div>
                )}
              </>
            ) : clientData.program === 'bridges' ? (
              <>
                <div>
                  <span className="text-sm text-[#707070]">Career Goals:</span>
                  <p className="font-medium text-[#6D858E]">{clientData.jobGoal}</p>
                </div>
                {clientData.businessDescription && (
                  <div>
                    <span className="text-sm text-[#707070]">Development Plan:</span>
                    <p className="text-sm text-[#292929] bg-[#F5F5F5] p-2 rounded mt-1">
                      {clientData.businessDescription}
                    </p>
                  </div>
                )}
              </>
            ) : clientData.program === 'limitless' ? (
              <>
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
              </>
            ) : clientData.program === 'new-options' ? (
              <>
                <div>
                  <span className="text-sm text-[#707070]">Job Interest:</span>
                  <p className="font-medium text-[#6D858E]">{clientData.jobGoal}</p>
                </div>
                {clientData.businessDescription && (
                  <div>
                    <span className="text-sm text-[#707070]">Job Description:</span>
                    <p className="text-sm text-[#292929] bg-[#F5F5F5] p-2 rounded mt-1">
                      {clientData.businessDescription}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <span className="text-sm text-[#707070]">Program:</span>
                <p className="font-medium text-[#292929]">{clientData.program || 'Limitless'}</p>
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
                    {clientData.program === 'grace' ? 
                      'Ready for your enrichment activities!' :
                      clientData.program === 'bridges' ? 
                      'Ready to work on your career development!' :
                      'Ready to work on your business goals!'
                    }
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

      {/* Coordinator Requests Status - Show for all programs except Grace */}
      {shouldShowCoordinatorRequests() && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
            <Clock className="mr-2 text-[#6D858E]" size={20} />
            {getCoordinatorSectionTitle()}
          </h3>
          
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-[#292929] mb-2">Pending Requests</h4>
              <div className="space-y-2">
                {pendingRequests.map(request => (
                  <div key={request.id} className={`p-3 rounded-lg border ${getStatusColor(request.status)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCoordinatorIcon(request.coordinatorType)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">
                              {formatDatePST(request.date)} - {MAKERSPACE_TIME_SLOTS.find(slot => slot.id === request.timeSlot)?.label}
                            </p>
                            <span className="text-xs px-2 py-1 bg-white rounded">
                              {getCoordinatorName(request.coordinatorType)}
                            </span>
                          </div>
                          <p className="text-sm">{request.purpose}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-white rounded">
                        Under Review
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Approved Sessions */}
          {upcomingApprovedRequests.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-[#292929] mb-2">Upcoming Sessions</h4>
              <div className="space-y-2">
                {upcomingApprovedRequests.map(request => (
                  <div key={request.id} className={`p-3 rounded-lg border ${getStatusColor(request.status)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCoordinatorIcon(request.coordinatorType)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">
                              {formatDatePST(request.date)} - {MAKERSPACE_TIME_SLOTS.find(slot => slot.id === request.timeSlot)?.label}
                            </p>
                            <span className="text-xs px-2 py-1 bg-white rounded">
                              {getCoordinatorName(request.coordinatorType)}
                            </span>
                          </div>
                          <p className="text-sm">{request.purpose}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-white rounded">
                        Approved
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No requests message */}
          {clientCoordinatorRequests.length === 0 && (
            <div className="text-center py-6 text-[#9B97A2]">
              <Clock size={48} className="mx-auto mb-2" />
              <p>{getNoRequestsMessage().title}</p>
              <p className="text-sm">{getNoRequestsMessage().subtitle}</p>
            </div>
          )}

          {/* Quick action */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-[#707070] mb-3">
              {getQuickActionMessage()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;