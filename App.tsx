
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { LeftSidebar } from './components/Dock';
import { TopBar } from './components/TopBar';
import { mainMenuItems, aetheriusMenuItems } from './data';
import { MenuItemData, WindowState } from './types';
import { FloatingActionButton } from './components/FloatingActionButton';
import { Desktop } from './components/Desktop';
import { WindowFrame } from './components/WindowFrame';
import { Taskbar } from './components/Taskbar';
import { PlaceholderView } from './components/PlaceholderView';

// --- Component Imports for Window Content ---
import { ProductPage } from './components/ProductPage';
import { SocialFeed } from './components/SocialFeed';
import { Elearning } from './components/Elearning';
import { JobSearch } from './components/JobSearch';
import { CvBuilder } from './components/CvBuilder';
import { Marketplace } from './components/Marketplace';
// FIX: Update import to use AIAssistant from AppLauncher.tsx and alias it as AIHub
import { AIAssistant as AIHub } from './components/AppLauncher';
import { SettingsView } from './components/SettingsModal';
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
} from './components/SocialFeed';
import { posts } from './data';
import { Browser } from './components/Browser';
import { SystemArchitecture } from './components/SystemArchitecture';
import { CoreParadigms } from './components/CoreParadigms';
import { VirtualHardware } from './components/VirtualHardware';
import { PersonalAI } from './components/PersonalAI';
import { KnowledgeBase } from './components/KnowledgeBase';
import { Milestones } from './components/Milestones';
import { CADLab } from './components/CADLab';
import { CreationLab } from './components/CreationLab';
import { MyLearning } from './components/MyLearning';
import { CourseDetail } from './components/CourseDetail';
import { BuildChecklist } from './components/BuildChecklist';
import { CreatorMarketplace } from './components/CreatorMarketplace';
import MyProfile from './components/MyProfile';
import { Messenger } from './components/Messenger';
import { Members } from './components/Members';
import { Groups } from './components/Groups';
import { FolderView } from './components/FolderView';
import { AdminPanel } from './components/AdminPanel';
import { AvatarForge } from './components/AvatarForge';
import { SimulationHub } from './components/SimulationHub';
import { VideoEditor } from './components/VideoEditor';
import { GameEngine } from './components/GameEngine';
import { CognitiveFramework } from './components/CognitiveFramework';


// Import new trading components
import { Markets } from './components/trading/Markets';
import { AdvancedChart } from './components/trading/AdvancedChart';
import { Swap } from './components/trading/Swap';
import { Staking } from './components/trading/Staking';
import { Lending } from './components/trading/Lending';
import { CopyTrading } from './components/trading/CopyTrading';
import { TradingBots } from './components/trading/TradingBots';
import { TradingNews } from './components/trading/TradingNews';
import { LearnAndEarn } from './components/trading/LearnAndEarn';
import { CryptoGames } from './components/trading/CryptoGames';
import { Wallet } from './components/trading/Wallet';

// Import new Health & Wellness components
import { HealthHub } from './components/health/HealthHub';
import { BodyComposition } from './components/health/BodyComposition';
import { FrequencyHealing } from './components/health/FrequencyHealing';
import { HealingWeb } from './components/health/HealingWeb';
import { NutritionGuide } from './components/health/NutritionGuide';

// Import new App container components
import { SocialApp } from './components/apps/SocialApp';
import { ProductivityApp } from './components/apps/ProductivityApp';
import { CareersApp } from './components/apps/CareersApp';
import { DevelopmentApp } from './components/apps/DevelopmentApp';
import { MediaApp } from './components/apps/MediaApp';
import { ContentGenApp } from './components/apps/ContentGenApp';
import { EngineeringApp } from './components/apps/EngineeringApp';
import { ECommerceApp } from './components/apps/ECommerceApp';
import { FinanceApp } from './components/apps/FinanceApp';
import { ElearningApp } from './components/apps/ElearningApp';
import { GamingApp } from './components/apps/GamingApp';
import { HealthApp } from './components/apps/HealthApp';
import { AccountApp } from './components/apps/AccountApp';
import { EnterpriseApp } from './components/apps/EnterpriseApp';
import { MouseSettings } from './components/settings/MouseSettings';
import { StylusSettings } from './components/settings/StylusSettings';
import { AiSuiteApp } from './components/apps/AiSuiteApp';

import { loggedInUser } from './data';
import { FolderIcon } from './components/Icons';

// --- App Launching Interface ---
export interface LaunchableApp {
  component: string;
  title: string;
  icon: React.FC<any>;
  context?: any;
}

