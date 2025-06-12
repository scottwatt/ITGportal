// src/utils/mileageHelpers.js - UPDATED with client transportation support

// Format date for display
export const formatMileageDate = (dateString) => {
  if (!dateString) return 'Invalid Date';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// UPDATED: Validate mileage record data with transported clients support
export const validateMileageRecord = (recordData) => {
  const errors = [];
  
  // Required fields
  if (!recordData.date) {
    errors.push('Date is required');
  }
  
  if (!recordData.startLocation || recordData.startLocation.trim().length === 0) {
    errors.push('Start location is required');
  }
  
  if (!recordData.endLocation || recordData.endLocation.trim().length === 0) {
    errors.push('End location is required');
  }
  
  if (!recordData.purpose || recordData.purpose.trim().length === 0) {
    errors.push('Business purpose is required');
  }
  
  if (!recordData.mileage || isNaN(recordData.mileage) || parseFloat(recordData.mileage) <= 0) {
    errors.push('Valid mileage is required');
  }
  
  // Date validation
  if (recordData.date) {
    const date = new Date(recordData.date);
    const today = new Date();
    
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    } else if (date > today) {
      errors.push('Date cannot be in the future');
    }
    
    // Check if date is more than 1 year old
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (date < oneYearAgo) {
      errors.push('Date cannot be more than 1 year old');
    }
  }
  
  // Mileage validation - allow more precision for payment accuracy
  if (recordData.mileage) {
    const miles = parseFloat(recordData.mileage);
    if (miles > 1000) {
      errors.push('Mileage seems unusually high (over 1000 miles)');
    }
    if (miles < 0.001) {
      errors.push('Mileage must be at least 0.001 miles');
    }
  }
  
  // Location validation
  if (recordData.startLocation && recordData.endLocation) {
    if (recordData.startLocation.trim().toLowerCase() === recordData.endLocation.trim().toLowerCase()) {
      errors.push('Start and end locations cannot be the same');
    }
  }
  
  // NEW: Validate transported clients data
  if (recordData.transportedClients && Array.isArray(recordData.transportedClients)) {
    recordData.transportedClients.forEach((client, index) => {
      if (!client.clientId || typeof client.clientId !== 'string') {
        errors.push(`Invalid client ID for transported client ${index + 1}`);
      }
      if (!client.clientName || typeof client.clientName !== 'string') {
        errors.push(`Invalid client name for transported client ${index + 1}`);
      }
      if (typeof client.mileage !== 'number' || client.mileage <= 0) {
        errors.push(`Invalid mileage for transported client ${index + 1}`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    error: errors.length > 0 ? errors[0] : null
  };
};

// Calculate distance between two points (simple utility)
export const calculateMileage = async (startLocation, endLocation) => {
  // This is just a placeholder function
  // The actual calculation will be done by Google Maps in the component
  // if the user chooses to use it
  return null;
};

// Format mileage for display with exact precision
export const formatMileageForDisplay = (mileage, precision = 3) => {
  if (typeof mileage !== 'number' || isNaN(mileage)) {
    return '0.000';
  }
  return mileage.toFixed(precision);
};

// Format mileage for payment calculations (always 3 decimal places)
export const formatMileageForPayment = (mileage) => {
  return formatMileageForDisplay(mileage, 3);
};

// Convert mileage string to exact number
export const parseMileageToExact = (mileageString) => {
  const parsed = parseFloat(mileageString);
  if (isNaN(parsed)) {
    return 0;
  }
  // Round to 3 decimal places to prevent floating point precision issues
  return Math.round(parsed * 1000) / 1000;
};

// Calculate total mileage with exact precision
export const calculateTotalMileage = (mileageRecords) => {
  if (!Array.isArray(mileageRecords)) {
    return 0;
  }
  
  const total = mileageRecords.reduce((sum, record) => {
    const mileage = typeof record.mileage === 'number' ? record.mileage : 0;
    return sum + mileage;
  }, 0);
  
  // Round to 3 decimal places for payment accuracy
  return Math.round(total * 1000) / 1000;
};

// NEW: Calculate total client transportation mileage
export const calculateTotalClientTransportationMileage = (mileageRecords) => {
  if (!Array.isArray(mileageRecords)) {
    return 0;
  }
  
  const total = mileageRecords.reduce((sum, record) => {
    if (record.transportedClients && Array.isArray(record.transportedClients)) {
      const clientMileage = record.transportedClients.reduce((clientSum, client) => {
        return clientSum + (typeof client.mileage === 'number' ? client.mileage : 0);
      }, 0);
      return sum + clientMileage;
    }
    return sum;
  }, 0);
  
  return Math.round(total * 1000) / 1000;
};

// NEW: Get client transportation statistics for a specific client
export const getClientTransportationStats = (mileageRecords, clientId) => {
  if (!Array.isArray(mileageRecords) || !clientId) {
    return {
      totalMiles: 0,
      totalTrips: 0,
      records: []
    };
  }
  
  const clientRecords = [];
  let totalMiles = 0;
  let totalTrips = 0;
  
  mileageRecords.forEach(record => {
    if (record.transportedClients && Array.isArray(record.transportedClients)) {
      const clientTransport = record.transportedClients.find(tc => tc.clientId === clientId);
      if (clientTransport) {
        clientRecords.push({
          ...record,
          clientMileage: clientTransport.mileage
        });
        totalMiles += clientTransport.mileage;
        totalTrips += 1;
      }
    }
  });
  
  return {
    totalMiles: Math.round(totalMiles * 1000) / 1000,
    totalTrips,
    records: clientRecords.sort((a, b) => new Date(b.date) - new Date(a.date))
  };
};

// NEW: Get client transportation statistics for all clients
export const getAllClientTransportationStats = (mileageRecords) => {
  if (!Array.isArray(mileageRecords)) {
    return [];
  }
  
  const clientStats = {};
  
  mileageRecords.forEach(record => {
    if (record.transportedClients && Array.isArray(record.transportedClients)) {
      record.transportedClients.forEach(client => {
        if (!clientStats[client.clientId]) {
          clientStats[client.clientId] = {
            clientId: client.clientId,
            clientName: client.clientName,
            totalMiles: 0,
            totalTrips: 0,
            lastTrip: null
          };
        }
        
        clientStats[client.clientId].totalMiles += client.mileage;
        clientStats[client.clientId].totalTrips += 1;
        
        // Track most recent trip
        if (!clientStats[client.clientId].lastTrip || record.date > clientStats[client.clientId].lastTrip) {
          clientStats[client.clientId].lastTrip = record.date;
        }
      });
    }
  });
  
  // Convert to array and round mileage
  return Object.values(clientStats).map(stat => ({
    ...stat,
    totalMiles: Math.round(stat.totalMiles * 1000) / 1000
  })).sort((a, b) => b.totalMiles - a.totalMiles);
};

// NEW: Get monthly client transportation stats
export const getMonthlyClientTransportationStats = (mileageRecords, year, month) => {
  if (!Array.isArray(mileageRecords)) {
    return {
      totalClientMiles: 0,
      totalTransports: 0,
      uniqueClients: 0,
      clientBreakdown: []
    };
  }
  
  // Filter records for the specific month
  const monthlyRecords = mileageRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getFullYear() === year && recordDate.getMonth() + 1 === month;
  });
  
  const clientStats = {};
  let totalClientMiles = 0;
  let totalTransports = 0;
  
  monthlyRecords.forEach(record => {
    if (record.transportedClients && Array.isArray(record.transportedClients)) {
      record.transportedClients.forEach(client => {
        if (!clientStats[client.clientId]) {
          clientStats[client.clientId] = {
            clientId: client.clientId,
            clientName: client.clientName,
            miles: 0,
            trips: 0
          };
        }
        
        clientStats[client.clientId].miles += client.mileage;
        clientStats[client.clientId].trips += 1;
        totalClientMiles += client.mileage;
        totalTransports += 1;
      });
    }
  });
  
  const clientBreakdown = Object.values(clientStats).map(stat => ({
    ...stat,
    miles: Math.round(stat.miles * 1000) / 1000
  })).sort((a, b) => b.miles - a.miles);
  
  return {
    totalClientMiles: Math.round(totalClientMiles * 1000) / 1000,
    totalTransports,
    uniqueClients: Object.keys(clientStats).length,
    clientBreakdown
  };
};

// NEW: Format transported clients for display
export const formatTransportedClients = (transportedClients) => {
  if (!transportedClients || !Array.isArray(transportedClients) || transportedClients.length === 0) {
    return 'No clients transported';
  }
  
  if (transportedClients.length === 1) {
    return transportedClients[0].clientName;
  }
  
  if (transportedClients.length === 2) {
    return `${transportedClients[0].clientName} and ${transportedClients[1].clientName}`;
  }
  
  return `${transportedClients[0].clientName} and ${transportedClients.length - 1} other${transportedClients.length > 2 ? 's' : ''}`;
};

// NEW: Validate client transportation data
export const validateClientTransportation = (transportedClients) => {
  if (!transportedClients || !Array.isArray(transportedClients)) {
    return { isValid: true, message: '' }; // Optional field
  }
  
  if (transportedClients.length > 10) {
    return { isValid: false, message: 'Cannot transport more than 10 clients in one trip' };
  }
  
  // Check for duplicate clients
  const clientIds = transportedClients.map(tc => tc.clientId);
  const uniqueIds = [...new Set(clientIds)];
  if (clientIds.length !== uniqueIds.length) {
    return { isValid: false, message: 'Cannot select the same client multiple times' };
  }
  
  // Validate each client entry
  for (let i = 0; i < transportedClients.length; i++) {
    const client = transportedClients[i];
    if (!client.clientId || !client.clientName) {
      return { isValid: false, message: `Invalid client data for transported client ${i + 1}` };
    }
    if (typeof client.mileage !== 'number' || client.mileage <= 0) {
      return { isValid: false, message: `Invalid mileage for transported client ${client.clientName}` };
    }
  }
  
  return { isValid: true, message: '' };
};