
import React, { useState, useMemo } from 'react';
import { settingsConfig, loggedInUser } from '../data';
import { SettingsCategory, SettingsItem } from '../types';
import { ChevronLeftIcon, SearchIcon, SparklesIcon, BluetoothIcon, WifiIcon, BatteryIcon, LockClosedIcon, EyeIcon, BellIcon, HandRaisedIcon } from './Icons';

// Import existing settings components
import MyProfile from '../MyProfile';
import { DisplaySettings } from './DisplaySettings';
import { NetworkSettings } from './NetworkSettings';
import { AboutSettings } from './AboutSettings';
import { NotificationsSettings } from './NotificationsSettings';
import { SoundsSettings } from './SoundsSettings';
import { CloudStorageSettings } from './CloudStorageSettings';
import { AiSettings } from './AiSettings';
import { AccessibilitySettings } from './AccessibilitySettings';
import { WallpaperSettings } from './WallpaperSettings';
import { SystemSettings } from './SystemSettings';
import { DateTimeSettings } from './DateTimeSettings';
import { LanguageSettings } from './LanguageSettings';

// Core OS Components mapped to settings
import { SystemArchitecture } from '../SystemArchitecture';
import { CoreParadigms } from '../CoreParadigms';
import { VirtualHardware } from '../VirtualHardware';
import { KnowledgeBase } from '../KnowledgeBase';
import { Milestones } from '../Milestones';
import { BuildChecklist } from '../BuildChecklist';
import { SystemRequirements } from '../SystemRequirements';
import { SystemAudit } from '../SystemAudit';

// Apps moved to Settings
import { CloudOpsApp } from '../apps/CloudOpsApp';
import { Terminal } from '../apps/Terminal';
import { Hypervisor } from '../apps/Hypervisor';
import { Firewall } from '../Firewall';
import { VirtualRigBuilder } from '../VirtualRigBuilder';

// --- UNIVERSAL SETTINGS ENGINE ---
// This component dynamically generates a settings page based on configuration
// eliminating the need for 50+ individual files for standard toggles/lists.

interface UniversalConfig {
    type: 'toggle' | 'list' | 'info' | 'graph' | 'input';
    label: string;
    subLabel?: string;
    value?: boolean | string;
    icon?: React.FC<any>;
}

const universalConfigurations: Record<string, UniversalConfig[]> = {
    bluetooth: [
        { type: 'toggle', label: 'Bluetooth', value: true },
        { type: 'list', label: 'AetherPods Pro', subLabel: 'Connected', icon: BluetoothIcon },
        { type: 'list', label: 'MX Master 3S', subLabel: 'Connected', icon: BluetoothIcon },
        { type: 'list', label: 'Keychron Q1', subLabel: 'Not Connected', icon: BluetoothIcon },
    ],
    vpn: [
        { type: 'toggle', label: 'VPN Status', subLabel: 'Connected to US-East-1', value: true },
        { type: 'list', label: 'Aetherius Secure Relay', subLabel: 'Default', icon: LockClosedIcon },
        { type: 'list', label: 'Tor Bridge (Onion)', subLabel: 'Available', icon: EyeIcon },
    ],
    battery: [
        { type: 'info', label: 'Battery Health', value: '98% Maximum Capacity' },
        { type: 'toggle', label: 'Low Power Mode', subLabel: 'Reduces background activity', value: false },
        { type: 'toggle', label: 'Optimized Charging', subLabel: 'Waits to finish charging past 80%', value: true },
        { type: 'list', label: 'Last 24 Hours', subLabel: 'See usage graph', icon: BatteryIcon },
    ],
    privacy: [
        { type: 'toggle', label: 'Location Services', value: true },
        { type: 'toggle', label: 'Tracking', subLabel: 'Allow apps to request to track', value: false },
        { type: 'list', label: 'Microphone Access', subLabel: '4 Apps', icon: LockClosedIcon },
        { type: 'list', label: 'Camera Access', subLabel: '2 Apps', icon: LockClosedIcon },
        { type: 'toggle', label: 'Analytics & Improvements', value: true },
    ],
    passwords: [
        { type: 'info', label: 'Security Recommendations', value: '1 Compromised Password found' },
        { type: 'toggle', label: 'AutoFill Passwords', value: true },
        { type: 'list', label: 'google.com', subLabel: 'johndoe', icon: LockClosedIcon },
        { type: 'list', label: 'github.com', subLabel: 'johndoe_dev', icon: LockClosedIcon },
    ],
    focus: [
        { type: 'toggle', label: 'Do Not Disturb', value: false },
        { type: 'list', label: 'Personal', subLabel: 'Set up', icon: HandRaisedIcon },
        { type: 'list', label: 'Work', subLabel: '9:00 AM - 5:00 PM', icon: HandRaisedIcon },
        { type: 'list', label: 'Sleep', subLabel: '11:00 PM - 7:00 AM', icon: HandRaisedIcon },
    ],
    software_update: [
        { type: 'toggle', label: 'Automatic Updates', value: true },
        { type: 'info', label: 'Current Version', value: 'Aetherius OS 24H2 (Build 22631)' },
        { type: 'info', label: 'Status', value: 'Your system is up to date.' },
    ],
    storage: [
        { type: 'info', label: 'Macintosh HD', value: '450 GB / 1 TB Used' },
        { type: 'list', label: 'Applications', subLabel: '120 GB', icon: SparklesIcon },
        { type: 'list', label: 'Documents', subLabel: '240 GB', icon: SparklesIcon },
        { type: 'list', label: 'System Data', subLabel: '90 GB', icon: SparklesIcon },
    ]
};

