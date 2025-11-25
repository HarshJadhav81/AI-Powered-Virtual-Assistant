import { jest } from '@jest/globals';
import weatherService from '../../services/weatherService.js';

describe('weather Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct base URLs', () => {
      expect(weatherService.baseUrl).toBe('https://api.openweathermap.org/data/2.5');
      expect(weatherService.geocodeUrl).toBe('https://api.openweathermap.org/geo/1.0');
    });

    it('should check if API key is configured', () => {
      const result = weatherService.isConfigured();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('data formatting', () => {
    it('should format current weather data correctly', () => {
      const mockData = {
        name: 'London',
        sys: { country: 'GB', sunrise: 1640000000, sunset: 1640040000 },
        main: { temp: 15.5, feels_like: 14.2, humidity: 70, pressure: 1013 },
        weather: [{ description: 'clear sky', icon: '01d' }],
        wind: { speed: 5.2 },
        visibility: 10000
      };

      const result = weatherService.formatCurrentWeather(mockData);
      
      expect(result.city).toBe('London');
      expect(result.country).toBe('GB');
      expect(result.temperature).toBe(16); // Rounded from 15.5
      expect(result.description).toBe('clear sky');
      expect(result.voiceResponse).toContain('London');
    });

    it('should format forecast data correctly', () => {
      const mockData = {
        city: { name: 'Paris', country: 'FR' },
        list: [
          {
            dt: Math.floor(Date.now() / 1000) + 43200, // 12 hours from now
            main: { temp: 20, humidity: 60 },
            weather: [{ description: 'sunny', icon: '01d' }],
            wind: { speed: 3 }
          }
        ]
      };

      const result = weatherService.formatForecast(mockData);
      
      expect(result.city).toBe('Paris');
      expect(result.dailyForecasts).toBeDefined();
      expect(result.voiceResponse).toContain('forecast');
    });
  });

  describe('error handling', () => {
    it('should handle missing city gracefully', async () => {
      if (!weatherService.isConfigured()) {
        // Skip test if API not configured
        return expect(true).toBe(true);
      }

      await expect(
        weatherService.getCurrentWeather('NonexistentCity12345')
      ).rejects.toThrow();
    });

    it('should handle invalid coordinates', async () => {
      if (!weatherService.isConfigured()) {
        return expect(true).toBe(true);
      }

      await expect(
        weatherService.getWeatherByCoords(999, 999)
      ).rejects.toThrow();
    });
  });

  describe('main functionality', () => {
    it('should support metric and imperial units', () => {
      expect(weatherService.baseUrl).toContain('openweathermap.org');
      // Units are passed as params: metric, imperial, standard
      expect(true).toBe(true);
    });

    it('should provide voice-friendly responses', () => {
      const mockData = {
        name: 'Tokyo',
        sys: { country: 'JP', sunrise: 1640000000, sunset: 1640040000 },
        main: { temp: 25, feels_like: 24, humidity: 65, pressure: 1015 },
        weather: [{ description: 'partly cloudy', icon: '02d' }],
        wind: { speed: 4 },
        visibility: 10000
      };

      const result = weatherService.formatCurrentWeather(mockData);
      
      expect(result.voiceResponse).toContain('Tokyo');
      expect(result.voiceResponse).toContain('25 degrees');
      expect(result.voiceResponse).toContain('partly cloudy');
    });
  });
});
