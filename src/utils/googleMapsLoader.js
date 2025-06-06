// src/utils/googleMapsLoader.js - Updated to include Places API for autocomplete
let isLoading = false;
let isLoaded = false;

export const loadGoogleMapsAPI = () => {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (isLoaded && window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    // If currently loading, wait for it to finish
    if (isLoading) {
      const checkLoaded = () => {
        if (isLoaded && window.google && window.google.maps && window.google.maps.places) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    isLoading = true;

    // Get API key from environment
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      isLoading = false;
      reject(new Error('Google Maps API key not found'));
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Script exists, wait for it to load
      const checkLoaded = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          isLoaded = true;
          isLoading = false;
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Global callback function
    window.initGoogleMaps = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });
};