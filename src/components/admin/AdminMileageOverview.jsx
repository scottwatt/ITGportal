import React, { useState, useEffect, useMemo } from 'react';
import { Car, Calendar, FileText, Filter, Download, Eye, Search } from 'lucide-react';
import { formatMileageDate } from '../../utils/mileageHelpers';
import { 
  getAllCoachMileageRecords, 
  getMileageRecordsInDateRange,
  getAllCoachMileageForMonth 
} from '../../services/adminMileageService';

const AdminMileageOverview = ({ coaches = [] }) => {
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCoach, setSelectedCoach] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('month'); // 'month' or 'dateRange'
  const [searchTerm, setSearchTerm] = useState('');

  // Load mileage records
  const loadMileageRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let records;
      if (filterType === 'month') {
        records = await getAllCoachMileageForMonth(selectedYear, selectedMonth);
      } else if (filterType === 'dateRange' && startDate && endDate) {
        records = await getMileageRecordsInDateRange(startDate, endDate);
      } else {
        records = await getAllCoachMileageRecords();
      }
      
      setAllRecords(records);
    } catch (err) {
      setError('Failed to load mileage records: ' + err.message);
      console.error('Error loading admin mileage records:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load records when filters change
  useEffect(() => {
    loadMileageRecords();
  }, [selectedMonth, selectedYear, filterType, startDate, endDate]);

  // Get coach name by ID
  const getCoachName = (coachId) => {
    const coach = coaches.find(c => c.uid === coachId || c.id === coachId);
    return coach ? coach.name : `Unknown Coach (${coachId})`;
  };

  // Filter and search records
  const filteredRecords = useMemo(() => {
    let filtered = allRecords;

    // Filter by coach
    if (selectedCoach !== 'all') {
      filtered = filtered.filter(record => record.coachId === selectedCoach);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        getCoachName(record.coachId).toLowerCase().includes(searchLower) ||
        record.startLocation.toLowerCase().includes(searchLower) ||
        record.endLocation.toLowerCase().includes(searchLower) ||
        record.purpose.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allRecords, selectedCoach, searchTerm, coaches]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalMiles = filteredRecords.reduce((sum, record) => sum + record.mileage, 0);
    const totalRecords = filteredRecords.length;
    
    // Group by coach
    const byCoach = {};
    filteredRecords.forEach(record => {
      const coachName = getCoachName(record.coachId);
      if (!byCoach[coachName]) {
        byCoach[coachName] = { miles: 0, records: 0 };
      }
      byCoach[coachName].miles += record.mileage;
      byCoach[coachName].records += 1;
    });

    return { totalMiles, totalRecords, byCoach };
  }, [filteredRecords, coaches]);

  // Export to CSV (basic implementation)
  const exportToCSV = () => {
    const headers = ['Date', 'Coach', 'Start Location', 'End Location', 'Purpose', 'Miles'];
    const csvData = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.date,
        `"${getCoachName(record.coachId)}"`,
        `"${record.startLocation}"`,
        `"${record.endLocation}"`,
        `"${record.purpose}"`,
        record.mileage
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mileage-report-${filterType === 'month' ? `${selectedYear}-${selectedMonth}` : `${startDate}-to-${endDate}`}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5A4E69] to-[#292929] text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Car className="mr-3" size={28} />
              Admin Mileage Overview
            </h2>
            <p className="text-[#BED2D8]">
              View and manage all coach mileage records for billing
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToCSV}
              disabled={filteredRecords.length === 0}
              className="bg-[#6D858E] hover:bg-[#5A4E69] text-white px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} className="mr-2" />
              Export CSV
            </button>
            <button
              onClick={loadMileageRecords}
              className="bg-[#6D858E] hover:bg-[#5A4E69] text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Eye size={20} className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Filter size={20} className="mr-2" />
          Filter Records
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter By</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="month">Specific Month</option>
              <option value="dateRange">Date Range</option>
              <option value="all">All Records</option>
            </select>
          </div>

          {/* Month/Year Selectors (when filterType is 'month') */}
          {filterType === 'month' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
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
            </>
          )}

          {/* Date Range Selectors (when filterType is 'dateRange') */}
          {filterType === 'dateRange' && (
            <>
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
            </>
          )}

          {/* Coach Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Coach</label>
            <select
              value={selectedCoach}
              onChange={(e) => setSelectedCoach(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">All Coaches</option>
              {coaches
                .filter(coach => coach.role === 'coach' || coach.role === 'admin')
                .map(coach => (
                  <option key={coach.id} value={coach.uid || coach.id}>
                    {coach.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search coach, location, purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Car className="text-blue-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-600">Total Miles</p>
              <p className="text-2xl font-bold text-blue-600">
                {totals.totalMiles.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <FileText className="text-green-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-green-600">
                {totals.totalRecords}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Calendar className="text-purple-600 mr-3" size={24} />
            <div>
              <p className="text-sm text-gray-600">Active Coaches</p>
              <p className="text-2xl font-bold text-purple-600">
                {Object.keys(totals.byCoach).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coach Summary */}
      {Object.keys(totals.byCoach).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Summary by Coach</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(totals.byCoach).map(([coachName, summary]) => (
              <div key={coachName} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">{coachName}</h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    Miles: <span className="font-medium">{summary.miles.toFixed(1)}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Trips: <span className="font-medium">{summary.records}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            Mileage Records
            {filterType === 'month' && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                for {new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            )}
            {filterType === 'dateRange' && startDate && endDate && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                from {startDate} to {endDate}
              </span>
            )}
          </h3>
        </div>

        {error && (
          <div className="p-6 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Loading mileage records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-6 text-center">
            <Car className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">No mileage records found for the selected criteria</p>
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
                    Coach
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatMileageDate(record.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getCoachName(record.coachId)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.mileage.toFixed(1)}
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

export default AdminMileageOverview;