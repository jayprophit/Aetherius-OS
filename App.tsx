
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { LeftSidebar } from './components/Dock';
import { TopBar } from './components/TopBar';
import { menuGroups, aetheriusMenuItems, loggedInUser as initialUser, desktopItems } from './data';
import { MenuItemData, WindowState, MenuGroup, SystemIdentity, TaskbarConfig, AppItem, ViewMode, SystemLocale } from './types';
import { FloatingActionButton } from './components/FloatingActionButton';
import { Desktop } from './components/Desktop';
import { MobileHome } from './components/MobileHome';
import { WindowFrame } from './components/WindowFrame';
import { Taskbar } from './components/Taskbar';
import { PlaceholderView } from './components/PlaceholderView';
import { GyeNyameIcon, ArrowRightIcon, FingerPrintIcon, Cog6ToothIcon, ChevronLeftIcon, ComputerDesktopIcon } from './components/Icons';
import { OnboardingWizard } from './components/OnboardingWizard';
import { CartDrawer } from './components/CartDrawer';
import { CommandPalette } from './components/CommandPalette';
import { NotificationCenter } from './components/NotificationCenter';

// --- Component Imports for Window Content ---
import { ProductPage } from './components/ProductPage';
import { SocialFeed } from './components/SocialFeed';
import { AetheriusAI_Assistant } from './components/AetherAIAssistant';
import { AIAssistant as AIHub } from './components/AppLauncher'; 
import { Browser } from './components/Browser';
import { Messenger } from './components/Messenger';
import { SettingsView } from './components/SettingsModal';
import { FolderView } from './components/FolderView';
import { AetherialNetworksPricing } from './components/Window';
import MyProfile from './components/MyProfile';
import { Members } from './components/Members';
import { Groups } from './components/Groups';
import { Marketplace } from './components/Marketplace';
import { CreatorMarketplace } from './components/CreatorMarketplace';
import { JobSearch } from './components/JobSearch';
import { CvBuilder } from './components/CvBuilder';
import { SystemArchitecture } from './components/SystemArchitecture';
import { CognitiveFramework } from './components/CognitiveFramework';
import { RepoStructureView } from './components/RepoStructureView';
import { PDFExporter } from './components/PDFExporter';
import { KnowledgeBase } from './components/KnowledgeBase';
import { Milestones } from './components/Milestones';
import { BuildChecklist } from './components/BuildChecklist';
import { GameEngine } from './components/GameEngine';
import { ECommercePlatforms } from './components/ECommercePlatforms';
import { ElearningPlatforms } from './components/ElearningPlatforms';
import { LearningRealms } from './components/LearningRealms';
import { ContractExplorer } from './components/ContractExplorer';
import { ManuscriptView } from './components/ManuscriptView';
import { Firewall } from './components/Firewall';
import { VirtualAccelerator } from './components/VirtualAccelerator';
import { SystemRecommendations } from './components/SystemRecommendations';
import { InfrastructureControl } from './components/InfrastructureControl';
import { VirtualRigBuilder } from './components/VirtualRigBuilder';
import { DigitalTwinEngine } from './components/DigitalTwinEngine';
import { QuantumNeuralNetwork } from './components/QuantumNeuralNetwork';
import { HuggingFaceModelHub } from './components/HuggingFaceModelHub';
import { QuantumDNACore } from './components/QuantumDNACore';
import { MemoryNode } from './components/MemoryNode';
import { Terminal } from './components/apps/Terminal';
import { Hypervisor } from './components/apps/Hypervisor';
import { SystemRequirements } from './components/SystemRequirements'; 
import { RoboticsControl } from './components/RoboticsControl';
import { GovernancePortal } from './components/GovernancePortal';
import { NanoFabricator } from './components/NanoFabricator';
import { GuestOS } from './components/apps/GuestOS';
import { CloudOpsApp } from './components/apps/CloudOpsApp';
import { SystemAudit } from './components/SystemAudit';
import { EnterpriseDashboard } from './components/business/EnterpriseDashboard';

// New Utility Apps
import { FileManager } from './components/apps/FileManager';
import { TaskManager } from './components/apps/TaskManager';
import { ServiceRegistry } from './components/apps/ServiceRegistry';
import { Calculator } from './components/apps/Calculator';
import { Notepad } from './components/apps/Notepad';
import { SystemMonitor } from './components/apps/SystemMonitor';

