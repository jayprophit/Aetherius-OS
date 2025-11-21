
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { LeftSidebar } from './components/Dock';
import { TopBar } from './components/TopBar';
import { menuGroups, aetheriusMenuItems, loggedInUser as initialUser } from './data';
import { MenuItemData, WindowState, MenuGroup, SystemIdentity } from './types';
import { FloatingActionButton } from './components/FloatingActionButton';
import { Desktop } from './components/Desktop';
import { WindowFrame } from './components/WindowFrame';
import { Taskbar } from './components/Taskbar';
import { PlaceholderView } from './components/PlaceholderView';
import { GyeNyameIcon, ArrowRightIcon } from './components/Icons';
import { OnboardingWizard } from './components/OnboardingWizard';

// --- Component Imports for Window Content ---
import { ProductPage } from './components/ProductPage';
import { SocialFeed } from './components/SocialFeed';
import { AetheriusAI_Assistant } from './components/AetherAIAssistant';
import { AIAssistant as AIHub } from './components/AppLauncher'; // Renaming for clarity
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
import { FinanceApp } from './components/apps/FinanceApp';
import { ElearningApp } from './components/apps/ElearningApp';
import { GamingApp } from './components/apps/GamingApp';
import { HealthApp } from './components/apps/HealthApp';
import { AccountApp } from './components/apps/AccountApp';
import { RD_HubApp } from './components/apps/RD_HubApp';
import { AiSuiteApp } from './components/apps/AiSuiteApp';

// E-Learning sub-views
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

// This is the missing type that was causing errors.
export interface LaunchableApp {
  component: string;
  title: string;
  icon: React.FC<any>;
  context?: any;
}

const componentMap: { [key: string]: React.FC<any> } = {
  socialFeed: SocialFeed,
  productPage: ProductPage,
  browser: Browser,
  aiHub: AIHub,
  messenger: Messenger,
  settings: SettingsView,
  folderView: FolderView,
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
  
  // App Containers
  socialApp: SocialApp,
  productivityApp: ProductivityApp,
  careersApp: CareersApp,
  enterpriseApp: EnterpriseApp,
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
  rdHub: RD_HubApp,
  aiSuite: AiSuiteApp,
  
  // E-Learning sub-views
  courseDetail: CourseDetail,
  myLearning: MyLearning,
  learningAssistant: LearningAssistant,
  achievements: Achievements,
  sparkIsland: SparkIsland,
  explorerAcademy: ExplorerAcademy,
  innovatorsForge: InnovatorsForge,
  scholarsNexus: ScholarsNexus,
  luminaryLabs: LuminaryLabs,

  // AI Suite
  aiSupportAvatar: AiSupportAvatar,
  networkOrchestrator: NetworkOrchestrator,
  blockchainHub: BlockchainExplorer,
  trainingDataHub: TrainingDataHub,
  aiWorkforce: AiWorkforceOrchestrator,
  avatarForge: AvatarForge,
  simulationHub: SimulationHub,
  videoEditor: VideoEditor,
  huggingFaceHub: HuggingFaceModelHub,
  quantumNN: QuantumNeuralNetwork,
  quantumDNACore: QuantumDNACore,
  memoryNode: MemoryNode,

  // Health
  bodyComposition: BodyComposition,
  frequencyHealing: FrequencyHealing,
  healingWeb: HealingWeb,
  nutritionGuide: NutritionGuide,
  
  // Trading
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
  
  // And many more... for simplicity, we'll add a fallback
  placeholder: (props: any) => <PlaceholderView viewName={props.viewName || 'Placeholder'} />,
};

