import React, { useState, useMemo } from 'react';
import { User, Group } from '../types';
import { allUsers, loggedInUser, groups as allGroups } from '../data';
import { SearchIcon, MessageIcon, ArrowPathIcon, Squares2X2Icon, Bars3Icon, EllipsisHorizontalIcon, UserPlusIcon, SpeakerWaveIcon, ShoppingCartIcon, CheckCircleIcon, XMarkIcon } from './Icons';

// --- Reusable Widget Component ---
const Widget: React.FC<{ title: string; children: React.ReactNode; tabs?: string[]; activeTab?: string; onTabChange?: (tab: string) => void; seeAll?: boolean; }> = ({ title, children, tabs, activeTab, onTabChange, seeAll }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">{title}</h3>
            {seeAll && <a href="#" className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-orange-500">SEE ALL</a>}
        </div>
        {tabs && onTabChange && (
            <div className="px-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex -mb-px">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`px-3 py-2 text-xs font-bold uppercase tracking-widest ${activeTab === tab ? 'border-b-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
        )}
        <div>{children}</div>
    </div>
);


// --- Right Sidebar Widgets ---
const FilterResults: React.FC = () => (
    <div className="bg-[#fdfcf9] dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Filter Results</h3>
        <div>
            <label htmlFor="first_name" className="text-sm font-semibold text-gray-600 dark:text-gray-300">First Name</label>
            <input type="text" id="first_name" className="mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
            <label htmlFor="last_name" className="text-sm font-semibold text-gray-600 dark:text-gray-300">Last Name</label>
            <input type="text" id="last_name" className="mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="flex items-center justify-between pt-2">
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                <ArrowPathIcon className="w-4 h-4" />
                Reset
            </button>
            <button className="px-8 py-2 font-semibold text-white bg-[#4b4369] rounded-md hover:bg-opacity-90">
                Search
            </button>
        </div>
    </div>
);

const MembersWidget: React.FC = () => {
    const [activeTab, setActiveTab] = useState('ACTIVE');
    const membersToShow = useMemo(() => {
        if (activeTab === 'NEWEST') return allUsers.slice(1, 7);
        if (activeTab === 'POPULAR') return [...allUsers].sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0)).slice(0, 6);
        return allUsers.filter(u => u.online).slice(0, 6); // ACTIVE
    }, [activeTab]);

    return (
        <Widget title="Members" tabs={['NEWEST', 'ACTIVE', 'POPULAR']} activeTab={activeTab} onTabChange={setActiveTab} seeAll>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {membersToShow.map(user => (
                    <li key={user.id} className="p-4 flex items-center gap-3">
                        <img src={user.avatarUrl!} alt={user.name} className="w-10 h-10 rounded-full" />
                        <span className="font-semibold text-sm">{user.name}</span>
                    </li>
                ))}
            </ul>
        </Widget>
    );
};

const GroupsWidget: React.FC = () => {
    const [activeTab, setActiveTab] = useState('ACTIVE');
    const groupsToShow = useMemo(() => {
        if (activeTab === 'POPULAR') return [...allGroups].sort((a,b) => b.members - a.members).slice(0, 5);
        // Placeholder for NEWEST/ACTIVE
        return allGroups.slice(0, 5);
    }, [activeTab]);

    return (
        <Widget title="Groups" tabs={['NEWEST', 'ACTIVE', 'POPULAR']} activeTab={activeTab} onTabChange={setActiveTab} seeAll>
             <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {groupsToShow.map(group => (
                    <li key={group.id} className="p-4 flex items-center gap-3">
                        <img src={group.avatarUrl} alt={group.name} className="w-12 h-12 rounded-sm object-cover" />
                        <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{group.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{group.members} members</p>
                        </div>
                    </li>
                ))}
            </ul>
        </Widget>
    );
};

// --- Member Card ---
const MemberCard: React.FC<{ user: User }> = ({ user }) => {
    const isCurrentUser = user.id === loggedInUser.id;
    const roleColors: { [key: string]: string } = {
        'Admin': 'bg-[#2a75d1] text-white',
        'Student': 'bg-[#984196] text-white',
        'Teacher': 'bg-[#3ca899] text-white',
        'Coach': 'bg-[#d04949] text-white',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 text-center">
            <div className="p-6 relative">
                {!isCurrentUser && (
                    <button className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <EllipsisHorizontalIcon className="w-5 h-5" />
                    </button>
                )}
                <div className="relative inline-block">
                    <img
                        src={user.avatarUrl!}
                        alt={user.name}
                        className="w-24 h-24 rounded-full object-cover mx-auto ring-1 ring-gray-200 dark:ring-gray-700"
                    />
                    {user.online && (
                        <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800" title="Online"></span>
                    )}
                </div>
                {user.role && (
                    <div className={`mt-3 inline-block px-3 py-0.5 rounded-full text-xs font-bold ${roleColors[user.role] || 'bg-gray-200 text-gray-800'}`}>
                        {user.role}
                    </div>
                )}
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mt-2">{user.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.joinedDate}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{user.followersCount}</span> followers
                </p>
                {!isCurrentUser && (
                    <button className="mt-4 w-full max-w-xs mx-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <MessageIcon className="w-4 h-4" />
                        Send Message
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Banner & Floating Button ---
const DemoBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    if (!isVisible) return null;

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6 flex justify-between items-center gap-4">
            <div className="flex-1">
                <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">You're using the BuddyBoss Online Community Demo</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Launch your community today with BuddyBoss; <a href="#" className="text-orange-500 font-bold hover:underline">get it now!</a></p>
            </div>
            <img src="https://i.imgur.com/uKW0Xub.png" alt="Community illustration" className="h-20 hidden sm:block"/>
            <button onClick={() => setIsVisible(false)} className="self-start text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <XMarkIcon className="w-6 h-6"/>
            </button>
        </div>
    );
};


// --- Main Members Component ---
export const Members: React.FC = () => {
    const [activeTab, setActiveTab] = useState('All Members');
    const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

    const tabs = ['All Members', 'My Connections', 'Following', 'Followers'];

    const users = allUsers; // Simplified for now
    const memberCount = users.length;

    return (
        <div className="bg-[#fbfbfb] dark:bg-gray-900 min-h-full p-4 sm:p-6">
            <div className="max-w-screen-xl mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Main content */}
                    <div className="xl:col-span-8">
                        <DemoBanner />
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Members</h1>
                        
                        <div className="border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                {tabs.map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`py-3 text-sm font-semibold border-b-2 ${activeTab === tab ? 'border-[#f56a32] text-[#f56a32]' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center my-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">{memberCount} Members</p>
                            <div className="flex items-center gap-2">
                                <select className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md h-9 px-2 text-sm focus:ring-0 focus:border-gray-400">
                                    <option>Recently Active</option>
                                    <option>Newest Members</option>
                                    <option>Alphabetical</option>
                                </select>
                                <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-md p-0.5">
                                    <button onClick={() => setViewLayout('grid')} className={`p-1.5 rounded ${viewLayout === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}>
                                        <Squares2X2Icon className="w-5 h-5"/>
                                    </button>
                                    <button onClick={() => setViewLayout('list')} className={`p-1.5 rounded ${viewLayout === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}>
                                        <Bars3Icon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {users.map(user => <MemberCard key={user.id} user={user} />)}
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <aside className="xl:col-span-4 space-y-6">
                        <FilterResults />
                        <MembersWidget />
                        <GroupsWidget />
                    </aside>
                </div>
            </div>
        </div>
    );
};