// New Advanced Components
import { QuantumCircuitDesigner } from './components/quantum/QuantumCircuitDesigner';
import { AIOpsMonitor } from './components/ops/AIOpsMonitor';
import { IoTMap } from './components/iot/IoTMap';
import { SheetEditor } from './components/SheetEditor';
import { PhotoEditor } from './components/PhotoEditor';
import { MediaPlayer } from './components/MediaPlayer';
import { CodeIDE } from './components/CodeIDE';
import { OmniVisualBuilder } from './components/apps/OmniVisualBuilder';

// App Containers
import { SocialApp } from './components/apps/SocialApp';
import { ProductivityApp } from './components/apps/ProductivityApp';
import { CareersApp } from './components/apps/CareersApp';
import { EnterpriseApp } from './components/apps/EnterpriseApp';
import { DevelopmentApp } from './components/apps/DevelopmentApp';
import { MediaApp } from './components/apps/MediaApp';
import { ContentGenApp } from './components/apps/ContentGenApp';
import { EngineeringApp } from './components/apps/EngineeringApp';
import { ECommerceApp } from './components/apps/ECommerceApp';
import { AppMarketApp } from './components/apps/AppMarketApp';
import { FinanceApp } from './components/apps/FinanceApp';
import { ElearningApp } from './components/apps/ElearningApp';
import { GamingApp } from './components/apps/GamingApp';
import { HealthApp } from './components/apps/HealthApp';
import { AccountApp } from './components/apps/AccountApp';
import { RD_HubApp } from './components/apps/RD_HubApp';
import { AiSuiteApp } from './components/apps/AiSuiteApp';
import { OmniPlatformApp } from './components/apps/OmniPlatformApp'; 
import { AiProductivityPlatform } from './components/apps/AiProductivityPlatform';
import { QuantumLabApp } from './components/apps/QuantumLabApp';
import { OperationsCenterApp } from './components/apps/OperationsCenterApp';

// Sub-views
import { CourseDetail } from './components/CourseDetail';
import { MyLearning, LearningAssistant, Achievements } from './components/MyLearning';
import { SparkIsland, ExplorerAcademy, InnovatorsForge, ScholarsNexus, LuminaryLabs } from './components/Elearning';
import { AiSupportAvatar } from './components/AiSupportAvatar';
import { NetworkOrchestrator } from './components/NetworkOrchestrator';
import { BlockchainExplorer } from './components/BlockchainExplorer';
import { TrainingDataHub } from './components/TrainingDataHub';
import { AiWorkforceOrchestrator } from './components/AiWorkforceOrchestrator';
import { AvatarForge } from './components/AvatarForge';
import { SimulationHub } from './components/SimulationHub';
import { VideoEditor } from './components/VideoEditor';
import { BodyComposition } from './components/health/BodyComposition';
import { FrequencyHealing } from './components/health/FrequencyHealing';
import { HealingWeb } from './components/health/HealingWeb';
import { NutritionGuide } from './components/health/NutritionGuide';
import { HealthHub } from './components/health/HealthHub';
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
import { AdminPanel } from './components/AdminPanel';

export interface LaunchableApp {
  component: string;
  title: string;
  icon: React.FC<any>;
  context?: any;
}

const SafePlaceholder = (props: any) => <PlaceholderView viewName={props.viewName || 'Application'} />;

const componentMap: { [key: string]: React.FC<any> } = {
  // Main Apps
  socialFeed: SocialFeed,
  productPage: ProductPage,
  browser: Browser,
  aiHub: AIHub,
  messenger: Messenger,
  messaging: Messenger, // Consolidate duplicate
  settings: SettingsView,
  folderView: FolderView,
  
  // Utilities
  fileManager: FileManager,
  taskManager: TaskManager,
  systemMonitor: SystemMonitor,
  serviceRegistry: ServiceRegistry,
  calculator: Calculator,
  notepad: Notepad,
  sheetEditor: SheetEditor,
  photoEditor: PhotoEditor,
  mediaPlayer: MediaPlayer,
  terminal: Terminal,
  
  // Specialized Editors
  codeEditor: CodeIDE,
  websiteBuilder: ({ onSetView }: any) => <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900"><OmniVisualBuilder onExit={() => onSetView('dashboard')} /></div>,
  videoEditor: VideoEditor,

  // App Containers (Super Apps)
  socialApp: SocialApp,
  productivityApp: ProductivityApp,
  careersApp: CareersApp,
  enterpriseApp: EnterpriseApp,
  developmentApp: DevelopmentApp,
  mediaApp: MediaApp,
  contentGenApp: ContentGenApp,
  engineeringApp: EngineeringApp,
  eCommerceApp: ECommerceApp,
  appMarket: AppMarketApp,
  financeApp: FinanceApp,
  elearningApp: ElearningApp,
  gamingApp: GamingApp,
  healthApp: HealthApp,
  accountApp: AccountApp,
  rdHub: RD_HubApp,
  aiSuite: AiSuiteApp, // GenAI Studio
  omniPlatform: OmniPlatformApp,
  aiProductivityPlatform: AiProductivityPlatform, // Tool Catalog
  quantumLabApp: QuantumLabApp,
  opsCenterApp: OperationsCenterApp,

  // Sub-Components & Views
  enterpriseDashboard: EnterpriseDashboard,
  aetherialNetworks: AetherialNetworksPricing,
  myProfile: MyProfile,
  members: Members,
  groups: Groups,
  marketplace: Marketplace,
  creatorMarketplace: CreatorMarketplace,
  jobSearch: JobSearch,
  cvBuilder: CvBuilder,
  systemArchitecture: SystemArchitecture,
  cognitiveFramework: CognitiveFramework,
  repoStructure: RepoStructureView,
  pdfExporter: PDFExporter,
  knowledgeBase: KnowledgeBase,
  milestones: Milestones,
  buildChecklist: BuildChecklist,
  gameEngine: GameEngine,
  adminPanel: AdminPanel,
  eCommercePlatforms: ECommercePlatforms,
  elearningPlatforms: ElearningPlatforms,
  learningRealms: LearningRealms,
  contractExplorer: ContractExplorer,
  manuscriptView: ManuscriptView,
  firewall: Firewall,
  virtualAccelerator: VirtualAccelerator,
  projectAdvisor: SystemRecommendations,
  engineeringHub: InfrastructureControl,
  rigBuilder: VirtualRigBuilder,
  digitalTwinSim: DigitalTwinEngine,
  hypervisor: Hypervisor,
  guestOS: GuestOS,
  systemRequirements: SystemRequirements,
  systemAudit: SystemAudit,
  roboticsControl: RoboticsControl,
  governance: GovernancePortal,
  nanoFab: NanoFabricator,
  cloudOps: CloudOpsApp,
  circuitDesigner: QuantumCircuitDesigner,
  aiOps: AIOpsMonitor,
  iotManager: IoTMap,
  
  // Learning Sub-views
  courseDetail: CourseDetail,
  myLearning: MyLearning,
  learningAssistant: LearningAssistant,
  achievements: Achievements,
  sparkIsland: SparkIsland,
  explorerAcademy: ExplorerAcademy,
  innovatorsForge: InnovatorsForge,
  scholarsNexus: ScholarsNexus,
  luminaryLabs: LuminaryLabs,

  // AI & Research
  aiSupportAvatar: AiSupportAvatar,
  networkOrchestrator: NetworkOrchestrator,
  blockchainHub: BlockchainExplorer,
  trainingDataHub: TrainingDataHub,
  aiWorkforce: AiWorkforceOrchestrator,
  avatarForge: AvatarForge,
  simulationHub: SimulationHub,
  huggingFaceHub: HuggingFaceModelHub,
  quantumNN: QuantumNeuralNetwork,
  quantumDNACore: QuantumDNACore,
  memoryNode: MemoryNode,

  // Health Sub-views
  healthHub: HealthHub,
  bodyComposition: BodyComposition,
  frequencyHealing: FrequencyHealing,
  healingWeb: HealingWeb,
  nutritionGuide: NutritionGuide,
  
  // Finance Sub-views
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
  
  placeholder: SafePlaceholder,
};

const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 3000); 
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white z-[9999]">
            <div className="animate-pulse mb-8">
                <GyeNyameIcon className="w-24 h-24 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-widest mb-4">AETHERIUS OS</h1>
            <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite] w-full origin-left scale-x-0"></div>
            </div>
            <style>{`
                @keyframes loading {
                    0% { transform: scaleX(0); }
                    50% { transform: scaleX(0.7); }
                    100% { transform: scaleX(1); }
                }
            `}</style>
        </div>
    );
};

