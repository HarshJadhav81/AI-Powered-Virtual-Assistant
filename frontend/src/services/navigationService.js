/**
 * Navigation Service - Voice-activated location features
 * [COPILOT-UPGRADE]: Bridges locationService with AI commands
 */

import locationService from './locationService';

class NavigationService {
  constructor() {
    this.currentLocation = null;
  }

  /**
   * Handle navigation voice command
   */
  async navigate(destination, mode = 'driving') {
    try {
      console.info('[NAVIGATION]', `Navigating to: ${destination} (${mode})`);

      // Get current location first
      this.currentLocation = await locationService.getCurrentLocation();

      // Generate navigation URL
      const url = locationService.getNavigationUrl(destination, mode);

      // Open in new tab
      window.open(url, '_blank');

      return {
        success: true,
        voiceResponse: `Navigating to ${destination} via ${mode}.`,
        url,
        currentLocation: this.currentLocation
      };
    } catch (error) {
      console.error('[NAVIGATION-ERROR]:', error);
      
      // Fallback: open Google Maps search
      const fallbackUrl = `https://www.google.com/maps/search/${encodeURIComponent(destination)}`;
      window.open(fallbackUrl, '_blank');

      return {
        success: false,
        voiceResponse: `Opening map for ${destination}.`,
        url: fallbackUrl,
        error: error.message
      };
    }
  }

  /**
   * Find nearby places
   */
  async findNearby(placeType) {
    try {
      console.info('[NEARBY]', `Finding nearby: ${placeType}`);

      // Get current location
      this.currentLocation = await locationService.getCurrentLocation();

      // Generate nearby search URL
      const url = locationService.getNearbyPlacesUrl(placeType);

      // Open in new tab
      window.open(url, '_blank');

      return {
        success: true,
        voiceResponse: `Searching for nearby ${placeType}.`,
        url,
        currentLocation: this.currentLocation
      };
    } catch (error) {
      console.error('[NEARBY-ERROR]:', error);
      
      return {
        success: false,
        voiceResponse: `Unable to find nearby ${placeType}. Please enable location access.`,
        error: error.message
      };
    }
  }

  /**
   * Share current location
   */
  async shareLocation() {
    try {
      console.info('[SHARE-LOCATION]', 'Sharing location...');

      // Get current location
      this.currentLocation = await locationService.getCurrentLocation();

      // Share location
      const result = await locationService.shareLocation();

      return {
        success: true,
        voiceResponse: result.shared ? 
          'Location shared successfully.' : 
          'Location copied to clipboard.',
        location: this.currentLocation,
        shared: result.shared
      };
    } catch (error) {
      console.error('[SHARE-ERROR]:', error);
      
      return {
        success: false,
        voiceResponse: 'Unable to share location.',
        error: error.message
      };
    }
  }

  /**
   * Get current location coordinates
   */
  async whereAmI() {
    try {
      console.info('[WHERE-AM-I]', 'Getting location...');

      // Get current location
      this.currentLocation = await locationService.getCurrentLocation();

      // Format for voice
      const voiceLocation = locationService.formatLocationForVoice(this.currentLocation);

      return {
        success: true,
        voiceResponse: voiceLocation,
        location: this.currentLocation
      };
    } catch (error) {
      console.error('[WHERE-AM-I-ERROR]:', error);
      
      return {
        success: false,
        voiceResponse: 'Unable to determine your location. Please enable location access.',
        error: error.message
      };
    }
  }

  /**
   * Calculate distance to destination
   */
  async getDistance(destination) {
    try {
      console.info('[DISTANCE]', `Calculating distance to: ${destination}`);

      // Get current location
      this.currentLocation = await locationService.getCurrentLocation();

      // Note: This requires geocoding the destination address to coordinates
      // For now, just open Google Maps distance calculation
      const url = locationService.getNavigationUrl(destination);
      window.open(url, '_blank');

      return {
        success: true,
        voiceResponse: `Opening directions to ${destination}.`,
        url
      };
    } catch (error) {
      console.error('[DISTANCE-ERROR]:', error);
      
      return {
        success: false,
        voiceResponse: 'Unable to calculate distance.',
        error: error.message
      };
    }
  }

  /**
   * Check location permission
   */
  async checkPermission() {
    try {
      const status = await locationService.checkPermission();
      
      const messages = {
        granted: 'Location access is enabled.',
        denied: 'Location access is blocked. Please enable it in your browser settings.',
        prompt: 'Location permission is required. Please allow access.'
      };

      return {
        status,
        voiceResponse: messages[status] || 'Unknown location permission status.'
      };
    } catch (error) {
      return {
        status: 'error',
        voiceResponse: 'Unable to check location permission.'
      };
    }
  }
}

// Export singleton instance
const navigationService = new NavigationService();
export default navigationService;
