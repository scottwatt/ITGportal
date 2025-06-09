// src/utils/mileageHelpers.js - Utility functions for mileage tracking with exact precision

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

// Validate mileage record data with exact precision support
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