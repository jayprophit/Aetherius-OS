
import React, { useState, useRef, useEffect } from 'react';
import { 
    PlayIcon, PauseIcon, StopIcon, SpeakerWaveIcon, 
    ArrowPathIcon, MusicNoteIcon, FilmIcon, 
    ChevronRightIcon, ChevronLeftIcon 
} from './Icons';

type MediaType = 'audio' | 'video';

interface MediaItem {
    id: string;
    title: string;
    artist?: string;
    type: MediaType;
    url: string; // In a real app, these would be real URLs
    cover?: string;
    duration: string;
}

const playlist: MediaItem[] = [
    { id: '1', title: 'Quantum Field', artist: 'Aetherius Sound Team', type: 'audio', url: '#', duration: '3:45', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80' },
    { id: '2', title: 'System Boot Sequence', artist: 'OS Core', type: 'audio', url: '#', duration: '1:20', cover: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300&q=80' },
    { id: '3', title: 'Neon City Walk', artist: 'Cyber Vibes', type: 'audio', url: '#', duration: '4:12', cover: 'https://images.unsplash.com/photo-1580428180098-24b353d7e9d9?w=300&q=80' },
    { id: '4', title: 'Genesis Launch Event', type: 'video', url: '#', duration: '12:30', cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80' },
    { id: '5', title: 'Tutorial: Virtual Rig', type: 'video', url: '#', duration: '5:45', cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80' },
];

export const MediaPlayer: React.FC = () => {
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(80);
    
    const currentTrack = playlist[currentTrackIndex];

    // Simulate playback progress
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress(p => (p >= 100 ? 0 : p + 0.5));
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const handleNext = () => {
        setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
        setProgress(0);
    };

    const handlePrev = () => {
        setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
        setProgress(0);
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex h-full bg-gray-900 text-white font-sans overflow-hidden">
            {/* Sidebar Playlist */}
            <aside className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                    <h2 className="font-bold text-lg flex items-center gap-2 text-blue-400">
                        <MusicNoteIcon className="w-5 h-5"/> Media Library
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {playlist.map((item, idx) => (
                        <div 
                            key={item.id}
                            onClick={() => { setCurrentTrackIndex(idx); setProgress(0); setIsPlaying(true); }}
                            className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-700 transition-colors ${currentTrackIndex === idx ? 'bg-gray-700/80 border-l-4 border-blue-500' : ''}`}
                        >
                            <div className="w-10 h-10 bg-black rounded overflow-hidden flex-shrink-0 relative">
                                <img src={item.cover} alt="Cover" className="w-full h-full object-cover opacity-80" />
                                {item.type === 'video' && <div className="absolute inset-0 flex items-center justify-center"><FilmIcon className="w-4 h-4 text-white drop-shadow"/></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${currentTrackIndex === idx ? 'text-blue-300' : 'text-gray-200'}`}>{item.title}</p>
                                <p className="text-xs text-gray-400 truncate">{item.artist || item.type.toUpperCase()}</p>
                            </div>
                            <span className="text-xs text-gray-500">{item.duration}</span>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Player Area */}
            <main className="flex-1 flex flex-col">
                {/* Content Visualizer */}
                <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden group">
                    {/* Background Blur */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-125 transition-all duration-1000"
                        style={{ backgroundImage: `url(${currentTrack.cover})` }}
                    ></div>
                    
                    {currentTrack.type === 'video' ? (
                        <div className="relative w-full h-full max-w-3xl max-h-[80%] bg-black border border-gray-800 shadow-2xl flex items-center justify-center">
                             <img src={currentTrack.cover} className="w-full h-full object-contain opacity-80" />
                             <div className="absolute inset-0 flex items-center justify-center">
                                <PlayIcon className={`w-20 h-20 text-white/80 drop-shadow-lg ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-opacity`} />
                             </div>
                             <div className="absolute bottom-4 left-4 bg-black/60 px-2 py-1 rounded text-xs font-bold">HD 4K</div>
                        </div>
                    ) : (
                        <div className="relative z-10 flex flex-col items-center">
                            <div className={`w-64 h-64 rounded-lg shadow-2xl border-4 border-gray-800 overflow-hidden mb-8 relative ${isPlaying ? 'scale-105' : 'scale-100'} transition-transform duration-700`}>
                                <img src={currentTrack.cover} className="w-full h-full object-cover" />
                                <div className={`absolute inset-0 bg-black/20 ${isPlaying ? 'animate-pulse' : ''}`}></div>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">{currentTrack.title}</h1>
                            <p className="text-xl text-gray-300">{currentTrack.artist}</p>
                        </div>
                    )}
                </div>

                {/* Controls Bar */}
                <div className="h-24 bg-gray-800 border-t border-gray-700 p-4 flex flex-col justify-center gap-2 relative z-20">
                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden cursor-pointer group">
                        <div 
                            className="bg-blue-500 h-full rounded-full relative" 
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100"></div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-1">
                        <div className="w-1/3 flex items-center gap-4">
                            <img src={currentTrack.cover} className="w-10 h-10 rounded bg-gray-900 object-cover" />
                            <div className="hidden sm:block">
                                <div className="font-bold text-sm truncate">{currentTrack.title}</div>
                                <div className="text-xs text-gray-400 truncate">{currentTrack.artist || 'Video'}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-6">
                            <button className="text-gray-400 hover:text-white"><ArrowPathIcon className="w-4 h-4"/></button>
                            <button onClick={handlePrev} className="text-white hover:text-blue-400"><ChevronLeftIcon className="w-6 h-6"/></button>
                            <button 
                                onClick={togglePlay}
                                className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                            >
                                {isPlaying ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5 ml-0.5"/>}
                            </button>
                            <button onClick={handleNext} className="text-white hover:text-blue-400"><ChevronRightIcon className="w-6 h-6"/></button>
                            <button className="text-gray-400 hover:text-white"><ArrowPathIcon className="w-4 h-4 transform -scale-x-100"/></button>
                        </div>

                        <div className="w-1/3 flex items-center justify-end gap-3">
                            <SpeakerWaveIcon className="w-5 h-5 text-gray-400"/>
                            <input 
                                type="range" 
                                min="0" max="100" 
                                value={volume}
                                onChange={(e) => setVolume(parseInt(e.target.value))}
                                className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
