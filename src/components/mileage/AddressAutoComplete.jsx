import React, { useRef, useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  placeholder, 
  name, 
  required = false,
  className = "",
  disabled = false 
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps API is loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsGoogleLoaded(true);
      initializeAutocomplete();
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsGoogleLoaded(true);
          initializeAutocomplete();
          clearInterval(checkGoogleMaps);
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }
  }, []);

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google || autocompleteRef.current) {
      return;
    }

    try {
      // Create autocomplete instance
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        // Restrict to addresses
        types: ['address'],
        
        // Component restrictions to prioritize California, specifically Kern County
        componentRestrictions: {
          country: 'US'
        },
        
        // Fields to retrieve from the place
        fields: ['formatted_address', 'geometry', 'name', 'address_components']
      });

      // Set bounds to prioritize Bakersfield area
      // Bakersfield coordinates: 35.3733° N, 119.0187° W
      const bakersfieldBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(35.2733, -119.1187), // SW corner
        new window.google.maps.LatLng(35.4733, -118.9187)  // NE corner
      );
      
      autocomplete.setBounds(bakersfieldBounds);
      
      // Bias results towards Bakersfield
      autocomplete.setOptions({
        strictBounds: false, // Allow results outside bounds but prioritize within
        types: ['establishment', 'geocode'] // Include businesses and addresses
      });

      // Listen for place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (place && place.formatted_address) {
          // Update the input value
          onChange({
            target: {
              name: name,
              value: place.formatted_address
            }
          });
        } else if (place && place.name) {
          // If no formatted address, use the place name
          onChange({
            target: {
              name: name,
              value: place.name
            }
          });
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  };

  // Handle manual input changes
  const handleInputChange = (e) => {
    onChange(e);
  };

  // Handle input focus - re-initialize autocomplete if needed
  const handleFocus = () => {
    if (isGoogleLoaded && !autocompleteRef.current) {
      initializeAutocomplete();
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <MapPin size={16} className="text-gray-400" />
      </div>
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`pl-10 pr-3 py-2 w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        } ${className}`}
        autoComplete="off"
      />
      {isGoogleLoaded && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-xs text-gray-400">📍</span>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;