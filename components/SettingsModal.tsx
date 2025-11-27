
import React, { useState, useMemo } from 'react';
import { settingsConfig, loggedInUser } from '../data';
import { SettingsCategory, SettingsItem } from '../types';
import { ChevronLeftIcon, SearchIcon, SparklesIcon } from './Icons';

// Import existing settings components
import { PlaceholderSettings } from './settings/PlaceholderSettings';
import MyProfile from './MyProfile';
import { DisplaySettings } from './settings/DisplaySettings';
import { NetworkSettings } from './settings/NetworkSettings';
import { AboutSettings } from './settings/AboutSettings';
import { NotificationsSettings } from './settings/NotificationsSettings';
import { SoundsSettings } from './settings/SoundsSettings';
import { CloudStorageSettings } from './settings/CloudStorageSettings';
import { AiSettings } from './settings/AiSettings';
import { AccessibilitySettings } from './settings/AccessibilitySettings';
import { WallpaperSettings } from './settings/WallpaperSettings';
import { SystemArchitecture } from './SystemArchitecture';
import { CoreParadigms } from './CoreParadigms';
import { VirtualHardware } from './VirtualHardware';
import { KnowledgeBase } from './KnowledgeBase';
import { Milestones } from './Milestones';
import { BuildChecklist } from './BuildChecklist';
import { SystemRequirements } from './SystemRequirements';
import { VirtualRigBuilder } from './VirtualRigBuilder';

// Apps moved to Settings
import { CloudOpsApp } from './apps/CloudOpsApp';
import { Terminal } from './apps/Terminal';
import { Hypervisor } from './apps/Hypervisor';
import { Firewall } from './Firewall';

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
                <SparklesIcon className="w-8 h-8 text-purple-500" />
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

// Temporarily map missing settings to Placeholder to ensure app compiles
const AirplaneModeSettings = (props: any) => <PlaceholderSettings {...props} />;
const BluetoothSettings = (props: any) => <PlaceholderSettings {...props} />;
const CellularSettings = (props: any) => <PlaceholderSettings {...props} />;
const VpnSettings = (props: any) => <PlaceholderSettings {...props} />;
const HomeScreenSettings = (props: any) => <PlaceholderSettings {...props} />;
const FontsSettings = (props: any) => <PlaceholderSettings {...props} />;
const FocusSettings = (props: any) => <PlaceholderSettings {...props} />;
const ScreenTimeSettings = (props: any) => <PlaceholderSettings {...props} />;
const SearchSettings = (props: any) => <PlaceholderSettings {...props} />;
const MailSettings = (props: any) => <PlaceholderSettings {...props} />;
const PasswordsSettings = (props: any) => <PlaceholderSettings {...props} />;
const FaceIdSettings = (props: any) => <PlaceholderSettings {...props} />;
const PrivacySettings = (props: any) => <PlaceholderSettings {...props} />;
const SoftwareUpdateSettings = (props: any) => <PlaceholderSettings {...props} />;
const StorageSettings = (props: any) => <PlaceholderSettings {...props} />;
const ControlCenterSettings = (props: any) => <PlaceholderSettings {...props} />;
const MultitaskingSettings = (props: any) => <PlaceholderSettings {...props} />;
const LanguageSettings = (props: any) => <PlaceholderSettings {...props} />;
const DateTimeSettings = (props: any) => <PlaceholderSettings {...props} />;
const KeyboardSettings = (props: any) => <PlaceholderSettings {...props} />;
const DictionarySettings = (props: any) => <PlaceholderSettings {...props} />;
const ResetSettings = (props: any) => <PlaceholderSettings {...props} />;
const LegalSettings = (props: any) => <PlaceholderSettings {...props} />;
const ShutdownSettings = (props: any) => <PlaceholderSettings {...props} />;
const BatterySettings = (props: any) => <PlaceholderSettings {...props} />;
const StylusSettings = (props: any) => <PlaceholderSettings {...props} />;
const TrackpadSettings = (props: any) => <PlaceholderSettings {...props} />;
const CameraSettings = (props: any) => <PlaceholderSettings {...props} />;
const AppLibrarySettings = (props: any) => <PlaceholderSettings {...props} />;
const DefaultAppsSettings = (props: any) => <PlaceholderSettings {...props} />;
const WalletSettings = (props: any) => <PlaceholderSettings {...props} />;
const GameCenterSettings = (props: any) => <PlaceholderSettings {...props} />;


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
  checklist: BuildChecklist, // Map 'checklist' from data.ts to BuildChecklist component
  systemMonitor: () => <PlaceholderSettings title="System Monitor" />,
  systemIntegrity: () => <PlaceholderSettings title="System Integrity" />,
  systemRequirements: SystemRequirements,
  
  // Placeholder Mappings
  airplane_mode: AirplaneModeSettings,
  wifi: NetworkSettings,
  bluetooth: BluetoothSettings,
  cellular: CellularSettings,
  vpn: VpnSettings,
  home_screen: HomeScreenSettings,
  fonts: FontsSettings,
  focus: FocusSettings,
  screen_time: ScreenTimeSettings,
  search_settings: SearchSettings,
  mail_accounts: MailSettings,
  passwords: PasswordsSettings,
  face_id: FaceIdSettings,
  privacy: PrivacySettings,
  software_update: SoftwareUpdateSettings,
  storage: StorageSettings,
  control_center: ControlCenterSettings,
  multitasking: MultitaskingSettings,
  language_region: LanguageSettings,
  date_time: DateTimeSettings,
  keyboard: KeyboardSettings,
  dictionary: DictionarySettings,
  reset: ResetSettings,
  legal: LegalSettings,
  shutdown: ShutdownSettings,
  battery: BatterySettings,
  stylus: StylusSettings,
  trackpad_mouse: TrackpadSettings,
  camera: CameraSettings,
  app_library: AppLibrarySettings,
  default_apps: DefaultAppsSettings,
  wallet_settings: WalletSettings,
  game_center_profile: GameCenterSettings,
  
  placeholder: PlaceholderSettings,
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
        
        // Ensure Component is a valid component
        const Component = componentMap[selectedItem.component] || componentMap['placeholder'];
        if (typeof Component !== 'function') {
             console.error("Invalid settings component for", selectedItem.component);
             return <PlaceholderSettings title={selectedItem.title + " (Error)"} />;
        }
        
        return <Component title={selectedItem.title} />;
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
