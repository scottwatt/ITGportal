// src/components/admin/InternshipManagementPanel.jsx - Complete internship management for coaches/admins
import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Users, 
  Calendar, 
  Building, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Edit3,
  Trash2,
  Play,
  Pause,
  User,
  MapPin,
  Phone,
  Mail,
  Target,
  TrendingUp,
  Star,
  Eye,
  Download,
  FileText
} from 'lucide-react';
import { 
  INTERNSHIP_STATUS, 
  INTERNSHIP_TYPES, 
  INTERNSHIP_SCHEDULES,
  canManageInternships 
} from '../../utils/constants';
import { formatDatePST } from '../../utils/dateUtils';
import ClientInternshipsTab from '../internships/ClientInternshipsTab';

const InternshipManagementPanel = ({ 
  clients = [],
  internships = [],
  userProfile,
  internshipActions,
  canEdit = true 
}) => {
  const [activeView, setActiveView] = useState('overview');
  const [selectedClient, setSelectedClient] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  // Get Bridges clients only
  const bridgesClients = clients.filter(client => client.program === 'bridges');

  // Load overall stats
  useEffect(() => {
    loadOverallStats();
  }, [internships, bridgesClients]);

  const loadOverallStats = () => {
    const totalInternships = internships.length;
    const activeInternships = internships.filter(i => i.status === INTERNSHIP_STATUS.IN_PROGRESS).length;
    const completedInternships = internships.filter(i => i.status === INTERNSHIP_STATUS.COMPLETED).length;
    const plannedInternships = internships.filter(i => i.status === INTERNSHIP_STATUS.PLANNED).length;
    
    const totalDaysCompleted = internships.reduce((sum, i) => sum + (i.completedDays || 0), 0);
    const clientsWithInternships = [...new Set(internships.map(i => i.clientId))].length;
    
    // Calculate client completion rates
    const clientStats = bridgesClients.map(client => {
      const clientInternships = internships.filter(i => i.clientId === client.id);
      const completed = clientInternships.filter(i => i.status === INTERNSHIP_STATUS.COMPLETED).length;
      const inProgress = clientInternships.filter(i => i.status === INTERNSHIP_STATUS.IN_PROGRESS).length;
      const totalDays = clientInternships.reduce((sum, i) => sum + (i.completedDays || 0), 0);
      
      return {
        ...client,
        internshipCount: clientInternships.length,
        completedCount: completed,
        inProgressCount: inProgress,
        totalDaysCompleted: totalDays,
        isOnTrack: completed >= 1 || inProgress > 0, // Has at least 1 completed or active
        needsAttention: clientInternships.length === 0 || (completed === 0 && inProgress === 0)
      };
    });

    setStats({
      totalBridgesClients: bridgesClients.length,
      totalInternships,
      activeInternships,
      completedInternships,
      plannedInternships,
      totalDaysCompleted,
      clientsWithInternships,
      averageDaysPerInternship: totalInternships > 0 ? Math.round(totalDaysCompleted / totalInternships) : 0,
      completionRate: totalInternships > 0 ? Math.round((completedInternships / totalInternships) * 100) : 0,
      clientStats
    });
  };

  // Filter internships based on current filters
  const getFilteredInternships = () => {
    let filtered = internships;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(i => i.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(i => i.type === filterType);
    }

    return filtered;
  };

  const handleAddInternship = (client = null) => {
    setSelectedClient(client);
    setEditingInternship(null);
    setShowForm(true);
  };

  const handleEditInternship = (internship) => {
    const client = clients.find(c => c.id === internship.clientId);
    setSelectedClient(client);
    setEditingInternship(internship);
    setShowForm(true);
  };

  const handleDeleteInternship = async (internship) => {
    if (window.confirm(`Are you sure you want to delete the internship at ${internship.companyName}?`)) {
      try {
        await internshipActions.remove(internship.id);
        alert('Internship deleted successfully');
      } catch (error) {
        alert('Error deleting internship: ' + error.message);
      }
    }
  };

  const handleStartInternship = async (internship) => {
    if (window.confirm(`Start the internship at ${internship.companyName}?`)) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await internshipActions.start(internship.id, today);
        alert('Internship started successfully');
      } catch (error) {
        alert('Error starting internship: ' + error.message);
      }
    }
  };

  const handleCompleteInternship = async (internship) => {
    if (window.confirm(`Mark the internship at ${internship.companyName} as completed?`)) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await internshipActions.complete(internship.id, today);
        alert('Internship completed successfully');
      } catch (error) {
        alert('Error completing internship: ' + error.message);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case INTERNSHIP_STATUS.PLANNED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case INTERNSHIP_STATUS.IN_PROGRESS:
        return 'bg-green-100 text-green-800 border-green-200';
      case INTERNSHIP_STATUS.COMPLETED:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case INTERNSHIP_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case INTERNSHIP_STATUS.PLANNED:
        return 'Planned';
      case INTERNSHIP_STATUS.IN_PROGRESS:
        return 'In Progress';
      case INTERNSHIP_STATUS.COMPLETED:
        return 'Completed';
      case INTERNSHIP_STATUS.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const filteredInternships = getFilteredInternships();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-6 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Briefcase className="mr-2" size={28} />
              Internship Management
            </h2>
            <p className="text-[#BED2D8]">Manage Bridges program internships and track client progress</p>
          </div>
          
          {canEdit && canManageInternships(userProfile) && (
            <button
              onClick={() => handleAddInternship()}
              className="bg-white text-[#5A4E69] px-4 py-2 rounded-md hover:bg-gray-100 flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Internship</span>
            </button>
          )}
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.totalBridgesClients || 0}</div>
            <div className="text-sm text-[#BED2D8]">Bridges Clients</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.totalInternships || 0}</div>
            <div className="text-sm text-[#BED2D8]">Total Internships</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.activeInternships || 0}</div>
            <div className="text-sm text-[#BED2D8]">Active Now</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.completedInternships || 0}</div>
            <div className="text-sm text-[#BED2D8]">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.completionRate || 0}%</div>
            <div className="text-sm text-[#BED2D8]">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-[#F5F5F5]">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'clients', label: 'Client Progress', icon: Users },
              { id: 'internships', label: 'All Internships', icon: Briefcase },
              { id: 'reports', label: 'Reports', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeView === tab.id
                    ? 'border-[#5A4E69] text-[#5A4E69]'
                    : 'border-transparent text-[#9B97A2] hover:text-[#707070] hover:border-[#9B97A2]'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeView === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-[#292929]">Program Overview</h3>
              
              {/* Active Internships */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                  <Play className="mr-2" size={18} />
                  Active Internships ({stats.activeInternships || 0})
                </h4>
                
                {internships.filter(i => i.status === INTERNSHIP_STATUS.IN_PROGRESS).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {internships
                      .filter(i => i.status === INTERNSHIP_STATUS.IN_PROGRESS)
                      .slice(0, 4)
                      .map(internship => {
                        const client = clients.find(c => c.id === internship.clientId);
                        const progress = ((internship.completedDays || 0) / (internship.totalBusinessDays || 30)) * 100;
                        
                        return (
                          <div key={internship.id} className="bg-white border border-green-300 rounded p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium text-[#292929]">{client?.name}</div>
                                <div className="text-sm text-[#707070]">{internship.companyName}</div>
                              </div>
                              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-[#707070] mt-1">
                              {internship.completedDays || 0} / {internship.totalBusinessDays || 30} days
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-green-700">No active internships at this time.</p>
                )}
              </div>

              {/* Clients Needing Attention */}
              {stats.clientStats && stats.clientStats.filter(c => c.needsAttention).length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                    <AlertCircle className="mr-2" size={18} />
                    Clients Needing Attention ({stats.clientStats.filter(c => c.needsAttention).length})
                  </h4>
                  
                  <div className="space-y-2">
                    {stats.clientStats
                      .filter(c => c.needsAttention)
                      .slice(0, 5)
                      .map(client => (
                        <div key={client.id} className="flex justify-between items-center bg-white p-3 rounded border border-yellow-300">
                          <div>
                            <div className="font-medium text-[#292929]">{client.name}</div>
                            <div className="text-sm text-[#707070]">
                              {client.internshipCount === 0 ? 'No internships yet' : 'No active or completed internships'}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddInternship(client)}
                            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                          >
                            Add Internship
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Recent Completions */}
              {internships.filter(i => i.status === INTERNSHIP_STATUS.COMPLETED).length > 0 && (
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                    <CheckCircle className="mr-2" size={18} />
                    Recent Completions
                  </h4>
                  
                  <div className="space-y-2">
                    {internships
                      .filter(i => i.status === INTERNSHIP_STATUS.COMPLETED)
                      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                      .slice(0, 3)
                      .map(internship => {
                        const client = clients.find(c => c.id === internship.clientId);
                        
                        return (
                          <div key={internship.id} className="bg-white p-3 rounded border border-purple-300">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-[#292929]">{client?.name}</div>
                                <div className="text-sm text-[#707070]">
                                  {internship.companyName} • {internship.completedDays || 0} days completed
                                </div>
                              </div>
                              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                                ✅ Completed
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Client Progress Tab */}
          {activeView === 'clients' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-[#292929]">Client Progress Overview</h3>
                <div className="text-sm text-[#707070]">
                  {bridgesClients.length} Bridges clients
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {bridgesClients.map(client => {
                  const clientInternships = internships.filter(i => i.clientId === client.id);
                  const completed = clientInternships.filter(i => i.status === INTERNSHIP_STATUS.COMPLETED).length;
                  const inProgress = clientInternships.filter(i => i.status === INTERNSHIP_STATUS.IN_PROGRESS).length;
                  const planned = clientInternships.filter(i => i.status === INTERNSHIP_STATUS.PLANNED).length;
                  const totalDays = clientInternships.reduce((sum, i) => sum + (i.completedDays || 0), 0);
                  const currentInternship = clientInternships.find(i => i.status === INTERNSHIP_STATUS.IN_PROGRESS);
                  
                  return (
                    <div key={client.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-[#292929]">{client.name}</h4>
                          <p className="text-sm text-[#707070]">{client.email}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAddInternship(client)}
                            className="bg-[#5A4E69] text-white px-3 py-1 rounded text-sm hover:bg-[#292929]"
                          >
                            Add Internship
                          </button>
                          <button
                            onClick={() => setSelectedClient(client)}
                            className="bg-[#6D858E] text-white px-3 py-1 rounded text-sm hover:bg-[#5A4E69]"
                          >
                            View Details
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#5A4E69]">{completed}</div>
                          <div className="text-xs text-[#707070]">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{inProgress}</div>
                          <div className="text-xs text-[#707070]">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{planned}</div>
                          <div className="text-xs text-[#707070]">Planned</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#292929]">{totalDays}</div>
                          <div className="text-xs text-[#707070]">Total Days</div>
                        </div>
                      </div>

                      {/* Progress toward 3 internships requirement */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Internship Progress</span>
                          <span>{completed}/3 completed</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#5A4E69] h-2 rounded-full" 
                            style={{ width: `${Math.min((completed / 3) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Current internship status */}
                      {currentInternship ? (
                        <div className="bg-green-50 border border-green-200 p-3 rounded">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-green-800">Current: {currentInternship.companyName}</div>
                              <div className="text-sm text-green-700">
                                {currentInternship.completedDays || 0} / {currentInternship.totalBusinessDays || 30} days
                              </div>
                            </div>
                            <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">
                              In Progress
                            </span>
                          </div>
                        </div>
                      ) : completed >= 3 ? (
                        <div className="bg-purple-50 border border-purple-200 p-3 rounded">
                          <div className="text-center text-purple-800 font-medium">
                            🎉 Internship Requirement Complete!
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                          <div className="text-center text-yellow-800">
                            {clientInternships.length === 0 ? 'No internships started' : 'Ready for next internship'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Internships Tab */}
          {activeView === 'internships' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-[#292929]">All Internships</h3>
                
                <div className="flex items-center space-x-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border rounded text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value={INTERNSHIP_STATUS.PLANNED}>Planned</option>
                    <option value={INTERNSHIP_STATUS.IN_PROGRESS}>In Progress</option>
                    <option value={INTERNSHIP_STATUS.COMPLETED}>Completed</option>
                    <option value={INTERNSHIP_STATUS.CANCELLED}>Cancelled</option>
                  </select>
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border rounded text-sm"
                  >
                    <option value="all">All Types</option>
                    {INTERNSHIP_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredInternships.length > 0 ? (
                  filteredInternships.map(internship => {
                    const client = clients.find(c => c.id === internship.clientId);
                    const progress = ((internship.completedDays || 0) / (internship.totalBusinessDays || 30)) * 100;
                    
                    return (
                      <div key={internship.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-[#292929]">
                                {internship.companyName}
                              </h4>
                              <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(internship.status)}`}>
                                {getStatusLabel(internship.status)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-[#707070]">Client</div>
                                <div className="font-medium">{client?.name}</div>
                              </div>
                              <div>
                                <div className="text-[#707070]">Position</div>
                                <div className="font-medium">{internship.position}</div>
                              </div>
                              <div>
                                <div className="text-[#707070]">Type</div>
                                <div className="font-medium">
                                  {INTERNSHIP_TYPES.find(t => t.id === internship.type)?.label || internship.type}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleEditInternship(internship)}
                              className="text-[#6D858E] hover:text-[#5A4E69] p-1"
                              title="Edit internship"
                            >
                              <Edit3 size={16} />
                            </button>
                            
                            {internship.status === INTERNSHIP_STATUS.PLANNED && (
                              <button
                                onClick={() => handleStartInternship(internship)}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Start internship"
                              >
                                <Play size={16} />
                              </button>
                            )}
                            
                            {internship.status === INTERNSHIP_STATUS.IN_PROGRESS && (
                              <button
                                onClick={() => handleCompleteInternship(internship)}
                                className="text-purple-600 hover:text-purple-800 p-1"
                                title="Complete internship"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            
                            {internship.status === INTERNSHIP_STATUS.PLANNED && (
                              <button
                                onClick={() => handleDeleteInternship(internship)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete internship"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress bar for active internships */}
                        {internship.status === INTERNSHIP_STATUS.IN_PROGRESS && (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{internship.completedDays || 0} / {internship.totalBusinessDays || 30} days</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Contact information */}
                        {(internship.contactPerson || internship.contactEmail || internship.contactPhone) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-sm text-[#707070] mb-1">Contact Information:</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              {internship.contactPerson && (
                                <div className="flex items-center space-x-1">
                                  <User size={14} />
                                  <span>{internship.contactPerson}</span>
                                </div>
                              )}
                              {internship.contactEmail && (
                                <div className="flex items-center space-x-1">
                                  <Mail size={14} />
                                  <span>{internship.contactEmail}</span>
                                </div>
                              )}
                              {internship.contactPhone && (
                                <div className="flex items-center space-x-1">
                                  <Phone size={14} />
                                  <span>{internship.contactPhone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-[#9B97A2]">
                    <Briefcase size={48} className="mx-auto mb-4" />
                    <h4 className="text-lg font-medium mb-2">No Internships Found</h4>
                    <p>No internships match the current filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeView === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-[#292929]">Internship Reports</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Program Summary */}
                <div className="bg-[#F5F5F5] p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-[#292929] mb-4">Program Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Bridges Clients:</span>
                      <span className="font-medium">{stats.totalBridgesClients || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clients with Internships:</span>
                      <span className="font-medium">{stats.clientsWithInternships || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Internships:</span>
                      <span className="font-medium">{stats.totalInternships || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate:</span>
                      <span className="font-medium">{stats.completionRate || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Days per Internship:</span>
                      <span className="font-medium">{stats.averageDaysPerInternship || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-[#F5F5F5] p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-[#292929] mb-4">Status Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                        Planned
                      </span>
                      <span className="font-medium">{stats.plannedInternships || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        In Progress
                      </span>
                      <span className="font-medium">{stats.activeInternships || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                        Completed
                      </span>
                      <span className="font-medium">{stats.completedInternships || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-white border border-[#9B97A2] p-4 rounded-lg">
                <h4 className="font-semibold text-[#292929] mb-3">Export Options</h4>
                <div className="flex space-x-3">
                  <button className="bg-[#6D858E] text-white px-4 py-2 rounded hover:bg-[#5A4E69] flex items-center space-x-2">
                    <Download size={16} />
                    <span>Export All Data</span>
                  </button>
                  <button className="bg-[#9B97A2] text-white px-4 py-2 rounded hover:bg-[#707070] flex items-center space-x-2">
                    <FileText size={16} />
                    <span>Generate Report</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b bg-[#5A4E69] text-white">
              <h3 className="text-lg font-semibold">
                {selectedClient.name} - Internship Management
              </h3>
              <button 
                onClick={() => setSelectedClient(null)} 
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <ClientInternshipsTab
                client={selectedClient}
                userProfile={userProfile}
                internshipActions={internshipActions}
                canEdit={canManageInternships(userProfile)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Internship Form would go here - you can reuse the form from ClientInternshipsTab */}
    </div>
  );
};

export default InternshipManagementPanel;