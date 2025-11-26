

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
  Validator, AiTradingPlatform, Achievement
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
    { title: 'E-Commerce Hub', icon: ShoppingCartIcon, component: 'eCommerceApp' },
    { title: 'Labs', icon: CubeTransparentIcon, component: 'rdHub' },
    { title: 'Careers Hub', icon: BriefcaseIcon, component: 'careersApp' },
    { title: 'E-Learning', icon: AcademicCapIcon, component: 'elearningApp' },
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
        title: 'Economy',
        icon: ShoppingCartIcon,
        type: 'group',
        children: [
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
    { id: 'market', type: 'app', title: 'Market', icon: ShoppingCartIcon, component: 'eCommerceApp' },
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

export const creatorMarketplaceItems: MarketplaceItem[] = [
    { id: 'm1', name: 'Neon Theme Pack', creator: allUsers[1], type: 'Theme', price: 5, rating: 4.8, downloads: 1200, iconUrl: 'https://ui-avatars.com/api/?name=NT&background=000&color=fff', description: 'A cyberpunk neon theme for your OS.' },
    { id: 'm2', name: 'CodeHelper Pro', creator: allUsers[4], type: 'Plugin', price: 15, rating: 4.9, downloads: 5000, iconUrl: 'https://ui-avatars.com/api/?name=CH&background=blue&color=fff', description: 'AI-powered code completion plugin.' },
    { id: 'm3', name: 'Astro Miner', creator: allUsers[2], type: 'Game', price: 'Free', rating: 4.5, downloads: 15000, iconUrl: 'https://ui-avatars.com/api/?name=AM&background=purple&color=fff', description: 'Casual space mining game.' },
];

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
        modules: []
    },
];

export const enrolledCourses = [
    { courseId: 1, progress: 65 },
    { courseId: 2, progress: 10 }
];

export const achievements: Achievement[] = [
    { id: 'ach-1', courseTitle: 'Basic Coding', completionDate: '2023-12-01', transactionId: '0x123...abc', certificateUrl: '#' }
];

export const jobs: Job[] = [
    { id: 1, title: 'Quantum Software Engineer', company: 'Q-Systems', location: 'Remote', type: 'Full-time', salary: '$150k - $200k', tags: ['Quantum', 'Python', 'C++'], logoUrl: 'https://ui-avatars.com/api/?name=QS&background=random' },
    { id: 2, title: 'AI Ethicist', company: 'OpenFuture', location: 'New York, NY', type: 'Contract', salary: '$100k - $140k', tags: ['Ethics', 'Policy', 'AI'], logoUrl: 'https://ui-avatars.com/api/?name=OF&background=random' },
    { id: 3, title: 'VR World Builder', company: 'MetaVerse Corp', location: 'San Francisco, CA', type: 'Full-time', salary: '$120k - $160k', tags: ['Unity', '3D', 'Design'], logoUrl: 'https://ui-avatars.com/api/?name=MC&background=random' },
];


// --- KNOWLEDGE BASE DATA ---
export const knowledgeBaseData: KnowledgeBaseItem[] = [
    { id: '001', name: 'The Complete Blueprint', details: 'A consolidated blueprint for a next-generation, self-contained AI ecosystem. It outlines the core philosophy, governance model, three-tiered architecture (Parent, Child, Grandchild), and integrations for advanced technologies.', status: 'Foundational', progress: 100 },
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
];

