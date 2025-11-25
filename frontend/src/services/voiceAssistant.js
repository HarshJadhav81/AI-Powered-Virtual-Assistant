/**
 * Voice Assistant Service
 * [COPILOT-UPGRADE]: Enhanced voice recognition with wake word detection, 
 * multi-language support, and optimized speech synthesis
 */

class VoiceAssistant {
  constructor(assistantName = 'Orvion') {
    this.assistantName = assistantName.toLowerCase();
    this.isListening = false;
    this.isSpeaking = false;
    this.recognition = null;
    this.synth = window.speechSynthesis;
    this.currentLanguage = 'en-US';
    this.shouldRestart = true; // Add flag to control auto-restart
    this.consecutiveErrors = 0; // Track consecutive errors
    this.maxRetries = 3; // Maximum consecutive error retries
    this.retryDelay = 1000; // Base retry delay in ms
    this.lastError = null; // Track last error type
    this.isActiveMode = false; // Persistent activation state
    this.stopPhrases = ['stop', 'deactivate', 'sleep', 'pause']; // Stop command phrases
    this.callbacks = {
      onResult: null,
      onStart: null,
      onEnd: null,
      onError: null,
      onWakeWord: null,
      onDeactivate: null,
      onPartial: null
    };

    this.languageMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'mr': 'mr-IN'
    };

