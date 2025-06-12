import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  formatMileageDate, 
  calculateMileage, 
  validateMileageRecord
} from '../../utils/mileageHelpers';
import { loadGoogleMapsAPI } from '../../utils/googleMapsLoader';
import { COMMON_PLACES } from '../../utils/constants';
import AddressAutocomplete from './AddressAutoComplete';
import { Plus, Edit, Trash2, Car, MapPin, Calendar, FileText, Map, ChevronDown, Users, X } from 'lucide-react';

const MileageTracker = ({ userProfile, mileageActions, mileageRecords = [], clients = [] }) => {
  // ALL HOOKS MUST BE CALLED FIRST - NO CODE BEFORE HOOKS
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  
  // NEW: State for dropdown visibility and client selection
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClients, setSelectedClients] = useState([]);

  // Form state - UPDATED with transported clients
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startLocation: '',
    endLocation: '',
    purpose: '',
    mileage: '',
    useGoogleMaps: false,
    transportedClients: [] // NEW: Array of transported client objects
  });

  // NEW: Get schedulable clients (excludes Grace program)
  const schedulableClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    return clients.filter(client => {
      const program = client?.program || 'limitless';
      return ['limitless', 'new-options', 'bridges'].includes(program);
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  // MEMOIZED: Get records for selected month - prevent recalculation on every render
  const monthlyRecords = useMemo(() => {
    if (!Array.isArray(mileageRecords)) return [];
    
    return mileageRecords.filter(record => {
      const recordDate = new Date(record.date);
      const recordMonth = recordDate.getMonth() + 1;
      const recordYear = recordDate.getFullYear();
      
      return recordMonth === selectedMonth && recordYear === selectedYear;
    });
  }, [mileageRecords, selectedMonth, selectedYear]);

  // MEMOIZED: Calculate monthly totals - prevent recalculation on every render
  const monthlyTotals = useMemo(() => {
    return monthlyRecords.reduce((totals, record) => ({
      miles: totals.miles + record.mileage,
      clientMiles: totals.clientMiles + (record.transportedClients?.reduce((sum, tc) => sum + tc.mileage, 0) || 0),
      clientTransports: totals.clientTransports + (record.transportedClients?.length || 0)
    }), { miles: 0, clientMiles: 0, clientTransports: 0 });
  }, [monthlyRecords]);

  // Load monthly records effect - FIXED to prevent infinite loop
  useEffect(() => {
    const loadMonthlyRecords = async () => {
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

    if (userProfile?.uid && mileageActions?.getMonthlyRecords) {
      loadMonthlyRecords();
    }
  }, [userProfile?.uid, selectedMonth, selectedYear]);

  // Load Google Maps API when component mounts - ONLY ONCE
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowStartDropdown(false);
      setShowEndDropdown(false);
      setShowClientDropdown(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // MEMOIZED: Handle form input changes
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  // NEW: Handle client selection for transportation
  const handleClientToggle = useCallback((client) => {
    setSelectedClients(prev => {
      const isSelected = prev.some(c => c.id === client.id);
      if (isSelected) {
        return prev.filter(c => c.id !== client.id);
      } else {
        return [...prev, { id: client.id, name: client.name }];
      }
    });
  }, []);

  // NEW: Remove selected client
  const handleRemoveClient = useCallback((clientId) => {
    setSelectedClients(prev => prev.filter(c => c.id !== clientId));
  }, []);

  // NEW: Handle common place selection
  const handleCommonPlaceSelect = useCallback((field, place) => {
    setFormData(prev => ({
      ...prev,
      [field]: place.address
    }));
    setShowStartDropdown(false);
    setShowEndDropdown(false);
  }, []);

  // UPDATED: Calculate mileage using Google Maps with exact precision
  const calculateGoogleMileage = useCallback(async () => {
    if (!mapsLoaded || !window.google) {
      alert('Google Maps is not available. Please enter mileage manually.');
      return;
    }

    if (!formData.startLocation || !formData.endLocation) {
      alert('Please enter both start and end locations.');
      return;
    }

    try {
      const formatAddress = (address) => {
        const trimmed = address.trim();
        if (trimmed.toLowerCase().includes('bakersfield') || 
            trimmed.toLowerCase().includes(', ca') ||
            trimmed.toLowerCase().includes('california')) {
          return trimmed;
        }
        if (!trimmed.includes(',')) {
          return `${trimmed}, Bakersfield, CA`;
        }
        return trimmed;
      };

      const startAddress = formatAddress(formData.startLocation);
      const endAddress = formatAddress(formData.endLocation);

      console.log('🗺️ Calculating distance:', { startAddress, endAddress });

      const service = new window.google.maps.DistanceMatrixService();
      
      const result = await new Promise((resolve, reject) => {
        service.getDistanceMatrix({
          origins: [startAddress],
          destinations: [endAddress],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.IMPERIAL,
          avoidHighways: false,
          avoidTolls: false
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
        const miles = distance.distance.value * 0.000621371;
        console.log('✅ Distance calculated:', miles, 'miles');
        setFormData(prev => ({ ...prev, mileage: miles.toFixed(3) }));
      } else {
        console.error('Distance calculation failed:', distance.status);
        alert('Could not calculate distance between these locations. Please check the addresses and try again.');
      }
    } catch (err) {
      console.error('❌ Error calculating mileage:', err);
      alert('Error calculating mileage. Please check the addresses and try again, or enter mileage manually.');
    }
  }, [mapsLoaded, formData.startLocation, formData.endLocation]);

  // UPDATED: Handle form submission with client transportation
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
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

      const recordData = {
        date: formData.date,
        startLocation: formData.startLocation.trim(),
        endLocation: formData.endLocation.trim(),
        purpose: formData.purpose.trim(),
        mileage: parseFloat(formData.mileage),
        // NEW: Add transported clients data
        transportedClients: selectedClients.map(client => ({
          clientId: client.id,
          clientName: client.name,
          mileage: parseFloat(formData.mileage) // Same mileage since they're in the same trip
        }))
      };

      if (editingRecord) {
        if (!mileageActions.updateRecord) {
          throw new Error('Update function not available');
        }
        await mileageActions.updateRecord(editingRecord.id, recordData);
      } else {
        if (!mileageActions.addRecord) {
          throw new Error('Add function not available');
        }
        await mileageActions.addRecord(recordData);
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        startLocation: '',
        endLocation: '',
        purpose: '',
        mileage: '',
        useGoogleMaps: false,
        transportedClients: []
      });
      setSelectedClients([]);
      setIsAddingRecord(false);
      setEditingRecord(null);
    } catch (err) {
      console.error('Error saving record:', err);
      setError(err.message || (editingRecord ? 'Failed to update record' : 'Failed to add record'));
    } finally {
      setLoading(false);
    }
  }, [formData, editingRecord, selectedClients]);

  // MEMOIZED: Handle record deletion
  const handleDelete = useCallback(async (recordId) => {
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
  }, []);

  // UPDATED: Handle record editing with client data
  const handleEdit = useCallback((record) => {
    setFormData({
      date: record.date,
      startLocation: record.startLocation,
      endLocation: record.endLocation,
      purpose: record.purpose,
      mileage: record.mileage.toString(),
      useGoogleMaps: false,
      transportedClients: record.transportedClients || []
    });
    
    // Set selected clients for editing
    setSelectedClients(record.transportedClients?.map(tc => ({
      id: tc.clientId,
      name: tc.clientName
    })) || []);
    
    setEditingRecord(record);
    setIsAddingRecord(true);
  }, []);

  // MEMOIZED: Cancel form
  const handleCancel = useCallback(() => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      startLocation: '',
      endLocation: '',
      purpose: '',
      mileage: '',
      useGoogleMaps: false,
      transportedClients: []
    });
    setSelectedClients([]);
    setIsAddingRecord(false);
    setEditingRecord(null);
    setError(null);
  }, []);

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
        </div>
      </div>
    );
  }

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
              Track your business travel and client transportation for {userProfile?.name}
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

        {/* Monthly Summary - Coach-focused (no client transportation details) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Car className="text-blue-600 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600">Total Miles</p>
                <p className="text-xl font-bold text-blue-600">
                  {monthlyTotals.miles.toFixed(3)}
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
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="text-green-600 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600">Client Transports</p>
                <p className="text-xl font-bold text-green-600">
                  {monthlyTotals.clientTransports}
                </p>
                <p className="text-xs text-gray-500">trips with clients</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPDATED: Add/Edit Form with client selection */}
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
                  Mileage (Exact)
                </label>
                <div className="flex">
                  <input
                    type="number"
                    step="0.001"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleInputChange}
                    placeholder="0.000"
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

            {/* Address inputs with autocomplete and common places */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  Start Location
                </label>
                <AddressAutocomplete
                  name="startLocation"
                  value={formData.startLocation}
                  onChange={handleInputChange}
                  placeholder="e.g., ITG Office, 123 Main St"
                  required
                  className="w-full"
                />
                
                <div className="relative mt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowStartDropdown(!showStartDropdown);
                      setShowEndDropdown(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    <span>📍 Quick Select Common Places</span>
                    <ChevronDown size={16} className={`transform transition-transform ${showStartDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showStartDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {COMMON_PLACES.map((place) => (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => handleCommonPlaceSelect('startLocation', place)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{place.name}</div>
                          <div className="text-xs text-gray-500">{place.address}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  End Location
                </label>
                <AddressAutocomplete
                  name="endLocation"
                  value={formData.endLocation}
                  onChange={handleInputChange}
                  placeholder="e.g., Client Home, 456 Oak Ave"
                  required
                  className="w-full"
                />
                
                <div className="relative mt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEndDropdown(!showEndDropdown);
                      setShowStartDropdown(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    <span>📍 Quick Select Common Places</span>
                    <ChevronDown size={16} className={`transform transition-transform ${showEndDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showEndDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {COMMON_PLACES.map((place) => (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => handleCommonPlaceSelect('endLocation', place)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{place.name}</div>
                          <div className="text-xs text-gray-500">{place.address}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* NEW: Client Transportation Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users size={16} className="inline mr-1" />
                Transported Clients (Optional)
              </label>
              
              {/* Selected clients display */}
              {selectedClients.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedClients.map(client => (
                    <div key={client.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                      <span>{client.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClient(client.id)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Client selection dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowClientDropdown(!showClientDropdown);
                    setShowStartDropdown(false);
                    setShowEndDropdown(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100"
                >
                  <span>👥 Select Clients You Transported</span>
                  <ChevronDown size={16} className={`transform transition-transform ${showClientDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showClientDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {schedulableClients.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No clients available</div>
                    ) : (
                      schedulableClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleClientToggle(client)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                            selectedClients.some(c => c.id === client.id) ? 'bg-blue-50 text-blue-800' : ''
                          }`}
                        >
                          <div>
                            <div className="font-medium text-gray-900">{client.name}</div>
                            <div className="text-xs text-gray-500">
                              {client.program === 'limitless' ? 'Limitless' : 
                               client.program === 'new-options' ? 'New Options' : 
                               client.program === 'bridges' ? 'Bridges' : 'Other'}
                            </div>
                          </div>
                          {selectedClients.some(c => c.id === client.id) && (
                            <div className="text-blue-600">✓</div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-1">
                Select clients you transported during this trip. Their mileage will be tracked separately for reporting.
              </p>
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

      {/* UPDATED: Records List with client transportation display */}
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
                    Miles (Exact)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transported Clients
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
                      {record.mileage.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.transportedClients && record.transportedClients.length > 0 ? (
                        <div className="max-w-xs">
                          {record.transportedClients.map((tc, index) => (
                            <div key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mb-1">
                              {tc.clientName}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No clients</span>
                      )}
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