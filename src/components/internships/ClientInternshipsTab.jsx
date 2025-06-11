// src/components/internships/ClientInternshipsTab.jsx - Enhanced with Admin Controls

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
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
  RotateCcw,
  Shield,
  XCircle
} from 'lucide-react';
import { 
  INTERNSHIP_STATUS, 
  INTERNSHIP_TYPES, 
  INTERNSHIP_SCHEDULES,
  canManageInternships 
} from '../../utils/constants';
import { formatDatePST } from '../../utils/dateUtils';

const ClientInternshipsTab = ({ 
  client, 
  userProfile,
  internshipActions,
  canEdit = false 
}) => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);
  const [showDayLog, setShowDayLog] = useState(null);
  const [stats, setStats] = useState({});

  // Check if user is admin (can delete and unmark)
  const isAdmin = userProfile?.role === 'admin' || userProfile?.permissions?.includes('manage_internships');

  // Load internships for this client
  useEffect(() => {
    if (internshipActions && client.id) {
      loadInternships();
      loadStats();
    }
  }, [client.id, internshipActions]);

  const loadInternships = async () => {
    try {
      setLoading(true);
      const clientInternships = await internshipActions.getForClient(client.id);
      setInternships(clientInternships);
    } catch (error) {
      console.error('Error loading internships:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const clientStats = await internshipActions.getClientStats(client.id);
      setStats(clientStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAddInternship = () => {
    setEditingInternship(null);
    setShowForm(true);
  };

  const handleEditInternship = (internship) => {
    setEditingInternship(internship);
    setShowForm(true);
  };

  // ENHANCED: Admin can delete any internship, regular users only planned ones
  const handleDeleteInternship = async (internship) => {
    const isAdminDelete = isAdmin && internship.status !== INTERNSHIP_STATUS.PLANNED;
    
    let confirmMessage;
    if (isAdminDelete) {
      confirmMessage = `⚠️ ADMIN DELETE: Permanently delete this ${internship.status} internship?\n\nCompany: ${internship.companyName}\nStatus: ${getStatusLabel(internship.status)}\n\nThis action CANNOT be undone!`;
    } else {
      confirmMessage = `Are you sure you want to delete the internship at ${internship.companyName}?`;
    }
    
    if (window.confirm(confirmMessage)) {
      // Double confirmation for admin deletes of non-planned internships
      if (isAdminDelete) {
        const secondConfirm = window.confirm('Are you absolutely sure? This will permanently delete the internship record.');
        if (!secondConfirm) return;
      }
      
      try {
        await internshipActions.remove(internship.id);
        await loadInternships();
        await loadStats();
        alert('Internship deleted successfully');
      } catch (error) {
        alert('Error deleting internship: ' + error.message);
      }
    }
  };

  // NEW: Admin function to unmark as complete
  const handleUnmarkComplete = async (internship) => {
    if (!isAdmin) {
      alert('Only admins can unmark completed internships');
      return;
    }

    if (window.confirm(`Unmark internship at ${internship.companyName} as completed?\n\nThis will reset it to "In Progress" status and adjust the completed days.`)) {
      try {
        // Reset to in_progress with ~80% of the days completed
        const resetDays = Math.floor((internship.totalBusinessDays || 30) * 0.8);
        
        await internshipActions.update(internship.id, {
          status: INTERNSHIP_STATUS.IN_PROGRESS,
          completedAt: null,
          completedDays: resetDays,
          actualEndDate: null
        });
        
        await loadInternships();
        await loadStats();
        alert(`Internship unmarked as completed and reset to "In Progress" with ${resetDays} days completed`);
      } catch (error) {
        alert('Error unmarking internship: ' + error.message);
      }
    }
  };

  const handleStartInternship = async (internship) => {
    if (window.confirm(`Start the internship at ${internship.companyName}?`)) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await internshipActions.start(internship.id, today);
        await loadInternships();
        await loadStats();
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
        await loadInternships();
        await loadStats();
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

  const getTypeLabel = (typeId) => {
    const type = INTERNSHIP_TYPES.find(t => t.id === typeId);
    return type ? type.label : typeId;
  };

  const getScheduleLabel = (scheduleId) => {
    const schedule = INTERNSHIP_SCHEDULES.find(s => s.id === scheduleId);
    return schedule ? schedule.label : scheduleId;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A4E69] mx-auto"></div>
        <p className="text-[#707070] mt-2">Loading internships...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-6 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold mb-2 flex items-center">
              <Briefcase className="mr-2" size={24} />
              {client.name}'s Internship Journey
            </h3>
            <p className="text-[#BED2D8]">Bridges Program - Career Development through Work Experience</p>
          </div>
          
          {canEdit && canManageInternships(userProfile) && (
            <button
              onClick={handleAddInternship}
              className="bg-white text-[#5A4E69] px-4 py-2 rounded-md hover:bg-gray-100 flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Internship</span>
            </button>
          )}
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <div className="text-sm text-[#BED2D8]">Total Internships</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.completed || 0}</div>
            <div className="text-sm text-[#BED2D8]">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.totalDaysCompleted || 0}</div>
            <div className="text-sm text-[#BED2D8]">Days Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.inProgress > 0 ? '✓' : '○'}</div>
            <div className="text-sm text-[#BED2D8]">Currently Active</div>
          </div>
        </div>
      </div>

      {/* Admin Controls Notice */}
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-amber-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">Admin Controls Available</h4>
              <p className="text-sm text-amber-700">You can delete any internship and unmark completed ones if needed.</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Internship Highlight */}
      {stats.currentInternship && (
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h4 className="text-lg font-semibold text-[#292929] mb-2 flex items-center">
            <Clock className="mr-2 text-green-600" size={20} />
            Current Internship
          </h4>
          <InternshipCard 
            internship={stats.currentInternship}
            onEdit={canEdit ? handleEditInternship : null}
            onDelete={canEdit ? handleDeleteInternship : null}
            onStart={canEdit ? handleStartInternship : null}
            onComplete={canEdit ? handleCompleteInternship : null}
            onUnmarkComplete={isAdmin ? handleUnmarkComplete : null}
            onDayLog={() => setShowDayLog(stats.currentInternship)}
            isHighlighted={true}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* Internships List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-lg font-semibold text-[#292929] mb-4">All Internships</h4>
        
        {internships.length === 0 ? (
          <div className="text-center py-12 text-[#9B97A2]">
            <Briefcase size={48} className="mx-auto mb-4" />
            <h5 className="text-lg font-medium mb-2">No Internships Yet</h5>
            <p className="text-sm mb-4">
              Bridges participants complete 3 internships of 30 business days each
            </p>
            {canEdit && canManageInternships(userProfile) && (
              <button
                onClick={handleAddInternship}
                className="bg-[#5A4E69] text-white px-6 py-2 rounded-md hover:bg-[#292929]"
              >
                Add First Internship
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {internships.map(internship => (
              <InternshipCard
                key={internship.id}
                internship={internship}
                onEdit={canEdit ? handleEditInternship : null}
                onDelete={canEdit ? handleDeleteInternship : null}
                onStart={canEdit ? handleStartInternship : null}
                onComplete={canEdit ? handleCompleteInternship : null}
                onUnmarkComplete={isAdmin ? handleUnmarkComplete : null}
                onDayLog={() => setShowDayLog(internship)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Internship Form Modal */}
      {showForm && (
        <InternshipForm
          client={client}
          internship={editingInternship}
          onSave={async (internshipData) => {
            try {
              if (editingInternship) {
                await internshipActions.update(editingInternship.id, internshipData);
              } else {
                await internshipActions.add({ ...internshipData, clientId: client.id });
              }
              setShowForm(false);
              setEditingInternship(null);
              await loadInternships();
              await loadStats();
              alert('Internship saved successfully');
            } catch (error) {
              alert('Error saving internship: ' + error.message);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingInternship(null);
          }}
        />
      )}

      {/* Day Log Modal */}
      {showDayLog && (
        <InternshipDayLog
          internship={showDayLog}
          onSave={async (dayData) => {
            try {
              await internshipActions.markDay(showDayLog.id, dayData.date, dayData);
              setShowDayLog(null);
              await loadInternships();
              await loadStats();
              alert('Day logged successfully');
            } catch (error) {
              alert('Error logging day: ' + error.message);
            }
          }}
          onClose={() => setShowDayLog(null)}
        />
      )}
    </div>
  );
};

// Enhanced Individual Internship Card Component
const InternshipCard = ({ 
  internship, 
  onEdit, 
  onDelete, 
  onStart, 
  onComplete, 
  onUnmarkComplete,
  onDayLog,
  isHighlighted = false,
  isAdmin = false
}) => {
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

  const progressPercentage = ((internship.completedDays || 0) / (internship.totalBusinessDays || 30)) * 100;

  return (
    <div className={`border rounded-lg p-4 ${isHighlighted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[#5A4E69]'} transition-colors`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h5 className="text-lg font-semibold text-[#292929]">{internship.companyName}</h5>
            <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(internship.status)}`}>
              {getStatusLabel(internship.status)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center text-[#707070]">
                <User size={14} className="mr-2" />
                <span>{internship.position}</span>
              </div>
              
              <div className="flex items-center text-[#707070]">
                <Building size={14} className="mr-2" />
                <span>{INTERNSHIP_TYPES.find(t => t.id === internship.type)?.label || internship.type}</span>
              </div>
              
              <div className="flex items-center text-[#707070]">
                <Calendar size={14} className="mr-2" />
                <span>
                  {internship.startDate} 
                  {internship.endDate && ` - ${internship.endDate}`}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              {internship.contactPerson && (
                <div className="flex items-center text-[#707070]">
                  <User size={14} className="mr-2" />
                  <span>{internship.contactPerson}</span>
                </div>
              )}
              
              {internship.contactPhone && (
                <div className="flex items-center text-[#707070]">
                  <Phone size={14} className="mr-2" />
                  <span>{internship.contactPhone}</span>
                </div>
              )}
              
              {internship.contactEmail && (
                <div className="flex items-center text-[#707070]">
                  <Mail size={14} className="mr-2" />
                  <span>{internship.contactEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* ENHANCED: Action buttons with admin controls */}
        <div className="flex flex-col space-y-2 ml-4">
          {onEdit && (
            <button
              onClick={() => onEdit(internship)}
              className="text-[#6D858E] hover:text-[#5A4E69] p-1"
              title="Edit internship"
            >
              <Edit3 size={16} />
            </button>
          )}
          
          {/* ENHANCED: Regular delete (planned only) or admin delete (any status) */}
          {onDelete && (internship.status === INTERNSHIP_STATUS.PLANNED || isAdmin) && (
            <button
              onClick={() => onDelete(internship)}
              className={`p-1 ${isAdmin && internship.status !== INTERNSHIP_STATUS.PLANNED 
                ? 'text-red-700 hover:text-red-900' 
                : 'text-red-600 hover:text-red-800'}`}
              title={isAdmin && internship.status !== INTERNSHIP_STATUS.PLANNED 
                ? "Admin: Delete any internship" 
                : "Delete planned internship"}
            >
              <Trash2 size={16} />
            </button>
          )}

          {/* NEW: Admin unmark complete button */}
          {onUnmarkComplete && isAdmin && internship.status === INTERNSHIP_STATUS.COMPLETED && (
            <button
              onClick={() => onUnmarkComplete(internship)}
              className="text-amber-600 hover:text-amber-800 p-1"
              title="Admin: Unmark as completed"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#707070]">Progress</span>
          <span className="text-[#292929] font-medium">
            {internship.completedDays || 0} / {internship.totalBusinessDays || 30} days
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-[#5A4E69] h-3 rounded-full transition-all duration-300" 
            style={{width: `${Math.min(progressPercentage, 100)}%`}}
          ></div>
        </div>
      </div>

      {/* Description */}
      {internship.description && (
        <div className="mb-4">
          <p className="text-sm text-[#707070] bg-gray-50 p-3 rounded">
            {internship.description}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {onStart && internship.status === INTERNSHIP_STATUS.PLANNED && (
          <button
            onClick={() => onStart(internship)}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
          >
            <Play size={14} />
            <span>Start</span>
          </button>
        )}
        
        {onComplete && internship.status === INTERNSHIP_STATUS.IN_PROGRESS && (
          <button
            onClick={() => onComplete(internship)}
            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 flex items-center space-x-1"
          >
            <CheckCircle size={14} />
            <span>Complete</span>
          </button>
        )}
        
        {onDayLog && internship.status === INTERNSHIP_STATUS.IN_PROGRESS && (
          <button
            onClick={onDayLog}
            className="bg-[#5A4E69] text-white px-3 py-1 rounded text-sm hover:bg-[#292929] flex items-center space-x-1"
          >
            <Calendar size={14} />
            <span>Log Day</span>
          </button>
        )}

        {/* NEW: Admin controls section */}
        {isAdmin && (internship.status === INTERNSHIP_STATUS.COMPLETED || internship.status !== INTERNSHIP_STATUS.PLANNED) && (
          <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-gray-300">
            {internship.status === INTERNSHIP_STATUS.COMPLETED && onUnmarkComplete && (
              <button
                onClick={() => onUnmarkComplete(internship)}
                className="bg-amber-600 text-white px-3 py-1 rounded text-sm hover:bg-amber-700 flex items-center space-x-1"
                title="Admin: Unmark as completed"
              >
                <RotateCcw size={14} />
                <span>Unmark</span>
              </button>
            )}
            
            {internship.status !== INTERNSHIP_STATUS.PLANNED && onDelete && (
              <button
                onClick={() => onDelete(internship)}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center space-x-1"
                title="Admin: Delete internship"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Completion Info */}
      {internship.status === INTERNSHIP_STATUS.COMPLETED && internship.completedAt && (
        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
          <div className="flex items-center space-x-2 text-sm text-purple-800">
            <CheckCircle className="w-4 h-4" />
            <span>Completed on {formatDatePST(internship.completedAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Internship Form Component (unchanged)
const InternshipForm = ({ client, internship, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    companyName: internship?.companyName || '',
    contactPerson: internship?.contactPerson || '',
    contactEmail: internship?.contactEmail || '',
    contactPhone: internship?.contactPhone || '',
    position: internship?.position || '',
    type: internship?.type || '',
    description: internship?.description || '',
    startDate: internship?.startDate || '',
    endDate: internship?.endDate || '',
    totalBusinessDays: internship?.totalBusinessDays || 30,
    schedule: internship?.schedule || '',
    workingDays: internship?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    timeSlots: internship?.timeSlots || [],
    skills: internship?.skills || [],
    notes: internship?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleWorkingDayChange = (day, isChecked) => {
    if (isChecked) {
      setFormData({
        ...formData,
        workingDays: [...formData.workingDays, day]
      });
    } else {
      setFormData({
        ...formData,
        workingDays: formData.workingDays.filter(d => d !== day)
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b bg-[#5A4E69] text-white">
          <h3 className="text-lg font-semibold">
            {internship ? 'Edit' : 'Add'} Internship for {client.name}
          </h3>
          <button onClick={onCancel} className="text-white hover:text-gray-200 text-2xl">
            ×
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Position/Job Title *</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                />
              </div>
            </div>

            {/* Type and Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Industry Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                  required
                >
                  <option value="">Select Type</option>
                  {INTERNSHIP_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Schedule Pattern *</label>
                <select
                  value={formData.schedule}
                  onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                  required
                >
                  <option value="">Select Schedule</option>
                  {INTERNSHIP_SCHEDULES.map(schedule => (
                    <option key={schedule.id} value={schedule.id}>{schedule.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates and Days */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Estimated End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Total Business Days</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.totalBusinessDays}
                  onChange={(e) => setFormData({...formData, totalBusinessDays: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                />
              </div>
            </div>

            {/* Working Days */}
            <div>
              <label className="block text-sm font-medium mb-2">Working Days</label>
              <div className="grid grid-cols-7 gap-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <label key={day} className="flex items-center space-x-1 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.workingDays.includes(day)}
                      onChange={(e) => handleWorkingDayChange(day, e.target.checked)}
                      className="rounded"
                    />
                    <span className="capitalize">{day.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Job Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                rows="3"
                placeholder="Describe the internship role and responsibilities..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                rows="2"
                placeholder="Additional notes or special considerations..."
              />
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="submit"
                className="bg-[#5A4E69] text-white px-6 py-2 rounded hover:bg-[#292929]"
              >
                {internship ? 'Update' : 'Create'} Internship
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Day Log Component (unchanged)
const InternshipDayLog = ({ internship, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    completed: true,
    hours: 8,
    notes: '',
    skills: [],
    supervisor: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b bg-[#5A4E69] text-white">
          <h3 className="text-lg font-semibold">Log Internship Day</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl">
            ×
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Hours Worked</label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData({...formData, hours: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Supervisor/Contact</label>
              <input
                type="text"
                value={formData.supervisor}
                onChange={(e) => setFormData({...formData, supervisor: e.target.value})}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                placeholder="Who supervised or worked with the intern today?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Day Summary</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#5A4E69]"
                rows="4"
                placeholder="Describe what the intern did today, skills practiced, achievements, or challenges..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.completed}
                onChange={(e) => setFormData({...formData, completed: e.target.checked})}
                className="rounded"
              />
              <label className="text-sm">Mark this day as completed toward the 30-day requirement</label>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="submit"
                className="bg-[#5A4E69] text-white px-6 py-2 rounded hover:bg-[#292929]"
              >
                Save Day Log
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientInternshipsTab;