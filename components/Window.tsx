



import React from 'react';
import { ProductPage } from './ProductPage';
import { SocialFeed } from './SocialFeed';
import { Elearning } from './Elearning';
import { JobSearch } from './JobSearch';
import { CvBuilder } from './CvBuilder';
import { Marketplace } from './Marketplace';
import { AIHub } from './AIAssistant';
import { SettingsView } from './SettingsModal';
import { 
    WelcomeBanner,
    ActivityFeedCreator,
    PeopleYouMayKnow,
    PostCard,
    BlogWidget,
    FollowingWidget,
    CompleteProfileWidget,
    LatestUpdatesWidget,
    GroupsWidget,
    SponsoredWidget,
    ContactsWidget
} from './SocialFeed';
import { posts } from '../data';
import { Browser } from './Browser';
import { SystemArchitecture } from './SystemArchitecture';
import { CoreParadigms } from './CoreParadigms';
import { VirtualHardware } from './VirtualHardware';
import { PersonalAI } from './PersonalAI';
import { KnowledgeBase } from './KnowledgeBase';
import { Milestones } from './Milestones';
import { CADLab } from './CADLab';
import { CreationLab } from './CreationLab';
import { MyLearning } from './MyLearning';
import { CourseDetail } from './CourseDetail';
import { BuildChecklist } from './BuildChecklist';
import { CreatorMarketplace } from './CreatorMarketplace';
import MyProfile from './MyProfile';
import { Messenger } from './Messenger';
import { Members } from './Members';
import { Groups } from './Groups';

// Import all settings components for mapping
import { PlaceholderSettings } from './settings/PlaceholderSettings';
import { DisplaySettings } from './settings/DisplaySettings';
import { NetworkSettings } from './settings/NetworkSettings';
import { AboutSettings } from './settings/AboutSettings';
import { NotificationsSettings } from './settings/NotificationsSettings';
import { SoundsSettings } from './settings/SoundsSettings';
import { CloudStorageSettings } from './settings/CloudStorageSettings';
import { AiSettings } from './settings/AiSettings';
import { AccessibilitySettings } from './settings/AccessibilitySettings';
import { WallpaperSettings } from './settings/WallpaperSettings';

// Import new Health & Wellness components
import { HealthHub } from './health/HealthHub';
import { BodyComposition } from './health/BodyComposition';
import { FrequencyHealing } from './health/FrequencyHealing';
import { HealingWeb } from './health/HealingWeb';
import { NutritionGuide } from './health/NutritionGuide';


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


const PlaceholderView: React.FC<{ viewName: string, onSetView?: (view: string, context?: any) => void }> = ({ viewName }) => (
    <div className="flex items-center justify-center h-full p-4 sm:p-6 bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-6">
            <h1 className="text-2xl font-bold capitalize">{viewName.replace(/([A-Z])/g, ' $1').trim()}</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">This application is under construction.</p>
        </div>
    </div>
);

const FeedView: React.FC<{ onSetView: (view: string) => void }> = ({ onSetView }) => (
    <div className="bg-[#fbfbfb] dark:bg-gray-900 min-h-full p-4 sm:p-6 relative">
        <div className="max-w-screen-xl mx-auto">
            <WelcomeBanner />
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start mt-6">
                {/* Left Column */}
                <aside className="hidden xl:block col-span-1 space-y-6">
                    <BlogWidget />
                    <FollowingWidget />
                </aside>

                {/* Center Column */}
                <main className="col-span-1 xl:col-span-2 space-y-6">
                    <ActivityFeedCreator />
                    <PeopleYouMayKnow />
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Activity Feed</h2>
                         <select className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md h-9 px-2 text-sm focus:ring-0 focus:border-gray-400">
                            <option>Show all updates</option>
                            <option>Posts</option>
                            <option>Comments</option>
                        </select>
                    </div>
                    {posts.map(post => <PostCard key={post.id} post={post} />)}
                </main>

                {/* Right Column (Merged) */}
                <aside className="hidden xl:block col-span-1 space-y-6">
                    <CompleteProfileWidget />
                    <SponsoredWidget />
                    <LatestUpdatesWidget />
                    <ContactsWidget />
                    <GroupsWidget />
                </aside>
            </div>
        </div>
    </div>
);


