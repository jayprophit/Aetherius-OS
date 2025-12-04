
import React, { useState, useEffect } from 'react';
import { 
    SunIcon, CloudIcon, BoltIcon, CpuChipIcon, CircleStackIcon, 
    CalendarIcon, MapPinIcon 
} from './Icons';

export const WeatherWidget: React.FC<{ city?: string }> = ({ city = 'San Francisco' }) => {
    // Simulate weather based on city name just for visual variety
    // In a real app, this would query an API
    const [weather, setWeather] = useState({ temp: 72, condition: 'Sunny', icon: SunIcon });

    useEffect(() => {
        const lowerCity = city.toLowerCase();
        if (lowerCity.includes('london') || lowerCity.includes('uk') || lowerCity.includes('manchester')) {
            setWeather({ temp: 58, condition: 'Rainy', icon: CloudIcon });
        } else if (lowerCity.includes('new york') || lowerCity.includes('ny')) {
             setWeather({ temp: 65, condition: 'Partly Cloudy', icon: CloudIcon });
        } else if (lowerCity.includes('tokyo')) {
             setWeather({ temp: 70, condition: 'Clear', icon: SunIcon });
        } else {
             setWeather({ temp: 72, condition: 'Sunny', icon: SunIcon });
        }
    }, [city]);

    return (
        <div className={`w-full h-full bg-gradient-to-br ${weather.condition === 'Rainy' ? 'from-gray-600 to-gray-800' : 'from-blue-400 to-blue-600'} rounded-2xl p-4 text-white shadow-lg flex flex-col justify-between backdrop-blur-md bg-opacity-90`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-1"><MapPinIcon className="w-4 h-4"/> {city}</h3>
                    <p className="text-xs opacity-80">{weather.condition}</p>
                </div>
                <weather.icon className={`w-10 h-10 ${weather.condition === 'Sunny' ? 'text-yellow-300' : 'text-gray-300'}`} />
            </div>
            <div>
                <h2 className="text-4xl font-bold">{weather.temp}°</h2>
                <div className="flex justify-between text-xs mt-2 opacity-90">
                    <span>H: {weather.temp + 5}° L: {weather.temp - 5}°</span>
                    <span>AQI: 32 (Good)</span>
                </div>
            </div>
        </div>
    );
};

export const SystemWidget: React.FC = () => {
    const [cpu, setCpu] = useState(12);
    const [ram, setRam] = useState(45);

    useEffect(() => {
        const interval = setInterval(() => {
            setCpu(c => Math.min(100, Math.max(5, c + (Math.random() - 0.5) * 10)));
            setRam(r => Math.min(100, Math.max(20, r + (Math.random() - 0.5) * 5)));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 text-white shadow-lg flex flex-col justify-center gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                    <CpuChipIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-gray-400">CPU LOAD</span>
                        <span>{cpu.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${cpu}%` }}></div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                    <CircleStackIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-gray-400">MEMORY</span>
                        <span>{ram.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${ram}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CalendarWidget: React.FC = () => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="w-full h-full bg-white dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center text-center">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{time}</h2>
            <p className="text-sm text-red-500 font-semibold uppercase tracking-wide">{date}</p>
            
            <div className="mt-4 flex gap-2">
                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <div className="w-1 h-1 rounded-full bg-blue-500"></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">No events today</p>
        </div>
    );
};