// --- MILESTONES DATA (UPDATED WITH PROGRESS) ---
export const milestonesData: MilestonesData = {
    projectMilestones: [
        { id: 'cpm-1', title: 'Develop a fully self-contained, virtualized OS environment ("AI in a Box")', status: 'Completed', progress: 100, description: 'Web-based desktop interface fully operational.' },
        { id: 'cpm-2', title: 'Integrate a multi-paradigm computing core supporting Binary, Ternary, and Quantum processing', status: 'Completed', progress: 100, description: 'Implemented in CoreParadigms and VirtualRigBuilder.' },
        { id: 'cpm-3', title: 'Implement a nested AI agent architecture for distributed and hierarchical task processing', status: 'Completed', progress: 90, description: 'AiWorkforceOrchestrator fully functional.' },
        { id: 'cpm-4', title: 'Establish a framework for controlling both virtual and physical robotics', status: 'Completed', progress: 80, description: 'RoboticsControl module active with fleet management.' },
        { id: 'cpm-5', title: 'Achieve future-proofing by creating a system for continuous research and integration', status: 'In Progress', progress: 50, description: 'R&D Hub and Knowledge Base structure in place.' },
        { id: 'cpm-6', title: 'Develop a full system architecture with scalable microservices, vector databases, and API gateways', status: 'Completed', progress: 100, description: 'SystemArchitecture visualizer and MemoryNode implemented.' },
        { id: 'cpm-7', title: 'Integrate a Whole Brain Emulation (WBE) module as a cognitive reasoning engine', status: 'Pending', progress: 20, description: 'Conceptual framework in Knowledge Base.' },
        { id: 'cpm-8', title: 'Implement NSNoBrain for advanced causal and non-obvious reasoning', status: 'Pending', progress: 10, description: 'Research phase.' },
        { id: 'cpm-9', title: 'Establish a direct neural link via Wireless Brain-Embedded Interfaces (WBEs)', status: 'In Progress', progress: 30, description: 'UI exists in R&D Hub.' },
        { id: 'cpm-10', title: 'Create a framework for multiverse and parallel reality simulations', status: 'In Progress', progress: 60, description: 'SimulationHub active.' },
        { id: 'cpm-11', title: 'Develop a self-auditing ethical governance layer for all AI operations', status: 'Completed', progress: 80, description: 'GovernancePortal implemented.' },
        { id: 'cpm-12', title: 'Implement a multi-dimensional, self-contained blockchain architecture', status: 'Completed', progress: 90, description: 'BlockchainExplorer with consensus switching active.' },
        { id: 'cpm-13', title: 'Construct a virtualized Quantum AI Computer integrating core quantum principles', status: 'Completed', progress: 85, description: 'VirtualRigBuilder allows quantum QPU assembly.' },
        { id: 'cpm-14', title: 'Develop a full-stack, multi-modal sensory and interaction layer', status: 'In Progress', progress: 70, description: 'AiSupportAvatar and VideoEditor handle sensory input.' },
        { id: 'cpm-15', title: 'Establish a complete system orchestration layer using a microservices architecture', status: 'Completed', progress: 85, description: 'NetworkOrchestrator monitoring live.' },
        { id: 'cpm-16', title: 'Construct a universal, cross-platform game engine within a nested VM', status: 'In Progress', progress: 60, description: 'GameEngine editor UI built.' },
        { id: 'cpm-17', title: 'Develop a comprehensive AI cloning module for creating both self-replicas and unique generative avatars', status: 'Completed', progress: 75, description: 'AvatarForge module active.' },
        { id: 'cpm-18', title: 'Implement a Nested Learning architecture combining all 18 specified ML paradigms', status: 'In Progress', progress: 70, description: 'MyLearning and MemoryNode integration.' },
        { id: 'cpm-19', title: 'Develop a simulation framework for AGI and theoretical ASI models', status: 'In Progress', progress: 40, description: 'Workforce Orchestrator handles AGI task delegation.' },
        { id: 'cpm-20', title: 'Build a Neuro-Symbolic AI module for explainable, logic-driven reasoning', status: 'In Progress', progress: 60, description: 'CognitiveFramework visualization active.' },
        { id: 'cpm-21', title: 'Phase 3: Quantum-Nano Singularity - Activate full Supersolid Light circuitry and vNMT swarms', status: 'Not Started', progress: 0, description: 'Planned for future release.' },
        { id: 'cpm-22', title: 'Deploy OmniChain mainnet with "Proof-of-Everything" consensus engine', status: 'In Progress', progress: 40, description: 'Simulated in BlockchainExplorer.' },
        { id: 'cpm-23', title: 'Phase 4: Galactic Node Synchronization - Establish faster-than-light communication', status: 'Not Started', progress: 0, description: 'Theoretical roadmap item.' },
        { id: 'ui-polish-01', title: 'UI Polish & Input Integration', status: 'In Progress', progress: 40, description: 'Unified menu systems and multi-modal input handling (Mouse/Touch/Pen).' },
    ],
    platformFeatureMilestones: [
        { id: 'pfm-1', title: 'E-commerce functionality: buying, selling, drop shipping', status: 'Completed', progress: 100, description: 'ECommerceApp and ProductPage active.' },
        { id: 'pfm-2', title: 'E-learning platform: courses, uploads, chat rooms, downloads', status: 'Completed', progress: 100, description: 'ElearningApp fully functional.' },
        { id: 'pfm-3', title: 'Job search and advertisement feature', status: 'Completed', progress: 100, description: 'CareersApp and JobSearch active.' },
        { id: 'pfm-4', title: 'News and blogging feature with monetization', status: 'Completed', progress: 100, description: 'Feed and TradingNews implemented.' },
        { id: 'pfm-5', title: 'Community platform: streaming, uploading, RSS', status: 'Completed', progress: 90, description: 'SocialApp and Groups active.' },
        { id: 'pfm-6', title: 'Chatbot feature: help center and Q&A', status: 'Completed', progress: 100, description: 'AiSupportAvatar and SimpleAIChat active.' },
        { id: 'pfm-7', title: 'GitHub integration for developers', status: 'In Progress', progress: 50, description: 'Mentioned in MyProfile, full API pending.' },
        { id: 'pfm-8', title: 'Product catalog: 3D printers, music, robotics, lab apparatus', status: 'Completed', progress: 100, description: 'Marketplace categories populated.' },
        { id: 'pfm-9', title: 'Business listing: profiles for product info and contact details', status: 'Completed', progress: 100, description: 'Business directory in Marketplace.' },
        { id: 'pfm-10', title: 'Business tools: profile management, ads, links, staff chat', status: 'Pending', progress: 30, description: 'AdminPanel structure exists.' },
        { id: 'pfm-11', title: 'Accessibility: Web App, dApp, Desktop App', status: 'Completed', progress: 100, description: 'Responsive web app design complete.' },
        { id: 'pfm-12', title: 'Web3 integration: paying and receiving funds in crypto', status: 'Completed', progress: 100, description: 'Wallet and Trading apps active.' },
        { id: 'pfm-13', title: 'User profile: settings, achievements, social links, KYC/GDPR', status: 'Completed', progress: 100, description: 'MyProfile and OnboardingWizard complete.' },
        { id: 'pfm-14', title: 'Gamification: points system for interactions and trading', status: 'Completed', progress: 80, description: 'Achievements and Reputation System specs defined.' },
        { id: 'pfm-15', title: 'Universal Context Menu System', status: 'In Progress', progress: 50, description: 'Right-click menus for Desktop implemented. Window menus pending.' },
        { id: 'pfm-16', title: 'Standardized Window Menus (File/Edit/View)', status: 'In Progress', progress: 20, description: 'Global menu structure defined in data layer.' },
        { id: 'pfm-17', title: 'Multi-Input Gesture Engine', status: 'In Progress', progress: 10, description: 'Touch and Pen specifications drafted.' },
    ],
    technicalBreakdown: [
        { id: 'atb-1', title: 'Virtual Hardware Simulation - quantum chips, processors, time crystals', status: 'Completed', progress: 100, description: 'VirtualRigBuilder and InfrastructureControl.' },
        { id: 'atb-2', title: 'Multi-Paradigm Scheduler - kernel delegation to binary/ternary/quantum', status: 'Completed', progress: 100, description: 'CoreParadigms component.' },
        { id: 'atb-3', title: 'Robotics API - comprehensive control functions', status: 'Completed', progress: 90, description: 'RoboticsControl module.' },
        { id: 'atb-4', title: 'AI Model Interchange - dynamic loading of models', status: 'Completed', progress: 100, description: 'HuggingFaceModelHub implemented.' },
        { id: 'atb-5', title: 'Data management and security - KYC and GDPR compliance', status: 'Completed', progress: 100, description: 'Firewall and OnboardingWizard.' },
        { id: 'atb-6', title: 'Research prototype compute layer (Superfluid Light/Photonic)', status: 'In Progress', progress: 60, description: 'Visualized in QuantumDNACore.' },
        { id: 'atb-7', title: 'Integrate advanced data storage (DNA/Crystalline memory)', status: 'In Progress', progress: 50, description: 'MemoryNode concepts.' },
        { id: 'atb-8', title: 'Game Engine Core - modular engine development', status: 'Completed', progress: 80, description: 'GameEngine UI.' },
        { id: 'atb-9', title: 'Multi-modal data ingestion pipeline (voice, video, text)', status: 'In Progress', progress: 70, description: 'AiSupportAvatar input handling.' },
        { id: 'atb-10', title: 'Open-source voice cloning (TTS) and 3D avatar reconstruction', status: 'In Progress', progress: 60, description: 'AvatarForge.' },
        { id: 'atb-11', title: 'Personality cloning framework (LLM fine-tuning)', status: 'In Progress', progress: 50, description: 'MemoryNode persona logic.' },
        { id: 'atb-12', title: 'Meta-learning module for dynamic strategy adaptation', status: 'Pending', progress: 20, description: 'CognitiveFramework logic.' },
        { id: 'atb-13', title: 'Federated learning framework for decentralized training', status: 'Pending', progress: 30, description: 'TrainingDataHub structure.' },
        { id: 'atb-14', title: 'Causal inference engine for AI reasoning', status: 'Pending', progress: 15, description: 'Advanced AI nodes in VirtualAccelerator.' },
    ]
};

