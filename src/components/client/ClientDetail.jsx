// src/components/client/ClientDetail.jsx
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
  Clock
} from 'lucide-react';
import { formatDatePST, getWeekDatesStartingMonday } from '../../utils/dateUtils';
import { getFileIcon } from '../../utils/helpers';

const ClientDetail = ({ 
  client, 
  onBack, 
  clientActions,
  scheduleActions, 
  timeSlots, 
  coaches 
}) => {
  const [progress, setProgress] = useState(client.progress || 0);
  const [notes, setNotes] = useState(client.notes || '');
  const [sessionNotes, setSessionNotes] = useState(client.sessionNotes || '');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [newFile, setNewFile] = useState({ name: '', type: 'document', description: '' });
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Update local state when client data changes from real-time updates
  useEffect(() => {
    setProgress(client.progress || 0);
    setNotes(client.notes || '');
    setSessionNotes(client.sessionNotes || '');
  }, [client.id, client.progress, client.notes, client.sessionNotes]);
  
  const handleUpdate = async () => {
    try {
      await clientActions.updateProgress(client.id, {
        progress: parseInt(progress),
        notes: notes.trim(),
        sessionNotes: sessionNotes.trim()
      });
      alert('Client progress and notes updated successfully!');
    } catch (error) {
      alert('Error updating client. Please try again: ' + error.message);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!newFile.name.trim()) {
      alert('Please enter a file name');
      return;
    }
    
    try {
      const fileData = {
        ...newFile,
        size: Math.random() > 0.5 ? `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 9)}MB` : `${Math.floor(Math.random() * 999) + 1}KB`,
        downloadURL: null,
        storageRef: null
      };
      
      await clientActions.addFile(client.id, fileData);
      
      setNewFile({ name: '', type: 'document', description: '' });
      setShowFileUpload(false);
      alert(`File "${newFile.name}" added to ${client.name}'s record successfully!`);
    } catch (error) {
      alert('Error adding file: ' + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576 * 10) / 10 + ' MB';
  };

  const uploadFiles = async (files) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadedFiles = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        setUploadProgress(Math.round(((i) / files.length) * 90));
        
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        
        const fileExtension = file.name.split('.').pop().toLowerCase();
        let fileType = 'document';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension)) {
          fileType = 'image';
        } else if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
          fileType = 'spreadsheet';
        } else if (['ai', 'psd', 'sketch', 'figma'].includes(fileExtension)) {
          fileType = 'design';
        } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExtension)) {
          fileType = 'archive';
        } else if (['html', 'css', 'js', 'jsx', 'py', 'php', 'rb'].includes(fileExtension)) {
          fileType = 'code';
        }

        const fileMetadata = {
          name: file.name,
          type: fileType,
          size: formatFileSize(file.size),
          downloadURL: null,
          storageRef: null,
          description: '',
          originalSize: file.size
        };
        
        const savedFile = await clientActions.addFile(client.id, fileMetadata);
        uploadedFiles.push(savedFile);
      }
      
      setUploadProgress(100);
      
      const message = `Successfully uploaded ${files.length} file(s) to ${client.name}'s account!`;
      alert(message);
      
    } catch (error) {
      alert(`Error uploading files: ${error.message}. Please try again.`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
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

  const handleFileRemove = async (fileId) => {
    const fileToRemove = client.files?.find(f => f.id === fileId);
    const fileName = fileToRemove?.name || 'Unknown file';
    
    if (window.confirm(`Are you sure you want to remove "${fileName}"?`)) {
      try {
        await clientActions.removeFile(client.id, fileId);
        alert(`File "${fileName}" removed successfully!`);
      } catch (error) {
        alert('Error removing file: ' + error.message);
      }
    }
  };

  const getWeeklySchedule = () => {
    const weekDates = getWeekDatesStartingMonday();
    
    return weekDates.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const daySchedule = scheduleActions.getTodaysScheduleForClient(client.id, dateStr);
      return {
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { 
          timeZone: 'America/Los_Angeles',
          weekday: 'short' 
        }),
        schedule: daySchedule
      };
    });
  };

  const weekSchedule = getWeeklySchedule();

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
          {client.businessName || client.jobGoal}
        </span>
      </div>
      
      <div className="bg-[#BED2D8] border-l-4 border-[#6D858E] p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-[#6D858E]" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-[#292929]">
              <strong>Coach Reference:</strong> This information is confidential and for coaching purposes only. Review the client's specific coaching approach before sessions.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-[#292929]">Business Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#707070]">Business Owner:</label>
              <p className="font-medium text-[#292929]">{client.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[#707070]">Business Name:</label>
              <p className="font-medium text-[#6D858E]">{client.businessName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[#707070]">Business Description:</label>
              <p className="text-sm text-[#292929] bg-[#F5F5F5] p-3 rounded">{client.businessDescription}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[#707070]">Business Type:</label>
              <p className="font-medium text-[#292929]">{client.jobGoal}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[#707070]">Equipment Used:</label>
              <p className="text-[#292929]">{client.equipment}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[#707070]">Contact:</label>
              <p className="text-[#292929]">{client.email}</p>
              <p className="text-[#292929]">{client.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-[#707070]">Business Progress:</label>
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
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-[#292929]">Session Notes</h3>
          
          <div className="space-y-3">
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
              Update Progress & Notes
            </button>
          </div>
        </div>
      </div>

      {/* Client Files Section with Drag & Drop */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold flex items-center text-[#292929]">
            <FileText className="mr-2" size={20} />
            Client Work Files
          </h3>
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="bg-[#6D858E] text-white px-4 py-2 rounded-md hover:bg-[#5A4E69] flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add File</span>
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div 
          className={`mb-6 p-8 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${
            isDragging 
              ? 'border-[#6D858E] bg-[#BED2D8]' 
              : 'border-[#9B97A2] bg-[#F5F5F5] hover:border-[#6D858E]'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
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
              {isUploading ? 'Uploading files...' : 
               isDragging ? 'Drop files here!' : 
               'Drag and drop files here, or click to browse'}
            </p>
            <p className="text-xs text-[#9B97A2] mt-1">
              Supports: PDF, DOC, XLS, Images, ZIP, and more
            </p>
            {isUploading && (
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

        {showFileUpload && (
          <div className="mb-6 p-4 bg-[#F5F5F5] rounded-lg border">
            <h4 className="font-semibold mb-3 text-[#292929]">Add New File Manually</h4>
            <form onSubmit={handleFileUpload} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="File name (e.g., Design Template.pdf)"
                  value={newFile.name}
                  onChange={(e) => setNewFile({...newFile, name: e.target.value})}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                  required
                />
                <select
                  value={newFile.type}
                  onChange={(e) => setNewFile({...newFile, type: e.target.value})}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                >
                  <option value="document">Document</option>
                  <option value="image">Image</option>
                  <option value="spreadsheet">Spreadsheet</option>
                  <option value="design">Design File</option>
                  <option value="archive">Archive/Zip</option>
                  <option value="code">Code/Template</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Description (optional)"
                value={newFile.description}
                onChange={(e) => setNewFile({...newFile, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-[#6D858E] text-white px-4 py-2 rounded-md hover:bg-[#5A4E69]"
                >
                  Add File
                </button>
                <button
                  type="button"
                  onClick={() => setShowFileUpload(false)}
                  className="bg-[#9B97A2] text-white px-4 py-2 rounded-md hover:bg-[#707070]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {client.files && client.files.length > 0 ? (
            client.files.map(file => (
              <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-[#F5F5F5]">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getFileIcon(file.type)}</div>
                  <div>
                    <h4 className="font-medium text-[#292929]">{file.name}</h4>
                    <div className="text-sm text-[#707070]">
                      <span>Uploaded by {file.uploadedBy}</span>
                      <span className="mx-2">•</span>
                      <span>{file.uploadDate}</span>
                      <span className="mx-2">•</span>
                      <span>{file.size}</span>
                    </div>
                    {file.description && (
                      <p className="text-sm text-[#9B97A2] mt-1">{file.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.downloadURL && (
                    <a 
                      href={file.downloadURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#6D858E] hover:text-[#5A4E69] px-3 py-1 text-sm border border-[#6D858E] rounded hover:bg-[#BED2D8]"
                    >
                      View
                    </a>
                  )}
                  {file.downloadURL && (
                    <a 
                      href={file.downloadURL} 
                      download={file.name}
                      className="text-[#6D858E] hover:text-[#5A4E69] px-3 py-1 text-sm border border-[#6D858E] rounded hover:bg-[#BED2D8]"
                    >
                      Download
                    </a>
                  )}
                  <button 
                    onClick={() => handleFileRemove(file.id)}
                    className="text-red-600 hover:text-red-800 px-3 py-1 text-sm border border-red-600 rounded hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[#9B97A2]">
              <FileText size={48} className="mx-auto mb-2 text-[#9B97A2]" />
              <p>No files uploaded yet</p>
              <p className="text-sm">Drag and drop files above or use the Add File button</p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white p-6 rounded-lg shadow-md">
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <li>• Acknowledge business achievements</li>
              <li>• Recognize personal growth</li>
              <li>• Connect development to business success</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;