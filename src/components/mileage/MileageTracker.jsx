import React, { useState, useEffect } from 'react';
import { 
  formatMileageDate, 
  calculateMileage, 
  validateMileageRecord
} from '../../utils/mileageHelpers';
import { loadGoogleMapsAPI } from '../../utils/googleMapsLoader';
import { Plus, Edit, Trash2, Car, MapPin, Calendar, FileText, Map } from 'lucide-react';

const MileageTracker = ({ userProfile, mileageActions, mileageRecords = [] }) => {
  // ALL HOOKS MUST BE CALLED FIRST - NO CODE BEFORE HOOKS
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startLocation: '',
    endLocation: '',
    purpose: '',
    mileage: '',
    useGoogleMaps: false
  });

  // Load records for selected month
  useEffect(() => {
    const loadMonthlyRecords = async () => {
      // Check if mileageActions is available
      if (!mileageActions || !mileageActions.getMonthlyRecords) {
        console.warn('Mileage actions not available yet');
        return;
      }

      try {
        setLoading(true);
        await mileageActions.getMonthlyRecords(selectedYear, selectedMonth);
      } catch (err) {
        setError('Failed to load mileage records');
        console.error('Error loading records:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userProfile?.uid && mileageActions) {
      loadMonthlyRecords();
    }
  }, [selectedMonth, selectedYear, userProfile?.uid, mileageActions]);

  // Load Google Maps API when component mounts
  useEffect(() => {
    const initMaps = async () => {
      try {
        await loadGoogleMapsAPI();
        setMapsLoaded(true);
      } catch (err) {
        console.warn('Google Maps failed to load:', err);
        setMapsLoaded(false);
      }
    };
    
    initMaps();
  }, []);

  // NOW we can do other code after all hooks are defined
  // Debug: Check what props we're receiving (only log once)
  useEffect(() => {
    console.log('🔍 MileageTracker mounted with:', {
      userProfile: userProfile?.uid || 'undefined',
      mileageActions: mileageActions ? 'defined' : 'undefined',
      mileageRecords: Array.isArray(mileageRecords) ? mileageRecords.length : 'not array'
    });
  }, []); // Only run once on mount

  // Get records for selected month with simplified filtering
  const monthlyRecords = mileageRecords.filter(record => {
    const recordDate = new Date(record.date);
    const recordMonth = recordDate.getMonth() + 1;
    const recordYear = recordDate.getFullYear();
    
    return recordMonth === selectedMonth && recordYear === selectedYear;
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Calculate mileage using Google Maps
  const calculateGoogleMileage = async () => {
    if (!mapsLoaded || !window.google) {
      alert('Google Maps is not available. Please enter mileage manually.');
      return;
    }

    if (!formData.startLocation || !formData.endLocation) {
      alert('Please enter both start and end locations.');
      return;
    }

    try {
      // Automatically append "Bakersfield, CA" if not already included
      const formatAddress = (address) => {
        const trimmed = address.trim();
        if (trimmed.toLowerCase().includes('bakersfield') || trimmed.toLowerCase().includes('ca')) {
          return trimmed;
        }
        return `${trimmed}, Bakersfield, CA`;
      };

      const startAddress = formatAddress(formData.startLocation);
      const endAddress = formatAddress(formData.endLocation);

      const service = new window.google.maps.DistanceMatrixService();
      
      const result = await new Promise((resolve, reject) => {
        service.getDistanceMatrix({
          origins: [startAddress],
          destinations: [endAddress],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.IMPERIAL
        }, (response, status) => {
          if (status === window.google.maps.DistanceMatrixStatus.OK) {
            resolve(response);
          } else {
            reject(new Error(`Distance calculation failed: ${status}`));
          }
        });
      });

      const distance = result.rows[0].elements[0];
      if (distance.status === 'OK') {
        const miles = Math.round(distance.distance.value * 0.000621371 * 100) / 100;
        setFormData(prev => ({ ...prev, mileage: miles.toString() }));
      } else {
        alert('Could not calculate distance between these locations.');
      }
    } catch (err) {
      console.error('Error calculating mileage:', err);
      alert('Error calculating mileage. Please enter manually.');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if mileageActions is available
    if (!mileageActions) {
      setError('Mileage actions not available. Please refresh the page.');
      return;
    }

    const validation = validateMileageRecord(formData);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📝 Submitting mileage record:', formData);

      const recordData = {
        date: formData.date,
        startLocation: formData.startLocation.trim(),
        endLocation: formData.endLocation.trim(),
        purpose: formData.purpose.trim(),
        mileage: parseFloat(formData.mileage)
      };

      console.log('📝 Processed record data:', recordData);

      if (editingRecord) {
        if (!mileageActions.updateRecord) {
          throw new Error('Update function not available');
        }
        await mileageActions.updateRecord(editingRecord.id, recordData);
        console.log('✅ Record updated successfully');
      } else {
        if (!mileageActions.addRecord) {
          throw new Error('Add function not available');
        }
        await mileageActions.addRecord(recordData);
        console.log('✅ Record added successfully');
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        startLocation: '',
        endLocation: '',
        purpose: '',
        mileage: '',
        useGoogleMaps: false
      });
      setIsAddingRecord(false);
      setEditingRecord(null);
    } catch (err) {
      console.error('❌ Error saving record:', err);
      setError(err.message || (editingRecord ? 'Failed to update record' : 'Failed to add record'));
    } finally {
      setLoading(false);
    }
  };

  // Handle record deletion
  const handleDelete = async (recordId) => {
    if (!mileageActions || !mileageActions.deleteRecord) {
      setError('Delete function not available. Please refresh the page.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        setLoading(true);
        await mileageActions.deleteRecord(recordId);
      } catch (err) {
        setError('Failed to delete record');
        console.error('Error deleting record:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle record editing
  const handleEdit = (record) => {
    setFormData({
      date: record.date,
      startLocation: record.startLocation,
      endLocation: record.endLocation,
      purpose: record.purpose,
      mileage: record.mileage.toString(),
      useGoogleMaps: false
    });
    setEditingRecord(record);
    setIsAddingRecord(true);
  };

  // Cancel form
  const handleCancel = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      startLocation: '',
      endLocation: '',
      purpose: '',
      mileage: '',
      useGoogleMaps: false
    });
    setIsAddingRecord(false);
    setEditingRecord(null);
    setError(null);
  };

  // Early return AFTER all hooks and functions are defined
  if (!userProfile) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
          <p>User profile not loaded. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  if (!mileageActions) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
          <p>Mileage tracking is loading... If this persists, please refresh the page.</p>
          <p className="text-sm mt-2">Debug: mileageActions not available</p>
        </div>
      </div>
    );
  }

  // Get records for selected month - this was moved above with debugging

  // Calculate monthly totals
  const monthlyTotals = monthlyRecords.reduce((totals, record) => ({
    miles: totals.miles + record.mileage
  }), { miles: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Car className="mr-3" size={28} />
              Mileage Tracker
            </h2>
            <p className="text-[#BED2D8]">
              Track your business travel for {userProfile?.name}
            </p>
          </div>
          <button
            onClick={() => setIsAddingRecord(true)}
            className="bg-[#6D858E] hover:bg-[#5A4E69] text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Add Record
          </button>
        </div>
      </div>

      {/* Month/Year Selector */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">View Records</h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Car className="text-blue-600 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600">Total Miles</p>
                <p className="text-xl font-bold text-blue-600">
                  {monthlyTotals.miles.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FileText className="text-purple-600 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-xl font-bold text-purple-600">
                  {monthlyRecords.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAddingRecord && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingRecord ? 'Edit Mileage Record' : 'Add New Mileage Record'}
          </h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Car size={16} className="inline mr-1" />
                  Mileage
                </label>
                <div className="flex">
                  <input
                    type="number"
                    step="0.1"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleInputChange}
                    placeholder="0.0"
                    className="flex-1 border border-gray-300 rounded-l px-3 py-2"
                    required
                  />
                  {mapsLoaded && (
                    <button
                      type="button"
                      onClick={calculateGoogleMileage}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-r"
                      title="Calculate using Google Maps"
                    >
                      <Map size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  Start Location
                </label>
                <input
                  type="text"
                  name="startLocation"
                  value={formData.startLocation}
                  onChange={handleInputChange}
                  placeholder="e.g., ITG Office, 123 Main St (Bakersfield, CA assumed)"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  End Location
                </label>
                <input
                  type="text"
                  name="endLocation"
                  value={formData.endLocation}
                  onChange={handleInputChange}
                  placeholder="e.g., Client Home, 456 Oak Ave (Bakersfield, CA assumed)"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="inline mr-1" />
                Business Purpose
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                placeholder="Describe the business purpose of this trip"
                rows="3"
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#6D858E] hover:bg-[#5A4E69] text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingRecord ? 'Update Record' : 'Add Record')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            {new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })} Records
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Loading records...</p>
          </div>
        ) : monthlyRecords.length === 0 ? (
          <div className="p-6 text-center">
            <Car className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No mileage records for this month</p>
            <button
              onClick={() => setIsAddingRecord(true)}
              className="mt-4 bg-[#6D858E] hover:bg-[#5A4E69] text-white px-4 py-2 rounded"
            >
              Add Your First Record
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Miles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyRecords
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatMileageDate(record.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        <p className="truncate">{record.startLocation}</p>
                        <p className="text-gray-500 text-xs truncate">→ {record.endLocation}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={record.purpose}>
                        {record.purpose}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.mileage.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit record"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MileageTracker;