import React, { useState } from 'react';
import { PhotoIcon, PlusIcon } from '../Icons';

const wallpapers = [
    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=400',
    'https://images.unsplash.com/photo-1504221507732-5246c0db5393?q=80&w=400',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=400',
    'https://images.unsplash.com/photo-1502602898657-3e91760c0341?q=80&w=400',
    'https://images.unsplash.com/photo-1507525428034-b723a9ce6890?q=80&w=400',
    'https://images.unsplash.com/photo-1533109721025-d1ae7ee7c1e1?q=80&w=400',
];

interface WallpaperSettingsProps {
    title: string;
    setWallpaper?: (url: string) => void;
}

export const WallpaperSettings: React.FC<WallpaperSettingsProps> = ({ title, setWallpaper }) => {
    const [selected, setSelected] = useState(localStorage.getItem('aetherius_wallpaper') || wallpapers[0]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleSelect = (url: string) => {
        setSelected(url);
        // Convert thumbnail URL to high-res for actual desktop if needed, 
        // but here we assume they are same source or handled by URL params
        const highResUrl = url.replace('&w=400', '&w=2070');
        if (setWallpaper) setWallpaper(highResUrl);
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setSelected(result);
                if (setWallpaper) setWallpaper(result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1">{title}</h1>

             <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Current Wallpaper</h2>
                <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-md">
                     <img src={selected} alt="Current wallpaper" className="w-full h-full object-cover" />
                </div>
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Choose a new wallpaper</h2>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded-md transition-colors"
                    >
                        <PlusIcon className="w-4 h-4"/> Custom Image
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleUpload}
                    />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {wallpapers.map(wp => (
                        <button 
                            key={wp} 
                            onClick={() => handleSelect(wp)} 
                            className={`aspect-video rounded-md overflow-hidden border-2 transition-all hover:scale-105 ${selected.includes(wp.split('?')[0]) ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : 'border-transparent hover:border-blue-400'}`}
                        >
                            <img src={wp} alt="Wallpaper option" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
             </div>
        </div>
    );
};