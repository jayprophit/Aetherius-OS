
import React, { useState, useEffect } from 'react';
import {
    SunIcon, CloudIcon, MapPinIcon, CpuChipIcon, CircleStackIcon, CalendarIcon
} from './Icons';

interface WeatherState {
    temp: number;
    condition: string;
    icon: React.FC<any>;
    high: number;
    low: number;
    city: string;
}

/** Open-Meteo weather codes → label + icon. */
function describeCode(code: number): { text: string; icon: React.FC<any> } {
    if (code === 0) return { text: 'Clear sky', icon: SunIcon };
    if (code <= 2) return { text: 'Partly cloudy', icon: CloudIcon };
    if (code === 3) return { text: 'Overcast', icon: CloudIcon };
    if (code <= 48) return { text: 'Foggy', icon: CloudIcon };
    if (code <= 57) return { text: 'Drizzle', icon: CloudIcon };
    if (code <= 67) return { text: 'Rain', icon: CloudIcon };
    if (code <= 77) return { text: 'Snow', icon: CloudIcon };
    if (code <= 82) return { text: 'Rain showers', icon: CloudIcon };
    if (code <= 99) return { text: 'Thunderstorm', icon: CloudIcon };
    return { text: 'Unknown', icon: CloudIcon };
}

export const WeatherWidget: React.FC<{ city?: string }> = ({ city }) => {
    const [weather, setWeather] = useState<WeatherState | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                // 1. Geocode the city (free Open-Meteo geocoding, no key).
                const geo = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city || 'London')}&count=1&language=en&format=json`,
                );
                if (!geo.ok) throw new Error('geocode failed');
                const geoJson = await geo.json();
                const place = geoJson?.results?.[0];
                if (!place) throw new Error('unknown city');

                // 2. Current weather + today high/low (free forecast API, no key).
                const met = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`,
                );
                if (!met.ok) throw new Error('forecast failed');
                const metJson = await met.json();
                const current = metJson.current_weather;
                const described = describeCode(current.weathercode);
                if (!cancelled) {
                    setWeather({
                        temp: Math.round(current.temperature),
                        condition: described.text,
                        icon: described.icon,
                        high: Math.round(metJson.daily.temperature_2m_max[0]),
                        low: Math.round(metJson.daily.temperature_2m_min[0]),
                        city: `${place.name}, ${place.country_code || ''}`.replace(/, $/, ''),
                    });
                    setError(false);
                }
            } catch {
                if (!cancelled) {
                    setWeather(null);
                    setError(true);
                }
            }
        };
        load();
        return () => { cancelled = true; };
    }, [city]);

    if (error) {
        return (
            <div className="w-full h-full bg-gray-700/80 rounded-2xl p-4 text-white shadow-lg flex flex-col justify-center backdrop-blur-md">
                <h3 className="text-lg font-bold">Weather unavailable</h3>
                <p className="text-xs opacity-80 mt-1">
                    {city ? `Could not fetch weather for ${city}.` : 'No location configured. Set your city in Settings.'}
                </p>
            </div>
        );
    }

    if (!weather) {
        return (
            <div className="w-full h-full bg-gray-700/80 rounded-2xl p-4 text-white shadow-lg flex flex-col justify-center backdrop-blur-md">
                <h3 className="text-lg font-bold">Loading weather…</h3>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 text-white shadow-lg flex flex-col justify-between backdrop-blur-md bg-opacity-90">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> {weather.city}</h3>
                    <p className="text-xs opacity-80">{weather.condition}</p>
                </div>
                <weather.icon className="w-10 h-10 text-yellow-200" />
            </div>
            <div>
                <h2 className="text-4xl font-bold">{weather.temp}°</h2>
                <div className="flex justify-between text-xs mt-2 opacity-90">
                    <span>H: {weather.high}° L: {weather.low}°</span>
                    <span>Open-Meteo</span>
                </div>
            </div>
        </div>
    );
};

interface SystemStats {
    cpuCores: number;
    jsHeapMb: number | null;
    jsHeapMaxMb: number | null;
    online: boolean;
}

/**
 * Honest system stats from real browser APIs: logical core count, JS heap
 * usage (Chromium only), and network status. Browsers do not expose CPU
 * load or total RAM, so no percentages are invented.
 */
export const SystemWidget: React.FC = () => {
    const [stats, setStats] = useState<SystemStats | null>(null);

    useEffect(() => {
        const read = () => {
            const perf = performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } };
            setStats({
                cpuCores: navigator.hardwareConcurrency ?? 0,
                jsHeapMb: perf.memory ? Math.round((perf.memory.usedJSHeapSize / 1048576) * 10) / 10 : null,
                jsHeapMaxMb: perf.memory ? Math.round((perf.memory.jsHeapSizeLimit / 1048576) * 10) / 10 : null,
                online: navigator.onLine,
            });
        };
        read();
        const interval = setInterval(read, 3000);
        window.addEventListener('online', read);
        window.addEventListener('offline', read);
        return () => {
            clearInterval(interval);
            window.removeEventListener('online', read);
            window.removeEventListener('offline', read);
        };
    }, []);

    return (
        <div className="w-full h-full bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 text-white shadow-lg flex flex-col justify-center gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                    <CpuChipIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-gray-400">CPU CORES</span>
                    </div>
                    <div className="text-2xl font-bold">{stats?.cpuCores || '—'}</div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                    <CircleStackIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-gray-400">JS HEAP</span>
                    </div>
                    <div className="text-lg font-bold">
                        {stats?.jsHeapMb === null || stats?.jsHeapMb === undefined
                            ? 'Unknown'
                            : `${stats.jsHeapMb} / ${stats.jsHeapMaxMb} MB`}
                    </div>
                    {stats?.jsHeapMb != null && stats?.jsHeapMaxMb != null && (
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${Math.min(100, (stats.jsHeapMb / stats.jsHeapMaxMb) * 100)}%` }}></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="text-xs text-gray-500">
                Network: {stats?.online === undefined ? '…' : stats.online ? 'Online' : 'Offline'} · real browser APIs only
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
