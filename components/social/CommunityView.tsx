
import React, { useState } from 'react';
import { SocialCommunity } from '../../types';
import { socialCommunities, loggedInUser } from '../../data';
import { 
    HashtagIcon, SpeakerWaveIcon, BellIcon, UserIcon, 
    Cog6ToothIcon, PlusIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon,
    MicrophoneIcon, GiftIcon, GifIcon, FaceSmileIcon, ChevronDownIcon
} from '../Icons';

const ChannelList: React.FC<{ community: SocialCommunity, activeChannel: string, onSelect: (id: string) => void }> = ({ community, activeChannel, onSelect }) => {
    return (
        <div className="w-60 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-bold text-gray-800 dark:text-white truncate">{community.name}</h2>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {community.channels.map(channel => (
                    <button
                        key={channel.id}
                        onClick={() => onSelect(channel.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                            activeChannel === channel.id 
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        {channel.type === 'text' && <HashtagIcon className="w-4 h-4 text-gray-400" />}
                        {channel.type === 'voice' && <SpeakerWaveIcon className="w-4 h-4 text-gray-400" />}
                        {channel.type === 'announcement' && <BellIcon className="w-4 h-4 text-yellow-500" />}
                        
                        <span className="truncate">{channel.name}</span>
                        
                        {channel.unreadCount && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                                {channel.unreadCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            <div className="p-3 bg-gray-200 dark:bg-gray-900/50 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden">
                    <img src={loggedInUser.avatarUrl || ''} alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{loggedInUser.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">#{loggedInUser.id.slice(0,4)}</p>
                </div>
                <div className="flex gap-1">
                    <button className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded"><MicrophoneIcon className="w-4 h-4" /></button>
                    <button className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded"><Cog6ToothIcon className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
};

const ChatArea: React.FC<{ channelName: string }> = ({ channelName }) => {
    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full">
            <header className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <HashtagIcon className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold text-gray-800 dark:text-white">{channelName}</h3>
                    <span className="text-xs text-gray-500 hidden md:inline">| General discussion for {channelName}</span>
                </div>
                <div className="flex items-center gap-3">
                    <BellIcon className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
                    <UserIcon className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
                    <div className="relative">
                        <input type="text" placeholder="Search" className="bg-gray-100 dark:bg-gray-800 text-xs rounded-md px-2 py-1 w-32 focus:w-48 transition-all outline-none text-gray-700 dark:text-gray-300" />
                        <MagnifyingGlassIcon className="w-3 h-3 absolute right-2 top-1.5 text-gray-400" />
                    </div>
                </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Mock Messages */}
                <div className="flex gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -mx-2 rounded">
                    <div className="w-10 h-10 rounded-full bg-blue-500 shrink-0"></div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-gray-900 dark:text-white cursor-pointer hover:underline">QuantumDev</span>
                            <span className="text-xs text-gray-500">Today at 10:42 AM</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-300 text-sm">Has anyone tried the new Q-Annealer v4.0? The coherence stability is insane.</p>
                    </div>
                </div>
                 <div className="flex gap-3 group hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -mx-2 rounded">
                    <div className="w-10 h-10 rounded-full bg-green-500 shrink-0"></div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-gray-900 dark:text-white cursor-pointer hover:underline">Alice</span>
                            <span className="text-xs text-gray-500">Today at 10:45 AM</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-300 text-sm">Yeah! I managed to run a protein folding sim in under 5 minutes. Unbelievable.</p>
                    </div>
                </div>
            </div>

            <div className="p-4 pt-0">
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg px-4 py-2.5 flex items-center gap-3">
                    <PlusIcon className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 bg-gray-300 dark:bg-gray-600 rounded-full p-0.5" />
                    <input 
                        type="text" 
                        placeholder={`Message #${channelName}`} 
                        className="bg-transparent flex-1 outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500"
                    />
                    <div className="flex gap-2 text-gray-500">
                        <GiftIcon className="w-5 h-5 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" />
                        <GifIcon className="w-5 h-5 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" />
                        <FaceSmileIcon className="w-5 h-5 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CommunityView: React.FC = () => {
    const [activeCommunityId, setActiveCommunityId] = useState(socialCommunities[0].id);
    const [activeChannelId, setActiveChannelId] = useState(socialCommunities[0].channels[0].id);

    const activeCommunity = socialCommunities.find(c => c.id === activeCommunityId) || socialCommunities[0];
    const activeChannel = activeCommunity.channels.find(c => c.id === activeChannelId) || activeCommunity.channels[0];

    return (
        <div className="flex h-full overflow-hidden bg-gray-100 dark:bg-gray-900">
            {/* Server Rail */}
            <nav className="w-[72px] bg-gray-200 dark:bg-gray-900 flex flex-col items-center py-3 gap-2 overflow-y-auto shrink-0 no-scrollbar">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-sm cursor-pointer hover:rounded-xl transition-all duration-200 text-white">
                    <ChatBubbleLeftRightIcon className="w-7 h-7" />
                </div>
                <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-700 rounded-full my-1"></div>
                
                {socialCommunities.map(comm => (
                    <div key={comm.id} className="relative group w-12 h-12">
                        {activeCommunityId === comm.id && (
                            <div className="absolute -left-4 top-2 w-2 h-8 bg-white rounded-r-full"></div>
                        )}
                        <img 
                            src={comm.iconUrl} 
                            alt={comm.name} 
                            onClick={() => { setActiveCommunityId(comm.id); setActiveChannelId(comm.channels[0].id); }}
                            className={`w-12 h-12 rounded-[24px] object-cover cursor-pointer transition-all duration-200 group-hover:rounded-[16px] ${activeCommunityId === comm.id ? 'rounded-[16px]' : ''}`}
                            title={comm.name}
                        />
                    </div>
                ))}
                
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-[24px] group-hover:rounded-[16px] flex items-center justify-center text-green-500 cursor-pointer transition-all duration-200 hover:bg-green-500 hover:text-white">
                    <PlusIcon className="w-6 h-6" />
                </div>
            </nav>

            {/* Channel List */}
            <ChannelList 
                community={activeCommunity} 
                activeChannel={activeChannelId} 
                onSelect={setActiveChannelId} 
            />

            {/* Main Chat */}
            <ChatArea channelName={activeChannel.name} />
            
            {/* Member List (Optional - Hidden on small screens) */}
            <aside className="w-60 bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 hidden lg:flex flex-col p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Online — {activeCommunity.onlineCount}</h3>
                <div className="space-y-2">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex items-center gap-3 opacity-80 hover:opacity-100 cursor-pointer p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                             <div className="relative">
                                 <div className="w-8 h-8 rounded-full bg-blue-500"></div>
                                 <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-100 dark:border-gray-800 rounded-full"></div>
                             </div>
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User_{i}</span>
                        </div>
                    ))}
                </div>
            </aside>
        </div>
    );
};
