
import React, { useState } from 'react';
import { MenuItemData } from '../../types';
import { LearningRealms } from '../LearningRealms';
import { MyLearning, LearningAssistant, Achievements } from '../MyLearning';
import { ElearningPlatforms } from '../ElearningPlatforms';
import { InstructorStudio } from '../elearning/InstructorStudio';
import { BlockchainCVView } from '../elearning/BlockchainCVView';
import { 
    AcademicCapIcon, BriefcaseIcon, GlobeAltIcon, UserCircleIcon, 
    BookOpenIcon, ChartBarIcon, CheckCircleIcon 
} from '../Icons';

interface ElearningAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

const NavButton: React.FC<{ 
    active: boolean; 
    icon: React.FC<any>; 
    label: string; 
    onClick: () => void;
}> = ({ active, icon: Icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            active 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

export const ElearningApp: React.FC<ElearningAppProps> = ({ context, onSetView }) => {
    const [activeTab, setActiveTab] = useState<'learn' | 'my_learning' | 'teach' | 'cv' | 'community'>('learn');

    const renderContent = () => {
        switch (activeTab) {
            case 'learn':
                return <LearningRealms onSetView={onSetView} />;
            case 'my_learning':
                return (
                    <div className="space-y-8 p-6">
                         <MyLearning onSetView={onSetView} />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <LearningAssistant onSetView={onSetView} />
                             <Achievements />
                         </div>
                    </div>
                );
            case 'teach':
                return <InstructorStudio />;
            case 'cv':
                return <BlockchainCVView />;
            case 'community':
                 return <ElearningPlatforms />;
            default:
                return <LearningRealms onSetView={onSetView} />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 font-sans">
            {/* Mega Platform Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 shadow-sm z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                            <AcademicCapIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">Universal Learning Engine</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Aetherius Education Singularity</p>
                        </div>
                    </div>
                    
                    <nav className="flex gap-2 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                        <NavButton 
                            active={activeTab === 'learn'} 
                            icon={GlobeAltIcon} 
                            label="Catalog" 
                            onClick={() => setActiveTab('learn')} 
                        />
                        <NavButton 
                            active={activeTab === 'my_learning'} 
                            icon={BookOpenIcon} 
                            label="My Learning" 
                            onClick={() => setActiveTab('my_learning')} 
                        />
                         <NavButton 
                            active={activeTab === 'teach'} 
                            icon={ChartBarIcon} 
                            label="Teach" 
                            onClick={() => setActiveTab('teach')} 
                        />
                         <NavButton 
                            active={activeTab === 'cv'} 
                            icon={BriefcaseIcon} 
                            label="Blockchain CV" 
                            onClick={() => setActiveTab('cv')} 
                        />
                         <NavButton 
                            active={activeTab === 'community'} 
                            icon={UserCircleIcon} 
                            label="Platforms" 
                            onClick={() => setActiveTab('community')} 
                        />
                    </nav>
                    
                    <div className="hidden md:flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-900 dark:text-white">Level 14</p>
                            <p className="text-[10px] text-blue-500">2,450 XP</p>
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-blue-500 p-0.5">
                             <img src="https://ui-avatars.com/api/?name=John+Doe&background=random" className="w-full h-full rounded-full" alt="User"/>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative">
                {renderContent()}
            </main>
        </div>
    );
};