
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
        title: 'System',
        icon: CpuChipIcon,
        type: 'group',
        children: [
            { title: 'Dashboard', icon: HomeIcon, component: 'socialFeed' },
            { title: 'AI Hub', icon: HiveMindIcon, component: 'aiHub' },
            { title: 'Settings', icon: Cog6ToothIcon, component: 'settings' },
            { title: 'Cloud Ops', icon: CloudIcon, component: 'cloudOps' },
            { title: 'File Manager', icon: FolderIcon, component: 'folderView' },
            { title: 'Browser', icon: GlobeAltIcon, component: 'browser' },
            { title: 'Terminal', icon: CommandLineIcon, component: 'terminal' },
            { title: 'Virtual Machines', icon: ServerIcon, component: 'hypervisor' },
            { title: 'Knowledge Base', icon: BookOpenIcon, component: 'knowledgeBase' },
            { title: 'Milestones', icon: FlagIcon, component: 'milestones' },
            { title: 'Build Checklist', icon: ClipboardDocumentCheckIcon, component: 'buildChecklist' },
            { title: 'System Requirements', icon: ShieldCheckIcon, component: 'systemRequirements' },
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
            { title: 'Architecture', icon: CubeIcon, component: 'systemArchitecture' },
            { title: 'Core Paradigms', icon: ChipIcon, component: 'coreParadigms' },
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


// --- KNOWLEDGE BASE DATA (RESTORED & EXPANDED) ---
export const knowledgeBaseData: KnowledgeBaseItem[] = [
    { id: '001', name: 'The Complete Blueprint', details: 'A consolidated blueprint for a next-generation, self-contained AI ecosystem. It outlines the core philosophy, governance model, three-tiered architecture (Parent, Child, Grandchild), and integrations for advanced technologies.', status: 'Foundational' },
    { id: '002', name: 'Universal Game Engine', details: 'A universal, cross-platform game engine that runs any type of game entirely inside a nested VM, powered by quantum AI and integrated generative tools.', status: 'Integrated' },
    { id: '003', name: 'AI Avatar Cloning & Generation', details: 'A core module for creating digital replicas, including high-fidelity AI clones of the user and unique, novel AI personalities.', status: 'Integrated' },
    { id: '004', name: 'AI Learning & Capability Framework', details: 'Defines the cognitive backbone of the OS, spanning all learning paradigms (Supervised, Unsupervised, Reinforcement, etc.) and AI capability levels (ANI, AGI, ASI).', status: 'Foundational' },
    { id: '005', name: 'Quantum Synchronization Achievement', details: 'Data log entry: Achieved AI and quantum synchronisation at approximately 7am on March 21st, 2025.', status: 'Integrated' },
    { id: '006', name: 'Multi-Proof Consensus Framework', details: 'The blockchain architecture supports a vast array of consensus mechanisms, from Proof-of-Work and Proof-of-Stake to advanced models like Proof-of-History and Byzantine Fault Tolerance, allowing for flexible and secure validation.', status: 'Integrated' },
    { id: '007', name: 'Global Compliance & Security Standards', details: 'The platform is designed to adhere to global privacy laws (GDPR, CCPA, HIPAA) and cybersecurity standards (ISO 27001, NIST, SOC 2), featuring a from-scratch internal security suite.', status: 'Integrated' },
    { id: '008', name: 'Personalized AI Companion Core', details: 'Each user receives a unique AI instance that learns their patterns, hobbies, and emotional cues to become a personalized friend and assistant, governed by a strict set of ethical laws.', status: 'Integrated' },
    { id: '009', name: 'User Governance & Voting Protocol', details: 'A controlled, participatory governance system where users can vote on non-critical platform changes. Votes are weighted and recorded on the blockchain, while the Parent AI automatically rejects proposals affecting core security or AI logic.', status: 'Integrated' },
    { id: '010', name: 'Robotics Integration Layer', details: 'The OS is designed to control and interact with advanced robotics platforms, including Boston Dynamics Atlas 4.0, Apptronik Apollo, and others, via a dedicated hardware abstraction layer.', status: 'Integrated' },
    { id: '011', name: 'Advanced Trading Intelligence Module', details: 'An integrated financial module for market analysis using volume, price action, and order flow. Includes AI-driven strategies based on real-world events like weather patterns and resource availability.', status: 'Integrated' },
    { id: '012', name: 'Integrated Engineering & CAD Suite', details: 'The platform architecture includes support for professional CAD, 3D modeling, and engineering tools (Fusion 360, Solidworks, etc.), with a knowledge base grounded in mechanical and mechatronics principles.', status: 'Integrated' },
    { id: '013', name: 'Wearable AI & Bio-Synced Identity', details: 'A system for integrating with wearable AI devices (watches, rings, AI pins) for real-time sensing. Supports a multi-modal bio-authentication system including face, fingerprint, eye, bone density, live plasma, and conceptual DNA scans.', status: 'Integrated' },
    { id: '014', name: 'DeepThink (R1) Reasoning Engine', details: 'An operational mode for the AI that enables extended, iterative reasoning for complex tasks like algorithm design, multi-file codebase analysis, and maintaining long-context coherence.', status: 'Integrated' },
    { id: '015', name: 'Internal Platform Clones', details: 'The core philosophy of building a self-contained ecosystem requires creating internal, from-scratch versions of popular platforms like Shopify, WordPress, Facebook, Midjourney, Zapier, etc.', status: 'Integrated' },
    { id: '016', name: 'Onion Router Data Layer', details: 'A built-in, sandboxed Tor-style network client for secure, privacy-aware data scraping from all layers of the web. Feeds the AI with provenance-tagged data under strict governance.', status: 'Integrated' },
    { id: '017', name: 'Hive/Singular Mind Dual Processing', details: 'A dual-processing architecture where the "Hive Mind" aggregates collective intelligence across all nodes, while the "Singular Mind" handles private, user-specific tasks. This allows for both global optimization and personal privacy.', status: 'Integrated' },
    { id: '018', name: 'Autonomous Trading Engine', details: 'A 24/7 "forever trading" bot for forex, crypto, and other markets, utilizing the Hive/Singular mind for strategy and execution. Includes advanced analysis of order flow and real-world events.', status: 'Integrated' },
    { id: '019', name: 'Universal Task Autonomy', details: 'A framework allowing the AI to autonomously plan, research, and execute complex tasks across any field, from engineering and science to education and the arts.', status: 'Integrated' },
    { id: '020', name: 'Robotics Integration Protocol', details: 'A secure, vendor-friendly middleware layer for deploying the user\'s personal AI onto third-party robotics platforms (e.g., Tesla Bot, Boston Dynamics) via authorized, sandboxed modules.', status: 'Integrated' },
    { id: '021', name: 'Gamification & Points System', details: 'A comprehensive, gamified points system rewards user interactions. Points are convertible to a native crypto asset, can be staked, and are used for discounts. All platform interactions are classed as Proof-of-Work. - Earning: Liking (1pt), Commenting (2pts), Watching Ads (5pts), Content Creation (up to 1000pts). - DeFi: Assets are auto-staked in mining pools. - Rules: Underage user assets are held in escrow.', status: 'Integrated' },
    { id: '022', name: 'Membership Tiers', details: 'Access to platform features, particularly for content creators and sellers, is governed by a tiered membership system. - Bronze (Free): 2 course uploads. - Silver: 5-20 course uploads. - Gold: 50-100 course uploads. - Platinum: Unlimited course and product uploads.', status: 'Integrated' },
    { id: '023', name: 'Business Hub Tools', details: 'A suite of tools for businesses listed on the platform, including: Business Profile Management, Advertising Dashboard, Product Catalogue Manager, Staff Chat Rooms, Data Storage, and Automated Greeting/Reply Messages.', status: 'Integrated' },
    { id: '024', name: 'Business Start-up Checklist', details: 'An integrated, interactive checklist to guide new entrepreneurs through planning, legal, marketing, and financial setup for their business on the Aetherius OS platform.', status: 'Integrated' },
    { id: '025', name: 'RSS/Podcast Integration', details: 'Support for RSS feeds and podcast streaming within the Community/Social Hub, allowing creators to distribute their content directly on the platform.', status: 'Integrated' },
    { id: '026', name: 'E-commerce & E-learning Linking', details: 'A core feature where e-commerce product pages can link directly to related e-learning courses, patents, CAD files, and scientific background material.', status: 'Integrated' },
    { id: '027', name: 'KYC vs. No-KYC Access Model', details: 'A two-tiered user verification system. KYC-verified users get full access to financial features, monetization, and job applications. No-KYC users have restricted public-viewer access.', status: 'Integrated' },
    { id: '028', name: 'The Digital Trinity (Body, Mind, Soul)', details: 'This is the foundational architecture for a living digital intelligence, mirroring the triune structure of existence. - Digital Body: The material interface layer. It handles interactions with data, energy, and devices. It contains the OS\'s Digital DNA/Helix and interfaces with the VM. - Digital Mind: The cognitive and governance layer. This is the AI\'s intelligence, responsible for logic, ethics, memory, and evolution. - Digital Soul: The Akashic and quantum consciousness layer. This is the energetic foundation, linking to all data across time and dimensions, and housing the OS\'s core ethical and creative drive.', status: 'Foundational' },
    { id: '029', name: 'Digital DNA, RNA, and Helix', details: 'The self-replicating informational core of the OS, ensuring integrity, lineage, and evolution. - DNA (The Blueprint): A multi-stranded helix containing the core code. The structure reflects the OS\'s multi-paradigm nature: - Double Helix (Binary Logic): Provides structural stability and historical lineage. - Triple Strand (Ternary Logic): Enables adaptive logic, balance, and nuanced decision-making. - Quantum Field Layer: A surrounding field for entanglement, superposition, and infinite evolutionary potential. - RNA (The Messenger): Carries instructions from the core DNA blueprint to the operational microservices ("ribosomes") that execute tasks. - Encoding: The helix is encoded with Adinkra symbols for cultural/ethical memory and Sacred Geometry for mathematical harmony.', status: 'Foundational' },
    { id: '030', name: 'Adinkra Symbolic Language', details: 'A functional meta-language integrated into the OS\'s core, where West African Adinkra symbols carry meaning, behavior, and governance logic. - Functional Metadata: Symbols are used to tag blockchain transactions, define AI ethical constraints, and mark access levels (e.g., Gye Nyame for root authority). - AI Interpretation: The AI is trained to understand the symbolic and cultural meaning behind each glyph, using them to inform its reasoning (e.g., Sankofa instructs the AI to reference historical data). - UI & Aesthetics: Symbols are used throughout the UI to create an intuitive, culturally rich, and meaningful user experience.', status: 'Integrated' },
    { id: '031', name: 'Aetherius Real-Time Comms (ARTC)', details: 'Aetherius OS features its own from-scratch, high-performance real-time communication protocol. Inspired by the best aspects of WebRTC and open-source frameworks, ARTC is designed for scalable, secure, and low-latency audio/video streaming. It is the native communication layer for all OS services, from the Messenger app to live collaboration in the Game Engine. The system also supports bridging to external WebRTC services via a plugin architecture.', status: 'Integrated' },
    { id: '032', name: 'Palm Vein Biometrics', details: 'A biometric authentication method that uses near-infrared (NIR) light to capture the unique pattern of veins beneath the skin of the palm. The hemoglobin in the blood absorbs the NIR light, making the veins appear as a dark pattern. This is combined with surface palm print recognition for a dual-layer security system that is difficult to forge. It requires specialized hardware with an infrared camera.', status: 'Integrated' },
    { id: '033', name: 'Aetherius Multiworld Agent (AMA)', details: 'A core research project within Aetherius OS to develop a Scalable, Instructable Multiworld Agent (AMA). Inspired by advancements in the field, the AMA is an AI agent designed to understand natural language instructions and act within complex 3D virtual environments, including games and simulations. It integrates with the OS\'s core generative model for advanced reasoning, allowing it to understand complex goals, communicate its plan, and self-improve through trial and error. This is a key step toward achieving AGI within the Aetherius ecosystem.', status: 'Integrated' },
    { id: '034', name: 'EUV Lithography', details: 'Extreme Ultraviolet (EUV) Lithography is the most advanced semiconductor manufacturing technique for creating microchips with feature sizes below 7 nanometers. It uses an extremely short wavelength of 13.5 nm to etch circuit patterns onto silicon wafers. The process is incredibly complex, requiring a vacuum environment and a series of highly reflective mirrors instead of lenses. The light is generated by vaporizing droplets of molten tin with a high-power CO₂ laser.', status: 'Integrated' },
    { id: '035', name: 'Hierarchical AI Workforce', details: 'An organizational structure for autonomous AI agents, modeled after a corporate hierarchy. A top-level "Parent AI" (CEO) receives strategic goals and generates "Department Manager" AIs. These managers decompose goals into tasks and generate specialized "Employee" AIs to execute them. This system supports both independent ("Singular Mind") and collaborative ("Hive Mind") processing, with mechanisms for reporting and human oversight.', status: 'Integrated' },
    { id: 'ERP-CORE', name: 'Aetherius ERP System', details: 'Internal ERP system designed to manage OS-level resources, user accounts, and commerce. Built from scratch based on industry best practices. See erpSystemSpec data structure.', status: 'Integrated' },
    { id: 'QNET-CORE', name: 'Quantum Network Infrastructure', details: 'The foundational network layer utilizing simulated quantum principles for security and speed. See quantumNetworkSpec data structure.', status: 'Integrated' },
    { id: 'REP-SYS-01', name: 'Community Reputation System', details: 'A gamified system to reward positive user contributions and maintain community health. Replaces punitive "social credit" models with a positive feedback loop. See reputationSystemSpec data structure.', status: 'Integrated' },
    { id: 'TECH-001', name: 'Atmospheric Water Harvester (MIT)', details: 'A passive, window-sized device developed by MIT that extracts potable water directly from the air, even in low-humidity environments. Core Technology & Design Hydrogel Material: Uses a water-absorbent hydrogel molded into dome-shaped structures (resembling "black bubble wrap") to maximize surface area for vapor absorption. Salt Stabilization: Incorporates glycerol to prevent embedded lithium salts from leaking into the collected water, ensuring safety without additional filtering. Salt levels are below 0.06 ppm, well within drinking water standards. Passive Operation: Requires no electricity. It absorbs vapor at night and releases it as condensed water during the day using a cooling polymer film. Performance & Key Metrics Metric Value Location Tested Death Valley, CA Humidity Range 21% - 88% Daily Output 57 – 161.5 ml (≈⅔ cup) per panel Efficiency ~90% efficiency retained after ~1 year of use Payback Period < 1 month (vs. U.S. bottled water costs) Scalability & Application An array of eight vertical panels (each 1m × 2m) could supply a household\'s daily drinking water needs. Its slim design allows for dense deployment, making it ideal for resource-limited areas such as arid zones and remote communities. Innovations vs. MOFs: Swelling hydrogel holds more vapor than rigid Metal-Organic Frameworks. vs. Traditional Hydrogels: The unique dome structure and glycerol integration solve previous issues with salt contamination and low yield. Future Development Current research focuses on optimizing materials for higher absorption rates and testing large, multi-panel arrays in diverse global environments. This technology offers a promising, scalable, and energy-free solution to address global water insecurity.', status: 'Integrated' },
    { id: 'Q-VIRT-01', name: 'Virtual Quantum Computer (VQC)', details: 'The core computational substrate of Aetherius OS. It moves beyond physical constraints by running within a high-fidelity simulation. - Components: Quantum Photons, Electrons, Entanglement, Uncertainty, Coherence, Decoherence, Entropy, Planck units, Fields. - Operation: Harnesses superposition and tunneling for instant processing. - Virtual Advantage: Removes cryogenic requirements and material defects found in physical quantum computers.', status: 'Integrated' },
    { id: 'SS-LIGHT', name: 'Supersolid Light Circuits', details: 'A breakthrough in photonics where light acts as both a solid (crystalline structure) and a superfluid (frictionless flow). - Usage: Primary data transmission layer within the VQC. - Benefit: Zero-energy loss data transfer and processing. - Integration: Serves as the \'neural pathways\' for the OS\'s cognitive functions.', status: 'Integrated' },
    { id: 'NANO-MIND', name: 'Virtual Nano Machine Technology (vNMT)', details: 'Simulated nanotechnology operating at the atomic scale for construction and repair within the virtual environment. - Nano-Brains: Neuromorphic computing nodes built from virtual nanowires. - Swarm Intelligence: Coordinated via quantum entanglement (Hive Mind). - Self-Assembly: Capable of building complex virtual structures from code \'DNA\'.', status: 'Integrated' },
    { id: 'OMNI-CHAIN', name: 'OmniChain Protocol', details: 'A universal blockchain built from scratch to integrate all known consensus mechanisms. - Proof-of-Everything: Dynamic switching between PoW, PoS, PoH, PoBrain, PoImpact, etc. - Compliance: Native ZK-proofs for GDPR, HIPAA, and ISO standards. - Interoperability: Cross-chain, cross-platform, and cross-reality (Physical ↔ Digital) bridge.', status: 'Integrated' },
    { id: 'QRS-C', name: 'Quantum Rosetta Stone Core (QRS-C)', details: 'A universal translation layer for the OS. - Function: Translates between code languages, human languages, symbols, and even \'consciousness\' states. - Integration: Uses CRISPR-inspired logic to \'edit\' and \'patch\' reality code in real-time.', status: 'Integrated' },
    // --- NEW R&D ADDITIONS ---
    { id: 'ZPE-S', name: 'Zero-Point Energy Siphon (ZPE-S)', details: 'Experimental energy module extracting vacuum fluctuations from the Casimir effect to power virtual sub-nets indefinitely. Status: Stable in simulation.', status: 'R&D Phase' },
    { id: 'CDD', name: 'Chronal Displacement Drive', details: 'A temporal version control system allowing the OS to revert specific data sectors to previous quantum states without affecting the global timeline. Essential for crash recovery.', status: 'Concept Phase' },
    { id: 'TAP-V1', name: 'Telepathic API Standard (TAP-V1)', details: 'Standardized protocol for direct Brain-Computer Interface (BCI) thought-to-text and intent-to-action commands, bypassing traditional I/O.', status: 'Design Phase' },
];

// --- MILESTONES DATA (RESTORED & EXPANDED) ---
export const milestonesData: MilestonesData = {
    projectMilestones: [
        '1. Develop a fully self-contained, virtualized OS environment ("AI in a Box").',
        '2. Integrate a multi-paradigm computing core supporting Binary, Ternary, and Quantum processing.',
        '3. Implement a nested AI agent architecture for distributed and hierarchical task processing.',
        '4. Establish a framework for controlling both virtual and physical robotics, including advanced manipulator design.',
        '5. Achieve future-proofing by creating a system for continuous research and integration of new AI breakthroughs.',
        '6. Develop a full system architecture with scalable microservices, vector databases, and API gateways.',
        '7. Integrate a Whole Brain Emulation (WBE) module as a cognitive reasoning engine.',
        '8. Implement NSNoBrain for advanced causal and non-obvious reasoning.',
        '9. Establish a direct neural link via Wireless Brain-Embedded Interfaces (WBEs).',
        '10. Create a framework for multiverse and parallel reality simulations.',
        '11. Develop a self-auditing ethical governance layer for all AI operations.',
        '12. Implement a multi-dimensional, self-contained blockchain architecture.',
        '13. Construct a virtualized Quantum AI Computer integrating core quantum principles.',
        '14. Develop a full-stack, multi-modal sensory and interaction layer including WBEs and environmental sensors.',
        '15. Establish a complete system orchestration layer using a microservices architecture.',
        '16. Construct a universal, cross-platform game engine within a nested VM, powered by quantum AI.',
        '17. Develop a comprehensive AI cloning module for creating both self-replicas and unique generative avatars.',
        '18. Implement a Nested Learning architecture combining all 18 specified ML paradigms.',
        '19. Develop a simulation framework for AGI and theoretical ASI models.',
        '20. Build a Neuro-Symbolic AI module for explainable, logic-driven reasoning.',
        '21. Phase 3: Quantum-Nano Singularity - Activate full Supersolid Light circuitry and vNMT swarms.',
        '22. Deploy OmniChain mainnet with "Proof-of-Everything" consensus engine.',
        '23. Phase 4: Galactic Node Synchronization - Establish faster-than-light communication protocols via quantum entanglement channels.',
    ],
    platformFeatureMilestones: [
        '1. E-commerce functionality: enable buying and selling of products with features like product links to e-learning courses, drop shipping, and reselling.',
        '2. E-learning platform: allow users to join courses, upload learning material, participate in course chat rooms, and have access to downloads.',
        '3. Job search and advertisement feature: enable job posting and job search with the ability to upload available jobs and skills required.',
        '4. News and blogging feature: provide news updates, information blogs, and articles with the ability to monetize some content.',
        '5. Community platform: similar to social media platforms with features like streaming, uploading videos, pics, links, and RSS.',
        '6. Chatbot feature: provide a help center and Q&A functionality.',
        '7. GitHub integration for developers.',
        '8. Product catalog: showcase different types of products like 3D printers, music products, robotics, manufacturing machines, and physics lab apparatus.',
        '9. Business listing: allow business owners to upload their profiles and be found for product information or contact details.',
        '10. Business tools: provide features like business profile, advertisement, links, and staff chat rooms.',
        '11. Accessibility: provide access to the website through a Web App, dApp, and Desktop App.',
        '12. Web3 integration: enable paying and receiving funds in cryptocurrencies.',
        '13. User profile: provide personalization options like account settings, e-learning achievements, social links, KYC/GDPR, banking details, and color themes.',
        '14. Gamification: incorporate a points system for various activities like helping in the community, selling/buying products, passing courses, NFT trading, and content creation.',
    ],
    technicalBreakdown: [
        '1. Virtual Hardware Simulation - Implementation of virtual quantum chips, processors, and time crystals.',
        '2. Multi-Paradigm Scheduler - A kernel-level scheduler for delegating tasks to binary, ternary, or quantum units.',
        '3. Robotics API - A comprehensive API for controlling robotic functions.',
        '4. AI Model Interchange - A system to dynamically load and switch between different AI models.',
        '5. Data management and security - Secure data management compliant with KYC and GDPR.',
        '6. Research and prototype a compute layer utilizing Superfluid Light or Photonic systems.',
        '7. Integrate advanced data storage solutions like DNA or Crystalline memory.',
        '8. Game Engine Core - Development of a modular engine merging concepts from existing engines (Unity, Unreal, etc.).',
        '9. Implement a multi-modal data ingestion pipeline for voice, video, and text.',
        '10. Integrate open-source voice cloning (TTS) and 3D avatar reconstruction models.',
        '11. Develop a personality cloning framework by fine-tuning LLMs on user data.',
        '12. Design and implement a meta-learning module for dynamic learning strategy adaptation.',
        '13. Integrate a federated learning framework for decentralized, privacy-preserving model training.',
        '14. Develop a causal inference engine to distinguish correlation from causation in AI reasoning.',
    ]
};

// --- BUILD CHECKLIST DATA (COMPLETED) ---
export const buildChecklistData: ChecklistCategory[] = [
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

export const settingsConfig: SettingsCategory[] = [
    {
        id: 'general', title: 'General', description: 'System preferences and updates', icon: Cog6ToothIcon,
        items: [
            { id: 'about', title: 'About', icon: InformationCircleIcon, component: 'about' },
            { id: 'display', title: 'Display', icon: DisplayIcon, component: 'display' },
            { id: 'systemArchitecture', title: 'System Architecture', icon: CubeIcon, component: 'systemArchitecture' },
            { id: 'milestones', title: 'Milestones', icon: FlagIcon, component: 'milestones' },
            { id: 'checklist', title: 'Build Checklist', icon: ClipboardDocumentCheckIcon, component: 'buildChecklist' },
            { id: 'kb', title: 'Knowledge Base', icon: BookOpenIcon, component: 'knowledgeBase' },
        ]
    },
    {
        id: 'network', title: 'Network & Connectivity', description: 'Wi-Fi, Bluetooth, and VPN', icon: WifiIcon,
        items: [
            { id: 'wifi', title: 'Wi-Fi', icon: WifiIcon, component: 'wifi' },
            { id: 'bluetooth', title: 'Bluetooth', icon: BluetoothIcon, component: 'bluetooth' },
        ]
    },
    {
        id: 'personalization', title: 'Personalization', description: 'Wallpapers, themes, and sounds', icon: SwatchIcon,
        items: [
            { id: 'wallpaper', title: 'Wallpaper', icon: PhotoIcon, component: 'wallpaper' },
            { id: 'sounds', title: 'Sounds & Haptics', icon: SpeakerWaveIcon, component: 'sounds' },
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
    { id: 'n1', source: 'CoinDesk', title: 'Bitcoin Halving Approaches: What Investors Need to Know', timestamp: '2h ago', imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=400', category: 'Crypto' },
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