const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 3000); // 3 second boot
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
                <h2 className="text-2xl font-bold text-white mb-6">{user.name}</h2>
                
                <form onSubmit={handleLogin} className="w-full">
                    <div className="relative mb-4">
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
                <button className="mt-4 text-white/60 hover:text-white text-sm transition-colors">
                    Forgot Password?
                </button>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [systemState, setSystemState] = useState<'boot' | 'login' | 'desktop'>('boot');
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [currentUser, setCurrentUser] = useState(initialUser);
  
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const nextZIndex = useRef(100);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [wallpaper, setWallpaper] = useState<string>('https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=2070&auto-format=fit-crop');
  
  const desktopRef = useRef<HTMLDivElement>(null);
  const [desktopRect, setDesktopRect] = useState<DOMRect | null>(null);

  // Check for previous onboarding on mount
  useEffect(() => {
      const onboarded = localStorage.getItem('aetherius_onboarded') === 'true';
      setHasOnboarded(onboarded);
      
      const savedUser = localStorage.getItem('aetherius_user');
      if (savedUser) {
          try {
              setCurrentUser(JSON.parse(savedUser));
          } catch(e) { console.error("Failed to load user", e); }
      }
  }, []);

  const handleOnboardingComplete = (identity: SystemIdentity, avatarUrl: string) => {
      const newUser = {
          ...currentUser,
          name: identity.governmentName, // Set government name as display name initially
          avatarUrl: avatarUrl,
          systemIdentity: identity
      };
      setCurrentUser(newUser);
      localStorage.setItem('aetherius_user', JSON.stringify(newUser));
      localStorage.setItem('aetherius_onboarded', 'true');
      setHasOnboarded(true);
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

  const bringToFront = (id: string) => {
    nextZIndex.current += 1;
    return nextZIndex.current;
  };
  
  const launchApp = useCallback((app: LaunchableApp) => {
    const existingWindow = windows.find(w => w.id === app.component && !w.isMinimized);
    if (existingWindow) {
      focusWindow(existingWindow.id);
      return;
    }
    
    const minimizedWindow = windows.find(w => w.id === app.component && w.isMinimized);
    if (minimizedWindow) {
        focusWindow(minimizedWindow.id);
        return;
    }
    
    const newWindow: WindowState = {
      id: `${app.component}-${Date.now()}`, // Unique ID to allow multiple instances
      title: app.title,
      icon: app.icon,
      component: app.component,
      context: app.context,
      position: { x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 },
      size: { width: 800, height: 600 },
      zIndex: bringToFront(app.component),
      isMaximized: false,
      isMinimized: false,
    };
    
    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
  }, [windows]);

  const closeWindow = (id: string) => {
    setWindows(windows => windows.filter(w => w.id !== id));
    if (activeWindowId === id) {
        const remainingWindows = windows.filter(w => w.id !== id && !w.isMinimized);
        if (remainingWindows.length > 0) {
            const topWindow = remainingWindows.reduce((prev, current) => (prev.zIndex > current.zIndex) ? prev : current);
            setActiveWindowId(topWindow.id);
        } else {
            setActiveWindowId(null);
        }
    }
  };
  
  const focusWindow = (id: string) => {
    setWindows(windows => windows.map(w => w.id === id ? { ...w, zIndex: bringToFront(id), isMinimized: false } : w));
    setActiveWindowId(id);
  };
  
  const minimizeWindow = (id: string) => {
    setWindows(windows => windows.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    if(id === activeWindowId) {
        const otherWindows = windows.filter(w => w.id !== id && !w.isMinimized);
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
      const props: any = {
          onSetView: (view: string, context: any) => launchApp({ component: view, title: view, icon: () => null, context }),
          context: win.context,
          launchApp: launchApp,
          onClose: () => closeWindow(win.id)
      };
      
      if (win.component === 'placeholder') {
        props.viewName = win.title;
      }
      
      return <Component {...props} />;
  }

  if (systemState === 'boot') {
      return <BootScreen onComplete={() => setSystemState('login')} />;
  }

  if (systemState === 'login') {
      return <LoginScreen onLogin={() => setSystemState('desktop')} user={currentUser} />;
  }

  // Onboarding Check (Before Desktop)
  if (!hasOnboarded) {
      return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="h-screen w-screen bg-black text-content-light dark:text-content-dark font-sans overflow-hidden flex animate-fade-in" style={{ zoom }}>
      <LeftSidebar isOpen={isLeftSidebarOpen} onLaunchApp={launchApp} menuGroups={menuGroups} />
      <div className="flex-1 flex flex-col relative" ref={desktopRef}>
        <TopBar 
          toggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} 
          onLaunchApp={launchApp} 
          contextualActions={[]} 
          aetheriusMenu={aetheriusMenuItems}
          zoom={zoom}
          onZoom={setZoom}
        />
        <main className="flex-1 relative">
          <Desktop launchApp={launchApp} wallpaperUrl={wallpaper} />
          {windows.filter(w => !w.isMinimized).map(win => (
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
        </main>
        <Taskbar windows={windows} onFocus={focusWindow} activeWindowId={activeWindowId} />
      </div>
    </div>
  );
};

export default App;