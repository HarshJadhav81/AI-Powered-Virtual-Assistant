/**
 * Platform Detection Service
 * Detects the operating system, device type, and available capabilities.
 */
class PlatformDetectionService {
    constructor() {
        this.userAgent = navigator.userAgent.toLowerCase();
        this.platform = this.detectOS();
        this.deviceType = this.detectDeviceType();
        this.capabilities = this.detectCapabilities();
    }

    detectOS() {
        if (this.userAgent.includes('win')) return 'windows';
        if (this.userAgent.includes('mac')) return 'macos';
        if (this.userAgent.includes('linux')) return 'linux';
        if (this.userAgent.includes('android')) return 'android';
        if (this.userAgent.includes('iphone') || this.userAgent.includes('ipad')) return 'ios';
        if (this.userAgent.includes('crkey') || this.userAgent.includes('chromecast')) return 'chromecast';
        return 'unknown';
    }

    detectDeviceType() {
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(this.userAgent)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(this.userAgent)) {
            return 'mobile';
        }
        if (this.platform === 'chromecast') {
            return 'tv';
        }
        return 'desktop';
    }

    detectCapabilities() {
        const isMobile = this.deviceType === 'mobile' || this.deviceType === 'tablet';
        const isNativeAndroid = this.platform === 'android' && !this.userAgent.includes('wv'); // Approximation

        return {
            canDeepLink: isMobile, // Generally mobile devices support deep linking better
            canControlMedia: true, // Most modern browsers support media session API
            canAutomateUI: false, // Web apps cannot generally automate UI outside their sandbox
            webFallbackOnly: this.platform === 'unknown' || this.platform === 'linux',
            isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
        };
    }

    getPlatformInfo() {
        return {
            os: this.platform,
            type: this.deviceType,
            capabilities: this.capabilities
        };
    }
}

const platformDetectionService = new PlatformDetectionService();
export default platformDetectionService;
