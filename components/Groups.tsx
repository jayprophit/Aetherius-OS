

import React, { useState, useMemo } from 'react';
import { Group, User } from '../types';
import { groups as groupsData, allUsers } from '../data';
import { SearchIcon, CheckCircleIcon, Squares2X2Icon, Bars3Icon, ChevronRightIcon, InformationCircleIcon, PlusIcon, XMarkIcon } from './Icons';

const GroupCard: React.FC<{ group: Group }> = ({ group }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-lg">
    <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${group.coverImageUrl})` }} />
    <div className="p-4 pt-0">
      <img src={group.avatarUrl} alt={group.name} className="-mt-8 w-16 h-16 rounded-lg object-cover border-4 border-white dark:border-gray-800" />
      <h3 className="font-bold text-md mt-2 text-gray-800 dark:text-gray-100 truncate hover:text-blue-500 cursor-pointer">{group.name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{group.privacy} &bull; {group.type}</p>
      <div className="flex items-center mt-2">
        <div className="flex -space-x-2">
          {group.memberAvatars.slice(0, 3).map((avatar, index) => (
            avatar && <img key={index} src={avatar} alt="member" className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800" />
          ))}
        </div>
        {group.members > 3 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">+{group.members - 3} more</span>
        )}
      </div>
      {group.isOrganizer && (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-semibold mt-3">
          <CheckCircleIcon className="w-5 h-5" />
          <span>Organizer</span>
        </div>
      )}
    </div>
  </div>
);

const CreateGroupWizard: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
    const [step, setStep] = useState(1);
    const totalSteps = 8;
    const steps = ["Details", "Settings", "Topics", "Forum", "Photo", "Cover Photo", "Invites", "Courses"];
    
    const renderStepContent = () => {
        switch (step) {
            case 1: // Details
                return (
                    <div>
                        <div className="mb-4">
                            <label htmlFor="groupName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Group Name (required)</label>
                            <input type="text" id="groupName" className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="groupDesc" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Group Description</label>
                            <textarea id="groupDesc" rows={4} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                );
            // Add other steps here...
            default:
                return <div className="text-center p-8">Step {step} content goes here.</div>;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">Create A New Group</h2>
            <div className="flex justify-center border-b border-gray-200 dark:border-gray-700 mb-6">
                {steps.map((title, index) => (
                     <div key={title} className={`px-4 py-2 text-center border-b-2 text-sm font-semibold ${step >= index + 1 ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500'}`}>
                        <span className="font-bold">{index + 1}.</span> {title}
                    </div>
                ))}
            </div>
            
            {renderStepContent()}

            <div className="flex justify-between items-center mt-6">
                {step > 1 ? (
                    <button onClick={() => setStep(s => s - 1)} className="px-6 py-2 font-semibold bg-gray-200 dark:bg-gray-600 rounded-md">Previous Step</button>
                ) : <div></div>}
                
                {step < totalSteps ? (
                    <button onClick={() => setStep(s => s + 1)} className="px-6 py-2 font-semibold text-white bg-gray-800 dark:bg-blue-600 rounded-md hover:bg-gray-700 dark:hover:bg-blue-500">
                        {step === 1 ? 'Create Group and Continue' : 'Next Step'}
                    </button>
                ) : (
                     <button className="px-6 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Finish</button>
                )}
            </div>
        </div>
    );
};

export const Groups: React.FC = () => {
    const [view, setView] = useState<'all' | 'my' | 'create'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');

    const filteredGroups = useMemo(() => {
        let groups = groupsData;
        if (view === 'my') {
            groups = groupsData.filter(g => g.isOrganizer);
        }
        if (searchTerm) {
            groups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return groups;
    }, [view, searchTerm]);

    const renderContent = () => {
        if (view === 'create') {
            return <CreateGroupWizard onCancel={() => setView('all')} />;
        }
        return (
            <div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {filteredGroups.map(group => <GroupCard key={group.id} group={group} />)}
                 </div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-100/50 dark:bg-gray-900/50">
             {!view.includes('create') && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                    <h1 className="text-2xl font-bold">Groups</h1>
                </div>
             )}

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('all')} className={`px-3 py-1.5 font-semibold text-sm rounded-md ${view === 'all' ? 'bg-gray-200/50 dark:bg-gray-700/50' : ''}`}>All Groups <span className="text-xs ml-1 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full">{groupsData.length}</span></button>
                        <button onClick={() => setView('my')} className={`px-3 py-1.5 font-semibold text-sm rounded-md ${view === 'my' ? 'bg-gray-200/50 dark:bg-gray-700/50' : ''}`}>My Groups <span className="text-xs ml-1 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full">{groupsData.filter(g=>g.isOrganizer).length}</span></button>
                        <button onClick={() => setView('create')} className={`px-3 py-1.5 font-semibold text-sm rounded-md ${view === 'create' ? 'bg-gray-200/50 dark:bg-gray-700/50' : ''}`}>Create a Group</button>
                    </div>
                    {view !== 'create' && (
                        <div className="relative w-full md:w-64">
                            <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" placeholder="Search Groups..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md h-9 pl-10 pr-4 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                    )}
                </div>
                {view !== 'create' && (
                    <div className="p-4 flex justify-between items-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Viewing {filteredGroups.length} of {groupsData.length} groups</p>
                        <div className="flex items-center gap-2">
                             <select className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md h-9 px-2 text-sm">
                                <option>Recently Active</option>
                                <option>Most Members</option>
                                <option>Newly Created</option>
                                <option>Alphabetical</option>
                            </select>
                            <button onClick={() => setLayout('grid')} className={`p-2 rounded-md ${layout === 'grid' ? 'bg-gray-200 dark:bg-gray-600' : ''}`}><Squares2X2Icon className="w-5 h-5"/></button>
                            <button onClick={() => setLayout('list')} className={`p-2 rounded-md ${layout === 'list' ? 'bg-gray-200 dark:bg-gray-600' : ''}`}><Bars3Icon className="w-5 h-5"/></button>
                        </div>
                    </div>
                )}
            </div>
            
            {renderContent()}
        </div>
    );
};