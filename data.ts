

import {
  HomeIcon, UserIcon, UserCircleIcon, ChatBubbleOvalLeftEllipsisIcon,
  ShoppingCartIcon, BeakerIcon, BriefcaseIcon, AcademicCapIcon,
  Cog6ToothIcon, QuestionMarkCircleIcon, ArrowRightOnRectangleIcon,
  Squares2X2Icon, SpeakerWaveIcon, WifiIcon, LockClosedIcon,
  DisplayIcon, BellIcon, CloudIcon, FingerPrintIcon, EyeIcon,
  BatteryIcon, FolderIcon, PaintBrushIcon, PuzzlePieceIcon,
  GameControllerIcon, GiftIcon, GlobeAltIcon, MapIcon,
  ServerIcon, ShieldCheckIcon, RocketLaunchIcon, CreditCardIcon,
  ChartBarIcon, CurrencyDollarIcon, LinkIcon, PlayIcon,
  StopIcon, PauseIcon, CameraIcon, VideoIcon, MicrophoneIcon,
  DocumentTextIcon, CalendarIcon, ClockIcon, CheckCircleIcon,
  ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon,
  PlusIcon, MinusIcon, PencilIcon, TrashIcon, SearchIcon,
  ShareIcon, HeartIcon, StarIcon, ChevronRightIcon, ChevronDownIcon,
  ChevronLeftIcon, ArrowPathIcon, ArrowUpOnSquareIcon,
  ArrowDownTrayIcon, EllipsisHorizontalIcon, Bars3Icon,
  SunIcon, MoonIcon, ComputerDesktopIcon, DevicePhoneMobileIcon,
  PrinterIcon, WrenchIcon, SwatchIcon, KeyIcon,
  TicketIcon, TruckIcon, UserPlusIcon, UserMinusIcon,
  UsersIcon, BuildingOfficeIcon, BuildingStorefrontIcon,
  ScaleIcon, SparklesIcon, LightBulbIcon, BoltIcon,
  FireIcon, HandThumbUpIcon, HandThumbDownIcon,
  ChatBubbleLeftRightIcon, EnvelopeIcon, PhoneIcon,
  PaperClipIcon, FaceSmileIcon, GifIcon,
  MusicNoteIcon, FilmIcon, PhotoIcon, AdjustmentsHorizontalIcon,
  FunnelIcon, TagIcon, BookmarkIcon, FlagIcon,
  MapPinIcon, GlobeAmericasIcon, LanguageIcon,
  CalculatorIcon, PresentationChartLineIcon, TableCellsIcon,
  ViewColumnsIcon, ListBulletIcon, QueueListIcon,
  RectangleStackIcon, Square2StackIcon, CommandLineIcon,
  CodeBracketIcon, CpuChipIcon, CircleStackIcon,
  SignalIcon, BluetoothIcon, QrCodeIcon,
  ArchiveBoxIcon, InboxIcon,
  PowerIcon, ArrowLeftOnRectangleIcon,
  ArrowRightIcon, ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon,
  MagnifyingGlassIcon, AdjustmentsVerticalIcon,
  WalletIcon, AetherialIcon, BookOpenIcon, CubeIcon,
  ShoppingBagIcon, ClipboardDocumentCheckIcon, HiveMindIcon,
  GlobeIcon, CubeTransparentIcon, HandRaisedIcon, CursorArrowRaysIcon,
  StylusIcon, MessageIcon, ChipIcon, EarIcon, DnaIcon,
  ActivityIcon, AppWindowIcon, BuildingLibraryIcon,
  FlameIcon, ArrowsUpDownLeftRightIcon, TrendingUpIcon,
  UserGroupIcon, ChartPieIcon, PresentationChartBarIcon
} from './components/Icons';

import {
    User, Post, Blog, Group, MenuItemData, MenuGroup, DesktopItem,
    MarketplaceItem, Course, Job, Company, FreelanceProject, JobApplication, Interview,
    KnowledgeBaseItem, MilestonesData, ChecklistCategory, ChatSession,
    TradingAsset, StakingPool, TradingBot, NewsArticle, LoanableAsset,
    LearnAndEarnCourse, AiTradingPlatform, SocialCommunity, SocialStream,
    SystemIdentity, BlockchainCV, ChecklistItem, SettingsCategory, Validator
} from './types';

