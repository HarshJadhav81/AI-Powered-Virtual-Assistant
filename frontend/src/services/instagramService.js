/**
 * Instagram Service - Social Media Integration
 * Handles Instagram messaging, posting, and profile management
 * Uses Instagram Graph API and deep links
 */

class InstagramService {
  constructor() {
    this.platform = this.detectPlatform();
  }

  /**
   * Detect platform (mobile/desktop)
   */
  detectPlatform() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    
    return {
      isMobile,
      isIOS: /ipad|iphone|ipod/.test(userAgent.toLowerCase()),
      isAndroid: /android/.test(userAgent.toLowerCase()),
      isDesktop: !isMobile
    };
  }

  /**
   * Open Instagram app or website
   */
  openInstagram() {
    try {
      const url = this.platform.isMobile 
        ? 'instagram://user?username=self'  // Opens Instagram app
        : 'https://www.instagram.com/';      // Opens Instagram website
      
      window.open(url, '_blank');
      
      return {
        success: true,
        message: 'Opening Instagram',
        platform: this.platform.isMobile ? 'app' : 'web'
      };
    } catch (error) {
      console.error('[INSTAGRAM-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to open Instagram',
        error: error.message
      };
    }
  }

  /**
   * Open Instagram Direct Messages
   * @param {string} username - Instagram username to message
   */
  openDirectMessage(username) {
    try {
      let url;
      
      if (this.platform.isMobile) {
        // Instagram app deep link for DM
        url = `instagram://user?username=${username}`;
      } else {
        // Instagram web DM (user needs to be logged in)
        url = `https://www.instagram.com/direct/t/`;
      }
      
      window.open(url, '_blank');
      
      return {
        success: true,
        message: `Opening Instagram DM${username ? ` with ${username}` : ''}`,
        username,
        note: 'You need to be logged into Instagram to send messages'
      };
    } catch (error) {
      console.error('[INSTAGRAM-DM-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to open Instagram DM',
        error: error.message
      };
    }
  }

  /**
   * Open Instagram user profile
   * @param {string} username - Instagram username
   */
  openProfile(username) {
    try {
      const url = this.platform.isMobile
        ? `instagram://user?username=${username}`
        : `https://www.instagram.com/${username}/`;
      
      window.open(url, '_blank');
      
      return {
        success: true,
        message: `Opening Instagram profile: ${username}`,
        username,
        url
      };
    } catch (error) {
      console.error('[INSTAGRAM-PROFILE-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to open Instagram profile',
        error: error.message
      };
    }
  }

  /**
   * Open Instagram camera for story/post
   */
  openCamera() {
    try {
      const url = this.platform.isMobile
        ? 'instagram://camera'  // Opens Instagram camera
        : 'https://www.instagram.com/';  // Fallback to web
      
      window.open(url, '_blank');
      
      return {
        success: true,
        message: 'Opening Instagram camera',
        note: this.platform.isDesktop ? 'Instagram camera only available on mobile app' : undefined
      };
    } catch (error) {
      console.error('[INSTAGRAM-CAMERA-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to open Instagram camera',
        error: error.message
      };
    }
  }

  /**
   * Open Instagram Explore page
   * @param {string} hashtag - Optional hashtag to explore
   */
  openExplore(hashtag = null) {
    try {
      let url;
      
      if (hashtag) {
        url = this.platform.isMobile
          ? `instagram://tag?name=${encodeURIComponent(hashtag.replace('#', ''))}`
          : `https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag.replace('#', ''))}/`;
      } else {
        url = this.platform.isMobile
          ? 'instagram://explore'
          : 'https://www.instagram.com/explore/';
      }
      
      window.open(url, '_blank');
      
      return {
        success: true,
        message: hashtag ? `Exploring hashtag: ${hashtag}` : 'Opening Instagram Explore',
        hashtag
      };
    } catch (error) {
      console.error('[INSTAGRAM-EXPLORE-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to open Instagram Explore',
        error: error.message
      };
    }
  }

  /**
   * Open Instagram Reels
   */
  openReels() {
    try {
      const url = this.platform.isMobile
        ? 'instagram://reels'
        : 'https://www.instagram.com/reels/';
      
      window.open(url, '_blank');
      
      return {
        success: true,
        message: 'Opening Instagram Reels'
      };
    } catch (error) {
      console.error('[INSTAGRAM-REELS-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to open Instagram Reels',
        error: error.message
      };
    }
  }

  /**
   * Open Instagram Stories
   */
  openStories() {
    try {
      const url = this.platform.isMobile
        ? 'instagram://story-camera'
        : 'https://www.instagram.com/';
      
      window.open(url, '_blank');
      
      return {
        success: true,
        message: 'Opening Instagram Stories',
        note: this.platform.isDesktop ? 'Stories are best viewed on mobile app' : undefined
      };
    } catch (error) {
      console.error('[INSTAGRAM-STORIES-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to open Instagram Stories',
        error: error.message
      };
    }
  }

  /**
   * Open specific Instagram post
   * @param {string} postId - Instagram post short code
   */
  openPost(postId) {
    try {
      const url = `https://www.instagram.com/p/${postId}/`;
      window.open(url, '_blank');
      
      return {
        success: true,
        message: 'Opening Instagram post',
        postId,
        url
      };
    } catch (error) {
      console.error('[INSTAGRAM-POST-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to open Instagram post',
        error: error.message
      };
    }
  }

  /**
   * Search on Instagram
   * @param {string} query - Search query
   */
  search(query) {
    try {
      const url = `https://www.instagram.com/explore/search/?q=${encodeURIComponent(query)}`;
      window.open(url, '_blank');
      
      return {
        success: true,
        message: `Searching Instagram for: ${query}`,
        query
      };
    } catch (error) {
      console.error('[INSTAGRAM-SEARCH-ERROR]:', error);
      return {
        success: false,
        message: 'Failed to search Instagram',
        error: error.message
      };
    }
  }

  /**
   * Get Instagram deep link schemes
   */
  getDeepLinkSchemes() {
    return {
      openApp: 'instagram://',
      profile: 'instagram://user?username=USERNAME',
      camera: 'instagram://camera',
      directMessages: 'instagram://direct',
      explore: 'instagram://explore',
      hashtag: 'instagram://tag?name=HASHTAG',
      location: 'instagram://location?id=LOCATION_ID',
      reels: 'instagram://reels',
      stories: 'instagram://story-camera',
      share: 'instagram://share'
    };
  }

  /**
   * Check if Instagram app is available (mobile only)
   */
  isInstagramAppAvailable() {
    return this.platform.isMobile;
  }

  /**
   * Get platform info
   */
  getPlatformInfo() {
    return {
      ...this.platform,
      hasInstagramApp: this.isInstagramAppAvailable(),
      recommendedInterface: this.platform.isMobile ? 'app' : 'web'
    };
  }
}

// Export singleton instance
const instagramService = new InstagramService();
export default instagramService;
