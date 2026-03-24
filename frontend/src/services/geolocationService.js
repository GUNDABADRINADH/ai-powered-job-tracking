/**
 * Geolocation Service
 * Detects user's location and converts coordinates to city name
 */

/**
 * Get user's current location (latitude, longitude)
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export const getUserCoordinates = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 User location:', { latitude, longitude });
        resolve({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
};

/**
 * Reverse geocode coordinates to city name using Open-Meteo (free, no API key needed)
 * Falls back to Google Maps Geocoding API if Open-Meteo fails
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string | null>}
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    // Try Open-Meteo Geocoding (free, no API key required)
    console.log('🔄 Reverse geocoding:', { lat, lng });
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lng}&language=en`
    );
    
    if (!response.ok) throw new Error('Open-Meteo API failed');
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      // Prefer city, fall back to admin1 (state/province)
      const city = result.city || result.admin1 || result.name;
      console.log('✅ Reverse geocoding result:', city);
      return city;
    }
  } catch (err) {
    console.warn('Open-Meteo geocoding failed:', err.message);
  }

  // Fallback: Try Google Maps Geocoding (requires API key in .env)
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (googleApiKey) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          // Find city-level address component
          for (const result of data.results) {
            for (const component of result.address_components) {
              if (component.types.includes('locality')) {
                console.log('✅ Google Maps geocoding result:', component.long_name);
                return component.long_name;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Google Maps geocoding failed:', err.message);
    }
  }

  return null;
};

/**
 * Get user's location (coordinates) and convert to city name
 * @returns {Promise<string | null>}
 */
export const getUserLocationCity = async () => {
  const coords = await getUserCoordinates();
  if (!coords) return null;

  const city = await reverseGeocode(coords.lat, coords.lng);
  return city;
};
