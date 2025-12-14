/**
 * Weather Service - OpenWeatherMap Integration
 * [COPILOT-UPGRADE]: Free weather API integration for current weather and forecasts
 * API Docs: https://openweathermap.org/api
 */

import axios from 'axios';

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.geocodeUrl = 'https://api.openweathermap.org/geo/1.0';
  }

  /**
   * Get current weather by city name
   */
  async getCurrentWeather(city, units = 'metric') {
    try {
      console.info('[WEATHER-SERVICE]', `Fetching weather for: ${city}`);
      
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: units // metric (°C), imperial (°F), standard (K)
        }
      });

      return this.formatCurrentWeather(response.data);
    } catch (error) {
      console.error('[WEATHER-ERROR]:', error.response?.data || error.message);
      throw new Error(`Unable to fetch weather for ${city}`);
    }
  }

  /**
   * Get current weather by coordinates
   */
  async getWeatherByCoords(lat, lon, units = 'metric') {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: units
        }
      });

      return this.formatCurrentWeather(response.data);
    } catch (error) {
      console.error('[WEATHER-ERROR]:', error.response?.data || error.message);
      throw new Error('Unable to fetch weather for your location');
    }
  }

  /**
   * Get 5-day forecast
   */
  async getForecast(city, units = 'metric') {
    try {
      console.info('[WEATHER-SERVICE]', `Fetching forecast for: ${city}`);
      
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: units
        }
      });

      return this.formatForecast(response.data);
    } catch (error) {
      console.error('[FORECAST-ERROR]:', error.response?.data || error.message);
      throw new Error(`Unable to fetch forecast for ${city}`);
    }
  }

  /**
   * Get coordinates for a city
   */
  async getCityCoordinates(city) {
    try {
      const response = await axios.get(`${this.geocodeUrl}/direct`, {
        params: {
          q: city,
          limit: 1,
          appid: this.apiKey
        }
      });

      if (response.data.length === 0) {
        throw new Error('City not found');
      }

      return {
        lat: response.data[0].lat,
        lon: response.data[0].lon,
        name: response.data[0].name,
        country: response.data[0].country
      };
    } catch (error) {
      console.error('[GEOCODE-ERROR]:', error.message);
      throw error;
    }
  }

  /**
   * Format current weather response
   */
  formatCurrentWeather(data) {
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const city = data.name;
    const country = data.sys.country;

    // Create voice-friendly response
    const voiceResponse = `The current weather in ${city} is ${temp} degrees with ${description}. ` +
      `It feels like ${feelsLike} degrees. Humidity is ${humidity} percent.`;

    return {
      city,
      country,
      temperature: temp,
      feelsLike,
      description,
      icon: `https://openweathermap.org/img/wn/${icon}@2x.png`,
      humidity,
      windSpeed,
      pressure: data.main.pressure,
      visibility: data.visibility,
      sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
      sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
      voiceResponse
    };
  }

  /**
   * Format forecast response
   */
  formatForecast(data) {
    const dailyForecasts = [];
    const processedDates = new Set();

    // Group by day (take midday forecast for each day)
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toDateString();
      
      if (!processedDates.has(dateStr) && date.getHours() >= 12) {
        processedDates.add(dateStr);
        dailyForecasts.push({
          date: dateStr,
          temperature: Math.round(item.main.temp),
          description: item.weather[0].description,
          icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed
        });
      }
    });

    // Voice response for 3-day forecast
    let voiceResponse = `Here's the forecast for ${data.city.name}: `;
    dailyForecasts.slice(0, 3).forEach((day, index) => {
      const dayName = index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
      voiceResponse += `${dayName}: ${day.temperature} degrees with ${day.description}. `;
    });

    return {
      city: data.city.name,
      country: data.city.country,
      dailyForecasts: dailyForecasts.slice(0, 5), // 5-day forecast
      voiceResponse
    };
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey && this.apiKey !== '';
  }
}

// Export singleton instance
const weatherService = new WeatherService();
export default weatherService;
