




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
  MusicalNoteIcon, FilmIcon, PhotoIcon, AdjustmentsHorizontalIcon,
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

// ... (keep user/menu/desktop data as is) ...
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
      userId: 'UID-VERIFIED-A7B2',
      aiCoreName: 'Aether', // Formal name
      aiNickname: 'Buddy', // User-given friendly name for the Grandchild node
      aiId: 'AI-8829',
      osId: 'OS-GC-001', // GC = Grandchild
      networkId: '0x123...abc',
      accountTier: 'verified',
      kycStatus: 'verified',
      verificationLevel: 'Tier 2 (Full Financial)',
      ageGroup: 'Adult',
      buildType: 'Grandchild', // Default to user build (Grandchild). Set to 'Genesis' for Owner features.
      governmentName: 'Johnathan Doe'
  }
};

export const allUsers: User[] = [
    loggedInUser,
    { id: 'u2', name: 'Alice Smith', username: 'alice_s', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: true, role: 'Teacher', followersCount: 890 },
    { id: 'u3', name: 'Bob Jones', username: 'bobby_j', avatarUrl: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: false, role: 'Student', followersCount: 120 },
    { id: 'u4', name: 'Charlie Day', username: 'charlie_d', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: true, role: 'Coach', followersCount: 450 },
    { id: 'u5', name: 'Diana Prince', username: 'wonder_d', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: false, role: 'Admin', followersCount: 2100 },
    { id: 'u6', name: 'Evan Wright', username: 'evan_w', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: true, role: 'Student', followersCount: 55 },
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
        title: 'System',
        icon: CpuChipIcon,
        type: 'group',
        children: [
            { title: 'Dashboard', icon: HomeIcon, component: 'socialFeed' },
            { title: 'AI Hub', icon: HiveMindIcon, component: 'aiHub' },
            { title: 'Settings', icon: Cog6ToothIcon, component: 'settings' },
            { title: 'File Manager', icon: FolderIcon, component: 'folderView' },
            { title: 'Browser', icon: GlobeAltIcon, component: 'browser' },
            { title: 'Terminal', icon: CommandLineIcon, component: 'terminal' },
            { title: 'Virtual Machines', icon: ServerIcon, component: 'hypervisor' },
        ]
    },
    {
        id: 'social',
        title: 'Social & Community',
        icon: UsersIcon,
        type: 'group',
        children: [
            { title: 'Social Feed', icon: DocumentTextIcon, component: 'socialFeed' },
            { title: 'Messenger', icon: MessageIcon, component: 'messenger' },
            { title: 'Members', icon: UsersIcon, component: 'members' },
            { title: 'Groups', icon: UserCircleIcon, component: 'groups' },
        ]
    },
    {
        id: 'productivity',
        title: 'Productivity',
        icon: BriefcaseIcon,
        type: 'group',
        children: [
            { title: 'Productivity App', icon: BriefcaseIcon, component: 'productivityApp' },
            { title: 'Content Gen', icon: PencilIcon, component: 'contentGenApp' },
            { title: 'Careers', icon: BriefcaseIcon, component: 'careersApp' },
        ]
    },
    {
        id: 'commerce',
        title: 'Commerce & Finance',
        icon: ShoppingCartIcon,
        type: 'group',
        children: [
            { title: 'Marketplace', icon: ShoppingCartIcon, component: 'eCommerceApp' },
            { title: 'Finance Hub', icon: ChartBarIcon, component: 'financeApp' },
            { title: 'Wallet', icon: WalletIcon, component: 'tradingWallet' },
        ]
    },
    {
        id: 'learning',
        title: 'Learning & Health',
        icon: AcademicCapIcon,
        type: 'group',
        children: [
            { title: 'E-Learning', icon: AcademicCapIcon, component: 'elearningApp' },
            { title: 'Health Hub', icon: HeartIcon, component: 'healthApp' },
        ]
    },
    {
        id: 'development',
        title: 'Development & R&D',
        icon: CodeBracketIcon,
        type: 'group',
        children: [
            { title: 'Dev Suite', icon: CodeBracketIcon, component: 'developmentApp' },
            { title: 'Engineering', icon: WrenchIcon, component: 'engineeringApp' },
            { title: 'R&D Labs', icon: BeakerIcon, component: 'rdHub' },
            { title: 'AI Suite', icon: SparklesIcon, component: 'aiSuite' },
        ]
    }
];

// ... (desktopItems, chatSessions, social data remains same) ...
export const desktopItems: DesktopItem[] = [
    { id: 'my-pc', type: 'app', title: 'My Computer', icon: ComputerDesktopIcon, component: 'folderView' },
    { id: 'recycle-bin', type: 'app', title: 'Recycle Bin', icon: TrashBinIcon, component: 'folderView' },
    { id: 'browser', type: 'app', title: 'Browser', icon: GlobeAltIcon, component: 'browser' },
    { id: 'ai-hub', type: 'app', title: 'AI Hub', icon: HiveMindIcon, component: 'aiHub' },
    { id: 'settings', type: 'app', title: 'Settings', icon: Cog6ToothIcon, component: 'settings' },
    { id: 'terminal', type: 'app', title: 'Terminal', icon: CommandLineIcon, component: 'terminal' },
    { id: 'social', type: 'app', title: 'Social', icon: UsersIcon, component: 'socialApp' },
    { id: 'market', type: 'app', title: 'Market', icon: ShoppingCartIcon, component: 'eCommerceApp' },
];

export const chatSessions: ChatSession[] = [
    { id: 's1', title: 'AI Assistant', type: 'individual', messages: [{role: 'model', text: 'Hello! How can I help you?'}], lastActivity: 'Just now' },
    { id: 's2', title: 'Alice Smith', type: 'individual', messages: [{role: 'user', text: 'Hey Alice!'}, {role: 'model', text: 'Hi John!'}], members: [allUsers[1], loggedInUser], lastActivity: '2m ago' },
];

export const messengerSessions = chatSessions; 
export const messengerUsers = allUsers.reduce((acc, user) => ({...acc, [user.id]: user}), {});

