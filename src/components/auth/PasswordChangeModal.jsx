// src/components/auth/PasswordChangeModal.jsx
import React, { useState } from 'react';
import { Key, CheckCircle, X } from 'lucide-react';
import { changeUserPassword } from '../../services/firebase/auth';

const PasswordChangeModal = ({ isOpen, onClose, user }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await changeUserPassword(user, currentPassword, newPassword);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess(false);
        setError('');
      }, 2000);
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleClose = () => {
    onClose();
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccess(false);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center text-[#292929]">
            <Key className="mr-2" size={20} />
            Change Password
          </h3>
          <button 
            onClick={handleClose} 
            className="text-[#707070] hover:text-[#292929]"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle className="mx-auto text-[#6D858E] mb-2" size={48} />
            <p className="text-[#6D858E] font-medium">Password changed successfully!</p>
          </div>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-[#292929] mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#292929] mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#292929] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D858E]"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#6D858E] text-white py-2 px-4 rounded-md hover:bg-[#5A4E69] disabled:opacity-50"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-[#9B97A2] text-white py-2 px-4 rounded-md hover:bg-[#707070] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PasswordChangeModal;