const FeedView: React.FC<{ onSetView: (view: string, context?:any) => void }> = ({ onSetView }) => (
    <div className="bg-[#fbfbfb] dark:bg-gray-900 min-h-full p-4 sm:p-6 relative">
        <div className="max-w-screen-xl mx-auto">
            <WelcomeBanner />
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start mt-6">
                <aside className="hidden xl:block col-span-1 space-y-6">
                    <BlogWidget />
                    <FollowingWidget />
                </aside>
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


// --- Component Map for rendering window content ---
const componentMap: { [key: string]: React.FC<any> } = {
  // Standalone Apps
  socialFeed: SocialFeed,
  browser: Browser,
  aiHub: AIHub,
  settings: SettingsView,
  messenger: Messenger,
  folderView: FolderView,
  adminPanel: AdminPanel,

  // App Containers
  socialApp: SocialApp,
  productivityApp: ProductivityApp,
  careersApp: CareersApp,
  developmentApp: DevelopmentApp,
  mediaApp: MediaApp,
  contentGenApp: ContentGenApp,
  engineeringApp: EngineeringApp,
  eCommerceApp: ECommerceApp,
  financeApp: FinanceApp,
  elearningApp: ElearningApp,
  gamingApp: GamingApp,
  healthApp: HealthApp,
  accountApp: AccountApp,
  enterpriseApp: EnterpriseApp,
  aiSuite: AiSuiteApp,
  
  // Child components (rendered inside App Containers)
  feedBiome: FeedView,
  productPage: ProductPage,
  courses: Elearning,
  jobSearch: JobSearch,
  cvBuilder: CvBuilder,
  marketplace: Marketplace,
  creatorMarketplace: CreatorMarketplace,
  myLearning: MyLearning,
  courseDetail: CourseDetail,
  instructors: () => <PlaceholderView viewName="Instructors" />,
  systemArchitecture: SystemArchitecture,
  coreParadigms: CoreParadigms,
  virtualHardware: VirtualHardware,
  personalAI: PersonalAI,
  knowledgeBase: KnowledgeBase,
  milestones: Milestones,
  buildChecklist: BuildChecklist,
  cognitiveFramework: CognitiveFramework,
  tritCore: () => <PlaceholderView viewName="Trit Core" />,
  strategicHub: () => <PlaceholderView viewName="Strategic Hub" />,
  capabilities: () => <PlaceholderView viewName="Capabilities" />,
  dataArchive: () => <PlaceholderView viewName="Data Archive" />,
  platformIntegrations: () => <PlaceholderView viewName="Platform Integrations" />,
  systemIntegrity: () => <PlaceholderView viewName="System Integrity" />,
  systemMonitor: () => <PlaceholderView viewName="System Monitor" />,
  members: Members,
  groups: Groups,
  forums: () => <PlaceholderView viewName="Forums" />,
  events: () => <PlaceholderView viewName="Events" />,
  mail: () => <PlaceholderView viewName="Mail" />,
  commsHub: () => <PlaceholderView viewName="Comms Hub" />,
  codeEditor: () => <PlaceholderView viewName="Code Editor" />,
  websiteBuilder: () => <PlaceholderView viewName="Website Builder" />,
  gameEngine: GameEngine,
  cadDesign: () => <PlaceholderView viewName="CAD Design" />,
  photoEditor: () => <PlaceholderView viewName="Photo Editor" />,
  videoEditor: VideoEditor,
  musicProduction: () => <CreationLab type="Music"/>,
  videoProduction: () => <CreationLab type="Video"/>,
  imageEditing: () => <CreationLab type="Image"/>,
  contentCreation: () => <CreationLab type="Content"/>,
  articleWriter: () => <PlaceholderView viewName="Article Writer" />,
  scriptGenerator: () => <PlaceholderView viewName="Script Generator" />,
  slideDeckDesigner: () => <PlaceholderView viewName="Slide Deck Designer" />,
  slideMatrix: () => <PlaceholderView viewName="Slide Matrix" />,
  notes: () => <PlaceholderView viewName="Notes" />,
  translate: () => <PlaceholderView viewName="Translate" />,
  fileExplorer: () => <PlaceholderView viewName="File Explorer" />,
  engineering: () => <PlaceholderView viewName="Engineering" />,
  genesisForge: () => <PlaceholderView viewName="Genesis Forge" />,
  avatarForge: AvatarForge,
  engineeringHub: () => <PlaceholderView viewName="Engineering Hub" />,
  simulationHub: SimulationHub,
  videoHub: VideoEditor,
  videoEditingSuite: VideoEditor,
  gameDevSuite: () => <PlaceholderView viewName="Game Dev Suite" />,
  documents: () => <PlaceholderView viewName="Documents" />,
  calendar: () => <PlaceholderView viewName="Calendar" />,
  taskHub: () => <PlaceholderView viewName="taskHub" />,
  cadLab: CADLab,
  myProfile: MyProfile,
  healthHub: HealthHub,
  bodyComposition: BodyComposition,
  frequencyHealing: FrequencyHealing,
  healingWeb: HealingWeb,
  nutritionGuide: NutritionGuide,
  // Trading Platform Components
  tradingMarkets: Markets,
  tradingAdvancedChart: AdvancedChart,
  tradingSwap: Swap,
  tradingStaking: Staking,
  tradingLending: Lending,
  tradingCopy: CopyTrading,
  tradingBots: TradingBots,
  tradingNews: TradingNews,
  tradingLearn: LearnAndEarn,
  tradingGames: CryptoGames,
  tradingWallet: Wallet,
  blockchainHub: () => <PlaceholderView viewName="Blockchain Hub" />,
  // Enterprise Suite Components
  crm: () => <PlaceholderView viewName="Customer Relationship Management (CRM)" />,
  erp: () => <PlaceholderView viewName="Enterprise Resource Planning (ERP)" />,
  scm: () => <PlaceholderView viewName="Supply Chain Management (SCM)" />,
  hcm: () => <PlaceholderView viewName="Human Capital Management (HCM)" />,
  ppm: () => <PlaceholderView viewName="Project & Portfolio Management (PPM)" />,
  fsm: () => <PlaceholderView viewName="Field Service Management (FSM)" />,
  bpm: () => <PlaceholderView viewName="Business Process Management (BPM)" />,
  // Gaming & Personal
  gamingHub: () => <PlaceholderView viewName="Gaming Hub" />,
  myLibrary: () => <PlaceholderView viewName="My Library" />,
  linkedDevices: () => <PlaceholderView viewName="Linked Devices" />,
  help: () => <PlaceholderView viewName="Help & Support" />,
  trackpad_mouse: MouseSettings,
  stylus: StylusSettings,
};


const App: React.FC = () => {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [zIndexCounter, setZIndexCounter] = useState(10);
  const [zoom, setZoom] = useState(1);

  const mainRef = useRef<HTMLElement>(null);
  const [desktopRect, setDesktopRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    const resizeObserver = new ResizeObserver(() => {
        setDesktopRect(mainEl.getBoundingClientRect());
    });
    resizeObserver.observe(mainEl);
    setDesktopRect(mainEl.getBoundingClientRect());

    return () => resizeObserver.disconnect();
  }, [isLeftSidebarOpen]); // Re-calculate when sidebar toggles

  const handleZoom = (newZoom: number) => {
    setZoom(Math.max(0.25, Math.min(newZoom, 5)));
  };

  const focusWindow = useCallback((id: string) => {
    if (id === activeWindowId) return;
    setZIndexCounter(prev => prev + 1);
    setWindows(prev => prev.map(win => 
      win.id === id 
        ? { ...win, zIndex: zIndexCounter + 1, isMinimized: false } 
        : win
    ));
    setActiveWindowId(id);
  }, [activeWindowId, zIndexCounter]);

  const launchApp = useCallback((app: LaunchableApp) => {
    let existingWindow;
    // Special check for folders to allow multiple different folders, but not duplicates of the same folder
    if (app.component === 'folderView' && app.context?.folder?.id) {
        existingWindow = windows.find(win => 
            win.component === 'folderView' && 
            win.context?.folder?.id === app.context.folder.id
        );
    } else {
        existingWindow = windows.find(win => win.component === app.component);
    }

    if (existingWindow) {
        focusWindow(existingWindow.id);
        return;
    }

    const newZIndex = zIndexCounter + 1;
    const newWindow: WindowState = {
      id: `${app.component}-${app.context?.folder?.id || ''}-${Date.now()}`,
      title: app.title,
      icon: app.icon || FolderIcon,
      component: app.component,
      context: app.context,
      position: { x: Math.random() * 200 + 150, y: Math.random() * 150 + 100 },
      size: { width: 800, height: 600 },
      zIndex: newZIndex,
      isMaximized: false,
      isMinimized: false,
    };
    
    setZIndexCounter(newZIndex);
    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
  }, [windows, zIndexCounter, focusWindow]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(win => win.id !== id));
    if (id === activeWindowId) {
        // Find next best window to activate
        const remainingWindows = windows.filter(win => win.id !== id && !win.isMinimized);
        if (remainingWindows.length > 0) {
            const topWindow = remainingWindows.sort((a,b) => b.zIndex - a.zIndex)[0];
            setActiveWindowId(topWindow.id);
        } else {
            setActiveWindowId(null);
        }
    }
  }, [windows, activeWindowId]);
  
  const minimizeWindow = useCallback((id: string) => {
      setWindows(prev => prev.map(win => win.id === id ? { ...win, isMinimized: true } : win));
      if (id === activeWindowId) {
        // Activate next window
        const otherWindows = windows.filter(win => win.id !== id && !win.isMinimized);
        if (otherWindows.length > 0) {
            const topWindow = otherWindows.sort((a,b) => b.zIndex - a.zIndex)[0];
            setActiveWindowId(topWindow.id);
        } else {
             setActiveWindowId(null);
        }
      }
  }, [activeWindowId, windows]);
  
  const updateWindow = useCallback((id: string, updates: Partial<WindowState>) => {
    setWindows(prev => prev.map(win => {
        if (win.id === id) {
            const newWin = { ...win, ...updates };

            if (desktopRect && !newWin.isMaximized) {
                // Clamp position
                if (newWin.position) {
                    newWin.position.x = Math.max(0, Math.min(newWin.position.x, desktopRect.width - newWin.size.width));
                    newWin.position.y = Math.max(0, Math.min(newWin.position.y, desktopRect.height - newWin.size.height));
                }
            }
            return newWin;
        }
        return win;
    }));
  }, [desktopRect]);

  const renderWindowContent = useCallback((win: WindowState) => {
    const ComponentToRender = componentMap[win.component] || (() => <PlaceholderView viewName={win.component} />);
    return <ComponentToRender onSetView={launchApp} context={win.context} launchApp={launchApp}/>;
  }, [launchApp]);

  const findActiveMainMenu = (items: MenuItemData[], view: string): MenuItemData | null => {
    const activeWindow = windows.find(w => w.id === activeWindowId);
    if (!activeWindow) return null;
    const componentToFind = activeWindow.component;

    let parentMatch: MenuItemData | null = null;
    let directMatch: MenuItemData | null = null;
    
    const find = (currentItems: MenuItemData[], parent: MenuItemData | null) => {
        for (const item of currentItems) {
            if (item.component === componentToFind) {
                if (!parent) directMatch = item;
                else parentMatch = parent;
            }
            if (item.children && !parentMatch) find(item.children, item);
            if (parentMatch) break;
        }
    };
    find(items, null);
    return parentMatch || directMatch;
  };
  
  const activeMainMenu = findActiveMainMenu(mainMenuItems, '');
  const contextualActions = activeMainMenu?.children || [];

  return (
    <div className="h-screen w-screen bg-background-dark text-content-light dark:text-content-dark font-sans flex flex-col overflow-hidden">
        <TopBar 
            toggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            onLaunchApp={launchApp}
            contextualActions={contextualActions}
            aetheriusMenu={aetheriusMenuItems}
            zoom={zoom}
            onZoom={handleZoom}
        />
        
        <div className="flex flex-1 overflow-hidden relative">
            <FloatingActionButton 
                onLaunchAi={() => launchApp({ component: 'aiHub', title: 'AI Hub', icon: mainMenuItems.find(i => i.component === 'aiHub')?.icon! })}
                showCart={true}
            />
            <LeftSidebar 
                isOpen={isLeftSidebarOpen} 
                onLaunchApp={launchApp} 
            />
            
            {/* Window Container */}
            <main ref={mainRef} className="flex-1 overflow-auto relative">
                <div 
                  className="relative transition-transform duration-200"
                  style={{ 
                    width: '100%',
                    height: '100%',
                    transform: `scale(${zoom})`, 
                    transformOrigin: 'top left' 
                  }}
                >
                     <Desktop launchApp={launchApp} wallpaperUrl={loggedInUser.coverImageUrl} />
                     {windows.filter(w => !w.isMinimized).map(win => (
                        <WindowFrame
                            key={win.id}
                            windowState={win}
                            onClose={closeWindow}
                            onFocus={focusWindow}
                            onMinimize={minimizeWindow}
                            onUpdate={updateWindow}
                            isActive={win.id === activeWindowId}
                            desktopRect={desktopRect ? new DOMRect(0, 0, desktopRect.width / zoom, desktopRect.height / zoom) : null}
                        >
                            <div className="w-full h-full bg-background-light dark:bg-gray-800/50">
                                {renderWindowContent(win)}
                            </div>
                        </WindowFrame>
                    ))}
                </div>
            </main>
        </div>
        
        <Taskbar
            windows={windows}
            onFocus={focusWindow}
            activeWindowId={activeWindowId}
        />
    </div>
  );
};

export default App;