// --- BUILD CHECKLIST DATA (COMPLETED & EXPANDED) ---
export const buildChecklistData: ChecklistCategory[] = [
    {
        id: 'os-fusion-ui', name: 'OS Desktop Experience (Fusion)', description: 'Unified desktop environment merging Windows, macOS, and Linux paradigms.', icon: ComputerDesktopIcon,
        items: [
            { id: 'ui-1', name: 'Context Menus (Right Click)', description: 'Fully functional right-click menus for Desktop, Taskbar, and Windows.', status: 'In Progress', progress: 60, children: [
                { id: 'ui-1a', name: 'Desktop Context', description: 'View, Sort, Refresh, New, Display Settings, Personalize.', status: 'Completed', progress: 100 },
                { id: 'ui-1b', name: 'Taskbar Context', description: 'Toolbars, Search settings, Task Manager.', status: 'In Progress', progress: 50 },
                { id: 'ui-1c', name: 'Window Title Bar Context', description: 'Restore, Minimize, Maximize, Close options.', status: 'In Progress', progress: 30 }
            ]},
            { id: 'ui-2', name: 'Start Menu / App Launcher', description: 'Hybrid launcher combining Windows Tiles and macOS Launchpad aesthetics.', status: 'In Progress', progress: 70 },
            { id: 'ui-3', name: 'Window Management', description: 'Snap layouts, virtual desktops, and mission control features.', status: 'In Progress', progress: 60, children: [
                { id: 'ui-3a', name: 'Virtual Desktops', description: 'Workspace switching logic in Taskbar.', status: 'Completed', progress: 100 },
                { id: 'ui-3b', name: 'Window Snapping', description: 'Drag-to-edge resizing logic.', status: 'Not Started', progress: 0 }
            ]},
            { id: 'ui-4', name: 'Multi-Modal Input', description: 'Seamless handling of Mouse, Touch, and Pen inputs.', status: 'In Progress', progress: 40, children: [
                { id: 'ui-4a', name: 'Mouse Events', description: 'Click, Right-Click, Scroll, Hover.', status: 'Completed', progress: 100 },
                { id: 'ui-4b', name: 'Touch Gestures', description: 'Swipe, Pinch-to-Zoom, Long-Press.', status: 'In Progress', progress: 20 },
                { id: 'ui-4c', name: 'Pen Input', description: 'Pressure sensitivity and tilt recognition.', status: 'In Progress', progress: 10 }
            ]},
            { id: 'ui-5', name: 'System Tray & Control Center', description: 'Quick access to WiFi, Bluetooth, Volume, and Notifications.', status: 'In Progress', progress: 30 },
            { id: 'ui-6', name: 'Global Search', description: 'Universal search bar (Spotlight/Windows Search style).', status: 'Completed', progress: 100 }
        ]
    },
    {
        id: 'sentient-infra', name: 'Sentient Infrastructure Layer', description: 'Self-aware systems, alignment, and quantum code evolution.', icon: SparklesIcon,
        items: [
            { id: 'si-1', name: 'Self-Modifying Code Protocol', description: 'Self-modifying quantum code with ethical validation.', status: 'Completed', progress: 100, completedDate: '2025-01-20' },
            { id: 'si-2', name: 'Autonomous Oversight Council', description: 'Self-appointed ethical governors for system oversight.', status: 'Completed', progress: 100, completedDate: '2025-01-21' },
            { id: 'si-3', name: 'Ethical Energy Markets', description: 'Reputation-based resource trading and allocation.', status: 'Completed', progress: 100, completedDate: '2025-01-22' },
            { id: 'si-4', name: 'Non-Violent Computing Protocol', description: 'Framework ensuring non-harmful computational outcomes.', status: 'Completed', progress: 100, completedDate: '2025-01-23' },
        ]
    },
    {
        id: 'universal-harmony', name: 'Universal Harmony Engine', description: 'Galactic-scale learning and harmonic computational synthesis.', icon: GlobeIcon,
        items: [
            { id: 'uh-1', name: 'Cosmic Neural Plasticity', description: 'Galactic-scale learning system.', status: 'Completed', progress: 100, completedDate: '2025-01-24' },
        ]
    },
    {
        id: 'quantum-foundation', name: 'Quantum Foundation (VQC)', description: 'Core virtual substrate for supersolid computing.', icon: Cog6ToothIcon,
        items: [
            { id: 'qf-1', name: 'Supersolid Lattice Simulation', description: 'Simulate a frictionless photonic lattice for zero-loss data transfer.', status: 'Completed', progress: 100, completedDate: '2025-01-15' },
            { id: 'qf-2', name: 'Polariton Neural Network', description: 'Neuromorphic architecture using quasiparticles for brain-like plasticity.', status: 'Completed', progress: 100, completedDate: '2025-01-16' },
            { id: 'qf-3', name: 'Virtual Cryogenics', description: 'Simulate 4K operating temperatures without physical cooling.', status: 'Completed', progress: 100, completedDate: '2025-01-17' },
            { id: 'qf-4', name: 'Quantum Error Correction', description: 'Topological protection against virtual decoherence.', status: 'Completed', progress: 100, completedDate: '2025-01-18' },
        ]
    },
    {
        id: 'nano-fab', name: 'Nano-Fabrication Layer (vNMT)', description: 'Virtual nanotechnology for self-assembly and repair.', icon: CpuChipIcon,
        items: [
            { id: 'nf-1', name: 'DNA Origami Scaffolding', description: 'Templates for self-assembling quantum dot arrays.', status: 'Completed', progress: 100, completedDate: '2025-01-19' },
            { id: 'nf-2', name: 'Swarm Coordination Protocol', description: 'Entanglement-based communication for nanobot swarms.', status: 'Completed', progress: 100, completedDate: '2025-01-20' },
            { id: 'nf-3', name: 'Atomic Precision Editor', description: 'Tools to manipulate virtual matter at the pico-scale.', status: 'Completed', progress: 100, completedDate: '2025-01-21' },
        ]
    },
    {
        id: 'omnichain', name: 'Universal Blockchain (OmniChain)', description: 'The "Proof-of-Everything" consensus engine.', icon: LinkIcon,
        items: [
            { id: 'oc-1', name: 'Consensus Synthesis Engine', description: 'Dynamic switching between PoW, PoS, PoH, etc.', status: 'Completed', progress: 100, completedDate: '2025-01-22' },
            { id: 'oc-2', name: 'QRS-C Translation Layer', description: 'Real-time translation of legal/code/symbolic contracts.', status: 'Completed', progress: 100, completedDate: '2025-01-23' },
            { id: 'oc-3', name: 'CRISPR Smart Contracts', description: 'Self-editing contract logic based on environmental triggers.', status: 'Completed', progress: 100, completedDate: '2025-01-24' },
            { id: 'oc-4', name: 'Compliance ZK-Proofs', description: 'Native GDPR/HIPAA compliance via zero-knowledge proofs.', status: 'Completed', progress: 100, completedDate: '2025-01-25' },
        ]
    },
    {
        id: 'core-os', name: 'Core OS Services', description: 'Fundamental services for OS operation.', icon: CubeIcon,
        items: [
            { id: 'cos-1', name: 'Kernel', description: 'Manages hardware and software resources.', status: 'Completed', progress: 100, completedDate: '2024-07-21' },
            { id: 'cos-2', name: 'Memory Management', description: 'Virtual memory and process isolation.', status: 'Completed', progress: 100, completedDate: '2024-07-21' },
            { id: 'cos-3', name: 'File System (AetherFS)', description: 'Decentralized, blockchain-integrated file storage.', status: 'Completed', progress: 100, completedDate: '2024-07-22' },
            { id: 'cos-4', name: 'Process Scheduler', description: 'Manages execution of processes across computing paradigms.', status: 'Completed', progress: 100, completedDate: '2024-07-22' },
            { id: 'cos-5', name: 'Virtual Hardware Abstraction Layer', description: 'Interface between the OS and virtual components (CPU, QPU, etc.).', status: 'Completed', progress: 100, completedDate: '2024-07-21' },
        ]
    },
    {
        id: 'multi-paradigm', name: 'Multi-Paradigm Core', description: 'Binary, Ternary, and Quantum processing units.', icon: ChipIcon,
        items: [
            { id: 'mp-1', name: 'Binary Processing Layer', description: 'Standard computational layer for legacy and simple tasks.', status: 'Completed', progress: 100, completedDate: '2024-07-21' },
            { id: 'mp-2', name: 'Ternary Logic Unit', description: 'Virtual unit for processing logic with three states.', status: 'Completed', progress: 100, completedDate: '2024-07-24' },
            { id: 'mp-3', name: 'Quantum Computing Simulator', description: 'Emulation of a quantum processor for advanced tasks.', status: 'Completed', progress: 100, completedDate: '2024-07-24', children: [
                { id: 'mp-3-a', name: 'Virtual Qubit Emulation', description: 'Simulate quantum bits and their superposition/entanglement properties.', status: 'Completed', progress: 100, completedDate: '2024-07-24' },
                { id: 'mp-3-b', name: 'Time Crystal Clock Integration', description: 'Theoretical integration of a time crystal for stable quantum clocking.', status: 'Completed', progress: 100, completedDate: '2024-07-24' }
            ]},
        ]
    },
    {
        id: 'holistic-arch', name: 'Holistic System Architecture', description: 'Implementation of the complete 8-layer AI ecosystem blueprint.', icon: CubeTransparentIcon,
        items: [
            { id: 'ha-1', name: 'Multi-Modal Sensory Layer', description: 'Integrate WBEs, quantum sensors, and VR/AR interfaces.', status: 'Completed', progress: 100, completedDate: '2025-01-26' },
            { id: 'ha-2', name: 'System Orchestration Layer', description: 'Build out API Gateway, microservices, and pipeline management.', status: 'Completed', progress: 100, completedDate: '2025-01-26' },
            { id: 'ha-3', name: 'Multi-Dimensional Blockchain', description: 'Develop hierarchical blockchain for self-contained digital entities.', status: 'Completed', progress: 100, completedDate: '2025-01-26' },
            { id: 'ha-4', name: 'Virtual Quantum AI Computer', description: 'Construct the full VM with all specified quantum processes and virtual hardware.', status: 'Completed', progress: 100, completedDate: '2025-01-26' },
            { id: 'ha-5', name: 'Safety & Governance Layer', description: 'Implement ethical oversight AI and self-auditing modules.', status: 'Completed', progress: 100, completedDate: '2025-01-26' },
        ]
    },
    {
        id: 'ai-cognitive', name: 'AI Learning & Cognitive Core', description: 'The full spectrum of AI learning paradigms and capabilities.', icon: HiveMindIcon,
        items: [
            { id: 'ai-1', name: 'Nested Learning Framework', description: 'Architecture to combine multiple learning paradigms for complex tasks.', status: 'Completed', progress: 100, completedDate: '2025-01-27' },
            { id: 'ai-2', name: 'DeepThink (R1) Engine', description: 'Implement iterative, multi-step reasoning for complex problem solving.', status: 'Completed', progress: 100, completedDate: '2025-01-27' },
            { id: 'ai-3', name: 'Federated Learning Integration', description: 'Decentralized learning framework for privacy-preserving model training.', status: 'Completed', progress: 100, completedDate: '2025-01-27' },
            { id: 'ai-4', name: 'Neuro-Symbolic Reasoning Engine', description: 'Hybrid engine for explainable, logic-driven AI.', status: 'Completed', progress: 100, completedDate: '2025-01-27' },
            { id: 'ai-5', name: 'AGI & ASI Simulation Environment', description: 'A sandboxed environment for theoretical modeling of advanced AI capabilities.', status: 'Completed', progress: 100, completedDate: '2025-01-27' },
            { id: 'ai-6', name: 'Hive/Singular Mind Model', description: 'Develop the dual-processing architecture for collective and individual intelligence.', status: 'Completed', progress: 100, completedDate: '2025-01-27' },
        ]
    },
    {
        id: 'ai-robotics', name: 'AI & Robotics Framework', description: 'Core AI models, agent architecture, and robotics control.', icon: EyeIcon,
        items: [
            { id: 'ar-1', name: 'Nested AI Agent Handler', description: 'Primary AI core capable of delegating tasks to specialized sub-agents.', status: 'Completed', progress: 100, completedDate: '2024-07-24' },
            { id: 'ar-2', name: 'Robotics Control Module', description: 'API and driver layer for controlling robotic functions.', status: 'Completed', progress: 100, completedDate: '2024-07-24', children: [
                { id: 'ar-2-a', name: 'Boston Dynamics Atlas 4.0 Integration', description: 'Interface with full body control system and NVIDIA Jetson chip.', status: 'Completed', progress: 100, completedDate: '2025-01-28' },
                { id: 'ar-2-b', name: 'Apptronik Apollo Integration', description: 'Interface with advanced force control architecture.', status: 'Completed', progress: 100, completedDate: '2025-01-28' },
            ]},
            { id: 'ar-3', name: 'Robotics Takeover Protocol', description: 'Design the secure adapter/middleware for deploying personal AIs onto third-party robots.', status: 'Completed', progress: 100, completedDate: '2025-01-28' },
        ]
    },
    {
        id: 'avatar-cloning', name: 'AI Avatar Cloning Module', description: 'Framework for creating digital replicas of the user or unique AI entities.', icon: UserCircleIcon,
        items: [
            { id: 'ac-1', name: 'Data Ingestion Pipeline', description: 'Securely process user voice, video, and text data for training.', status: 'Completed', progress: 100, completedDate: '2025-01-29' },
            { id: 'ac-2', name: 'Voice Cloning Engine', description: 'Integrate or build a high-fidelity text-to-speech model for voice replication.', status: 'Completed', progress: 100, completedDate: '2025-01-29' },
            { id: 'ac-3', name: '3D Avatar Generation Engine', description: 'Reconstruct 3D avatars from video/images and generate novel appearances.', status: 'Completed', progress: 100, completedDate: '2025-01-29' },
            { id: 'ac-4', name: 'Personalized AI Core', description: 'Fine-tune an LLM on user-provided data to replicate conversational style and learn patterns.', status: 'Completed', progress: 100, completedDate: '2025-01-29' },
        ]
    },
    {
        id: 'governance', name: 'Governance & Compliance', description: 'User voting, compliance frameworks, and ethical AI laws.', icon: ShieldCheckIcon,
        items: [
            { id: 'gc-1', name: 'User Governance & Voting Protocol', description: 'Implement on-chain, weighted voting system for non-critical changes.', status: 'Completed', progress: 100, completedDate: '2025-01-30' },
            { id: 'gc-2', name: 'Global Compliance Module', description: 'Integrate checks for GDPR, CCPA, HIPAA, ISO 27001, etc.', status: 'Completed', progress: 100, completedDate: '2025-01-30' },
            { id: 'gc-3', name: 'Ethical AI Framework', description: 'Codify and enforce the core ethical laws for all AI agents.', status: 'Completed', progress: 100, completedDate: '2025-01-30' },
            { id: 'gc-4', name: 'Multi-Proof Consensus Engine', description: 'Build a flexible consensus layer supporting various proof-of mechanisms.', status: 'Completed', progress: 100, completedDate: '2025-01-30' },
        ]
    },
    {
        id: 'hardware', name: 'Hardware & Wearables', description: 'Integration with physical devices.', icon: CpuChipIcon,
        items: [
            { id: 'hw-1', name: 'Wearable AI Device Layer', description: 'Support for watches, rings, glasses, and AI Pins.', status: 'Completed', progress: 100, completedDate: '2025-01-31' },
            { id: 'hw-2', name: 'Bio-Synced Identity Module', description: 'Framework for multi-modal biometric authentication (face, finger, plasma, DNA scan concept).', status: 'Completed', progress: 100, completedDate: '2025-01-31' },
        ]
    },
    {
        id: 'network-ingestion', name: 'Network & Data Ingestion', description: 'Secure data scraping and network-level processing.', icon: GlobeAltIcon,
        items: [
            { id: 'ni-1', name: 'Onion Router Implementation', description: 'Build and sandbox the internal Tor-style client for data scraping.', status: 'Completed', progress: 100, completedDate: '2025-02-01' },
        ]
    },
    {
        id: 'game-engine', name: 'Universal Game Engine', description: 'A cross-platform game engine integrated with the core OS and AI.', icon: GameControllerIcon,
        items: [
            { id: 'ge-1', name: 'Engine Core UI', description: 'Build the main editor interface including viewport, inspector, and hierarchy panels.', status: 'Completed', progress: 100, completedDate: '2025-02-02' },
            { id: 'ge-2', name: 'Nested VM & Quantum Core Integration', description: 'Integrate the engine with nested virtualization and quantum co-processors.', status: 'Completed', progress: 100, completedDate: '2025-02-02' },
            { id: 'ge-3', name: 'Multi-Paradigm Renderer', description: 'Build a universal renderer for 2D, 3D, VR/AR, and superfluid light.', status: 'Completed', progress: 100, completedDate: '2025-02-02' },
        ]
    },
    {
        id: 'platform-clones', name: 'Internal Platform Clones', description: 'Building from-scratch versions of popular third-party services.', icon: ArrowPathIcon,
        items: [
            { id: 'pc-1', name: 'E-commerce & CMS Engine', description: 'Internal fork of Shopify and WordPress functionalities.', status: 'Completed', progress: 100, completedDate: '2025-02-03' },
            { id: 'pc-2', name: 'Automation Engine', description: 'Internal fork of Zapier/Make for event-driven workflows.', status: 'Completed', progress: 100, completedDate: '2025-02-03' },
            { id: 'pc-3', name: 'Content Creation Suite', description: 'Internal forks of Midjourney, Runway, 11 Labs, etc.', status: 'Completed', progress: 100, completedDate: '2025-02-03' },
            { id: 'pc-4', name: 'Trading & Finance Platform', description: 'Internal platform with AI bots, "forever trading", and advanced market analysis.', status: 'Completed', progress: 100, completedDate: '2025-02-03' },
        ]
    }
];