const UniversalSettingsRender: React.FC<{ title: string, id: string }> = ({ title, id }) => {
    // Get config or default to empty
    const config = universalConfigurations[id] || [
        { type: 'info', label: 'Configuration', value: 'Standard Default' },
        { type: 'toggle', label: 'Enable Feature', value: true },
        { type: 'list', label: 'Advanced Options', subLabel: 'Configure...', icon: SparklesIcon }
    ];

    const [toggles, setToggles] = useState<Record<number, boolean>>(
        config.reduce((acc, item, idx) => {
            if (item.type === 'toggle') acc[idx] = !!item.value;
            return acc;
        }, {} as Record<number, boolean>)
    );

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1">{title}</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {config.map((item, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div className="flex items-center gap-3">
                                {item.icon && <item.icon className="w-6 h-6 text-blue-500" />}
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-100">{item.label}</p>
                                    {item.subLabel && <p className="text-sm text-gray-500 dark:text-gray-400">{item.subLabel}</p>}
                                </div>
                            </div>
                            
                            {item.type === 'toggle' && (
                                <button 
                                    onClick={() => setToggles(p => ({...p, [idx]: !p[idx]}))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${toggles[idx] ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <span className={`inline-block w-4 h-4 transform rounded-full bg-white transition-transform ${toggles[idx] ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            )}

                            {item.type === 'info' && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">{item.value}</span>
                            )}

                            {item.type === 'list' && (
                                <ChevronLeftIcon className="w-5 h-5 text-gray-400 rotate-180" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Custom User Variety Setting Component ---
const CustomVarietySettings: React.FC<{ title: string }> = ({ title }) => {
    const [modes, setModes] = useState({
        expert: false,
        legacy: false,
        beta: true
    });

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 px-1 flex items-center gap-3">
                <SearchIcon className="w-8 h-8 text-purple-500" />
                {title}
            </h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">User Defined Preferences</h2>
                <p className="text-sm text-gray-500 mb-6">Add your own custom toggles and configurations here to add variety to the OS.</p>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium">Expert Mode</p>
                            <p className="text-xs text-gray-500">Show advanced kernel logs on desktop.</p>
                        </div>
                        <input type="checkbox" checked={modes.expert} onChange={() => setModes(p => ({...p, expert: !p.expert}))} className="toggle-checkbox" />
                    </div>
                     <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium">Legacy Interface</p>
                            <p className="text-xs text-gray-500">Revert to Win95 style icons.</p>
                        </div>
                         <input type="checkbox" checked={modes.legacy} onChange={() => setModes(p => ({...p, legacy: !p.legacy}))} className="toggle-checkbox" />
                    </div>
                     <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium">Beta Features</p>
                            <p className="text-xs text-gray-500">Get early access to unstable modules.</p>
                        </div>
                         <input type="checkbox" checked={modes.beta} onChange={() => setModes(p => ({...p, beta: !p.beta}))} className="toggle-checkbox" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const componentMap: { [key: string]: React.FC<any> } = {
  // Custom & New
  customVariety: CustomVarietySettings,

  // Existing custom pages
  display: DisplaySettings,
  network: NetworkSettings,
  about: AboutSettings,
  myProfile: MyProfile,
  notifications: NotificationsSettings,
  sounds: SoundsSettings,
  cloud_storage: CloudStorageSettings,
  ai_settings: AiSettings,
  accessibility_main: AccessibilitySettings,
  wallpaper: WallpaperSettings,
  
  // New locale settings
  date_time: DateTimeSettings,
  language_region: LanguageSettings,
  
  // Restored & Connected Files
  systemSettings: SystemSettings, 

  // Operations & Maintenance (Moved from Main Menu)
  cloudOps: CloudOpsApp,
  terminal: Terminal,
  hypervisor: Hypervisor,
  firewall: Firewall,

  // Restored System Core & OS Knowledge
  systemArchitecture: SystemArchitecture,
  coreParadigms: CoreParadigms,
  virtualHardware: VirtualHardware,
  rigBuilder: VirtualRigBuilder,
  knowledgeBase: KnowledgeBase,
  milestones: Milestones,
  buildChecklist: BuildChecklist,
  checklist: BuildChecklist, 
  systemMonitor: VirtualHardware,
  systemIntegrity: SystemAudit,
  systemRequirements: SystemRequirements,
  systemAudit: SystemAudit,
  
  // Universal Renderer for previously missing pages
  // Instead of mapping to PlaceholderSettings, we render UniversalSettingsRender
  // The 'placeholder' key will handle the fallback.
};

const CategoryCard: React.FC<{ category: any; onClick: () => void; }> = ({ category, onClick }) => {
    const { icon: Icon, title, description } = category;
    return (
        <button 
            onClick={onClick}
            className="w-full text-left p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 flex items-start gap-4"
        >
            <Icon className="w-8 h-8 text-gray-600 dark:text-gray-300 flex-shrink-0 mt-1" />
            <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            </div>
        </button>
    );
};

const SubItemSidebarItem: React.FC<{ item: any; isActive: boolean; onClick: () => void; }> = ({ item, isActive, onClick }) => {
    const { icon: Icon, title } = item;
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center text-left px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
            {Icon && <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />}
            <span className={`font-medium text-sm truncate ${isActive ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{title}</span>
        </button>
    );
};


export const SettingsView: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<SettingsCategory | null>(null);
    const [selectedItem, setSelectedItem] = useState<SettingsItem | null>(null);

    const handleSelectCategory = (category: SettingsCategory) => {
        setSelectedCategory(category);
        setSelectedItem(category.items[0] || null);
    };

    const handleBackToGrid = () => {
        setSelectedCategory(null);
        setSelectedItem(null);
    };

    const ContentComponent = useMemo(() => {
        if (!selectedItem) return null;
        
        const Component = componentMap[selectedItem.component];
        
        if (Component) {
            return <Component title={selectedItem.title} />;
        }

        // Fallback to Universal Renderer for anything without a specific component
        // This covers Bluetooth, VPN, Privacy, etc.
        return <UniversalSettingsRender title={selectedItem.title} id={selectedItem.component} />;

    }, [selectedItem]);

    if (!selectedCategory) {
        return (
            <div className="h-full w-full p-4 md:p-6 overflow-y-auto bg-gray-100 dark:bg-gray-800/50">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Settings</h1>
                    <div className="relative max-w-sm">
                        <SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Find a setting" className="bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md h-10 pl-10 pr-4 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </header>
                
                <div className="p-4 flex items-center gap-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6">
                    <img src={loggedInUser.avatarUrl || ''} alt="User" className="w-16 h-16 rounded-full"/>
                    <div>
                        <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{loggedInUser.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{loggedInUser.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                    {settingsConfig.map(category => (
                        <CategoryCard key={category.id} category={category} onClick={() => handleSelectCategory(category)} />
                    ))}
                </div>
            </div>
        );
    }

    return (
         <div className="h-full w-full flex bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-50 dark:bg-gray-800/50 p-4 border-r border-gray-200 dark:border-gray-700 flex-col flex flex-shrink-0">
                 <button onClick={handleBackToGrid} className="flex items-center gap-2 text-sm font-semibold mb-4 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <ChevronLeftIcon className="w-5 h-5" />
                    All Settings
                </button>
                <div className="space-y-1 overflow-y-auto">
                    {selectedCategory.items.map(item => (
                        <SubItemSidebarItem 
                            key={item.id}
                            item={item}
                            isActive={selectedItem?.id === item.id}
                            onClick={() => setSelectedItem(item)}
                        />
                    ))}
                </div>
            </aside>
            {/* Content */}
            <main className="flex-1 p-6 overflow-y-auto">
                {ContentComponent}
            </main>
        </div>
    );
};