const LoginScreen: React.FC<{ onLogin: () => void, user: typeof initialUser }> = ({ onLogin, user }) => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            onLogin();
        }, 1000);
    };

    const handleBioScan = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            onLogin();
        }, 2500);
    };

    return (
        <div 
            className="h-screen w-screen bg-cover bg-center flex items-center justify-center z-[9998]"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=2070&auto-format=fit-crop)' }}
        >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-md"></div>
            
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center text-center animate-fade-in-up">
                <img 
                    src={user.avatarUrl || ''} 
                    alt={user.name} 
                    className="w-24 h-24 rounded-full border-4 border-white/20 mb-4 shadow-lg object-cover"
                />
                <h2 className="text-2xl font-bold text-white mb-2">{user.name}</h2>
                
                <form onSubmit={handleLogin} className="w-full space-y-3">
                    <div className="relative">
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-primary/80 hover:bg-primary text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                        ) : (
                            <>Sign In <ArrowRightIcon className="w-4 h-4" /></>
                        )}
                    </button>
                </form>
                
                <button 
                    onClick={handleBioScan}
                    className="w-full mt-4 bg-gradient-to-r from-blue-600/50 to-purple-600/50 border border-white/10 p-3 rounded-lg flex items-center justify-center gap-2 hover:from-blue-600/70 hover:to-purple-600/70 transition-all group"
                >
                    <FingerPrintIcon className="w-6 h-6 text-blue-300 group-hover:text-white" />
                    <span className="text-sm text-blue-100 group-hover:text-white">Biometric Identity Scan</span>
                </button>
            </div>
        </div>
    );
};

const SKIP_ONBOARDING = true;