// --- UPDATED SETTINGS CONFIG (Reorganized) ---
export const settingsConfig: SettingsCategory[] = [
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

// --- Finance & Trading Data ---

export const tradingAssets: TradingAsset[] = [
    { symbol: 'BTC', name: 'Bitcoin', price: 65432.10, change: 1234.56, changePercent: 1.92, marketCap: 1200000000000, volume24h: 35000000000, logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg', assetClass: 'Crypto' },
    { symbol: 'ETH', name: 'Ethereum', price: 3420.50, change: -45.20, changePercent: -1.30, marketCap: 400000000000, volume24h: 15000000000, logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', assetClass: 'Crypto' },
    { symbol: 'SOL', name: 'Solana', price: 145.20, change: 8.50, changePercent: 6.22, marketCap: 65000000000, volume24h: 4000000000, logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.svg', assetClass: 'Crypto' },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 185.60, change: 1.20, changePercent: 0.65, marketCap: 2900000000000, volume24h: 5000000000, logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', assetClass: 'Stocks' },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 178.40, change: -3.50, changePercent: -1.92, marketCap: 560000000000, volume24h: 8000000000, logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png', assetClass: 'Stocks' },
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0845, change: 0.0020, changePercent: 0.18, logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg', assetClass: 'Forex' },
    { symbol: 'XAU/USD', name: 'Gold Spot', price: 2350.10, change: 15.40, changePercent: 0.66, logoUrl: 'https://cdn-icons-png.flaticon.com/512/2535/2535560.png', assetClass: 'Commodities' },
];

export const stakingPools: StakingPool[] = [
    { id: 'pool-1', asset: { symbol: 'ETH', name: 'Ethereum', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' }, apy: 4.5, tvl: 1500000000, lockupPeriod: 'None' },
    { id: 'pool-2', asset: { symbol: 'SOL', name: 'Solana', logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.svg' }, apy: 7.2, tvl: 800000000, lockupPeriod: '3 Days' },
    { id: 'pool-3', asset: { symbol: 'DOT', name: 'Polkadot', logoUrl: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.svg' }, apy: 12.5, tvl: 400000000, lockupPeriod: '28 Days' },
];

export const loanableAssets: LoanableAsset[] = [
    { symbol: 'USDC', logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg', supplyApy: 5.1, borrowApy: 6.5, totalSupplied: 500000000, totalBorrowed: 300000000 },
    { symbol: 'ETH', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', supplyApy: 2.5, borrowApy: 3.8, totalSupplied: 200000000, totalBorrowed: 80000000 },
    { symbol: 'WBTC', logoUrl: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg', supplyApy: 1.2, borrowApy: 2.0, totalSupplied: 150000000, totalBorrowed: 40000000 },
];

export const tradingBots: TradingBot[] = [
    { id: 'bot-1', name: 'BTC Grid Alpha', strategy: 'Grid Trading', pair: 'BTC/USDT', status: 'Running', pnl: 1250.45, runtime: '14d 2h' },
    { id: 'bot-2', name: 'ETH DCA Long', strategy: 'DCA Bot', pair: 'ETH/USDT', status: 'Running', pnl: 450.20, runtime: '5d 12h' },
    { id: 'bot-3', name: 'SOL Rebalance', strategy: 'Rebalancing', pair: 'SOL/USDC', status: 'Stopped', pnl: -25.10, runtime: '2d 1h' },
];

export const tradingNews: NewsArticle[] = [
    { id: 'n1', source: 'CoinDesk', title: 'Bitcoin ETF Inflows Surge as Market Sentiment Improves', timestamp: '2h ago', imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=400', category: 'Crypto' },
    { id: 'n2', source: 'Bloomberg', title: 'Fed Chair Signals Interest Rate Cuts Possible in Q3', timestamp: '4h ago', imageUrl: 'https://images.unsplash.com/photo-1526304640152-9292d132e29b?q=80&w=400', category: 'World Markets' },
    { id: 'n3', source: 'Decrypt', title: 'Ethereum Layer 2 TVL Hits All-Time High', timestamp: '6h ago', imageUrl: 'https://images.unsplash.com/photo-1622630998477-20aa696fa4f5?q=80&w=400', category: 'Crypto' },
];

export const learnAndEarnCourses: LearnAndEarnCourse[] = [
    { id: 'le-1', title: 'Intro to Polkadot', asset: { symbol: 'DOT', logoUrl: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.svg' }, reward: 5, duration: '10m', lessons: 3 },
    { id: 'le-2', title: 'Understanding DeFi', asset: { symbol: 'UNI', logoUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.svg' }, reward: 3, duration: '15m', lessons: 4 },
    { id: 'le-3', title: 'What is a Stablecoin?', asset: { symbol: 'USDC', logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg' }, reward: 2, duration: '5m', lessons: 2 },
];

export const topCopyTraders: User[] = [
    { id: 'trader-1', name: 'CryptoKing', username: 'cryptoking', avatarUrl: 'https://i.pravatar.cc/150?u=trader1', roi: 145.2, riskScore: 6, followers: 5400, role: 'Pro Trader' },
    { id: 'trader-2', name: 'SafeHands', username: 'safehands', avatarUrl: 'https://i.pravatar.cc/150?u=trader2', roi: 45.8, riskScore: 2, followers: 12000, role: 'Investor' },
    { id: 'trader-3', name: 'MoonShot', username: 'moonshot', avatarUrl: 'https://i.pravatar.cc/150?u=trader3', roi: 320.5, riskScore: 9, followers: 2100, role: 'Degen' },
];

export const aiTradingPlatforms: AiTradingPlatform[] = [
    {
        id: 'p1',
        name: 'TrendSpider',
        category: 'Multi-Asset',
        description: 'Advanced technical analysis software with automated charting and AI-driven trend detection.',
        features: ['Automated Trendlines', 'Strategy Tester', 'Raindrop Charts'],
        pricing: '$39/mo',
        bestFor: ['Technical Analysis', 'Swing Trading'],
        strengths: ['Visual automation', 'Unique chart types'],
        weaknesses: ['Learning curve'],
        pros: ['Saves time on charting', 'Alert system is robust'],
        cons: ['Can be expensive for beginners'],
        logoUrl: 'https://images.crunchbase.com/image/upload/c_lpad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_1/v1553542993/p4k8q2k5k8q2k5k8q2k5.png'
    },
    {
        id: 'p2',
        name: '3Commas',
        category: 'Crypto',
        description: 'A comprehensive crypto trading bot platform supporting DCA, Grid, and Options bots.',
        features: ['SmartTrade Terminal', 'DCA Bots', 'Grid Bots', 'Portfolio Tracking'],
        pricing: 'Free / $29/mo',
        bestFor: ['Bot Trading', 'Portfolio Management'],
        strengths: ['Multi-exchange support', 'Robust bot configurations'],
        weaknesses: ['Complex interface'],
        pros: ['Great for automation', 'Paper trading included'],
        cons: ['Customer support can be slow'],
        logoUrl: 'https://cryptologos.cc/logos/3commas-3commas-logo.png'
    },
    {
        id: 'p3',
        name: 'Trade Ideas',
        category: 'Stock',
        description: 'AI-powered stock scanner and idea generator for active day traders.',
        features: ['Holly AI', 'Real-time Scans', 'Backtesting'],
        pricing: '$89/mo',
        bestFor: ['Day Trading', 'Stock Picking'],
        strengths: ['Real-time data processing', 'AI entry/exit signals'],
        weaknesses: ['Windows only desktop app'],
        pros: ['Powerful scanner', 'AI guidance'],
        cons: ['Expensive', 'UI looks dated'],
        logoUrl: 'https://www.trade-ideas.com/wp-content/uploads/2016/07/TradeIdeas_Logo_250x250.png'
    }
];

export const mockValidators: Validator[] = [
    { id: 'val-1', name: 'Genesis Node', stake: 5000000, reputation: 100, isAuthority: true, status: 'Active', votes: 15000 },
    { id: 'val-2', name: 'Orion Validator', stake: 2500000, reputation: 98, isAuthority: false, status: 'Active', votes: 8000 },
    { id: 'val-3', name: 'Nebula Staking', stake: 1200000, reputation: 95, isAuthority: false, status: 'Active', votes: 4500 },
    { id: 'val-4', name: 'Cosmos Ventures', stake: 800000, reputation: 92, isAuthority: false, status: 'Active', votes: 3200 },
    { id: 'val-5', name: 'Quantum Secure', stake: 500000, reputation: 99, isAuthority: true, status: 'Active', votes: 6000 },
];