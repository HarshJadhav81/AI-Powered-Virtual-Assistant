import socketService from './socketService';

class VoiceAssistant {
  constructor(assistantName = 'Assistant') {
    this.recognition = null;
    this.synth = window.speechSynthesis;
    this.isListening = false;
    this.currentLanguage = 'en-US';
    this.voices = [];
    this.listeners = {};
    this.assistantName = assistantName; // Wake word
    this.shouldRestart = false;
    this.isSpeaking = false; // Track TTS state

    // Load voices
    this._loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this._loadVoices();
    }

    this.initialize();
  }

  _loadVoices() {
    this.voices = this.synth.getVoices();
  }

  // EventEmitter implementation
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  initialize() {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('[VOICE-ASSISTANT] Web Speech API not supported.');
      this.emit('error', 'not-supported');
      return;
    }

    this.recognition = new window.webkitSpeechRecognition();
    this.recognition.continuous = false; // Restart manually for control
    this.recognition.interimResults = false;
    this.recognition.lang = this.currentLanguage;

    this.recognition.onstart = () => {
      console.log('[VOICE-ASSISTANT] Recognition started');
      this.isListening = true;
      this.synth.cancel(); // Interrupt TTS
      this.emit('start');
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('[VOICE-ASSISTANT] Captured:', transcript);

      // [COPILOT-CHANGE] Strict Wake Word Enforcement
      const lowerTranscript = transcript.toLowerCase();
      const lowerName = this.assistantName.toLowerCase();

      // Check if transcript contains wake word
      // Note: We might want to allow "active session" logic later, but strictly user asked for wake word detection trigger.
      if (lowerTranscript.includes(lowerName)) {
        this.emit('wakeWord', transcript);
        this.emit('result', transcript);
      } else {
        console.log(`[VOICE-ASSISTANT] Ignored (No wake word "${this.assistantName}")`);
      }
    };

    this.recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // Silent ignore or auto-restart?
        return;
      }
      if (event.error === 'not-allowed') {
        this.emit('error', 'not-allowed');
      }
      console.error('[VOICE-ASSISTANT] Error:', event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      console.log('[VOICE-ASSISTANT] Recognition ended');
      this.isListening = false;
      this.emit('end');

      // Auto-restart logic if desired (Home.jsx seems to handle some via shouldRestart, 
      // but usually the class manages continuous listening loops)
      if (this.shouldRestart) {
        this.recognition.start();
      }
    };
  }

  start() {
    // [COPILOT-CHANGE] Prevent starting if system is speaking (avoids killing TTS)
    if (this.isListening || this.isSpeaking) {
      console.log('[VOICE-ASSISTANT] Start request ignored (Already listening or speaking)');
      return;
    }
    try {
      this.shouldRestart = true; // Enable auto-restart loop
      this.recognition.start();
    } catch (e) {
      console.warn('[VOICE-ASSISTANT] Start warning:', e.message);
    }
  }

  stop() {
    this.shouldRestart = false; // Disable loop
    if (this.recognition) {
      this.recognition.stop();
    }
    this.isListening = false;
  }

  destroy() {
    this.stop();
    this.listeners = {};
    // any other cleanup
  }

  speak(text, options = {}) {
    if (!text) return;

    // [COPILOT-CHANGE] Stop listening while speaking
    this.stop();
    this.synth.cancel();

    this.isSpeaking = true; // Set flag

    const utterance = new SpeechSynthesisUtterance(text);

    // Voice Selection
    const targetLang = (options.lang || this.currentLanguage).toLowerCase();
    utterance.lang = options.lang || this.currentLanguage;

    let preferredVoice = this.voices.find(v => v.lang.toLowerCase() === targetLang);
    if (!preferredVoice) {
      preferredVoice = this.voices.find(v => v.lang.toLowerCase().startsWith(targetLang.split('-')[0]));
    }
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      // [COPILOT-CHANGE] Resume listening after speech ends
      this.isSpeaking = false; // Clear flag
      console.log('[VOICE-ASSISTANT] TTS Ended - Restarting Listener');
      this.start();
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false; // Clear flag
      if (event.error === 'canceled' || event.error === 'interrupted') {
        console.log('[VOICE-ASSISTANT] TTS Canceled/Interrupted (Normal)');
      } else {
        console.warn('[VOICE-ASSISTANT] TTS Error:', event.error, '- Restarting Listener');
      }
      this.start();
    };

    this.synth.speak(utterance);
  }
}

export default VoiceAssistant;
