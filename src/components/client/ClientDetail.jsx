// src/components/client/ClientDetail.jsx - Updated to simplify Grace clients, not Bridges

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  FileText, 
  Plus, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Trash2, 
  Target,
  Building2,
  Clock,
  ExternalLink,
  Eye,
  Download,
  FolderOpen,
  Briefcase
} from 'lucide-react';
import { formatDatePST, getWeekDatesStartingMonday } from '../../utils/dateUtils';
import { getFileIcon, formatWorkingDays, formatAvailableTimeSlots } from '../../utils/helpers';
import { useSharedDrive } from '../../hooks/useSharedDrive';
import { canManageInternships } from '../../utils/constants';
import ClientInternshipsTab from '../internships/ClientInternshipsTab';

const ClientDetail = ({ 
  client, 
  onBack, 
  clientActions,
  scheduleActions, 
  timeSlots, 
  coaches,
  internshipActions,
  userProfile
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [progress, setProgress] = useState(client.progress || 0);
  const [notes, setNotes] = useState(client.notes || '');
  const [sessionNotes, setSessionNotes] = useState(client.sessionNotes || '');
  const [currentGoals, setCurrentGoals] = useState(client.currentGoals || '');
  const [isDragging, setIsDragging] = useState(false);
  const [clientFiles, setClientFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const fileInputRef = useRef(null);
  
  // Google Workspace Shared Drive hook
  const {
    isInitialized,
    isAuthenticated,
    isAvailable,
    loading: driveLoading,
    error: driveError,
    uploadProgress,
    currentUser,
    authenticate,
    listClientFiles,
    uploadFileToClient,
    uploadMultipleFiles,
    deleteClientFile,
    getFileUrls,
    shareClientFolder,
    clearError,
    isFileTypeAllowed,
    isFileSizeValid,
    formatFileSize
  } = useSharedDrive();
  
  // Update local state when client data changes from real-time updates
  useEffect(() => {
    // Only update progress for non-Grace clients
    if (client.program !== 'grace') {
      setProgress(client.progress || 0);
    }
    setNotes(client.notes || '');
    setSessionNotes(client.sessionNotes || '');
    setCurrentGoals(client.currentGoals || '');
  }, [client.id, client.progress, client.notes, client.sessionNotes, client.currentGoals, client.program]);

  // Load files when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadClientFiles();
      if (client.email) {
        shareClientFolder(client.id, client.name, client.email).catch(err => {
          console.warn('Could not auto-share folder:', err);
        });
      }
    }
  }, [isAuthenticated, client.id, client.name]);

  /**
   * Load files from client's Google Workspace Shared Drive folder
   */
  const loadClientFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const files = await listClientFiles(client.id, client.name);
      setClientFiles(files);
      console.log(`📁 Loaded ${files.length} files for ${client.name} from shared drive`);
    } catch (error) {
      console.error('Failed to load client files:', error);
      if (error.message.includes('Not authenticated')) {
        console.log('Authentication required - user must click Connect button');
      }
    } finally {
      setIsLoadingFiles(false);
    }
  };

  /**
   * Handle Google Drive authentication with user interaction
   */
  const handleGoogleDriveAuth = async () => {
    try {
      console.log('👤 User clicked Connect Google Drive button');
      clearError();
      
      const success = await authenticate(true);
      
      if (success) {
        console.log('✅ Authentication successful, loading files...');
        await loadClientFiles();
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  // Handle update with goals - simplified for Grace clients
  const handleUpdate = async () => {
    try {
      const updateData = {
        notes: notes.trim(),
        sessionNotes: sessionNotes.trim(),
        currentGoals: currentGoals.trim()
      };

      // Only include progress for non-Grace clients
      if (client.program !== 'grace') {
        updateData.progress = parseInt(progress);
      }

      await clientActions.updateProgress(client.id, updateData);
      alert('Client notes and goals updated successfully!');
    } catch (error) {
      alert('Error updating client. Please try again: ' + error.message);
    }
  };

  const uploadFiles = async (files) => {
    if (files.length === 0) return;

    if (!isAvailable) {
      alert('Google Workspace Shared Drive is not available. Please check your configuration.');
      return;
    }

    if (!isAuthenticated) {
      alert('Please connect to Google Workspace first by clicking "Connect Shared Drive"');
      return;
    }

    try {
      const invalidFiles = [];
      const validFiles = [];

      for (const file of files) {
        if (!isFileTypeAllowed(file.type)) {
          invalidFiles.push(`${file.name} (unsupported file type)`);
        } else if (!isFileSizeValid(file.size)) {
          invalidFiles.push(`${file.name} (file too large)`);
        } else {
          validFiles.push(file);
        }
      }

      if (invalidFiles.length > 0) {
        alert(`Some files cannot be uploaded:\n${invalidFiles.join('\n')}`);
      }

      if (validFiles.length === 0) return;

      const { results, errors } = await uploadMultipleFiles(client.id, client.name, validFiles);
      
      let message = `Successfully uploaded ${results.length} file(s) to ${client.name}'s shared folder`;
      if (errors.length > 0) {
        message += `\n\nErrors:\n${errors.map(e => `${e.file}: ${e.error}`).join('\n')}`;
      }
      
      alert(message);
      await loadClientFiles();
      
    } catch (error) {
      alert(`Error uploading files: ${error.message}`);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const dropZone = e.currentTarget;
    const relatedTarget = e.relatedTarget;
    
    if (!dropZone.contains(relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    await uploadFiles(files);
    e.target.value = '';
  };

  const handleFileRemove = async (file) => {
    if (!isAuthenticated) {
      alert('Please connect to Google Workspace first');
      return;
    }

    if (window.confirm(`Are you sure you want to remove "${file.name}" from the shared drive?`)) {
      try {
        const success = await deleteClientFile(file.id, file.name);
        if (success) {
          alert(`File "${file.name}" removed successfully from shared drive!`);
          await loadClientFiles();
        } else {
          alert('Failed to remove file. Please try again.');
        }
      } catch (error) {
        alert('Error removing file: ' + error.message);
      }
    }
  };

  const handleFileView = async (file) => {
    if (!isAuthenticated) {
      alert('Please connect to Google Workspace first');
      return;
    }

    try {
      const urls = await getFileUrls(file.id);
      if (urls && urls.viewLink) {
        window.open(urls.viewLink, '_blank');
      } else {
        alert('Unable to get file view link');
      }
    } catch (error) {
      alert('Error opening file: ' + error.message);
    }
  };

  const handleFileDownload = async (file) => {
    if (!isAuthenticated) {
      alert('Please connect to Google Workspace first');
      return;
    }

    try {
      const urls = await getFileUrls(file.id);
      if (urls && urls.downloadLink) {
        window.open(urls.downloadLink, '_blank');
      } else {
        alert('Unable to get file download link');
      }
    } catch (error) {
      alert('Error downloading file: ' + error.message);
    }
  };

  const getWeeklySchedule = () => {
    const weekDates = getWeekDatesStartingMonday();
    
    return weekDates.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const daySchedule = scheduleActions.getTodaysScheduleForClient(client.id, dateStr);
      
      const sortedSchedule = daySchedule.sort((a, b) => {
        const timeSlotOrder = timeSlots.map(slot => slot.id);
        const indexA = timeSlotOrder.indexOf(a.timeSlot);
        const indexB = timeSlotOrder.indexOf(b.timeSlot);
        
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        return 0;
      });
      
      return {
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { 
          timeZone: 'America/Los_Angeles',
          weekday: 'short' 
        }),
        schedule: sortedSchedule
      };
    });
  };

  const weekSchedule = getWeeklySchedule();

  // Determine if client can have internships tab
  const showInternshipsTab = client.program === 'bridges';
  const canEditInternships = canManageInternships(userProfile);

  // Tab configuration
  const tabs = [
    { id: 'info', label: 'Client Info', icon: User },
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'schedule', label: 'Schedule', icon: Clock }
  ];

  // Add internships tab for Bridges clients
  if (showInternshipsTab) {
    tabs.splice(2, 0, { id: 'internships', label: 'Internships', icon: Briefcase });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-[#9B97A2] text-white rounded hover:bg-[#707070]"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-[#292929]">{client.name}</h2>
        <span className="bg-[#BED2D8] text-[#292929] px-3 py-1 rounded-full text-sm">
          {client.program === 'limitless' ? client.businessName :
           client.program === 'new-options' ? 'Community Job' :
           client.program === 'bridges' ? 'Career Development' :
           client.program === 'grace' ? 'Grace Program' :
           client.businessName || client.jobGoal}
        </span>
        {showInternshipsTab && (
          <span className="bg-[#5A4E69] text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
            <Briefcase size={14} />
            <span>Bridges Program</span>
          </span>
        )}
      </div>
      
      <div className="bg-[#BED2D8] border-l-4 border-[#6D858E] p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-[#6D858E]" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-[#292929]">
              <strong>Coach Reference:</strong> This information is confidential and for coaching purposes only. Files are stored in Google Workspace Shared Drive for team access and collaboration.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-[#F5F5F5]">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-[#6D858E] text-[#6D858E]'
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
          {/* Client Info Tab */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-[#292929]">
                  {client.program === 'limitless' ? 'Business Information' :
                   client.program === 'new-options' ? 'Job Information' :
                   client.program === 'bridges' ? 'Career Development' :
                   client.program === 'grace' ? 'Grace Participant Information' :
                   'Client Information'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#707070]">Name:</label>
                    <p className="font-medium text-[#292929]">{client.name}</p>
                  </div>
                  
                  {/* Show full information for all programs except Grace */}
                  {client.program !== 'grace' && (
                    <>
                      {client.program === 'limitless' && (
                        <>
                          <div>
                            <label className="text-sm font-medium text-[#707070]">Business Name:</label>
                            <p className="font-medium text-[#6D858E]">{client.businessName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#707070]">Business Type:</label>
                            <p className="font-medium text-[#292929]">{client.jobGoal}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#707070]">Equipment Used:</label>
                            <p className="text-[#292929]">{client.equipment}</p>
                          </div>
                        </>
                      )}
                      
                      {(client.program === 'new-options' || client.program === 'bridges') && (
                        <div>
                          <label className="text-sm font-medium text-[#707070]">
                            {client.program === 'new-options' ? 'Job Interest:' : 'Career Goals:'}
                          </label>
                          <p className="font-medium text-[#292929]">{client.jobGoal}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Simplified Grace participant info */}
                  {client.program === 'grace' && client.jobGoal && (
                    <div>
                      <label className="text-sm font-medium text-[#707070]">Enrichment Activities:</label>
                      <p className="font-medium text-[#292929]">{client.jobGoal}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-[#707070]">
                      {client.program === 'limitless' ? 'Business Description:' :
                       client.program === 'new-options' ? 'Job Description:' :
                       client.program === 'bridges' ? 'Career Development Plan:' :
                       client.program === 'grace' ? 'Program Goals:' :
                       'Description:'}
                    </label>
                    <p className="text-sm text-[#292929] bg-[#F5F5F5] p-3 rounded">{client.businessDescription}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-[#707070]">Contact:</label>
                    <p className="text-[#292929]">{client.email}</p>
                    <p className="text-[#292929]">{client.phone}</p>
                  </div>

                  {/* Working Schedule Information - only for non-Grace clients */}
                  {client.program !== 'grace' && (
                    <div>
                      <label className="text-sm font-medium text-[#707070]">Working Schedule:</label>
                      <div className="mt-2 space-y-1">
                        <div className="text-sm text-[#292929]">
                          <span className="font-medium">Days:</span> {formatWorkingDays(client.workingDays)}
                        </div>
                        <div className="text-sm text-[#292929]">
                          <span className="font-medium">Times:</span> {formatAvailableTimeSlots(client.availableTimeSlots)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-[#707070]">Current Goals:</label>
                    <div className="mt-2 p-3 bg-[#BED2D8] rounded-lg border-l-4 border-[#6D858E]">
                      <p className="text-[#292929]">
                        {client.currentGoals || `No current goals set. Use the Goals & Session Notes section below to add goals for this ${client.program === 'grace' ? 'participant' : 'client'}.`}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress bar - only for non-Grace clients */}
                  {client.program !== 'grace' && (
                    <div>
                      <label className="text-sm font-medium text-[#707070]">Progress:</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(parseInt(e.target.value))}
                        className="w-full mt-2"
                      />
                      <div className="flex justify-between text-sm text-[#707070]">
                        <span>0%</span>
                        <span className="font-medium">{progress}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Goals & Session Notes */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-[#292929]">Goals & Session Notes</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#707070]">Current Goals:</label>
                    <textarea
                      value={currentGoals}
                      onChange={(e) => setCurrentGoals(e.target.value)}
                      className="w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                      rows="3"
                      placeholder={`Set ${client.program === 'grace' ? 'participant\'s enrichment program' : 'client\'s'} goals and objectives...`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#707070]">Current Session Notes:</label>
                    <textarea
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      className="w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                      rows="4"
                      placeholder="Add notes from today's session..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#707070]">General Notes:</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                      rows="3"
                      placeholder="General coaching notes..."
                    />
                  </div>
                  <button
                    onClick={handleUpdate}
                    className="bg-[#6D858E] text-white px-4 py-2 rounded-md hover:bg-[#5A4E69]"
                  >
                    {client.program === 'grace' ? 'Update Goals & Notes' : 'Update Goals, Progress & Notes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Internships Tab - Only for Bridges clients */}
          {activeTab === 'internships' && showInternshipsTab && (
            <ClientInternshipsTab
              client={client}
              userProfile={userProfile}
              internshipActions={internshipActions}
              canEdit={canEditInternships}
            />
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center text-[#292929]">
                  <FolderOpen className="mr-2" size={20} />
                  {client.program === 'grace' ? 'Participant' : 'Client'} Files (Google Workspace Shared Drive)
                </h3>
                
                {!isAvailable ? (
                  <div className="text-red-600 text-sm">
                    Shared Drive not configured
                  </div>
                ) : !isAuthenticated ? (
                  <button
                    onClick={handleGoogleDriveAuth}
                    className="bg-[#4285f4] text-white px-4 py-2 rounded-md hover:bg-[#3367d6] flex items-center space-x-2"
                    disabled={driveLoading}
                  >
                    {driveLoading ? (
                      <span>Connecting...</span>
                    ) : (
                      <>
                        <span>Connect Shared Drive</span>
                        <ExternalLink size={16} />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-green-600">
                      ✅ Connected as {currentUser?.email || 'Google Workspace'}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#6D858E] text-white px-4 py-2 rounded-md hover:bg-[#5A4E69] flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Add Files</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {driveError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-700">{driveError}</span>
                    <button
                      onClick={clearError}
                      className="ml-auto text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {!isAvailable ? (
                <div className="text-center py-8 bg-[#F5F5F5] rounded-lg">
                  <FolderOpen className="mx-auto h-12 w-12 text-[#9B97A2] mb-4" />
                  <h4 className="text-lg font-medium text-[#292929] mb-2">Google Workspace Shared Drive</h4>
                  <p className="text-[#707070] mb-4">
                    Google Workspace Shared Drive integration is not available. Please check your configuration.
                  </p>
                  <div className="text-sm text-[#9B97A2] bg-white p-3 rounded border">
                    <p><strong>To enable Shared Drive:</strong></p>
                    <p>1. Set up the "ITG Client Files" shared drive in Google Admin</p>
                    <p>2. Add all coaches as managers</p>
                    <p>3. Ensure API credentials are configured</p>
                  </div>
                </div>
              ) : !isAuthenticated ? (
                <div className="text-center py-8 bg-[#F5F5F5] rounded-lg">
                  <FolderOpen className="mx-auto h-12 w-12 text-[#9B97A2] mb-4" />
                  <h4 className="text-lg font-medium text-[#292929] mb-2">Connect to Google Workspace</h4>
                  <p className="text-[#707070] mb-4">
                    Click "Connect Shared Drive" above to access the ITG Client Files shared drive
                  </p>
                  {currentUser && (
                    <p className="text-sm text-green-600 mb-2">
                      Ready to connect as: {currentUser.email}
                    </p>
                  )}
                  <button
                    onClick={handleGoogleDriveAuth}
                    className="bg-[#4285f4] text-white px-6 py-2 rounded-md hover:bg-[#3367d6]"
                    disabled={driveLoading}
                  >
                    {driveLoading ? 'Connecting...' : 'Connect to Shared Drive'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Drag & Drop Zone */}
                  <div 
                    className={`mb-6 p-8 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${
                      isDragging 
                        ? 'border-[#6D858E] bg-[#BED2D8]' 
                        : 'border-[#9B97A2] bg-[#F5F5F5] hover:border-[#6D858E]'
                    } ${driveLoading || !isAvailable ? 'opacity-50 pointer-events-none' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip,.rar,.7z,.html,.css,.js,.jsx,.py,.php,.rb,.ai,.psd,.sketch"
                    />
                    <div className="text-center">
                      <Upload className={`mx-auto h-12 w-12 ${isDragging ? 'text-[#6D858E]' : 'text-[#9B97A2]'}`} />
                      <p className={`mt-2 text-sm font-medium ${isDragging ? 'text-[#6D858E]' : 'text-[#707070]'}`}>
                        {!isAvailable ? 'Shared Drive not available - check configuration' :
                         driveLoading ? 'Uploading files...' : 
                         isDragging ? 'Drop files here!' : 
                         'Drag and drop files here, or click to browse'}
                      </p>
                      <p className="text-xs text-[#9B97A2] mt-1">
                        {isAvailable ? 'Files will be uploaded to Google Workspace Shared Drive' : 'Shared Drive integration disabled'}
                      </p>
                      {uploadProgress > 0 && (
                        <div className="mt-3">
                          <div className="w-full bg-[#F5F5F5] rounded-full h-2">
                            <div 
                              className="bg-[#6D858E] h-2 rounded-full transition-all duration-300" 
                              style={{width: `${uploadProgress}%`}}
                            ></div>
                          </div>
                          <p className="text-xs text-[#707070] mt-1">{uploadProgress}% uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Files List */}
                  <div className="space-y-3">
                    {isLoadingFiles ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D858E] mx-auto"></div>
                        <p className="text-[#707070] mt-2">Loading files...</p>
                      </div>
                    ) : clientFiles.length > 0 ? (
                      clientFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-[#F5F5F5]">
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl">{getFileIcon(file.type)}</div>
                            <div>
                              <h4 className="font-medium text-[#292929]">{file.name}</h4>
                              <div className="text-sm text-[#707070]">
                                <span>Uploaded: {file.uploadDate}</span>
                                <span className="mx-2">•</span>
                                <span>{file.size}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleFileView(file)}
                              className="text-[#6D858E] hover:text-[#5A4E69] px-3 py-1 text-sm border border-[#6D858E] rounded hover:bg-[#BED2D8] flex items-center space-x-1"
                            >
                              <Eye size={14} />
                              <span>View</span>
                            </button>
                            <button 
                              onClick={() => handleFileDownload(file)}
                              className="text-[#6D858E] hover:text-[#5A4E69] px-3 py-1 text-sm border border-[#6D858E] rounded hover:bg-[#BED2D8] flex items-center space-x-1"
                            >
                              <Download size={14} />
                              <span>Download</span>
                            </button>
                            <button 
                              onClick={() => handleFileRemove(file)}
                              className="text-red-600 hover:text-red-800 px-3 py-1 text-sm border border-red-600 rounded hover:bg-red-50 flex items-center space-x-1"
                            >
                              <Trash2 size={14} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-[#9B97A2]">
                        <FileText size={48} className="mx-auto mb-2 text-[#9B97A2]" />
                        <p>No files uploaded yet</p>
                        <p className="text-sm">Drag and drop files above or use the Add Files button</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-[#292929]">Weekly Schedule</h3>
              <div className="grid grid-cols-7 gap-2">
                {weekSchedule.map((day, index) => (
                  <div key={day.date} className="border rounded p-2">
                    <h4 className="font-semibold text-sm text-center mb-2 text-[#292929]">
                      {day.dayName} {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
                        timeZone: 'America/Los_Angeles',
                        day: 'numeric'
                      })}
                    </h4>
                    <div className="space-y-1">
                      {day.schedule.map(session => {
                        const slot = timeSlots.find(s => s.id === session.timeSlot);
                        const coach = coaches.find(c => c.uid === session.coachId || c.id === session.coachId);
                        return (
                          <div key={session.id} className="bg-[#BED2D8] p-1 rounded text-xs">
                            <p className="font-medium text-[#292929]">{slot?.label}</p>
                            <p className="text-[#6D858E]">{coach?.name || 'No Coach Assigned'}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Client Profile Information - Hide for Grace clients */}
      {client.program !== 'grace' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Always show strengths for coaches (clients never see this view anyway) */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-[#6D858E] flex items-center">
                <CheckCircle className="mr-2" size={20} />
                Strengths
              </h3>
              <div className="text-[#292929] bg-[#BED2D8] p-4 rounded-lg border-l-4 border-[#6D858E]">
                {client.strengths ? (
                  <ul className="space-y-2">
                    {client.strengths.split(', ').map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-[#6D858E] mr-2">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#9B97A2]">No strengths documented</p>
                )}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-[#5A4E69] flex items-center">
                <AlertCircle className="mr-2" size={20} />
                Challenges
              </h3>
              <div className="text-[#292929] bg-[#F5F5F5] p-4 rounded-lg border-l-4 border-[#5A4E69]">
                {client.challenges ? (
                  <ul className="space-y-2">
                    {client.challenges.split(', ').map((challenge, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-[#5A4E69] mr-2">•</span>
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#9B97A2]">No challenges documented</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-[#5A4E69] flex items-center">
              <User className="mr-2" size={20} />
              Recommended Coaching Approach
            </h3>
            <div className="text-[#292929] bg-[#F5F5F5] p-4 rounded-lg border-l-4 border-[#5A4E69]">
              {client.coachingApproach ? (
                <ul className="space-y-3">
                  {client.coachingApproach.split(', ').map((approach, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#5A4E69] mr-2 mt-1">→</span>
                      <span>{approach}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#9B97A2]">No coaching approach documented</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* General Coaching Tips */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-[#292929]">General Coaching Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#BED2D8] p-4 rounded-lg">
            <h4 className="font-semibold text-[#292929] mb-2">Professional Boundaries</h4>
            <ul className="text-sm text-[#292929] space-y-1">
              <li>• Maintain appropriate coach-client relationship</li>
              <li>• Avoid overly personal involvement</li>
              <li>• Set clear expectations early</li>
            </ul>
          </div>
          <div className="bg-[#BED2D8] p-4 rounded-lg">
            <h4 className="font-semibold text-[#292929] mb-2">Celebrate Success</h4>
            <ul className="text-sm text-[#292929] space-y-1">
              <li>• Acknowledge achievements</li>
              <li>• Recognize personal growth</li>
              <li>• {client.program === 'limitless' ? 'Connect development to business success' :
                      client.program === 'bridges' ? 'Connect skills to career readiness' :
                      client.program === 'grace' ? 'Connect growth to enrichment goals' :
                      'Connect progress to program goals'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;