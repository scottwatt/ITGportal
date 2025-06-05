// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { Calendar, User, BookOpen, FileText, TrendingUp, CheckCircle, LogOut, Menu, X, Plus, Settings, UserPlus, Clock, Building2, Trash2, Upload, AlertCircle, CalendarDays, Target, Key, Edit3, Filter } from 'lucide-react';

// import { auth, db, storage } from './services/firebase/config';
// import { 
//   signInWithEmailAndPassword, 
//   createUserWithEmailAndPassword,
//   signOut, 
//   onAuthStateChanged,
//   updatePassword,
//   reauthenticateWithCredential,
//   EmailAuthProvider
// } from 'firebase/auth';
// import { 
//   collection, 
//   doc, 
//   getDocs, 
//   addDoc, 
//   updateDoc, 
//   deleteDoc, 
//   onSnapshot,
//   query,
//   where,
//   orderBy,
//   serverTimestamp 
// } from 'firebase/firestore';
// import { 
//   ref, 
//   uploadBytes, 
//   getDownloadURL, 
//   deleteObject 
// } from 'firebase/storage';

// const getPSTDate = () => {
//   const now = new Date();
//   const pstOffset = -8; // PST is UTC-8 (or UTC-7 during PDT)
//   const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
//   const pstTime = new Date(utc + (pstOffset * 3600000));
//   return pstTime.toISOString().split('T')[0];
// };

// const formatDatePST = (dateString) => {
//   const date = new Date(dateString + 'T12:00:00');
//   return date.toLocaleDateString('en-US', { 
//     timeZone: 'America/Los_Angeles',
//     weekday: 'long', 
//     year: 'numeric', 
//     month: 'long', 
//     day: 'numeric' 
//   });
// };


// // Password Change Modal Component
// const PasswordChangeModal = ({ isOpen, onClose, user }) => {
//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState(false);

//   const handlePasswordChange = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     if (newPassword !== confirmPassword) {
//       setError('New passwords do not match');
//       setLoading(false);
//       return;
//     }

//     if (newPassword.length < 6) {
//       setError('New password must be at least 6 characters');
//       setLoading(false);
//       return;
//     }

//     try {
//       // Re-authenticate user before changing password
//       const credential = EmailAuthProvider.credential(user.email, currentPassword);
//       await reauthenticateWithCredential(user, credential);
      
//       // Update password
//       await updatePassword(user, newPassword);
      
