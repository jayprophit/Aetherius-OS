import React, { useState } from 'react';

const wallpapers = [
    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=400',
    'https://images.unsplash.com/photo-1504221507732-5246c0db5393?q=80&w=400',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=400',
    'https://images.unsplash.com/photo-1502602898657-3e91760c0341?q=80&w=400',
    'https://images.unsplash.com/photo-1507525428034-b723a9ce6890?q=80&w=400',
    'https://images.unsplash.com/photo-1533109721025-d1ae7ee7c1e1?q=80&w=400',
];

export const WallpaperSettings: React.FC<{ title: string }> = ({ title }) => {
    const [selected, setSelected] = useState(wallpapers[0]);
    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1">{title}</h1>

             <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Current Wallpaper</h2>
                <img src={selected} alt="Current wallpaper" className="w-full h-48 object-cover rounded-md" />
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Choose a new wallpaper</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {wallpapers.map(wp => (
                        <button key={wp} onClick={() => setSelected(wp)} className={`rounded-md overflow-hidden border-2 transition-all ${selected === wp ? 'border-blue-500 ring-2 ring-blue-500' : 'border-transparent hover:border-blue-400'}`}>
                            <img src={wp} alt="Wallpaper option" className="w-full h-24 object-cover" />
                        </button>
                    ))}
                </div>
             </div>
        </div>
    );
};