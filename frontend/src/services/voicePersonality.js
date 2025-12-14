/**
 * Voice Personality System
 * [COPILOT-UPGRADE]: Adds emotion detection and voice variants
 */

class VoicePersonality {
  constructor() {
    this.emotions = {
      happy: {
        pitch: 1.2,
        rate: 1.1,
        volume: 1.0,
        keywords: ['great', 'awesome', 'wonderful', 'excellent', 'perfect', 'love', 'fantastic']
      },
      sad: {
        pitch: 0.8,
        rate: 0.9,
        volume: 0.8,
        keywords: ['sorry', 'unfortunately', 'sad', 'regret', 'apologize', 'problem', 'error']
      },
      excited: {
        pitch: 1.3,
        rate: 1.2,
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
        pitch: 1.1,
        rate: 1.0,
        volume: 1.0,
        keywords: ['what', 'why', 'how', 'when', 'where', 'interesting', 'tell me']
      }
    };

    this.currentEmotion = 'calm';
    this.personalityMode = localStorage.getItem('voicePersonality') || 'friendly'; // friendly, professional, casual
  }

  /**
   * Detect emotion from text
   */
  detectEmotion(text) {
    const lowerText = text.toLowerCase();
    
    // Check for emotion keywords
    for (const [emotion, config] of Object.entries(this.emotions)) {
      for (const keyword of config.keywords) {
        if (lowerText.includes(keyword)) {
          this.currentEmotion = emotion;
          return emotion;
        }
      }
    }

    // Check for punctuation-based emotions
    if (text.includes('!')) {
      this.currentEmotion = 'excited';
      return 'excited';
    }
    
    if (text.includes('?')) {
      this.currentEmotion = 'curious';
      return 'curious';
    }

    // Default to calm
    this.currentEmotion = 'calm';
    return 'calm';
  }

  /**
   * Apply emotion to speech utterance
   */
  applyEmotion(utterance, emotion = null) {
    const emotionToUse = emotion || this.currentEmotion;
    const config = this.emotions[emotionToUse] || this.emotions.calm;

    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    utterance.volume = config.volume;

    return utterance;
  }

  /**
   * Get voice variant based on personality mode
   */
  getVoiceVariant(voices) {
    if (!voices || voices.length === 0) return null;

    switch (this.personalityMode) {
      case 'friendly':
        // Prefer female voices for friendly mode
        return voices.find(v => v.name.toLowerCase().includes('female')) ||
               voices.find(v => v.name.toLowerCase().includes('zira')) ||
               voices[0];

      case 'professional':
        // Prefer male voices for professional mode
        return voices.find(v => v.name.toLowerCase().includes('male')) ||
               voices.find(v => v.name.toLowerCase().includes('david')) ||
               voices[0];

      case 'casual':
        // Use default system voice
        return voices[0];

      default:
        return voices[0];
    }
  }

  /**
   * Set personality mode
   */
  setPersonality(mode) {
    if (['friendly', 'professional', 'casual'].includes(mode)) {
      this.personalityMode = mode;
      localStorage.setItem('voicePersonality', mode);
      return true;
    }
    return false;
  }

  /**
   * Get current personality mode
   */
  getPersonality() {
    return this.personalityMode;
  }

  /**
   * Add personality to response text
   */
  addPersonalityToText(text, emotion = null) {
    const emotionToUse = emotion || this.detectEmotion(text);
    
    // Add personality prefixes/suffixes based on mode
    switch (this.personalityMode) {
      case 'friendly':
        if (emotionToUse === 'happy') {
          return `${text} 😊`;
        } else if (emotionToUse === 'excited') {
          return `${text} 🎉`;
        }
        break;

      case 'professional':
        // Keep text formal and clean
        return text.replace(/!/g, '.');

      case 'casual':
        // Add casual interjections
        if (emotionToUse === 'happy') {
          return `Cool! ${text}`;
        } else if (emotionToUse === 'excited') {
          return `Awesome! ${text}`;
        }
        break;
    }

    return text;
  }

  /**
   * Create speech utterance with emotion and personality
   */
  createUtterance(text, options = {}) {
    const {
      emotion = null,
      lang = 'en-US',
      onEnd = null,
      onError = null
    } = options;

    // Detect emotion if not provided
    const detectedEmotion = emotion || this.detectEmotion(text);

    // Add personality to text
    const personalizedText = this.addPersonalityToText(text, detectedEmotion);

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(personalizedText);
    utterance.lang = lang;

    // Apply emotion
    this.applyEmotion(utterance, detectedEmotion);

    // Get appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const voice = this.getVoiceVariant(voices);
    if (voice) {
      utterance.voice = voice;
    }

    // Set callbacks
    if (onEnd) utterance.onend = onEnd;
    if (onError) utterance.onerror = onError;

    console.info('[VOICE-PERSONALITY]', {
      emotion: detectedEmotion,
      personality: this.personalityMode,
      voice: voice?.name,
      pitch: utterance.pitch,
      rate: utterance.rate
    });

    return utterance;
  }

  /**
   * Get emotion description
   */
  getEmotionDescription(emotion = null) {
    const emotionToUse = emotion || this.currentEmotion;
    const descriptions = {
      happy: 'Cheerful and upbeat',
      sad: 'Sympathetic and gentle',
      excited: 'Energetic and enthusiastic',
      calm: 'Steady and composed',
      curious: 'Inquisitive and engaged'
    };
    return descriptions[emotionToUse] || 'Neutral';
  }

  /**
   * Get all available emotions
   */
  getEmotions() {
    return Object.keys(this.emotions);
  }

  /**
   * Get all personality modes
   */
  getPersonalityModes() {
    return [
      { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
      { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
      { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' }
    ];
  }
}

// Export singleton instance
const voicePersonality = new VoicePersonality();
export default voicePersonality;