// --- Users ---
export const loggedInUser: User = {
    id: 'u1',
    name: 'John Doe',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
    email: 'john.doe@aetherius.net',
    username: 'johndoe',
    bio: 'Exploring the digital frontier.',
    role: 'Admin',
    joinedDate: 'Jan 2025',
    followersCount: 1250,
    followingCount: 340,
    online: true,
    systemIdentity: {
        userId: 'UID-VERIFIED-8A92F',
        aiCoreName: 'Aether',
        aiNickname: 'Aether',
        aiId: 'AI-8A92F',
        osId: 'OS-GEN-001',
        networkId: 'NET-ALPHA',
        accountTier: 'verified',
        buildType: 'Grandchild'
    },
    instructorProfile: {
        totalStudents: 5400,
        totalEarnings: 12500,
        averageRating: 4.8,
        courses: [],
        payoutMethod: 'Crypto'
    },
    blockchainCV: {
        id: 'CV-HASH-992',
        credentials: [
            { id: 'c1', name: 'Quantum Architect', issuer: 'Aetherius Academy', issueDate: '2025', hash: '0x123...', skills: ['Quantum Computing', 'System Design'], url: '#' }
        ],
        verifiedSkills: ['React', 'TypeScript', 'Quantum Physics'],
        lastUpdated: '2025-10-24',
        profileHash: '0xabc...'
    }
};

export const allUsers: User[] = [
    loggedInUser,
    { id: 'u2', name: 'Alice Smith', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150', role: 'Developer', online: true, followersCount: 890 },
    { id: 'u3', name: 'Bob Jones', avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150', role: 'Designer', online: false, followersCount: 450 },
    { id: 'u4', name: 'QuantumDev', avatarUrl: null, role: 'Admin', online: true, followersCount: 5000 }
];

export const following = allUsers.slice(1);

// --- Social ---
export const posts: Post[] = [
    { id: 'p1', author: allUsers[1], timestamp: '2h ago', content: 'Just deployed my first smart contract on OmniChain!', likes: [loggedInUser], comments: [] },
    { id: 'p2', author: allUsers[2], timestamp: '5h ago', content: 'The new VR studio is mind-blowing.', media: { type: 'image', url: 'https://images.unsplash.com/photo-1626379953822-baec19c3accd?auto=format&fit=crop&w=500' }, likes: [], comments: [] }
];

export const blogs: Blog[] = [
    { id: 'b1', title: 'The Future of Quantum UI', date: 'Oct 20, 2025', imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=150' },
    { id: 'b2', title: 'Optimizing Neural Nets', date: 'Oct 18, 2025', imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=150' }
];

export const profileCompletion = {
    percentage: 85,
    steps: [
        { name: 'Setup Account', completed: true, progress: '100%' },
        { name: 'Verify Identity', completed: true, progress: '100%' },
        { name: 'Connect Wallet', completed: true, progress: '100%' },
        { name: 'Complete Bio', completed: false, progress: '50%' }
    ]
};

export const latestUpdates = [
    { id: 'u1', author: allUsers[1], content: 'updated their status', timestamp: '10m ago' },
    { id: 'u2', author: allUsers[2], content: 'posted a new video', timestamp: '1h ago' }
];

export const groups: Group[] = [
    { id: 'g1', name: 'Quantum Developers', members: 1240, privacy: 'Public', type: 'Tech', isOrganizer: true, coverImageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=500', avatarUrl: 'https://ui-avatars.com/api/?name=QD&background=random', memberAvatars: [] },
    { id: 'g2', name: 'Digital Artists', members: 850, privacy: 'Public', type: 'Art', isOrganizer: false, coverImageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=500', avatarUrl: 'https://ui-avatars.com/api/?name=DA&background=random', memberAvatars: [] }
];

export const peopleYouMayKnowData = [
    { name: 'Sarah Connor', imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150' },
    { name: 'Kyle Reese', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150' }
];

export const sponsoredDataFB = [
    { title: 'Neural Link V2', imageUrl: 'https://images.unsplash.com/photo-1555664424-778a69022365?auto=format&fit=crop&w=150', url: 'tech.neural' }
];

export const contactsDataFB = allUsers.slice(1);

export const socialCommunities: SocialCommunity[] = [
    {
        id: 'c1', name: 'Aetherius Official', description: 'Official community.', iconUrl: 'https://ui-avatars.com/api/?name=AO', bannerUrl: '', memberCount: 5000, onlineCount: 420, category: 'Official',
        channels: [
            { id: 'ch1', name: 'general', type: 'text' },
            { id: 'ch2', name: 'announcements', type: 'announcement' },
            { id: 'ch3', name: 'voice-lounge', type: 'voice' }
        ]
    }
];

export const socialStreams: SocialStream[] = [
    { id: 's1', broadcaster: allUsers[1], title: 'Coding the Matrix', category: 'Tech', viewers: 1200, thumbnailUrl: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=300', isLive: true, tags: ['Coding', 'AI'] },
    { id: 's2', broadcaster: allUsers[2], title: 'Digital Art Speedrun', category: 'Art', viewers: 800, thumbnailUrl: 'https://images.unsplash.com/photo-1561557944-6e7860d0a720?auto=format&fit=crop&w=300', isLive: true, tags: ['Design'] }
];

// --- Commerce ---
export const creatorMarketplaceItems: MarketplaceItem[] = [
    { id: 'm1', name: 'Quantum Theme', price: 5, rating: 4.8, downloads: 1200, type: 'Theme', creator: allUsers[1], description: 'Dark mode theme.', iconUrl: 'https://ui-avatars.com/api/?name=QT', source: 'marketplace', deliveryMethod: 'digital-download' },
    { id: 'm2', name: 'Code Assistant', price: 'Free', rating: 4.5, downloads: 5000, type: 'App', creator: allUsers[2], description: 'AI coding helper.', iconUrl: 'https://ui-avatars.com/api/?name=CA', source: 'marketplace', deliveryMethod: 'app-install' }
];

export const commerceData = {
    physical: [
        { id: 'p1', name: 'Holographic Display', price: 499, rating: 4.7, type: 'Physical Product', creator: { name: 'HoloTech', id: 'c1', avatarUrl: null }, description: '3D display.', iconUrl: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?auto=format&fit=crop&w=300', source: 'ecommerce', deliveryMethod: 'shipping' }
    ],
    digitalGoods: [
        { id: 'd1', name: 'Cyberpunk Asset Pack', price: 29, rating: 4.9, type: 'Digital Asset', creator: allUsers[1], description: '3D models.', iconUrl: 'https://ui-avatars.com/api/?name=CP', source: 'marketplace', deliveryMethod: 'digital-download' }
    ],
    apps: creatorMarketplaceItems
};

// --- Learning ---
export const courses: Course[] = [
    { id: 1, title: 'Quantum Computing 101', instructor: 'Dr. A. Smith', rating: 4.9, students: 1200, price: 99, imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=300', category: 'Tech', description: 'Intro to Qubits', longDescription: 'Detailed course...', whatYoullLearn: ['Superposition', 'Entanglement'], modules: [] },
    { id: 2, title: 'Advanced AI Agents', instructor: 'Jane Doe', rating: 4.8, students: 800, price: 149, imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=300', category: 'AI', description: 'Building autonomous agents', longDescription: '...', whatYoullLearn: ['RAG', 'Tools'], modules: [] }
];

export const enrolledCourses = [
    { courseId: 1, progress: 45 }
];

export const achievements = [
    { id: 'a1', courseTitle: 'Python Mastery', completionDate: '2024-12-01', transactionId: '0x123abc', certificateUrl: '#' }
];

export const learnAndEarnCourses: LearnAndEarnCourse[] = [
    { id: 'le1', title: 'Intro to DeFi', asset: { symbol: 'ETH', logoUrl: '' }, reward: 10, duration: '30m', lessons: 5 }
];

// --- Jobs ---
export const jobs: Job[] = [
    { id: 1, title: 'Frontend Developer', company: 'TechCorp', location: 'Remote', type: 'Full-time', salary: '$120k', tags: ['React', 'TS'], logoUrl: 'https://ui-avatars.com/api/?name=TC' },
    { id: 2, title: 'Quantum Engineer', company: 'Q-Labs', location: 'San Francisco', type: 'Full-time', salary: '$200k', tags: ['Physics', 'Python'], logoUrl: 'https://ui-avatars.com/api/?name=QL' }
];

export const mockCompanies: Company[] = [
    { id: 'c1', name: 'TechCorp', description: 'Leading tech firm.', industry: 'Software', size: '1000+', website: 'example.com', locations: ['SF', 'NY'], logoUrl: 'https://ui-avatars.com/api/?name=TC', verified: true }
];

export const mockFreelanceProjects: FreelanceProject[] = [
    { id: 'fp1', title: 'Build a 3D Website', description: 'Need a three.js expert.', category: 'Web Dev', skills: ['Three.js', 'React'], budget: { type: 'fixed', min: 1000, max: 2000, currency: 'USD' }, duration: '2 weeks', clientName: 'StartUp Inc', postedDate: '1d ago', proposalsCount: 5 }
];

export const mockApplications: JobApplication[] = [
    { id: 'app1', jobId: 1, jobTitle: 'Frontend Developer', companyName: 'TechCorp', status: 'Interview', dateApplied: '2025-10-15', updates: [] }
];

export const mockInterviews: Interview[] = [
    { id: 'int1', applicationId: 'app1', jobTitle: 'Frontend Developer', companyName: 'TechCorp', date: 'Oct 26', time: '10:00 AM', type: 'Video', participants: ['Recruiter'], status: 'Scheduled' }
];

// --- Knowledge Base ---
export const knowledgeBaseData: KnowledgeBaseItem[] = [
    { id: 'KB-001', name: 'OmniChain Consensus', details: 'Hybrid PoW/PoS mechanism.', status: 'Integrated', progress: 100 },
    { id: 'KB-002', name: 'Neural Interface', details: 'BCI Direct Link protocol.', status: 'R&D Phase', progress: 40 },
    { id: 'KB-003', name: 'AetherSearch Protocol', details: 'Global keyboard-driven command palette.', status: 'Integrated', progress: 100 },
    { id: 'KB-004', name: 'MVO Definition', details: 'Minimum Viable Operations: The core hardware and kernel systems required to boot the OS.', status: 'Foundational', progress: 100 },
    { id: 'KB-005', name: 'MVP Definition', details: 'Minimum Viable Product: The user-facing application layer essential for mass adoption.', status: 'Foundational', progress: 100 }
];

export const milestonesData: MilestonesData = {
    projectMilestones: [
        { id: 'M1', title: 'Genesis Launch', status: 'Completed', progress: 100 },
        { id: 'M2', title: 'AI Integration', status: 'In Progress', progress: 75 },
        { id: 'M3', title: 'UX Polymerization', status: 'Completed', description: 'Merged Desktop and Mobile paradigms with AetherSearch.', progress: 100 }
    ],
    technicalBreakdown: [],
    platformFeatureMilestones: []
};

export const buildChecklistData: ChecklistCategory[] = [
    {
        id: 'cat1', name: 'Core System (MVO)', description: 'Kernel, Hardware Bridge, and Boot Sequence', icon: CpuChipIcon,
        items: [
            { id: 'i1', name: 'Kernel Boot', description: 'WASM Loader', status: 'Completed', progress: 100 },
            { id: 'i2', name: 'Virtual Rig', description: 'Hardware Simulation', status: 'Completed', progress: 100 },
            { id: 'i3', name: 'Memory Node', description: 'Vector Storage', status: 'Completed', progress: 100 }
        ]
    },
    {
        id: 'cat2', name: 'User Experience (MVP)', description: 'Applications, UI, and Interaction', icon: AppWindowIcon,
        items: [
             { id: 'i4', name: 'Social Hub', description: 'Feed, Chat, Groups', status: 'Completed', progress: 100 },
             { id: 'i5', name: 'Commerce', description: 'Marketplace & Shop', status: 'Completed', progress: 100 },
             { id: 'i6', name: 'Productivity', description: 'Mail, Calendar, Docs', status: 'Completed', progress: 100 }
        ]
    }
];

export const gapAnalysisData = {
    mvo: {
        title: "Minimum Viable Operation (Architecture)",
        description: "Status of backend systems required for OS functionality.",
        readiness: 92,
        criticalPath: [
            { name: "Kernel", status: "Online" },
            { name: "Hardware Bridge", status: "Simulated" },
            { name: "FileSystem", status: "Online (OPFS)" },
            { name: "Networking", status: "Online (WebRTC)" }
        ]
    },
    mvp: {
        title: "Minimum Viable Product (User)",
        description: "Status of frontend applications required for user adoption.",
        readiness: 88,
        criticalPath: [
            { name: "Social Suite", status: "Ready" },
            { name: "Finance Hub", status: "Ready" },
            { name: "AI Integration", status: "Beta" },
            { name: "Mobile Responsiveness", status: "Ready" }
        ]
    }
};

// --- Messenger ---
export const messengerSessions: ChatSession[] = [
    {
        id: 's1', title: 'Alice Smith', type: 'individual', lastActivity: '10m ago',
        members: [loggedInUser, allUsers[1]],
        messages: [{ role: 'user', text: 'Hey, check out the new update.' }, { role: 'model', text: 'Looks great!' }]
    }
];

export const messengerUsers = {
    'u2': allUsers[1],
    'u3': allUsers[2]
};

export const chatSessions: ChatSession[] = [
    {
        id: 'cs1', title: 'Project Planning', type: 'individual', lastActivity: '2h ago',
        messages: [{ role: 'model', text: 'Hello! How can I help with your project?' }]
    }
];

// --- Settings ---
export const settingsConfig: SettingsCategory[] = [
    { 
        id: 'general', title: 'General', description: 'System settings', icon: Cog6ToothIcon,
        items: [
            { id: 'about', title: 'About', icon: InformationCircleIcon, component: 'about' },
            { id: 'software_update', title: 'Software Update', icon: ArrowPathIcon, component: 'software_update' },
            { id: 'storage', title: 'Storage', icon: CircleStackIcon, component: 'storage' },
            { id: 'language_region', title: 'Language & Region', icon: LanguageIcon, component: 'language_region' },
            { id: 'date_time', title: 'Date & Time', icon: ClockIcon, component: 'date_time' },
            { id: 'legal', title: 'Legal & Regulatory', icon: ScaleIcon, component: 'legal' },
        ]
    },
    {
        id: 'appearance', title: 'Appearance', description: 'Display & Theme', icon: DisplayIcon,
        items: [
             { id: 'display', title: 'Display & Brightness', icon: DisplayIcon, component: 'display' },
             { id: 'wallpaper', title: 'Wallpaper', icon: PhotoIcon, component: 'wallpaper' },
             { id: 'home_screen', title: 'Home Screen & Dock', icon: AppWindowIcon, component: 'home_screen' },
             { id: 'multitasking', title: 'Multitasking & Gestures', icon: Squares2X2Icon, component: 'multitasking' },
        ]
    },
    {
        id: 'connectivity', title: 'Connectivity', description: 'Network & Devices', icon: WifiIcon,
        items: [
            { id: 'wifi', title: 'Wi-Fi', icon: WifiIcon, component: 'wifi' },
            { id: 'bluetooth', title: 'Bluetooth', icon: BluetoothIcon, component: 'bluetooth' },
            { id: 'cellular', title: 'Cellular Data', icon: SignalIcon, component: 'cellular' },
            { id: 'vpn', title: 'VPN & Device Management', icon: LockClosedIcon, component: 'vpn' },
            { id: 'airplane_mode', title: 'Airplane Mode', icon: RocketLaunchIcon, component: 'airplane_mode', type: 'toggle' },
        ]
    },
    {
        id: 'privacy_security', title: 'Privacy & Security', description: 'Permissions & Safety', icon: ShieldCheckIcon,
        items: [
            { id: 'privacy', title: 'Privacy & Security', icon: HandThumbUpIcon, component: 'privacy' },
            { id: 'face_id', title: 'Face ID & Passcode', icon: FingerPrintIcon, component: 'face_id' },
            { id: 'passwords', title: 'Passwords', icon: KeyIcon, component: 'passwords' },
        ]
    },
    {
        id: 'notifications_focus', title: 'Notifications & Focus', description: 'Alerts & DND', icon: BellIcon,
        items: [
            { id: 'notifications', title: 'Notifications', icon: BellIcon, component: 'notifications' },
            { id: 'focus', title: 'Focus', icon: MoonIcon, component: 'focus' },
            { id: 'screen_time', title: 'Screen Time', icon: ClockIcon, component: 'screen_time' },
        ]
    },
    {
        id: 'apps_media', title: 'Apps & Media', description: 'App Settings', icon: AppWindowIcon,
        items: [
             { id: 'app_store', title: 'App Market', icon: BuildingLibraryIcon, component: 'app_store' },
             { id: 'wallet', title: 'Wallet & AetherPay', icon: WalletIcon, component: 'wallet_settings' },
             { id: 'game_center', title: 'Game Hub', icon: GameControllerIcon, component: 'game_center_profile' },
        ]
    },
    {
        id: 'accessibility', title: 'Accessibility', description: 'Vision, Hearing, Motor', icon: HandRaisedIcon,
        items: [
            { id: 'accessibility_main', title: 'Accessibility', icon: HandRaisedIcon, component: 'accessibility_main' },
        ]
    },
    {
        id: 'ai_cloud', title: 'AI & Cloud', description: 'Intelligence & Sync', icon: CloudIcon,
        items: [
             { id: 'aetherius_ai', title: 'Aetherius Intelligence', icon: SparklesIcon, component: 'ai_settings' },
             { id: 'cloud_account', title: 'AetherCloud', icon: CloudIcon, component: 'cloud_storage' },
        ]
    }
];

// --- Trading ---
export const tradingAssets: TradingAsset[] = [
    { symbol: 'BTC', name: 'Bitcoin', price: 65000, change: 2.5, changePercent: 2.5, marketCap: 1200000000000, volume24h: 30000000000, logoUrl: '', assetClass: 'Crypto' },
    { symbol: 'ETH', name: 'Ethereum', price: 3500, change: -1.2, changePercent: -1.2, marketCap: 400000000000, volume24h: 15000000000, logoUrl: '', assetClass: 'Crypto' }
];

export const stakingPools: StakingPool[] = [
    { id: 'sp1', asset: { symbol: 'ETH', name: 'Ethereum', logoUrl: '' }, apy: 4.5, tvl: 1000000000, lockupPeriod: 'None' }
];

export const tradingBots: TradingBot[] = [
    { id: 'tb1', name: 'BTC Grid', strategy: 'Grid Trading', pair: 'BTC/USDT', status: 'Running', pnl: 1250, runtime: '12d' }
];

export const tradingNews: NewsArticle[] = [
    { id: 'n1', source: 'CryptoDaily', title: 'Bitcoin Hits New High', timestamp: '2h ago', imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a420994e3db?auto=format&fit=crop&w=150', category: 'Crypto' },
    { id: 'n2', source: 'Bloomberg', title: 'Analysts Predict Volatility Ahead of Options Expiry', timestamp: '5h ago', imageUrl: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=150', category: 'World Markets' },
];

export const loanableAssets: LoanableAsset[] = [
    { symbol: 'USDC', logoUrl: '', supplyApy: 5.0, borrowApy: 7.5, totalSupplied: 500000000, totalBorrowed: 300000000 }
];

export const topCopyTraders = [
    { id: 't1', name: 'CryptoKing', avatarUrl: null, roi: 150, riskScore: 4, followers: 1200, username: 'crypteking' }
];

export const aiTradingPlatforms: AiTradingPlatform[] = [
    { id: 'ap1', name: 'TradeGPT', category: 'Crypto', description: 'AI trading bot.', features: ['Auto-trade'], pricing: '$20/mo', bestFor: ['Beginners'], strengths: [], weaknesses: [], pros: [], cons: [] }
];

// --- Reality Resources ---
export const realityResources = {
    kernel: { gap: 'Missing Hardware Access', description: 'Need WebGPU', free: [], paid: [] },
    filesystem: { gap: 'Ephemeral Storage', description: 'Need OPFS', free: [], paid: [] },
    networking: { gap: 'Centralized', description: 'Need P2P', free: [], paid: [] },
    hardware: { gap: 'No HAL', description: 'Need Drivers', free: [], paid: [] },
    neural: { gap: 'No BCI', description: 'Need Bluetooth', free: [], paid: [] },
    spatial: { gap: '2D Only', description: 'Need WebXR', free: [], paid: [] }
};

export const aiConsciousnessLayers = [
    { name: 'Core Intelligence', description: 'Basic logic', states: ['Idle', 'Processing'], theme: 'border-blue-500 bg-blue-500' }
];

export const mockValidators: Validator[] = [
    { id: 'v1', name: 'Genesis Node', stake: 1000000, reputation: 100, isAuthority: true, status: 'Active' }
];

export const osMenuStructures = {
    desktopContext: [
        { label: 'Refresh', action: 'refresh' },
        { type: 'divider' },
        { label: 'Toggle Widgets', action: 'toggleWidgets' },
        { label: 'Personalize', action: 'personalize' },
        { label: 'Display Settings', action: 'display' },
        { type: 'divider' },
        { label: 'Open Terminal', action: 'terminal' }
    ]
};

// --- Menus ---
export const aetheriusMenuItems: MenuItemData[] = [
    { title: 'About Aetherius OS', component: 'about', icon: InformationCircleIcon },
    { type: 'divider' },
    { title: 'System Preferences...', component: 'settings', icon: Cog6ToothIcon },
    { title: 'App Market...', component: 'appMarket', icon: BuildingLibraryIcon },
    { title: 'Log Out', action: 'logout' }
];

export const mainMenuItems: MenuGroup[] = [
    {
        id: 'main', title: 'Main', type: 'group', icon: HomeIcon,
        children: [
            { title: 'Browser', icon: GlobeAltIcon, component: 'browser' },
            { title: 'Social Hub', icon: UsersIcon, component: 'socialApp' },
            { title: 'Global Commerce', icon: ShoppingCartIcon, component: 'eCommerceApp' },
            { title: 'App Market', icon: BuildingLibraryIcon, component: 'appMarket' },
            { title: 'Creation Labs', icon: BeakerIcon, component: 'mediaApp' },
            { title: 'E-Learning', icon: AcademicCapIcon, component: 'elearningApp' },
            { title: 'Gaming Hub', icon: GameControllerIcon, component: 'gamingApp' },
            { title: 'Careers Hub', icon: BriefcaseIcon, component: 'careersApp' },
        ]
    },
    {
        id: 'utilities',
        title: 'Utilities',
        type: 'group',
        icon: Squares2X2Icon,
        children: [
             { title: 'Calculator', icon: CalculatorIcon, component: 'calculator' },
             { title: 'Notepad', icon: DocumentTextIcon, component: 'notepad' },
             { title: 'Terminal', icon: CommandLineIcon, component: 'terminal' },
             { title: 'Task Manager', icon: ChartBarIcon, component: 'taskManager' },
             { title: 'System Monitor', icon: ChartBarIcon, component: 'systemMonitor' },
             { title: 'Productivity Suite', icon: DocumentTextIcon, component: 'productivityApp' },
        ]
    },
    {
        id: 'enterprise',
        title: 'Enterprise',
        type: 'group',
        icon: BuildingOfficeIcon,
        children: [
            { title: 'Enterprise Suite', icon: BuildingOfficeIcon, component: 'enterpriseApp' },
            { title: 'Finance & Trading', icon: ChartBarIcon, component: 'financeApp' },
            { title: 'Engineering Lab', icon: WrenchIcon, component: 'engineeringApp' },
            { title: 'Development Hub', icon: CodeBracketIcon, component: 'developmentApp' },
            { title: 'AI Productivity Platform', icon: HiveMindIcon, component: 'aiProductivityPlatform' },
            { title: 'Operations Center', icon: CloudIcon, component: 'opsCenterApp' },
        ]
    },
    {
        id: 'labs',
        title: 'Advanced Labs',
        type: 'group',
        icon: BeakerIcon,
        children: [
            { title: 'Quantum Lab', icon: SparklesIcon, component: 'quantumLabApp' },
            { title: 'R&D Hub', icon: CubeTransparentIcon, component: 'rdHub' },
            { title: 'GenAI Studio', icon: CpuChipIcon, component: 'aiSuite' },
        ]
    },
    {
        id: 'system', title: 'System', type: 'group', icon: Cog6ToothIcon,
        children: [
             { title: 'Account', icon: UserCircleIcon, component: 'accountApp' },
             { title: 'Settings', icon: Cog6ToothIcon, component: 'settings' },
             { title: 'System Info', icon: InformationCircleIcon, component: 'systemInfo' },
             { title: 'Hypervisor', icon: ServerIcon, component: 'hypervisor' },
             { title: 'Network Admin', icon: GlobeAltIcon, component: 'serviceRegistry' },
             { title: 'Security Center', icon: ShieldCheckIcon, component: 'securityCenter' },
             { title: 'Contacts', icon: UserGroupIcon, component: 'contacts' },
        ]
    }
];

export const menuGroups = mainMenuItems;

export const desktopItems: DesktopItem[] = [
    { id: 'my-computer', type: 'app', title: 'My Computer', icon: ComputerDesktopIcon, component: 'fileManager' },
    { id: 'browser', type: 'app', title: 'Browser', icon: GlobeAltIcon, component: 'browser' },
    { id: 'messenger', type: 'app', title: 'Messenger', icon: ChatBubbleOvalLeftEllipsisIcon, component: 'messenger' },
    { id: 'ops-center', type: 'app', title: 'Ops Center', icon: CloudIcon, component: 'opsCenterApp', context: { menuItem: mainMenuItems[2].children![5] } },
    { id: 'quantum-lab', type: 'app', title: 'Quantum Lab', icon: SparklesIcon, component: 'quantumLabApp', context: { menuItem: mainMenuItems[3].children![0] } },
    { id: 'ai-productivity', type: 'app', title: 'AI Platform', icon: HiveMindIcon, component: 'aiProductivityPlatform', context: { menuItem: mainMenuItems[2].children![4] } },
    { id: 'social', type: 'app', title: 'Social Hub', icon: UsersIcon, component: 'socialApp', context: { menuItem: mainMenuItems[0].children![1] } },
    { id: 'finance', type: 'app', title: 'Finance', icon: ChartBarIcon, component: 'financeApp', context: { menuItem: mainMenuItems[2].children![1] } },
    { id: 'commerce', type: 'app', title: 'Global Commerce', icon: ShoppingCartIcon, component: 'eCommerceApp', context: { menuItem: mainMenuItems[0].children![2] } },
    { id: 'app-market', type: 'app', title: 'App Market', icon: BuildingLibraryIcon, component: 'appMarket', context: { menuItem: mainMenuItems[0].children![3] } },
    { id: 'development', type: 'app', title: 'Dev Hub', icon: CodeBracketIcon, component: 'developmentApp', context: { menuItem: mainMenuItems[2].children![3] } },
    { 
        id: 'system-tools', 
        type: 'folder', 
        title: 'System Tools', 
        children: [
            { id: 'task-manager', type: 'app', title: 'Task Manager', icon: ChartBarIcon, component: 'taskManager' },
            { id: 'system-monitor', type: 'app', title: 'System Monitor', icon: ChartBarIcon, component: 'systemMonitor' },
            { id: 'network-admin', type: 'app', title: 'Network Admin', icon: GlobeAltIcon, component: 'serviceRegistry' },
            { id: 'sys-audit', type: 'app', title: 'System Audit', icon: ShieldCheckIcon, component: 'systemAudit' },
            { id: 'hypervisor', type: 'app', title: 'Hypervisor', icon: ServerIcon, component: 'hypervisor' },
            { id: 'terminal', type: 'app', title: 'Terminal', icon: CommandLineIcon, component: 'terminal' }
        ]
    },
    { id: 'recycle-bin', type: 'folder', title: 'Recycle Bin', children: [] },
];