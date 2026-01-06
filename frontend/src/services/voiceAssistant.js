import socketService from './socketService';
import voicePersonality from './voicePersonality';

class VoiceAssistant {
  constructor(assistantName = 'Assistant') {
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.voices = [];
    this.isListening = false;
    this.isSpeaking = false;
    this.shouldRestart = false;
    this.currentLanguage = 'en-US';
    this.assistantName = assistantName;
    this.listeners = {};

    this._loadVoices();
    speechSynthesis.onvoiceschanged = () => this._loadVoices();

    this.initialize();
  }

  _loadVoices() {
    const voices = this.synth.getVoices();
    if (!voices.length) return;

    this.voices = voices;
    voicePersonality.setAvailableVoices(voices);
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    this.listeners[event]?.forEach(cb => cb(data));
  }

  initialize() {
    if (!('webkitSpeechRecognition' in window)) {
      this.emit('error', 'not-supported');
      return;
    }

    this.recognition = new window.webkitSpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.currentLanguage;

    this.recognition.onstart = () => {
      this._isStarting = false; // Reset guard
      this.isListening = true;
      if (this.isSpeaking) this.synth.cancel();
      this.emit('start');
    };

    this.recognition.onresult = e => {
      const transcript = e.results[0][0].transcript;
      const lower = transcript.toLowerCase();
      const name = this.assistantName.toLowerCase();

      // Emit 'wakeWord' event if detected (for UI effects)
      if (lower.includes(name)) {
        this.emit('wakeWord', transcript);
      }

      // Strict Wake Word Enforcement
      if (!lower.startsWith(name)) {
        // [STRICT-MODE] Ignore any speech that doesn't start with the assistant name
        // This ensures the assistant only responds when explicitly addressed.
        console.debug('[VOICE] Ignoring input without wake word:', transcript);
        return;
      }

      // Remove the wake word from the command
      const clean = transcript.replace(
        new RegExp(`^${this.assistantName}\\s*`, 'i'),
        ''
      ).trim();

      if (!clean) return; // Ignore "Jarvis" with no command

      this.emit('result', clean);
    };

    this.recognition.onend = () => {
      this._isStarting = false; // Reset guard
      this.isListening = false;
      this.emit('end');
      if (this.shouldRestart) this.start(); // Changed to use managed start()
    };

    this.recognition.onerror = () => {
      this._isStarting = false;
      this.isListening = false;
    };
  }

  start() {
    if (this.isListening || this.isSpeaking) return;

    // STARTING GUARD: Prevent multiple start calls while async 'onstart' is pending
    if (this._isStarting) return;
    this._isStarting = true;

    this.shouldRestart = true;
    try {
      this.recognition.start();
    } catch (e) {
      // Ignore "already started" errors
      console.debug('[VOICE] Start error (harmless):', e);
      this._isStarting = false;
    }
  }

  stop() {
    this.shouldRestart = false;
    this.recognition?.stop();
    this.isListening = false;
  }

  destroy() {
    this.shouldRestart = false;
    this.isListening = false;
    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.onstart = null;
      this.recognition.onerror = null;
      this.recognition.onresult = null;
      this.recognition.stop();
      this.recognition = null;
    }
    if (this.isSpeaking) {
      this.synth.cancel();
    }
    this.listeners = {};
  }

  speak(text, options = {}) {
    if (!text) return;

    this.stop();
    if (this.isSpeaking) this.synth.cancel();
    this.isSpeaking = true;

    const utterance = voicePersonality.createUtterance(text, {
      lang: options.lang || this.currentLanguage,
      onEnd: () => {
        this.isSpeaking = false;
        this.start();
      },
      onError: () => {
        this.isSpeaking = false;
        this.start();
      }
    });

    this.synth.speak(utterance);
  }
}

export default VoiceAssistant;
