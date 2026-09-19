
import React, { useState } from 'react';
import { socialStreams } from '../../data';
import { SocialStream } from '../../types';
import { PlayIcon, HeartIcon, ChatBubbleOvalLeftEllipsisIcon, ShareIcon, UsersIcon, PlusIcon } from '../Icons';

const StreamCard: React.FC<{ stream: SocialStream }> = ({ stream }) => (
    <div className="bg-gray-900 rounded-xl overflow-hidden relative group aspect-video cursor-pointer hover:ring-2 ring-purple-500 transition-all">
        <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        
        {/* Overlay Data */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase">Live</div>
                <div className="bg-black/60 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    <UsersIcon className="w-3 h-3" /> {stream.viewers.toLocaleString()}
                </div>
            </div>
            
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <img src={stream.broadcaster.avatarUrl!} alt={stream.broadcaster.name} className="w-6 h-6 rounded-full border border-white" />
                    <span className="text-white text-sm font-bold">{stream.broadcaster.name}</span>
                </div>
                <h3 className="text-white font-semibold text-base leading-tight mb-2">{stream.title}</h3>
                <div className="flex gap-1">
                    <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{stream.category}</span>
                    {stream.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                </div>
            </div>
        </div>
        
        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm">
                 <PlayIcon className="w-8 h-8 text-white" />
             </div>
        </div>
    </div>
);

const ShortVideoCard: React.FC = () => (
    <div className="snap-center shrink-0 w-[280px] h-[500px] bg-gray-800 rounded-2xl relative overflow-hidden border border-gray-700">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
        <div className="absolute bottom-4 right-2 flex flex-col gap-4 items-center z-10">
             <div className="flex flex-col items-center">
                 <div className="w-10 h-10 bg-gray-200 rounded-full border-2 border-white mb-1 relative">
                     <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5"><PlusIcon className="w-2 h-2 text-white"/></div>
                 </div>
             </div>
             <div className="flex flex-col items-center text-white">
                 <div className="bg-gray-700/50 p-2 rounded-full mb-1 hover:bg-gray-600 cursor-pointer"><HeartIcon className="w-6 h-6"/></div>
                 <span className="text-xs font-bold">12K</span>
             </div>
             <div className="flex flex-col items-center text-white">
                 <div className="bg-gray-700/50 p-2 rounded-full mb-1 hover:bg-gray-600 cursor-pointer"><ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6"/></div>
                 <span className="text-xs font-bold">402</span>
             </div>
             <div className="flex flex-col items-center text-white">
                 <div className="bg-gray-700/50 p-2 rounded-full mb-1 hover:bg-gray-600 cursor-pointer"><ShareIcon className="w-6 h-6"/></div>
                 <span className="text-xs font-bold">Share</span>
             </div>
        </div>
        <div className="absolute bottom-4 left-4 text-white max-w-[200px]">
            <h4 className="font-bold text-sm shadow-black drop-shadow-md">@creator_name</h4>
            <p className="text-xs leading-snug mt-1 opacity-90">Check out this amazing new AI feature in Aetherius OS! #tech #ai #future</p>
        </div>
    </div>
);

export const WatchView: React.FC = () => {
    return (
        <div className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Watch & Stream</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Live broadcasts, clips, and shorts from the community.</p>
            </header>

            {/* Live Streams */}
            <section className="mb-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Live Now
                    </h2>
                    <button className="text-sm text-blue-500 hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {socialStreams.map(stream => (
                        <StreamCard key={stream.id} stream={stream} />
                    ))}
                     {/* Placeholder streams */}
                    {[1,2].map(i => (
                        <div key={i} className="bg-gray-800 rounded-xl aspect-video animate-pulse opacity-50"></div>
                    ))}
                </div>
            </section>

            {/* Shorts / Reels */}
            <section>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Shorts & Reels</h2>
                <div className="flex gap-4 overflow-x-auto pb-6 snap-x scrollbar-thin scrollbar-thumb-gray-700">
                    {[1,2,3,4,5].map(i => (
                        <ShortVideoCard key={i} />
                    ))}
                </div>
            </section>
        </div>
    );
};