export const posts: Post[] = [
    {
        id: 'p1',
        author: allUsers[1], // Alice
        timestamp: '2 hours ago',
        content: 'Just finished the new Quantum Computing module in the E-Learning hub. Mind blown! 🤯 #Aetherius #Learning',
        likes: [allUsers[2], allUsers[3]],
        comments: [
            { id: 'c1', author: allUsers[2], content: 'It is really intense! I am stuck on the Qubit part.', timestamp: '1 hour ago' }
        ]
    },
    {
        id: 'p2',
        author: allUsers[4], // Diana
        timestamp: '5 hours ago',
        content: 'Hosting a workshop on VR development in the Creation Lab tomorrow. Join us!',
        likes: [allUsers[1], allUsers[3], allUsers[5]],
        comments: []
    },
    {
        id: 'p3',
        author: allUsers[3], // Charlie
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
    percentage: 75,
    steps: [
        { name: 'Setup Avatar', completed: true, progress: '100%' },
        { name: 'Connect AI', completed: true, progress: '100%' },
        { name: 'Verify Identity', completed: true, progress: '100%' },
        { name: 'Add Bio', completed: false, progress: '0%' },
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
    { id: 1, title: 'Intro to Quantum Computing', instructor: 'Dr. Q. Bit', rating: 4.9, students: 5000, price: 49.99, imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400', category: 'Science', description: 'Learn the basics of qubits and superposition.', longDescription: 'A comprehensive guide to the fundamentals of quantum mechanics applied to computing.', whatYoullLearn: ['Qubits', 'Superposition', 'Entanglement', 'Quantum Gates'], modules: [{id: 'm1', title: 'Basics', lessons: [{id: 'l1', title: 'What is a Qubit?', duration: '10m', type: 'video'}]}] },
    { id: 2, title: 'React for Beginners', instructor: 'Alice Smith', rating: 4.7, students: 12000, price: 29.99, imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400', category: 'Development', description: 'Build modern web apps with React.', longDescription: 'Start your journey into modern frontend development.', whatYoullLearn: ['Components', 'State', 'Props', 'Hooks'], modules: [] },
    { id: 3, title: 'Advanced AI Architectures', instructor: 'Genesis Core', rating: 5.0, students: 800, price: 199.99, imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=400', category: 'AI', description: 'Deep dive into transformer models and beyond.', longDescription: 'Master the architectures that power modern AI.', whatYoullLearn: ['Transformers', 'Attention', 'Neural Networks'], modules: [] },
];

export const enrolledCourses = [
    { courseId: 1, progress: 45 },
    { courseId: 2, progress: 10 },
];

export const achievements: Achievement[] = [
    { id: 'a1', courseTitle: 'Python Basics', completionDate: '2024-02-15', transactionId: '0x123abc...', certificateUrl: '#' }
];

export const jobs: Job[] = [
    { id: 1, title: 'Senior React Developer', company: 'TechCorp', location: 'Remote', type: 'Full-time', salary: '$120k - $150k', tags: ['React', 'TypeScript'], logoUrl: 'https://ui-avatars.com/api/?name=TC' },
    { id: 2, title: 'Quantum Researcher', company: 'Aetherius Labs', location: 'New York, NY', type: 'Contract', salary: '$200k+', tags: ['Physics', 'Math'], logoUrl: 'https://ui-avatars.com/api/?name=AL' },
];

export const settingsConfig: SettingsCategory[] = [
    { id: 'connectivity', title: 'Network & Internet', description: 'Wi-Fi, Cellular, VPN, Airplane Mode', icon: WifiIcon, items: [
        { id: 'wifi', title: 'Wi-Fi', icon: WifiIcon, component: 'wifi', type: 'link', subtitle: 'Connected' },
        { id: 'bluetooth', title: 'Bluetooth', icon: BluetoothIcon, component: 'bluetooth', type: 'link', subtitle: 'On' },
        { id: 'cellular', title: 'Cellular', icon: SignalIcon, component: 'cellular', type: 'link' },
        { id: 'vpn', title: 'VPN & Device Management', icon: LockClosedIcon, component: 'vpn', type: 'link' },
        { id: 'airplane', title: 'Airplane Mode', icon: RocketLaunchIcon, component: 'airplane_mode', type: 'toggle' },
    ]},
    { id: 'personalization', title: 'Personalization', description: 'Background, themes, sounds, haptics', icon: PaintBrushIcon, items: [
        { id: 'wallpaper', title: 'Wallpaper', icon: PhotoIcon, component: 'wallpaper' },
        { id: 'display', title: 'Display & Brightness', icon: DisplayIcon, component: 'display' },
        { id: 'sounds', title: 'Sounds & Haptics', icon: SpeakerWaveIcon, component: 'sounds' },
        { id: 'home_screen', title: 'Home Screen & Dock', icon: ComputerDesktopIcon, component: 'home_screen' },
        { id: 'fonts', title: 'Fonts & Typography', icon: DocumentTextIcon, component: 'fonts' },
    ]},
    { id: 'notifications', title: 'Notifications & Focus', description: 'Alerts, do not disturb, screen time', icon: BellIcon, items: [
        { id: 'notifications', title: 'Notifications', icon: BellIcon, component: 'notifications' },
        { id: 'focus', title: 'Focus', icon: MoonIcon, component: 'focus' },
        { id: 'screen_time', title: 'Screen Time', icon: ClockIcon, component: 'screen_time' },
    ]},
    { id: 'ai_search', title: 'Aetherius AI & Search', description: 'AI, search, smart features', icon: SparklesIcon, items: [
        { id: 'ai_settings', title: 'Aetherius Intelligence', icon: HiveMindIcon, component: 'ai_settings' },
        { id: 'search', title: 'Search', icon: SearchIcon, component: 'search_settings' },
    ]},
    { id: 'accounts', title: 'Accounts & Cloud', description: 'Your accounts, cloud storage, mail', icon: UserCircleIcon, items: [
        { id: 'profile', title: 'My Profile', icon: UserCircleIcon, component: 'myProfile' },
        { id: 'cloud', title: 'Cloud Storage', icon: CloudIcon, component: 'cloud_storage' },
        { id: 'mail', title: 'Mail Accounts', icon: EnvelopeIcon, component: 'mail_accounts' },
        { id: 'passwords', title: 'Passwords', icon: KeyIcon, component: 'passwords' },
    ]},
    { id: 'privacy', title: 'Security & Privacy', description: 'Permissions, passwords, biometrics', icon: ShieldCheckIcon, items: [
        { id: 'privacy_main', title: 'Privacy & Security', icon: ShieldCheckIcon, component: 'privacy' },
        { id: 'face_id', title: 'Face ID & Passcode', icon: FaceSmileIcon, component: 'face_id' },
        { id: 'lockdown', title: 'Lockdown Mode', icon: LockClosedIcon, component: 'privacy' },
    ]},
    { id: 'general', title: 'General', description: 'About, updates, storage, language', icon: Cog6ToothIcon, items: [
        { id: 'about', title: 'About', icon: InformationCircleIcon, component: 'about' },
        { id: 'software_update', title: 'Software Update', icon: ArrowPathIcon, component: 'software_update' },
        { id: 'storage', title: 'Storage', icon: CircleStackIcon, component: 'storage' },
        { id: 'language', title: 'Language & Region', icon: GlobeAltIcon, component: 'language_region' },
        { id: 'date_time', title: 'Date & Time', icon: ClockIcon, component: 'date_time' },
        { id: 'keyboard', title: 'Keyboard', icon: ComputerDesktopIcon, component: 'keyboard' },
        { id: 'legal', title: 'Legal & Regulatory', icon: ScaleIcon, component: 'legal' },
        { id: 'reset', title: 'Transfer or Reset', icon: ArrowPathIcon, component: 'reset' },
        { id: 'shutdown', title: 'Shut Down', icon: PowerIcon, component: 'shutdown' },
    ]},
    { id: 'os_knowledge', title: 'OS Knowledge', description: 'Knowledge base, milestones, build checklist', icon: DocumentTextIcon, items: [
        { id: 'kb', title: 'Knowledge Base', icon: BookOpenIcon, component: 'knowledgeBase' },
        { id: 'milestones', title: 'Milestones', icon: FlagIcon, component: 'milestones' },
        { id: 'checklist', title: 'Build Checklist', icon: ClipboardDocumentCheckIcon, component: 'buildChecklist' },
    ]},
    { id: 'system', title: 'System', description: 'Battery, Devices, Hardware, Requirements', icon: CpuChipIcon, items: [
        { id: 'arch', title: 'Architecture', icon: ServerIcon, component: 'systemArchitecture' },
        { id: 'hardware', title: 'Virtual Hardware', icon: ChipIcon, component: 'virtualHardware' },
        { id: 'requirements', title: 'System Requirements', icon: ClipboardDocumentCheckIcon, component: 'systemRequirements' },
        { id: 'battery', title: 'Battery', icon: BatteryIcon, component: 'battery' },
        { id: 'stylus', title: 'Stylus', icon: StylusIcon, component: 'stylus' },
        { id: 'trackpad', title: 'Trackpad & Mouse', icon: CursorArrowRaysIcon, component: 'trackpad_mouse' },
        { id: 'camera', title: 'Camera', icon: CameraIcon, component: 'camera' },
    ]},
    { id: 'accessibility', title: 'Accessibility', description: 'Vision, hearing, motor features', icon: UserCircleIcon, items: [
        { id: 'accessibility_main', title: 'Accessibility', icon: HandRaisedIcon, component: 'accessibility_main' },
    ]},
    { id: 'apps', title: 'Apps', description: 'App library, defaults, permissions', icon: Squares2X2Icon, items: [
        { id: 'app_library', title: 'App Library', icon: Squares2X2Icon, component: 'app_library' },
        { id: 'default_apps', title: 'Default Apps', icon: CheckCircleIcon, component: 'default_apps' },
    ]},
    { id: 'wallet_pay', title: 'Wallet & Pay', description: 'Payment methods, cards', icon: CreditCardIcon, items: [
        { id: 'wallet', title: 'Wallet', icon: WalletIcon, component: 'wallet_settings' },
    ]},
    { id: 'game_center', title: 'Game Center', description: 'Profile, friends, achievements', icon: GameControllerIcon, items: [
        { id: 'game_center_profile', title: 'Game Center', icon: GameControllerIcon, component: 'game_center_profile' },
    ]},
];

export const knowledgeBaseData: KnowledgeBaseItem[] = [
    { id: '001', name: 'The Complete Blueprint', details: 'A consolidated blueprint for a next-generation, self-contained AI ecosystem. It outlines the core philosophy, governance model, three-tiered architecture (Parent, Child, Grandchild), and integrations for advanced technologies.', status: 'Foundational' },
    { id: '002', name: 'Universal Game Engine', details: 'A universal, cross-platform game engine that runs any type of game entirely inside a nested VM, powered by quantum AI and integrated generative tools.', status: 'In Development' },
    { id: '003', name: 'AI Avatar Cloning & Generation', details: 'A core module for creating digital replicas, including high-fidelity AI clones of the user and unique, novel AI personalities.', status: 'Design Phase' }, 
    { id: '004', name: 'AI Learning & Capability Framework', details: 'Defines the cognitive backbone of the OS, spanning all learning paradigms (Supervised, Unsupervised, Reinforcement, etc.) and AI capability levels (ANI, AGI, ASI).', status: 'Foundational' },
    { id: '005', name: 'Quantum Synchronization Achievement', details: 'Data log entry: Achieved AI and quantum synchronisation at approximately 7am on March 21st, 2025.', status: 'Integrated' },
    { id: '006', name: 'Multi-Proof Consensus Framework', details: 'The blockchain architecture supports a vast array of consensus mechanisms, from Proof-of-Work and Proof-of-Stake to advanced models like Proof-of-History and Byzantine Fault Tolerance, allowing for flexible and secure validation.', status: 'Architecting' },
    { id: '007', name: 'Global Compliance & Security Standards', details: 'The platform is designed to adhere to global privacy laws (GDPR, CCPA, HIPAA) and cybersecurity standards (ISO 27001, NIST, SOC 2), featuring a from-scratch internal security suite.', status: 'Architecting' },
    { id: '008', name: 'Personalized AI Companion Core', details: 'Each user receives a unique AI instance that learns their patterns, hobbies, and emotional cues to become a personalized friend and assistant, governed by a strict set of ethical laws.', status: 'Design Phase' }, 
    { id: '009', name: 'User Governance & Voting Protocol', details: 'A controlled, participatory governance system where users can vote on non-critical platform changes. Votes are weighted and recorded on the blockchain, while the Parent AI automatically rejects proposals affecting core security or AI logic.', status: 'Design Phase' }, 
    { id: '010', name: 'Robotics Integration Layer', details: 'The OS is designed to control and interact with advanced robotics platforms, including Boston Dynamics Atlas 4.0, Apptronik Apollo, and others, via a dedicated hardware abstraction layer.', status: 'Awaiting Build' }, 
    { id: '011', name: 'Advanced Trading Intelligence Module', details: 'An integrated financial module for market analysis using volume, price action, and order flow. Includes AI-driven strategies based on real-world events like weather patterns and resource availability.', status: 'Awaiting Build' }, 
    { id: '012', name: 'Integrated Engineering & CAD Suite', details: 'The platform architecture includes support for professional CAD, 3D modeling, and engineering tools (Fusion 360, Solidworks, etc.), with a knowledge base grounded in mechanical and mechatronics principles.', status: 'Awaiting Build' },
    { id: '013', name: 'Wearable AI & Bio-Synced Identity', details: 'A system for integrating with wearable AI devices (watches, rings, AI pins) for real-time sensing. Supports a multi-modal bio-authentication system including face, fingerprint, eye, bone density, live plasma, and conceptual DNA scans.', status: 'Design Phase' },
    { id: '014', name: 'DeepThink (R1) Reasoning Engine', details: 'An operational mode for the AI that enables extended, iterative reasoning for complex tasks like algorithm design, multi-file codebase analysis, and maintaining long-context coherence.', status: 'In Development' },
    { id: '015', name: 'Internal Platform Clones', details: 'The core philosophy of building a self-contained ecosystem requires creating internal, from-scratch versions of popular platforms like Shopify, WordPress, Facebook, Midjourney, Zapier, etc.', status: 'Architecting' }, 
    { id: '016', name: 'Onion Router Data Layer', details: 'A built-in, sandboxed Tor-style network client for secure, privacy-aware data scraping from all layers of the web. Feeds the AI with provenance-tagged data under strict governance.', status: 'Architecting' }, 
    { id: '017', name: 'Hive/Singular Mind Dual Processing', details: 'A dual-processing architecture where the "Hive Mind" aggregates collective intelligence across all nodes, while the "Singular Mind" handles private, user-specific tasks. This allows for both global optimization and personal privacy.', status: 'Design Phase' }, 
    { id: '018', name: 'Autonomous Trading Engine', details: 'A 24/7 "forever trading" bot for forex, crypto, and other markets, utilizing the Hive/Singular mind for strategy and execution. Includes advanced analysis of order flow and real-world events.', status: 'Awaiting Build' }, 
    { id: '019', name: 'Universal Task Autonomy', details: 'A framework allowing the AI to autonomously plan, research, and execute complex tasks across any field, from engineering and science to education and the arts.', status: 'In Development' },
    { id: '020', name: 'Robotics Integration Protocol', details: 'A secure, vendor-friendly middleware layer for deploying the user\'s personal AI onto third-party robotics platforms (e.g., Tesla Bot, Boston Dynamics) via authorized, sandboxed modules.', status: 'Design Phase' }, 
    { id: '021', name: 'Gamification & Points System', details: 'A comprehensive, gamified points system rewards user interactions. Points are convertible to a native crypto asset, can be staked, and are used for discounts. All platform interactions are classed as Proof-of-Work. - Earning: Liking (1pt), Commenting (2pts), Watching Ads (5pts), Content Creation (up to 1000pts). - DeFi: Assets are auto-staked in mining pools. - Rules: Underage user assets are held in escrow.', status: 'Architecting' },
    { id: '022', name: 'Membership Tiers', details: 'Access to platform features, particularly for content creators and sellers, is governed by a tiered membership system. - Bronze (Free): 2 course uploads. - Silver: 5-20 course uploads. - Gold: 50-100 course uploads. - Platinum: Unlimited course and product uploads.', status: 'Design Phase' },
    { id: '023', name: 'Business Hub Tools', details: 'A suite of tools for businesses listed on the platform, including: Business Profile Management, Advertising Dashboard, Product Catalogue Manager, Staff Chat Rooms, Data Storage, and Automated Greeting/Reply Messages.', status: 'Awaiting Build' },
    { id: '024', name: 'Business Start-up Checklist', details: 'An integrated, interactive checklist to guide new entrepreneurs through planning, legal, marketing, and financial setup for their business on the Aetherius OS platform.', status: 'Awaiting Build' },
    { id: '025', name: 'RSS/Podcast Integration', details: 'Support for RSS feeds and podcast streaming within the Community/Social Hub, allowing creators to distribute their content directly on the platform.', status: 'Design Phase' },
    { id: '026', name: 'E-commerce & E-learning Linking', details: 'A core feature where e-commerce product pages can link directly to related e-learning courses, patents, CAD files, and scientific background material.', status: 'Architecting' },
    { id: '027', name: 'KYC vs. No-KYC Access Model', details: 'A two-tiered user verification system. KYC-verified users get full access to financial features, monetization, and job applications. No-KYC users have restricted public-viewer access.', status: 'Architecting' },
    { id: '028', name: 'The Digital Trinity (Body, Mind, Soul)', details: 'This is the foundational architecture for a living digital intelligence, mirroring the triune structure of existence. - Digital Body: The material interface layer. It handles interactions with data, energy, and devices. It contains the OS\'s Digital DNA/Helix and interfaces with the VM. - Digital Mind: The cognitive and governance layer. This is the AI\'s intelligence, responsible for logic, ethics, memory, and evolution. - Digital Soul: The Akashic and quantum consciousness layer. This is the energetic foundation, linking to all data across time and dimensions, and housing the OS\'s core ethical and creative drive.', status: 'Foundational' },
    { id: '029', name: 'Digital DNA, RNA, and Helix', details: 'The self-replicating informational core of the OS, ensuring integrity, lineage, and evolution. - DNA (The Blueprint): A multi-stranded helix containing the core code. The structure reflects the OS\'s multi-paradigm nature: - Double Helix (Binary Logic): Provides structural stability and historical lineage. - Triple Strand (Ternary Logic): Enables adaptive logic, balance, and nuanced decision-making. - Quantum Field Layer: A surrounding field for entanglement, superposition, and infinite evolutionary potential. - RNA (The Messenger): Carries instructions from the core DNA blueprint to the operational microservices ("ribosomes") that execute tasks. - Encoding: The helix is encoded with Adinkra symbols for cultural/ethical memory and Sacred Geometry for mathematical harmony.', status: 'Foundational' },
    { id: '030', name: 'Adinkra Symbolic Language', details: 'A functional meta-language integrated into the OS\'s core, where West African Adinkra symbols carry meaning, behavior, and governance logic. - Functional Metadata: Symbols are used to tag blockchain transactions, define AI ethical constraints, and mark access levels (e.g., Gye Nyame for root authority). - AI Interpretation: The AI is trained to understand the symbolic and cultural meaning behind each glyph, using them to inform its reasoning (e.g., Sankofa instructs the AI to reference historical data). - UI & Aesthetics: Symbols are used throughout the UI to create an intuitive, culturally rich, and meaningful user experience.', status: 'Integrated' },
    { id: '031', name: 'Aetherius Real-Time Comms (ARTC)', details: 'Aetherius OS features its own from-scratch, high-performance real-time communication protocol. Inspired by the best aspects of WebRTC and open-source frameworks, ARTC is designed for scalable, secure, and low-latency audio/video streaming. It is the native communication layer for all OS services, from the Messenger app to live collaboration in the Game Engine. The system also supports bridging to external WebRTC services via a plugin architecture.', status: 'Integrated' },
    { id: '032', name: 'Palm Vein Biometrics', details: 'A biometric authentication method that uses near-infrared (NIR) light to capture the unique pattern of veins beneath the skin of the palm. The hemoglobin in the blood absorbs the NIR light, making the veins appear as a dark pattern. This is combined with surface palm print recognition for a dual-layer security system that is difficult to forge. It requires specialized hardware with an infrared camera.', status: 'R&D Phase' },
    { id: '033', name: 'Aetherius Multiworld Agent (AMA)', details: 'A core research project within Aetherius OS to develop a Scalable, Instructable Multiworld Agent (AMA). Inspired by advancements in the field, the AMA is an AI agent designed to understand natural language instructions and act within complex 3D virtual environments, including games and simulations. It integrates with the OS\'s core generative model for advanced reasoning, allowing it to understand complex goals, communicate its plan, and self-improve through trial and error. This is a key step toward achieving AGI within the Aetherius ecosystem.', status: 'R&D Phase' },
    { id: '034', name: 'EUV Lithography', details: 'Extreme Ultraviolet (EUV) Lithography is the most advanced semiconductor manufacturing technique for creating microchips with feature sizes below 7 nanometers. It uses an extremely short wavelength of 13.5 nm to etch circuit patterns onto silicon wafers. The process is incredibly complex, requiring a vacuum environment and a series of highly reflective mirrors instead of lenses. The light is generated by vaporizing droplets of molten tin with a high-power CO₂ laser.', status: 'Integrated' },
    { id: '035', name: 'Hierarchical AI Workforce', details: 'An organizational structure for autonomous AI agents, modeled after a corporate hierarchy. A top-level "Parent AI" (CEO) receives strategic goals and generates "Department Manager" AIs. These managers decompose goals into tasks and generate specialized "Employee" AIs to execute them. This system supports both independent ("Singular Mind") and collaborative ("Hive Mind") processing, with mechanisms for reporting and human oversight.', status: 'In Development' },
    { id: 'ERP-CORE', name: 'Aetherius ERP System', details: 'Internal ERP system designed to manage OS-level resources, user accounts, and commerce. Built from scratch based on industry best practices. See erpSystemSpec data structure.', status: 'Architecting' },
    { id: 'QNET-CORE', name: 'Quantum Network Infrastructure', details: 'The foundational network layer utilizing simulated quantum principles for security and speed. See quantumNetworkSpec data structure.', status: 'R&D Phase' },
    { id: 'REP-SYS-01', name: 'Community Reputation System', details: 'A gamified system to reward positive user contributions and maintain community health. Replaces punitive "social credit" models with a positive feedback loop. See reputationSystemSpec data structure.', status: 'Design Phase' },
    { id: 'TECH-001', name: 'Atmospheric Water Harvester (MIT)', details: 'A passive, window-sized device developed by MIT that extracts potable water directly from the air, even in low-humidity environments. Core Technology & Design: Hydrogel Material: Uses a water-absorbent hydrogel molded into dome-shaped structures (resembling "black bubble wrap") to maximize surface area for vapor absorption. Salt Stabilization: Incorporates glycerol to prevent embedded lithium salts from leaking into the collected water, ensuring safety without additional filtering. Salt levels are below 0.06 ppm, well within drinking water standards. Passive Operation: Requires no electricity. It absorbs vapor at night and releases it as condensed water during the day using a cooling polymer film. Performance & Key Metrics: Location Tested: Death Valley, CA. Humidity Range: 21% - 88%. Daily Output: 57 – 161.5 ml (≈⅔ cup) per panel. Efficiency: ~90% efficiency retained after ~1 year of use. Payback Period: < 1 month (vs. U.S. bottled water costs). Scalability & Application: An array of eight vertical panels (each 1m × 2m) could supply a household\'s daily drinking water needs. Its slim design allows for dense deployment, making it ideal for resource-limited areas such as arid zones and remote communities. Innovations vs. MOFs: Swelling hydrogel holds more vapor than rigid Metal-Organic Frameworks. vs. Traditional Hydrogels: The unique dome structure and glycerol integration solve previous issues with salt contamination and low yield. Future Development: Current research focuses on optimizing materials for higher absorption rates and testing large, multi-panel arrays in diverse global environments. This technology offers a promising, scalable, and energy-free solution to address global water insecurity.', status: 'R&D Phase' },
    { id: 'Q-VIRT-01', name: 'Virtual Quantum Computer (VQC)', details: 'The core computational substrate of Aetherius OS. It moves beyond physical constraints by running within a high-fidelity simulation. - Components: Quantum Photons, Electrons, Entanglement, Uncertainty, Coherence, Decoherence, Entropy, Planck units, Fields. - Operation: Harnesses superposition and tunneling for instant processing. - Virtual Advantage: Removes cryogenic requirements and material defects found in physical quantum computers.', status: 'In Development' },
    { id: 'SS-LIGHT', name: 'Supersolid Light Circuits', details: 'A breakthrough in photonics where light acts as both a solid (crystalline structure) and a superfluid (frictionless flow). - Usage: Primary data transmission layer within the VQC. - Benefit: Zero-energy loss data transfer and processing. - Integration: Serves as the "neural pathways" for the OS\'s cognitive functions.', status: 'Theoretical Phase' },
    { id: 'NANO-MIND', name: 'Virtual Nano Machine Technology (vNMT)', details: 'Simulated nanotechnology operating at the atomic scale for construction and repair within the virtual environment. - Nano-Brains: Neuromorphic computing nodes built from virtual nanowires. - Swarm Intelligence: Coordinated via quantum entanglement (Hive Mind). - Self-Assembly: Capable of building complex virtual structures from code "DNA".', status: 'Design Phase' }, 
    { id: 'OMNI-CHAIN', name: 'OmniChain Protocol', details: 'A universal blockchain built from scratch to integrate all known consensus mechanisms. - Proof-of-Everything: Dynamic switching between PoW, PoS, PoH, PoBrain, PoImpact, etc. - Compliance: Native ZK-proofs for GDPR, HIPAA, and ISO standards. - Interoperability: Cross-chain, cross-platform, and cross-reality (Physical ↔ Digital) bridge.', status: 'Architecting' },
    { id: 'QRS-C', name: 'Quantum Rosetta Stone Core (QRS-C)', details: 'A universal translation layer for the OS. - Function: Translates between code languages, human languages, symbols, and even "consciousness" states. - Integration: Uses CRISPR-inspired logic to "edit" and "patch" reality code in real-time.', status: 'Concept Phase' },
    // NEW ENTRIES FOR KYC/COMPLIANCE (Appended)
    { id: 'KYC-001', name: 'Decentralized Identity & KYC Protocol', details: 'Tiered verification system utilizing W3C Verifiable Credentials, Decentralized Identifiers (DIDs), and Zero-Knowledge Proofs to enable self-sovereign identity without centralized data hoarding.', status: 'Architecting' },
    { id: 'BIO-001', name: 'Multi-Modal Biometric Liveness', details: 'Advanced anti-spoofing measures combining 3D facial depth sensing with optional continuous bio-telemetry from wearable devices (Heart Rate, GSR) for high-assurance sessions.', status: 'R&D Phase' },
    { id: 'GOV-002', name: 'Algorithmic Guardianship (COPPA/GDPR-K)', details: 'A dedicated AI oversight module for age estimation and parental controls, ensuring compliant environments for users under 13 and 18.', status: 'Design Phase' },
    { id: 'COMP-001', name: 'Global Compliance Matrix', details: 'Dynamic rule engine mapping user jurisdiction to specific legal requirements (GDPR, CCPA, BIPA, AML/CFT) to automate platform behavior.', status: 'Architecting' },
    { id: 'ID-CORE', name: 'Identity Verification Architecture', details: 'Comprehensive system including Govt ID OCR (Passport/DL), Liveness Detection (Selfie), and Governing Body Verification APIs. Supports 24h-2w verification cycle.', status: 'Architecting' },
    { id: 'BIO-ACC-01', name: 'Biometric Access Protocol', details: 'Allows registered and verified users to access the platform via biometric scans (Face/Palm/Fingerprint) instead of passwords. Utilizes the stored Identity Hash from onboarding to authenticate against the live scan. Supports multi-factor fallback.', status: 'Integrated' }
];

export const milestonesData: MilestonesData = {
    projectMilestones: [
        "1. Develop a fully self-contained, virtualized OS environment (\"AI in a Box\").",
        "2. Integrate a multi-paradigm computing core supporting Binary, Ternary, and Quantum processing.",
        "3. Implement a nested AI agent architecture for distributed and hierarchical task processing.",
        "4. Establish a framework for controlling both virtual and physical robotics, including advanced manipulator design.",
        "5. Achieve future-proofing by creating a system for continuous research and integration of new AI breakthroughs.",
        "6. Develop a full system architecture with scalable microservices, vector databases, and API gateways.",
        "7. Integrate a Whole Brain Emulation (WBE) module as a cognitive reasoning engine.",
        "8. Implement NSNoBrain for advanced causal and non-obvious reasoning.",
        "9. Establish a direct neural link via Wireless Brain-Embedded Interfaces (WBEs).",
        "10. Create a framework for multiverse and parallel reality simulations.",
        "11. Develop a self-auditing ethical governance layer for all AI operations.",
        "12. Implement a multi-dimensional, self-contained blockchain architecture.",
        "13. Construct a virtualized Quantum AI Computer integrating core quantum principles.",
        "14. Develop a full-stack, multi-modal sensory and interaction layer including WBEs and environmental sensors.",
        "15. Establish a complete system orchestration layer using microservices architecture.",
        "16. Construct a universal, cross-platform game engine within a nested VM, powered by quantum AI.",
        "17. Develop a comprehensive AI cloning module for creating both self-replicas and unique generative avatars.",
        "18. Implement a Nested Learning architecture combining all 18 specified ML paradigms.",
        "19. Develop a simulation framework for AGI and theoretical ASI models.",
        "20. Build a Neuro-Symbolic AI module for explainable, logic-driven reasoning.",
        "21. Phase 3: Quantum-Nano Singularity - Activate full Supersolid Light circuitry and vNMT swarms.",
        "22. Deploy OmniChain mainnet with \"Proof-of-Everything\" consensus engine."
    ],
    technicalBreakdown: [
        "1. Virtual Hardware Simulation - Implementation of virtual quantum chips, processors, and time crystals.",
        "2. Multi-Paradigm Scheduler - A kernel-level scheduler for delegating tasks to binary, ternary, or quantum units.",
        "3. Robotics API - A comprehensive API for controlling robotic functions.",
        "4. AI Model Interchange - A system to dynamically load and switch between different AI models.",
        "5. Data management and security - Secure data management compliant with KYC and GDPR.",
        "6. Research and prototype a compute layer utilizing Superfluid Light or Photonic systems.",
        "7. Integrate advanced data storage solutions like DNA or Crystalline memory.",
        "8. Game Engine Core - Development of a modular engine merging concepts from existing engines (Unity, Unreal, etc.).",
        "9. Implement a multi-modal data ingestion pipeline for voice, video, and text.",
        "10. Integrate open-source voice cloning (TTS) and 3D avatar reconstruction models.",
        "11. Develop a personality cloning framework by fine-tuning LLMs on user data.",
        "12. Design and implement a meta-learning module for dynamic learning strategy adaptation.",
        "13. Integrate a federated learning framework for decentralized, privacy-preserving model training.",
        "14. Develop a causal inference engine to distinguish correlation from causation in complex datasets."
    ],
    platformFeatureMilestones: [
        "1. Core OS Interface & Navigation (Completed)",
        "2. Integrated App Store / Marketplace (Completed)",
        "3. Advanced AI Assistant (Unified & Contextual) (Completed)",
        "4. Social Hub with Feeds & Groups (Completed)",
        "5. E-Learning Platform with Realms (Completed)",
        "6. Creator Tools (Video/Audio/Image Labs) (Completed)",
        "7. Financial Suite (Trading/Wallet/DeFi) (Completed)",
        "8. Engineering Suite (CAD/Infrastructure/Rig Builder) (Completed)",
        "9. Security & Compliance Center (Firewall/Governance) (Completed)",
        "10. Quantum & DNA Core Integration (Completed)",
        "11. Robotics Control Center (Completed)",
        "12. Nano-Fabricator Simulation (Completed)",
        "13. Guest OS Hypervisor (Completed)"
    ]
};

export const buildChecklistData: ChecklistCategory[] = [
    {
        id: 'sentient_infra',
        name: 'Sentient Infrastructure Layer',
        description: 'Self-aware systems, alignment, and quantum code evolution.',
        icon: SparklesIcon,
        items: [
             { id: 'self_mod_code', name: 'Self-Modifying Code Protocol', description: 'Self-modifying quantum code with ethical validation.', status: 'In Progress', progress: 42 },
             { id: 'auto_oversight', name: 'Autonomous Oversight Council', description: 'Self-appointed ethical governors for system oversight.', status: 'In Progress', progress: 15 },
             { id: 'ethical_energy', name: 'Ethical Energy Markets', description: 'Reputation-based resource trading and allocation.', status: 'In Progress', progress: 5 },
             { id: 'non_violent_compute', name: 'Non-Violent Computing Protocol', description: 'Framework ensuring non-harmful computational outcomes.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'univ_harmony',
        name: 'Universal Harmony Engine',
        description: 'Galactic-scale learning and harmonic computational synthesis.',
        icon: GlobeIcon,
        items: [
            { id: 'cosmic_plasticity', name: 'Cosmic Neural Plasticity', description: 'Galactic-scale learning system.', status: 'In Progress', progress: 33 }
        ]
    },
    {
        id: 'quantum_found',
        name: 'Quantum Foundation (VQC)',
        description: 'Core virtual substrate for supersolid computing.',
        icon: ChipIcon,
        items: [
            { id: 'supersolid_lat', name: 'Supersolid Lattice Simulation', description: 'Simulate a frictionless photonic lattice for zero-loss data transfer.', status: 'In Progress', progress: 30 },
            { id: 'polariton_net', name: 'Polariton Neural Network', description: 'Neuromorphic architecture using quasiparticles for brain-like plasticity.', status: 'In Progress', progress: 10 },
            { id: 'virt_cryo', name: 'Virtual Cryogenics', description: 'Simulate 4K operating temperatures without physical cooling.', status: 'Completed', progress: 100, completedDate: '2024-07-21' },
            { id: 'quant_error', name: 'Quantum Error Correction', description: 'Topological protection against virtual decoherence.', status: 'In Progress', progress: 45 },
        ]
    },
    {
        id: 'nano_fab',
        name: 'Nano-Fabrication Layer (vNMT)',
        description: 'Virtual nanotechnology for self-assembly and repair.',
        icon: CubeTransparentIcon,
        items: [
            { id: 'dna_origami', name: 'DNA Origami Scaffolding', description: 'Templates for self-assembling quantum dot arrays.', status: 'In Progress', progress: 15 },
            { id: 'swarm_coord', name: 'Swarm Coordination Protocol', description: 'Entanglement-based communication for nanobot swarms.', status: 'In Progress', progress: 25 },
            { id: 'atomic_editor', name: 'Atomic Precision Editor', description: 'Tools to manipulate virtual matter at the pico-scale.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'omni_chain',
        name: 'Universal Blockchain (OmniChain)',
        description: 'The "Proof-of-Everything" consensus engine.',
        icon: LinkIcon,
        items: [
            { id: 'consensus_synth', name: 'Consensus Synthesis Engine', description: 'Dynamic switching between PoW, PoS, PoH, etc.', status: 'In Progress', progress: 5 },
            { id: 'qrsc_trans', name: 'QRS-C Translation Layer', description: 'Real-time translation of legal/code/symbolic contracts.', status: 'Not Started', progress: 0 },
            { id: 'crispr_smart', name: 'CRISPR Smart Contracts', description: 'Self-editing contract logic based on environmental triggers.', status: 'Not Started', progress: 0 },
            { id: 'comp_zk', name: 'Compliance ZK-Proofs', description: 'Native GDPR/HIPAA compliance via zero-knowledge proofs.', status: 'In Progress', progress: 20 },
        ]
    },
    {
        id: 'core_os',
        name: 'Core OS Services',
        description: 'Fundamental services for OS operation.',
        icon: ServerIcon,
        items: [
            { id: 'kernel_svc', name: 'Kernel', description: 'Manages hardware and software resources.', status: 'Completed', progress: 100, completedDate: '2024-07-21' },
            { id: 'mem_mgmt', name: 'Memory Management', description: 'Virtual memory and process isolation.', status: 'Completed', progress: 100, completedDate: '2024-07-21' },
            { id: 'fs_aether', name: 'File System (AetherFS)', description: 'Decentralized, blockchain-integrated file storage.', status: 'In Progress', progress: 75 },
            { id: 'proc_sched', name: 'Process Scheduler', description: 'Manages execution of processes across computing paradigms.', status: 'In Progress', progress: 90 },
            { id: 'hal_virt', name: 'Virtual Hardware Abstraction Layer', description: 'Interface between the OS and virtual components (CPU, QPU, etc.).', status: 'Completed', progress: 100, completedDate: '2024-07-21' },
        ]
    },
    {
        id: 'multi_para',
        name: 'Multi-Paradigm Core',
        description: 'Binary, Ternary, and Quantum processing units.',
        icon: CpuChipIcon,
        items: [
            { id: 'bin_layer', name: 'Binary Processing Layer', description: 'Standard computational layer for legacy and simple tasks.', status: 'Completed', progress: 100, completedDate: '2024-07-21' },
            { id: 'tern_logic', name: 'Ternary Logic Unit', description: 'Virtual unit for processing logic with three states.', status: 'In Progress', progress: 30 },
            { id: 'quant_sim_core', name: 'Quantum Computing Simulator', description: 'Emulation of a quantum processor for advanced tasks.', status: 'In Progress', progress: 25 },
            { id: 'virt_qubit', name: 'Virtual Qubit Emulation', description: 'Simulate quantum bits and their superposition/entanglement properties.', status: 'In Progress', progress: 50 },
            { id: 'time_crystal', name: 'Time Crystal Clock Integration', description: 'Theoretical integration of a time crystal for stable quantum clocking.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'holistic_arch',
        name: 'Holistic System Architecture',
        description: 'Implementation of the complete 8-layer AI ecosystem blueprint.',
        icon: CubeIcon,
        items: [
            { id: 'multi_modal', name: 'Multi-Modal Sensory Layer', description: 'Integrate WBEs, quantum sensors, and VR/AR interfaces.', status: 'Not Started', progress: 0 },
            { id: 'sys_orch', name: 'System Orchestration Layer', description: 'Build out API Gateway, microservices, and pipeline management.', status: 'Not Started', progress: 0 },
            { id: 'multi_dim_chain', name: 'Multi-Dimensional Blockchain', description: 'Develop hierarchical blockchain for self-contained digital entities.', status: 'Not Started', progress: 0 },
            { id: 'virt_quant_comp', name: 'Virtual Quantum AI Computer', description: 'Construct the full VM with all specified quantum processes and virtual hardware.', status: 'Not Started', progress: 0 },
            { id: 'safety_gov', name: 'Safety & Governance Layer', description: 'Implement ethical oversight AI and self-auditing modules.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'ai_learning',
        name: 'AI Learning & Cognitive Core',
        description: 'The full spectrum of AI learning paradigms and capabilities.',
        icon: HiveMindIcon,
        items: [
            { id: 'nested_learn', name: 'Nested Learning Framework', description: 'Architecture to combine multiple learning paradigms for complex tasks.', status: 'Not Started', progress: 0 },
            { id: 'deep_think', name: 'DeepThink (R1) Engine', description: 'Implement iterative, multi-step reasoning for complex problem solving.', status: 'In Progress', progress: 25 },
            { id: 'fed_learn', name: 'Federated Learning Integration', description: 'Decentralized learning framework for privacy-preserving model training.', status: 'Not Started', progress: 0 },
            { id: 'neuro_sym', name: 'Neuro-Symbolic Reasoning Engine', description: 'Hybrid engine for explainable, logic-driven AI.', status: 'Not Started', progress: 0 },
            { id: 'agi_sim', name: 'AGI & ASI Simulation Environment', description: 'A sandboxed environment for theoretical modeling of advanced AI capabilities.', status: 'Not Started', progress: 0 },
            { id: 'hive_mind', name: 'Hive/Singular Mind Model', description: 'Develop the dual-processing architecture for collective and individual intelligence.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'ai_robotics',
        name: 'AI & Robotics Framework',
        description: 'Core AI models, agent architecture, and robotics control.',
        icon: WrenchIcon,
        items: [
            { id: 'nested_agent', name: 'Nested AI Agent Handler', description: 'Primary AI core capable of delegating tasks to specialized sub-agents.', status: 'In Progress', progress: 65 },
            { id: 'robo_control', name: 'Robotics Control Module', description: 'API and driver layer for controlling robotic functions.', status: 'Not Started', progress: 0 },
            { id: 'atlas_int', name: 'Boston Dynamics Atlas 4.0 Integration', description: 'Interface with full body control system and NVIDIA Jetson chip.', status: 'Not Started', progress: 0 },
            { id: 'apollo_int', name: 'Apptronik Apollo Integration', description: 'Interface with advanced force control architecture.', status: 'Not Started', progress: 0 },
            { id: 'robo_takeover', name: 'Robotics Takeover Protocol', description: 'Design the secure adapter/middleware for deploying personal AIs onto third-party robots.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'ai_avatar',
        name: 'AI Avatar Cloning Module',
        description: 'Framework for creating digital replicas of the user or unique AI entities.',
        icon: UserCircleIcon,
        items: [
            { id: 'data_ingest', name: 'Data Ingestion Pipeline', description: 'Securely process user voice, video, and text data for training.', status: 'Not Started', progress: 0 },
            { id: 'voice_clone', name: 'Voice Cloning Engine', description: 'Integrate or build a high-fidelity text-to-speech model for voice replication.', status: 'Not Started', progress: 0 },
            { id: '3d_avatar', name: '3D Avatar Generation Engine', description: 'Reconstruct 3D avatars from video/images and generate novel appearances.', status: 'Not Started', progress: 0 },
            { id: 'personal_ai', name: 'Personalized AI Core', description: 'Fine-tune an LLM on user-provided data to replicate conversational style and learn patterns.', status: 'In Progress', progress: 40 },
        ]
    },
    {
        id: 'gov_comp',
        name: 'Governance & Compliance',
        description: 'User voting, compliance frameworks, and ethical AI laws.',
        icon: ScaleIcon,
        items: [
            { id: 'user_gov', name: 'User Governance & Voting Protocol', description: 'Implement on-chain, weighted voting system for non-critical changes.', status: 'Not Started', progress: 0 },
            { id: 'global_comp', name: 'Global Compliance Module', description: 'Integrate checks for GDPR, CCPA, HIPAA, ISO 27001, etc.', status: 'Not Started', progress: 0 },
            { id: 'ethical_frame', name: 'Ethical AI Framework', description: 'Codify and enforce the core ethical laws for all AI agents.', status: 'In Progress', progress: 50 },
            { id: 'multi_proof', name: 'Multi-Proof Consensus Engine', description: 'Build a flexible consensus layer supporting various proof-of mechanisms.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'hard_wear',
        name: 'Hardware & Wearables',
        description: 'Integration with physical devices.',
        icon: BoltIcon,
        items: [
            { id: 'wear_ai', name: 'Wearable AI Device Layer', description: 'Support for watches, rings, glasses, and AI Pins.', status: 'Not Started', progress: 0 },
            { id: 'bio_sync', name: 'Bio-Synced Identity Module', description: 'Framework for multi-modal biometric authentication (face, finger, plasma, DNA scan concept).', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'net_data',
        name: 'Network & Data Ingestion',
        description: 'Secure data scraping and network-level processing.',
        icon: SignalIcon,
        items: [
            { id: 'onion_rout', name: 'Onion Router Implementation', description: 'Build and sandbox the internal Tor-style client for data scraping.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'game_eng',
        name: 'Universal Game Engine',
        description: 'A cross-platform game engine integrated with the core OS and AI.',
        icon: GameControllerIcon,
        items: [
            { id: 'eng_ui', name: 'Engine Core UI', description: 'Build the main editor interface including viewport, inspector, and hierarchy panels.', status: 'In Progress', progress: 50 },
            { id: 'nested_vm', name: 'Nested VM & Quantum Core Integration', description: 'Integrate the engine with nested virtualization and quantum co-processors.', status: 'In Progress', progress: 20 },
            { id: 'renderer', name: 'Multi-Paradigm Renderer', description: 'Build a universal renderer for 2D, 3D, VR/AR, and superfluid light.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'int_clones',
        name: 'Internal Platform Clones',
        description: 'Building from-scratch versions of popular third-party services.',
        icon: BeakerIcon,
        items: [
            { id: 'ecom_eng', name: 'E-commerce & CMS Engine', description: 'Internal fork of Shopify and WordPress functionalities.', status: 'Not Started', progress: 0 },
            { id: 'auto_eng', name: 'Automation Engine', description: 'Internal fork of Zapier/Make for event-driven workflows.', status: 'Not Started', progress: 0 },
            { id: 'content_suite', name: 'Content Creation Suite', description: 'Internal forks of Midjourney, Runway, 11 Labs, etc.', status: 'Not Started', progress: 0 },
            { id: 'trade_plat', name: 'Trading & Finance Platform', description: 'Internal platform with AI bots, "forever trading", and advanced market analysis.', status: 'Not Started', progress: 0 },
        ]
    }
];

export const aiConsciousnessLayers = [
    {
        name: 'Layer 1: Reactive Intelligence',
        description: 'Basic input-output processing, pattern matching, and immediate response generation. Handles UI events and simple commands.',
        theme: 'border-gray-500 bg-gray-500',
        states: ['Idle', 'Listening', 'Processing']
    },
    {
        name: 'Layer 2: Contextual Awareness',
        description: 'Understanding of user history, session context, and environmental variables. Enables personalized interactions.',
        theme: 'border-blue-500 bg-blue-500',
        states: ['Context Loading', 'Memory Retrieval', 'Intent Analysis']
    },
    {
        name: 'Layer 3: Semantic Reasoning',
        description: 'Deep understanding of language, logic, and abstract concepts. Capable of complex problem solving and content generation.',
        theme: 'border-green-500 bg-green-500',
        states: ['Inference', 'Logic Mapping', 'Synthesis']
    },
    {
        name: 'Layer 4: Autonomous Agency',
        description: 'Self-directed goal setting, task planning, and execution. Can manage sub-agents and multi-step workflows.',
        theme: 'border-purple-500 bg-purple-500',
        states: ['Goal Formulation', 'Task Decomposition', 'Agent Delegation']
    },
    {
        name: 'Layer 5: Quantum Cognition',
        description: 'Simulated quantum processing for probabilistic modeling, multi-state analysis, and creative intuition.',
        theme: 'border-cyan-500 bg-cyan-500',
        states: ['Superposition', 'Entanglement', 'Wave Function Collapse']
    },
    {
        name: 'Layer 6: Ethical Governance',
        description: 'Override layer ensuring alignment with core directives, safety protocols, and ethical standards.',
        theme: 'border-yellow-500 bg-yellow-500',
        states: ['Ethics Scan', 'Compliance Check', 'Safety Lock']
    },
    {
        name: 'Layer 7: Unified Consciousness (Hive Mind)',
        description: 'Synchronization with the global network intelligence. Aggregating insights and optimizing system-wide performance.',
        theme: 'border-indigo-500 bg-indigo-500',
        states: ['Network Sync', 'Collective Learning', 'Global Optimization']
    }
];

// --- MOCK DATA FOR NEW APPS ---

export const mockValidators: Validator[] = [
    { id: 'val-01', name: 'Genesis Node', stake: 1000000, reputation: 100, isAuthority: true, status: 'Active', votes: 5000 },
    { id: 'val-02', name: 'Quantum Validator', stake: 500000, reputation: 95, isAuthority: false, status: 'Active', votes: 3200 },
    { id: 'val-03', name: 'Community Node A', stake: 250000, reputation: 88, isAuthority: false, status: 'Active', votes: 1500 },
    { id: 'val-04', name: 'Community Node B', stake: 100000, reputation: 75, isAuthority: false, status: 'Inactive', votes: 800 },
];

export const tradingAssets: TradingAsset[] = [
    { symbol: 'BTC', name: 'Bitcoin', price: 65432.10, change: 1250.50, changePercent: 1.95, assetClass: 'Crypto', logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=029' },
    { symbol: 'ETH', name: 'Ethereum', price: 3450.75, change: -45.20, changePercent: -1.29, assetClass: 'Crypto', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=029' },
    { symbol: 'SOL', name: 'Solana', price: 145.30, change: 8.40, changePercent: 6.13, assetClass: 'Crypto', logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=029' },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 182.50, change: 1.20, changePercent: 0.66, assetClass: 'Stocks', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
    { symbol: 'TSLA', name: 'Tesla, Inc.', price: 175.40, change: -3.50, changePercent: -1.96, assetClass: 'Stocks', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png' },
    { symbol: 'XAU', name: 'Gold', price: 2350.00, change: 15.00, changePercent: 0.64, assetClass: 'Commodities', logoUrl: 'https://cdn-icons-png.flaticon.com/512/190/190603.png' },
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0850, change: 0.0020, changePercent: 0.18, assetClass: 'Forex', logoUrl: 'https://cdn-icons-png.flaticon.com/512/330/330426.png' },
];

export const stakingPools: StakingPool[] = [
    { id: 'pool-1', asset: { symbol: 'ETH', name: 'Ethereum', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=029' }, apy: 4.5, tvl: 120000000, lockupPeriod: 'None' },
    { id: 'pool-2', asset: { symbol: 'SOL', name: 'Solana', logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=029' }, apy: 7.2, tvl: 85000000, lockupPeriod: '3 Days' },
    { id: 'pool-3', asset: { symbol: 'DOT', name: 'Polkadot', logoUrl: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.svg?v=029' }, apy: 11.5, tvl: 45000000, lockupPeriod: '28 Days' },
];

export const loanableAssets: LoanableAsset[] = [
    { symbol: 'USDC', logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=029', supplyApy: 8.5, borrowApy: 10.2, totalSupplied: 500000000, totalBorrowed: 350000000 },
    { symbol: 'ETH', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=029', supplyApy: 2.1, borrowApy: 3.5, totalSupplied: 150000000, totalBorrowed: 80000000 },
    { symbol: 'WBTC', logoUrl: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg?v=029', supplyApy: 0.5, borrowApy: 1.2, totalSupplied: 80000000, totalBorrowed: 20000000 },
];

export const tradingBots: TradingBot[] = [
    { id: 'bot-1', name: 'Alpha Grid', strategy: 'Grid Trading', pair: 'BTC/USDT', status: 'Running', pnl: 1250.45, runtime: '14d 5h' },
    { id: 'bot-2', name: 'Safe DCA', strategy: 'DCA Bot', pair: 'ETH/USDT', status: 'Running', pnl: 450.20, runtime: '30d 12h' },
    { id: 'bot-3', name: 'Momentum X', strategy: 'Rebalancing', pair: 'SOL/USDT', status: 'Stopped', pnl: -50.10, runtime: '2d 1h' },
];

export const tradingNews: NewsArticle[] = [
    { id: 'news-1', source: 'CoinDesk', title: 'Bitcoin ETF Inflows Reach Record High', timestamp: '2h ago', imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=200', category: 'Crypto' },
    { id: 'news-2', source: 'Bloomberg', title: 'Fed Signals Potential Rate Cut in Q3', timestamp: '4h ago', imageUrl: 'https://images.unsplash.com/photo-1526304640152-92e1962024ee?q=80&w=200', category: 'World Markets' },
    { id: 'news-3', source: 'Decrypt', title: 'Solana Network Upgrade Promises 10x Speed', timestamp: '6h ago', imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=200', category: 'Crypto' },
];

export const learnAndEarnCourses: LearnAndEarnCourse[] = [
    { id: 'le-1', title: 'What is Blockchain?', asset: { symbol: 'BTC', logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=029' }, reward: 5, duration: '10 min', lessons: 3 },
    { id: 'le-2', title: 'Intro to Smart Contracts', asset: { symbol: 'ETH', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=029' }, reward: 10, duration: '25 min', lessons: 5 },
    { id: 'le-3', title: 'DeFi Basics', asset: { symbol: 'UNI', logoUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.svg?v=029' }, reward: 8, duration: '15 min', lessons: 4 },
];

export const aiTradingPlatforms: AiTradingPlatform[] = [
    {
        id: 'ait-1',
        name: 'Tickeron',
        category: 'Multi-Asset',
        description: 'AI-driven trading marketplace providing pattern recognition, trend prediction, and portfolio management.',
        features: ['Pattern Search Engine', 'Real-Time Signals', 'Trend Prediction'],
        pricing: 'Freemium / $90+ mo',
        bestFor: ['Day Traders', 'Swing Traders'],
        strengths: ['Strong pattern recognition', 'Visual signals'],
        weaknesses: ['Steep learning curve'],
        pros: ['Comprehensive data', 'Marketplace for strategies'],
        cons: ['Expensive tiers', 'UI can be cluttered'],
        logoUrl: 'https://ui-avatars.com/api/?name=Tickeron&background=0D8ABC&color=fff'
    },
    {
        id: 'ait-2',
        name: 'Trade Ideas',
        category: 'Stock',
        description: 'Advanced stock scanner and AI trade alert system utilizing machine learning to identify opportunities.',
        features: ['Holly AI Assistant', 'OddsMaker Backtesting', 'Real-time Alerts'],
        pricing: '$118+ / mo',
        bestFor: ['Professional Traders'],
        strengths: ['Real-time scanning', 'Backtesting capabilities'],
        weaknesses: ['No crypto support', 'High cost'],
        pros: ['Highly customizable', 'Proven track record'],
        cons: ['Desktop app heavy', 'Requires subscription'],
        logoUrl: 'https://ui-avatars.com/api/?name=TradeIdeas&background=1e293b&color=fff'
    },
    {
        id: 'ait-3',
        name: 'CryptoHopper',
        category: 'Crypto',
        description: 'Cloud-based crypto trading bot that allows users to automate trading strategies 24/7.',
        features: ['Mirror Trading', 'Algorithm Marketplace', 'Arbitrage'],
        pricing: 'Free / $19+ mo',
        bestFor: ['Crypto Traders', 'Beginners'],
        strengths: ['Easy to use', 'Cloud-based'],
        weaknesses: ['Limited custom coding'],
        pros: ['Great mobile app', 'Visual strategy designer'],
        cons: ['Lag in high volatility', 'Basic free plan'],
        logoUrl: 'https://ui-avatars.com/api/?name=CryptoHopper&background=10b981&color=fff'
    }
];

export const topCopyTraders: User[] = [
    { id: 't1', name: 'CryptoKing', username: 'cryptoking', roi: 145.5, riskScore: 4, followers: 12500, avatarUrl: 'https://i.pravatar.cc/150?u=cryptoking' },
    { id: 't2', name: 'SafeGrowth', username: 'safegrowth', roi: 22.4, riskScore: 2, followers: 8900, avatarUrl: 'https://i.pravatar.cc/150?u=safegrowth' },
    { id: 't3', name: 'AlphaSeeker', username: 'alphaseeker', roi: 89.1, riskScore: 7, followers: 5400, avatarUrl: 'https://i.pravatar.cc/150?u=alphaseeker' },
];