//       setSuccess(true);
//       setTimeout(() => {
//         onClose();
//         setCurrentPassword('');
//         setNewPassword('');
//         setConfirmPassword('');
//         setSuccess(false);
//       }, 2000);
//     } catch (error) {
//       if (error.code === 'auth/wrong-password') {
//         setError('Current password is incorrect');
//       } else if (error.code === 'auth/weak-password') {
//         setError('New password is too weak');
//       } else {
//         setError('Failed to change password. Please try again.');
//       }
//     }
//     setLoading(false);
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold flex items-center text-[#292929]">
//             <Key className="mr-2" size={20} />
//             Change Password
//           </h3>
//           <button onClick={onClose} className="text-[#707070] hover:text-[#292929]">
//             <X size={20} />
//           </button>
//         </div>

//         {success ? (
//           <div className="text-center py-4">
//             <CheckCircle className="mx-auto text-[#6D858E] mb-2" size={48} />
//             <p className="text-[#6D858E] font-medium">Password changed successfully!</p>
//           </div>
//         ) : (
//           <form onSubmit={handlePasswordChange} className="space-y-4">
//             {error && (
//               <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
//                 {error}
//               </div>
//             )}
            
//             <div>
//               <label className="block text-sm font-medium text-[#292929] mb-1">
//                 Current Password
//               </label>
//               <input
//                 type="password"
//                 value={currentPassword}
//                 onChange={(e) => setCurrentPassword(e.target.value)}
//                 className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                 required
//                 disabled={loading}
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-[#292929] mb-1">
//                 New Password
//               </label>
//               <input
//                 type="password"
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//                 className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                 required
//                 disabled={loading}
//                 minLength={6}
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-[#292929] mb-1">
//                 Confirm New Password
//               </label>
//               <input
//                 type="password"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                 required
//                 disabled={loading}
//                 minLength={6}
//               />
//             </div>

//             <div className="flex space-x-2 pt-2">
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="flex-1 bg-[#6D858E] text-white py-2 px-4 rounded-md hover:bg-[#5A4E69] disabled:opacity-50"
//               >
//                 {loading ? 'Changing...' : 'Change Password'}
//               </button>
//               <button
//                 type="button"
//                 onClick={onClose}
//                 disabled={loading}
//                 className="flex-1 bg-[#9B97A2] text-white py-2 px-4 rounded-md hover:bg-[#707070] disabled:opacity-50"
//               >
//                 Cancel
//               </button>
//             </div>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// };

// // Updated DragDropScheduler component
// const DragDropScheduler = ({ 
//   selectedDate, 
//   handleDragStart, 
//   handleDragOver, 
//   handleDragLeave, 
//   handleDrop, 
//   handleRemoveAssignment,
//   dragOverSlot,
//   draggedClient,
//   dailySchedules,
//   clients,
//   coaches,
//   timeSlots 
// }) => {
//   const dragDateRef = useRef(null);
//   const [isDragging, setIsDragging] = useState(false);

//   // Track dragging state
//   useEffect(() => {
//     const nowDragging = !!draggedClient;
    
//     if (nowDragging && !isDragging) {
//       dragDateRef.current = selectedDate;
//     } else if (!nowDragging && isDragging) {
//       dragDateRef.current = null;
//     }
    
//     setIsDragging(nowDragging);
//   }, [draggedClient, selectedDate, isDragging]);

//   const getUnscheduledClients = () => {
//     const dateToUse = selectedDate;
    
//     // Filter out Grace clients from scheduling - only show Limitless, New Options, and Bridges
//     const schedulableClients = clients.filter(client => {
//       const program = client.program || 'limitless';
//       return ['limitless', 'new-options', 'bridges'].includes(program);
//     });
    
//     return schedulableClients.filter(client => {
//       const sessionsForClient = dailySchedules.filter(s => 
//         s.date === dateToUse && s.clientId === client.id
//       );
//       return sessionsForClient.length < timeSlots.length;
//     });
//   };

//   const unscheduledClients = getUnscheduledClients();
//   const currentSelectedDate = selectedDate;
//   const displayDate = formatDatePST(currentSelectedDate);

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-md">
//       <h3 className="text-xl font-semibold mb-6 text-[#292929]">
//         Drag & Drop Scheduler for {displayDate}
//         {isDragging && (
//           <span className="ml-2 text-sm text-[#6D858E]">(Dragging - date locked)</span>
//         )}
//       </h3>
      
//       {/* Instructions */}
//       <div className="mb-6 p-4 bg-[#BED2D8] rounded-lg border-l-4 border-[#6D858E]">
//         <h4 className="font-semibold text-[#292929] mb-2">How to Schedule:</h4>
//         <ul className="text-sm text-[#292929] space-y-1">
//           <li>• Drag a client from the "Available Clients" section below</li>
//           <li>• Drop them into a coach's time slot</li>
//           <li>• Coaches can have multiple clients in the same time slot</li>
//           <li>• Click the × button to remove an existing assignment</li>
//         </ul>
//       </div>

//       {/* Schedule Grid */}
//       <div className="mb-8">
//         <div className="flex gap-6 overflow-x-auto pb-4">
//           {/* Time Column */}
//           <div className="flex-shrink-0 space-y-4">
//             <div className="h-16 w-32 flex items-center justify-center bg-[#F5F5F5] rounded-lg font-semibold text-[#292929]">
//               Time Slots
//             </div>
//             {timeSlots.map(slot => (
//               <div key={slot.id} className="h-32 w-32 flex items-center justify-center bg-[#F5F5F5] rounded-lg p-2">
//                 <div className="text-center">
//                   <div className="font-semibold text-sm text-[#292929]">{slot.start}</div>
//                   <div className="text-xs text-[#707070]">to</div>
//                   <div className="font-semibold text-sm text-[#292929]">{slot.end}</div>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Coach Columns */}
//           {coaches.filter(c => c.role === 'coach').map(coach => (
//             <div key={coach.uid || coach.id} className="flex-shrink-0 space-y-4">
//               <div className="h-16 w-64 flex items-center justify-center bg-[#6D858E] rounded-lg px-4">
//                 <div className="text-center">
//                   <div className="font-semibold text-white">{coach.name}</div>
//                   <div className="text-xs text-[#BED2D8] truncate">{coach.email}</div>
//                 </div>
//               </div>
              
//               {timeSlots.map(slot => {
//                 const assignments = dailySchedules.filter(s => 
//                   s.date === currentSelectedDate && 
//                   s.timeSlot === slot.id && 
//                   s.coachId === (coach.uid || coach.id)
//                 );
//                 const isDropTarget = dragOverSlot === `${coach.uid || coach.id}-${slot.id}`;
                
//                 return (
//                   <div
//                     key={slot.id}
//                     className={`min-h-32 w-64 border-2 border-dashed rounded-lg p-3 transition-all duration-200 ${
//                       isDropTarget 
//                         ? 'border-[#6D858E] bg-[#BED2D8]' 
//                         : assignments.length > 0
//                           ? 'border-[#6D858E] bg-[#BED2D8]' 
//                           : 'border-[#9B97A2] bg-[#F5F5F5] hover:border-[#6D858E]'
//                     }`}
//                     onDragOver={(e) => handleDragOver(e, coach.uid || coach.id, slot.id)}
//                     onDragLeave={handleDragLeave}
//                     onDrop={(e) => {
//                       const dateForDrop = dragDateRef.current || currentSelectedDate;
//                       handleDrop(e, coach.uid || coach.id, slot.id, dateForDrop);
//                     }}
//                   >
//                     {assignments.length > 0 ? (
//                       <div className="space-y-2">
//                         {assignments.map(assignment => {
//                           const client = clients.find(c => c.id === assignment.clientId);
//                           return (
//                             <div key={assignment.id} className="bg-white border border-[#6D858E] rounded p-2 shadow-sm">
//                               <div className="flex justify-between items-start">
//                                 <div className="flex-1 min-w-0">
//                                   <div className="font-semibold text-sm text-[#292929] truncate">{client?.name}</div>
//                                   <div className="text-xs text-[#707070] truncate">{client?.businessName}</div>
//                                   <div className="text-xs text-[#9B97A2] truncate">{client?.jobGoal}</div>
//                                 </div>
//                                 <button
//                                   onClick={() => handleRemoveAssignment(assignment.id)}
//                                   className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
//                                   title="Remove assignment"
//                                 >
//                                   <Trash2 size={12} />
//                                 </button>
//                               </div>
//                             </div>
//                           );
//                         })}
//                         {isDropTarget && (
//                           <div className="text-center text-[#6D858E] text-sm font-medium py-2 border-2 border-dashed border-[#6D858E] rounded bg-white">
//                             Drop to add another client!
//                           </div>
//                         )}
//                       </div>
//                     ) : (
//                       <div className="h-full flex items-center justify-center text-[#9B97A2] text-sm">
//                         {isDropTarget ? 'Drop here!' : 'Drop client here'}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           ))}
//         </div>
        
//         {/* Scroll indicator for mobile */}
//         {coaches.filter(c => c.role === 'coach').length > 2 && (
//           <div className="text-center text-[#9B97A2] text-sm mt-2">
//             ← Scroll horizontally to see all coaches →
//           </div>
//         )}
//       </div>

//       {/* Available Clients */}
//       <div className="border-t pt-6">
//         <h4 className="text-lg font-semibold mb-4 text-[#292929]">
//           Available Clients (Drag to schedule)
//           <span className="text-sm text-[#9B97A2] ml-2">
//             for {displayDate}
//           </span>
//         </h4>
//         {unscheduledClients.length > 0 ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//             {unscheduledClients.map(client => (
//               <div
//                 key={client.id}
//                 draggable
//                 onDragStart={(e) => {
//                   const dateForDrag = currentSelectedDate;
//                   handleDragStart(e, client, dateForDrag);
//                 }}
//                 className={`p-4 bg-white border-2 border-[#9B97A2] rounded-lg cursor-move hover:border-[#6D858E] hover:shadow-md transition-all duration-200 ${
//                   isDragging ? 'opacity-75' : ''
//                 }`}
//               >
//                 <div className="flex items-center space-x-3">
//                   <div className="flex-shrink-0 h-10 w-10 bg-[#6D858E] rounded-full flex items-center justify-center">
//                     <span className="text-white text-sm font-medium">
//                       {client.name.split(' ').map(n => n[0]).join('')}
//                     </span>
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="font-semibold text-sm truncate text-[#292929]">{client.name}</div>
//                     <div className="text-xs text-[#707070] truncate">
//                       {client.program === 'limitless' ? client.businessName : 
//                        client.program === 'new-options' ? 'Community Job Focus' :
//                        client.program === 'bridges' ? 'Career Development' :
//                        client.businessName || 'Program Participant'}
//                     </div>
//                     <div className="text-xs text-[#9B97A2]">{client.jobGoal}</div>
//                   </div>
//                 </div>
//                 <div className="mt-2 flex items-center justify-between">
//                   <span className={`text-xs px-2 py-1 rounded font-medium ${
//                     client.program === 'limitless' ? 'bg-[#BED2D8] text-[#292929]' :
//                     client.program === 'new-options' ? 'bg-[#BED2D8] text-[#292929]' :
//                     client.program === 'bridges' ? 'bg-[#BED2D8] text-[#292929]' :
//                     'bg-[#F5F5F5] text-[#292929]'
//                   }`}>
//                     {client.program === 'limitless' ? 'Limitless' :
//                      client.program === 'new-options' ? 'New Options' :
//                      client.program === 'bridges' ? 'Bridges' :
//                      'Limitless'}
//                   </span>
//                   <span className="text-xs text-[#9B97A2]">{client.progress || 0}%</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-8 text-[#9B97A2]">
//             <User size={48} className="mx-auto mb-2 text-[#9B97A2]" />
//             <p>All clients are scheduled for this day!</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// const ClientDetail = ({ 
//     client, 
//     onBack, 
//     updateClientProgress, 
//     addFileToClient, 
//     removeFileFromClient, 
//     getTodaysScheduleForClient, 
//     getFileIcon, 
//     timeSlots, 
//     coaches 
//   }) => {
//     const [progress, setProgress] = useState(client.progress || 0);
//     const [notes, setNotes] = useState(client.notes || '');
//     const [sessionNotes, setSessionNotes] = useState(client.sessionNotes || '');
//     const [showFileUpload, setShowFileUpload] = useState(false);
//     const [newFile, setNewFile] = useState({ name: '', type: 'document', description: '' });
//     const [isDragging, setIsDragging] = useState(false);
//     const [uploadProgress, setUploadProgress] = useState(0);
//     const [isUploading, setIsUploading] = useState(false);
//     const fileInputRef = useRef(null);
    
//     // Update local state when client data changes from real-time updates
//     useEffect(() => {
//       setProgress(client.progress || 0);
//       setNotes(client.notes || '');
//       setSessionNotes(client.sessionNotes || '');
//     }, [client.id, client.progress, client.notes, client.sessionNotes]);
    
//     const handleUpdate = async () => {
//       try {
//         await updateClientProgress(client.id, {
//           progress: parseInt(progress),
//           notes: notes.trim(),
//           sessionNotes: sessionNotes.trim()
//         });
//         alert('Client progress and notes updated successfully!');
//       } catch (error) {
//         alert('Error updating client. Please try again: ' + error.message);
//       }
//     };

//     const handleFileUpload = async (e) => {
//       e.preventDefault();
//       if (!newFile.name.trim()) {
//         alert('Please enter a file name');
//         return;
//       }
      
//       try {
//         const fileData = {
//           ...newFile,
//           size: Math.random() > 0.5 ? `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 9)}MB` : `${Math.floor(Math.random() * 999) + 1}KB`,
//           downloadURL: null,
//           storageRef: null
//         };
        
//         await addFileToClient(client.id, fileData);
        
//         setNewFile({ name: '', type: 'document', description: '' });
//         setShowFileUpload(false);
//         alert(`File "${newFile.name}" added to ${client.name}'s record successfully!`);
//       } catch (error) {
//         alert('Error adding file: ' + error.message);
//       }
//     };

//     const formatFileSize = (bytes) => {
//       if (bytes < 1024) return bytes + ' B';
//       if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
//       return Math.round(bytes / 1048576 * 10) / 10 + ' MB';
//     };

//     const uploadFiles = async (files) => {
//       if (files.length === 0) return;

//       setIsUploading(true);
//       setUploadProgress(0);
      
//       try {
//         const uploadedFiles = [];
        
//         for (let i = 0; i < files.length; i++) {
//           const file = files[i];
          
//           setUploadProgress(Math.round(((i) / files.length) * 90));
          
//           const timestamp = Date.now();
//           const fileName = `${timestamp}-${file.name}`;
//           const fileRef = ref(storage, `client-files/${client.id}/${fileName}`);
          
//           const snapshot = await uploadBytes(fileRef, file);
//           const downloadURL = await getDownloadURL(snapshot.ref);
          
//           const fileExtension = file.name.split('.').pop().toLowerCase();
//           let fileType = 'document';
//           if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension)) {
//             fileType = 'image';
//           } else if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
//             fileType = 'spreadsheet';
//           } else if (['ai', 'psd', 'sketch', 'figma'].includes(fileExtension)) {
//             fileType = 'design';
//           } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExtension)) {
//             fileType = 'archive';
//           } else if (['html', 'css', 'js', 'jsx', 'py', 'php', 'rb'].includes(fileExtension)) {
//             fileType = 'code';
//           }

//           const fileMetadata = {
//             name: file.name,
//             type: fileType,
//             size: formatFileSize(file.size),
//             downloadURL,
//             storageRef: snapshot.ref.fullPath,
//             description: '',
//             originalSize: file.size
//           };
          
//           const savedFile = await addFileToClient(client.id, fileMetadata);
//           uploadedFiles.push(savedFile);
//         }
        
//         setUploadProgress(100);
        
//         const message = `Successfully uploaded ${files.length} file(s) to ${client.name}'s account!`;
//         alert(message);
        
//       } catch (error) {
//         alert(`Error uploading files: ${error.message}. Please try again.`);
//       } finally {
//         setIsUploading(false);
//         setTimeout(() => setUploadProgress(0), 2000);
//       }
//     };

//     const handleDragEnter = (e) => {
//       e.preventDefault();
//       e.stopPropagation();
//       setIsDragging(true);
//     };

//     const handleDragOver = (e) => {
//       e.preventDefault();
//       e.stopPropagation();
//       if (e.dataTransfer.types.includes('Files')) {
//         setIsDragging(true);
//       }
//     };

//     const handleDragLeave = (e) => {
//       e.preventDefault();
//       e.stopPropagation();
      
//       const dropZone = e.currentTarget;
//       const relatedTarget = e.relatedTarget;
      
//       if (!dropZone.contains(relatedTarget)) {
//         setIsDragging(false);
//       }
//     };

//     const handleFileDrop = async (e) => {
//       e.preventDefault();
//       e.stopPropagation();
//       setIsDragging(false);
      
//       const files = Array.from(e.dataTransfer.files);
//       await uploadFiles(files);
//     };

//     const handleFileSelect = async (e) => {
//       const files = Array.from(e.target.files);
//       await uploadFiles(files);
//       e.target.value = '';
//     };

//     const handleFileRemove = async (fileId) => {
//       const fileToRemove = client.files?.find(f => f.id === fileId);
//       const fileName = fileToRemove?.name || 'Unknown file';
      
//       if (window.confirm(`Are you sure you want to remove "${fileName}"?`)) {
//         try {
//           await removeFileFromClient(client.id, fileId);
//           alert(`File "${fileName}" removed successfully!`);
//         } catch (error) {
//           alert('Error removing file: ' + error.message);
//         }
//       }
//     };

//     const getWeekDatesStartingMonday = () => {
//       const now = new Date();
//       const pstOffset = -8;
//       const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
//       const pstNow = new Date(utc + (pstOffset * 3600000));
      
//       const currentDay = pstNow.getDay();
//       let daysSinceMonday;
      
//       if (currentDay === 0) {
//         daysSinceMonday = 6;
//       } else {
//         daysSinceMonday = currentDay - 1;
//       }
      
//       const monday = new Date(pstNow.getFullYear(), pstNow.getMonth(), pstNow.getDate() - daysSinceMonday);
      
//       const weekDates = [];
//       for (let i = 0; i < 7; i++) {
//         const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
//         weekDates.push(date);
//       }
      
//       return weekDates;
//     };
    
//     const weekDates = getWeekDatesStartingMonday();
//     const weekSchedule = weekDates.map(date => {
//       const dateStr = date.toISOString().split('T')[0];
//       const daySchedule = getTodaysScheduleForClient(client.id, dateStr);
//       return {
//         date: dateStr,
//         dayName: date.toLocaleDateString('en-US', { 
//           timeZone: 'America/Los_Angeles',
//           weekday: 'short' 
//         }),
//         schedule: daySchedule
//       };
//     });

//     return (
//       <div className="space-y-6">
//         <div className="flex items-center space-x-4">
//           <button 
//             onClick={onBack}
//             className="px-4 py-2 bg-[#9B97A2] text-white rounded hover:bg-[#707070]"
//           >
//             ← Back
//           </button>
//           <h2 className="text-2xl font-bold text-[#292929]">{client.name}</h2>
//           <span className="bg-[#BED2D8] text-[#292929] px-3 py-1 rounded-full text-sm">
//             {client.businessName || client.jobGoal}
//           </span>
//         </div>
        
//         <div className="bg-[#BED2D8] border-l-4 border-[#6D858E] p-4 rounded">
//           <div className="flex">
//             <div className="flex-shrink-0">
//               <AlertCircle className="h-5 w-5 text-[#6D858E]" />
//             </div>
//             <div className="ml-3">
//               <p className="text-sm text-[#292929]">
//                 <strong>Coach Reference:</strong> This information is confidential and for coaching purposes only. Review the client's specific coaching approach before sessions.
//               </p>
//             </div>
//           </div>
//         </div>
        
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <h3 className="text-xl font-semibold mb-4 text-[#292929]">Business Information</h3>
//             <div className="space-y-4">
//               <div>
//                 <label className="text-sm font-medium text-[#707070]">Business Owner:</label>
//                 <p className="font-medium text-[#292929]">{client.name}</p>
//               </div>
//               <div>
//                 <label className="text-sm font-medium text-[#707070]">Business Name:</label>
//                 <p className="font-medium text-[#6D858E]">{client.businessName}</p>
//               </div>
//               <div>
//                 <label className="text-sm font-medium text-[#707070]">Business Description:</label>
//                 <p className="text-sm text-[#292929] bg-[#F5F5F5] p-3 rounded">{client.businessDescription}</p>
//               </div>
//               <div>
//                 <label className="text-sm font-medium text-[#707070]">Business Type:</label>
//                 <p className="font-medium text-[#292929]">{client.jobGoal}</p>
//               </div>
//               <div>
//                 <label className="text-sm font-medium text-[#707070]">Equipment Used:</label>
//                 <p className="text-[#292929]">{client.equipment}</p>
//               </div>
//               <div>
//                 <label className="text-sm font-medium text-[#707070]">Contact:</label>
//                 <p className="text-[#292929]">{client.email}</p>
//                 <p className="text-[#292929]">{client.phone}</p>
//               </div>
//               <div>
//                 <label className="text-sm font-medium text-[#707070]">Business Progress:</label>
//                 <input
//                   type="range"
//                   min="0"
//                   max="100"
//                   value={progress}
//                   onChange={(e) => setProgress(parseInt(e.target.value))}
//                   className="w-full mt-2"
//                 />
//                 <div className="flex justify-between text-sm text-[#707070]">
//                   <span>0%</span>
//                   <span className="font-medium">{progress}%</span>
//                   <span>100%</span>
//                 </div>
//               </div>
//             </div>
//           </div>
          
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <h3 className="text-xl font-semibold mb-4 text-[#292929]">Session Notes</h3>
            
//             <div className="space-y-3">
//               <div>
//                 <label className="text-sm font-medium text-[#707070]">Current Session Notes:</label>
//                 <textarea
//                   value={sessionNotes}
//                   onChange={(e) => setSessionNotes(e.target.value)}
//                   className="w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                   rows="4"
//                   placeholder="Add notes from today's session..."
//                 />
//               </div>
//               <div>
//                 <label className="text-sm font-medium text-[#707070]">General Notes:</label>
//                 <textarea
//                   value={notes}
//                   onChange={(e) => setNotes(e.target.value)}
//                   className="w-full mt-2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                   rows="3"
//                   placeholder="General coaching notes..."
//                 />
//               </div>
//               <button
//                 onClick={handleUpdate}
//                 className="bg-[#6D858E] text-white px-4 py-2 rounded-md hover:bg-[#5A4E69]"
//               >
//                 Update Progress & Notes
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Client Files Section with Drag & Drop */}
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="text-xl font-semibold flex items-center text-[#292929]">
//               <FileText className="mr-2" size={20} />
//               Client Work Files
//             </h3>
//             <button
//               onClick={() => setShowFileUpload(!showFileUpload)}
//               className="bg-[#6D858E] text-white px-4 py-2 rounded-md hover:bg-[#5A4E69] flex items-center space-x-2"
//             >
//               <Plus size={16} />
//               <span>Add File</span>
//             </button>
//           </div>

//           {/* Drag & Drop Zone */}
//           <div 
//             className={`mb-6 p-8 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${
//               isDragging 
//                 ? 'border-[#6D858E] bg-[#BED2D8]' 
//                 : 'border-[#9B97A2] bg-[#F5F5F5] hover:border-[#6D858E]'
//             } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
//             onDragEnter={handleDragEnter}
//             onDragOver={handleDragOver}
//             onDragLeave={handleDragLeave}
//             onDrop={handleFileDrop}
//             onClick={() => fileInputRef.current?.click()}
//           >
//             <input
//               ref={fileInputRef}
//               type="file"
//               multiple
//               onChange={handleFileSelect}
//               className="hidden"
//               accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip,.rar,.7z,.html,.css,.js,.jsx,.py,.php,.rb,.ai,.psd,.sketch"
//             />
//             <div className="text-center">
//               <Upload className={`mx-auto h-12 w-12 ${isDragging ? 'text-[#6D858E]' : 'text-[#9B97A2]'}`} />
//               <p className={`mt-2 text-sm font-medium ${isDragging ? 'text-[#6D858E]' : 'text-[#707070]'}`}>
//                 {isUploading ? 'Uploading files...' : 
//                  isDragging ? 'Drop files here!' : 
//                  'Drag and drop files here, or click to browse'}
//               </p>
//               <p className="text-xs text-[#9B97A2] mt-1">
//                 Supports: PDF, DOC, XLS, Images, ZIP, and more
//               </p>
//               {isUploading && (
//                 <div className="mt-3">
//                   <div className="w-full bg-[#F5F5F5] rounded-full h-2">
//                     <div 
//                       className="bg-[#6D858E] h-2 rounded-full transition-all duration-300" 
//                       style={{width: `${uploadProgress}%`}}
//                     ></div>
//                   </div>
//                   <p className="text-xs text-[#707070] mt-1">{uploadProgress}% uploaded</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {showFileUpload && (
//             <div className="mb-6 p-4 bg-[#F5F5F5] rounded-lg border">
//               <h4 className="font-semibold mb-3 text-[#292929]">Add New File Manually</h4>
//               <form onSubmit={handleFileUpload} className="space-y-3">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   <input
//                     type="text"
//                     placeholder="File name (e.g., Design Template.pdf)"
//                     value={newFile.name}
//                     onChange={(e) => setNewFile({...newFile, name: e.target.value})}
//                     className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                     required
//                   />
//                   <select
//                     value={newFile.type}
//                     onChange={(e) => setNewFile({...newFile, type: e.target.value})}
//                     className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                   >
//                     <option value="document">Document</option>
//                     <option value="image">Image</option>
//                     <option value="spreadsheet">Spreadsheet</option>
//                     <option value="design">Design File</option>
//                     <option value="archive">Archive/Zip</option>
//                     <option value="code">Code/Template</option>
//                   </select>
//                 </div>
//                 <input
//                   type="text"
//                   placeholder="Description (optional)"
//                   value={newFile.description}
//                   onChange={(e) => setNewFile({...newFile, description: e.target.value})}
//                   className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                 />
//                 <div className="flex space-x-2">
//                   <button
//                     type="submit"
//                     className="bg-[#6D858E] text-white px-4 py-2 rounded-md hover:bg-[#5A4E69]"
//                   >
//                     Add File
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => setShowFileUpload(false)}
//                     className="bg-[#9B97A2] text-white px-4 py-2 rounded-md hover:bg-[#707070]"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </form>
//             </div>
//           )}

//           <div className="space-y-3">
//             {client.files && client.files.length > 0 ? (
//               client.files.map(file => (
//                 <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-[#F5F5F5]">
//                   <div className="flex items-center space-x-4">
//                     <div className="text-2xl">{getFileIcon(file.type)}</div>
//                     <div>
//                       <h4 className="font-medium text-[#292929]">{file.name}</h4>
//                       <div className="text-sm text-[#707070]">
//                         <span>Uploaded by {file.uploadedBy}</span>
//                         <span className="mx-2">•</span>
//                         <span>{file.uploadDate}</span>
//                         <span className="mx-2">•</span>
//                         <span>{file.size}</span>
//                       </div>
//                       {file.description && (
//                         <p className="text-sm text-[#9B97A2] mt-1">{file.description}</p>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     {file.downloadURL && (
//                       <a 
//                         href={file.downloadURL} 
//                         target="_blank" 
//                         rel="noopener noreferrer"
//                         className="text-[#6D858E] hover:text-[#5A4E69] px-3 py-1 text-sm border border-[#6D858E] rounded hover:bg-[#BED2D8]"
//                       >
//                         View
//                       </a>
//                     )}
//                     {file.downloadURL && (
//                       <a 
//                         href={file.downloadURL} 
//                         download={file.name}
//                         className="text-[#6D858E] hover:text-[#5A4E69] px-3 py-1 text-sm border border-[#6D858E] rounded hover:bg-[#BED2D8]"
//                       >
//                         Download
//                       </a>
//                     )}
//                     <button 
//                       onClick={() => handleFileRemove(file.id)}
//                       className="text-red-600 hover:text-red-800 px-3 py-1 text-sm border border-red-600 rounded hover:bg-red-50"
//                     >
//                       Remove
//                     </button>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="text-center py-8 text-[#9B97A2]">
//                 <FileText size={48} className="mx-auto mb-2 text-[#9B97A2]" />
//                 <p>No files uploaded yet</p>
//                 <p className="text-sm">Drag and drop files above or use the Add File button</p>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <h3 className="text-xl font-semibold mb-4 text-[#292929]">Weekly Schedule</h3>
//           <div className="grid grid-cols-7 gap-2">
//             {weekSchedule.map((day, index) => (
//               <div key={day.date} className="border rounded p-2">
//                 <h4 className="font-semibold text-sm text-center mb-2 text-[#292929]">
//                   {day.dayName} {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
//                     timeZone: 'America/Los_Angeles',
//                     day: 'numeric'
//                   })}
//                 </h4>
//                 <div className="space-y-1">
//                   {day.schedule.map(session => {
//                     const slot = timeSlots.find(s => s.id === session.timeSlot);
//                     const coach = coaches.find(c => c.uid === session.coachId || c.id === session.coachId);
//                     return (
//                       <div key={session.id} className="bg-[#BED2D8] p-1 rounded text-xs">
//                         <p className="font-medium text-[#292929]">{slot?.label}</p>
//                         <p className="text-[#6D858E]">{coach?.name || 'No Coach Assigned'}</p>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
        
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <h3 className="text-xl font-semibold mb-4 text-[#6D858E] flex items-center">
//               <CheckCircle className="mr-2" size={20} />
//               Strengths
//             </h3>
//             <div className="text-[#292929] bg-[#BED2D8] p-4 rounded-lg border-l-4 border-[#6D858E]">
//               {client.strengths ? (
//                 <ul className="space-y-2">
//                   {client.strengths.split(', ').map((strength, index) => (
//                     <li key={index} className="flex items-start">
//                       <span className="text-[#6D858E] mr-2">•</span>
//                       <span>{strength}</span>
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-[#9B97A2]">No strengths documented</p>
//               )}
//             </div>
//           </div>
          
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <h3 className="text-xl font-semibold mb-4 text-[#5A4E69] flex items-center">
//               <AlertCircle className="mr-2" size={20} />
//               Challenges
//             </h3>
//             <div className="text-[#292929] bg-[#F5F5F5] p-4 rounded-lg border-l-4 border-[#5A4E69]">
//               {client.challenges ? (
//                 <ul className="space-y-2">
//                   {client.challenges.split(', ').map((challenge, index) => (
//                     <li key={index} className="flex items-start">
//                       <span className="text-[#5A4E69] mr-2">•</span>
//                       <span>{challenge}</span>
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p className="text-[#9B97A2]">No challenges documented</p>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <h3 className="text-xl font-semibold mb-4 text-[#5A4E69] flex items-center">
//             <User className="mr-2" size={20} />
//             Recommended Coaching Approach
//           </h3>
//           <div className="text-[#292929] bg-[#F5F5F5] p-4 rounded-lg border-l-4 border-[#5A4E69]">
//             {client.coachingApproach ? (
//               <ul className="space-y-3">
//                 {client.coachingApproach.split(', ').map((approach, index) => (
//                   <li key={index} className="flex items-start">
//                     <span className="text-[#5A4E69] mr-2 mt-1">→</span>
//                     <span>{approach}</span>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-[#9B97A2]">No coaching approach documented</p>
//             )}
//           </div>
//         </div>

//         {/* General Coaching Tips */}
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <h3 className="text-xl font-semibold mb-4 text-[#292929]">General Coaching Guidelines</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="bg-[#BED2D8] p-4 rounded-lg">
//               <h4 className="font-semibold text-[#292929] mb-2">Professional Boundaries</h4>
//               <ul className="text-sm text-[#292929] space-y-1">
//                 <li>• Maintain appropriate coach-client relationship</li>
//                 <li>• Avoid overly personal involvement</li>
//                 <li>• Set clear expectations early</li>
//               </ul>
//             </div>
//             <div className="bg-[#BED2D8] p-4 rounded-lg">
//               <h4 className="font-semibold text-[#292929] mb-2">Celebrate Success</h4>
//               <ul className="text-sm text-[#292929] space-y-1">
//                 <li>• Acknowledge business achievements</li>
//                 <li>• Recognize personal growth</li>
//                 <li>• Connect development to business success</li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

// // Monthly Schedule View for Schedulers
// const MonthlyScheduleView = ({ 
//   dailySchedules, 
//   clients, 
//   coaches, 
//   timeSlots, 
//   addScheduleAssignment, 
//   removeScheduleAssignment 
// }) => {
//   const [currentMonth, setCurrentMonth] = useState(new Date());
//   const [selectedDate, setSelectedDate] = useState(null);

//   const getDaysInMonth = (date) => {
//     const year = date.getFullYear();
//     const month = date.getMonth();
//     const firstDay = new Date(year, month, 1);
//     const lastDay = new Date(year, month + 1, 0);
//     const daysInMonth = lastDay.getDate();
//     const startingDayOfWeek = firstDay.getDay();

//     const days = [];
    
//     // Add empty cells for days before the first day of the month
//     for (let i = 0; i < startingDayOfWeek; i++) {
//       days.push(null);
//     }
    
//     // Add all days of the month
//     for (let day = 1; day <= daysInMonth; day++) {
//       days.push(new Date(year, month, day));
//     }
    
//     return days;
//   };

//   const getSchedulesForDate = (date) => {
//     if (!date) return [];
//     const dateStr = date.toISOString().split('T')[0];
//     return dailySchedules.filter(schedule => schedule.date === dateStr);
//   };

//   const navigateMonth = (direction) => {
//     const newMonth = new Date(currentMonth);
//     newMonth.setMonth(currentMonth.getMonth() + direction);
//     setCurrentMonth(newMonth);
//   };

//   const days = getDaysInMonth(currentMonth);
//   const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

//   return (
//     <div className="space-y-6">
//       <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
//         <h2 className="text-2xl font-bold mb-2">Monthly Schedule Overview</h2>
//         <p className="text-[#BED2D8]">Complete schedule view for all coaches and clients</p>
//       </div>

//       <div className="bg-white p-6 rounded-lg shadow-md">
//         <div className="flex justify-between items-center mb-6">
//           <h3 className="text-2xl font-bold text-[#292929]">{monthName}</h3>
//           <div className="flex space-x-2">
//             <button
//               onClick={() => navigateMonth(-1)}
//               className="px-4 py-2 bg-[#9B97A2] text-white rounded hover:bg-[#707070]"
//             >
//               Previous
//             </button>
//             <button
//               onClick={() => navigateMonth(1)}
//               className="px-4 py-2 bg-[#9B97A2] text-white rounded hover:bg-[#707070]"
//             >
//               Next
//             </button>
//           </div>
//         </div>

//         {/* Calendar Grid */}
//         <div className="grid grid-cols-7 gap-2 mb-4">
//           {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
//             <div key={day} className="text-center font-semibold p-2 bg-[#F5F5F5] rounded text-[#292929]">
//               {day}
//             </div>
//           ))}
//         </div>

//         <div className="grid grid-cols-7 gap-2">
//           {days.map((day, index) => {
//             if (!day) {
//               return <div key={index} className="h-24"></div>;
//             }

//             const schedules = getSchedulesForDate(day);
//             const isToday = day.toDateString() === new Date().toDateString();
//             const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

//             return (
//               <div
//                 key={index}
//                 className={`h-24 border rounded p-1 cursor-pointer transition-colors ${
//                   isToday ? 'border-[#6D858E] bg-[#BED2D8]' : 
//                   isSelected ? 'border-[#5A4E69] bg-[#F5F5F5]' : 
//                   'border-[#9B97A2] hover:bg-[#F5F5F5]'
//                 }`}
//                 onClick={() => setSelectedDate(day)}
//               >
//                 <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-[#6D858E]' : 'text-[#292929]'}`}>
//                   {day.getDate()}
//                 </div>
//                 <div className="space-y-1">
//                   {schedules.slice(0, 2).map(schedule => {
//                     const client = clients.find(c => c.id === schedule.clientId);
//                     const coach = coaches.find(c => c.uid === schedule.coachId || c.id === schedule.coachId);
//                     return (
//                       <div key={schedule.id} className="text-xs bg-[#6D858E] text-white px-1 py-0.5 rounded truncate">
//                         {client?.name.split(' ')[0]} / {coach?.name.split(' ')[1] || 'Coach'}
//                       </div>
//                     );
//                   })}
//                   {schedules.length > 2 && (
//                     <div className="text-xs text-[#9B97A2]">+{schedules.length - 2} more</div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Selected Date Details */}
//       {selectedDate && (
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <h3 className="text-xl font-semibold mb-4 text-[#292929]">
//             Schedule for {formatDatePST(selectedDate.toISOString().split('T')[0])}
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {timeSlots.map(slot => {
//               const schedules = getSchedulesForDate(selectedDate).filter(s => s.timeSlot === slot.id);
//               return (
//                 <div key={slot.id} className="border rounded-lg p-4">
//                   <h4 className="font-semibold text-lg mb-2 text-[#292929]">{slot.label}</h4>
//                   <div className="space-y-2">
//                     {schedules.length > 0 ? (
//                       schedules.map(schedule => {
//                         const client = clients.find(c => c.id === schedule.clientId);
//                         const coach = coaches.find(c => c.uid === schedule.coachId || c.id === schedule.coachId);
//                         return (
//                           <div key={schedule.id} className="bg-[#BED2D8] p-3 rounded flex justify-between items-start">
//                             <div>
//                               <p className="font-medium text-[#292929]">{coach?.name}</p>
//                               <p className="text-[#6D858E]">{client?.name}</p>
//                               <p className="text-xs text-[#707070]">{client?.businessName}</p>
//                             </div>
//                             <button
//                               onClick={() => removeScheduleAssignment(schedule.id)}
//                               className="text-red-500 hover:text-red-700 p-1"
//                               title="Remove assignment"
//                             >
//                               <Trash2 size={14} />
//                             </button>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <p className="text-[#9B97A2] italic">No sessions scheduled</p>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Client Dashboard
// const ClientDashboard = ({ userProfile, clients, dailySchedules, coaches, timeSlots }) => {
//   // Find the current client's data
//   const clientData = clients.find(c => c.email === userProfile.email) || clients[0];
  
//   if (!clientData) {
//     return (
//       <div className="text-center py-8">
//         <p className="text-[#9B97A2]">No client data found. Please contact your coach.</p>
//       </div>
//     );
//   }

//   const getMySchedule = (days = 7) => {
//     const schedule = [];
//     const today = new Date();
//     // Convert to PST
//     const pstOffset = -8;
//     const utc = today.getTime() + (today.getTimezoneOffset() * 60000);
//     const pstToday = new Date(utc + (pstOffset * 3600000));
    
//     // Get the start of the week (Monday) for weekly view, or start from today for other views
//     let startDate;
//     if (days === 7) {
//       const dayOfWeek = pstToday.getDay(); // 0 = Sunday, 1 = Monday, etc.
//       const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days to Monday
//       startDate = new Date(pstToday);
//       startDate.setDate(pstToday.getDate() - daysFromMonday);
//     } else {
//       startDate = new Date(pstToday);
//     }
    
//     for (let i = 0; i < days; i++) {
//       const date = new Date(startDate);
//       date.setDate(startDate.getDate() + i);
//       const dateStr = date.toISOString().split('T')[0];
      
//       const sessions = dailySchedules.filter(s => 
//         s.date === dateStr && s.clientId === clientData.id
//       );
      
//       schedule.push({
//         date: dateStr,
//         dayName: date.toLocaleDateString('en-US', { 
//           timeZone: 'America/Los_Angeles',
//           weekday: 'long' 
//         }),
//         sessions
//       });
//     }
//     return schedule;
//   };

//   const mySchedule = getMySchedule();
//   const todaysSessions = mySchedule[0]?.sessions || [];

//   return (
//     <div className="space-y-6">
//       <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
//         <h2 className="text-2xl font-bold mb-2">Welcome, {clientData.name}!</h2>
//         <p className="text-[#BED2D8]">Your ITG Business Journey Dashboard</p>
//       </div>

//       {/* Current Goals */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
//             <Target className="mr-2 text-[#6D858E]" size={20} />
//             Current Goals
//           </h3>
//           <div className="space-y-3">
//             <p className="text-[#292929]">{clientData.currentGoals || 'Work with your coach to set specific business goals.'}</p>
//             <div className="mt-4">
//               <div className="flex justify-between text-sm mb-1">
//                 <span className="text-[#707070]">Overall Progress</span>
//                 <span className="text-[#292929]">{clientData.progress || 0}%</span>
//               </div>
//               <div className="w-full bg-[#F5F5F5] rounded-full h-3">
//                 <div 
//                   className="bg-[#6D858E] h-3 rounded-full transition-all duration-300" 
//                   style={{width: `${clientData.progress || 0}%`}}
//                 ></div>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
//             <Building2 className="mr-2 text-[#6D858E]" size={20} />
//             My Business
//           </h3>
//           <div className="space-y-2">
//             <div>
//               <span className="text-sm text-[#707070]">Business Name:</span>
//               <p className="font-medium text-[#6D858E]">{clientData.businessName}</p>
//             </div>
//             <div>
//               <span className="text-sm text-[#707070]">Business Type:</span>
//               <p className="font-medium text-[#292929]">{clientData.jobGoal}</p>
//             </div>
//             <div>
//               <span className="text-sm text-[#707070]">Equipment:</span>
//               <p className="font-medium text-[#292929]">{clientData.equipment}</p>
//             </div>
//             {clientData.businessDescription && (
//               <div>
//                 <span className="text-sm text-[#707070]">Description:</span>
//                 <p className="text-sm text-[#292929] bg-[#F5F5F5] p-2 rounded mt-1">{clientData.businessDescription}</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Today's Schedule */}
//       <div className="bg-white p-6 rounded-lg shadow-md">
//         <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
//           <Clock className="mr-2 text-[#5A4E69]" size={20} />
//           Today's Schedule
//         </h3>
//         {todaysSessions.length > 0 ? (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             {todaysSessions.map(session => {
//               const slot = timeSlots.find(s => s.id === session.timeSlot);
//               const coach = coaches.find(c => c.uid === session.coachId || c.id === session.coachId);
//               return (
//                 <div key={session.id} className="bg-[#BED2D8] p-4 rounded-lg border border-[#6D858E]">
//                   <h4 className="font-semibold text-[#292929]">{slot?.label}</h4>
//                   <p className="text-[#6D858E]">with {coach?.name || 'Coach TBD'}</p>
//                   <p className="text-sm text-[#707070] mt-2">
//                     Ready to work on your business goals!
//                   </p>
//                 </div>
//               );
//             })}
//           </div>
//         ) : (
//           <div className="text-center py-8 text-[#9B97A2]">
//             <Clock size={48} className="mx-auto mb-2 text-[#9B97A2]" />
//             <p>No sessions scheduled for today</p>
//             <p className="text-sm">Check your weekly schedule below</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // Client Schedule View
// const ClientScheduleView = ({ userProfile, clients, dailySchedules, coaches, timeSlots }) => {
//   const clientData = clients.find(c => c.email === userProfile.email) || clients[0];
  
//   if (!clientData) {
//     return (
//       <div className="text-center py-8">
//         <p className="text-[#9B97A2]">No client data found. Please contact your coach.</p>
//       </div>
//     );
//   }

//   const getMyWeeklySchedule = () => {
//     const schedule = [];
//     const today = new Date();
    
//     // Convert to PST
//     const pstOffset = -8;
//     const utc = today.getTime() + (today.getTimezoneOffset() * 60000);
//     const pstToday = new Date(utc + (pstOffset * 3600000));
    
//     // Get the start of the week (Monday)
//     const dayOfWeek = pstToday.getDay(); // 0 = Sunday, 1 = Monday, etc.
//     const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days to Monday
//     const startOfWeek = new Date(pstToday);
//     startOfWeek.setDate(pstToday.getDate() - daysFromMonday);
    
//     for (let i = 0; i < 7; i++) {
//       const date = new Date(startOfWeek);
//       date.setDate(startOfWeek.getDate() + i);
//       const dateStr = date.toISOString().split('T')[0];
      
//       const sessions = dailySchedules.filter(s => 
//         s.date === dateStr && s.clientId === clientData.id
//       );
      
//       schedule.push({
//         date: dateStr,
//         dayName: date.toLocaleDateString('en-US', { 
//           timeZone: 'America/Los_Angeles',
//           weekday: 'long' 
//         }),
//         dayNumber: date.getDate(),
//         sessions
//       });
//     }
//     return schedule;
//   };

//   const weeklySchedule = getMyWeeklySchedule();

//   return (
//     <div className="space-y-6">
//       <h2 className="text-2xl font-bold text-[#292929]">My Weekly Schedule</h2>
      
//       <div className="bg-white p-6 rounded-lg shadow-md">
//         <h3 className="text-xl font-semibold mb-4 text-[#292929]">Your Coaching Sessions</h3>
//         <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
//           {weeklySchedule.map((day, index) => (
//             <div key={day.date} className="border rounded-lg p-3">
//               <h4 className="font-semibold text-center mb-2 text-[#292929]">
//                 {day.dayName}
//                 <br />
//                 <span className="text-sm text-[#707070]">{day.dayNumber}</span>
//               </h4>
//               <div className="space-y-2">
//                 {day.sessions.length > 0 ? (
//                   day.sessions.map(session => {
//                     const slot = timeSlots.find(s => s.id === session.timeSlot);
//                     const coach = coaches.find(c => c.uid === session.coachId || c.id === session.coachId);
//                     return (
//                       <div key={session.id} className="bg-[#BED2D8] p-2 rounded text-xs">
//                         <p className="font-medium text-[#292929]">{slot?.start}</p>
//                         <p className="text-[#6D858E]">{coach?.name || 'No Coach Assigned'}</p>
//                       </div>
//                     );
//                   })
//                 ) : (
//                   <p className="text-[#9B97A2] text-xs text-center py-2">No sessions</p>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Upcoming Sessions Details */}
//       <div className="bg-white p-6 rounded-lg shadow-md">
//         <h3 className="text-xl font-semibold mb-4 text-[#292929]">Session Details</h3>
//         <div className="space-y-4">
//           {weeklySchedule.flatMap(day => 
//             day.sessions.map(session => {
//               const slot = timeSlots.find(s => s.id === session.timeSlot);
//               const coach = coaches.find(c => c.uid === session.coachId || c.id === session.coachId);
              
//               return (
//                 <div key={session.id} className="border rounded-lg p-4 hover:bg-[#F5F5F5]">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <h4 className="font-semibold text-lg text-[#292929]">
//                         {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { 
//                           timeZone: 'America/Los_Angeles',
//                           weekday: 'long', 
//                           month: 'long', 
//                           day: 'numeric' 
//                         })}
//                       </h4>
//                       <p className="text-[#6D858E]">{slot?.label}</p>
//                       <p className="text-[#707070]">Coach: {coach?.name || 'No Coach Assigned'}</p>
//                     </div>
//                     <div className="text-right">
//                       <span className="bg-[#BED2D8] text-[#292929] px-2 py-1 rounded text-sm">
//                         Scheduled
//                       </span>
//                     </div>
//                   </div>
//                   <div className="mt-3 text-sm text-[#707070]">
//                     <p>Focus: Continue working on your current business goals</p>
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// // Client Goals View
// const ClientGoalsView = ({ userProfile, clients }) => {
//   const clientData = clients.find(c => c.email === userProfile.email) || clients[0];

//   if (!clientData) {
//     return (
//       <div className="text-center py-8">
//         <p className="text-[#9B97A2]">No client data found. Please contact your coach.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <h2 className="text-2xl font-bold text-[#292929]">My Goals & Progress</h2>
      
//       <div className="bg-white p-6 rounded-lg shadow-md">
//         <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
//           <Target className="mr-2 text-[#6D858E]" size={20} />
//           Current Goals
//         </h3>
//         <div className="bg-[#BED2D8] p-4 rounded-lg border-l-4 border-[#6D858E]">
//           <p className="text-[#292929]">{clientData.currentGoals || 'Work with your coach to set specific business goals for your success!'}</p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <h3 className="text-xl font-semibold mb-4 text-[#6D858E] flex items-center">
//             <CheckCircle className="mr-2" size={20} />
//             My Strengths
//           </h3>
//           <div className="text-[#292929] bg-[#BED2D8] p-4 rounded-lg border-l-4 border-[#6D858E]">
//             {clientData.strengths ? (
//               <ul className="space-y-2">
//                 {clientData.strengths.split(', ').map((strength, index) => (
//                   <li key={index} className="flex items-start">
//                     <span className="text-[#6D858E] mr-2">•</span>
//                     <span>{strength}</span>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-[#9B97A2]">Your coach will help identify your strengths!</p>
//             )}
//           </div>
//         </div>
        
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <h3 className="text-xl font-semibold mb-4 text-[#6D858E] flex items-center">
//             <TrendingUp className="mr-2" size={20} />
//             Progress Tracking
//           </h3>
//           <div className="space-y-4">
//             <div>
//               <div className="flex justify-between text-sm mb-2">
//                 <span className="text-[#707070]">Overall Business Progress</span>
//                 <span className="font-semibold text-[#292929]">{clientData.progress || 0}%</span>
//               </div>
//               <div className="w-full bg-[#F5F5F5] rounded-full h-4">
//                 <div 
//                   className="bg-[#6D858E] h-4 rounded-full transition-all duration-500" 
//                   style={{width: `${clientData.progress || 0}%`}}
//                 ></div>
//               </div>
//             </div>
//             <div className="mt-4 p-3 bg-[#BED2D8] rounded">
//               <p className="text-sm text-[#292929]">
//                 Great progress! Keep working toward your goals with your coach's guidance.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="bg-white p-6 rounded-lg shadow-md">
//         <h3 className="text-xl font-semibold mb-4 text-[#292929]">Business Information</h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <h4 className="font-semibold text-[#292929] mb-2">Business Details</h4>
//             <div className="space-y-2">
//               <div>
//                 <span className="text-sm text-[#707070]">Business Name:</span>
//                 <p className="font-medium text-[#6D858E]">{clientData.businessName}</p>
//               </div>
//               <div>
//                 <span className="text-sm text-[#707070]">Business Type:</span>
//                 <p className="font-medium text-[#292929]">{clientData.jobGoal}</p>
//               </div>
//               <div>
//                 <span className="text-sm text-[#707070]">Equipment:</span>
//                 <p className="font-medium text-[#292929]">{clientData.equipment}</p>
//               </div>
//             </div>
//           </div>
//           <div>
//             <h4 className="font-semibold text-[#292929] mb-2">Description</h4>
//             <p className="text-[#707070] bg-[#F5F5F5] p-3 rounded">
//               {clientData.businessDescription || 'Work with your coach to develop your business description.'}
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Enhanced AdminPanel with tabs and client filtering
// const AdminPanel = ({ 
//   clients, 
//   coaches, 
//   dailySchedules, 
//   timeSlots,
//   addNewClient,
//   createClientLoginAccount,
//   addNewCoach,
//   addScheduleAssignment,
//   removeScheduleAssignment,
//   removeClient,
//   removeCoach,
//   businessTypes,
//   equipmentOptions,
//   programs,
//   coachTypes
// }) => {
//   const [activeTab, setActiveTab] = useState('schedule');
//   const [clientFilter, setClientFilter] = useState('all');
//   const [editingClient, setEditingClient] = useState(null);
//   const [editingCoach, setEditingCoach] = useState(null);
  
//   // MOVED DRAG STATE HERE TO PREVENT PARENT RE-RENDERS FROM AFFECTING THIS COMPONENT
//   const [draggedClient, setDraggedClient] = useState(null);
//   const [dragOverSlot, setDragOverSlot] = useState(null);
  
//   const [selectedDate, setSelectedDateState] = useState(() => {
//     const pstDate = getPSTDate();
//     return pstDate;
//   });
  
//   const setSelectedDate = useCallback((newDate) => {
//     setSelectedDateState(newDate);
//   }, []);
  
//   const [newClient, setNewClient] = useState({
//     name: '', email: '', phone: '', jobGoal: '', businessName: '', 
//     equipment: '', strengths: '', challenges: '', coachingApproach: '', 
//     businessDescription: '', currentGoals: '', program: 'limitless'
//   });
//   const [newCoach, setNewCoach] = useState({
//     name: '', email: '', uid: '', role: 'coach', coachType: 'success'
//   });

//   const [isDragActive, setIsDragActive] = useState(false);
  
//   // Store the date when drag starts to prevent issues with date changes during drag
//   const dragDateRef = useRef(null);
  
//   const selectedDateRef = useRef(selectedDate);
  
//   // Keep selectedDateRef in sync with selectedDate
//   useEffect(() => {
//     selectedDateRef.current = selectedDate;
//   }, [selectedDate]);

//   // FIXED: Updated drag and drop handlers to prevent date resets
//   const handleDragStart = useCallback((e, client, dateForScheduling) => {
//     const dragDate = dateForScheduling || selectedDate;
    
//     setIsDragActive(true);
//     setDraggedClient(client);
//     dragDateRef.current = dragDate;
    
//     e.dataTransfer.effectAllowed = 'move';
//     e.dataTransfer.setData('scheduleDate', dragDate);
//   }, [selectedDate, isDragActive]);

//   const handleDragOver = useCallback((e, coachId, timeSlot) => {
//     e.preventDefault();
//     e.dataTransfer.dropEffect = 'move';
//     setDragOverSlot(`${coachId}-${timeSlot}`);
//   }, []);

//   const handleDragLeave = useCallback((e) => {
//     setDragOverSlot(null);
//   }, []);

//   const handleDrop = useCallback(async (e, coachId, timeSlot, explicitDate) => {
//     e.preventDefault();
//     setDragOverSlot(null);
//     setIsDragActive(false); // Reset drag active state
    
//     const scheduleDate = explicitDate || e.dataTransfer.getData('scheduleDate') || selectedDateRef.current;
    
//     if (!draggedClient) return;

//     if (!scheduleDate) {
//       alert('Please select a date first');
//       return;
//     }

//     if (!coachId) {
//       alert('Invalid coach selection');
//       return;
//     }

//     // Check if this client is already scheduled at this time
//     const existingSchedule = dailySchedules.find(s => 
//       s.date === scheduleDate && 
//       s.timeSlot === timeSlot && 
//       s.clientId === draggedClient.id
//     );

//     if (existingSchedule) {
//       alert('This client is already scheduled for this time slot!');
//       setDraggedClient(null);
//       return;
//     }

//     try {
//       await addScheduleAssignment(scheduleDate, timeSlot, coachId, draggedClient.id);
//       setDraggedClient(null);
//       alert('Client scheduled successfully!');
//     } catch (error) {
//       alert(`Error scheduling client: ${error.message || 'Please try again.'}`);
//       setDraggedClient(null);
//     }
//   }, [draggedClient, dailySchedules, addScheduleAssignment]);

//   const handleRemoveAssignment = useCallback((scheduleId) => {
//     removeScheduleAssignment(scheduleId);
//   }, [removeScheduleAssignment]);

//   const handleDateChange = (e) => {
//     const newDate = e.target.value;
    
//     // Only allow date changes when not dragging
//     if (isDragActive) {
//       return;
//     }
    
//     setSelectedDate(newDate);
    
//     // Clear any existing drag state when date changes
//     setDraggedClient(null);
//     setDragOverSlot(null);
//   };

//   // Effect to handle cleanup when drag ends unexpectedly
//   useEffect(() => {
//     const handleGlobalDragEnd = () => {
//       if (isDragActive) {
//         setIsDragActive(false);
//         setDraggedClient(null);
//         setDragOverSlot(null);
//       }
//     };

//     document.addEventListener('dragend', handleGlobalDragEnd);
//     return () => document.removeEventListener('dragend', handleGlobalDragEnd);
//   }, [isDragActive]);

//   // Updated handleAddClient function
//   const handleAddClient = async (e) => {
//     e.preventDefault();
//     try {
//       const result = await addNewClient(newClient);
//       setNewClient({ 
//         name: '', email: '', phone: '', jobGoal: '', businessName: '', 
//         equipment: '', strengths: '', challenges: '', coachingApproach: '', 
//         businessDescription: '', currentGoals: '', program: 'limitless'
//       });
      
//       alert(`Client added successfully!\n\nLogin credentials for ${newClient.name}:\nEmail: ${newClient.email}\nTemporary Password: ${result.tempPassword}\n\nPlease share these credentials with the client and ask them to change their password on first login.`);
//     } catch (error) {
//       alert('Error adding client. Please try again.');
//     }
//   };

//   const handleAddCoach = async (e) => {
//     e.preventDefault();
//     try {
//       await addNewCoach(newCoach);
//       setNewCoach({ name: '', email: '', uid: '', role: 'coach', coachType: 'success' });
//       alert('Coach added successfully!');
//     } catch (error) {
//       alert('Error adding coach. Please try again.');
//     }
//   };

//   // Handle client deletion
//   const handleDeleteClient = async (clientId, clientName) => {
//     if (!window.confirm(`Are you sure you want to permanently delete ${clientName}?\n\nThis will also remove:\n• All scheduled sessions\n• All files and notes\n• Login access\n\nThis action cannot be undone.`)) {
//       return;
//     }

//     try {
//       await removeClient(clientId);
//       alert(`${clientName} has been successfully removed from the system.`);
//     } catch (error) {
//       alert('Error deleting client. Please try again.');
//     }
//   };

//   // Handle coach deletion
//   const handleDeleteCoach = async (coachId, coachName) => {
//     if (!window.confirm(`Are you sure you want to remove ${coachName} from the coaching staff?\n\nThis will remove:\n• Their access to the system\n• Future scheduled sessions\n\nThis action cannot be undone.`)) {
//       return;
//     }

//     try {
//       await removeCoach(coachId);
//       alert(`${coachName} has been successfully removed from the coaching staff.`);
//     } catch (error) {
//       alert('Error deleting coach. Please try again.');
//     }
//   };

//   const handleEditClient = (client) => {
//   setEditingClient({...client});
// };

// const handleEditCoach = (coach) => {
//   setEditingCoach({...coach});
// };

// const handleUpdateClient = async (e) => {
//   e.preventDefault();
//   try {
//     const clientRef = doc(db, 'clients', editingClient.id);
    
//     // Clean the data before updating - remove any non-serializable fields
//     const { id, createdAt, updatedAt, ...cleanData } = editingClient;
    
//     // Ensure all fields are properly formatted
//     const updateData = {
//       name: cleanData.name || '',
//       email: cleanData.email || '',
//       phone: cleanData.phone || '',
//       program: cleanData.program || 'limitless',
//       businessName: cleanData.businessName || '',
//       jobGoal: cleanData.jobGoal || '',
//       equipment: cleanData.equipment || '',
//       businessDescription: cleanData.businessDescription || '',
//       currentGoals: cleanData.currentGoals || '',
//       strengths: cleanData.strengths || '',
//       challenges: cleanData.challenges || '',
//       coachingApproach: cleanData.coachingApproach || '',
//       // Keep existing fields if they exist
//       ...(cleanData.uid && { uid: cleanData.uid }),
//       ...(cleanData.role && { role: cleanData.role }),
//       ...(cleanData.status && { status: cleanData.status }),
//       ...(cleanData.progress !== undefined && { progress: cleanData.progress }),
//       ...(cleanData.files && { files: cleanData.files }),
//       ...(cleanData.notes && { notes: cleanData.notes }),
//       ...(cleanData.sessionNotes && { sessionNotes: cleanData.sessionNotes }),
//       ...(cleanData.lastSession && { lastSession: cleanData.lastSession }),
//       ...(cleanData.tempPassword && { tempPassword: cleanData.tempPassword }),
//       updatedAt: serverTimestamp()
//     };
    
//     await updateDoc(clientRef, updateData);
//     setEditingClient(null);
//     alert(`${editingClient.name} has been updated successfully!`);
//   } catch (error) {
//     console.error('Error updating client:', error);
//     alert(`Error updating client: ${error.message}. Please try again.`);
//   }
// };

// const handleUpdateCoach = async (e) => {
//   e.preventDefault();
//   try {
//     const coachRef = doc(db, 'coaches', editingCoach.id);
    
//     // Clean the data before updating
//     const { id, createdAt, updatedAt, ...cleanData } = editingCoach;
    
//     const updateData = {
//       name: cleanData.name || '',
//       email: cleanData.email || '',
//       uid: cleanData.uid || '',
//       role: cleanData.role || 'coach',
//       coachType: cleanData.coachType || 'success',
//       updatedAt: serverTimestamp()
//     };
    
//     await updateDoc(coachRef, updateData);
//     setEditingCoach(null);
//     alert(`${editingCoach.name} has been updated successfully!`);
//   } catch (error) {
//     console.error('Error updating coach:', error);
//     alert(`Error updating coach: ${error.message}. Please try again.`);
//   }
// };

//   // Filter clients based on selected program
//   const filteredClients = clientFilter === 'all' 
//     ? clients 
//     : clients.filter(client => (client.program || 'limitless') === clientFilter);

//   const tabs = [
//     { id: 'schedule', label: 'Daily Schedule', icon: Calendar },
//     { id: 'clients', label: 'Clients', icon: User },
//     { id: 'staff', label: 'Staff', icon: UserPlus }
//   ];

//   return (
//     <div className="space-y-6">
//       <h2 className="text-2xl font-bold text-[#292929]">ITG Admin Panel</h2>
      
//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <div className="text-center py-4">
//             <p className="text-3xl font-bold text-[#6D858E]">{clients.length}</p>
//             <p className="text-[#292929]">Total Clients</p>
//             <div className="mt-2 text-sm text-[#9B97A2]">
//               <div>Limitless: {clients.filter(c => (c.program || 'limitless') === 'limitless').length}</div>
//               <div>New Options: {clients.filter(c => c.program === 'new-options').length}</div>
//               <div>Bridges: {clients.filter(c => c.program === 'bridges').length}</div>
//               <div>Grace: {clients.filter(c => c.program === 'grace').length}</div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <div className="text-center py-4">
//             <p className="text-3xl font-bold text-[#6D858E]">{coaches.length}</p>
//             <p className="text-[#292929]">Total Staff</p>
//             <div className="mt-2 text-sm text-[#9B97A2]">
//               <div>Success Coaches: {coaches.filter(c => (c.coachType || 'success') === 'success').length}</div>
//               <div>Grace Coaches: {coaches.filter(c => c.coachType === 'grace').length}</div>
//               <div>Admins/Schedulers: {coaches.filter(c => c.role === 'admin' || c.role === 'scheduler').length}</div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <div className="text-center py-4">
//             <p className="text-3xl font-bold text-[#5A4E69]">
//               {dailySchedules.filter(s => s.date === selectedDate).length}
//             </p>
//             <p className="text-[#292929]">Sessions on {formatDatePST(selectedDate)}</p>
//             <div className="mt-2 text-sm text-[#9B97A2]">
//               <div>Schedulable Clients: {clients.filter(c => ['limitless', 'new-options', 'bridges'].includes(c.program || 'limitless')).length}</div>
//               <div>Grace Clients: {clients.filter(c => c.program === 'grace').length} (Not scheduled)</div>
//             </div>

       
//             {/* Drag status indicator */}
//             {isDragActive && (
//               <div className="mt-2 text-xs bg-[#BED2D8] text-[#292929] px-2 py-1 rounded">
//                 🔒 Date locked during drag operation
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="bg-white rounded-lg shadow-md">
//         <div className="border-b border-[#F5F5F5]">
//           <nav className="flex space-x-8">
//             {tabs.map(tab => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
//                   activeTab === tab.id
//                     ? 'border-[#6D858E] text-[#6D858E]'
//                     : 'border-transparent text-[#9B97A2] hover:text-[#707070] hover:border-[#9B97A2]'
//                 }`}
//               >
//                 <tab.icon size={18} />
//                 <span>{tab.label}</span>
//               </button>
//             ))}
//           </nav>
//         </div>

//         <div className="p-6">
//           {/* Daily Schedule Tab */}
//           {activeTab === 'schedule' && (
//             <div className="space-y-6">
//               <div className="flex justify-between items-center">
//                 <h3 className="text-xl font-semibold text-[#292929]">Daily Schedule Management</h3>
//                 <input
//                   type="date"
//                   value={selectedDate}
//                   onChange={handleDateChange}
//                   disabled={isDragActive}
//                   className={`px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6D858E] ${
//                     isDragActive ? 'bg-[#F5F5F5] cursor-not-allowed' : ''
//                   }`}
//                   title={isDragActive ? 'Date locked during drag operation' : 'Select date'}
//                 />
//               </div>
              
//               <DragDropScheduler 
//                 selectedDate={selectedDate}
//                 handleDragStart={handleDragStart}
//                 handleDragOver={handleDragOver}
//                 handleDragLeave={handleDragLeave}
//                 handleDrop={handleDrop}
//                 handleRemoveAssignment={handleRemoveAssignment}
//                 dragOverSlot={dragOverSlot}
//                 draggedClient={draggedClient}
//                 dailySchedules={dailySchedules}
//                 clients={clients}
//                 coaches={coaches}
//                 timeSlots={timeSlots}
//               />
//             </div>
//           )}

//           {/* Clients Tab */}
//           {activeTab === 'clients' && (
//             <div className="space-y-6">
//               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//                 <h3 className="text-xl font-semibold text-[#292929]">Client Management</h3>
//                 <div className="flex flex-col sm:flex-row gap-3">
//                   <div className="flex items-center space-x-2">
//                     <Filter size={16} className="text-[#9B97A2]" />
//                     <select
//                       value={clientFilter}
//                       onChange={(e) => setClientFilter(e.target.value)}
//                       className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                     >
//                       <option value="all">All Programs</option>
//                       <option value="limitless">Limitless</option>
//                       <option value="new-options">New Options</option>
//                       <option value="bridges">Bridges</option>
//                       <option value="grace">Grace</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* Add Client Form */}
//               <div className="bg-[#F5F5F5] p-6 rounded-lg">
//                 <h4 className="text-lg font-semibold mb-4 text-[#292929]">Add New Client</h4>
//                 <form onSubmit={handleAddClient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <input
//                     type="text"
//                     placeholder="Full Name"
//                     value={newClient.name}
//                     onChange={(e) => setNewClient({...newClient, name: e.target.value})}
//                     className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                     required
//                   />
//                   <input
//                     type="email"
//                     placeholder="Email"
//                     value={newClient.email}
//                     onChange={(e) => setNewClient({...newClient, email: e.target.value})}
//                     className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                     required
//                   />
//                   <input
//                     type="tel"
//                     placeholder="Phone"
//                     value={newClient.phone}
//                     onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
//                     className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                   />
//                   <select
//                     value={newClient.program}
//                     onChange={(e) => setNewClient({...newClient, program: e.target.value})}
//                     className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                     required
//                   >
//                     <option value="">Select Program</option>
//                     {programs.map(program => (
//                       <option key={program.id} value={program.id}>{program.name} - {program.description}</option>
//                     ))}
//                   </select>
                  
//                   {/* Show business fields only for Limitless program */}
//                   {newClient.program === 'limitless' && (
//                     <>
//                       <input
//                         type="text"
//                         placeholder="Business Name"
//                         value={newClient.businessName}
//                         onChange={(e) => setNewClient({...newClient, businessName: e.target.value})}
//                         className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                       />
//                       <select
//                         value={newClient.jobGoal}
//                         onChange={(e) => setNewClient({...newClient, jobGoal: e.target.value})}
//                         className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                       >
//                         <option value="">Select Business Type</option>
//                         {businessTypes.map(type => (
//                           <option key={type} value={type}>{type}</option>
//                         ))}
//                       </select>
//                       <select
//                         value={newClient.equipment}
//                         onChange={(e) => setNewClient({...newClient, equipment: e.target.value})}
//                         className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                       >
//                         <option value="">Equipment Used</option>
//                         {equipmentOptions.map(equipment => (
//                           <option key={equipment} value={equipment}>{equipment}</option>
//                         ))}
//                       </select>
//                     </>
//                   )}
                  
//                   {/* Show job fields for New Options */}
//                   {newClient.program === 'new-options' && (
//                     <input
//                       type="text"
//                       placeholder="Job Interest/Field"
//                       value={newClient.jobGoal}
//                       onChange={(e) => setNewClient({...newClient, jobGoal: e.target.value})}
//                       className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                       title="What type of community job are they interested in?"
//                     />
//                   )}
                  
//                   {/* Show skill development fields for Bridges */}
//                   {newClient.program === 'bridges' && (
//                     <input
//                       type="text"
//                       placeholder="Career Goals/Skills"
//                       value={newClient.jobGoal}
//                       onChange={(e) => setNewClient({...newClient, jobGoal: e.target.value})}
//                       className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                       title="What career skills or internship goals are they working toward?"
//                     />
//                   )}
                  
//                   <div className="md:col-span-2">
//                     <textarea
//                       placeholder={
//                         newClient.program === 'limitless' ? 'Business Description' :
//                         newClient.program === 'new-options' ? 'Job interests and community work goals' :
//                         newClient.program === 'bridges' ? 'Career development and internship goals' :
//                         'Program description and goals'
//                       }
//                       value={newClient.businessDescription}
//                       onChange={(e) => setNewClient({...newClient, businessDescription: e.target.value})}
//                       className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                       rows="2"
//                     />
//                   </div>
//                   <div className="md:col-span-2">
//                     <textarea
//                       placeholder="Current Goals (what they should work on)"
//                       value={newClient.currentGoals}
//                       onChange={(e) => setNewClient({...newClient, currentGoals: e.target.value})}
//                       className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                       rows="2"
//                     />
//                   </div>
//                   <textarea
//                     placeholder="Strengths (e.g., Creative with designs, works independently, good with people)"
//                     value={newClient.strengths}
//                     onChange={(e) => setNewClient({...newClient, strengths: e.target.value})}
//                     className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                     rows="2"
//                   />
//                   <textarea
//                     placeholder="Challenges (e.g., Easily distracted, needs redirection, social anxiety)"
//                     value={newClient.challenges}
//                     onChange={(e) => setNewClient({...newClient, challenges: e.target.value})}
//                     className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                     rows="2"
//                   />
//                   <div className="md:col-span-2">
//                     <textarea
//                       placeholder="Coaching Approach (e.g., Regular check-ins, monitor progress, provide clear expectations)"
//                       value={newClient.coachingApproach}
//                       onChange={(e) => setNewClient({...newClient, coachingApproach: e.target.value})}
//                       className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                       rows="3"
//                     />
//                   </div>
//                   <div className="md:col-span-2">
//                     <button
//                       type="submit"
//                       className="bg-[#6D858E] text-white px-6 py-2 rounded-md hover:bg-[#5A4E69] flex items-center space-x-2"
//                     >
//                       <Plus size={16} />
//                       <span>Add Client</span>
//                     </button>
//                   </div>
//                 </form>
//               </div>

//               {/* Current Clients */}
//               <div>
//                 <h4 className="text-lg font-semibold mb-4 text-[#292929]">
//                   Current Clients 
//                   <span className="text-sm text-[#9B97A2] ml-2">
//                     ({filteredClients.length} {clientFilter === 'all' ? 'total' : `in ${clientFilter}`})
//                   </span>
//                 </h4>
//                 <div className="space-y-4">
//                   {filteredClients.map(client => (
//                     <div key={client.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-[#F5F5F5]">
//                       <div>
//                         <h4 className="font-semibold text-[#292929]">{client.name}</h4>
//                         <p className="text-sm text-[#707070]">{client.email}</p>
//                         <div className="flex items-center space-x-2 mt-1">
//                           <span className={`text-xs px-2 py-1 rounded font-medium ${
//                             client.program === 'limitless' ? 'bg-[#BED2D8] text-[#292929]' :
//                             client.program === 'new-options' ? 'bg-[#BED2D8] text-[#292929]' :
//                             client.program === 'bridges' ? 'bg-[#BED2D8] text-[#292929]' :
//                             client.program === 'grace' ? 'bg-[#F5F5F5] text-[#292929]' :
//                             'bg-[#BED2D8] text-[#292929]'
//                           }`}>
//                             {client.program === 'limitless' ? 'Limitless' :
//                              client.program === 'new-options' ? 'New Options' :
//                              client.program === 'bridges' ? 'Bridges' :
//                              client.program === 'grace' ? 'Grace' :
//                              'Limitless'}
//                           </span>
//                           <p className="text-xs text-[#9B97A2]">{client.businessName || client.jobGoal}</p>
//                         </div>
//                       </div>
//                       <div className="flex items-center space-x-2">
//                         <div className="text-right">
//                           {client.uid ? (
//                             <div>
//                               <span className="bg-[#BED2D8] text-[#292929] px-2 py-1 rounded text-sm">
//                                 ✓ Can Log In
//                               </span>
//                               {client.tempPassword && (
//                                 <p className="text-xs text-[#9B97A2] mt-1">
//                                   Temp Password: <code className="bg-[#F5F5F5] px-1 rounded">{client.tempPassword}</code>
//                                 </p>
//                               )}
//                             </div>
//                           ) : (
//                             <button
//                               onClick={() => createClientLoginAccount(client)}
//                               className="bg-[#6D858E] text-white px-3 py-1 rounded text-sm hover:bg-[#5A4E69]"
//                             >
//                               Create Login Account
//                             </button>
//                           )}
//                         </div>
//                         <button
//                           onClick={() => handleEditClient(client)}
//                           className="bg-[#6D858E] text-white px-3 py-1 rounded text-sm hover:bg-[#5A4E69] flex items-center space-x-1"
//                           title="Edit client"
//                         >
//                           <Edit3 size={14} />
//                           <span>Edit</span>
//                         </button>
//                         <button
//                           onClick={() => handleDeleteClient(client.id, client.name)}
//                           className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center space-x-1"
//                           title="Delete client permanently"
//                         >
//                           <Trash2 size={14} />
//                           <span>Delete</span>
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
                
//                 {filteredClients.length === 0 && (
//                   <div className="text-center py-8 text-[#9B97A2]">
//                     <p>No clients found for the selected filter!</p>
//                   </div>
//                 )}
//               </div>

//               {/* Client Edit Modal */}
//               {editingClient && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//                   <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
//                     <div className="flex justify-between items-center mb-4">
//                       <h3 className="text-lg font-semibold flex items-center text-[#292929]">
//                         <Edit3 className="mr-2" size={20} />
//                         Edit Client: {editingClient.name}
//                       </h3>
//                       <button 
//                         onClick={() => setEditingClient(null)} 
//                         className="text-[#707070] hover:text-[#292929]"
//                       >
//                         <X size={20} />
//                       </button>
//                     </div>

//                     <form onSubmit={handleUpdateClient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <input
//                         type="text"
//                         placeholder="Full Name"
//                         value={editingClient.name}
//                         onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
//                         className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                         required
//                       />
//                       <input
//                         type="email"
//                         placeholder="Email"
//                         value={editingClient.email}
//                         onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
//                         className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                         required
//                       />
//                       <input
//                         type="tel"
//                         placeholder="Phone"
//                         value={editingClient.phone || ''}
//                         onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
//                         className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                       />
//                       <select
//                         value={editingClient.program || 'limitless'}
//                         onChange={(e) => setEditingClient({...editingClient, program: e.target.value})}
//                         className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                         required
//                       >
//                         {programs.map(program => (
//                           <option key={program.id} value={program.id}>{program.name} - {program.description}</option>
//                         ))}
//                       </select>
                      
//                       {editingClient.program === 'limitless' && (
//                         <>
//                           <input
//                             type="text"
//                             placeholder="Business Name"
//                             value={editingClient.businessName || ''}
//                             onChange={(e) => setEditingClient({...editingClient, businessName: e.target.value})}
//                             className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                           />
//                           <select
//                             value={editingClient.jobGoal || ''}
//                             onChange={(e) => setEditingClient({...editingClient, jobGoal: e.target.value})}
//                             className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                           >
//                             <option value="">Select Business Type</option>
//                             {businessTypes.map(type => (
//                               <option key={type} value={type}>{type}</option>
//                             ))}
//                           </select>
//                           <select
//                             value={editingClient.equipment || ''}
//                             onChange={(e) => setEditingClient({...editingClient, equipment: e.target.value})}
//                             className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                           >
//                             <option value="">Equipment Used</option>
//                             {equipmentOptions.map(equipment => (
//                               <option key={equipment} value={equipment}>{equipment}</option>
//                             ))}
//                           </select>
//                         </>
//                       )}
                      
//                       {editingClient.program === 'new-options' && (
//                         <input
//                           type="text"
//                           placeholder="Job Interest/Field"
//                           value={editingClient.jobGoal || ''}
//                           onChange={(e) => setEditingClient({...editingClient, jobGoal: e.target.value})}
//                           className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                         />
//                       )}
                      
//                       {editingClient.program === 'bridges' && (
//                         <input
//                           type="text"
//                           placeholder="Career Goals/Skills"
//                           value={editingClient.jobGoal || ''}
//                           onChange={(e) => setEditingClient({...editingClient, jobGoal: e.target.value})}
//                           className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                         />
//                       )}
                      
//                       <div className="md:col-span-2">
//                         <textarea
//                           placeholder={
//                             editingClient.program === 'limitless' ? 'Business Description' :
//                             editingClient.program === 'new-options' ? 'Job interests and community work goals' :
//                             editingClient.program === 'bridges' ? 'Career development and internship goals' :
//                             'Program description and goals'
//                           }
//                           value={editingClient.businessDescription || ''}
//                           onChange={(e) => setEditingClient({...editingClient, businessDescription: e.target.value})}
//                           className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                           rows="2"
//                         />
//                       </div>
//                       <div className="md:col-span-2">
//                         <textarea
//                           placeholder="Current Goals"
//                           value={editingClient.currentGoals || ''}
//                           onChange={(e) => setEditingClient({...editingClient, currentGoals: e.target.value})}
//                           className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                           rows="2"
//                         />
//                       </div>
//                       <textarea
//                         placeholder="Strengths"
//                         value={editingClient.strengths || ''}
//                         onChange={(e) => setEditingClient({...editingClient, strengths: e.target.value})}
//                         className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                         rows="2"
//                       />
//                       <textarea
//                         placeholder="Challenges"
//                         value={editingClient.challenges || ''}
//                         onChange={(e) => setEditingClient({...editingClient, challenges: e.target.value})}
//                         className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                         rows="2"
//                       />
//                       <div className="md:col-span-2">
//                         <textarea
//                           placeholder="Coaching Approach"
//                           value={editingClient.coachingApproach || ''}
//                           onChange={(e) => setEditingClient({...editingClient, coachingApproach: e.target.value})}
//                           className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                           rows="3"
//                         />
//                       </div>
//                       <div className="md:col-span-2 flex space-x-2 pt-2">
//                         <button
//                           type="submit"
//                           className="bg-[#6D858E] text-white px-6 py-2 rounded-md hover:bg-[#5A4E69] flex items-center space-x-2"
//                         >
//                           <CheckCircle size={16} />
//                           <span>Update Client</span>
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => setEditingClient(null)}
//                           className="bg-[#9B97A2] text-white px-6 py-2 rounded-md hover:bg-[#707070] flex items-center space-x-2"
//                         >
//                           <X size={16} />
//                           <span>Cancel</span>
//                         </button>
//                       </div>
//                     </form>
//                   </div>
//                 </div>
//               )}
//               </div>
//             )}

//           {/* Staff Tab */}
//           {activeTab === 'staff' && (
//             <div className="space-y-6">
//               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//                 <h3 className="text-xl font-semibold text-[#292929]">Staff Management</h3>
//               </div>

//               {/* Add Coach Form */}
//               <div className="bg-[#F5F5F5] p-6 rounded-lg">
//                 <h4 className="text-lg font-semibold mb-4 text-[#292929]">Add New Staff Member</h4>
//                 <form onSubmit={handleAddCoach} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <input
//                     type="text"
//                     placeholder="Full Name"
//                     value={newCoach.name}
//                     onChange={(e) => setNewCoach({...newCoach, name: e.target.value})}
//                     className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                     required
//                   />
//                   <input
//                     type="email"
//                     placeholder="Email"
//                     value={newCoach.email}
//                     onChange={(e) => setNewCoach({...newCoach, email: e.target.value})}
//                     className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                     required
//                   />
//                   <input
//                     type="text"
//                     placeholder="Firebase UID"
//                     value={newCoach.uid}
//                     onChange={(e) => setNewCoach({...newCoach, uid: e.target.value})}
//                     className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                     required
//                   />
//                   <select
//                     value={newCoach.role}
//                     onChange={(e) => setNewCoach({...newCoach, role: e.target.value})}
//                     className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                     required
//                   >
//                     <option value="coach">Coach</option>
//                     <option value="scheduler">Scheduler</option>
//                     <option value="admin">Admin</option>
//                   </select>
//                   <div className="md:col-span-2">
//                     <select
//                       value={newCoach.coachType}
//                       onChange={(e) => setNewCoach({...newCoach, coachType: e.target.value})}
//                       className="px-3 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                       required
//                     >
//                       {coachTypes.map(type => (
//                         <option key={type.id} value={type.id}>
//                           {type.name} - {type.programs.map(p => programs.find(prog => prog.id === p)?.name).join(', ')}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <div className="md:col-span-2">
//                     <button
//                       type="submit"
//                       className="bg-[#6D858E] text-white px-6 py-2 rounded-md hover:bg-[#5A4E69] flex items-center space-x-2"
//                     >
//                       <Plus size={16} />
//                       <span>Add Staff Member</span>
//                     </button>
//                   </div>
//                 </form>
//               </div>

//               {/* Current Staff */}
//               <div>
//                 <h4 className="text-lg font-semibold mb-4 text-[#292929]">Current Staff Members</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {coaches.map(coach => (
//                     <div key={coach.id} className="p-4 border rounded-lg hover:bg-[#F5F5F5]">
//                       <div className="flex justify-between items-start mb-2">
//                         <div className="flex-1">
//                           <h4 className="font-semibold text-[#292929]">{coach.name}</h4>
//                           <p className="text-sm text-[#707070]">{coach.email}</p>
//                           <p className="text-xs text-[#9B97A2] capitalize">{coach.role}</p>
//                           <span className={`text-xs px-2 py-1 rounded font-medium mt-1 inline-block ${
//                             coach.coachType === 'success' ? 'bg-[#BED2D8] text-[#292929]' : 'bg-[#F5F5F5] text-[#292929]'
//                           }`}>
//                             {coach.coachType === 'success' ? 'Success Coach' : 'Grace Coach'}
//                           </span>
//                           <p className="text-xs text-[#6D858E] mt-1">
//                             Today's Sessions: {dailySchedules.filter(s => (s.coachId === coach.uid || s.coachId === coach.id) && s.date === selectedDate).length}
//                           </p>
//                         </div>
//                         <div className="flex flex-col space-y-1">
//                           <button
//                             onClick={() => handleEditCoach(coach)}
//                             className="bg-[#6D858E] text-white px-2 py-1 rounded text-xs hover:bg-[#5A4E69] flex items-center space-x-1"
//                             title="Edit staff member"
//                           >
//                             <Edit3 size={12} />
//                             <span>Edit</span>
//                           </button>
//                           <button
//                             onClick={() => handleDeleteCoach(coach.id, coach.name)}
//                             className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 flex items-center space-x-1"
//                             title="Remove from staff"
//                           >
//                             <Trash2 size={12} />
//                             <span>Remove</span>
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Coach Edit Modal */}
//               {editingCoach && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//                   <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
//                     <div className="flex justify-between items-center mb-4">
//                       <h3 className="text-lg font-semibold flex items-center text-[#292929]">
//                         <Edit3 className="mr-2" size={20} />
//                         Edit Staff Member: {editingCoach.name}
//                       </h3>
//                       <button 
//                         onClick={() => setEditingCoach(null)} 
//                         className="text-[#707070] hover:text-[#292929]"
//                       >
//                         <X size={20} />
//                       </button>
//                     </div>

//                     <form onSubmit={handleUpdateCoach} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <input
//                         type="text"
//                         placeholder="Full Name"
//                         value={editingCoach.name}
//                         onChange={(e) => setEditingCoach({...editingCoach, name: e.target.value})}
//                         className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                         required
//                       />
//                       <input
//                         type="email"
//                         placeholder="Email"
//                         value={editingCoach.email}
//                         onChange={(e) => setEditingCoach({...editingCoach, email: e.target.value})}
//                         className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                         required
//                       />
//                       <input
//                         type="text"
//                         placeholder="Firebase UID"
//                         value={editingCoach.uid}
//                         onChange={(e) => setEditingCoach({...editingCoach, uid: e.target.value})}
//                         className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                         required
//                       />
//                       <select
//                         value={editingCoach.role}
//                         onChange={(e) => setEditingCoach({...editingCoach, role: e.target.value})}
//                         className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                         required
//                       >
//                         <option value="coach">Coach</option>
//                         <option value="scheduler">Scheduler</option>
//                         <option value="admin">Admin</option>
//                       </select>
//                       <div className="md:col-span-2">
//                         <select
//                           value={editingCoach.coachType}
//                           onChange={(e) => setEditingCoach({...editingCoach, coachType: e.target.value})}
//                           className="px-3 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//                           required
//                         >
//                           {coachTypes.map(type => (
//                             <option key={type.id} value={type.id}>
//                               {type.name} - {type.programs.map(p => programs.find(prog => prog.id === p)?.name).join(', ')}
//                             </option>
//                           ))}
//                         </select>
//                       </div>
//                       <div className="md:col-span-2 flex space-x-2 pt-2">
//                         <button
//                           type="submit"
//                           className="bg-[#6D858E] text-white px-6 py-2 rounded-md hover:bg-[#5A4E69] flex items-center space-x-2"
//                         >
//                           <CheckCircle size={16} />
//                           <span>Update Staff Member</span>
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => setEditingCoach(null)}
//                           className="bg-[#9B97A2] text-white px-6 py-2 rounded-md hover:bg-[#707070] flex items-center space-x-2"
//                         >
//                           <X size={16} />
//                           <span>Cancel</span>
//                         </button>
//                       </div>
//                     </form>
//                   </div>
//                 </div>
//               )}
              
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// const JobCoachApp = () => {
//   const [user, setUser] = useState(null);
//   const [userProfile, setUserProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('dashboard');
//   const [selectedClient, setSelectedClient] = useState(null);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [clients, setClients] = useState([]);
//   const [coaches, setCoaches] = useState([]);
//   const [dailySchedules, setDailySchedules] = useState([]);
//   const [showPasswordModal, setShowPasswordModal] = useState(false);

//   const timeSlots = [
//     { id: '8-10', label: '8:00 AM - 10:00 AM PST', start: '8:00 AM PST', end: '10:00 AM PST' },
//     { id: '10-12', label: '10:00 AM - 12:00 PM PST', start: '10:00 AM PST', end: '12:00 PM PST' },
//     { id: '1230-230', label: '12:30 PM - 2:30 PM PST', start: '12:30 PM PST', end: '2:30 PM PST' }
//   ];

//   const businessTypes = [
//     'Custom Mug Designer',
//     'Custom Product Creator', 
//     'Clothing Designer',
//     'Custom Clothing Designer',
//     'eBay Reseller',
//     'Vending Machine Business Owner',
//     'Other'
//   ];

//   const equipmentOptions = [
//     'Heat Press',
//     'Embroidery Machine', 
//     'Mug Heat Press',
//     'Vending Machines',
//     'None'
//   ];

//   const programs = [
//     { id: 'limitless', name: 'Limitless', description: 'Business Owners' },
//     { id: 'new-options', name: 'New Options', description: 'Jobs in the Community' },
//     { id: 'bridges', name: 'Bridges', description: 'Transitioning & Job Skills Development' },
//     { id: 'grace', name: 'Grace', description: 'Enrichment Program' }
//   ];

//   const coachTypes = [
//     { id: 'success', name: 'Success Coach', programs: ['limitless', 'new-options', 'bridges'] },
//     { id: 'grace', name: 'Grace Coach', programs: ['grace'] }
//   ];

//   // Password generation utility
//   const generateTempPassword = () => {
//     const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
//     let password = '';
//     for (let i = 0; i < 8; i++) {
//       password += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     return password;
//   };

//   // Get navigation items based on role
//   const getNavigationItems = () => {
//     const baseItems = [
//       { id: 'dashboard', icon: TrendingUp, label: 'Dashboard' }
//     ];

//     switch (userProfile?.role) {
//       case 'admin':
//         return [
//           ...baseItems,
//           { id: 'schedule', icon: Clock, label: 'My Schedule' },
//           { id: 'monthly-schedule', icon: CalendarDays, label: 'Monthly Schedule' },
//           { id: 'clients', icon: User, label: 'Clients' },
//           { id: 'resources', icon: BookOpen, label: 'Resources' },
//           { id: 'admin', icon: Settings, label: 'Admin' }
//         ];
//       case 'coach':
//         return [
//           ...baseItems,
//           { id: 'schedule', icon: Clock, label: 'My Schedule' },
//           { id: 'clients', icon: User, label: 'Clients' },
//           { id: 'resources', icon: BookOpen, label: 'Resources' }
//         ];
//       case 'scheduler':
//         return [
//           ...baseItems,
//           { id: 'monthly-schedule', icon: CalendarDays, label: 'Monthly Schedule' },
//           { id: 'clients', icon: User, label: 'Clients' }
//         ];
//       case 'client':
//         return [
//           ...baseItems,
//           { id: 'my-schedule', icon: Clock, label: 'My Schedule' },
//           { id: 'my-goals', icon: Target, label: 'My Goals' },
//           { id: 'resources', icon: BookOpen, label: 'Resources' }
//         ];
//       default:
//         return baseItems;
//     }
//   };

//   // Firebase Auth State Listener
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       if (firebaseUser) {
//         setUser(firebaseUser);
        
//         try {
//           const coachDoc = await getDocs(query(
//             collection(db, 'coaches'), 
//             where('uid', '==', firebaseUser.uid)
//           ));
          
//           if (!coachDoc.empty) {
//             const profile = { id: coachDoc.docs[0].id, ...coachDoc.docs[0].data() };
//             setUserProfile(profile);
//           } else {
//             const clientDoc = await getDocs(query(
//               collection(db, 'clients'), 
//               where('uid', '==', firebaseUser.uid)
//             ));
            
//             if (!clientDoc.empty) {
//               const profile = { 
//                 id: clientDoc.docs[0].id, 
//                 ...clientDoc.docs[0].data(),
//                 role: 'client'
//               };
//               setUserProfile(profile);
//             } else {
//               const basicProfile = {
//                 uid: firebaseUser.uid,
//                 email: firebaseUser.email,
//                 name: firebaseUser.email?.split('@')[0] || 'User',
//                 role: 'client'
//               };
//               setUserProfile(basicProfile);
//             }
//           }
//         } catch (error) {
//           setUserProfile({
//             uid: firebaseUser.uid,
//             email: firebaseUser.email,
//             name: firebaseUser.email?.split('@')[0] || 'User',
//             role: 'client'
//           });
//         }
//       } else {
//         setUser(null);
//         setUserProfile(null);
//       }
      
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   // Real-time listeners for Firestore data
//   useEffect(() => {
//     if (!user) return;

//     const clientsUnsubscribe = onSnapshot(collection(db, 'clients'), (snapshot) => {
//       const clientsData = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setClients(clientsData);
//     });

//     const coachesUnsubscribe = onSnapshot(collection(db, 'coaches'), (snapshot) => {
//       const coachesData = snapshot.docs
//         .map(doc => ({ id: doc.id, ...doc.data() }))
//         .filter(user => user.role === 'coach' || user.role === 'admin' || user.role === 'scheduler');
//       setCoaches(coachesData);
//     });

//     const schedulesUnsubscribe = onSnapshot(collection(db, 'schedules'), (snapshot) => {
//       const schedulesData = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setDailySchedules(schedulesData);
//     });

//     return () => {
//       clientsUnsubscribe();
//       coachesUnsubscribe();
//       schedulesUnsubscribe();
//     };
//   }, [user]);

//   const handleLogin = async (email, password) => {
//     try {
//       setLoading(true);
//       await signInWithEmailAndPassword(auth, email, password);
//     } catch (error) {
//       alert('Login failed. Please check your credentials.');
//       setLoading(false);
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       await signOut(auth);
//       setActiveTab('dashboard');
//       setSelectedClient(null);
//     } catch (error) {
//       console.error('Logout error:', error);
//     }
//   };

//   const addNewClient = async (clientData) => {
//     try {
//       const tempPassword = generateTempPassword();
      
//       const userCredential = await createUserWithEmailAndPassword(auth, clientData.email, tempPassword);
//       const uid = userCredential.user.uid;
      
//       const newClient = {
//         ...clientData,
//         uid: uid,
//         role: 'client',
//         createdAt: serverTimestamp(),
//         status: 'Active',
//         progress: 0,
//         files: [],
//         tempPassword: tempPassword
//       };
      
//       await addDoc(collection(db, 'clients'), newClient);
//       await signOut(auth);
      
//       return { success: true, tempPassword };
//     } catch (error) {
//       throw error;
//     }
//   };

//   const createClientLoginAccount = async (client) => {
//     try {
//       const tempPassword = generateTempPassword();
      
//       const userCredential = await createUserWithEmailAndPassword(auth, client.email, tempPassword);
//       const uid = userCredential.user.uid;
      
//       await updateDoc(doc(db, 'clients', client.id), {
//         uid: uid,
//         role: 'client',
//         tempPassword: tempPassword,
//         updatedAt: serverTimestamp()
//       });
      
//       await signOut(auth);
      
//       alert(`Login account created for ${client.name}!\n\nEmail: ${client.email}\nTemporary Password: ${tempPassword}\n\nPlease share these credentials with the client.`);
//     } catch (error) {
//       if (error.code === 'auth/email-already-in-use') {
//         alert('This email is already registered. The client may already have a login account.');
//       } else {
//         alert('Error creating login account. Please try again.');
//       }
//     }
//   };


//   const addNewCoach = async (coachData) => {
//     try {
//       const newCoach = {
//         ...coachData,
//         role: coachData.role || 'coach',
//         coachType: coachData.coachType || 'success',
//         createdAt: serverTimestamp()
//       };
//       await addDoc(collection(db, 'coaches'), newCoach);
//     } catch (error) {
//       throw error;
//     }
//   };

//   const removeClient = async (clientId) => {
//     try {
//       // Remove all scheduled sessions for this client
//       const clientSchedules = dailySchedules.filter(s => s.clientId === clientId);
//       for (const schedule of clientSchedules) {
//         await deleteDoc(doc(db, 'schedules', schedule.id));
//       }
      
//       // Remove the client document
//       await deleteDoc(doc(db, 'clients', clientId));
//     } catch (error) {
//       throw error;
//     }
//   };

//   const removeCoach = async (coachId) => {
//     try {
//       // Remove all scheduled sessions for this coach
//       const coachSchedules = dailySchedules.filter(s => s.coachId === coachId);
//       for (const schedule of coachSchedules) {
//         await deleteDoc(doc(db, 'schedules', schedule.id));
//       }
      
//       // Remove the coach document
//       await deleteDoc(doc(db, 'coaches', coachId));
//     } catch (error) {
//       throw error;
//     }
//   };

//   const addScheduleAssignment = async (date, timeSlot, coachId, clientId) => {
//     try {
//       const newSchedule = {
//         date: date,
//         timeSlot: timeSlot,
//         coachId: coachId,
//         clientId: clientId,
//         createdAt: serverTimestamp()
//       };
//       await addDoc(collection(db, 'schedules'), newSchedule);
//     } catch (error) {
//       throw error;
//     }
//   };

//   const removeScheduleAssignment = async (scheduleId) => {
//     try {
//       await deleteDoc(doc(db, 'schedules', scheduleId));
//     } catch (error) {
//       console.error('Error removing schedule:', error);
//     }
//   };

//   const updateClientProgress = async (clientId, updates) => {
//     try {
//       await updateDoc(doc(db, 'clients', clientId), {
//         ...updates,
//         lastSession: new Date().toISOString().split('T')[0],
//         updatedAt: serverTimestamp()
//       });
//     } catch (error) {
//       throw error;
//     }
//   };

//   const addFileToClient = async (clientId, fileData) => {
//     try {
//       const newFile = {
//         id: Date.now().toString(),
//         ...fileData,
//         uploadDate: new Date().toISOString().split('T')[0],
//         uploadedBy: userProfile?.name || 'Unknown User',
//         uploadedAt: serverTimestamp()
//       };
      
//       // Get current client data
//       const client = clients.find(c => c.id === clientId);
//       if (!client) {
//         throw new Error('Client not found');
//       }
      
//       const updatedFiles = [...(client.files || []), newFile];
//       const clientRef = doc(db, 'clients', clientId);
      
//       await updateDoc(clientRef, {
//         files: updatedFiles,
//         updatedAt: serverTimestamp()
//       });
      
//       return newFile;
//     } catch (error) {
//       throw error;
//     }
//   };

//   const removeFileFromClient = async (clientId, fileId) => {
//     try {
//       const client = clients.find(c => c.id === clientId);
//       if (!client) {
//         throw new Error('Client not found');
//       }
      
//       const fileToRemove = client.files?.find(f => f.id === fileId);
      
//       // Delete file from Firebase Storage if it exists
//       if (fileToRemove && fileToRemove.storageRef) {
//         try {
//           const fileRef = ref(storage, fileToRemove.storageRef);
//           await deleteObject(fileRef);
//         } catch (storageError) {
//           // Continue with removing from database even if storage deletion fails
//         }
//       }
      
//       const updatedFiles = (client.files || []).filter(f => f.id !== fileId);
//       const clientRef = doc(db, 'clients', clientId);
      
//       await updateDoc(clientRef, {
//         files: updatedFiles,
//         updatedAt: serverTimestamp()
//       });
//     } catch (error) {
//       throw error;
//     }
//   };

//   const getFileIcon = (fileType) => {
//     switch (fileType) {
//       case 'document': return '📄';
//       case 'image': return '🖼️';
//       case 'spreadsheet': return '📊';
//       case 'design': return '🎨';
//       case 'archive': return '📦';
//       case 'code': return '💻';
//       default: return '📎';
//     }
//   };

//   const getTodaysScheduleForCoach = (coachId, date) => {
//     return dailySchedules.filter(schedule => 
//       schedule.coachId === coachId && schedule.date === date
//     );
//   };

//   const getTodaysScheduleForClient = (clientId, date) => {
//     return dailySchedules.filter(schedule => 
//       schedule.clientId === clientId && schedule.date === date
//     );
//   };

//   const getScheduleForDateAndSlot = (date, timeSlot) => {
//     return dailySchedules.filter(schedule => 
//       schedule.date === date && schedule.timeSlot === timeSlot
//     );
//   };

//   const Navigation = () => {
//     const navItems = getNavigationItems();
    
//     return (
//       <nav className="bg-[#6D858E] text-white p-4">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-xl font-bold">ITG Coach Portal</h1>
//             <p className="text-xs text-[#BED2D8]">Independence Through Grace</p>
//           </div>
//           <div className="hidden md:flex space-x-6">
//             {navItems.map(item => (
//               <button 
//                 key={item.id}
//                 onClick={() => setActiveTab(item.id)} 
//                 className={`flex items-center space-x-2 px-3 py-2 rounded ${activeTab === item.id ? 'bg-[#5A4E69]' : 'hover:bg-[#5A4E69]'}`}
//               >
//                 <item.icon size={18} />
//                 <span>{item.label}</span>
//               </button>
//             ))}
//           </div>
//           <div className="flex items-center space-x-4">
//             <div className="hidden md:block text-right">
//               <div className="text-sm">{userProfile?.name}</div>
//               <div className="text-xs text-[#BED2D8] capitalize">{userProfile?.role}</div>
//             </div>
//             <button 
//               onClick={() => setShowPasswordModal(true)} 
//               className="flex items-center space-x-1 hover:bg-[#5A4E69] px-3 py-2 rounded"
//               title="Change Password"
//             >
//               <Key size={18} />
//               <span className="hidden md:inline">Password</span>
//             </button>
//             <button onClick={handleLogout} className="flex items-center space-x-1 hover:bg-[#5A4E69] px-3 py-2 rounded">
//               <LogOut size={18} />
//               <span className="hidden md:inline">Logout</span>
//             </button>
//             <button 
//               className="md:hidden"
//               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//             >
//               {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
//             </button>
//           </div>
//         </div>
        
//         {isMobileMenuOpen && (
//           <div className="md:hidden mt-4 space-y-2">
//             {navItems.map(item => (
//               <button 
//                 key={item.id}
//                 onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} 
//                 className={`w-full text-left flex items-center space-x-2 px-3 py-2 rounded ${activeTab === item.id ? 'bg-[#5A4E69]' : 'hover:bg-[#5A4E69]'}`}
//               >
//                 <item.icon size={18} />
//                 <span>{item.label}</span>
//               </button>
//             ))}
//             <button 
//               onClick={() => { setShowPasswordModal(true); setIsMobileMenuOpen(false); }} 
//               className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded hover:bg-[#5A4E69]"
//             >
//               <Key size={18} />
//               <span>Change Password</span>
//             </button>
//           </div>
//         )}
//       </nav>
//     );
//   };

//   const Dashboard = () => {
//     const today = getPSTDate();
//     const myTodaySchedule = userProfile?.role === 'admin' 
//       ? dailySchedules.filter(s => s.date === today)
//       : getTodaysScheduleForCoach(user.uid, today);

//     // Route to client dashboard if user is a client
//     if (userProfile?.role === 'client') {
//       return <ClientDashboard 
//         userProfile={userProfile} 
//         clients={clients} 
//         dailySchedules={dailySchedules} 
//         coaches={coaches} 
//         timeSlots={timeSlots} 
//       />;
//     }

//     // Filter clients to exclude Grace clients from general stats since they don't use daily scheduling
//     const schedulableClients = clients.filter(c => ['limitless', 'new-options', 'bridges'].includes(c.program || 'limitless'));

//     return (
//       <div className="space-y-6">
//         <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
//           <h2 className="text-2xl font-bold mb-2">ITG {userProfile?.role === 'scheduler' ? 'Scheduler' : 'Coach'} Dashboard</h2>
//           <p className="text-[#BED2D8]">Supporting adults with disabilities in their development journey</p>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-[#707070]">Scheduled Clients</p>
//                 <p className="text-3xl font-bold text-[#6D858E]">{schedulableClients.length}</p>
//               </div>
//               <Building2 className="text-[#6D858E]" size={40} />
//             </div>
//             <div className="mt-2 text-xs text-[#9B97A2]">
//               <div>Grace: {clients.filter(c => c.program === 'grace').length} (separate)</div>
//             </div>
//           </div>
          
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-[#707070]">Active Coaches</p>
//                 <p className="text-3xl font-bold text-[#6D858E]">{coaches.filter(c => c.role === 'coach').length}</p>
//               </div>
//               <User className="text-[#6D858E]" size={40} />
//             </div>
//             <div className="mt-2 text-xs text-[#9B97A2]">
//               <div>Success: {coaches.filter(c => (c.coachType || 'success') === 'success').length}</div>
//               <div>Grace: {coaches.filter(c => c.coachType === 'grace').length}</div>
//             </div>
//           </div>
          
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-[#707070]">Today's Sessions</p>
//                 <p className="text-3xl font-bold text-[#5A4E69]">{myTodaySchedule.length}</p>
//               </div>
//               <Clock className="text-[#5A4E69]" size={40} />
//             </div>
//           </div>

//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-[#707070]">Avg. Progress</p>
//                 <p className="text-3xl font-bold text-[#5A4E69]">
//                   {clients.length > 0 ? Math.round(clients.reduce((acc, client) => acc + (client.progress || 0), 0) / clients.length) : 0}%
//                 </p>
//               </div>
//               <TrendingUp className="text-[#5A4E69]" size={40} />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <h3 className="text-xl font-semibold mb-4 text-[#292929]">Today's Schedule - {formatDatePST(today)}</h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {timeSlots.map(slot => {
//               const slotSchedules = getScheduleForDateAndSlot(today, slot.id);
              
//               return (
//                 <div key={slot.id} className="border rounded-lg p-4">
//                   <h4 className="font-semibold text-lg mb-2 text-[#292929]">{slot.label}</h4>
//                   <div className="space-y-2">
//                     {slotSchedules.length > 0 ? (
//                       slotSchedules.map(schedule => {
//                         const coach = coaches.find(c => c.uid === schedule.coachId || c.id === schedule.coachId);
//                         const client = clients.find(c => c.id === schedule.clientId);
                        
//                         return (
//                           <div key={schedule.id} className="bg-[#BED2D8] p-2 rounded text-sm">
//                             <p className="font-medium text-[#292929]">{coach?.name || 'Unknown Coach'}</p>
//                             <p 
//                               className="text-[#6D858E] cursor-pointer hover:text-[#5A4E69] hover:underline"
//                               onClick={() => {
//                                 setSelectedClient(client);
//                                 setActiveTab('clients');
//                               }}
//                               title="Click to view client details"
//                             >
//                               {client?.name || 'Unknown Client'}
//                             </p>
//                             <div className="flex justify-between items-center">
//                               <p 
//                                 className="text-xs text-[#707070] cursor-pointer hover:text-[#292929] hover:underline"
//                                 onClick={() => {
//                                   setSelectedClient(client);
//                                   setActiveTab('clients');
//                                 }}
//                                 title="Click to view client details"
//                               >
//                                 {client?.program === 'limitless' ? client?.businessName :
//                                  client?.program === 'new-options' ? 'Community Job' :
//                                  client?.program === 'bridges' ? 'Career Dev' :
//                                  client?.businessName}
//                               </p>
//                               <span className={`text-xs px-1 rounded ${
//                                 client?.program === 'limitless' ? 'bg-white text-[#6D858E]' :
//                                 client?.program === 'new-options' ? 'bg-white text-[#6D858E]' :
//                                 client?.program === 'bridges' ? 'bg-white text-[#5A4E69]' :
//                                 'bg-white text-[#9B97A2]'
//                               }`}>
//                                 {client?.program === 'limitless' ? 'L' :
//                                  client?.program === 'new-options' ? 'NO' :
//                                  client?.program === 'bridges' ? 'B' :
//                                  'L'}
//                               </span>
//                             </div>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <p className="text-[#9B97A2] italic text-sm">No sessions scheduled</p>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const MyScheduleTab = () => {
//     const [selectedDate, setSelectedDate] = useState(getPSTDate());
//     const mySchedule = userProfile?.role === 'admin' 
//       ? dailySchedules.filter(s => s.date === selectedDate)
//       : getTodaysScheduleForCoach(user.uid, selectedDate);
    
//     return (
//       <div className="space-y-6">
//         <h2 className="text-2xl font-bold text-[#292929]">My Schedule</h2>
        
//         <div className="bg-white p-6 rounded-lg shadow-md">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="text-xl font-semibold text-[#292929]">Schedule for {formatDatePST(selectedDate)}</h3>
//             <input
//               type="date"
//               value={selectedDate}
//               onChange={(e) => setSelectedDate(e.target.value)}
//               className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//             />
//           </div>
          
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {timeSlots.map(slot => {
//               const slotSchedules = mySchedule.filter(s => s.timeSlot === slot.id);
              
//               return (
//                 <div key={slot.id} className="border rounded-lg p-4">
//                   <h4 className="font-semibold text-lg mb-2 text-[#292929]">{slot.label}</h4>
//                   <div className="space-y-2">
//                     {slotSchedules.length > 0 ? (
//                       slotSchedules.map(schedule => {
//                         const client = clients.find(c => c.id === schedule.clientId);
//                         const coach = coaches.find(c => c.uid === schedule.coachId || c.id === schedule.coachId);
                        
//                         return (
//                           <div key={schedule.id} className="bg-[#BED2D8] p-2 rounded text-sm">
//                             <p className="font-medium text-[#292929]">{coach?.name || 'Unknown Coach'}</p>
//                             <p 
//                               className="text-[#6D858E] cursor-pointer hover:text-[#5A4E69] hover:underline"
//                               onClick={() => {
//                                 setSelectedClient(client);
//                                 setActiveTab('clients');
//                               }}
//                               title="Click to view client details"
//                             >
//                               {client?.name || 'Unknown Client'}
//                             </p>
//                             <div className="flex justify-between items-center">
//                               <p 
//                                 className="text-xs text-[#707070] cursor-pointer hover:text-[#292929] hover:underline"
//                                 onClick={() => {
//                                   setSelectedClient(client);
//                                   setActiveTab('clients');
//                                 }}
//                                 title="Click to view client details"
//                               >
//                                 {client?.program === 'limitless' ? client?.businessName :
//                                  client?.program === 'new-options' ? 'Community Job' :
//                                  client?.program === 'bridges' ? 'Career Dev' :
//                                  client?.businessName}
//                               </p>
//                               <span className={`text-xs px-1 rounded ${
//                                 client?.program === 'limitless' ? 'bg-white text-[#6D858E]' :
//                                 client?.program === 'new-options' ? 'bg-white text-[#6D858E]' :
//                                 client?.program === 'bridges' ? 'bg-white text-[#5A4E69]' :
//                                 'bg-white text-[#9B97A2]'
//                               }`}>
//                                 {client?.program === 'limitless' ? 'L' :
//                                  client?.program === 'new-options' ? 'NO' :
//                                  client?.program === 'bridges' ? 'B' :
//                                  'L'}
//                               </span>
//                             </div>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <p className="text-[#9B97A2] italic">No sessions assigned</p>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const ClientsTab = () => {
//     const [clientFilter, setClientFilter] = useState('all');
    
//     if (selectedClient) {
//       return (
//         <ClientDetail 
//           client={selectedClient} 
//           onBack={() => setSelectedClient(null)}
//           updateClientProgress={updateClientProgress}
//           addFileToClient={addFileToClient}
//           removeFileFromClient={removeFileFromClient}
//           getTodaysScheduleForClient={getTodaysScheduleForClient}
//           getFileIcon={getFileIcon}
//           timeSlots={timeSlots}
//           coaches={coaches}
//         />
//       );
//     }

//     // Filter clients based on selected program
//     const filteredClients = clientFilter === 'all' 
//       ? clients 
//       : clients.filter(client => (client.program || 'limitless') === clientFilter);

//     return (
//       <div className="space-y-6">
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//           <h2 className="text-2xl font-bold text-[#292929]">All Clients</h2>
//           <div className="flex items-center space-x-2">
//             <Filter size={16} className="text-[#9B97A2]" />
//             <select
//               value={clientFilter}
//               onChange={(e) => setClientFilter(e.target.value)}
//               className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//             >
//               <option value="all">All Programs</option>
//               <option value="limitless">Limitless</option>
//               <option value="new-options">New Options</option>
//               <option value="bridges">Bridges</option>
//               <option value="grace">Grace</option>
//             </select>
//             <div className="flex space-x-2 text-sm">
//               <span className="bg-[#BED2D8] text-[#292929] px-2 py-1 rounded">Limitless: {clients.filter(c => (c.program || 'limitless') === 'limitless').length}</span>
//               <span className="bg-[#BED2D8] text-[#292929] px-2 py-1 rounded">New Options: {clients.filter(c => c.program === 'new-options').length}</span>
//               <span className="bg-[#BED2D8] text-[#292929] px-2 py-1 rounded">Bridges: {clients.filter(c => c.program === 'bridges').length}</span>
//               <span className="bg-[#F5F5F5] text-[#292929] px-2 py-1 rounded">Grace: {clients.filter(c => c.program === 'grace').length}</span>
//             </div>
//           </div>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredClients.map(client => {
//             const today = getPSTDate();
//             const todaySchedule = getTodaysScheduleForClient(client.id, today);
//             const todayCoach = todaySchedule.length > 0 ? coaches.find(c => c.uid === todaySchedule[0].coachId || c.id === todaySchedule[0].coachId) : null;
            
//             return (
//               <div key={client.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
//                    onClick={() => setSelectedClient(client)}>
//                 <div className="flex items-center space-x-4 mb-4">
//                   <div className="flex-shrink-0 h-12 w-12 bg-[#6D858E] rounded-full flex items-center justify-center">
//                     <span className="text-white text-lg font-medium">
//                       {client.name.split(' ').map(n => n[0]).join('')}
//                     </span>
//                   </div>
//                   <div>
//                     <h3 className="text-lg font-semibold text-[#292929]">{client.name}</h3>
//                     <p className="text-[#707070]">
//                       {client.program === 'limitless' ? (client.businessName || client.jobGoal) :
//                        client.program === 'new-options' ? (client.jobGoal || 'Community Job Focus') :
//                        client.program === 'bridges' ? (client.jobGoal || 'Career Development') :
//                        client.program === 'grace' ? 'Enrichment Program' :
//                        (client.businessName || client.jobGoal)}
//                     </p>
//                     <div className="flex items-center space-x-2 mt-1">
//                       <span className={`text-xs px-2 py-1 rounded font-medium ${
//                         client.program === 'limitless' ? 'bg-[#BED2D8] text-[#292929]' :
//                         client.program === 'new-options' ? 'bg-[#BED2D8] text-[#292929]' :
//                         client.program === 'bridges' ? 'bg-[#BED2D8] text-[#292929]' :
//                         client.program === 'grace' ? 'bg-[#F5F5F5] text-[#292929]' :
//                         'bg-[#BED2D8] text-[#292929]'
//                       }`}>
//                         {client.program === 'limitless' ? 'Limitless' :
//                          client.program === 'new-options' ? 'New Options' :
//                          client.program === 'bridges' ? 'Bridges' :
//                          client.program === 'grace' ? 'Grace' :
//                          'Limitless'}
//                       </span>
//                       {todayCoach && (
//                         <p className="text-sm text-[#6D858E]">Today with: {todayCoach.name}</p>
//                       )}
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="space-y-3">
//                   <div>
//                     <div className="flex justify-between text-sm mb-1">
//                       <span className="text-[#707070]">
//                         {client.program === 'limitless' ? 'Business Progress' :
//                          client.program === 'new-options' ? 'Job Readiness' :
//                          client.program === 'bridges' ? 'Skill Development' :
//                          client.program === 'grace' ? 'Program Progress' :
//                          'Progress'}
//                       </span>
//                       <span className="text-[#292929]">{client.progress || 0}%</span>
//                     </div>
//                     <div className="w-full bg-[#F5F5F5] rounded-full h-2">
//                       <div 
//                         className="bg-[#6D858E] h-2 rounded-full" 
//                         style={{width: `${client.progress || 0}%`}}
//                       ></div>
//                     </div>
//                   </div>
                  
//                   {client.equipment && client.program === 'limitless' && (
//                     <div className="flex justify-between text-sm">
//                       <span className="text-[#707070]">Equipment:</span>
//                       <span className="font-medium text-[#292929]">{client.equipment}</span>
//                     </div>
//                   )}
                  
//                   <div className="flex justify-between text-sm">
//                     <span className="text-[#707070]">Status:</span>
//                     <span className="font-medium text-[#6D858E]">{client.status || 'Active'}</span>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {filteredClients.length === 0 && (
//           <div className="text-center py-8 text-[#9B97A2]">
//             <p>No clients found for the selected program filter!</p>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const Resources = () => {
//     const disabilityResources = {
//       'Business Development for Adults with Disabilities': [
//         'ABLE Account Setup for Business Savings',
//         'Disability Employment Incentives (WOTC)',
//         'Vocational Rehabilitation Business Resources',
//         'Assistive Technology for Business Operations',
//         'Social Security Work Incentives (PASS Plans)'
//       ],
//       'Adaptive Business Tools': [
//         'Accessible Point of Sale Systems',
//         'Voice Recognition Software for Business',
//         'Visual Schedule Templates',
//         'Communication Support Tools',
//         'Adaptive Workspace Setup Guide'
//       ],
//       'Marketing & Sales Support': [
//         'Simple Social Media Templates',
//         'Customer Communication Scripts',
//         'Business Card Design Templates',
//         'Online Store Setup Guide',
//         'Local Market Research Tools'
//       ],
//       'Financial Management': [
//         'Simple Bookkeeping Systems',
//         'Tax Preparation Resources',
//         'Business Banking Guide',
//         'Grant Opportunities for Disabled Entrepreneurs',
//         'Pricing Strategy Worksheets'
//       ]
//     };

//     const clientResources = {
//       'Getting Started': [
//         'Setting Up Your Workspace',
//         'Basic Business Planning',
//         'Understanding Your Equipment',
//         'Safety Guidelines'
//       ],
//       'Marketing Your Business': [
//         'Creating Social Media Posts',
//         'Taking Good Product Photos',
//         'Pricing Your Products',
//         'Customer Service Tips'
//       ],
//       'Managing Your Business': [
//         'Keeping Track of Orders',
//         'Managing Your Time',
//         'Setting Daily Goals',
//         'Celebrating Your Success'
//       ]
//     };

//     const resources = userProfile?.role === 'client' ? clientResources : disabilityResources;
//     const title = userProfile?.role === 'client' ? 'Business Resources' : 'ITG Coaching Resources';
//     const subtitle = userProfile?.role === 'client' 
//       ? 'Tools and guides to help your business succeed' 
//       : 'Supporting entrepreneurial success for adults with disabilities';

//     return (
//       <div className="space-y-6">
//         <div className="bg-gradient-to-r from-[#6D858E] to-[#5A4E69] text-white p-6 rounded-lg">
//           <h2 className="text-2xl font-bold mb-2">{title}</h2>
//           <p className="text-[#BED2D8]">{subtitle}</p>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {Object.entries(resources).map(([category, resourceList]) => (
//             <div key={category} className="bg-white p-6 rounded-lg shadow-md">
//               <h3 className="text-xl font-semibold mb-4 flex items-center text-[#292929]">
//                 <BookOpen className="mr-2 text-[#6D858E]" size={20} />
//                 {category}
//               </h3>
//               <ul className="space-y-2">
//                 {resourceList.map((resource, index) => (
//                   <li key={index} className="flex items-start space-x-2 hover:bg-[#F5F5F5] p-2 rounded cursor-pointer">
//                     <FileText className="text-[#707070] mt-1 flex-shrink-0" size={16} />
//                     <span className="text-sm text-[#292929]">{resource}</span>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </div>

//         {userProfile?.role !== 'client' && (
//           <div className="bg-white p-6 rounded-lg shadow-md">
//             <h3 className="text-xl font-semibold mb-4 text-[#292929]">Equipment & Business Type Quick Reference</h3>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               <div>
//                 <h4 className="font-semibold text-[#6D858E] mb-2">Heat Press Businesses</h4>
//                 <ul className="text-sm space-y-1 text-[#292929]">
//                   <li>• Custom mugs and tumblers</li>
//                   <li>• T-shirt and clothing design</li>
//                   <li>• Tote bags and accessories</li>
//                   <li>• Personalized gifts</li>
//                 </ul>
//               </div>
//               <div>
//                 <h4 className="font-semibold text-[#6D858E] mb-2">Embroidery Businesses</h4>
//                 <ul className="text-sm space-y-1 text-[#292929]">
//                   <li>• Custom coasters</li>
//                   <li>• Embroidered clothing</li>
//                   <li>• Monogrammed items</li>
//                   <li>• Patches and badges</li>
//                 </ul>
//               </div>
//               <div>
//                 <h4 className="font-semibold text-[#5A4E69] mb-2">Online Businesses</h4>
//                 <ul className="text-sm space-y-1 text-[#292929]">
//                   <li>• eBay reselling</li>
//                   <li>• Vending machine routes</li>
//                   <li>• Digital product sales</li>
//                   <li>• Service-based businesses</li>
//                 </ul>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const renderContent = () => {
//     if (userProfile?.role === 'client') {
//       switch (activeTab) {
//         case 'dashboard':
//           return <ClientDashboard 
//             userProfile={userProfile} 
//             clients={clients} 
//             dailySchedules={dailySchedules} 
//             coaches={coaches} 
//             timeSlots={timeSlots} 
//           />;
//         case 'my-schedule':
//           return <ClientScheduleView 
//             userProfile={userProfile} 
//             clients={clients} 
//             dailySchedules={dailySchedules} 
//             coaches={coaches} 
//             timeSlots={timeSlots} 
//           />;
//         case 'my-goals':
//           return <ClientGoalsView 
//             userProfile={userProfile} 
//             clients={clients} 
//           />;
//         case 'resources':
//           return <Resources />;
//         default:
//           return <ClientDashboard 
//             userProfile={userProfile} 
//             clients={clients} 
//             dailySchedules={dailySchedules} 
//             coaches={coaches} 
//             timeSlots={timeSlots} 
//           />;
//       }
//     }

//     if (userProfile?.role === 'scheduler') {
//       switch (activeTab) {
//         case 'monthly-schedule':
//           return <MonthlyScheduleView 
//             dailySchedules={dailySchedules}
//             clients={clients}
//             coaches={coaches}
//             timeSlots={timeSlots}
//             addScheduleAssignment={addScheduleAssignment}
//             removeScheduleAssignment={removeScheduleAssignment}
//           />;
//         case 'clients':
//           return <ClientsTab />;
//         default:
//           return <Dashboard />;
//       }
//     }

//     switch (activeTab) {
//       case 'dashboard':
//         return <Dashboard />;
//       case 'schedule':
//         return <MyScheduleTab />;
//       case 'monthly-schedule':
//         return <MonthlyScheduleView 
//           dailySchedules={dailySchedules}
//           clients={clients}
//           coaches={coaches}
//           timeSlots={timeSlots}
//           addScheduleAssignment={addScheduleAssignment}
//           removeScheduleAssignment={removeScheduleAssignment}
//         />;
//       case 'clients':
//         return <ClientsTab />;
//       case 'resources':
//         return <Resources />;
//       case 'admin':
//         return userProfile?.role === 'admin' && (
//           <AdminPanel 
//             key="admin-panel"
//             clients={clients}
//             coaches={coaches}
//             dailySchedules={dailySchedules}
//             timeSlots={timeSlots}
//             addNewClient={addNewClient}
//             createClientLoginAccount={createClientLoginAccount}
//             addNewCoach={addNewCoach}
//             addScheduleAssignment={addScheduleAssignment}
//             removeScheduleAssignment={removeScheduleAssignment}
//             removeClient={removeClient}
//             removeCoach={removeCoach}
//             businessTypes={businessTypes}
//             equipmentOptions={equipmentOptions}
//             programs={programs}
//             coachTypes={coachTypes}
//           />
//         );
//       default:
//         return <Dashboard />;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-xl mb-2 text-[#292929]">Loading ITG Coach Portal...</div>
//           <div className="text-sm text-[#707070]">
//             {user ? 'Loading user profile...' : 'Checking authentication...'}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!user || !userProfile) {
//     return <LoginScreen onLogin={handleLogin} />;
//   }

//   return (
//     <div className="min-h-screen bg-[#F5F5F5]">
//       <Navigation />
      
//       <div className="container mx-auto p-4">
//         {renderContent()}
//       </div>

//       {/* Password Change Modal */}
//       <PasswordChangeModal 
//         isOpen={showPasswordModal}
//         onClose={() => setShowPasswordModal(false)}
//         user={user}
//       />
//     </div>
//   );
// };

// const LoginScreen = ({ onLogin }) => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     await onLogin(email, password);
//     setLoading(false);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#6D858E] to-[#5A4E69] flex items-center justify-center p-4">
//       <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
//         <div className="text-center mb-8">
//           <div className="bg-[#BED2D8] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Building2 className="text-[#6D858E]" size={32} />
//           </div>
//           <h1 className="text-3xl font-bold text-[#292929] mb-2">ITG Coach Portal</h1>
//           <p className="text-[#707070]">Independence Through Grace</p>
//           <p className="text-sm text-[#9B97A2]">Supporting Adult Entrepreneurs with Disabilities</p>
//         </div>
        
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-[#292929] mb-1">Email</label>
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full px-3 py-2 border border-[#9B97A2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//               placeholder="Enter your email"
//               required
//               disabled={loading}
//             />
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium text-[#292929] mb-1">Password</label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full px-3 py-2 border border-[#9B97A2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
//               placeholder="Enter your password"
//               required
//               disabled={loading}
//             />
//           </div>
          
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-[#6D858E] text-white py-2 px-4 rounded-md hover:bg-[#5A4E69] focus:outline-none focus:ring-2 focus:ring-[#6D858E] focus:ring-offset-2 transition duration-200 disabled:opacity-50"
//           >
//             {loading ? 'Signing In...' : 'Sign In to ITG Portal'}
//           </button>
//         </form>
        
//         <div className="mt-6 p-4 bg-[#F5F5F5] rounded-md">
//           <p className="text-sm text-[#707070] mb-2">For ITG Staff & Clients</p>
//           <p className="text-xs text-[#9B97A2]">Contact admin for account setup</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default JobCoachApp;