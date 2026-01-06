/**
 * Voice Personality System
 * Adds emotion detection and deterministic male voice selection
 */

class VoicePersonality {
  constructor() {
    this.availableVoices = [];

    this.emotions = {
      happy: {
        pitch: 1.05,
        rate: 1.05,
        volume: 1.0,
        keywords: ['great', 'awesome', 'wonderful', 'excellent', 'perfect', 'love', 'fantastic']
      },
      sad: {
        pitch: 0.9,
        rate: 0.95,
        volume: 0.9,
        keywords: ['sorry', 'unfortunately', 'sad', 'regret', 'apologize', 'problem', 'error']
      },
      excited: {
        pitch: 1.05,
        rate: 1.1,
        volume: 1.0,
        keywords: ['wow', 'amazing', 'incredible', 'found', 'success', 'done', 'ready']
      },
      calm: {
        pitch: 1.0,
        rate: 1.0,
        volume: 0.9,
        keywords: ['ok', 'sure', 'here', 'let me', 'one moment', 'working on']
      },
      curious: {
        pitch: 1.03,
        rate: 1.0,
        volume: 1.0,
        keywords: ['what', 'why', 'how', 'when', 'where', 'interesting', 'tell me']
      }
    };

    this.currentEmotion = 'calm';
    this.personalityMode = localStorage.getItem('voicePersonality') || 'friendly';
  }

  setAvailableVoices(voices) {
    this.availableVoices = voices || [];
  }

  detectEmotion(text) {
    const lowerText = text.toLowerCase();

    for (const [emotion, config] of Object.entries(this.emotions)) {
      for (const keyword of config.keywords) {
        if (lowerText.includes(keyword)) {
          this.currentEmotion = emotion;
          return emotion;
        }
      }
    }

    if (text.includes('!')) return (this.currentEmotion = 'excited');
    if (text.includes('?')) return (this.currentEmotion = 'curious');

    return (this.currentEmotion = 'calm');
  }

  applyEmotion(utterance, emotion = null) {
    const config = this.emotions[emotion || this.currentEmotion] || this.emotions.calm;
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    utterance.volume = config.volume;
    return utterance;
  }

  resolveMaleVoice(voices) {
    if (!voices.length) return null;

    const priority = ['alex', 'daniel', 'fred', 'tom', 'male'];

    for (const key of priority) {
      const match = voices.find(v => v.name.toLowerCase().includes(key));
      if (match) return match;
    }

    return voices.find(v =>
      !v.name.toLowerCase().includes('samantha') &&
      !v.name.toLowerCase().includes('victoria')
    ) || null;
  }

  getVoiceVariant() {
    return this.resolveMaleVoice(this.availableVoices);
  }

  setPersonality(mode) {
    if (['friendly', 'professional', 'casual'].includes(mode)) {
      this.personalityMode = mode;
      localStorage.setItem('voicePersonality', mode);
      return true;
    }
    return false;
  }

  addPersonalityToText(text) {
    if (this.personalityMode === 'professional') {
      return text.replace(/!/g, '.');
    }
    return text;
  }

  createUtterance(text, options = {}) {
    const emotion = options.emotion || this.detectEmotion(text);
    const utterance = new SpeechSynthesisUtterance(
      this.addPersonalityToText(text)
    );

    utterance.lang = options.lang || 'en-US';
    this.applyEmotion(utterance, emotion);

    const voice = this.getVoiceVariant();
    if (voice) utterance.voice = voice;

    if (options.onEnd) utterance.onend = options.onEnd;
    if (options.onError) utterance.onerror = options.onError;

    console.info('[VOICE]', {
      voice: voice?.name,
      emotion,
      pitch: utterance.pitch,
      rate: utterance.rate
    });

    return utterance;
  }
}

const voicePersonality = new VoicePersonality();
export default voicePersonality;
