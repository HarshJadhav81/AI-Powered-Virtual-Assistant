/**
 * Translation Service - Google Cloud Translation API
 * Handles text translation and language detection
 * API Docs: https://cloud.google.com/translate/docs
 */

import axios from 'axios';

class TranslateService {
  constructor() {
    this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || '';
    this.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
  }

  /**
   * Check if Translation API is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Translate text
   */
  async translate(text, targetLang, sourceLang = null) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Google Translate API is not configured. Please add GOOGLE_TRANSLATE_API_KEY to .env file',
          configRequired: true,
          fallback: true,
          fallbackUrl: `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(text)}`
        };
      }

      const params = {
        q: text,
        target: targetLang,
        key: this.apiKey,
        format: 'text'
      };

      if (sourceLang) {
        params.source = sourceLang;
      }

      const response = await axios.post(this.baseUrl, null, { params });

      const translation = response.data.data.translations[0];

      return {
        success: true,
        originalText: text,
        translatedText: translation.translatedText,
        sourceLang: translation.detectedSourceLanguage || sourceLang || 'auto',
        targetLang: targetLang,
        voiceResponse: `Translation: ${translation.translatedText}`
      };
    } catch (error) {
      console.error('[TRANSLATE-ERROR]:', error.response?.data || error.message);
      
      // Check if API key is invalid
      if (error.response?.status === 400 || error.response?.status === 403) {
        return {
          success: false,
          message: 'Google Translate API key is invalid or quota exceeded',
          error: error.response?.data?.error?.message || error.message,
          configRequired: true,
          fallback: true,
          fallbackUrl: `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(text)}`
        };
      }

      return {
        success: false,
        message: 'Failed to translate text',
        error: error.response?.data?.error?.message || error.message,
        fallback: true,
        fallbackUrl: `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(text)}`
      };
    }
  }

  /**
   * Detect language of text
   */
  async detectLanguage(text) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Google Translate API not configured',
          configRequired: true
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/detect`,
        null,
        {
          params: {
            q: text,
            key: this.apiKey
          }
        }
      );

      const detection = response.data.data.detections[0][0];

      return {
        success: true,
        text: text,
        language: detection.language,
        confidence: detection.confidence,
        languageName: this.getLanguageName(detection.language),
        voiceResponse: `Detected language: ${this.getLanguageName(detection.language)}`
      };
    } catch (error) {
      console.error('[DETECT-LANGUAGE-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to detect language',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(targetLang = 'en') {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Google Translate API not configured',
          configRequired: true,
          fallback: true,
          languages: this.getCommonLanguages()
        };
      }

      const response = await axios.get(
        `${this.baseUrl}/languages`,
        {
          params: {
            key: this.apiKey,
            target: targetLang
          }
        }
      );

      const languages = response.data.data.languages.map(lang => ({
        code: lang.language,
        name: lang.name
      }));

      return {
        success: true,
        languages,
        count: languages.length
      };
    } catch (error) {
      console.error('[SUPPORTED-LANGUAGES-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to get supported languages',
        error: error.response?.data?.error?.message || error.message,
        fallback: true,
        languages: this.getCommonLanguages()
      };
    }
  }

  /**
   * Translate batch of texts
   */
  async translateBatch(texts, targetLang, sourceLang = null) {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Google Translate API not configured',
          configRequired: true
        };
      }

      const params = {
        q: texts,
        target: targetLang,
        key: this.apiKey,
        format: 'text'
      };

      if (sourceLang) {
        params.source = sourceLang;
      }

      const response = await axios.post(this.baseUrl, null, { params });

      const translations = response.data.data.translations.map((trans, index) => ({
        originalText: texts[index],
        translatedText: trans.translatedText,
        detectedSourceLanguage: trans.detectedSourceLanguage
      }));

      return {
        success: true,
        translations,
        count: translations.length,
        targetLang: targetLang
      };
    } catch (error) {
      console.error('[TRANSLATE-BATCH-ERROR]:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to translate batch',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Get language name from code
   */
  getLanguageName(code) {
    const languages = {
      'af': 'Afrikaans',
      'sq': 'Albanian',
      'ar': 'Arabic',
      'hy': 'Armenian',
      'az': 'Azerbaijani',
      'eu': 'Basque',
      'be': 'Belarusian',
      'bn': 'Bengali',
      'bs': 'Bosnian',
      'bg': 'Bulgarian',
      'ca': 'Catalan',
      'ceb': 'Cebuano',
      'ny': 'Chichewa',
      'zh': 'Chinese (Simplified)',
      'zh-CN': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
      'co': 'Corsican',
      'hr': 'Croatian',
      'cs': 'Czech',
      'da': 'Danish',
      'nl': 'Dutch',
      'en': 'English',
      'eo': 'Esperanto',
      'et': 'Estonian',
      'tl': 'Filipino',
      'fi': 'Finnish',
      'fr': 'French',
      'fy': 'Frisian',
      'gl': 'Galician',
      'ka': 'Georgian',
      'de': 'German',
      'el': 'Greek',
      'gu': 'Gujarati',
      'ht': 'Haitian Creole',
      'ha': 'Hausa',
      'haw': 'Hawaiian',
      'iw': 'Hebrew',
      'he': 'Hebrew',
      'hi': 'Hindi',
      'hmn': 'Hmong',
      'hu': 'Hungarian',
      'is': 'Icelandic',
      'ig': 'Igbo',
      'id': 'Indonesian',
      'ga': 'Irish',
      'it': 'Italian',
      'ja': 'Japanese',
      'jw': 'Javanese',
      'kn': 'Kannada',
      'kk': 'Kazakh',
      'km': 'Khmer',
      'ko': 'Korean',
      'ku': 'Kurdish (Kurmanji)',
      'ky': 'Kyrgyz',
      'lo': 'Lao',
      'la': 'Latin',
      'lv': 'Latvian',
      'lt': 'Lithuanian',
      'lb': 'Luxembourgish',
      'mk': 'Macedonian',
      'mg': 'Malagasy',
      'ms': 'Malay',
      'ml': 'Malayalam',
      'mt': 'Maltese',
      'mi': 'Maori',
      'mr': 'Marathi',
      'mn': 'Mongolian',
      'my': 'Myanmar (Burmese)',
      'ne': 'Nepali',
      'no': 'Norwegian',
      'or': 'Odia',
      'ps': 'Pashto',
      'fa': 'Persian',
      'pl': 'Polish',
      'pt': 'Portuguese',
      'pa': 'Punjabi',
      'ro': 'Romanian',
      'ru': 'Russian',
      'sm': 'Samoan',
      'gd': 'Scots Gaelic',
      'sr': 'Serbian',
      'st': 'Sesotho',
      'sn': 'Shona',
      'sd': 'Sindhi',
      'si': 'Sinhala',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'so': 'Somali',
      'es': 'Spanish',
      'su': 'Sundanese',
      'sw': 'Swahili',
      'sv': 'Swedish',
      'tg': 'Tajik',
      'ta': 'Tamil',
      'te': 'Telugu',
      'th': 'Thai',
      'tr': 'Turkish',
      'uk': 'Ukrainian',
      'ur': 'Urdu',
      'ug': 'Uyghur',
      'uz': 'Uzbek',
      'vi': 'Vietnamese',
      'cy': 'Welsh',
      'xh': 'Xhosa',
      'yi': 'Yiddish',
      'yo': 'Yoruba',
      'zu': 'Zulu'
    };

    return languages[code] || code.toUpperCase();
  }

  /**
   * Get common languages (fallback when API not configured)
   */
  getCommonLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese (Simplified)' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'bn', name: 'Bengali' },
      { code: 'pa', name: 'Punjabi' },
      { code: 'te', name: 'Telugu' },
      { code: 'mr', name: 'Marathi' },
      { code: 'ta', name: 'Tamil' },
      { code: 'tr', name: 'Turkish' },
      { code: 'vi', name: 'Vietnamese' },
      { code: 'th', name: 'Thai' }
    ];
  }

  /**
   * Get fallback URL for Google Translate web
   */
  getFallbackUrl(text = '', targetLang = 'en') {
    if (text) {
      return {
        success: true,
        url: `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(text)}`,
        message: 'Opening Google Translate'
      };
    }
    return {
      success: true,
      url: 'https://translate.google.com',
      message: 'Opening Google Translate'
    };
  }
}

// Export singleton instance
const translateService = new TranslateService();
export default translateService;
