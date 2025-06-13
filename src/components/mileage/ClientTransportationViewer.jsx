import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Car, Calendar, TrendingUp, MapPin, Filter, Download } from 'lucide-react';
import { formatMileageDate, getAllClientTransportationStats, getClientTransportationStats } from '../../utils/mileageHelpers';
import { 
  getAllClientTransportationStats as getStatsFromService,
  getClientTransportationStats as getClientStatsFromService 
} from '../../services/mileageService';

const ClientTransportationViewer = ({ clients = [], mileageRecords = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allStats, setAllStats] = useState([]);
  const [clientDetails, setClientDetails] = useState(null);

  // Get schedulable clients (excludes Grace program)
  const schedulableClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    return clients.filter(client => {
      const program = client?.program || 'limitless';
      return ['limitless', 'new-options', 'bridges'].includes(program);
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm) return schedulableClients;
    
    const search = searchTerm.toLowerCase();
    return schedulableClients.filter(client => 
      client.name.toLowerCase().includes(search) ||
      client.email.toLowerCase().includes(search) ||
      (client.businessName && client.businessName.toLowerCase().includes(search))
    );
  }, [schedulableClients, searchTerm]);

  // Calculate overall statistics from mileage records
  const overallStats = useMemo(() => {
    return getAllClientTransportationStats(mileageRecords);
  }, [mileageRecords]);

  // Get date range for filtering
  const getDateRange = () => {
    const today = new Date();
    let start = null;
    let end = null;

    switch (selectedDateRange) {
      case 'week':
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        end = today;
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'quarter':
        const quarterStart = Math.floor(today.getMonth() / 3) * 3;
        start = new Date(today.getFullYear(), quarterStart, 1);
        end = today;
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
        }
        break;
      default:
        return null;
    }

    if (start && end) {
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      };
    }
    
    return null;
  };

  // Load client details when a client is selected
  useEffect(() => {
    if (selectedClient) {
      setLoading(true);
      setError(null);

      try {
        const dateRange = getDateRange();
        const stats = getClientTransportationStats(mileageRecords, selectedClient.id);
        
        // Filter by date range if specified
        if (dateRange) {
          const filteredRecords = stats.records.filter(record => 
            record.date >= dateRange.startDate && record.date <= dateRange.endDate
          );
          
          const filteredMiles = filteredRecords.reduce((sum, record) => sum + record.clientMileage, 0);
          
          setClientDetails({
            ...stats,
            totalMiles: Math.round(filteredMiles * 1000) / 1000,
            totalTrips: filteredRecords.length,
            records: filteredRecords,
            dateRange
          });
        } else {
          setClientDetails(stats);
        }
      } catch (err) {
        setError('Failed to load client transportation details');
        console.error('Error loading client details:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setClientDetails(null);
    }
  }, [selectedClient, selectedDateRange, startDate, endDate, mileageRecords]);

  // Export client transportation data to CSV
  const exportToCSV = () => {
    const data = selectedClient && clientDetails ? clientDetails.records : overallStats;
    
    if (selectedClient && clientDetails) {
      // Export individual client data
      const headers = ['Date', 'Coach', 'Start Location', 'End Location', 'Purpose', 'Miles', 'Other Clients'];
      const csvData = [
        headers.join(','),
        ...clientDetails.records.map(record => [
          record.date,
          'Coach', // Would need coach name from record
          `"${record.startLocation}"`,
          `"${record.endLocation}"`,
          `"${record.purpose}"`,
          record.clientMileage.toFixed(3),
          record.transportedClients.filter(tc => tc.clientId !== selectedClient.id).map(tc => tc.clientName).join('; ')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedClient.name.replace(' ', '_')}_transportation_report.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      // Export all client stats
      const headers = ['Client Name', 'Total Miles', 'Total Trips', 'Last Trip'];
      const csvData = [
        headers.join(','),
        ...overallStats.map(client => [
          `"${client.clientName}"`,
          client.totalMiles.toFixed(3),
          client.totalTrips,
          client.lastTrip || 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'all_client_transportation_report.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Users className="mr-3" size={28} />
              Client Transportation Report
            </h2>
            <p className="text-[#BED2D8]">
              View mileage statistics for client transportation by ITG coaches
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="bg-[#6D858E] hover:bg-[#5A4E69] text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Download size={20} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Filter size={20} className="mr-2" />
          Search & Filter
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Client Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Client</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or business..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Clear Selection */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedClient(null);
                setSearchTerm('');
                setSelectedDateRange('all');
              }}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Clear Selection
            </button>
          </div>
        </div>

        {/* Custom Date Range */}
        {selectedDateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Users className="text-blue-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-600">Total Clients Transported</p>
              <p className="text-2xl font-bold text-blue-600">
                {overallStats.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Car className="text-green-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-600">Total Transportation Miles</p>
              <p className="text-2xl font-bold text-green-600">
                {overallStats.reduce((sum, client) => sum + client.totalMiles, 0).toFixed(3)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Calendar className="text-purple-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-600">Total Transportation Trips</p>
              <p className="text-2xl font-bold text-purple-600">
                {overallStats.reduce((sum, client) => sum + client.totalTrips, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <TrendingUp className="text-orange-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-600">Avg Miles per Client</p>
              <p className="text-2xl font-bold text-orange-600">
                {overallStats.length > 0 
                  ? (overallStats.reduce((sum, client) => sum + client.totalMiles, 0) / overallStats.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">
              Select Client to View Details
              {searchTerm && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredClients.length} matches)
                </span>
              )}
            </h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">
                  {searchTerm ? 'No clients match your search' : 'No transportable clients found'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredClients.map((client) => {
                  const clientStats = overallStats.find(stat => stat.clientId === client.id);
                  const isSelected = selectedClient?.id === client.id;
                  
                  return (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{client.name}</h4>
                          <p className="text-sm text-gray-500">
                            {client.program === 'limitless' ? 'Limitless' : 
                             client.program === 'new-options' ? 'New Options' : 
                             client.program === 'bridges' ? 'Bridges' : 'Other'}
                          </p>
                          {client.businessName && (
                            <p className="text-xs text-gray-400">{client.businessName}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {clientStats ? (
                            <>
                              <p className="text-sm font-medium text-gray-900">
                                {clientStats.totalMiles.toFixed(1)} mi
                              </p>
                              <p className="text-xs text-gray-500">
                                {clientStats.totalTrips} trips
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400">No trips</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Client Details */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">
              {selectedClient ? `${selectedClient.name} - Transportation Details` : 'Select a client to view details'}
            </h3>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Loading client details...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : selectedClient && clientDetails ? (
            <div className="p-6">
              {/* Client Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Car className="text-green-600 mr-2" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Total Miles</p>
                      <p className="text-xl font-bold text-green-600">
                        {clientDetails.totalMiles.toFixed(3)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="text-blue-600 mr-2" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Total Trips</p>
                      <p className="text-xl font-bold text-blue-600">
                        {clientDetails.totalTrips}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Trips */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Recent Transportation Records
                  {clientDetails.dateRange && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({clientDetails.dateRange.startDate} to {clientDetails.dateRange.endDate})
                    </span>
                  )}
                </h4>
                
                {clientDetails.records.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No transportation records found for the selected date range
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {clientDetails.records.slice(0, 10).map((record, index) => (
                      <div key={index} className="border-l-4 border-green-500 bg-green-50 p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatMileageDate(record.date)}
                            </p>
                            <p className="text-sm text-gray-600">
                              <MapPin size={14} className="inline mr-1" />
                              {record.startLocation} → {record.endLocation}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {record.purpose}
                            </p>
                            {record.transportedClients.length > 1 && (
                              <p className="text-xs text-blue-600 mt-1">
                                Also transported: {record.transportedClients
                                  .filter(tc => tc.clientId !== selectedClient.id)
                                  .map(tc => tc.clientName)
                                  .join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">
                              {record.clientMileage.toFixed(3)} mi
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {clientDetails.records.length > 10 && (
                      <p className="text-center text-gray-500 text-sm">
                        Showing 10 of {clientDetails.records.length} records
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">
                Select a client from the list to view their transportation history
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientTransportationViewer;