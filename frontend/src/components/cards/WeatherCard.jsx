import React from 'react';
import { FiWind, FiDroplet, FiThermometer } from 'react-icons/fi';

const WeatherCard = ({ data }) => {
    if (!data) return null;

    const {
        city,
        temperature,
        condition,
        humidity,
        windSpeed,
        icon
    } = data;

    return (
        <div className="weather-card p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 backdrop-blur-md my-2 max-w-sm">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-white">{city}</h3>
                    <p className="text-gray-300 capitalize">{condition}</p>
                </div>
                {icon && (
                    <img
                        src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
                        alt={condition}
                        className="w-16 h-16 -mt-2"
                    />
                )}
            </div>

            <div className="mt-4 flex items-center">
                <span className="text-4xl font-bold text-white">{Math.round(temperature)}°</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <FiDroplet className="text-blue-400" />
                    <span>{humidity}% Humidity</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <FiWind className="text-gray-400" />
                    <span>{windSpeed} m/s Wind</span>
                </div>
            </div>
        </div>
    );
};

export default WeatherCard;
