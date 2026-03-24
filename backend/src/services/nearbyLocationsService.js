'use strict';

/**
 * Nearby Locations Service
 * Provides nearby cities for job search expansion
 */

// City coordinates (latitude, longitude) - Indian cities
const CITY_COORDINATES = {
  'Hyderabad': { lat: 17.3850, lng: 78.4867, country: 'India', state: 'Telangana' },
  'Bangalore': { lat: 12.9716, lng: 77.5946, country: 'India', state: 'Karnataka' },
  'Bengaluru': { lat: 12.9716, lng: 77.5946, country: 'India', state: 'Karnataka' },
  'Delhi': { lat: 28.7041, lng: 77.1025, country: 'India', state: 'Delhi' },
  'Mumbai': { lat: 19.0760, lng: 72.8777, country: 'India', state: 'Maharashtra' },
  'Pune': { lat: 18.5204, lng: 73.8567, country: 'India', state: 'Maharashtra' },
  'Chennai': { lat: 13.0827, lng: 80.2707, country: 'India', state: 'Tamil Nadu' },
  'Kolkata': { lat: 22.5726, lng: 88.3639, country: 'India', state: 'West Bengal' },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714, country: 'India', state: 'Gujarat' },
  'Jaipur': { lat: 26.9124, lng: 75.7873, country: 'India', state: 'Rajasthan' },
  'Lucknow': { lat: 26.8467, lng: 80.9462, country: 'India', state: 'Uttar Pradesh' },
  'Chandigarh': { lat: 30.7333, lng: 76.7794, country: 'India', state: 'Chandigarh' },
  'Indore': { lat: 22.7196, lng: 75.8577, country: 'India', state: 'Madhya Pradesh' },
  'Surat': { lat: 21.1458, lng: 72.8340, country: 'India', state: 'Gujarat' },
  'Nagpur': { lat: 21.1458, lng: 79.0882, country: 'India', state: 'Maharashtra' },
  'Visakhapatnam': { lat: 17.6869, lng: 83.2185, country: 'India', state: 'Andhra Pradesh' },
  'Kochi': { lat: 9.9312, lng: 76.2673, country: 'India', state: 'Kerala' },
  'Coimbatore': { lat: 11.0081, lng: 76.9959, country: 'India', state: 'Tamil Nadu' },
  'Gurgaon': { lat: 28.4595, lng: 77.0266, country: 'India', state: 'Haryana' },
  'Noida': { lat: 28.5355, lng: 77.3910, country: 'India', state: 'Uttar Pradesh' },
};

/**
 * Calculate distance between two coordinates using Haversine formula (in km)
 * @param {number} lat1 
 * @param {number} lng1 
 * @param {number} lat2 
 * @param {number} lng2 
 * @returns {number} distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get nearby cities for a given city
 * Returns the city itself + nearby cities within a specified radius
 * @param {string} city - City name (e.g., "Hyderabad")
 * @param {number} radiusKm - Search radius in kilometers (default: 200km)
 * @param {number} maxResults - Maximum number of cities to return (default: 5)
 * @returns {string[]} Array of city names
 */
function getNearbyLocations(city, radiusKm = 200, maxResults = 5) {
  const cityData = CITY_COORDINATES[city];
  
  if (!cityData) {
    console.warn(`⚠️ City "${city}" not found in coordinates database`);
    return [city]; // Return original city if not found
  }

  const nearby = [];
  nearby.push(city); // Always include the primary city

  // Find all cities within radius and same country
  const distances = [];
  for (const [otherCity, otherData] of Object.entries(CITY_COORDINATES)) {
    if (otherCity === city) continue; // Skip the primary city
    
    // Only include cities from same country
    if (otherData.country !== cityData.country) continue;

    const distance = calculateDistance(
      cityData.lat,
      cityData.lng,
      otherData.lat,
      otherData.lng
    );

    if (distance <= radiusKm) {
      distances.push({ city: otherCity, distance });
    }
  }

  // Sort by distance and add up to maxResults
  distances.sort((a, b) => a.distance - b.distance);
  for (let i = 0; i < Math.min(distances.length, maxResults - 1); i++) {
    nearby.push(distances[i].city);
  }

  console.log(`📍 Found nearby locations for ${city}:`, nearby);
  return nearby;
}

/**
 * Get nearby locations with details
 * @param {string} city - City name
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {object[]} Array of location objects with distance info
 */
function getNearbyLocationsWithDistance(city, radiusKm = 200) {
  const cityData = CITY_COORDINATES[city];
  
  if (!cityData) {
    return [{ city, distance: 0, country: 'Unknown' }];
  }

  const result = [{ city, distance: 0, country: cityData.country, state: cityData.state }];

  const distances = [];
  for (const [otherCity, otherData] of Object.entries(CITY_COORDINATES)) {
    if (otherCity === city) continue;
    if (otherData.country !== cityData.country) continue;

    const distance = calculateDistance(
      cityData.lat,
      cityData.lng,
      otherData.lat,
      otherData.lng
    );

    if (distance <= radiusKm) {
      distances.push({ 
        city: otherCity, 
        distance: Math.round(distance), 
        country: otherData.country,
        state: otherData.state
      });
    }
  }

  distances.sort((a, b) => a.distance - b.distance);
  result.push(...distances);

  return result;
}

module.exports = {
  getNearbyLocations,
  getNearbyLocationsWithDistance,
  CITY_COORDINATES,
};
