/**
 * Voice Activity Detection (VAD) Service
 * Uses Web Audio API for real-time speech detection
 * 100% FREE - No external services required
 */

class VADService {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.isMonitoring = false;
        this.isSpeaking = false;
        this.silenceTimeout = null;
        this.speechStartTime = null;

        // Configuration
        this.config = {
            fftSize: 2048,
            smoothingTimeConstant: 0.8,
            energyThreshold: 0.05, // Increased from 0.02 to reduce echo self-interruption
            silenceThreshold: 300, // ms of silence before speech end
            minSpeechDuration: 100, // ms minimum speech duration
            noiseFloor: 0.01, // Noise floor level
            sensitivity: 'expert' // Custom sensitivity for barge-in
        };

        // Callbacks
        this.callbacks = {
            onSpeechStart: null,
            onSpeechEnd: null,
            onVolumeChange: null,
            onInterrupt: null
        };

        // Sensitivity presets
        this.sensitivityPresets = {
            high: { energyThreshold: 0.03, noiseFloor: 0.01 },
            medium: { energyThreshold: 0.05, noiseFloor: 0.012 },
            low: { energyThreshold: 0.08, noiseFloor: 0.015 }
        };
    }

    /**
     * Initialize audio context and microphone
     */
    async initialize() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Create audio nodes
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.config.fftSize;
            this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;

            // Connect nodes
            this.microphone.connect(this.analyser);

            console.info('[VAD] Initialized successfully');
            return true;
        } catch (error) {
            console.error('[VAD] Initialization failed:', error);
            return false;
        }
    }

    /**
     * Start monitoring for speech
     */
    startMonitoring() {
        if (!this.audioContext || !this.analyser) {
            console.error('[VAD] Not initialized');
            return;
        }

        this.isMonitoring = true;
        this.monitorAudio();
        console.info('[VAD] Monitoring started');
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        this.isMonitoring = false;
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
        }
        console.info('[VAD] Monitoring stopped');
    }

    /**
     * Monitor audio levels and detect speech
     */
    monitorAudio() {
        if (!this.isMonitoring) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        // Calculate energy level
        const energy = this.calculateEnergy(dataArray);

        // Notify volume change
        this.callbacks.onVolumeChange?.(energy);

        // Detect speech based on energy threshold
        const isSpeechDetected = energy > this.config.energyThreshold;

        if (isSpeechDetected && !this.isSpeaking) {
            // Speech started
            this.handleSpeechStart();
        } else if (!isSpeechDetected && this.isSpeaking) {
            // Potential speech end - wait for silence threshold
            if (!this.silenceTimeout) {
                this.silenceTimeout = setTimeout(() => {
                    this.handleSpeechEnd();
                }, this.config.silenceThreshold);
            }
        } else if (isSpeechDetected && this.isSpeaking) {
            // Continue speaking - reset silence timeout
            if (this.silenceTimeout) {
                clearTimeout(this.silenceTimeout);
                this.silenceTimeout = null;
            }
        }

        // Continue monitoring
        requestAnimationFrame(() => this.monitorAudio());
    }

    /**
     * Calculate energy level from frequency data
     */
    calculateEnergy(dataArray) {
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] / 255.0;
        }
        const average = sum / dataArray.length;

        // Subtract noise floor
        return Math.max(0, average - this.config.noiseFloor);
    }

    /**
     * Handle speech start detection
     */
    handleSpeechStart() {
        const now = Date.now();

        // Ignore very short bursts
        if (this.speechStartTime && (now - this.speechStartTime) < this.config.minSpeechDuration) {
            return;
        }

        this.isSpeaking = true;
        this.speechStartTime = now;

        console.info('[VAD] Speech detected');
        this.callbacks.onSpeechStart?.();
    }

    /**
     * Handle speech end detection
     */
    handleSpeechEnd() {
        const duration = Date.now() - this.speechStartTime;

        // Ignore very short speech
        if (duration < this.config.minSpeechDuration) {
            this.isSpeaking = false;
            this.silenceTimeout = null;
            return;
        }

        this.isSpeaking = false;
        this.silenceTimeout = null;

        console.info('[VAD] Speech ended, duration:', duration, 'ms');
        this.callbacks.onSpeechEnd?.(duration);
    }

    /**
     * Set sensitivity level
     */
    setSensitivity(level) {
        if (this.sensitivityPresets[level]) {
            this.config.sensitivity = level;
            Object.assign(this.config, this.sensitivityPresets[level]);
            console.info('[VAD] Sensitivity set to:', level);
        }
    }

    /**
     * Detect interrupt (user speaking while TTS is playing)
     */
    detectInterrupt(isTTSPlaying) {
        if (isTTSPlaying && this.isSpeaking) {
            console.info('[VAD] Interrupt detected!');
            this.callbacks.onInterrupt?.();
            return true;
        }
        return false;
    }

    /**
     * Get current audio level (for visualization)
     */
    getAudioLevel() {
        if (!this.analyser) return 0;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        return this.calculateEnergy(dataArray);
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopMonitoring();

        if (this.microphone) {
            this.microphone.disconnect();
        }

        if (this.audioContext) {
            this.audioContext.close();
        }

        console.info('[VAD] Cleaned up');
    }

    /**
     * Register callbacks
     */
    on(event, callback) {
        if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase()}${event.slice(1)}`)) {
            this.callbacks[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = callback;
        }
    }
}

// Export singleton instance
const vadService = new VADService();
export default vadService;