const App: React.FC = () => {
  const [systemState, setSystemState] = useState<'boot' | 'login' | 'desktop'>('boot');
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  
  // View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [mobileActiveApp, setMobileActiveApp] = useState<LaunchableApp | null>(null);
  
  // System Locale & Time
  const [systemLocale, setSystemLocale] = useState<SystemLocale>({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
    location: null,
    isAuto: true
  });

  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const nextZIndex = useRef(100);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false); 
  const [zoom, setZoom] = useState(1);
  const [wallpaper, setWallpaper] = useState<string>('https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=2070&auto-format=fit-crop');
  const [accentColor, setAccentColor] = useState<string>('#3b82f6'); // Default blue-500
  const [pinnedAppIds, setPinnedAppIds] = useState<string[]>(['my-computer', 'browser', 'messenger', 'ai-productivity', 'terminal']);
  
  const [activeWorkspace, setActiveWorkspace] = useState(0);
  const [taskbarConfig, setTaskbarConfig] = useState<TaskbarConfig>({
      position: 'bottom',
      alignment: 'start',
      color: 'bg-gray-900/80',
      transparency: 80,
      showLabels: false
  });

  const desktopRef = useRef<HTMLDivElement>(null);
  const [desktopRect, setDesktopRect] = useState<DOMRect | null>(null);

  useEffect(() => {
      const onboarded = localStorage.getItem('aetherius_onboarded') === 'true';
      setHasOnboarded(onboarded);
      
      const savedUser = localStorage.getItem('aetherius_user');
      if (savedUser) {
          try {
              setCurrentUser(JSON.parse(savedUser));
          } catch(e) { console.error("Failed to load user", e); }
      }

      const savedPinned = localStorage.getItem('aetherius_pinned_apps');
      if (savedPinned) {
          try { setPinnedAppIds(JSON.parse(savedPinned)); } catch(e){}
      }
      
      const savedWallpaper = localStorage.getItem('aetherius_wallpaper');
      if (savedWallpaper) {
          setWallpaper(savedWallpaper);
      }

      const savedAccent = localStorage.getItem('aetherius_accent');
      if (savedAccent) {
          setAccentColor(savedAccent);
      }

      const savedViewMode = localStorage.getItem('aetherius_viewMode');
      if (savedViewMode === 'mobile' || savedViewMode === 'desktop') {
          setViewMode(savedViewMode);
      }
  }, []);

  // System Locale Detection
  useEffect(() => {
    // Infer city from timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const city = tz.split('/')[1]?.replace(/_/g, ' ') || 'Unknown';
    
    setSystemLocale(prev => ({
        ...prev,
        timezone: tz,
        location: { city: city, country: '' } 
    }));

    // Attempt precise geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
             setSystemLocale(prev => ({
                 ...prev,
                 location: { ...prev.location!, lat: pos.coords.latitude, lng: pos.coords.longitude }
             }))
        }, (err) => {
            console.log("Geo permission denied or error", err);
        });
    }
  }, []);

  const handleSetWallpaper = (url: string) => {
      setWallpaper(url);
      localStorage.setItem('aetherius_wallpaper', url);
  };

  const bringToFront = (id: string) => {
    nextZIndex.current += 1;
    return nextZIndex.current;
  };
  
  const focusWindow = useCallback((id: string) => {
    const win = windows.find(w => w.id === id);
    if (win && win.workspace !== activeWorkspace) {
        setActiveWorkspace(win.workspace);
    }
    setWindows(windows => windows.map(w => w.id === id ? { ...w, zIndex: bringToFront(id), isMinimized: false } : w));
    setActiveWindowId(id);
  }, [windows, activeWorkspace]);

  const launchApp = useCallback((app: LaunchableApp) => {
    if (viewMode === 'mobile') {
        setMobileActiveApp(app);
        return;
    }

    const existingWindow = windows.find(w => w.component === app.component);
    if (existingWindow) {
      if (existingWindow.isMinimized) {
          setWindows(prev => prev.map(w => w.id === existingWindow.id ? { ...w, isMinimized: false, zIndex: bringToFront(existingWindow.id) } : w));
          setActiveWindowId(existingWindow.id);
          if(existingWindow.workspace !== activeWorkspace) setActiveWorkspace(existingWindow.workspace);
      } else {
          focusWindow(existingWindow.id);
      }
      return;
    }
    
    const newWindow: WindowState = {
      id: `${app.component}-${Date.now()}`,
      title: app.title,
      icon: app.icon,
      component: app.component,
      context: { ...app.context, setWallpaper: handleSetWallpaper, setTaskbarConfig, setAccentColor, systemLocale },
      position: { x: Math.random() * 50 + 50, y: Math.random() * 50 + 50 },
      size: { width: 1000, height: 700 },
      zIndex: bringToFront(`${app.component}-${Date.now()}`),
      isMaximized: false,
      isMinimized: false,
      workspace: activeWorkspace,
    };
    
    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
  }, [windows, activeWorkspace, focusWindow, viewMode, systemLocale]);

  const closeWindow = (id: string) => {
    setWindows(windows => windows.filter(w => w.id !== id));
    if (activeWindowId === id) {
        const remainingWindows = windows.filter(w => w.id !== id && !w.isMinimized && w.workspace === activeWorkspace);
        if (remainingWindows.length > 0) {
            const topWindow = remainingWindows.reduce((prev, current) => (prev.zIndex > current.zIndex) ? prev : current);
            setActiveWindowId(topWindow.id);
        } else {
            setActiveWindowId(null);
        }
    }
  };

  // Global Keyboard Listeners
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Command+K or Ctrl+K for Palette
          if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
              e.preventDefault();
              setIsCommandPaletteOpen(prev => !prev);
          }
          
          // Cmd/Ctrl + E for File Explorer
          if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
              e.preventDefault();
              launchApp({ component: 'fileManager', title: 'My Computer', icon: ComputerDesktopIcon });
          }

          // Cmd/Ctrl + / for AI Assistant
          if ((e.metaKey || e.ctrlKey) && e.key === '/') {
              e.preventDefault();
              launchApp({ component: 'aiHub', title: 'AI Hub', icon: GyeNyameIcon });
          }
          
          // Cmd/Ctrl + Q to close active window
          if ((e.metaKey || e.ctrlKey) && e.key === 'q') {
              e.preventDefault();
              if (activeWindowId) {
                  closeWindow(activeWindowId);
              }
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWindowId, launchApp]);

  const handleOnboardingComplete = (identity: SystemIdentity, avatarUrl: string) => {
      const newUser = {
          ...currentUser,
          name: identity.governmentName || 'User',
          avatarUrl: avatarUrl,
          systemIdentity: identity
      };
      setCurrentUser(newUser);
      localStorage.setItem('aetherius_user', JSON.stringify(newUser));
      localStorage.setItem('aetherius_onboarded', 'true');
      setHasOnboarded(true);
  };

  const togglePinApp = (appId: string) => {
      let newPinned;
      if (pinnedAppIds.includes(appId)) {
          newPinned = pinnedAppIds.filter(id => id !== appId);
      } else {
          newPinned = [...pinnedAppIds, appId];
      }
      setPinnedAppIds(newPinned);
      localStorage.setItem('aetherius_pinned_apps', JSON.stringify(newPinned));
  };

  const handleToggleViewMode = () => {
      const newMode = viewMode === 'desktop' ? 'mobile' : 'desktop';
      setViewMode(newMode);
      localStorage.setItem('aetherius_viewMode', newMode);
  };

  useEffect(() => {
    if (desktopRef.current) {
      setDesktopRect(desktopRef.current.getBoundingClientRect());
    }
    const handleResize = () => {
      if (desktopRef.current) {
        setDesktopRect(desktopRef.current.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const minimizeWindow = (id: string) => {
    setWindows(windows => windows.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    if(id === activeWindowId) {
        const otherWindows = windows.filter(w => w.id !== id && !w.isMinimized && w.workspace === activeWorkspace);
        if (otherWindows.length > 0) {
            const topWindow = otherWindows.reduce((prev, current) => (prev.zIndex > current.zIndex) ? prev : current);
            setActiveWindowId(topWindow.id);
        } else {
            setActiveWindowId(null);
        }
    }
  };

  const updateWindow = (id: string, updates: Partial<WindowState>) => {
    setWindows(windows => windows.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const renderWindowContent = (win: WindowState) => {
      const Component = componentMap[win.component] || componentMap['placeholder'];
      if (typeof Component !== 'function') return <SafePlaceholder viewName={win.title + " (Error)"} />;

      const props: any = {
          onSetView: (view: string, context: any) => launchApp({ component: view, title: view, icon: () => null, context }),
          context: win.context,
          launchApp: launchApp,
          onClose: () => closeWindow(win.id),
          setWallpaper: handleSetWallpaper,
          setTaskbarConfig,
          setAccentColor,
          systemLocale
      };
      
      if (win.component === 'placeholder') {
        props.viewName = win.title;
      }
      
      return <Component {...props} />;
  }

  const renderMobileAppContent = (app: LaunchableApp) => {
       const Component = componentMap[app.component] || componentMap['placeholder'];
       if (typeof Component !== 'function') return <SafePlaceholder viewName={app.title + " (Error)"} />;

       const props: any = {
          onSetView: (view: string, context: any) => launchApp({ component: view, title: view, icon: () => null, context }),
          context: app.context,
          launchApp: launchApp,
          onClose: () => setMobileActiveApp(null),
          setWallpaper: handleSetWallpaper,
          setTaskbarConfig,
          setAccentColor,
          systemLocale
      };
      
      if (app.component === 'placeholder') {
        props.viewName = app.title;
      }

      return <Component {...props} />;
  }

  if (systemState === 'boot') {
      return <BootScreen onComplete={() => setSystemState('login')} />;
  }

  if (systemState === 'login') {
      return <LoginScreen onLogin={() => setSystemState('desktop')} user={currentUser} />;
  }

  if (!hasOnboarded && !SKIP_ONBOARDING) {
      return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  const visibleWindows = windows.filter(w => !w.isMinimized && w.workspace === activeWorkspace);
  const isHorizontal = taskbarConfig.position === 'bottom' || taskbarConfig.position === 'top';
  const flexDir = isHorizontal ? 'flex-col' : 'flex-row';
  
  // Calculate layout classes based on taskbar position
  let mainContainerClass = 'flex-1 flex relative overflow-hidden';
  let taskbarContainerClass = 'z-50';
  
  if (taskbarConfig.position === 'top') {
      mainContainerClass += ' flex-col';
      taskbarContainerClass += ' h-12 w-full order-first';
  } else if (taskbarConfig.position === 'bottom') {
      mainContainerClass += ' flex-col';
      taskbarContainerClass += ' h-12 w-full order-last';
  } else if (taskbarConfig.position === 'left') {
      mainContainerClass += ' flex-row';
      taskbarContainerClass += ' w-16 h-full order-first';
  } else if (taskbarConfig.position === 'right') {
      mainContainerClass += ' flex-row';
      taskbarContainerClass += ' w-16 h-full order-last';
  }

  return (
    <div 
        className={`h-screen w-screen bg-background-light dark:bg-background-dark text-content-light dark:text-content-dark font-sans overflow-hidden flex flex-col animate-fade-in transition-colors duration-300`} 
        style={{ zoom, '--color-primary': accentColor } as any}
    >
      {/* Inject dynamic accent color styles */}
      <style>{`
        :root { --color-primary: ${accentColor}; }
        .text-primary { color: var(--color-primary) !important; }
        .bg-primary { background-color: var(--color-primary) !important; }
        .border-primary { border-color: var(--color-primary) !important; }
        .ring-primary { --tw-ring-color: var(--color-primary) !important; }
      `}</style>
      
      {/* Top Bar (Only visible if taskbar isn't at the top, or we can allow both) */}
      {taskbarConfig.position !== 'top' && (
          <div className="flex-shrink-0 z-20">
            <TopBar 
              toggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} 
              onLaunchApp={launchApp} 
              contextualActions={[]} 
              aetheriusMenu={aetheriusMenuItems}
              zoom={zoom}
              onZoom={setZoom}
              onOpenCart={() => setIsCartOpen(true)}
              viewMode={viewMode}
              onToggleViewMode={handleToggleViewMode}
              onToggleNotifications={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
              systemLocale={systemLocale}
            />
          </div>
      )}

      <div className={mainContainerClass}>
          {viewMode === 'desktop' ? (
            <>
               {/* Taskbar */}
              <div className={taskbarContainerClass}>
                 <Taskbar 
                    windows={windows}
                    pinnedAppIds={pinnedAppIds}
                    onFocus={focusWindow} 
                    activeWindowId={activeWindowId} 
                    activeWorkspace={activeWorkspace}
                    onSwitchWorkspace={setActiveWorkspace}
                    config={taskbarConfig}
                    onLaunchApp={launchApp}
                    onTogglePin={togglePinApp}
                    systemLocale={systemLocale}
                />
              </div>

              {/* Main Desktop Area */}
              <div className="flex-1 relative flex flex-row overflow-hidden">
                   {/* Dock Sidebar (optional) */}
                   {taskbarConfig.position !== 'left' && (
                       <LeftSidebar isOpen={isLeftSidebarOpen} onLaunchApp={launchApp} menuGroups={menuGroups} />
                   )}
                   
                   <main className="flex-1 relative" ref={desktopRef}>
                      <Desktop 
                        launchApp={launchApp} 
                        wallpaperUrl={wallpaper} 
                        systemLocale={systemLocale}
                      />
                      {visibleWindows.map(win => (
                        <WindowFrame 
                          key={win.id} 
                          windowState={win}
                          onClose={closeWindow}
                          onFocus={focusWindow}
                          onMinimize={minimizeWindow}
                          onUpdate={updateWindow}
                          isActive={win.id === activeWindowId}
                          desktopRect={desktopRect}
                        >
                          {renderWindowContent(win)}
                        </WindowFrame>
                      ))}
                      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                      <CommandPalette 
                         isOpen={isCommandPaletteOpen} 
                         onClose={() => setIsCommandPaletteOpen(false)} 
                         onLaunchApp={launchApp} 
                      />
                      <NotificationCenter 
                         isOpen={isNotificationCenterOpen} 
                         onClose={() => setIsNotificationCenterOpen(false)} 
                      />
                   </main>
              </div>
            </>
          ) : (
            <div className="flex-1 relative w-full h-full bg-black">
                <MobileHome 
                    onLaunchApp={launchApp} 
                    activeApp={mobileActiveApp} 
                    onCloseApp={() => setMobileActiveApp(null)}
                    wallpaperUrl={wallpaper}
                />
                 {mobileActiveApp && (
                    <div className="absolute inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col animate-slide-up">
                         <div className="h-12 flex items-center justify-between px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <button onClick={() => setMobileActiveApp(null)} className="flex items-center text-blue-500 font-semibold">
                                <ChevronLeftIcon className="w-6 h-6" /> Back
                            </button>
                            <span className="font-bold text-gray-800 dark:text-white truncate max-w-[200px]">{mobileActiveApp.title}</span>
                            <div className="w-10"></div>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                             {renderMobileAppContent(mobileActiveApp)}
                        </div>
                        <div className="h-6 flex justify-center items-center bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 cursor-pointer" onClick={() => setMobileActiveApp(null)}>
                            <div className="w-32 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        </div>
                    </div>
                 )}
            </div>
          )}
      </div>
      
      <FloatingActionButton onLaunchAi={() => launchApp({ component: 'aiHub', title: 'AI Hub', icon: GyeNyameIcon })} showCart={false} />
    </div>
  );
};

export default App;