const componentMap: { [key: string]: React.FC<any> } = {
  socialFeed: SocialFeed,
  feedBiome: FeedView,
  browser: Browser,
  productPage: ProductPage,
  aiHub: AIHub,
  courses: Elearning,
  jobSearch: JobSearch,
  cvBuilder: CvBuilder,
  marketplace: Marketplace,
  creatorMarketplace: CreatorMarketplace,
  settings: SettingsView,
  // New E-Learning components
  myLearning: MyLearning,
  courseDetail: CourseDetail,
  instructors: () => <PlaceholderView viewName="Instructors" />,
  // New OS Core Components
  systemArchitecture: SystemArchitecture,
  coreParadigms: CoreParadigms,
  virtualHardware: VirtualHardware,
  personalAI: PersonalAI,
  knowledgeBase: KnowledgeBase,
  milestones: Milestones,
  buildChecklist: BuildChecklist,
  tritCore: () => <PlaceholderView viewName="Trit Core" />,
  strategicHub: () => <PlaceholderView viewName="Strategic Hub" />,
  capabilities: () => <PlaceholderView viewName="Capabilities" />,
  dataArchive: () => <PlaceholderView viewName="Data Archive" />,
  platformIntegrations: () => <PlaceholderView viewName="Platform Integrations" />,
  systemIntegrity: () => <PlaceholderView viewName="System Integrity" />,
  systemMonitor: () => <PlaceholderView viewName="System Monitor" />,
  // Social & Communication
  members: Members,
  groups: Groups,
  forums: () => <PlaceholderView viewName="Forums" />,
  events: () => <PlaceholderView viewName="Events" />,
  messenger: Messenger,
  mail: () => <PlaceholderView viewName="Mail" />,
  commsHub: () => <PlaceholderView viewName="Comms Hub" />,
  // Creation & Development
  codeEditor: () => <PlaceholderView viewName="Code Editor" />,
  websiteBuilder: () => <PlaceholderView viewName="Website Builder" />,
  gameDesign: () => <PlaceholderView viewName="Game Design" />,
  cadDesign: () => <PlaceholderView viewName="CAD Design" />,
  photoEditor: () => <PlaceholderView viewName="Photo Editor" />,
  videoEditor: () => <PlaceholderView viewName="Video Editor" />,
  musicProduction: () => <CreationLab type="Music"/>,
  videoProduction: () => <CreationLab type="Video"/>,
  imageEditing: () => <CreationLab type="Image"/>,
  contentCreation: () => <CreationLab type="Content"/>,
  aiTools: () => <PlaceholderView viewName="AI Tools" />,
  articleWriter: () => <PlaceholderView viewName="Article Writer" />,
  scriptGenerator: () => <PlaceholderView viewName="Script Generator" />,
  slideDeckDesigner: () => <PlaceholderView viewName="Slide Deck Designer" />,
  // Virtual Lab
  slideMatrix: () => <PlaceholderView viewName="Slide Matrix" />,
  notes: () => <PlaceholderView viewName="Notes" />,
  translate: () => <PlaceholderView viewName="Translate" />,
  fileExplorer: () => <PlaceholderView viewName="File Explorer" />,
  engineering: () => <PlaceholderView viewName="Engineering" />,
  // Simulations
  genesisForge: () => <PlaceholderView viewName="Genesis Forge" />,
  avatarForge: () => <PlaceholderView viewName="Avatar Forge" />,
  engineeringHub: () => <PlaceholderView viewName="Engineering Hub" />,
  simulationHub: () => <PlaceholderView viewName="Simulation Hub" />,
  videoHub: () => <PlaceholderView viewName="Video Hub" />,
  videoEditingSuite: () => <PlaceholderView viewName="Video Editing Suite" />,
  gameDevSuite: () => <PlaceholderView viewName="Game Dev Suite" />,
  // Work & Finance
  documents: () => <PlaceholderView viewName="Documents" />,
  calendar: () => <PlaceholderView viewName="Calendar" />,
  taskHub: () => <PlaceholderView viewName="taskHub" />,
  cadLab: CADLab,
  myProfile: MyProfile,
  // New Health & Wellness
  healthHub: HealthHub,
  bodyComposition: BodyComposition,
  frequencyHealing: FrequencyHealing,
  healingWeb: HealingWeb,
  nutritionGuide: NutritionGuide,
  
  // All Settings Sub-pages
  display: DisplaySettings,
  network: NetworkSettings,
  about: AboutSettings,
  notifications: NotificationsSettings,
  sounds: SoundsSettings,
  cloud_storage: CloudStorageSettings,
  ai_settings: AiSettings,
  accessibility: AccessibilitySettings,
  wallpaper: WallpaperSettings,
  airplane_mode: AirplaneModeSettings,
  wifi: NetworkSettings, // Corrected to use NetworkSettings
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
  // Add mappings for other specific settings if they are not placeholders
  accessibility_main: AccessibilitySettings
};

interface MainContentProps {
  view: string;
  onSetView: (view: string, context?: any) => void;
  viewContext: any;
}

export const MainContent: React.FC<MainContentProps> = ({ view, onSetView, viewContext }) => {
  const ComponentToRender = componentMap[view] || (() => <PlaceholderView viewName={view} onSetView={onSetView} />);

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 relative">
      <ComponentToRender onSetView={onSetView} {...viewContext} />
    </main>
  );
};