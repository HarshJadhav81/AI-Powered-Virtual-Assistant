/**
 * Location Service - Geolocation & Navigation
 * [COPILOT-UPGRADE]: Browser Geolocation API + Google Maps integration
 */

class LocationService {
  constructor() {
    this.currentLocation = null;
    this.watchId = null;
  }

  /**
   * Get current location using browser Geolocation API
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
          };

          console.info('[LOCATION-SERVICE]', 'Location obtained:', this.currentLocation);
          resolve(this.currentLocation);
        },
        (error) => {
          console.error('[LOCATION-ERROR]:', error.message);
          reject(new Error(this.getErrorMessage(error.code)));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Watch location changes
   */
  watchLocation(callback) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported');
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        };

        callback(this.currentLocation);
      },
      (error) => {
        console.error('[LOCATION-ERROR]:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return this.watchId;
  }

  /**
   * Stop watching location
   */
  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.info('[LOCATION-SERVICE]', 'Stopped watching location');
    }
  }

  /**
   * Generate Google Maps URL for navigation
   */
  getNavigationUrl(destination, mode = 'driving') {
    if (!this.currentLocation) {
      return `https://www.google.com/maps/search/${encodeURIComponent(destination)}`;
    }

    const { latitude, longitude } = this.currentLocation;
    
    // Modes: driving, walking, bicycling, transit
    const baseUrl = 'https://www.google.com/maps/dir/';
    const origin = `${latitude},${longitude}`;
    const dest = encodeURIComponent(destination);
    
    return `${baseUrl}${origin}/${dest}/@${latitude},${longitude},13z/data=!3m1!4b1!4m2!4m1!3e${this.getModeCode(mode)}`;
  }

  /**
   * Get nearby places URL
   */
  getNearbyPlacesUrl(placeType) {
    if (!this.currentLocation) {
      return `https://www.google.com/maps/search/${encodeURIComponent(placeType)}`;
    }

    const { latitude, longitude } = this.currentLocation;
    return `https://www.google.com/maps/search/${encodeURIComponent(placeType)}/@${latitude},${longitude},15z`;
  }

  /**
   * Get distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return {
      km: distance.toFixed(2),
      miles: (distance * 0.621371).toFixed(2)
    };
  }

  /**
   * Share location
   */
  async shareLocation() {
    if (!this.currentLocation) {
      await this.getCurrentLocation();
    }

    const { latitude, longitude } = this.currentLocation;
    const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Location',
          text: 'Here is my current location',
          url: locationUrl
        });
        return { success: true, shared: true };
      } catch (error) {
        console.warn('[SHARE-ERROR]:', error.message);
      }
    }

    // Fallback: copy to clipboard
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(locationUrl);
      return { success: true, shared: false, url: locationUrl, copied: true };
    }

    return { success: true, shared: false, url: locationUrl, copied: false };
  }

  /**
   * Get location permission status
   */
  async checkPermission() {
    if (!navigator.permissions) {
      return { state: 'unknown' };
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return {
        state: result.state, // 'granted', 'denied', 'prompt'
        canRequest: result.state === 'prompt'
      };
    } catch (error) {
      return { state: 'unknown' };
    }
  }

  /**
   * Helper: Convert degrees to radians
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Helper: Get Google Maps mode code
   */
  getModeCode(mode) {
    const modes = {
      'driving': '0',
      'walking': '2',
      'bicycling': '1',
      'transit': '3'
    };
    return modes[mode] || '0';
  }

  /**
   * Helper: Get error message
   */
  getErrorMessage(code) {
    switch (code) {
      case 1: // PERMISSION_DENIED
        return 'Location permission denied. Please enable location access in browser settings.';
      case 2: // POSITION_UNAVAILABLE
        return 'Location information is unavailable. Please check your device settings.';
      case 3: // TIMEOUT
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown error occurred while getting location.';
    }
  }

  /**
   * Format location for voice response
   */
  formatLocationForVoice(location) {
    const { latitude, longitude } = location;
    return `Your current location is latitude ${latitude.toFixed(4)}, longitude ${longitude.toFixed(4)}.`;
  }
}

// Export class (not singleton since it needs browser context)
export default LocationService;
