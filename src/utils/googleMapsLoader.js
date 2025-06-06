// src/utils/googleMapsLoader.js - Utility to load Google Maps API

let isLoaded = false;
let isLoading = false;
let loadPromise = null;

export const loadGoogleMapsAPI = () => {
  // If already loaded, return resolved promise
  if (isLoaded) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (isLoading) {
    return loadPromise;
  }

  // Start loading
  isLoading = true;
  
  loadPromise = new Promise((resolve, reject) => {
    // Check if Google Maps is already available
    if (window.google && window.google.maps) {
      isLoaded = true;
      isLoading = false;
      resolve();
      return;
    }

    // Get API key from environment variables
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      isLoading = false;
      reject(new Error('Google Maps API key not found. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file.'));
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    // Handle successful load
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };

    // Handle load error
    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps API'));
    };

    // Add script to document
    document.head.appendChild(script);
  });

  return loadPromise;
};

// Check if Google Maps API is loaded
export const isGoogleMapsLoaded = () => {
  return isLoaded && window.google && window.google.maps;
};

// Reset loader state (useful for testing)
export const resetGoogleMapsLoader = () => {
  isLoaded = false;
  isLoading = false;
  loadPromise = null;
};