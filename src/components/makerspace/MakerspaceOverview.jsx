// src/components/makerspace/MakerspaceOverview.jsx
import React, { useState } from 'react';
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar, 
  TrendingUp,
  AlertTriangle,
  Package,
  BarChart3,
  Users
} from 'lucide-react';
import { getPSTDate, formatDatePST, getWeekDatesStartingMonday } from '../../utils/dateUtils';
import { 
  MAKERSPACE_TIME_SLOTS, 
  MAKERSPACE_EQUIPMENT, 
  EQUIPMENT_CATEGORIES,
  canAccessMakerspaceRequests 
} from '../../utils/constants';

const MakerspaceOverview = ({ 
  requests = [],
  schedule = [],
  walkthroughs = [],
  makerspaceActions,
  userProfile 
}) => {
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, 1 = next week, etc.

  const today = getPSTDate();
  const weekDates = getWeekDatesStartingMonday();
  const currentWeekStart = weekDates[0].toISOString().split('T')[0];
  const currentWeekEnd = weekDates[6].toISOString().split('T')[0];

  // Calculate statistics
  const stats = {
    totalRequests: requests.length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    approvedRequests: requests.filter(r => r.status === 'approved').length,
    declinedRequests: requests.filter(r => r.status === 'declined').length,
    todayScheduled: schedule.filter(s => s.date === today).length + walkthroughs.filter(w => w.date === today).length,
    thisWeekScheduled: schedule.filter(s => s.date >= currentWeekStart && s.date <= currentWeekEnd).length + 
                      walkthroughs.filter(w => w.date >= currentWeekStart && w.date <= currentWeekEnd).length,
    upcomingWalkthroughs: walkthroughs.filter(w => w.date >= today && w.status === 'scheduled').length
  };

  // Get recent activity
  const recentRequests = requests
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
    .slice(0, 5);

  const todayActivity = [
    ...schedule.filter(s => s.date === today).map(s => ({ ...s, type: 'work_session' })),
    ...walkthroughs.filter(w => w.date === today).map(w => ({ ...w, type: 'walkthrough' }))
  ].sort((a, b) => {
    const timeSlotOrder = MAKERSPACE_TIME_SLOTS.map(slot => slot.id);
    return timeSlotOrder.indexOf(a.timeSlot) - timeSlotOrder.indexOf(b.timeSlot);
  });

  // Equipment usage statistics
  const getEquipmentUsage = () => {
    const usage = {};
    
    // Count from approved requests
    requests.filter(r => r.status === 'approved').forEach(request => {
      request.equipment?.forEach(equipId => {
        const equipment = MAKERSPACE_EQUIPMENT.find(eq => eq.id === equipId);
        if (equipment) {
          usage[equipId] = (usage[equipId] || 0) + 1;
        }
      });
    });

    // Count from schedule entries
    schedule.forEach(entry => {
      entry.equipment?.forEach(equipId => {
        const equipment = MAKERSPACE_EQUIPMENT.find(eq => eq.id === equipId);
        if (equipment) {
          usage[equipId] = (usage[equipId] || 0) + 1;
        }
      });
    });

    return Object.entries(usage)
      .map(([equipId, count]) => ({
        equipment: MAKERSPACE_EQUIPMENT.find(eq => eq.id === equipId),
        count
      }))
      .filter(item => item.equipment)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const topEquipment = getEquipmentUsage();

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600',
      approved: 'text-green-600',
      declined: 'text-red-600',
      completed: 'text-blue-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const getActivityIcon = (type) => {
    return type === 'walkthrough' ? <User size={16} /> : <Wrench size={16} />;
  };

  const getActivityColor = (type) => {
    return type === 'walkthrough' 
      ? 'bg-blue-100 border-blue-300 text-blue-800'
      : 'bg-green-100 border-green-300 text-green-800';
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#707070]">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
            </div>
            <Clock className="text-yellow-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#707070]">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#707070]">Today's Sessions</p>
              <p className="text-2xl font-bold text-[#6D858E]">{stats.todayScheduled}</p>
            </div>
            <Calendar className="text-[#6D858E]" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#707070]">This Week</p>
              <p className="text-2xl font-bold text-[#5A4E69]">{stats.thisWeekScheduled}</p>
            </div>
            <TrendingUp className="text-[#5A4E69]" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#707070]">Walkthroughs</p>
              <p className="text-2xl font-bold text-blue-600">{stats.upcomingWalkthroughs}</p>
            </div>
            <Users className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#707070]">Total Requests</p>
              <p className="text-2xl font-bold text-[#292929]">{stats.totalRequests}</p>
            </div>
            <BarChart3 className="text-[#292929]" size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Activity */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-[#292929] flex items-center">
            <Calendar className="mr-2 text-[#6D858E]" size={20} />
            Today's Activity - {formatDatePST(today)}
          </h3>
          
          {todayActivity.length > 0 ? (
            <div className="space-y-3">
              {todayActivity.map((activity, index) => (
                <div 
                  key={`${activity.type}-${activity.id || index}`} 
                  className={`border rounded-lg p-3 ${getActivityColor(activity.type)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="font-medium">
                          {MAKERSPACE_TIME_SLOTS.find(slot => slot.id === activity.timeSlot)?.label}
                        </p>
                        <p className="text-sm">
                          {activity.clientName} - {activity.purpose || activity.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-white rounded">
                      {activity.type === 'walkthrough' ? 'WALKTHROUGH' : 'WORK SESSION'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#9B97A2]">
              <Wrench size={32} className="mx-auto mb-2" />
              <p>No makerspace activity scheduled for today</p>
            </div>
          )}
        </div>

        {/* Recent Requests */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#292929] flex items-center">
              <Clock className="mr-2 text-[#6D858E]" size={20} />
              Recent Requests
            </h3>
            {canAccessMakerspaceRequests(userProfile) && (
              <button className="text-[#6D858E] hover:text-[#5A4E69] text-sm">
                View All →
              </button>
            )}
          </div>
          
          {recentRequests.length > 0 ? (
            <div className="space-y-3">
              {recentRequests.map(request => (
                <div key={request.id} className="flex justify-between items-center p-3 bg-[#F5F5F5] rounded">
                  <div>
                    <p className="font-medium text-[#292929]">{request.clientName}</p>
                    <p className="text-sm text-[#707070]">
                      {formatDatePST(request.date)} - {request.purpose}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                      {request.status.toUpperCase()}
                    </span>
                    <p className="text-xs text-[#9B97A2]">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#9B97A2]">
              <AlertTriangle size={32} className="mx-auto mb-2" />
              <p>No recent requests</p>
            </div>
          )}
        </div>
      </div>

      {/* Equipment Usage and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Equipment Usage */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-[#292929] flex items-center">
            <Package className="mr-2 text-[#6D858E]" size={20} />
            Most Used Equipment
          </h3>
          
          {topEquipment.length > 0 ? (
            <div className="space-y-3">
              {topEquipment.map((item, index) => {
                const category = EQUIPMENT_CATEGORIES.find(cat => cat.id === item.equipment.category);
                return (
                  <div key={item.equipment.id} className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-[#9B97A2]">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-[#292929]">{item.equipment.label}</p>
                        <span className={`text-xs px-2 py-1 rounded ${category?.color || 'bg-gray-100 text-gray-800'}`}>
                          {category?.label || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#6D858E]">{item.count}</p>
                      <p className="text-xs text-[#9B97A2]">uses</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-[#9B97A2]">
              <Package size={32} className="mx-auto mb-2" />
              <p>No equipment usage data yet</p>
            </div>
          )}
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-[#292929] flex items-center">
            <AlertTriangle className="mr-2 text-[#6D858E]" size={20} />
            Alerts & Notifications
          </h3>
          
          <div className="space-y-3">
            {stats.pendingRequests > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <div className="flex items-center space-x-2">
                  <Clock className="text-yellow-600" size={16} />
                  <p className="text-sm text-yellow-800">
                    {stats.pendingRequests} request{stats.pendingRequests > 1 ? 's' : ''} awaiting review
                  </p>
                </div>
              </div>
            )}
            
            {stats.upcomingWalkthroughs > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <div className="flex items-center space-x-2">
                  <User className="text-blue-600" size={16} />
                  <p className="text-sm text-blue-800">
                    {stats.upcomingWalkthroughs} walkthrough{stats.upcomingWalkthroughs > 1 ? 's' : ''} scheduled
                  </p>
                </div>
              </div>
            )}
            
            {stats.todayScheduled === 0 && (
              <div className="bg-gray-50 border border-gray-200 p-3 rounded">
                <div className="flex items-center space-x-2">
                  <Calendar className="text-gray-600" size={16} />
                  <p className="text-sm text-gray-800">
                    No makerspace sessions scheduled for today
                  </p>
                </div>
              </div>
            )}
            
            {stats.pendingRequests === 0 && stats.upcomingWalkthroughs === 0 && stats.todayScheduled > 0 && (
              <div className="bg-green-50 border border-green-200 p-3 rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-600" size={16} />
                  <p className="text-sm text-green-800">
                    All caught up! No pending actions required.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions (for Kameron only) */}
      {canAccessMakerspaceRequests(userProfile) && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-[#292929]">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-[#6D858E] text-white p-4 rounded-lg hover:bg-[#5A4E69] text-center">
              <Wrench className="mx-auto mb-2" size={24} />
              <p className="text-sm">View Schedule</p>
            </button>
            <button className="bg-[#5A4E69] text-white p-4 rounded-lg hover:bg-[#292929] text-center">
              <Clock className="mx-auto mb-2" size={24} />
              <p className="text-sm">Review Requests</p>
            </button>
            <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 text-center">
              <User className="mx-auto mb-2" size={24} />
              <p className="text-sm">Add Walkthrough</p>
            </button>
            <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 text-center">
              <Package className="mx-auto mb-2" size={24} />
              <p className="text-sm">Equipment Status</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MakerspaceOverview;