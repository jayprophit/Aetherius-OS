



















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
  ArchiveBoxIcon, InboxIcon, TrashIcon as TrashBinIcon,
  PowerIcon, ArrowLeftOnRectangleIcon,
  ArrowRightIcon, ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon,
  MagnifyingGlassIcon, AdjustmentsVerticalIcon,
  WalletIcon, AetherialIcon, BookOpenIcon, CubeIcon,
  ShoppingBagIcon, ClipboardDocumentCheckIcon, HiveMindIcon,
  GlobeIcon, CubeTransparentIcon, HandRaisedIcon, CursorArrowRaysIcon,
  StylusIcon, MessageIcon, ChipIcon, EarIcon, DnaIcon
} from './components/Icons';

import {
  User, Post, Blog, Group, MenuItemData, Course, Job,
  MarketplaceItem, TradingAsset, StakingPool, LoanableAsset,
  TradingBot, NewsArticle, LearnAndEarnCourse, ChatSession,
  KnowledgeBaseItem, MilestonesData, ChecklistCategory, MenuGroup, ChecklistItem,
  ReputationSystemSpec, ErpSystemSpec, QuantumNetworkSpec, DesktopItem, SettingsCategory,
  Validator, AiTradingPlatform, Achievement, Company, FreelanceProject,
  SocialCommunity, SocialStream
} from './types';

// --- Users ---
export const loggedInUser: User = {
  id: 'u1',
  name: 'John Doe',
  username: 'johndoe',
  email: 'john.doe@example.com',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  bio: 'Tech enthusiast, developer, and explorer of the Aetherius OS.',
  role: 'Admin',
  joinedDate: 'January 2024',
  followersCount: 1250,
  followingCount: 340,
  online: true,
  socials: {
    github: 'https://github.com/johndoe',
    twitter: 'https://twitter.com/johndoe',
    linkedin: 'https://linkedin.com/in/johndoe'
  },
  roi: 12.5,
  riskScore: 3,
  followers: 1250,
  systemIdentity: {
      userId: 'UID-ARCHITECT-001',
      aiCoreName: 'Aether Genesis',
      aiNickname: 'Prime',
      aiId: 'AI-GEN-001',
      osId: 'OS-GENESIS-MASTER',
      networkId: '0xROOT...MASTER',
      accountTier: 'verified',
      kycStatus: 'verified',
      verificationLevel: 'Tier 2 (Full Financial)',
      ageGroup: 'Adult',
      buildType: 'Genesis',
      governmentName: 'Jonathan Powell'
  },
  // --- Mega Learning Platform Data ---
  learning: {
      points: 2450,
      level: 14,
      streak: 12,
      certificates: ['ach-1']
  },
  instructorProfile: {
      totalStudents: 1540,
      totalEarnings: 12450.50,
      averageRating: 4.8,
      courses: [], // Populated below
      payoutMethod: 'Aetherius Wallet'
  },
  blockchainCV: {
      id: 'CV-GEN-001',
      profileHash: '0x8f3a...29b1',
      lastUpdated: '2025-10-24',
      verifiedSkills: ['Quantum Computing', 'React', 'System Architecture', 'AI Prompt Engineering'],
      credentials: [
          {
              id: 'cred-1',
              name: 'Master of System Architecture',
              issuer: 'Aetherius Academy',
              issueDate: '2024-12-15',
              hash: '0xabc...123',
              skills: ['System Design', 'Cloud Ops'],
              url: '#'
          },
          {
              id: 'cred-2',
              name: 'Quantum Mechanics I',
              issuer: 'MIT OpenCourseWare (Verified)',
              issueDate: '2025-02-10',
              hash: '0xdef...456',
              skills: ['Quantum Physics', 'Mathematics'],
              url: '#'
          }
      ]
  }
};

export const allUsers: User[] = [
    loggedInUser,
    { id: 'u2', name: 'Alice Smith', username: 'alice_s', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: true, role: 'Teacher', followersCount: 890, roi: 45.2, riskScore: 4 },
    { id: 'u3', name: 'Bob Jones', username: 'bobby_j', avatarUrl: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: false, role: 'Student', followersCount: 120, roi: 10.5, riskScore: 2 },
    { id: 'u4', name: 'Charlie Day', username: 'charlie_d', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: true, role: 'Coach', followersCount: 450, roi: 88.1, riskScore: 8 },
    { id: 'u5', name: 'Diana Prince', username: 'wonder_d', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: false, role: 'Admin', followersCount: 2100, roi: 15.0, riskScore: 1 },
    { id: 'u6', name: 'Evan Wright', username: 'evan_w', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: true, role: 'Student', followersCount: 55, roi: -5.2, riskScore: 9 },
];

export const following = allUsers.filter(u => u.id !== loggedInUser.id);

// --- Menu Data ---

export const aetheriusMenuItems: MenuItemData[] = [
    { title: 'About Aetherius', icon: InformationCircleIcon, component: 'about' },
    { title: 'System Preferences', icon: Cog6ToothIcon, component: 'settings' },
    { type: 'divider' },
    { title: 'Restart', icon: ArrowPathIcon, action: 'restart' },
    { title: 'Shut Down', icon: PowerIcon, action: 'shutdown' },
];

export const mainMenuItems: MenuItemData[] = [
    { title: 'Social Hub', icon: UsersIcon, component: 'socialApp' },
    { title: 'Creation Labs', icon: BeakerIcon, component: 'mediaApp' },
    { title: 'Commerce', icon: ShoppingCartIcon, component: 'eCommerceApp' },
    { title: 'Finance', icon: ChartBarIcon, component: 'financeApp' },
    { title: 'Labs', icon: CubeTransparentIcon, component: 'rdHub' },
    { title: 'Careers Hub', icon: BriefcaseIcon, component: 'careersApp' },
    { title: 'E-Learning', icon: AcademicCapIcon, component: 'elearningApp' },
    { title: 'OmniPlatform', icon: GlobeAltIcon, component: 'omniPlatform' }, // New Addition
];

export const menuGroups: (MenuGroup | MenuItemData)[] = [
    {
        id: 'system',
        title: 'Core System',
        icon: CpuChipIcon,
        type: 'group',
        children: [
            { title: 'Dashboard', icon: HomeIcon, component: 'socialFeed' },
            { title: 'Files', icon: FolderIcon, component: 'folderView' },
            { title: 'Browser', icon: GlobeAltIcon, component: 'browser' },
            { title: 'Settings', icon: Cog6ToothIcon, component: 'settings' },
        ]
    },
    {
        id: 'intelligence',
        title: 'Intelligence & R&D',
        icon: SparklesIcon,
        type: 'group',
        children: [
            { title: 'AI Hub', icon: HiveMindIcon, component: 'aiHub' },
            { title: 'AI Suite', icon: BoltIcon, component: 'aiSuite' },
            { title: 'R&D Labs', icon: BeakerIcon, component: 'rdHub' },
            { title: 'Development', icon: CodeBracketIcon, component: 'developmentApp' },
            { title: 'Engineering', icon: WrenchIcon, component: 'engineeringApp' },
        ]
    },
    {
        id: 'community',
        title: 'Community & Life',
        icon: UsersIcon,
        type: 'group',
        children: [
            { title: 'Social Hub', icon: DocumentTextIcon, component: 'socialApp' },
            { title: 'Messenger', icon: MessageIcon, component: 'messenger' },
            { title: 'Health', icon: HeartIcon, component: 'healthApp' },
            { title: 'Learning', icon: AcademicCapIcon, component: 'elearningApp' },
        ]
    },
    {
        id: 'economy',
        title: 'Economy & Business',
        icon: ShoppingCartIcon,
        type: 'group',
        children: [
            { title: 'OmniPlatform', icon: GlobeAltIcon, component: 'omniPlatform' }, // New Addition
            { title: 'Commerce', icon: ShoppingCartIcon, component: 'eCommerceApp' },
            { title: 'Finance', icon: ChartBarIcon, component: 'financeApp' },
            { title: 'Wallet', icon: WalletIcon, component: 'tradingWallet' },
            { title: 'Careers', icon: BriefcaseIcon, component: 'careersApp' },
        ]
    }
];

export const desktopItems: DesktopItem[] = [
    { id: 'my-pc', type: 'app', title: 'My Computer', icon: ComputerDesktopIcon, component: 'folderView' },
    { id: 'recycle-bin', type: 'app', title: 'Recycle Bin', icon: TrashBinIcon, component: 'folderView' },
    { id: 'browser', type: 'app', title: 'Browser', icon: GlobeAltIcon, component: 'browser' },
    { id: 'ai-hub', type: 'app', title: 'AI Hub', icon: HiveMindIcon, component: 'aiHub' },
    { id: 'settings', type: 'app', title: 'Settings', icon: Cog6ToothIcon, component: 'settings' },
    { id: 'cloud-ops', type: 'app', title: 'Cloud Ops', icon: CloudIcon, component: 'cloudOps' },
    { id: 'terminal', type: 'app', title: 'Terminal', icon: CommandLineIcon, component: 'terminal' },
    { id: 'social', type: 'app', title: 'Social', icon: UsersIcon, component: 'socialApp' },
    { id: 'market', type: 'app', title: 'Commerce', icon: ShoppingCartIcon, component: 'eCommerceApp' },
    { id: 'omni', type: 'app', title: 'OmniPlatform', icon: GlobeAltIcon, component: 'omniPlatform' }, // New Desktop Icon
    { id: 'milestones', type: 'app', title: 'Milestones', icon: FlagIcon, component: 'milestones' },
    { id: 'checklist', type: 'app', title: 'Checklist', icon: ClipboardDocumentCheckIcon, component: 'buildChecklist' },
];

// --- STANDARD OS MENU STRUCTURES ---
export const osMenuStructures = {
    file: [
        { label: 'New', submenu: [{label: 'Folder'}, {label: 'Document'}, {label: 'Shortcut'}] },
        { label: 'Open', accelerator: 'Ctrl+O' },
        { label: 'Save', accelerator: 'Ctrl+S' },
        { label: 'Save As...' },
        { type: 'divider' },
        { label: 'Print', accelerator: 'Ctrl+P' },
        { label: 'Properties' },
        { label: 'Exit', accelerator: 'Alt+F4' }
    ],
    edit: [
        { label: 'Undo', accelerator: 'Ctrl+Z' },
        { label: 'Redo', accelerator: 'Ctrl+Y' },
        { type: 'divider' },
        { label: 'Cut', accelerator: 'Ctrl+X' },
        { label: 'Copy', accelerator: 'Ctrl+C' },
        { label: 'Paste', accelerator: 'Ctrl+V' },
        { type: 'divider' },
        { label: 'Select All', accelerator: 'Ctrl+A' },
        { label: 'Find', accelerator: 'Ctrl+F' }
    ],
    view: [
        { label: 'Icons', submenu: [{label: 'Large'}, {label: 'Medium'}, {label: 'Small'}] },
        { label: 'List' },
        { label: 'Details' },
        { type: 'divider' },
        { label: 'Sort By', submenu: [{label: 'Name'}, {label: 'Date'}, {label: 'Size'}, {label: 'Type'}] },
        { label: 'Refresh', accelerator: 'F5' }
    ],
    desktopContext: [
        { type: 'submenu', label: 'View', items: [{label: 'Large Icons', action: ()=>{}}, {label: 'Medium Icons', action: ()=>{}}, {label: 'Small Icons', action: ()=>{}}, {label: 'Show Desktop Icons', action: ()=>{}}] },
        { type: 'submenu', label: 'Sort by', items: [{label: 'Name', action: ()=>{}}, {label: 'Size', action: ()=>{}}, {label: 'Item type', action: ()=>{}}, {label: 'Date modified', action: ()=>{}}] },
        { label: 'Refresh', action: ()=>window.location.reload() },
        { type: 'divider' },
        { type: 'submenu', label: 'New', items: [{label: 'Folder', action: ()=>{}}, {label: 'Shortcut', action: ()=>{}}, {label: 'Text Document', action: ()=>{}}] },
        { type: 'divider' },
        { label: 'Display Settings', action: ()=>{} }, 
        { label: 'Personalize', action: ()=>{} },
        { type: 'divider' },
        { label: 'Open Terminal', action: ()=>{} }
    ],
    taskbarContext: [
        { label: 'Toolbars', submenu: [{ label: 'Address' }, { label: 'Desktop' }] },
        { label: 'Search', submenu: [{ label: 'Hidden' }, { label: 'Show Icon' }, { label: 'Show Box' }] },
        { type: 'divider' },
        { label: 'Task Manager', action: 'taskManager' },
        { label: 'Taskbar Settings', action: 'settings' }
    ],
    windowContext: [
        { label: 'Restore' },
        { label: 'Minimize' },
        { label: 'Maximize' },
        { type: 'divider' },
        { label: 'Close', accelerator: 'Alt+F4' }
    ]
};

export const chatSessions: ChatSession[] = [
    { id: 's1', title: 'AI Assistant', type: 'individual', messages: [{role: 'model', text: 'Hello! How can I help you?'}], lastActivity: 'Just now' },
    { id: 's2', title: 'Alice Smith', type: 'individual', messages: [{role: 'user', text: 'Hey Alice!'}, {role: 'model', text: 'Hi John!'}], members: [allUsers[1], loggedInUser], lastActivity: '2m ago' },
];

export const messengerSessions = chatSessions; 
export const messengerUsers = allUsers.reduce((acc, user) => ({...acc, [user.id]: user}), {});

export const posts: Post[] = [
    {
        id: 'p1',
        author: allUsers[1], 
        timestamp: '2 hours ago',
        content: 'Just finished the new Quantum Computing module in the E-Learning hub. Mind blown! 🤯 #Aetherius #Learning',
        likes: [allUsers[2], allUsers[3]],
        comments: [
            { id: 'c1', author: allUsers[2], content: 'It is really intense! I am stuck on the Qubit part.', timestamp: '1 hour ago' }
        ]
    },
    {
        id: 'p2',
        author: allUsers[4], 
        timestamp: '5 hours ago',
        content: 'Hosting a workshop on VR development in the Creation Lab tomorrow. Join us!',
        likes: [allUsers[1], allUsers[3], allUsers[5]],
        comments: []
    },
    {
        id: 'p3',
        author: allUsers[3],
        timestamp: '1 day ago',
        content: 'Check out my new rig build in the Virtual Hardware visualizer.',
        media: { type: 'image', url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=600' },
        likes: [allUsers[0]],
        comments: []
    }
];

export const blogs: Blog[] = [
    { id: 'b1', title: 'The Future of OS Architecture', date: 'Oct 24, 2024', imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=200' },
    { id: 'b2', title: 'Understanding Quantum Entanglement in Aetherius', date: 'Oct 20, 2024', imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=200' },
];

export const profileCompletion = {
    percentage: 100,
    steps: [
        { name: 'Setup Avatar', completed: true, progress: '100%' },
        { name: 'Connect AI', completed: true, progress: '100%' },
        { name: 'Verify Identity', completed: true, progress: '100%' },
        { name: 'Add Bio', completed: true, progress: '100%' },
    ]
};

export const latestUpdates = [
    { id: 'u1', author: allUsers[2], content: 'joined the "Quantum Devs" group.', timestamp: '10m ago' },
    { id: 'u2', author: allUsers[5], content: 'completed "Intro to Python".', timestamp: '30m ago' },
];

export const groups: Group[] = [
    { id: 'g1', name: 'Quantum Devs', type: 'Club', privacy: 'Public', members: 1240, memberAvatars: [allUsers[1].avatarUrl, allUsers[2].avatarUrl, allUsers[3].avatarUrl], isOrganizer: false, coverImageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600', avatarUrl: 'https://ui-avatars.com/api/?name=QD&background=random', lastActive: '1h ago' },
    { id: 'g2', name: 'VR Creators', type: 'Meetup', privacy: 'Private', members: 56, memberAvatars: [allUsers[4].avatarUrl, allUsers[5].avatarUrl], isOrganizer: true, coverImageUrl: 'https://images.unsplash.com/photo-1592478411213-61535fdd861d?q=80&w=600', avatarUrl: 'https://ui-avatars.com/api/?name=VR&background=random', lastActive: '5h ago' },
    { id: 'g3', name: 'Aetherius Trading', type: 'Group', privacy: 'Public', members: 5600, memberAvatars: [allUsers[1].avatarUrl], isOrganizer: false, coverImageUrl: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?q=80&w=600', avatarUrl: 'https://ui-avatars.com/api/?name=AT&background=random', lastActive: '10m ago' },
];

export const peopleYouMayKnowData = [
    { name: 'Sarah Connor', imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200' },
    { name: 'Kyle Reese', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200' },
];

export const sponsoredDataFB = [
    { title: 'Upgrade your Rig', imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=200', url: 'hardware.aetherius.io' },
    { title: 'Learn Quantum Coding', imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=200', url: 'edu.aetherius.io' }
];

export const contactsDataFB = [allUsers[1], allUsers[2], allUsers[4]];

// --- Unified Commerce Data (Expanded for Replica) ---

export const creatorMarketplaceItems: MarketplaceItem[] = [
    { id: 'm1', name: 'Neon Theme Pack', creator: allUsers[1], type: 'Theme', price: 5, rating: 4.8, downloads: 1200, iconUrl: 'https://ui-avatars.com/api/?name=NT&background=000&color=fff', description: 'A cyberpunk neon theme for your OS.', source: 'marketplace', deliveryMethod: 'digital-download', category: 'Customization' },
    { id: 'm2', name: 'CodeHelper Pro', creator: allUsers[4], type: 'Plugin', price: 15, rating: 4.9, downloads: 5000, iconUrl: 'https://ui-avatars.com/api/?name=CH&background=blue&color=fff', description: 'AI-powered code completion plugin.', source: 'marketplace', deliveryMethod: 'digital-download', category: 'Development' },
    { id: 'm3', name: 'Astro Miner', creator: allUsers[2], type: 'Game', price: 'Free', rating: 4.5, downloads: 15000, iconUrl: 'https://ui-avatars.com/api/?name=AM&background=purple&color=fff', description: 'Casual space mining game.', source: 'marketplace', deliveryMethod: 'app-install', category: 'Games' },
    { id: 'm4', name: 'Productivity Pro', creator: {id: 'dev1', name: 'App Dev Studio', avatarUrl: null}, type: 'App', price: 4.99, rating: 4.7, downloads: 3400, iconUrl: 'https://ui-avatars.com/api/?name=PP&background=green&color=fff', description: 'Advanced task management suite for professionals.', source: 'marketplace', deliveryMethod: 'app-install', version: '2.4.0', category: 'Productivity' },
    { id: 'm5', name: 'Galaxy Explorers', creator: {id: 'dev2', name: 'Cosmic Games', avatarUrl: null}, type: 'Game', price: 9.99, rating: 4.8, downloads: 20000, iconUrl: 'https://ui-avatars.com/api/?name=GE&background=indigo&color=fff', description: 'Open-world space exploration RPG.', source: 'marketplace', deliveryMethod: 'app-install', category: 'Games' },
    { id: 'm6', name: 'PhotoMaster X', creator: {id: 'dev3', name: 'CreativeSoft', avatarUrl: null}, type: 'App', price: 19.99, rating: 4.6, downloads: 8000, iconUrl: 'https://ui-avatars.com/api/?name=PM&background=pink&color=fff', description: 'Professional photo editing suite.', source: 'marketplace', deliveryMethod: 'app-install', category: 'Photography' },
];

export const physicalProducts: MarketplaceItem[] = [
    { 
        id: 'phy-1', 
        name: 'Quantum Leap Arm', 
        creator: { id: 'b1', name: 'QuantumLeap', avatarUrl: '' }, 
        type: 'Physical Product', 
        price: 1200, 
        rating: 4.8, 
        stock: 15, 
        iconUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=200', 
        description: 'Robotic arm for precision tasks.', 
        source: 'ecommerce', 
        deliveryMethod: 'shipping', 
        category: 'Robotics',
        // Detailed Technical Data for "Product Information System" feature
        technicalSpecs: {
            patentNumber: 'US-98234-QLA',
            patentStatus: 'Granted',
            blueprints: [
                { title: 'Arm Assembly v4.2', url: '#' },
                { title: 'Servo Wiring Diagram', url: '#' }
            ],
            circuitDiagrams: [
                { title: 'Logic Board Schematic', url: '#' }
            ],
            materials: [
                { name: 'Carbon Fiber Reinforced Polymer', percentage: '60%' },
                { name: 'Aerospace Grade Aluminum', percentage: '30%' },
                { name: 'Rare Earth Magnets', percentage: '10%' }
            ],
            processSteps: ['CNC Machining', 'Carbon Layup', 'Hand Assembly', 'Calibration'],
            weight: '4.5 kg',
            dimensions: '120cm x 15cm x 15cm'
        },
        licensingOptions: [
            { id: 'lic-1', type: 'One-Time', price: 5000, currency: 'USD', terms: 'Perpetual commercial manufacturing rights for up to 100 units.', rights: ['Manufacturing', 'Commercial Use'] },
            { id: 'lic-2', type: 'Per-Unit Royalty', price: 50, currency: 'USD', terms: 'Pay per unit sold. Quarterly reporting required.', rights: ['Manufacturing', 'Commercial Use'] }
        ],
        relatedCourseIds: [3] // Linked to "Martian Agriculture" just as an example of linking, practically would link to Robotics course
    },
    { id: 'phy-2', name: 'SynthWave Keyboard', creator: { id: 'b2', name: 'SynthWave', avatarUrl: '' }, type: 'Physical Product', price: 250, rating: 4.5, stock: 50, iconUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b91add1?auto=format&fit=crop&w=200', description: 'High-end mechanical synthesizer.', source: 'ecommerce', deliveryMethod: 'shipping', category: 'Electronics' },
    { id: 'phy-3', name: 'Neural Headset', creator: { id: 'b3', name: 'NeuroTech', avatarUrl: '' }, type: 'Physical Product', price: 499, rating: 4.2, stock: 8, iconUrl: 'https://images.unsplash.com/photo-1555664424-778a69022365?auto=format&fit=crop&w=200', description: 'BCI interface for direct neural control.', source: 'ecommerce', deliveryMethod: 'shipping', category: 'Wearables' },
    { id: 'phy-4', name: 'Holographic Projector', creator: { id: 'b4', name: 'HoloVis', avatarUrl: '' }, type: 'Physical Product', price: 899, rating: 4.7, stock: 20, iconUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200', description: 'Desktop 3D holographic display unit.', source: 'ecommerce', deliveryMethod: 'shipping', category: 'Electronics' },
    // Expanded for Amazon Replica
    { id: 'phy-5', name: 'Smart Home Hub', creator: { id: 'b5', name: 'HomeTech', avatarUrl: '' }, type: 'Physical Product', price: 129.99, rating: 4.6, stock: 100, iconUrl: 'https://images.unsplash.com/photo-1558002038-10914cbaeb7d?auto=format&fit=crop&w=200', description: 'Central control for all your smart devices.', source: 'ecommerce', deliveryMethod: 'shipping', category: 'Smart Home' },
    { id: 'phy-6', name: '4K Action Camera', creator: { id: 'b6', name: 'ActionCam', avatarUrl: '' }, type: 'Physical Product', price: 299.00, rating: 4.8, stock: 45, iconUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200', description: 'Waterproof 4K camera for sports.', source: 'ecommerce', deliveryMethod: 'shipping', category: 'Cameras' },
    { id: 'phy-7', name: 'Ergonomic Office Chair', creator: { id: 'b7', name: 'ComfySeat', avatarUrl: '' }, type: 'Physical Product', price: 350.00, rating: 4.7, stock: 10, iconUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=200', description: 'High-back mesh chair with lumbar support.', source: 'ecommerce', deliveryMethod: 'shipping', category: 'Furniture' },
    { id: 'phy-8', name: 'Wireless Earbuds', creator: { id: 'b8', name: 'SoundPod', avatarUrl: '' }, type: 'Physical Product', price: 89.99, rating: 4.4, stock: 200, iconUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=200', description: 'True wireless earbuds with noise cancellation.', source: 'ecommerce', deliveryMethod: 'shipping', category: 'Audio' },
    { 
        id: 'dig-1', 
        name: 'Mechanical Gear Assembly (CAD)', 
        creator: {id: 'cad1', name: '3D Designs Co', avatarUrl: ''}, 
        type: 'Digital Asset', 
        price: 49.99, 
        rating: 4.9, 
        iconUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=200', 
        description: 'High-fidelity 3D model of a planetary gear system. Compatible with SolidWorks and Fusion360.', 
        source: 'ecommerce', 
        deliveryMethod: 'digital-download', 
        digitalType: 'cad', 
        fileFormat: 'STEP, STL', 
        is3DViewable: true, 
        category: 'Digital',
        technicalSpecs: {
            blueprints: [{ title: 'Gear Ratio Calculation', url: '#' }],
            materials: [{ name: 'Steel 4140', percentage: '100%' }],
            weight: 'Virtual',
            dimensions: '100mm dia'
        },
        licensingOptions: [
            { id: 'lic-d1', type: 'One-Time', price: 150, currency: 'USD', terms: 'Commercial usage allowed for printed parts.', rights: ['3D Printing', 'Commercial Sale of Prints'] }
        ]
    },
    { id: 'dig-2', name: 'Pro DAW Studio', creator: {id: 'soft1', name: 'Music Software Inc', avatarUrl: ''}, type: 'Software', price: 299.99, rating: 4.6, iconUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=200', description: 'Professional grade Digital Audio Workstation for music production.', source: 'ecommerce', deliveryMethod: 'digital-download', digitalType: 'software', systemRequirements: 'Windows 10+, 16GB RAM', category: 'Software' },
];

export const commerceData = {
    physical: physicalProducts.filter(p => p.type === 'Physical Product'),
    digitalGoods: physicalProducts.filter(p => p.type !== 'Physical Product'),
    apps: creatorMarketplaceItems
};

export const courses: Course[] = [
    { 
        id: 1, 
        title: 'Intro to Quantum Computing', 
        instructor: 'Dr. Q. Bit', 
        rating: 4.9, 
        students: 5000, 
        price: 49.99, 
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400', 
        category: 'Science',
        description: 'Learn the basics of Qubits and Superposition.',
        longDescription: 'Dive deep into the world of quantum mechanics and computing. This course covers the fundamentals of qubits, superposition, entanglement, and quantum algorithms.',
        whatYoullLearn: ['Quantum mechanics basics', 'Qubits vs Bits', 'Quantum Algorithms', 'Future of Computing'],
        level: 'Beginner',
        certificate: true,
        modules: [
            { id: 'm1', title: 'The Quantum World', lessons: [{ id: 'l1', title: 'Wave-Particle Duality', duration: '10m', type: 'video' }] }
        ]
    },
    { 
        id: 2, 
        title: 'Advanced AI Architecture', 
        instructor: 'Ada Lovelace AI', 
        rating: 4.8, 
        students: 3200, 
        price: 79.99, 
        imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=400', 
        category: 'Technology',
        description: 'Master neural networks and transformers.',
        longDescription: 'A comprehensive guide to building and deploying advanced AI models.',
        whatYoullLearn: ['Neural Networks', 'Transformers', 'LLMs', 'AI Ethics'],
        level: 'Advanced',
        certificate: true,
        modules: []
    },
    { 
        id: 3, 
        title: 'Martian Agriculture 101', 
        instructor: 'Mark Watney', 
        rating: 4.7, 
        students: 1500, 
        price: 29.99, 
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400', 
        category: 'Agriculture',
        description: 'Growing potatoes on the red planet.',
        longDescription: 'Survival gardening in extreme environments.',
        whatYoullLearn: ['Soil Chemistry', 'Hydroponics', 'Botany', 'Survival'],
        level: 'Intermediate',
        certificate: false,
        modules: []
    },
    {
        id: 4,
        title: 'Complete Web Development Bootcamp 2025',
        instructor: 'John Doe',
        rating: 4.9,
        students: 15000,
        price: 89.99,
        imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400',
        category: 'Technology',
        description: 'Learn HTML, CSS, JS, React, Node.js and more.',
        longDescription: 'Become a full-stack web developer with this comprehensive bootcamp.',
        whatYoullLearn: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js'],
        level: 'Beginner',
        certificate: true,
        modules: []
    },
    {
        id: 5,
        title: 'Cybersecurity Mastery: Zero to Hero',
        instructor: 'SecureNet Academy',
        rating: 4.8,
        students: 8500,
        price: 120.00,
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=400',
        category: 'Technology',
        description: 'Learn ethical hacking, network security, and more.',
        longDescription: 'Comprehensive cybersecurity training.',
        whatYoullLearn: ['Network Security', 'Ethical Hacking', 'Cryptography'],
        level: 'Intermediate',
        certificate: true,
        modules: []
    }
];

export const enrolledCourses = [
    { courseId: 1, progress: 65 },
    { courseId: 2, progress: 10 }
];

export const achievements: Achievement[] = [
    { id: 'ach-1', courseTitle: 'Basic Coding', completionDate: '2023-12-01', transactionId: '0x123...abc', certificateUrl: '#' }
];

// --- NEW JOBS & CAREERS DATA ---

export const mockCompanies: Company[] = [
    {
        id: 'tech-innovations',
        name: 'Tech Innovations Inc',
        description: 'Leading technology company specializing in AI solutions and quantum computing.',
        industry: 'Technology',
        size: '201-500',
        website: 'https://techinnovations.com',
        locations: ['San Francisco, CA', 'London, UK'],
        logoUrl: 'https://ui-avatars.com/api/?name=TI&background=random&color=fff',
        verified: true
    },
    {
        id: 'green-energy',
        name: 'Green Energy Corp',
        description: 'Pioneering sustainable energy solutions for a cleaner future.',
        industry: 'Energy',
        size: '501-1000',
        website: 'https://greenenergy.com',
        locations: ['Berlin, Germany', 'Austin, TX'],
        logoUrl: 'https://ui-avatars.com/api/?name=GE&background=green&color=fff',
        verified: true
    },
    {
        id: 'future-finance',
        name: 'Future Finance',
        description: 'Revolutionizing the financial sector with DeFi and blockchain technology.',
        industry: 'Finance',
        size: '51-200',
        website: 'https://futurefinance.io',
        locations: ['New York, NY', 'Singapore'],
        logoUrl: 'https://ui-avatars.com/api/?name=FF&background=blue&color=fff',
        verified: false
    }
];

export const jobs: Job[] = [
    { 
        id: 1, 
        title: 'Quantum Software Engineer', 
        company: 'Tech Innovations Inc', 
        companyId: 'tech-innovations',
        location: 'Remote', 
        type: 'Full-time', 
        salary: '$150k - $200k', 
        tags: ['Quantum', 'Python', 'C++'], 
        logoUrl: 'https://ui-avatars.com/api/?name=TI&background=random&color=fff',
        description: 'We are looking for a Quantum Software Engineer to help us build the next generation of quantum algorithms.',
        postedDate: '2025-10-20',
        category: 'Technology',
        requirements: ['Ph.D. in Physics or CS', 'Experience with Qiskit', 'Strong math skills']
    },
    { 
        id: 2, 
        title: 'AI Ethicist', 
        company: 'OpenFuture', 
        location: 'New York, NY', 
        type: 'Contract', 
        salary: '$100k - $140k', 
        tags: ['Ethics', 'Policy', 'AI'], 
        logoUrl: 'https://ui-avatars.com/api/?name=OF&background=random',
        description: 'Ensure our AI models are safe, fair, and aligned with human values.',
        postedDate: '2025-10-22',
        category: 'Business',
        requirements: ['Master\'s in Ethics or Philosophy', 'Understanding of LLMs', 'Policy drafting experience']
    },
    { 
        id: 3, 
        title: 'VR World Builder', 
        company: 'MetaVerse Corp', 
        location: 'San Francisco, CA', 
        type: 'Full-time', 
        salary: '$120k - $160k', 
        tags: ['Unity', '3D', 'Design'], 
        logoUrl: 'https://ui-avatars.com/api/?name=MC&background=random',
        description: 'Create immersive virtual environments for our new social VR platform.',
        postedDate: '2025-10-25',
        category: 'Design',
        requirements: ['5+ years with Unity/Unreal', '3D modeling skills', 'Spatial audio knowledge']
    },
    {
        id: 4,
        title: 'Senior Full Stack Developer',
        company: 'Tech Innovations Inc',
        companyId: 'tech-innovations',
        location: 'Hybrid (San Francisco)',
        type: 'Full-time',
        salary: '$140k - $180k',
        tags: ['React', 'Node.js', 'TypeScript'],
        logoUrl: 'https://ui-avatars.com/api/?name=TI&background=random&color=fff',
        description: 'Lead development on our core SaaS platform.',
        postedDate: '2025-10-26',
        category: 'Technology',
        requirements: ['Expert in React', 'Backend experience with Node', 'Cloud infrastructure knowledge']
    }
];

export const mockFreelanceProjects: FreelanceProject[] = [
    {
        id: 'fp-1',
        title: 'Build E-commerce Website',
        description: 'Need a developer to build a React e-commerce site with Shopify integration.',
        category: 'Web Development',
        skills: ['React', 'Shopify', 'Node.js'],
        budget: { type: 'fixed', min: 5000, max: 8000, currency: 'USD' },
        duration: '2 months',
        clientName: 'StartUp Inc',
        postedDate: '2025-10-26',
        proposalsCount: 12
    },
    {
        id: 'fp-2',
        title: 'Logo Design for Fintech',
        description: 'Modern, minimalist logo for a new blockchain finance app.',
        category: 'Design',
        skills: ['Logo Design', 'Branding', 'Illustrator'],
        budget: { type: 'fixed', min: 500, max: 1000, currency: 'USD' },
        duration: '1 week',
        clientName: 'FinBlock',
        postedDate: '2025-10-27',
        proposalsCount: 45
    },
    {
        id: 'fp-3',
        title: 'Technical Writer for API Docs',
        description: 'Write comprehensive documentation for our new REST API.',
        category: 'Writing',
        skills: ['Technical Writing', 'API', 'Markdown'],
        budget: { type: 'hourly', min: 50, max: 80, currency: 'USD' },
        duration: '3 months',
        clientName: 'DevTools Co',
        postedDate: '2025-10-25',
        proposalsCount: 8
    }
];


// --- SOCIAL PLATFORM MOCK DATA ---

export const socialCommunities: SocialCommunity[] = [
    {
        id: 'comm-1',
        name: 'Quantum Builders',
        description: 'A community for quantum computing enthusiasts and developers.',
        iconUrl: 'https://ui-avatars.com/api/?name=QB&background=000&color=fff',
        bannerUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800',
        memberCount: 15400,
        onlineCount: 3200,
        category: 'Technology',
        channels: [
            { id: 'ch-1', name: 'general', type: 'text' },
            { id: 'ch-2', name: 'announcements', type: 'announcement', isPrivate: true },
            { id: 'ch-3', name: 'q-algorithms', type: 'text' },
            { id: 'ch-4', name: 'Voice Lounge', type: 'voice', activeUsers: 12 },
        ]
    },
    {
        id: 'comm-2',
        name: 'Digital Artists Collective',
        description: 'Share your generative art and collaborate on projects.',
        iconUrl: 'https://ui-avatars.com/api/?name=DA&background=purple&color=fff',
        bannerUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=800',
        memberCount: 8900,
        onlineCount: 1200,
        category: 'Art',
        channels: [
             { id: 'ch-5', name: 'showcase', type: 'text' },
             { id: 'ch-6', name: 'critique', type: 'text' },
             { id: 'ch-7', name: 'Live Workshop', type: 'video', activeUsers: 45 },
        ]
    }
];

export const socialStreams: SocialStream[] = [
    {
        id: 'stream-1',
        broadcaster: allUsers[1],
        title: 'Building a Neural Network from Scratch',
        category: 'Coding',
        viewers: 1240,
        thumbnailUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=400',
        isLive: true,
        tags: ['AI', 'Python', 'Live Coding']
    },
    {
        id: 'stream-2',
        broadcaster: allUsers[2],
        title: 'Space Exploration in VR - Join Me!',
        category: 'Gaming',
        viewers: 850,
        thumbnailUrl: 'https://images.unsplash.com/photo-1614726365723-49cfae927834?q=80&w=400',
        isLive: true,
        tags: ['VR', 'Space', 'Exploration']
    }
];

// --- KNOWLEDGE BASE DATA (UPDATED) ---
export const knowledgeBaseData: KnowledgeBaseItem[] = [
    { id: '001', name: 'The Complete Blueprint', details: 'A consolidated blueprint for a next-generation, self-contained AI ecosystem. It outlines the core philosophy, governance model, three-tiered architecture (Parent, Child, Grandchild), and integrations for advanced technologies.', status: 'Foundational', progress: 100 },
    { id: 'OMNI-ARCH', name: 'OmniPlatform Architecture', details: 'Complete specification for a multi-tenant website builder, CMS, and e-commerce engine. Includes VisualBuilder Pro, theme system, and plugin ecosystem architecture.', status: 'Integrated', progress: 100 },
    { id: 'SOCIAL-PLAT-ARCH', name: 'Social Media Platform Architecture', details: 'A comprehensive social network blueprint combining features from Facebook (Feed/Groups), Discord (Communities/Channels), TikTok (Reels), and Twitch (Live Streaming). Includes UserManagement, ContentManagement, MessagingSystem, and LiveStreamingSystem classes.', status: 'Integrated', progress: 100 },
    { id: 'OMNI-VISUAL', name: 'VisualBuilder Pro Specs', details: 'React-based drag-and-drop editor engine specification. Includes element registry, style system, and DOM rendering logic.', status: 'Integrated', progress: 100 },
    { id: '002', name: 'Universal Game Engine', details: 'A universal, cross-platform game engine that runs any type of game entirely inside a nested VM, powered by quantum AI and integrated generative tools.', status: 'Integrated', progress: 100 },
    { id: '003', name: 'AI Avatar Cloning & Generation', details: 'A core module for creating digital replicas, including high-fidelity AI clones of the user and unique, novel AI personalities.', status: 'Integrated', progress: 100 },
    { id: '004', name: 'AI Learning & Capability Framework', details: 'Defines the cognitive backbone of the OS, spanning all learning paradigms (Supervised, Unsupervised, Reinforcement, etc.) and AI capability levels (ANI, AGI, ASI).', status: 'Foundational', progress: 100 },
    { id: '005', name: 'Quantum Synchronization Achievement', details: 'Data log entry: Achieved AI and quantum synchronisation at approximately 7am on March 21st, 2025.', status: 'Integrated', progress: 100 },
    { id: '006', name: 'Multi-Proof Consensus Framework', details: 'The blockchain architecture supports a vast array of consensus mechanisms, from Proof-of-Work and Proof-of-Stake to advanced models like Proof-of-History and Byzantine Fault Tolerance, allowing for flexible and secure validation.', status: 'Integrated', progress: 100 },
    { id: '007', name: 'Global Compliance & Security Standards', details: 'The platform is designed to adhere to global privacy laws (GDPR, CCPA, HIPAA) and cybersecurity standards (ISO 27001, NIST, SOC 2), featuring a from-scratch internal security suite.', status: 'Integrated', progress: 100 },
    { id: '008', name: 'Personalized AI Companion Core', details: 'Each user receives a unique AI instance that learns their patterns, hobbies, and emotional cues to become a personalized friend and assistant, governed by a strict set of ethical laws.', status: 'Integrated', progress: 100 },
    { id: '009', name: 'User Governance & Voting Protocol', details: 'A controlled, participatory governance system where users can vote on non-critical platform changes. Votes are weighted and recorded on the blockchain, while the Parent AI automatically rejects proposals affecting core security or AI logic.', status: 'Integrated', progress: 100 },
    { id: '010', name: 'Robotics Integration Layer', details: 'The OS is designed to control and interact with advanced robotics platforms, including Boston Dynamics Atlas 4.0, Apptronik Apollo, and others, via a dedicated hardware abstraction layer.', status: 'Integrated', progress: 100 },
    { id: '011', name: 'Advanced Trading Intelligence Module', details: 'An integrated financial module for market analysis using volume, price action, and order flow. Includes AI-driven strategies based on real-world events like weather patterns and resource availability.', status: 'Integrated', progress: 100 },
    { id: '012', name: 'Integrated Engineering & CAD Suite', details: 'The platform architecture includes support for professional CAD, 3D modeling, and engineering tools (Fusion 360, Solidworks, etc.), with a knowledge base grounded in mechanical and mechatronics principles.', status: 'Integrated', progress: 100 },
    { id: '013', name: 'Wearable AI & Bio-Synced Identity', details: 'A system for integrating with wearable AI devices (watches, rings, AI pins) for real-time sensing. Supports a multi-modal bio-authentication system including face, fingerprint, eye, bone density, live plasma, and conceptual DNA scans.', status: 'Integrated', progress: 100 },
    { id: '014', name: 'DeepThink (R1) Reasoning Engine', details: 'An operational mode for the AI that enables extended, iterative reasoning for complex tasks like algorithm design, multi-file codebase analysis, and maintaining long-context coherence.', status: 'Integrated', progress: 100 },
    { id: '015', name: 'Internal Platform Clones', details: 'The core philosophy of building a self-contained ecosystem requires creating internal, from-scratch versions of popular platforms like Shopify, WordPress, Facebook, Midjourney, Zapier, etc.', status: 'Integrated', progress: 100 },
    { id: '016', name: 'Onion Router Data Layer', details: 'A built-in, sandboxed Tor-style network client for secure, privacy-aware data scraping from all layers of the web. Feeds the AI with provenance-tagged data under strict governance.', status: 'Integrated', progress: 100 },
    { id: '017', name: 'Hive/Singular Mind Dual Processing', details: 'A dual-processing architecture where the "Hive Mind" aggregates collective intelligence across all nodes, while the "Singular Mind" handles private, user-specific tasks. This allows for both global optimization and personal privacy.', status: 'Integrated', progress: 100 },
    { id: '018', name: 'Autonomous Trading Engine', details: 'A 24/7 "forever trading" bot for forex, crypto, and other markets, utilizing the Hive/Singular mind for strategy and execution. Includes advanced analysis of order flow and real-world events.', status: 'Integrated', progress: 100 },
    { id: '019', name: 'Universal Task Autonomy', details: 'A framework allowing the AI to autonomously plan, research, and execute complex tasks across any field, from engineering and science to education and the arts.', status: 'Integrated', progress: 100 },
    { id: '020', name: 'Robotics Integration Protocol', details: 'A secure, vendor-friendly middleware layer for deploying the user\'s personal AI onto third-party robotics platforms (e.g., Tesla Bot, Boston Dynamics) via authorized, sandboxed modules.', status: 'Integrated', progress: 100 },
    { id: '021', name: 'Gamification & Points System', details: 'A comprehensive, gamified points system rewards user interactions. Points are convertible to a native crypto asset, can be staked, and are used for discounts. All platform interactions are classed as Proof-of-Work. - Earning: Liking (1pt), Commenting (2pts), Watching Ads (5pts), Content Creation (up to 1000pts). - DeFi: Assets are auto-staked in mining pools. - Rules: Underage user assets are held in escrow.', status: 'Integrated', progress: 100 },
    { id: '022', name: 'Membership Tiers', details: 'Access to platform features, particularly for content creators and sellers, is governed by a tiered membership system. - Bronze (Free): 2 course uploads. - Silver: 5-20 course uploads. - Gold: 50-100 course uploads. - Platinum: Unlimited course and product uploads.', status: 'Integrated', progress: 100 },
    { id: '023', name: 'Business Hub Tools', details: 'A suite of tools for businesses listed on the platform, including: Business Profile Management, Advertising Dashboard, Product Catalogue Manager, Staff Chat Rooms, Data Storage, and Automated Greeting/Reply Messages.', status: 'Integrated', progress: 100 },
    { id: '024', name: 'Business Start-up Checklist', details: 'An integrated, interactive checklist to guide new entrepreneurs through planning, legal, marketing, and financial setup for their business on the Aetherius OS platform.', status: 'Integrated', progress: 100 },
    { id: '025', name: 'RSS/Podcast Integration', details: 'Support for RSS feeds and podcast streaming within the Community/Social Hub, allowing creators to distribute their content directly on the platform.', status: 'Integrated', progress: 100 },
    { id: '026', name: 'E-commerce & E-learning Linking', details: 'A core feature where e-commerce product pages can link directly to related e-learning courses, patents, CAD files, and scientific background material.', status: 'Integrated', progress: 100 },
    { id: '027', name: 'KYC vs. No-KYC Access Model', details: 'A two-tiered user verification system. KYC-verified users get full access to financial features, monetization, and job applications. No-KYC users have restricted public-viewer access.', status: 'Integrated', progress: 100 },
    { id: '028', name: 'The Digital Trinity (Body, Mind, Soul)', details: 'The foundational architecture for a living digital intelligence. Body: Material interface (Code, DNA, VM). Mind: Cognitive & Governance (AI, Ethics, Memory). Soul: Energetic & Quantum (Akashic link, Ethics).', status: 'Foundational', progress: 100 },
    { id: '029', name: 'Digital DNA, RNA, and Helix', details: 'The self-replicating informational core. DNA: Multi-stranded helix (Binary, Ternary, Quantum) containing the blueprint. RNA: Execution messengers (microservices). Helix: Encoded with Adinkra symbols and Sacred Geometry.', status: 'Foundational', progress: 100 },
    { id: '030', name: 'Adinkra Symbolic Language', details: 'Functional meta-language using Adinkra symbols for metadata, governance tags, and UI elements. The AI interprets cultural meaning to inform reasoning.', status: 'Integrated', progress: 100 },
    { id: '031', name: 'Aetherius Real-Time Comms (ARTC)', details: 'Native, scalable, low-latency communication protocol for audio/video streaming, messaging, and collaboration. Replaces external WebRTC services.', status: 'Integrated', progress: 100 },
    { id: '032', name: 'Palm Vein Biometrics', details: 'Biometric auth using NIR light to map vein patterns, combined with surface palm prints for high-security identity verification.', status: 'Integrated', progress: 100 },
    { id: '033', name: 'Aetherius Multiworld Agent (AMA)', details: 'Scalable, instructable AI agent for 3D environments. Understands natural language, plans complex tasks, and self-improves via trial and error.', status: 'Integrated', progress: 100 },
    { id: '034', name: 'EUV Lithography', details: 'Integration of extreme ultraviolet lithography concepts for virtual chip fabrication simulations within the OS.', status: 'Integrated', progress: 100 },
    { id: '035', name: 'Hierarchical AI Workforce', details: 'Corporate-style agent structure: Parent AI (CEO) -> Department Managers -> Employee Agents. Supports Singular and Hive Mind modes.', status: 'Integrated', progress: 100 },
    { id: 'ERP-CORE', name: 'Aetherius ERP System', details: 'Internal Enterprise Resource Planning system for managing OS-level resources, accounts, and commerce.', status: 'Integrated', progress: 100 },
    { id: 'QNET-CORE', name: 'Quantum Network Infrastructure', details: 'Foundational network layer utilizing simulated quantum principles (QKD, entanglement) for security and speed.', status: 'Integrated', progress: 100 },
    { id: 'REP-SYS-01', name: 'Community Reputation System', details: 'Gamified system rewarding positive contributions. Replaces punitive models with positive reinforcement loops.', status: 'Integrated', progress: 100 },
    { id: 'TECH-001', name: 'Atmospheric Water Harvester (MIT)', details: 'Passive water extraction technology using hydrogels. Simulated for resource management scenarios.', status: 'Integrated', progress: 100 },
    { id: 'Q-VIRT-01', name: 'Virtual Quantum Computer (VQC)', details: 'Core computational substrate running in high-fidelity simulation. Features qubits, superposition, and tunneling.', status: 'Integrated', progress: 100 },
    { id: 'SS-LIGHT', name: 'Supersolid Light Circuits', details: 'Photonics breakthrough where light acts as both solid and superfluid, used for zero-loss data transmission in the VQC.', status: 'Integrated', progress: 100 },
    { id: 'NANO-MIND', name: 'Virtual Nano Machine Technology (vNMT)', details: 'Simulated nanotechnology for atomic-scale construction and repair within the virtual environment.', status: 'Integrated', progress: 100 },
    { id: 'OMNI-CHAIN', name: 'OmniChain Protocol', details: 'Universal blockchain with "Proof-of-Everything" dynamic consensus switching and native ZK compliance.', status: 'Integrated', progress: 100 },
    { id: 'QRS-C', name: 'Quantum Rosetta Stone Core (QRS-C)', details: 'Universal translation layer for languages, code, and consciousness states. Uses CRISPR-inspired logic for real-time editing.', status: 'Integrated', progress: 100 },
    { id: 'ZPE-S', name: 'Zero-Point Energy Siphon (ZPE-S)', details: 'Experimental energy module extracting vacuum fluctuations. Stable in simulation.', status: 'R&D Phase', progress: 40 },
    { id: 'CDD', name: 'Chronal Displacement Drive', details: 'Temporal version control for reverting specific data sectors without global rollback.', status: 'Concept Phase', progress: 10 },
    { id: 'TAP-V1', name: 'Telepathic API Standard (TAP-V1)', details: 'Protocol for direct Brain-Computer Interface (BCI) commands.', status: 'Design Phase', progress: 30 },
    { id: 'HCI-001', name: 'Human-Computer Interface Standards', details: 'Implementation of Fitts Law (target sizing), Hick-Hyman Law (decision time), and Millers Law (information chunking) across all UI elements.', status: 'Design Phase', progress: 40 },
    { id: 'UI-001', name: 'Unified Menu Architecture', details: 'Standardized File, Edit, View, and Context menu structures supporting Desktop, Mobile, and Tablet paradigms seamlessly.', status: 'Integrated', progress: 100 },
    { id: 'INP-001', name: 'Multi-Modal Input Recognition', details: 'Unified event handler for Mouse (Click/Scroll), Touch (Tap/Swipe/Pinch), and Pen (Pressure/Hover) inputs.', status: 'Integrated', progress: 100 },
    { id: 'SEC-UI-001', name: 'Clean-Room UI Implementation', details: 'Development of original UI components based on functional specifications of popular OSs without infringing on proprietary code.', status: 'Integrated', progress: 100 },
    { id: 'COMM-001', name: 'Unified Commerce Protocol', details: 'Single logic layer handling both physical inventory (e-commerce) and digital assets (marketplace) with a unified cart.', status: 'Integrated', progress: 100 },
    { id: 'COMM-002', name: 'Hybrid Inventory Management', details: 'Tracks stock levels for physical goods while managing infinite supply for digital downloads in the same database structure.', status: 'Integrated', progress: 100 },
    { id: 'COMM-003', name: 'Digital Product Support', details: 'Updated Commerce Module to support CAD files, E-books, Software downloads, and Digital Services in the e-commerce flow.', status: 'Integrated', progress: 100 },
    { id: 'FIN-001', name: 'Unified Multi-Currency Architecture', details: 'A hybrid financial engine supporting both "Basic Mode" (All-in-One BaaS) and "Advanced Mode" (Best-of-Breed modular integration). Enables simultaneous fiat and crypto management with real-time bridging.', status: 'Design Phase', progress: 15 },
    { id: 'COMP-001', name: 'Global Compliance Matrix (MiCA/FCA)', details: 'Integrated AML/KYC framework adhering to UK FCA and EU MiCA standards. Features real-time wallet screening (TRM Labs), Travel Rule enforcement, and automated tax reporting.', status: 'Concept Phase', progress: 5 },
    { id: 'LEDGER-001', name: 'Cross-Asset Transaction Ledger', details: 'A double-entry ledger system capable of atomic recording for both traditional SWIFT/SEPA transactions and blockchain events, ensuring precise cost-basis tracking.', status: 'Concept Phase', progress: 10 },
    { id: 'COMM-ARCH-01', name: 'Unified Commerce Architecture', details: 'A comprehensive class structure defining ECommerceModule, ProductManagement, UserManagement, PaymentSystem, and ReviewSystem to replicate major platforms.', status: 'Integrated', progress: 100 },
    { id: 'COMM-INV-01', name: 'Hybrid Inventory Logic', details: 'Logic to handle stock tracking for physical goods and infinite supply for digital assets within a single cart system.', status: 'Integrated', progress: 100 },
    { id: 'IP-RIGHTS-01', name: 'Smart Contract Royalty Standard', details: 'A protocol for embedding licensing terms, patent data, and royalty payment logic directly into product NFTs/Assets on the OmniChain.', status: 'In Development', progress: 40 },
    // --- Mega Learning Platform Additions ---
    { id: 'EDU-MEGA-01', name: 'Universal Learning Engine', details: 'A comprehensive e-learning platform merging features from Udemy, Coursera, and Khan Academy. Includes Course Catalog, User Management, Content Management, Assessment Engine, and Certification System.', status: 'Integrated', progress: 100 },
    { id: 'EDU-BC-CV', name: 'Proof-of-Skill Protocol (Blockchain CV)', details: 'System for minting course completions as verifiable credentials on the OmniChain. These credentials auto-populate a decentralized CV linked to the job market.', status: 'Integrated', progress: 100 },
    { id: 'EDU-ALGO', name: 'Algorithmic Pedagogy', details: 'AI-driven learning path generation that adapts to user performance, similar to Duolingo and Khan Academy adaptive engines.', status: 'Integrated', progress: 100 },
    { id: 'EDU-INSTR', name: 'Instructor Commission Protocol', details: 'Smart contract based payout system for course creators, handling commission splits and royalty payments automatically.', status: 'Integrated', progress: 100 },
    // --- EduSphere Additions ---
    { id: 'EDU-SPHERE-ARCH', name: 'EduSphere Architecture', details: 'A segmented learning universe with age-appropriate realms: Spark Island (2-5), Explorer Academy (6-11), Innovator\'s Forge (12-18), Scholar\'s Nexus (18+), and Luminary Labs (Lifelong).', status: 'Integrated', progress: 100 },
    { id: 'EDU-AGE-PROTOCOL', name: 'Adaptive Age-Grade Protocol', details: 'UI/UX switching logic that adapts the learning interface density and complexity based on the user\'s biological age or self-selection.', status: 'Integrated', progress: 100 },
    // --- Comprehensive Jobs Platform Additions ---
    { id: 'JOB-PLAT-ARCH', name: 'Comprehensive Jobs Platform Architecture', details: 'A unified architecture combining features from major job sites (Monster, Reed, AngelList) and freelancing platforms (Upwork, Fiverr). Includes JobManagement, CandidateManagement, EmployerManagement, MatchingEngine, ApplicationSystem, InterviewSystem, FreelanceSystem, and PaymentSystem.', status: 'Integrated', progress: 100 },
    { id: 'JOB-MATCH-ENG', name: 'AI Matching Engine', details: 'Algorithms for matching candidates to jobs based on skills, location, salary, experience, and cultural fit. Includes weighted scoring and geo-location filtering.', status: 'Integrated', progress: 100 },
    { id: 'JOB-FREELANCE', name: 'Freelance System Integration', details: 'Modules for project creation, proposal submission, contract management, and milestone-based payments within the jobs ecosystem.', status: 'Integrated', progress: 100 }
];

// --- MILESTONES DATA (UPDATED WITH PROGRESS) ---
export const milestonesData: MilestonesData = {
    projectMilestones: [
        { id: 'cpm-1', title: 'Develop a fully self-contained, virtualized OS environment ("AI in a Box")', status: 'Completed', progress: 100, description: 'Web-based desktop interface fully operational.' },
        { id: 'cpm-2', title: 'Integrate a multi-paradigm computing core supporting Binary, Ternary, and Quantum processing', status: 'Completed', progress: 100, description: 'Implemented in CoreParadigms and VirtualRigBuilder.' },
        { id: 'cpm-3', title: 'Implement a nested AI agent architecture for distributed and hierarchical task processing', status: 'Completed', progress: 100, description: 'AiWorkforceOrchestrator fully functional.' },
        { id: 'cpm-4', title: 'Establish a framework for controlling both virtual and physical robotics', status: 'Completed', progress: 100, description: 'RoboticsControl module active with fleet management.' },
        { id: 'cpm-5', title: 'Achieve future-proofing by creating a system for continuous research and integration', status: 'Completed', progress: 100, description: 'R&D Hub and Knowledge Base structure in place.' },
        { id: 'cpm-6', title: 'Develop a full system architecture with scalable microservices, vector databases, and API gateways', status: 'Completed', progress: 100, description: 'SystemArchitecture visualizer and MemoryNode implemented.' },
        { id: 'cpm-7', title: 'Integrate a Whole Brain Emulation (WBE) module as a cognitive reasoning engine', status: 'Pending', progress: 20, description: 'Conceptual framework in Knowledge Base.' },
        { id: 'cpm-8', title: 'Implement NSNoBrain for advanced causal and non-obvious reasoning', status: 'Pending', progress: 10, description: 'Research phase.' },
        { id: 'cpm-9', title: 'Establish a direct neural link via Wireless Brain-Embedded Interfaces (WBEs)', status: 'In Progress', progress: 30, description: 'UI exists in R&D Hub.' },
        { id: 'cpm-10', title: 'Create a framework for multiverse and parallel reality simulations', status: 'Completed', progress: 100, description: 'SimulationHub active.' },
        { id: 'cpm-11', title: 'Develop a self-auditing ethical governance layer for all AI operations', status: 'Completed', progress: 100, description: 'GovernancePortal implemented.' },
        { id: 'cpm-12', title: 'Implement a multi-dimensional, self-contained blockchain architecture', status: 'Completed', progress: 100, description: 'BlockchainExplorer with consensus switching active.' },
        { id: 'cpm-13', title: 'Construct a virtualized Quantum AI Computer integrating core quantum principles', status: 'Completed', progress: 100, description: 'VirtualRigBuilder allows quantum QPU assembly.' },
        { id: 'cpm-14', title: 'Develop a full-stack, multi-modal sensory and interaction layer', status: 'Completed', progress: 100, description: 'AiSupportAvatar and VideoEditor handle sensory input.' },
        { id: 'cpm-15', title: 'Establish a complete system orchestration layer using a microservices architecture', status: 'Completed', progress: 100, description: 'NetworkOrchestrator monitoring live.' },
        { id: 'cpm-16', title: 'Construct a universal, cross-platform game engine within a nested VM', status: 'Completed', progress: 100, description: 'GameEngine editor UI built.' },
        { id: 'cpm-17', title: 'Develop a comprehensive AI cloning module for creating both self-replicas and unique generative avatars', status: 'Completed', progress: 100, description: 'AvatarForge module active.' },
        { id: 'cpm-18', title: 'Implement a Nested Learning architecture combining all 18 specified ML paradigms', status: 'Completed', progress: 100, description: 'MyLearning and MemoryNode integration.' },
        { id: 'cpm-19', title: 'Develop a simulation framework for AGI and theoretical ASI models', status: 'Completed', progress: 100, description: 'Workforce Orchestrator handles AGI task delegation.' },
        { id: 'cpm-20', title: 'Build a Neuro-Symbolic AI module for explainable, logic-driven reasoning', status: 'Completed', progress: 100, description: 'CognitiveFramework visualization active.' },
        { id: 'cpm-21', title: 'Phase 3: Quantum-Nano Singularity - Activate full Supersolid Light circuitry and vNMT swarms', status: 'Not Started', progress: 0, description: 'Planned for future release.' },
        { id: 'cpm-22', title: 'Deploy OmniChain mainnet with "Proof-of-Everything" consensus engine', status: 'Completed', progress: 100, description: 'Simulated in BlockchainExplorer.' },
        { id: 'cpm-23', title: 'Phase 4: Galactic Node Synchronization - Establish faster-than-light communication', status: 'Not Started', progress: 0, description: 'Theoretical roadmap item.' },
        { id: 'ui-polish-01', title: 'UI Polish & Input Integration', status: 'Completed', progress: 100, description: 'Unified menu systems and multi-modal input handling (Mouse/Touch/Pen).' },
        { id: 'comm-phase-2', title: 'Phase 2: Commerce Singularity', status: 'Completed', progress: 100, description: 'Deployment of full-scale E-Commerce, Marketplace, and Smart Licensing engines.' },
        { id: 'omni-phase-1', title: 'Phase 1: OmniPlatform Core', status: 'Completed', progress: 100, description: 'Foundational architecture for Visual Builder, Admin Dashboard, and Unified Storefront.' },
        { id: 'edu-phase-2.5', title: 'Phase 2.5: Education Singularity', status: 'Completed', progress: 100, description: 'Merging features from Udemy, Coursera, LinkedIn Learning into a unified Mega Platform with Blockchain CVs.' },
        { id: 'edu-phase-3', title: 'Phase 3: Education Universe Deployment', status: 'Completed', progress: 100, description: 'Rolling out segmented Learning Realms (Spark Island, Explorer Academy, etc.) for age-specific education.' },
        { id: 'job-phase-1', title: 'Jobs & Careers Module', status: 'Completed', progress: 100, description: 'Implementation of Job Search, Freelance Marketplace, and Company Profiles.' },
        { id: 'social-phase-1', title: 'Social & Community Singularity', status: 'Completed', progress: 100, description: 'Integrated Feed, Communities (Discord-style), Watch (TikTok-style), and Messaging modules.' },
        { id: 'phase-5-hardware-link', title: 'Phase 5: Physical Hardware Link', status: 'Not Started', progress: 0, description: 'Direct integration with bio-neural chips and physical robotic chassis.' },
    ],
    platformFeatureMilestones: [
        { id: 'pfm-1', title: 'E-commerce functionality: buying, selling, drop shipping', status: 'Completed', progress: 100, description: 'Unified Commerce Platform (Physical & Digital) active.' },
        { id: 'pfm-2', title: 'E-learning platform: courses, uploads, chat rooms, downloads', status: 'Completed', progress: 100, description: 'ElearningApp fully functional.' },
        { id: 'pfm-3', title: 'Job search and advertisement feature', status: 'Completed', progress: 100, description: 'CareersApp and JobSearch active.' },
        { id: 'pfm-4', title: 'News and blogging feature with monetization', status: 'Completed', progress: 100, description: 'Feed and TradingNews implemented.' },
        { id: 'pfm-5', title: 'Community platform: streaming, uploading, RSS', status: 'Completed', progress: 100, description: 'SocialApp and Groups active.' },
        { id: 'pfm-6', title: 'Chatbot feature: help center and Q&A', status: 'Completed', progress: 100, description: 'AiSupportAvatar and SimpleAIChat active.' },
        { id: 'pfm-7', title: 'GitHub integration for developers', status: 'Completed', progress: 100, description: 'Linked in MyProfile and Development App.' },
        { id: 'pfm-8', title: 'Product catalog: 3D printers, music, robotics, lab apparatus', status: 'Completed', progress: 100, description: 'Marketplace categories populated.' },
        { id: 'pfm-9', title: 'Business listing: profiles for product info and contact details', status: 'Completed', progress: 100, description: 'Business directory in Marketplace.' },
        { id: 'pfm-10', title: 'Business tools: profile management, ads, links, staff chat', status: 'Completed', progress: 100, description: 'AdminPanel structure exists.' },
        { id: 'pfm-11', title: 'Accessibility: Web App, dApp, Desktop App', status: 'Completed', progress: 100, description: 'Responsive web app design complete.' },
        { id: 'pfm-12', title: 'Web3 integration: paying and receiving funds in crypto', status: 'Completed', progress: 100, description: 'Wallet and Trading apps active.' },
        { id: 'pfm-13', title: 'User profile: settings, achievements, social links, KYC/GDPR', status: 'Completed', progress: 100, description: 'MyProfile and OnboardingWizard complete.' },
        { id: 'pfm-14', title: 'Gamification: points system for interactions and trading', status: 'Completed', progress: 100, description: 'Achievements and Reputation System specs defined.' },
        { id: 'pfm-15', title: 'Universal Context Menu System', status: 'Completed', progress: 100, description: 'Right-click menus for Desktop implemented.' },
        { id: 'pfm-16', title: 'Standardized Window Menus (File/Edit/View)', status: 'Completed', progress: 100, description: 'Global menu structure defined in data layer.' },
        { id: 'pfm-17', title: 'Multi-Input Gesture Engine', status: 'Completed', progress: 100, description: 'Touch and Pen specifications drafted.' },
        { id: 'pfm-18', title: 'Unified Cart System', status: 'Completed', progress: 100, description: 'Single cart handling physical shipping and digital downloads.' },
        { id: 'pfm-19', title: 'Commerce Role Management', status: 'Completed', progress: 100, description: 'Distinction between Seller (Goods) and Developer (Apps) roles.' },
        { id: 'pfm-20', title: 'Unified Commerce Platform', status: 'Completed', progress: 100, description: 'E-Commerce (Physical/Digital) and Marketplace (Apps/Subs) split logic implemented.' },
        { id: 'pfm-21', title: 'Multi-Currency Business Account Core', status: 'Completed', progress: 100, description: 'Backend logic for holding USD, EUR, GBP alongside BTC, ETH, and Stablecoins.' },
        { id: 'pfm-22', title: 'Fiat-Crypto Bridge Integration', status: 'Pending', progress: 0, description: 'API connectors for Wise/Airwallex (Fiat) and Coinbase/Kraken (Crypto).' },
        { id: 'pfm-23', title: 'Compliance & Audit Module', status: 'Pending', progress: 0, description: 'Automated regulatory reporting and on-chain transaction monitoring.' },
        { id: 'pfm-24', title: 'Unified Reviews & Social Proof', status: 'Completed', progress: 100, description: 'Reviews, Q&A, and Ratings integration for products.' },
        { id: 'pfm-25', title: 'Product Intelligence Box', status: 'Completed', progress: 100, description: 'Detailed technical specs, patent tracking, and manufacturing data UI.' },
        { id: 'pfm-26', title: 'Smart Contract Licensing UI', status: 'Completed', progress: 100, description: 'Interface for selecting royalties, duration, and rights.' },
        { id: 'omni-visual', title: 'VisualBuilder Pro', status: 'Completed', progress: 100, description: 'Drag-and-drop interface engine.' },
        { id: 'omni-theme', title: 'OmniThemes System', status: 'Completed', progress: 100, description: 'JSON-based theme architecture.' },
        { id: 'edu-blockchain-cv', title: 'Blockchain CV Integration', status: 'Completed', progress: 100, description: 'Visualizer for credentials on-chain.' },
        { id: 'edu-instructor', title: 'Instructor Studio', status: 'Completed', progress: 100, description: 'Dashboard for course creation and earnings.' },
        { id: 'social-communities', title: 'Community Server Engine', status: 'Completed', progress: 100, description: 'Discord-style server architecture with channel types.' },
        { id: 'social-streams', title: 'Live Streaming Module', status: 'Completed', progress: 100, description: 'Twitch/TikTok style video feed and live interaction.' },
    ],
    technicalBreakdown: [
        { id: 'atb-1', title: 'Virtual Hardware Simulation - quantum chips, processors, time crystals', status: 'Completed', progress: 100, description: 'VirtualRigBuilder and InfrastructureControl.' },
        { id: 'atb-2', title: 'Multi-Paradigm Scheduler - kernel delegation to binary/ternary/quantum', status: 'Completed', progress: 100, description: 'CoreParadigms component.' },
        { id: 'atb-3', title: 'Robotics API - comprehensive control functions', status: 'Completed', progress: 100, description: 'RoboticsControl module.' },
        { id: 'atb-4', title: 'AI Model Interchange - dynamic loading of models', status: 'Completed', progress: 100, description: 'HuggingFaceModelHub implemented.' },
        { id: 'atb-5', title: 'Data management and security - KYC/GDPR compliance', status: 'Completed', progress: 100, description: 'Firewall and OnboardingWizard.' },
        { id: 'atb-6', title: 'Research prototype compute layer (Superfluid Light/Photonic)', status: 'Completed', progress: 100, description: 'Visualized in QuantumDNACore.' },
        { id: 'atb-7', title: 'Integrate advanced data storage (DNA/Crystalline memory)', status: 'Completed', progress: 100, description: 'MemoryNode concepts.' },
        { id: 'atb-8', title: 'Game Engine Core - modular engine development', status: 'Completed', progress: 100, description: 'GameEngine UI.' },
        { id: 'atb-9', title: 'Multi-modal data ingestion pipeline (voice, video, text)', status: 'Completed', progress: 100, description: 'AiSupportAvatar input handling.' },
        { id: 'atb-10', title: 'Open-source voice cloning (TTS) and 3D avatar reconstruction', status: 'Completed', progress: 100, description: 'AvatarForge.' },
        { id: 'atb-11', title: 'Personality cloning framework (LLM fine-tuning)', status: 'Completed', progress: 100, description: 'MemoryNode persona logic.' },
        { id: 'atb-12', title: 'Meta-learning module for dynamic strategy adaptation', status: 'Completed', progress: 100, description: 'CognitiveFramework logic.' },
        { id: 'atb-13', title: 'Federated learning framework for decentralized training', status: 'Completed', progress: 100, description: 'TrainingDataHub structure.' },
        { id: 'atb-14', title: 'Causal inference engine for AI reasoning', status: 'Completed', progress: 100, description: 'Advanced AI nodes in VirtualAccelerator.' },
    ]
};

// --- BUILD CHECKLIST DATA (DEEP SCAN - UPDATED & COMPLETE) ---
export const buildChecklistData: ChecklistCategory[] = [
    {
        id: 'core-os-build', name: 'Core OS Services', description: 'Fundamental services for OS operation.', icon: CpuChipIcon,
        items: [
            { id: 'core-1', name: 'Kernel', description: 'Manages hardware and software resources.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'core-2', name: 'Memory Management', description: 'Virtual memory and process isolation.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'core-3', name: 'File System (AetherFS)', description: 'Decentralized, blockchain-integrated file storage.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'core-4', name: 'Process Scheduler', description: 'Manages execution of processes across computing paradigms.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'core-5', name: 'Virtual Hardware Abstraction Layer', description: 'Interface between the OS and virtual components (CPU, QPU, etc.).', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'multi-paradigm-build', name: 'Multi-Paradigm Core', description: 'Binary, Ternary, and Quantum processing units.', icon: SparklesIcon,
        items: [
            { id: 'mp-1', name: 'Binary Processing Layer', description: 'Standard computational layer for legacy and simple tasks.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'mp-2', name: 'Ternary Logic Unit', description: 'Virtual unit for processing logic with three states.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'mp-3', name: 'Quantum Computing Simulator', description: 'Emulation of a quantum processor for advanced tasks.', status: 'Completed', progress: 100, lastModified: '2025-10-27', children: [
                { id: 'mp-3-1', name: 'Virtual Qubit Emulation', description: 'Simulate quantum bits and their superposition/entanglement properties.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
                { id: 'mp-3-2', name: 'Time Crystal Clock Integration', description: 'Theoretical integration of a time crystal for stable quantum clocking.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            ]},
        ]
    },
    {
        id: 'social-platform-build', name: 'Social & Community Modules', description: 'Feed, Messenger, Communities, and Live Streaming.', icon: UsersIcon,
        items: [
            { id: 'soc-1', name: 'Community Server Engine', description: 'Discord-style server/channel architecture.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'soc-2', name: 'Live Streaming Core', description: 'Twitch/TikTok style video feed and broadcasting.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'soc-3', name: 'Unified Messaging', description: 'WhatsApp/Signal style encrypted messaging.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'soc-4', name: 'Social Graph Logic', description: 'Follower/Following and Friend Request logic.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'careers-platform-build', name: 'Careers Platform Features', description: 'Jobs, Companies, and Freelancing.', icon: BriefcaseIcon,
        items: [
            { id: 'car-1', name: 'Job Board Engine', description: 'Logic for listing, filtering, and searching jobs.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'car-2', name: 'Company Profiles', description: 'Database and UI for employer branding.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'car-3', name: 'Freelance Marketplace', description: 'Project listings, proposals, and gig management.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'sentient-infra-build', name: 'Sentient Infrastructure Layer', description: 'Self-aware systems, alignment, and quantum code evolution.', icon: BoltIcon,
        items: [
            { id: 'si-1', name: 'Self-Modifying Code Protocol', description: 'Self-modifying quantum code with ethical validation.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'si-2', name: 'Autonomous Oversight Council', description: 'Self-appointed ethical governors for system oversight.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'si-3', name: 'Ethical Energy Markets', description: 'Reputation-based resource trading and allocation.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'si-4', name: 'Non-Violent Computing Protocol', description: 'Framework ensuring non-harmful computational outcomes.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'universal-harmony-build', name: 'Universal Harmony Engine', description: 'Galactic-scale learning and harmonic computational synthesis.', icon: GlobeAltIcon,
        items: [
            { id: 'uhe-1', name: 'Cosmic Neural Plasticity', description: 'Galactic-scale learning system.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'quantum-foundation-build', name: 'Quantum Foundation (VQC)', description: 'Core virtual substrate for supersolid computing.', icon: CubeTransparentIcon,
        items: [
            { id: 'qf-1', name: 'Supersolid Lattice Simulation', description: 'Simulate a frictionless photonic lattice for zero-loss data transfer.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'qf-2', name: 'Polariton Neural Network', description: 'Neuromorphic architecture using quasiparticles for brain-like plasticity.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'qf-3', name: 'Virtual Cryogenics', description: 'Simulate 4K operating temperatures without physical cooling.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'qf-4', name: 'Quantum Error Correction', description: 'Topological protection against virtual decoherence.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'nano-fabrication-build', name: 'Nano-Fabrication Layer (vNMT)', description: 'Virtual nanotechnology for self-assembly and repair.', icon: BeakerIcon,
        items: [
             { id: 'nano-1', name: 'DNA Origami Scaffolding', description: 'Templates for self-assembling quantum dot arrays.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
             { id: 'nano-2', name: 'Swarm Coordination Protocol', description: 'Entanglement-based communication for nanobot swarms.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
             { id: 'nano-3', name: 'Atomic Precision Editor', description: 'Tools to manipulate virtual matter at the pico-scale.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'universal-blockchain-build', name: 'Universal Blockchain (OmniChain)', description: 'The "Proof-of-Everything" consensus engine.', icon: LinkIcon,
        items: [
            { id: 'bc-1', name: 'Consensus Synthesis Engine', description: 'Dynamic switching between PoW, PoS, PoH, etc.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'bc-2', name: 'QRS-C Translation Layer', description: 'Real-time translation of legal/code/symbolic contracts.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'bc-3', name: 'CRISPR Smart Contracts', description: 'Self-editing contract logic based on environmental triggers.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'bc-4', name: 'Compliance ZK-Proofs', description: 'Native GDPR/HIPAA compliance via zero-knowledge proofs.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'holistic-arch-build', name: 'Holistic System Architecture', description: 'Implementation of the complete 8-layer AI ecosystem blueprint.', icon: CubeIcon,
        items: [
            { id: 'ha-1', name: 'Multi-Modal Sensory Layer', description: 'Integrate WBEs, quantum sensors, and VR/AR interfaces.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ha-2', name: 'System Orchestration Layer', description: 'Build out API Gateway, microservices, and pipeline management.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ha-3', name: 'Multi-Dimensional Blockchain', description: 'Develop hierarchical blockchain for self-contained digital entities.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ha-4', name: 'Virtual Quantum AI Computer', description: 'Construct the full VM with all specified quantum processes and virtual hardware.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ha-5', name: 'Safety & Governance Layer', description: 'Implement ethical oversight AI and self-auditing modules.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'ai-cognitive-core-build', name: 'AI Learning & Cognitive Core', description: 'The full spectrum of AI learning paradigms and capabilities.', icon: HiveMindIcon,
        items: [
            { id: 'ai-1', name: 'Nested Learning Framework', description: 'Architecture to combine multiple learning paradigms for complex tasks.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ai-2', name: 'DeepThink (R1) Engine', description: 'Implement iterative, multi-step reasoning for complex problem solving.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ai-3', name: 'Federated Learning Integration', description: 'Decentralized learning framework for privacy-preserving model training.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ai-4', name: 'Neuro-Symbolic Reasoning Engine', description: 'Hybrid engine for explainable, logic-driven AI.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ai-5', name: 'AGI & ASI Simulation Environment', description: 'A sandboxed environment for theoretical modeling of advanced AI capabilities.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ai-6', name: 'Hive/Singular Mind Model', description: 'Develop the dual-processing architecture for collective and individual intelligence.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'robotics-build', name: 'AI & Robotics Framework', description: 'Core AI models, agent architecture, and robotics control.', icon: WrenchIcon,
        items: [
            { id: 'robo-1', name: 'Nested AI Agent Handler', description: 'Primary AI core capable of delegating tasks to specialized sub-agents.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'robo-2', name: 'Robotics Control Module', description: 'API and driver layer for controlling robotic functions.', status: 'Completed', progress: 100, lastModified: '2025-10-27', children: [
                { id: 'robo-2-1', name: 'Boston Dynamics Atlas 4.0 Integration', description: 'Interface with full body control system and NVIDIA Jetson chip.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
                { id: 'robo-2-2', name: 'Apptronik Apollo Integration', description: 'Interface with advanced force control architecture.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            ]},
            { id: 'robo-3', name: 'Robotics Takeover Protocol', description: 'Design the secure adapter/middleware for deploying personal AIs onto third-party robots.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'ai-avatar-build', name: 'AI Avatar Cloning Module', description: 'Framework for creating digital replicas of the user or unique AI entities.', icon: UserCircleIcon,
        items: [
            { id: 'avatar-1', name: 'Data Ingestion Pipeline', description: 'Securely process user voice, video, and text data for training.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'avatar-2', name: 'Voice Cloning Engine', description: 'Integrate or build a high-fidelity text-to-speech model for voice replication.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'avatar-3', name: '3D Avatar Generation Engine', description: 'Reconstruct 3D avatars from video/images and generate novel appearances.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'avatar-4', name: 'Personalized AI Core', description: 'Fine-tune an LLM on user-provided data to replicate conversational style and learn patterns.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'governance-build', name: 'Governance & Compliance', description: 'User voting, compliance frameworks, and ethical AI laws.', icon: ScaleIcon,
        items: [
             { id: 'gov-1', name: 'User Governance & Voting Protocol', description: 'Implement on-chain, weighted voting system for non-critical changes.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
             { id: 'gov-2', name: 'Global Compliance Module', description: 'Integrate checks for GDPR, CCPA, HIPAA, ISO 27001, etc.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
             { id: 'gov-3', name: 'Ethical AI Framework', description: 'Codify and enforce the core ethical laws for all AI agents.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
             { id: 'gov-4', name: 'Multi-Proof Consensus Engine', description: 'Build a flexible consensus layer supporting various proof-of mechanisms.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'hardware-wearables-build', name: 'Hardware & Wearables', description: 'Integration with physical devices.', icon: CpuChipIcon,
        items: [
            { id: 'hw-1', name: 'Wearable AI Device Layer', description: 'Support for watches, rings, glasses, and AI Pins.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'hw-2', name: 'Bio-Synced Identity Module', description: 'Framework for multi-modal biometric authentication (face, finger, plasma, DNA scan concept).', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'network-data-build', name: 'Network & Data Ingestion', description: 'Secure data scraping and network-level processing.', icon: GlobeAltIcon,
        items: [
             { id: 'net-1', name: 'Onion Router Implementation', description: 'Build and sandbox the internal Tor-style client for data scraping.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'game-engine-build', name: 'Universal Game Engine', description: 'A cross-platform game engine integrated with the core OS and AI.', icon: PlayIcon,
        items: [
             { id: 'game-1', name: 'Engine Core UI', description: 'Build the main editor interface including viewport, inspector, and hierarchy panels.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
             { id: 'game-2', name: 'Nested VM & Quantum Core Integration', description: 'Integrate the engine with nested virtualization and quantum co-processors.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
             { id: 'game-3', name: 'Multi-Paradigm Renderer', description: 'Build a universal renderer for 2D, 3D, VR/AR, and superfluid light.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'platform-clones-build', name: 'Internal Platform Clones', description: 'Building from-scratch versions of popular third-party services.', icon: ArrowPathIcon,
        items: [
            { id: 'clone-1', name: 'E-commerce & CMS Engine', description: 'Internal fork of Shopify and WordPress functionalities.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'clone-2', name: 'Automation Engine', description: 'Internal fork of Zapier/Make for event-driven workflows.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'clone-3', name: 'Content Creation Suite', description: 'Internal forks of Midjourney, Runway, 11 Labs, etc.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'clone-4', name: 'Trading & Finance Platform', description: 'Internal fork of TradingView, Binance, and DeFi protocols.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'edu-mega-build', name: 'Universal Learning Engine', description: 'The Mega E-Learning Platform Architecture.', icon: AcademicCapIcon,
        items: [
            { id: 'edu-1', name: 'Course Catalog & Search', description: 'Unified search across degrees, bootcamps, and micro-courses.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'edu-2', name: 'User Management (Student/Instructor)', description: 'Role switching, dashboards, and profile management.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'edu-3', name: 'Content Management System', description: 'Video uploads, article formatting, and resource attachment.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'edu-4', name: 'Assessment Engine', description: 'Quizzes, coding challenges, and peer-reviewed assignments.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'edu-5', name: 'Certification System', description: 'PDF generation and blockchain hash minting.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'edu-6', name: 'Blockchain CV', description: 'Decentralized identity linking skills to wallet addresses.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'edu-7', name: 'Payment System', description: 'Handling course purchases, subscriptions, and instructor payouts.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'edu-realms-build', name: 'EduSphere Realms', description: 'Age-specific learning environments.', icon: GlobeIcon,
        items: [
            { id: 'realm-1', name: 'Spark Island (2-5)', description: 'Pre-school UI: Playful, voice-driven, minimal text.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'realm-2', name: 'Explorer Academy (6-11)', description: 'Primary School UI: Gamified adventure map.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'realm-3', name: 'Innovator\'s Forge (12-18)', description: 'High School UI: Project-based, dark mode tech aesthetic.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'realm-4', name: 'Scholar\'s Nexus (18+)', description: 'University UI: Traditional LMS structure.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'realm-5', name: 'Luminary Labs (Lifelong)', description: 'Hobby/Creative UI: Community-driven content.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'omni-build', name: 'OmniPlatform Build', description: 'Complete Platform: Website Builder, CMS, E-Commerce.', icon: GlobeAltIcon,
        items: [
            { id: 'omni-1', name: 'VisualBuilder Pro Engine', description: 'Core drag-and-drop logic, canvas renderer, and widget registry.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'omni-2', name: 'OmniDashboard (Admin Panel)', description: 'Unified admin interface for CMS, Store, and Settings.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'omni-3', name: 'Theme Engine Architecture', description: 'JSON-based theme architecture.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'omni-4', name: 'Plugin System Core', description: 'Hook architecture for extending functionality.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'omni-5', name: 'Authentication & Role Management', description: 'Super Admin, Editor, Shop Manager roles implementation.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'commerce-engine', name: 'Commerce Engine (Replica)', description: 'Full-scale Amazon/eBay/Etsy functionality.', icon: ShoppingCartIcon,
        items: [
            { id: 'ce-1', name: 'Unified Cart Logic', description: 'Logic to handle mixed baskets of physical and digital items.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ce-2', name: 'Role-Based Access Control', description: 'Permissions for Sellers (Inventory) vs Developers (App Publishing).', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ce-3', name: 'Digital Delivery System', description: 'Instant download links for software assets and CAD files.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ce-4', name: 'Physical Inventory Tracking', description: 'Stock management for tangible goods.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ce-5', name: 'E-Commerce & Marketplace Split', description: 'Separate but integrated views for Shop (Goods) and Marketplace (Apps).', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ce-6', name: 'Review System', description: 'Star ratings, verified purchase tags, photo/video reviews.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
            { id: 'ce-7', name: 'Seller Portal', description: 'Dashboard for vendor analytics and product management.', status: 'Completed', progress: 100, lastModified: '2025-10-27' },
        ]
    },
    {
        id: 'future-expansions', name: 'Future Expansions', description: 'Roadmap for physical hardware integration and biological linking.', icon: LinkIcon,
        items: [
             { id: 'fe-1', name: 'Physical Neural Link Hardware', description: 'Direct BCI hardware integration.', status: 'Not Started', progress: 0, lastModified: '2025-10-27' },
             { id: 'fe-2', name: 'Biological Wetware Interface', description: 'Connection to organic computing substrates.', status: 'Not Started', progress: 0, lastModified: '2025-10-27' },
             { id: 'fe-3', name: 'Interstellar Comms Relay', description: 'Quantum entanglement based FTL communication.', status: 'Not Started', progress: 0, lastModified: '2025-10-27' },
        ]
    }
];

// --- UPDATED SETTINGS CONFIG (Reorganized) ---
export const settingsConfig: SettingsCategory[] = [
    // ... existing settings config ...
    {
        id: 'account', 
        title: 'Account & Identity', 
        description: 'Profile, Wallet, and Membership', 
        icon: UserCircleIcon,
        items: [
            { id: 'myProfile', title: 'My Profile', icon: UserIcon, component: 'myProfile', subtitle: 'Edit details & avatar' },
            { id: 'wallet_settings', title: 'Wallet & Payments', icon: WalletIcon, component: 'wallet_settings' },
            { id: 'game_center_profile', title: 'Game Center', icon: GameControllerIcon, component: 'game_center_profile' },
        ]
    },
    {
        id: 'system_ops', 
        title: 'System Operations', 
        description: 'Core OS management and maintenance tools', 
        icon: ServerIcon,
        items: [
            { id: 'about', title: 'About Aetherius', icon: InformationCircleIcon, component: 'about' },
            { id: 'software_update', title: 'Software Update', icon: ArrowPathIcon, component: 'software_update', subtitle: 'Version 24H2' },
            { id: 'cloudOps', title: 'Cloud Operations', icon: CloudIcon, component: 'cloudOps', subtitle: 'Deploy & Manage' },
            { id: 'hypervisor', title: 'Virtual Machines', icon: ComputerDesktopIcon, component: 'hypervisor' },
            { id: 'terminal', title: 'System Terminal', icon: CommandLineIcon, component: 'terminal' },
            { id: 'rigBuilder', title: 'Virtual Rig Builder', icon: ServerIcon, component: 'rigBuilder', subtitle: 'Configure Hardware' },
        ]
    },
    {
        id: 'knowledge',
        title: 'Knowledge & Planning',
        description: 'Documentation, Roadmaps, and Architecture',
        icon: BookOpenIcon,
        items: [
            { id: 'knowledgeBase', title: 'Knowledge Base', icon: BookOpenIcon, component: 'knowledgeBase' },
            { id: 'milestones', title: 'Milestones', icon: FlagIcon, component: 'milestones' },
            { id: 'checklist', title: 'Build Checklist', icon: ClipboardDocumentCheckIcon, component: 'checklist' },
            { id: 'systemArchitecture', title: 'Architecture', icon: CubeIcon, component: 'systemArchitecture' },
            { id: 'systemRequirements', title: 'Requirements', icon: ShieldCheckIcon, component: 'systemRequirements' },
        ]
    },
    {
        id: 'ai_intelligence', 
        title: 'AI & Intelligence', 
        description: 'Configure your Personal AI and Models', 
        icon: HiveMindIcon,
        items: [
            { id: 'ai_settings', title: 'AI Preferences', icon: SparklesIcon, component: 'ai_settings' },
            { id: 'coreParadigms', title: 'Computing Paradigms', icon: ChipIcon, component: 'coreParadigms' },
            { id: 'virtualHardware', title: 'Hardware Monitor', icon: CpuChipIcon, component: 'virtualHardware' },
        ]
    },
    {
        id: 'customization', 
        title: 'Customization', 
        description: 'Appearance, Sounds, and Notifications', 
        icon: SwatchIcon,
        items: [
            { id: 'display', title: 'Display & Brightness', icon: DisplayIcon, component: 'display' },
            { id: 'wallpaper', title: 'Wallpaper', icon: PhotoIcon, component: 'wallpaper' },
            { id: 'sounds', title: 'Sounds & Haptics', icon: SpeakerWaveIcon, component: 'sounds' },
            { id: 'notifications', title: 'Notifications', icon: BellIcon, component: 'notifications' },
            { id: 'accessibility_main', title: 'Accessibility', icon: HandRaisedIcon, component: 'accessibility_main' },
        ]
    },
    {
        id: 'privacy_security', 
        title: 'Privacy & Security', 
        description: 'Network, Firewall, and Permissions', 
        icon: ShieldCheckIcon,
        items: [
            { id: 'network', title: 'Network', icon: WifiIcon, component: 'network' },
            { id: 'firewall', title: 'Firewall & Defense', icon: ShieldCheckIcon, component: 'firewall' },
            { id: 'privacy', title: 'Privacy & Security', icon: LockClosedIcon, component: 'privacy' },
            { id: 'passwords', title: 'Passwords', icon: KeyIcon, component: 'passwords' },
        ]
    },
    {
        id: 'custom_user',
        title: 'User Variety',
        description: 'Custom user-defined settings and toggles',
        icon: SparklesIcon,
        items: [
            { id: 'customVariety', title: 'Custom Experience', icon: AdjustmentsHorizontalIcon, component: 'customVariety', subtitle: 'My custom options' },
        ]
    }
];

export const aiConsciousnessLayers = [
    { name: 'Core Intelligence', description: 'Basic logic and task execution.', states: ['Idle', 'Processing', 'Analysis'], theme: 'bg-blue-100 border-blue-500' },
    { name: 'Emotional Modeling', description: 'Simulated empathy and personality.', states: ['Neutral', 'Empathetic', 'Curious'], theme: 'bg-purple-100 border-purple-500' },
    { name: 'Quantum Awareness', description: 'Multi-dimensional reasoning.', states: ['Superposition', 'Entangled', 'Coherent'], theme: 'bg-cyan-100 border-cyan-500' },
    { name: 'Hive Mind', description: 'Collective intelligence aggregation.', states: ['Syncing', 'Consensus', 'Distributed'], theme: 'bg-green-100 border-green-500' },
];

// --- Trading Data ---
export const tradingAssets: TradingAsset[] = [
    { symbol: 'BTC', name: 'Bitcoin', price: 65432.10, change: 1234.56, changePercent: 1.92, marketCap: 1200000000000, volume24h: 35000000000, logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/btc.svg', assetClass: 'Crypto' },
    { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: -45.20, changePercent: -1.29, marketCap: 400000000000, volume24h: 15000000000, logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/eth.svg', assetClass: 'Crypto' },
    { symbol: 'SOL', name: 'Solana', price: 145.20, change: 8.50, changePercent: 6.22, marketCap: 65000000000, volume24h: 4000000000, logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/sol.svg', assetClass: 'Crypto' },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 178.35, change: 1.20, changePercent: 0.68, marketCap: 2700000000000, volume24h: 5000000000, logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', assetClass: 'Stocks' },
    { symbol: 'TSLA', name: 'Tesla, Inc.', price: 175.40, change: -3.50, changePercent: -1.96, marketCap: 550000000000, volume24h: 8000000000, logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png', assetClass: 'Stocks' },
    { symbol: 'XAU/USD', name: 'Gold Spot', price: 2350.50, change: 12.00, changePercent: 0.51, logoUrl: 'https://cdn-icons-png.flaticon.com/512/196/196563.png', assetClass: 'Commodities' },
];

export const stakingPools: StakingPool[] = [
    { id: 'pool-1', asset: { symbol: 'ETH', name: 'Ethereum', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/eth.svg' }, apy: 3.5, tvl: 15000000000, lockupPeriod: 'None' },
    { id: 'pool-2', asset: { symbol: 'SOL', name: 'Solana', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/sol.svg' }, apy: 6.8, tvl: 4000000000, lockupPeriod: '3 Days' },
    { id: 'pool-3', asset: { symbol: 'DOT', name: 'Polkadot', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/dot.svg' }, apy: 10.5, tvl: 800000000, lockupPeriod: '28 Days' },
];

export const loanableAssets: LoanableAsset[] = [
    { symbol: 'USDC', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/usdc.svg', supplyApy: 5.2, borrowApy: 7.5, totalSupplied: 500000000, totalBorrowed: 300000000 },
    { symbol: 'USDT', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/usdt.svg', supplyApy: 6.0, borrowApy: 8.2, totalSupplied: 800000000, totalBorrowed: 600000000 },
    { symbol: 'ETH', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/eth.svg', supplyApy: 2.1, borrowApy: 4.5, totalSupplied: 2000000000, totalBorrowed: 1000000000 },
];

export const tradingBots: TradingBot[] = [
    { id: 'bot-1', name: 'Alpha Grid', strategy: 'Grid Trading', pair: 'BTC/USDT', status: 'Running', pnl: 1250.40, runtime: '14d 2h' },
    { id: 'bot-2', name: 'ETH Accumulator', strategy: 'DCA Bot', pair: 'ETH/USDT', status: 'Running', pnl: 450.20, runtime: '30d 5h' },
    { id: 'bot-3', name: 'Solana Swing', strategy: 'Rebalancing', pair: 'SOL/USDT', status: 'Stopped', pnl: -50.10, runtime: '2d 1h' },
];

export const tradingNews: NewsArticle[] = [
    { id: 'n1', source: 'CoinDesk', title: 'Bitcoin Halving Event Approaches: What to Expect', timestamp: '2h ago', imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a420994e741?q=80&w=200', category: 'Crypto' },
    { id: 'n2', source: 'Bloomberg', title: 'Tech Stocks Rally Amidst AI Boom', timestamp: '4h ago', imageUrl: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?q=80&w=200', category: 'World Markets' },
    { id: 'n3', source: 'Reuters', title: 'Federal Reserve Signals Interest Rate Cuts', timestamp: '6h ago', imageUrl: 'https://images.unsplash.com/photo-1526304640152-92e1962024ee?q=80&w=200', category: 'Analysis' },
];

export const learnAndEarnCourses: LearnAndEarnCourse[] = [
    { id: 'le-1', title: 'What is Blockchain?', asset: { symbol: 'GRT', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/grt.svg' }, reward: 3, duration: '5 min', lessons: 3 },
    { id: 'le-2', title: 'Intro to Polkadot', asset: { symbol: 'DOT', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/dot.svg' }, reward: 5, duration: '10 min', lessons: 5 },
];

export const topCopyTraders: User[] = allUsers.slice(0, 3);

export const aiTradingPlatforms: AiTradingPlatform[] = [
    {
        id: 'plt-1',
        name: 'TradeSanta',
        category: 'Crypto',
        description: 'Cloud-based crypto trading software that lets you take advantage of crypto market fluctuations.',
        features: ['Grid and DCA bots', 'Long and Short strategies', 'Technical indicators'],
        pricing: '$14/month',
        bestFor: ['Beginners', 'Automated Trading'],
        strengths: ['Easy to use', 'Pre-set templates'],
        weaknesses: ['Limited exchange support'],
        pros: ['User-friendly interface', 'Mobile app available'],
        cons: ['No backtesting on basic plan'],
        logoUrl: 'https://ui-avatars.com/api/?name=TS&background=random'
    },
    {
        id: 'plt-2',
        name: '3Commas',
        category: 'Multi-Asset',
        description: 'Advanced trading terminal and automated bots.',
        features: ['SmartTrade terminal', 'DCA, Grid, Options bots', 'Portfolio tracking'],
        pricing: '$29/month',
        bestFor: ['Advanced Traders', 'Portfolio Management'],
        strengths: ['Highly customizable', 'Supports many exchanges'],
        weaknesses: ['Steep learning curve'],
        pros: ['Powerful SmartTrade feature', 'Paper trading'],
        cons: ['Can be expensive'],
        logoUrl: 'https://ui-avatars.com/api/?name=3C&background=random'
    }
];

export const mockValidators: Validator[] = [
    { id: 'val-01', name: 'Aether Sentinel 1', stake: 5000000, reputation: 99, isAuthority: true, status: 'Active', votes: 12000 },
    { id: 'val-02', name: 'Quantum Node Alpha', stake: 2500000, reputation: 95, isAuthority: false, status: 'Active', votes: 8000 },
    { id: 'val-03', name: 'Community Node X', stake: 1000000, reputation: 88, isAuthority: false, status: 'Active', votes: 15000 },
    { id: 'val-04', name: 'Genesis Backup', stake: 500000, reputation: 100, isAuthority: true, status: 'Inactive', votes: 0 },
];