    this.initRecognition();
  }

  /**
   * Initialize Speech Recognition
   */
  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('[VOICE-ASSISTANT]: Speech Recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true; // Enable real-time streaming
    this.recognition.lang = this.currentLanguage;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.consecutiveErrors = 0; // Reset error counter on successful start
      console.info('[COPILOT-UPGRADE]', 'Voice recognition started');
      this.callbacks.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.info('[COPILOT-UPGRADE]', 'Voice recognition ended');
      this.callbacks.onEnd?.();

      // Only auto-restart if:
      // 1. Not speaking
      // 2. Restart is enabled
      // 3. Haven't exceeded max retries
      // 4. Last error wasn't 'aborted' or 'no-speech'
      const shouldAttemptRestart = !this.isSpeaking &&
        this.shouldRestart &&
        this.consecutiveErrors < this.maxRetries &&
        this.lastError !== 'aborted' &&
        this.lastError !== 'no-speech';

      if (shouldAttemptRestart) {
        const delay = this.retryDelay * Math.pow(2, this.consecutiveErrors); // Exponential backoff
        console.info('[COPILOT-UPGRADE]', `Scheduling restart in ${delay}ms`);
        setTimeout(() => {
          if (!this.isListening && !this.isSpeaking) {
            this.start();
          }
        }, delay);
      } else if (this.consecutiveErrors >= this.maxRetries) {
        console.warn('[VOICE-ASSISTANT]:', 'Max retries reached. Auto-restart disabled.');
        this.shouldRestart = false;
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('[VOICE-ASSISTANT-ERROR]:', event.error);
      this.isListening = false;
      this.lastError = event.error;
      this.consecutiveErrors++;
      this.callbacks.onError?.(event.error);

      // Don't retry on certain error types
      const noRetryErrors = ['aborted', 'audio-capture', 'not-allowed'];

      if (noRetryErrors.includes(event.error)) {
        console.info('[VOICE-ASSISTANT]:', `Not retrying due to '${event.error}' error`);
        this.shouldRestart = false;
        return;
      }

      // For 'no-speech' error, allow retry but with longer delay
      if (event.error === 'no-speech') {
        console.info('[VOICE-ASSISTANT]:', 'No speech detected, will retry with longer delay');
        if (this.shouldRestart && this.consecutiveErrors < this.maxRetries) {
          const delay = 3000; // 3 second delay for no-speech
          setTimeout(() => {
            if (!this.isListening && !this.isSpeaking) {
              this.start();
            }
          }, delay);
        }
        return;
      }

      // Only retry on network errors with backoff
      if (event.error === 'network' && !this.isSpeaking && this.shouldRestart && this.consecutiveErrors < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, this.consecutiveErrors);
        console.info('[COPILOT-UPGRADE]', `Network error. Retrying in ${delay}ms (attempt ${this.consecutiveErrors}/${this.maxRetries})`);
        setTimeout(() => {
          if (!this.isListening && !this.isSpeaking) {
            this.start();
          }
        }, delay);
      }
    };

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.trim();

      // Handle interim (partial) results
      if (!result.isFinal) {
        console.info('[REAL-TIME-STT] Partial:', transcript);
        this.callbacks.onPartial?.(transcript);
        return;
      }

      // Handle final results
      console.info('[REAL-TIME-STT] Final:', transcript);

      // Check for stop command first (highest priority)
      if (this.detectStopCommand(transcript)) {
        console.info('[CONTINUOUS-MODE]', 'Stop command detected - deactivating');
        this.isActiveMode = false;
        this.callbacks.onDeactivate?.(transcript);
        return;
      }

      // Check for wake word
      if (this.detectWakeWord(transcript)) {
        console.info('[CONTINUOUS-MODE]', 'Wake word detected - activating');
        this.isActiveMode = true;
        this.callbacks.onWakeWord?.(transcript);

        // Extract command after wake word (if any)
        const command = this.extractCommand(transcript);
        if (command) {
          console.info('[CONTINUOUS-MODE]', 'Processing command from wake word:', command);
          this.callbacks.onResult?.(command);
        }
        return;
      }

      // Process command if already in active mode
      if (this.isActiveMode) {
        console.info('[CONTINUOUS-MODE]', 'Active mode - processing command:', transcript);
        this.callbacks.onResult?.(transcript);
      } else {
        console.info('[CONTINUOUS-MODE]', 'Inactive - ignoring:', transcript);
      }
    };
  }

  /**
   * Detect wake word in transcript
   */
  detectWakeWord(transcript) {
    const lowerTranscript = transcript.toLowerCase();

    // Check for assistant name or variations
    const wakeWords = [
      this.assistantName,
      'hey ' + this.assistantName,
      'hi ' + this.assistantName,
      'hello ' + this.assistantName,
      'ok ' + this.assistantName
    ];

    return wakeWords.some(word => lowerTranscript.includes(word));
  }

  /**
   * Detect stop command in transcript
   */
  detectStopCommand(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    const assistantName = this.assistantName;

    // Check for "stop [assistant name]" or "[assistant name] stop"
    return this.stopPhrases.some(phrase => {
      const patterns = [
        `${phrase} ${assistantName}`,
        `${assistantName} ${phrase}`,
        `${phrase} listening`,
        `${phrase} assistant`
      ];
      return patterns.some(pattern => lowerTranscript.includes(pattern));
    });
  }

  /**
   * Extract command from transcript (remove wake word)
   */
  extractCommand(transcript) {
    let command = transcript.toLowerCase();

    // Remove wake word variations from the beginning
    const patterns = [
      `hey ${this.assistantName}`,
      `hi ${this.assistantName}`,
      `hello ${this.assistantName}`,
      `ok ${this.assistantName}`,
      this.assistantName
    ];

    for (const pattern of patterns) {
      if (command.startsWith(pattern)) {
        command = command.substring(pattern.length).trim();
        break;
      }
      // Also try removing from middle/end
      if (command.includes(pattern)) {
        command = command.replace(pattern, '').trim();
        break;
      }
    }

    // Return null if no command after wake word
    return command || null;
  }

  /**
   * Get active mode status
   */
  getActiveMode() {
    return this.isActiveMode;
  }

  /**
   * Manually set active mode (for external control)
   */
  setActiveMode(active) {
    this.isActiveMode = active;
    console.info('[CONTINUOUS-MODE]', `Active mode ${active ? 'enabled' : 'disabled'}`);
  }

  /**
   * Start listening
   */
  start() {
    if (!this.recognition) {
      console.error('[VOICE-ASSISTANT]: Recognition not initialized');
      return;
    }

    if (this.isListening || this.isSpeaking) {
      return;
    }

    try {
      this.shouldRestart = true; // Enable auto-restart when manually starting
      this.recognition.start();
      console.info('[COPILOT-UPGRADE]', 'Starting voice recognition');
    } catch (error) {
      if (error.name !== 'InvalidStateError') {
        console.error('[VOICE-ASSISTANT-ERROR]:', error);
      }
    }
  }

  /**
   * Stop listening
   */
  stop() {
    this.shouldRestart = false; // Prevent auto-restart
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      console.info('[COPILOT-UPGRADE]', 'Stopping voice recognition');
    }
  }

  /**
   * Speak text with enhanced voice synthesis
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      // Stop listening while speaking
      if (this.isListening) {
        this.recognition.stop();
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang || this.currentLanguage;
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      // Select appropriate voice based on language
      const voices = this.synth.getVoices();
      let preferredVoice = null;

      // Voice selection based on language
      if (utterance.lang.startsWith('en')) {
        // English - US Male Voice
        preferredVoice = voices.find(v =>
          v.lang.startsWith('en-US') && v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('female')
        ) || voices.find(v =>
          v.lang.startsWith('en-US')
        ) || voices.find(v =>
          v.lang.startsWith('en') && v.name.toLowerCase().includes('male')
        );
      } else if (utterance.lang.startsWith('hi')) {
        // Hindi - Indian Male Voice
        preferredVoice = voices.find(v =>
          v.lang.startsWith('hi-IN') && v.name.toLowerCase().includes('male')
        ) || voices.find(v =>
          v.lang.startsWith('hi')
        );
      } else if (utterance.lang.startsWith('mr')) {
        // Marathi - Indian Male Voice
        preferredVoice = voices.find(v =>
          v.lang.startsWith('mr-IN') && v.name.toLowerCase().includes('male')
        ) || voices.find(v =>
          v.lang.startsWith('mr')
        );
      }

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.info('[VOICE]', `Using voice: ${preferredVoice.name} (${preferredVoice.lang})`);
      }

      this.isSpeaking = true;

      utterance.onstart = () => {
        console.info('[COPILOT-UPGRADE]', 'Speaking:', text);
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        console.info('[COPILOT-UPGRADE]', 'Speech ended');

        // Resume listening after speech with longer delay to prevent conflicts
        setTimeout(() => {
          if (!this.isListening && this.shouldRestart) {
            this.start();
          }
        }, 2000); // Increased from 1000ms to 2000ms

        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        console.error('[SPEECH-ERROR]:', event);

        // Resume listening even on error with longer delay
        setTimeout(() => {
          if (!this.isListening && this.shouldRestart) {
            this.start();
          }
        }, 2000); // Increased from 1000ms to 2000ms

        reject(event);
      };

      this.synth.speak(utterance);
    });
  }

  /**
   * Set language
   */
  setLanguage(langCode) {
    const fullLangCode = this.languageMap[langCode] || langCode;
    this.currentLanguage = fullLangCode;

    if (this.recognition) {
      this.recognition.lang = fullLangCode;
      console.info('[COPILOT-UPGRADE]', `Language set to: ${fullLangCode}`);
    }
  }

  /**
   * Set assistant name for wake word
   */
  setAssistantName(name) {
    this.assistantName = name.toLowerCase();
    console.info('[COPILOT-UPGRADE]', `Assistant name set to: ${name}`);
  }

  /**
   * Register callbacks
   */
  on(event, callback) {
    const eventKey = 'on' + event.charAt(0).toUpperCase() + event.slice(1);
    if (Object.prototype.hasOwnProperty.call(this.callbacks, eventKey)) {
      this.callbacks[eventKey] = callback;
    }
  }

  /**
   * Check if speech synthesis is available
   */
  isSynthesisSupported() {
    return 'speechSynthesis' in window;
  }

  /**
   * Check if speech recognition is available
   */
  isRecognitionSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  /**
   * Get available voices
   */
  getAvailableVoices() {
    return this.synth.getVoices();
  }

  /**
   * Cleanup and destroy the voice assistant
   */
  destroy() {
    this.shouldRestart = false;
    this.stop();
    this.synth.cancel();
    this.callbacks = {
      onResult: null,
      onStart: null,
      onEnd: null,
      onError: null,
      onWakeWord: null
    };
    console.info('[COPILOT-UPGRADE]', 'Voice assistant destroyed');
  }
}

export default VoiceAssistant;
