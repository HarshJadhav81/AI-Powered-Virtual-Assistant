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
    this.callbacks = {
      onResult: null,
      onStart: null,
      onEnd: null,
      onError: null,
      onWakeWord: null
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
    this.recognition.interimResults = false;
    this.recognition.lang = this.currentLanguage;

    this.recognition.onstart = () => {
      this.isListening = true;
      console.info('[COPILOT-UPGRADE]', 'Voice recognition started');
      this.callbacks.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.info('[COPILOT-UPGRADE]', 'Voice recognition ended');
      this.callbacks.onEnd?.();
      
      // Auto-restart if not speaking and restart is enabled
      if (!this.isSpeaking && this.shouldRestart) {
        setTimeout(() => {
          if (!this.isListening && !this.isSpeaking) {
            this.start();
          }
        }, 1000);
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('[VOICE-ASSISTANT-ERROR]:', event.error);
      this.isListening = false;
      this.callbacks.onError?.(event.error);
      
      // Only retry on network errors, not on abort
      if (event.error === 'network' && !this.isSpeaking && this.shouldRestart) {
        setTimeout(() => {
          if (!this.isListening && !this.isSpeaking) {
            this.start();
          }
        }, 2000);
      }
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      console.info('[COPILOT-UPGRADE]', 'Transcript:', transcript);

      // Check for wake word
      if (this.detectWakeWord(transcript)) {
        console.info('[COPILOT-UPGRADE]', 'Wake word detected!');
        this.callbacks.onWakeWord?.(transcript);
        this.callbacks.onResult?.(transcript);
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

      // Select appropriate voice
      const voices = this.synth.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang === utterance.lang && v.name.toLowerCase().includes('male')
      ) || voices.find(v => v.lang === utterance.lang);

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      this.isSpeaking = true;

      utterance.onstart = () => {
        console.info('[COPILOT-UPGRADE]', 'Speaking:', text);
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        console.info('[COPILOT-UPGRADE]', 'Speech ended');
        
        // Resume listening after speech with delay
        setTimeout(() => {
          if (!this.isListening && this.shouldRestart) {
            this.start();
          }
        }, 1000);
        
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        console.error('[SPEECH-ERROR]:', event);
        
        // Resume listening even on error
        setTimeout(() => {
          if (!this.isListening && this.shouldRestart) {
            this.start();
          }
        }, 1000);
        
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
    if (this.callbacks.hasOwnProperty('on' + event.charAt(0).toUpperCase() + event.slice(1))) {
      this.callbacks['on' + event.charAt(0).toUpperCase() + event.slice(1)] = callback;
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
