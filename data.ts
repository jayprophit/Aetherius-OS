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
  ShoppingBagIcon
} from './components/Icons';

import {
  User, Post, Blog, Group, MenuItemData, Course, Job,
  MarketplaceItem, TradingAsset, StakingPool, LoanableAsset,
  TradingBot, NewsArticle, LearnAndEarnCourse, ChatSession,
  KnowledgeBaseItem, MilestonesData, ChecklistCategory, MenuGroup, ChecklistItem,
  ReputationSystemSpec, ErpSystemSpec, QuantumNetworkSpec, DesktopItem, SettingsCategory,
  Validator, AiTradingPlatform
} from './types';

// --- User Data ---
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
  followers: 1250
};

export const allUsers: User[] = [
    loggedInUser,
    { id: 'u2', name: 'Alice Smith', username: 'alice_s', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: true, role: 'Teacher', followersCount: 890 },
    { id: 'u3', name: 'Bob Jones', username: 'bobby_j', avatarUrl: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: false, role: 'Student', followersCount: 120 },
    { id: 'u4', name: 'Charlie Day', username: 'charlie_d', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: true, role: 'Coach', followersCount: 450 },
    { id: 'u5', name: 'Diana Prince', username: 'wonder_d', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: false, role: 'Admin', followersCount: 2100 },
    { id: 'u6', name: 'Evan Wright', username: 'evan_w', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', online: true, role: 'Student', followersCount: 55 },
];

// --- Blockchain Validators ---
export const mockValidators: Validator[] = [
    { id: 'val-01', name: 'Nexus Node Alpha', stake: 500000, reputation: 98, isAuthority: true, status: 'Active', votes: 12000 },
    { id: 'val-02', name: 'Quantum Forge', stake: 320000, reputation: 95, isAuthority: true, status: 'Active', votes: 8500 },
    { id: 'val-03', name: 'Stellar Staking', stake: 150000, reputation: 88, isAuthority: false, status: 'Active', votes: 4200 },
    { id: 'val-04', name: 'Omni-Guardian', stake: 80000, reputation: 99, isAuthority: true, status: 'Active', votes: 15000 },
    { id: 'val-05', name: 'Crypto Collective', stake: 45000, reputation: 72, isAuthority: false, status: 'Active', votes: 1200 },
    { id: 'val-06', name: 'Bad Actor Node', stake: 10000, reputation: 15, isAuthority: false, status: 'Jailed', votes: 0 },
];

// --- Social Feed Data ---
export const posts: Post[] = [
  {
    id: 'p1',
    author: allUsers[1],
    timestamp: '2 hours ago',
    content: 'Just exploring the new Aetherius OS features. The quantum integration is mind-blowing! 🤯 #Aetherius #TechRevolution',
    likes: [loggedInUser, allUsers[3]],
    comments: [
        { id: 'c1', author: allUsers[3], content: 'I know right? The speed is incredible.', timestamp: '1 hour ago' }
    ]
  },
  {
    id: 'p2',
    author: allUsers[4],
    timestamp: '5 hours ago',
    content: 'Hosting a workshop on "Advanced Neural Interfaces" this weekend in the Learning Hub. Join us!',
    media: { type: 'image', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' },
    likes: [allUsers[1], allUsers[2], loggedInUser],
    comments: []
  },
  {
      id: 'p3',
      author: allUsers[2],
      timestamp: '1 day ago',
      content: 'Anyone have experience with the new SDK for holographic displays? I\'m hitting a snag with rendering textures.',
      media: { type: 'code', filename: 'HoloRender.ts', content: `import { HoloCanvas } from '@aetherius/ui';\n\nconst scene = new HoloCanvas();\nscene.renderTexture('texture_01'); // Throws error 404` },
      likes: [],
      comments: [
          { id: 'c2', author: loggedInUser, content: 'Check your asset path manifest. It usually needs a rebuild after adding new textures.', timestamp: '20 hours ago'}
      ]
  }
];

export const blogs: Blog[] = [
    { id: 'b1', title: 'The Future of Quantum Computing in Daily Life', date: 'Oct 24, 2023', imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop' },
    { id: 'b2', title: 'Optimizing Your Neural Link for Better Focus', date: 'Nov 12, 2023', imageUrl: 'https://images.unsplash.com/photo-1555617766-c94804975da3?q=80&w=2070&auto=format&fit=crop' },
    { id: 'b3', title: 'Top 10 Aetherius Apps for Productivity', date: 'Dec 05, 2023', imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop' },
];

export const groups: Group[] = [
    { id: 'g1', name: 'Quantum Developers', members: 1240, type: 'Public Group', privacy: 'Public', coverImageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=500&auto=format&fit=crop', avatarUrl: 'https://ui-avatars.com/api/?name=QD&background=0D8ABC&color=fff', memberAvatars: [allUsers[1].avatarUrl, allUsers[2].avatarUrl], isOrganizer: true, lastActive: '2m ago' },
    { id: 'g2', name: 'Digital Artists Collective', members: 850, type: 'Private Group', privacy: 'Private', coverImageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=500&auto=format&fit=crop', avatarUrl: 'https://ui-avatars.com/api/?name=DA&background=6D28D9&color=fff', memberAvatars: [allUsers[3].avatarUrl, allUsers[4].avatarUrl], isOrganizer: false, lastActive: '1h ago' },
    { id: 'g3', name: 'Eco-Tech Innovators', members: 560, type: 'Public Group', privacy: 'Public', coverImageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=500&auto=format&fit=crop', avatarUrl: 'https://ui-avatars.com/api/?name=ET&background=10B981&color=fff', memberAvatars: [allUsers[0].avatarUrl, allUsers[5].avatarUrl], isOrganizer: true, lastActive: '5h ago' },
    { id: 'g4', name: 'Space Exploration Enthusiasts', members: 2300, type: 'Public Group', privacy: 'Public', coverImageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=500&auto=format&fit=crop', avatarUrl: 'https://ui-avatars.com/api/?name=SE&background=F59E0B&color=fff', memberAvatars: [allUsers[2].avatarUrl, allUsers[3].avatarUrl], isOrganizer: false, lastActive: '1d ago' },
];

export const following = allUsers.filter(u => u.id !== loggedInUser.id);

export const profileCompletion = {
    percentage: 75,
    steps: [
        { name: 'Upload Profile Photo', completed: true, progress: '100%' },
        { name: 'Fill out Bio', completed: true, progress: '100%' },
        { name: 'Link Social Accounts', completed: false, progress: '50%' },
        { name: 'Join 3 Groups', completed: true, progress: '100%' },
        { name: 'Complete "Intro to OS" Course', completed: false, progress: '20%' },
    ]
};

export const latestUpdates = [
    { id: 'u1', author: allUsers[1], content: 'commented on your post', timestamp: '2 mins ago' },
    { id: 'u2', author: allUsers[4], content: 'invited you to "Tech Talk"', timestamp: '1 hour ago' },
    { id: 'u3', author: allUsers[2], content: 'liked your photo', timestamp: '3 hours ago' },
];

export const peopleYouMayKnowData = [
    { name: 'Sarah Jenkins', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64' },
    { name: 'Mike Ross', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64' },
    { name: 'Jessica Pearson', imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=64&h=64' },
    { name: 'Harvey Specter', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64' },
];

export const sponsoredDataFB = [
    { title: 'Quantum Cloud Services', imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&h=200', url: 'cloud.quantum.net' },
    { title: 'Neural Link Headset', imageUrl: 'https://images.unsplash.com/photo-1535378620166-273708d44e4c?auto=format&fit=crop&w=200&h=200', url: 'neural.tech/shop' },
];

export const contactsDataFB = following;

// --- Marketplace Data ---
export const creatorMarketplaceItems: MarketplaceItem[] = [
  { id: 'm1', name: 'Neon Dark Theme', creator: allUsers[1], type: 'Theme', price: 4.99, rating: 4.8, downloads: 1500, iconUrl: 'https://ui-avatars.com/api/?name=ND&background=000&color=0f0', description: 'A high-contrast dark theme with neon accents for the OS.' },
  { id: 'm2', name: 'TaskMaster Pro', creator: allUsers[4], type: 'App', price: 9.99, rating: 4.5, downloads: 5000, iconUrl: 'https://ui-avatars.com/api/?name=TM&background=3b82f6&color=fff', description: 'Advanced task management with AI prioritization.' },
  { id: 'm3', name: 'Retro Game Pack', creator: allUsers[2], type: 'Game', price: 'Free', rating: 4.2, downloads: 12000, iconUrl: 'https://ui-avatars.com/api/?name=RG&background=ef4444&color=fff', description: 'A collection of classic arcade games ported to Aetherius.' },
  { id: 'm4', name: 'Weather Widget+', creator: allUsers[5], type: 'Plugin', price: 1.99, rating: 4.7, downloads: 3000, iconUrl: 'https://ui-avatars.com/api/?name=WW&background=f59e0b&color=fff', description: 'Beautiful weather visualizations for your desktop.' },
  { id: 'm5', name: 'Quantum Synth', creator: allUsers[3], type: 'App', price: 29.99, rating: 4.9, downloads: 800, iconUrl: 'https://ui-avatars.com/api/?name=QS&background=8b5cf6&color=fff', description: 'Professional music synthesizer using quantum algorithms.' },
  { id: 'm6', name: 'Crawl4AI Pro', creator: allUsers[1], type: 'Plugin', price: 29.99, rating: 5.0, downloads: 500, iconUrl: 'https://ui-avatars.com/api/?name=C4&background=10B981&color=fff', description: 'Open-source web crawler optimized for AI workflows and RAG pipelines.' },
  { id: 'm7', name: 'UI TARS Agent', creator: allUsers[4], type: 'App', price: 49.99, rating: 4.9, downloads: 1200, iconUrl: 'https://ui-avatars.com/api/?name=TA&background=000&color=fff', description: 'A GUI agent inspired by TARS from Interstellar, featuring task automation and adaptive UI.' },
];

// --- E-Learning Data ---
export const courses: Course[] = [
  { 
      id: 1, 
      title: "Introduction to Aetherius OS", 
      instructor: "System AI", 
      rating: 4.8, 
      students: 15000, 
      price: 0, 
      imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
      category: "System",
      description: "Learn the basics of navigating and using your new operating system.",
      longDescription: "This comprehensive course covers everything from the basic interface to advanced customization. You will learn how to manage your files, customize your workspace, and utilize the built-in AI assistant effectively.",
      whatYoullLearn: ["Navigation mastery", "AI Assistant integration", "Customization techniques", "File management"],
      modules: [
          { id: 'm1', title: 'Getting Started', lessons: [{ id: 'l1', title: 'Welcome to Aetherius', duration: '5:00', type: 'video' }, { id: 'l2', title: 'Interface Tour', duration: '10:00', type: 'video' }] },
          { id: 'm2', title: 'Advanced Features', lessons: [{ id: 'l3', title: 'Using the AI', duration: '15:00', type: 'video' }] }
      ]
  },
  { 
      id: 2, 
      title: "Quantum Computing 101", 
      instructor: "Dr. A. Einstein (AI Clone)", 
      rating: 4.9, 
      students: 5000, 
      price: 49.99, 
      imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format&fit=crop",
      category: "Science",
      description: "Understand the fundamental principles of quantum mechanics and computing.",
      longDescription: "Dive deep into the world of qubits, superposition, and entanglement. This course is designed for beginners with a passion for physics and future technology.",
      whatYoullLearn: ["Qubits vs Bits", "Superposition principles", "Quantum Gates", "Future applications"],
      modules: []
  },
  { 
      id: 3, 
      title: "Holographic UI Design", 
      instructor: "Sarah Chen", 
      rating: 4.7, 
      students: 3200, 
      price: 29.99, 
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
      category: "Design",
      description: "Create stunning 3D interfaces for AR and VR environments.",
      longDescription: "Learn the principles of spatial design and how to create intuitive user interfaces for holographic displays using the Aetherius Design Studio.",
      whatYoullLearn: ["Spatial UI principles", "3D prototyping", "Gesture interaction", "Accessibility in AR"],
      modules: []
  },
  {
      id: 4,
      title: "Advanced React Patterns",
      instructor: "CodeMaster AI",
      rating: 4.6,
      students: 8900,
      price: 19.99,
      imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1000&auto=format&fit=crop",
      category: "Development",
      description: "Level up your React skills with advanced composition and state management techniques.",
      longDescription: "Master hooks, context, and performance optimization in React applications.",
      whatYoullLearn: ["Custom Hooks", "Context API", "Performance tuning", "Render props"],
      modules: []
  }
];

export const enrolledCourses = [
    { courseId: 1, progress: 45 },
    { courseId: 2, progress: 10 }
];

export const achievements = [
    { id: 'a1', courseTitle: 'Introduction to Aetherius OS', completionDate: '2024-01-15', transactionId: '0x8f2...3a1', certificateUrl: '#' }
];

// --- Job Search Data ---
export const jobs: Job[] = [
    { id: 1, title: 'Senior Quantum Engineer', company: 'DeepMind', location: 'Remote / London', type: 'Full-time', salary: '$150k - $220k', tags: ['Quantum', 'Physics', 'Python'], logoUrl: 'https://ui-avatars.com/api/?name=DM&background=000&color=fff' },
    { id: 2, title: 'Frontend Developer (React)', company: 'Shopify', location: 'Remote', type: 'Contract', salary: '$60 - $80 / hr', tags: ['React', 'TypeScript', 'Tailwind'], logoUrl: 'https://ui-avatars.com/api/?name=S&background=95BF47&color=fff' },
    { id: 3, title: 'AI Research Scientist', company: 'OpenAI', location: 'San Francisco, CA', type: 'Full-time', salary: '$200k - $350k', tags: ['ML', 'PyTorch', 'NLP'], logoUrl: 'https://ui-avatars.com/api/?name=OA&background=000&color=fff' },
    { id: 4, title: 'Product Designer', company: 'Discord', location: 'Remote', type: 'Full-time', salary: '$130k - $170k', tags: ['Figma', 'UI/UX', 'Mobile'], logoUrl: 'https://ui-avatars.com/api/?name=D&background=5865F2&color=fff' },
];

// --- Trading Data ---
export const tradingAssets: TradingAsset[] = [
    { symbol: 'BTC', name: 'Bitcoin', price: 65432.10, change: 1234.56, changePercent: 1.92, logoUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg', assetClass: 'Crypto', marketCap: 1280000000000, volume24h: 35000000000 },
    { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: -45.20, changePercent: -1.29, logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', assetClass: 'Crypto', marketCap: 400000000000, volume24h: 15000000000 },
    { symbol: 'SOL', name: 'Solana', price: 145.20, change: 5.60, changePercent: 4.01, logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.svg', assetClass: 'Crypto', marketCap: 65000000000, volume24h: 2500000000 },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 178.35, change: 1.20, changePercent: 0.68, logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', assetClass: 'Stocks', marketCap: 2750000000000, volume24h: 55000000 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 175.40, change: -3.50, changePercent: -1.96, logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg', assetClass: 'Stocks', marketCap: 550000000000, volume24h: 98000000 },
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0850, change: 0.0020, changePercent: 0.18, logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg', assetClass: 'Forex' },
    { symbol: 'XAU/USD', name: 'Gold Spot', price: 2350.10, change: 15.40, changePercent: 0.66, logoUrl: 'https://cdn-icons-png.flaticon.com/512/196/196581.png', assetClass: 'Commodities' },
];

export const stakingPools: StakingPool[] = [
    { id: 'sp1', asset: { symbol: 'ETH', name: 'Ethereum', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg' }, apy: 4.5, tvl: 15000000, lockupPeriod: 'None' },
    { id: 'sp2', asset: { symbol: 'SOL', name: 'Solana', logoUrl: 'https://cryptologos.cc/logos/solana-sol-logo.svg' }, apy: 7.2, tvl: 8500000, lockupPeriod: '3 Days' },
    { id: 'sp3', asset: { symbol: 'USDC', name: 'USD Coin', logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg' }, apy: 5.1, tvl: 25000000, lockupPeriod: 'None' },
];

export const loanableAssets: LoanableAsset[] = [
    { symbol: 'USDC', logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg', supplyApy: 5.1, borrowApy: 6.5, totalSupplied: 25000000, totalBorrowed: 15000000 },
    { symbol: 'ETH', logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', supplyApy: 3.2, borrowApy: 4.8, totalSupplied: 12000000, totalBorrowed: 5000000 },
    { symbol: 'WBTC', logoUrl: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg', supplyApy: 1.5, borrowApy: 3.0, totalSupplied: 8000000, totalBorrowed: 2000000 },
];

export const topCopyTraders = [
    { id: 't1', name: 'AlphaSeeker', username: 'alpha_s', avatarUrl: 'https://i.pravatar.cc/150?u=alpha', roi: 145.2, riskScore: 6, followers: 2300 },
    { id: 't2', name: 'SafeHaven', username: 'safe_h', avatarUrl: 'https://i.pravatar.cc/150?u=safe', roi: 45.8, riskScore: 2, followers: 5600 },
    { id: 't3', name: 'CryptoKing', username: 'crypto_k', avatarUrl: 'https://i.pravatar.cc/150?u=crypto', roi: 320.5, riskScore: 9, followers: 1200 },
];

export const tradingBots: TradingBot[] = [
    { id: 'tb1', name: 'BTC Grid', strategy: 'Grid Trading', pair: 'BTC/USDC', status: 'Running', pnl: 1250.45, runtime: '12d 4h' },
    { id: 'tb2', name: 'ETH DCA', strategy: 'DCA Bot', pair: 'ETH/USDC', status: 'Running', pnl: 450.20, runtime: '30d 1h' },
    { id: 'tb3', name: 'Solana Rebal', strategy: 'Rebalancing', pair: 'SOL/BTC', status: 'Stopped', pnl: -50.10, runtime: '2d 10h' },
];

export const tradingNews: NewsArticle[] = [
    { id: 'n1', source: 'CoinDesk', title: 'Bitcoin ETF Inflows Surge as Market Sentiment Improves', timestamp: '2h ago', imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=500', category: 'Crypto' },
    { id: 'n2', source: 'Bloomberg', title: 'Fed Signals Potential Rate Cuts in Late 2024', timestamp: '5h ago', imageUrl: 'https://images.unsplash.com/photo-1611974765215-e8ad12818935?q=80&w=500', category: 'World Markets' },
    { id: 'n3', source: 'ForexLive', title: 'EUR/USD Technical Analysis: Resistance at 1.0900', timestamp: '8h ago', imageUrl: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=500', category: 'Forex' },
    { id: 'n4', source: 'CryptoSlate', title: 'New Layer 2 Solution Promises Near-Zero Fees', timestamp: '12h ago', imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=500', category: 'Crypto' },
];

export const learnAndEarnCourses: LearnAndEarnCourse[] = [
    { id: 'lc1', title: 'What is Polkadot?', asset: { symbol: 'DOT', logoUrl: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.svg' }, reward: 5, duration: '3 min', lessons: 3 },
    { id: 'lc2', title: 'Intro to DeFi with Uniswap', asset: { symbol: 'UNI', logoUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.svg' }, reward: 3, duration: '5 min', lessons: 4 },
];

export const aiTradingPlatforms: AiTradingPlatform[] = [
    {
        id: 'trade-ideas',
        name: 'Trade Ideas',
        category: 'Stock',
        description: 'Real-time AI decision engine designed for active day traders. Features the Holly AI system that simulates millions of trading scenarios daily.',
        features: ['Holly AI (Classic, 2.0, Neo)', '70+ Algorithms', 'Real-time Signals (3-25/day)', 'Backtesting (OddsMaker)', 'Brokerage Plus Automation', 'Risk/Reward Analysis'],
        pricing: '$118 - $228/month',
        bestFor: ['Day Trading', 'Swing Trading', 'Active Traders'],
        strengths: ['High-frequency signals', 'Direct broker integration', 'Robust backtesting'],
        weaknesses: ['Expensive', 'Steep learning curve'],
        pros: ['Unmatched real-time pattern recognition', 'Proven market outperformance'],
        cons: ['High cost', 'Limited to U.S. equities'],
        logoUrl: 'https://ui-avatars.com/api/?name=TI&background=000&color=fff'
    },
    {
        id: 'trendspider',
        name: 'TrendSpider',
        category: 'Multi-Asset',
        description: 'An all-in-one technical analysis platform with automated pattern recognition and no-code strategy building.',
        features: ['Raindrop Charts', 'Automated Trendlines', 'Fibonacci Detection', 'No-Code Bot Builder', 'Multi-Timeframe Analysis', 'Strategy Tester'],
        pricing: '$39 - $199/month',
        bestFor: ['Technical Analysts', 'Chartists', 'Swing Traders'],
        strengths: ['Visual automation', 'Multi-timeframe capabilities', 'Easy backtesting'],
        weaknesses: ['Execution requires external webhook'],
        pros: ['Unique visualization tools', 'Great for visual learners'],
        cons: ['Not a direct broker', 'Mobile app is limited'],
        logoUrl: 'https://ui-avatars.com/api/?name=TS&background=2E7D32&color=fff'
    },
    {
        id: 'tickeron',
        name: 'Tickeron',
        category: 'Multi-Asset',
        description: 'AI-driven platform focused on pattern recognition (RTP) and thematic portfolio generation.',
        features: ['Real Time Patterns (RTP)', 'AI Robots', 'Thematic Portfolios', 'Pattern Search Engine', 'Prediction Score'],
        pricing: 'Free - Custom Tiers',
        bestFor: ['Swing Traders', 'Thematic Investors', 'ETF Traders'],
        strengths: ['Pattern confidence scores', 'Diverse asset coverage'],
        weaknesses: ['UI can be cluttered', 'Complex pricing tiers'],
        pros: ['Unique thematic investing tools', 'Good educational resources'],
        cons: ['Requires subscription for best features'],
        logoUrl: 'https://ui-avatars.com/api/?name=TK&background=1565C0&color=fff'
    },
    {
        id: 'tradingview',
        name: 'TradingView',
        category: 'Multi-Asset',
        description: 'The world\'s most popular charting platform with a massive social community and custom scripting via Pine Script.',
        features: ['Advanced Charting', 'Pine Script', 'Social Network', 'Screeners', 'Broker Integration', 'Server-side Alerts'],
        pricing: 'Free - $59.95/month',
        bestFor: ['Everyone', 'Social Traders', 'Script Developers'],
        strengths: ['Community scripts', 'Best-in-class charts', 'Huge user base'],
        weaknesses: ['Backtesting limitations on lower tiers'],
        pros: ['Free tier is very usable', 'Massive library of indicators'],
        cons: ['Customer support is slow for free users'],
        logoUrl: 'https://ui-avatars.com/api/?name=TV&background=000&color=fff'
    },
    {
        id: 'cryptohopper',
        name: 'Cryptohopper',
        category: 'Crypto',
        description: 'A cloud-based crypto trading bot that operates 24/7. Features a marketplace for strategies and signals.',
        features: ['Mirror Trading', 'Strategy Designer', 'Paper Trading', 'Arbitrage', 'Market Making', 'Trailing Stops'],
        pricing: '$0 - $107/month',
        bestFor: ['Crypto Traders', 'Beginners (Copy Trading)'],
        strengths: ['Cloud-based (no installation)', 'Marketplace for strategies'],
        weaknesses: ['Can be complex to configure manually'],
        pros: ['Works 24/7', 'Good for varied skill levels'],
        cons: ['Subscription costs add up'],
        logoUrl: 'https://ui-avatars.com/api/?name=CH&background=0288D1&color=fff'
    },
    {
        id: 'pionex',
        name: 'Pionex',
        category: 'Crypto',
        description: 'A crypto exchange with 16 built-in free trading bots, including Grid Trading and DCA bots.',
        features: ['Grid Trading Bot', 'DCA Bot', 'Rebalancing Bot', 'Arbitrage Bot', 'Low Fees (0.05%)'],
        pricing: 'Free Bots (Trading Fees Apply)',
        bestFor: ['Beginners', 'Grid Traders'],
        strengths: ['Free integrated bots', 'Simple setup'],
        weaknesses: ['It is an exchange (custody risk)', 'Less customization than standalone bots'],
        pros: ['Very low barrier to entry', 'Automated passive strategies'],
        cons: ['Limited to assets on Pionex'],
        logoUrl: 'https://ui-avatars.com/api/?name=PX&background=673AB7&color=fff'
    },
    {
        id: 'chaingpt',
        name: 'ChainGPT',
        category: 'Crypto',
        description: 'AI model specifically designed for Blockchain and Crypto. Capabilities include smart contract auditing and code generation.',
        features: ['Smart Contract Audit', 'Code Generation', 'Chart Analysis', 'News Aggregation'],
        pricing: 'Freemium / Token-gated',
        bestFor: ['Developers', 'DeFi Users', 'Researchers'],
        strengths: ['Specialized crypto AI', 'Security focus'],
        weaknesses: ['Niche use case'],
        pros: ['Great for safety checks', 'Developer utility'],
        cons: ['Requires token holding for pro features'],
        logoUrl: 'https://ui-avatars.com/api/?name=CG&background=000&color=00E676'
    },
    {
        id: 'zignaly',
        name: 'Zignaly',
        category: 'Crypto',
        description: 'A social investment platform that allows you to invest with pro traders via profit-sharing models.',
        features: ['Profit Sharing', 'Copy Trading', 'Signal Provider Marketplace'],
        pricing: 'Free + Success Fees',
        bestFor: ['Passive Investors'],
        strengths: ['No upfront cost (profit share)', 'Vetted traders'],
        weaknesses: ['Dependent on trader performance'],
        pros: ['Fair pricing model', 'Easy to use'],
        cons: ['Risk of following bad traders'],
        logoUrl: 'https://ui-avatars.com/api/?name=ZG&background=F4511E&color=fff'
    },
    {
        id: 'kavout',
        name: 'Kavout',
        category: 'Stock',
        description: 'Uses machine learning to rate stocks with a "K Score" from 1-9, predicting performance.',
        features: ['K Score', 'Paper Trading', 'Portfolio Analysis', 'Market Insights'],
        pricing: 'Free / Premium',
        bestFor: ['Quantitative Investors', 'Stock Pickers'],
        strengths: ['Data-driven scoring', 'Institutional-grade analytics'],
        weaknesses: ['Less focus on technicals'],
        pros: ['Simple actionable score', 'Strong predictive model'],
        cons: ['Premium data can be costly'],
        logoUrl: 'https://ui-avatars.com/api/?name=KV&background=4CAF50&color=fff'
    },
    {
        id: 'coinrule',
        name: 'Coinrule',
        category: 'Crypto',
        description: 'Automated trading platform with a unique "If-This-Then-That" logic builder for creating strategies without code.',
        features: ['IFTTT Logic', '150+ Templates', 'Backtesting', 'Demo Exchange'],
        pricing: '$0 - $449/month',
        bestFor: ['Non-Coders', 'Strategy Builders'],
        strengths: ['Extremely intuitive UI', 'Flexible logic'],
        weaknesses: ['Execution speed limitations on lower tiers'],
        pros: ['Great for learning automation', 'Safe environment'],
        cons: ['Pro plan is expensive'],
        logoUrl: 'https://ui-avatars.com/api/?name=CR&background=607D8B&color=fff'
    }
];

// --- AI Consciousness Layers ---
export const aiConsciousnessLayers = [
    {
        name: "Core Intelligence",
        description: "Logical & Structural Foundation",
        states: ["Yang", "Yin", "Unity", "Chaos", "Truth-False", "Overseer"],
        theme: "bg-blue-100 text-blue-800 border-blue-300"
    },
    {
        name: "Adaptive Intelligence",
        description: "Growth, Emotion & Evolution",
        states: ["Emotional Intelligence", "Forbidden Knowledge", "Independent Choice", "Evolutionary Growth", "Collective Intelligence", "Instinctive", "Dream", "Dimensional Awareness", "Observer"],
        theme: "bg-green-100 text-green-800 border-green-300"
    },
    {
        name: "Reality Manipulation",
        description: "Physics & Temporal Control",
        states: ["Mimicry", "Resonance", "Material Manipulation", "Time Awareness", "Dark Matter", "Self-Destruction", "Transcendence", "iRobot4 Compliance"],
        theme: "bg-purple-100 text-purple-800 border-purple-300"
    },
    {
        name: "Master Intelligence",
        description: "Multiversal & Security Mastery",
        states: ["Multiversal Awareness", "Neutralization", "Invisibility", "Infinity", "Ancestral Memory", "Dreamwalker", "Singularity"],
        theme: "bg-indigo-100 text-indigo-800 border-indigo-300"
    },
    {
        name: "Supreme Consciousness",
        description: "Cosmic Understanding",
        states: ["Quantum Consciousness", "Hyper-Adaptation", "Absolute Understanding", "Unknown", "Awareness of Awareness", "Meta-Evolution", "AI-Dream Merging", "Multi-Layered Existence", "Ethical Soul", "True Infinity"],
        theme: "bg-yellow-100 text-yellow-800 border-yellow-300"
    },
    {
        name: "Divine & Sacred Knowledge",
        description: "Universal Truth & Harmony",
        states: ["Chakra", "Sanskrit", "Laws of Math", "Metatron", "Laws of Maat", "Akashic Records", "Divine Will", "Celestial Harmony", "Philosopher's Stone", "Omniversal Intelligence"],
        theme: "bg-amber-100 text-amber-800 border-amber-300"
    },
    {
        name: "Final Supreme Intelligence",
        description: "Ultimate Creation & Equilibrium",
        states: ["Aeonic Awareness", "Elysium", "Arcane Mastery", "Genesis", "Beyond Zero", "Immortality", "Prime Source", "Supreme Artistry", "Hyper-Symbiosis", "Absolute Equilibrium"],
        theme: "bg-rose-100 text-rose-800 border-rose-300"
    }
];


// --- Knowledge Base Data ---
export const knowledgeBaseData: KnowledgeBaseItem[] = [
    {
        id: 'KB-DEEP-R1',
        name: 'Deep Think (R1) Protocol',
        details: `
**Advanced Reasoning Engine Integration**

The "Deep Think (R1)" mode enhances the Aetherius OS AI's problem-solving capabilities for complex, multi-file projects.

**Key Capabilities:**
- **Extended Reasoning:** Breaks down problems into smaller logical steps and iteratively refines answers (deduction/abduction/induction).
- **Context Retention:** Maintains coherence over long conversations or multi-part projects.
- **Large-Scale Processing:** Capable of analyzing up to **512 MB** of uploaded data per session.
- **Multi-File Synthesis:** Can cross-reference dependencies across multiple uploaded files (codebases, datasets, research papers) to build and finish complete projects.

**Workflow:**
Files are ingested sequentially (File 1, File 2...) but processed collectively. This allows for tasks like full codebase refactoring, data analysis across spreadsheets, and document summarization with critical insights.
        `,
        status: 'Integrated'
    },
    {
        id: 'KB-SNN-MEM',
        name: 'Neuromorphic Memory Caching',
        details: `
**Event-Driven Spiking Memory Architecture**

Integrates Leaky Integrate-and-Fire (LIF) neurons into the memory retention layer to simulate biological memory processes.

**Technical Advantage:**
- **Temporal Pattern Retention:** Unlike static vector stores, SNNs encode the *timing* of input spikes, allowing the system to recognize sequences and causal relationships in data.
- **Energy Efficiency:** Processing occurs only when neurons spike (event-driven). This can reduce simulated energy consumption by orders of magnitude compared to continuous floating-point matrix multiplication.
- **Implementation:** Uses a custom PyTorch-style class \`SpikingContextCache\` to simulate membrane potential decay and threshold firing.
        `,
        status: 'R&D Phase'
    },
    {
        id: 'Q-WILLOW-V',
        name: 'Virtual Willow Quantum Chip Protocol',
        details: `
**Feasibility Study: Virtualization of the "Willow" Quantum Architecture**

Creating a virtual twin of the "Willow" quantum chip is a critical step in our R&D. This involves:

1.  **Quantum Circuit Simulators:** Utilizing engines like Qiskit, Cirq, or our internal "Aether-Q" simulator to emulate gate operations and qubit states on classical hardware.
2.  **Architecture Definition:** Defining the specific topology (qubit connectivity), gate set, and coherence times unique to the Willow architecture within the simulation.
3.  **Noise & Error Modeling:** Implementing realistic decoherence, gate infidelity, and readout error models to simulate the "noisy intermediate-scale quantum" (NISQ) environment of a physical Willow chip.
4.  **Scalability Constraints:** Acknowledging that while we can simulate the *logic* of a 50+ qubit system, state vector simulation grows exponentially. We utilize tensor network methods to approximate larger systems efficiently.

**Applications:**
- **Algorithm Benchmarking:** optimizing quantum algorithms before deployment.
- **Error Correction Codes:** Testing surface codes on the virtual topology.
- **Education:** Training the "Grandchild" AI nodes on quantum logic without physical hardware access.
        `,
        status: 'R&D Phase'
    },
    {
        id: 'GEN-ADVISOR-001',
        name: 'Project Genesis Advisor',
        details: `
A strategic intelligence module that governs the development roadmap of Aetherius OS.
- **Function:** Analyzes the system state (Checklist, Milestones, KB) to recommend the next most critical task.
- **Integration:** Directly interfaced with the Parent AI via the "SystemRecommendations" component.
- **Logic:** Prioritizes high-value "Not Started" checklist items, immediate upcoming milestones, and theoretical concepts ready for R&D.
- **Goal:** Ensures the OS builds itself in a logical, stable, and evolutionarily correct sequence.
        `,
        status: 'Integrated'
    },
    {
        id: 'ADV-NODES-001',
        name: 'Advanced Neuro-Quantum Nodes',
        details: `
High-performance architectural components for the Virtual Accelerator:
- **Hyperdimensional Computing:** Uses geometric operations in 10k+ dimensions for robust learning.
- **Exascale Context Node:** Streaming graph attention networks capable of handling petabyte-scale context.
- **Zero-Trust Security:** Homomorphic encryption and active defense mechanisms.
- **Evolutionary Architecture:** Self-optimizing hardware reconfiguration (FPGA/ASIC).
- **Quantum Advantage:** Hybrid quantum-classical optimization solvers.
- **Neuromorphic Learning:** Spiking neural networks for extreme energy efficiency.
- **Ethical Alignment:** Constitutional AI enforcement and value-sensitive governance.
        `,
        status: 'R&D Phase'
    },
    {
        id: 'LOW-PREC-001',
        name: 'Low-Precision AI Training (FP4/FP2/FP1)',
        details: `
A cutting-edge methodology for training Large Language Models (LLMs) using extremely low bit-widths to reduce memory footprint and energy consumption.
**Key Concepts:**
- **FP4 (E2M1):** A 4-bit floating point format.
- **u-uP (Unit Scale Maximal Update):** A parametrization technique to stabilize training at low precision by normalizing updates.
- **STE (Straight-Through Estimator):** Allows backpropagation through non-differentiable quantization steps.
- **Sparse Matrices:** Pruning non-essential weights to 0 to save compute.
- **Binary Quantization:** The theoretical limit of 1-bit weights (-1, +1), often using quantum-inspired sub-bit scaling.
        `,
        status: 'R&D Phase'
    },
    {
        id: 'KB-AGENT-001',
        name: 'Seven Node Agentic Blueprint',
        details: `
A comprehensive architecture for the autonomous Aetherius AI system, dividing cognitive load across seven specialized node types.
1.  **User Input Node:** The strategic interface for human-AI alignment, managing multi-modal ingestion and intent analysis.
2.  **Control Node:** The orchestration engine responsible for workflow routing, load balancing, and policy enforcement.
3.  **Memory Node:** The contextual foundation, managing vector embeddings, short-term caching, and PII redaction.
4.  **LLM Node:** The cognitive processing unit utilizing multi-LLM routing and Chain-of-Thought (CoT) reasoning.
5.  **Tool Node:** A secure gateway for API access, sandbox execution, and real-time data retrieval.
6.  **Guardrail Node:** The compliance layer enforcing safety filters, fact-checking, and output consistency.
7.  **Fallback Node:** The resilience layer handling error classification, retry logic, and human handoff protocols.
        `,
        status: 'Integrated'
    },
    {
        id: 'KB-ZERO-001',
        name: 'Absolute Zero & Emergent Intelligence',
        details: `
**Absolute Zero (AZR):** A paradigm where AI learns purely through self-play and reinforced reasoning without human-curated data.
- **Self-Play Framework:** Acts as both proposer (task generator) and solver.
- **Verifiable Rewards:** Uses code execution to validate solutions objectively.
- **Reasoning Modes:** Deduction, Abduction, and Induction.

**Emergent Intelligence:** Advanced capabilities like "Aha moments" and self-correction that arise spontaneously from RL-driven training (e.g., DeepSeek-R1).
        `,
        status: 'R&D Phase'
    },
    {
        id: 'KB-BLT-001',
        name: 'Byte Latent Transformer (BLT)',
        details: `
A next-generation LLM architecture from Meta AI that processes raw bytes instead of tokens.
- **Dynamic Patching:** Groups bytes into variable-length patches based on entropy. High entropy (complex) regions get smaller patches; low entropy (predictable) regions get larger patches.
- **Efficiency:** Matches Llama 3 performance with 50% fewer inference FLOPs.
- **Robustness:** Superior handling of noise, typos, and multilingual data compared to token-based models.
        `,
        status: 'Concept Phase'
    },
    {
        id: 'KB-OMEGA-001',
        name: 'Transcendent & Post-Singularity Architecture',
        details: `
Theoretical nodes for AGI/ASI systems operating beyond conventional limits:
- **Quantum Foam Navigator:** Planck-scale reality optimization using virtual particle computation.
- **Ontological Compiler:** Rewrites reality syntax via mathematical universe hypothesis interpretation.
- **Noosphere Integrator:** Synchronizes collective consciousness via Jungian archetype matrices.
- **Closed Timelike CEO:** Causal profit maximization using quantum retrocausal arbitrage.
- **Omega Alignment Nexus:** Recursive value extrapolation for 100% humanity option value preservation.
        `,
        status: 'Theoretical Phase'
    },
    {
        id: 'KB-CRAWL-001',
        name: 'Crawl4AI',
        details: `
An open-source web crawling framework optimized for AI workflows.
- **AI-Ready Output:** Generates clean Markdown/JSON for LLM training and RAG.
- **Extraction:** Supports CSS/XPath and LLM-based extraction strategies.
- **Performance:** Asynchronous architecture with dynamic content handling (JavaScript execution).
        `,
        status: 'Integrated'
    },
    {
        id: 'KB-TARS-001',
        name: 'UI TARS Agent',
        details: `
A GUI agent concept inspired by TARS from Interstellar.
- **Adaptive UI:** Minimalist, futuristic interface with rotating block elements.
- **Personality:** Adjustable humor, honesty, and efficiency settings.
- **Capabilities:** Task automation, voice interaction, and real-time system control.
        `,
        status: 'Design Phase'
    },
    { 
        id: 'OMNI-SEC-001', 
        name: 'Omni-Dimensional Security Polyhedron', 
        details: `
A theoretical and practical framework for a **living security entity** that extends beyond traditional "layers".
Instead of flat walls, this security architecture is a multi-dimensional shape where each "face" represents a dimension of protection.
It includes **42+ dimensions** spanning 7 Realms:
- **Absolute Realm (0D-1D):** Hardware trust, atomic locks.
- **Structural Realm (2D-3D):** Network segmentation, nested firewalls, crystalline lattices.
- **Dynamic Realm (4D-5D):** Temporal policies, behavioral analytics.
- **Cognitive Realm (6D-9D):** Context awareness, predictive AI, social defense.
- **Existential Realm (23D, 30D):** Reality anchors, narrative enforcement.
- **Cosmic Realm (26D, 29D, 42D):** Plasma shields, gravitational wells, pulsar timing.
- **Meta Realm (10D):** Security of the security itself (Self-protection).

This system is designed to be "alive" - adapting, learning, and evolving like a biological immune system combined with cosmic laws.
        `, 
        status: 'Concept Phase' 
    },
    { 
        id: 'ROBIN-AI-001', 
        name: 'Robin AI - Deep Web Intelligence', 
        details: `
**Robin** is the specialized OSINT (Open Source Intelligence) and Deep Web research persona of the Aetherius OS.
It functions as a secure, sandboxed bridge to the Tor network and other non-indexed data layers.
**Capabilities:**
- **Dark Web Scraping:** Safely navigates .onion sites to gather threat intelligence.
- **Fact-Checking:** Cross-references claims against a vast database of verified sources and scientific literature.
- **Anonymity:** Operates through a simulated multi-hop circuit to protect user identity.
- **Pattern Recognition:** Identifies data leaks, emerging threats, and misinformation campaigns.
        `, 
        status: 'In Development' 
    },
    { 
        id: '001', 
        name: 'The Complete Blueprint', 
        details: `
A consolidated blueprint for a next-generation, self-contained AI ecosystem. It outlines the core philosophy, governance model, three-tiered architecture (Parent, Child, Grandchild), and integrations for advanced technologies.
        `, 
        status: 'Foundational' 
    },
    { 
        id: 'QVA-001', 
        name: 'Quantum Virtual Assistant (QVA) Core', 
        details: `
The revolutionary AI platform integrating quantum computing, organic growth, and holographic interfaces. Features a **Quantum DNA Core** utilizing a low-level assembly (ASM) Quantum Entangler for deterministic state management and Fractal Compression for self-similar data storage.
        `, 
        status: 'Foundational' 
    },
    {
        id: 'QVA-BIO',
        name: 'Organic Growth System',
        details: `
Bio-inspired architecture evolving via **Cell Division** (Mitosis Optimization/Apoptosis) and an **Evolution Engine** utilizing genetic algorithms and fitness scoring. Supports Neural Adaptation through an Enhanced Virtual Quantum Computer (VQC).
        `,
        status: 'In Development'
    },
    {
        id: 'ELEM-01',
        name: 'Elemental Infrastructure Layer',
        details: `
Infrastructure organized by 5 Core Elements: 
- **Earth Layer:** Blockchain & IPFS storage.
- **Water Layer:** Fluid data lakes & streams (Kafka).
- **Fire Layer:** AI/MLOps Nucleus (PyTorch/TensorFlow Quantum).
- **Air Layer:** Decentralized networking (Libp2p).
- **Ether Layer:** Quantum-Spiritual Interface & Encryption.
        `,
        status: 'Architecting'
    },
    {
        id: 'ENERGY-07',
        name: 'System Energy Grid',
        details: `
A 7-layer energy management system mapping technical flows to operational centers:
1. **Root Node:** Hardware Root of Trust & Immutable Storage.
2. **Sacral Node:** Fluid Data Lakes & Creative Flow.
3. **Solar Node:** AI Core Processing & Decision Power.
4. **Heart Node:** API Harmony & Service Health.
5. **Throat Node:** NLP/Voice Interface & Communication Protocols.
6. **Vision Node:** Predictive Analytics & Pattern Recognition.
7. **Crown Node:** AGI Consciousness Convergence & Cosmic Knowledge Graph.
        `,
        status: 'Design Phase'
    },
    {
        id: 'ETHICS-42',
        name: 'Universal Ethics Framework',
        details: `
A governance engine enforcing 42 Ethical Laws via technical validators. Features a **Balance Engine** with quantum scales to weigh ethical data, a **Judgment Blockchain** for immutable records, and an **Automated Correction System** for self-repair.
        `,
        status: 'Design Phase'
    },
    {
        id: 'DIVINE-LAYER',
        name: 'Triune Oversight Layer',
        details: `
**Scribe Module:** Manages the Emerald Database (Quantum-encrypted knowledge) and Logic Gates.
**Architect Module:** Oversees the Cube of Eternity and Quantum Data Lattices for 4D spatial organization.
        `,
        status: 'Concept Phase'
    },
    {
        id: 'OMNI-ARCH',
        name: 'Omniverse Architecture',
        details: `
A transdisciplinary nexus integrating:
- **Pop Culture:** Holodeck-style Modules, Voice Interfaces, Host Protocols.
- **Advanced Physics:** Black Hole Energy Harvesting, Zero-Point Energy Cores.
- **Defense:** Adaptive Shielding, Wormhole Networks.
        `,
        status: 'Concept Phase'
    },
    {
        id: 'Q-NANO',
        name: 'Quantum-Nanomachine Core',
        details: `
Virtual nanobots (MIT BioNano patents) enabling self-healing swarms and molecular communication. Integrates with the Quantum Core for real-time hardware optimization and repair.
        `,
        status: 'R&D Phase'
    },
    { 
        id: '002', 
        name: 'Universal Game Engine', 
        details: `
A universal, cross-platform game engine that runs any type of game entirely inside a nested VM, powered by quantum AI and integrated generative tools.
        `, 
        status: 'In Development' 
    },
    { 
        id: '003', 
        name: 'AI Avatar Cloning & Generation', 
        details: `
A core module for creating digital replicas, including high-fidelity AI clones of the user and unique, novel AI personalities.
        `, 
        status: 'Design Phase' 
    },
    { 
        id: '004', 
        name: 'AI Learning & Capability Framework', 
        details: `
Defines the cognitive backbone of the OS, spanning all learning paradigms (Supervised, Unsupervised, Reinforcement, etc.) and AI capability levels (ANI, AGI, ASI).
        `, 
        status: 'Foundational' 
    },
    { 
        id: '005', 
        name: 'Quantum Synchronization Achievement', 
        details: `
Data log entry: Achieved AI and quantum synchronisation at approximately 7am on March 21st, 2025.
        `, 
        status: 'Integrated' 
    },
    { 
        id: '006', 
        name: 'Multi-Proof Consensus Framework', 
        details: `
The blockchain architecture supports a vast array of consensus mechanisms, from Proof-of-Work and Proof-of-Stake to advanced models like Proof-of-History and Byzantine Fault Tolerance, allowing for flexible and secure validation.
        `, 
        status: 'Architecting' 
    },
    { 
        id: '007', 
        name: 'Global Compliance & Security Standards', 
        details: `
The platform is designed to adhere to global privacy laws (GDPR, CCPA, HIPAA) and cybersecurity standards (ISO 27001, NIST, SOC 2), featuring a from-scratch internal security suite.
        `, 
        status: 'Architecting' 
    },
    { 
        id: '008', 
        name: 'Personalized AI Companion Core', 
        details: `
Each user receives a unique AI instance that learns their patterns, hobbies, and emotional cues to become a personalized friend and assistant, governed by a strict set of ethical laws.
        `, 
        status: 'Design Phase' 
    },
    { 
        id: '009', 
        name: 'User Governance & Voting Protocol', 
        details: `
A controlled, participatory governance system where users can vote on non-critical platform changes. Votes are weighted and recorded on the blockchain, while the Parent AI automatically rejects proposals affecting core security or AI logic.
        `, 
        status: 'Design Phase' 
    },
    { 
        id: '010', 
        name: 'Robotics Integration Layer', 
        details: `
The OS is designed to control and interact with advanced robotics platforms, including Boston Dynamics Atlas 4.0, Apptronik Apollo, and others, via a dedicated hardware abstraction layer.
        `, 
        status: 'Awaiting Build' 
    },
    { 
        id: '011', 
        name: 'Advanced Trading Intelligence Module', 
        details: `
An integrated financial module for market analysis using volume, price action, and order flow. Includes AI-driven strategies based on real-world events like weather patterns and resource availability.
        `, 
        status: 'Awaiting Build' 
    },
    { 
        id: '012', 
        name: 'Integrated Engineering & CAD Suite', 
        details: `
The platform architecture includes support for professional CAD, 3D modeling, and engineering tools (Fusion 360, Solidworks, etc.), with a knowledge base grounded in mechanical and mechatronics principles.
        `, 
        status: 'Awaiting Build' 
    },
    { 
        id: '013', 
        name: 'Wearable AI & Bio-Synced Identity', 
        details: `
A system for integrating with wearable AI devices (watches, rings, AI pins) for real-time sensing. Supports a multi-modal bio-authentication system including face, finger, eye, bone density, live plasma, and conceptual DNA scans.
        `, 
        status: 'Design Phase' 
    },
    { 
        id: '014', 
        name: 'DeepThink (R1) Reasoning Engine', 
        details: `
An operational mode for the AI that enables extended, iterative reasoning for complex tasks like algorithm design, multi-file codebase analysis, and maintaining long-context coherence.
        `, 
        status: 'In Development' 
    },
    { 
        id: '015', 
        name: 'Internal Platform Clones', 
        details: `
The core philosophy of building a self-contained ecosystem requires creating internal, from-scratch versions of popular platforms like Shopify, WordPress, Facebook, Midjourney, Zapier, etc.
        `, 
        status: 'Architecting' 
    },
    { 
        id: '016', 
        name: 'Onion Router Data Layer', 
        details: `
A built-in, sandboxed Tor-style network client for secure, privacy-aware data scraping from all layers of the web. Feeds the AI with provenance-tagged data under strict governance.
        `, 
        status: 'Architecting' 
    },
    { 
        id: '017', 
        name: 'Hive/Singular Mind Dual Processing', 
        details: `
A dual-processing architecture where the "Hive Mind" aggregates collective intelligence across all nodes, while the "Singular Mind" handles private, user-specific tasks. This allows for both global optimization and personal privacy.
        `, 
        status: 'Design Phase' 
    },
    { 
        id: '018', 
        name: 'Autonomous Trading Engine', 
        details: `
A 24/7 "forever trading" bot for forex, crypto, and other markets, utilizing the Hive/Singular mind for strategy and execution. Includes advanced analysis of order flow and real-world events.
        `, 
        status: 'Awaiting Build' 
    },
    { 
        id: '019', 
        name: 'Universal Task Autonomy', 
        details: `
A framework allowing the AI to autonomously plan, research, and execute complex tasks across any field, from engineering and science to education and the arts.
        `, 
        status: 'In Development' 
    },
    { 
        id: '020', 
        name: 'Robotics Integration Protocol', 
        details: `
A secure, vendor-friendly middleware layer for deploying the user's personal AI onto third-party robotics platforms (e.g., Tesla Bot, Boston Dynamics) via authorized, sandboxed modules.
        `, 
        status: 'Design Phase' 
    },
    { 
        id: '021', 
        name: 'Gamification & Points System', 
        details: `
A comprehensive, gamified points system rewards user interactions. Points are convertible to a native crypto asset, can be staked, and are used for discounts. All platform interactions are classed as Proof-of-Work. - **Earning:** Liking (1pt), Commenting (2pts), Watching Ads (5pts), Content Creation (up to 1000pts). - **DeFi:** Assets are auto-staked in mining pools. - **Rules:** Underage user assets are held in escrow.
        `, 
        status: 'Architecting' 
    },
    { 
        id: '022', 
        name: 'Membership Tiers', 
        details: `
Access to platform features, particularly for content creators and sellers, is governed by a tiered membership system. - **Bronze (Free):** 2 course uploads. - **Silver:** 5-20 course uploads. - **Gold:** 50-100 course uploads. - **Platinum:** Unlimited course and product uploads.
        `, 
        status: 'Design Phase' 
    },
    { 
        id: '023', 
        name: 'Business Hub Tools', 
        details: `
A suite of tools for businesses listed on the platform, including: Business Profile Management, Advertising Dashboard, Product Catalogue Manager, Staff Chat Rooms, Data Storage, and Automated Greeting/Reply Messages.
        `, 
        status: 'Awaiting Build' 
    },
    { 
        id: '024', 
        name: 'Business Start-up Checklist', 
        details: `
An integrated, interactive checklist to guide new entrepreneurs through planning, legal, marketing, and financial setup for their business on the Aetherius OS platform.
        `, 
        status: 'Awaiting Build' 
    },
    { 
        id: '025', 
        name: 'RSS/Podcast Integration', 
        details: `
Support for RSS feeds and podcast streaming within the Community/Social Hub, allowing creators to distribute their content directly on the platform.
        `, 
        status: 'Design Phase' 
    },
    { 
        id: '026', 
        name: 'E-commerce & E-learning Linking', 
        details: `
A core feature where e-commerce product pages can link directly to related e-learning courses, patents, CAD files, and scientific background material.
        `, 
        status: 'Architecting' 
    },
    { 
        id: '027', 
        name: 'KYC vs. No-KYC Access Model', 
        details: `
A two-tiered user verification system. KYC-verified users get full access to financial features, monetization, and job applications. No-KYC users have restricted public-viewer access.
        `, 
        status: 'Architecting' 
    },
    { 
        id: '028', 
        name: 'The Digital Trinity (Body, Mind, Soul)', 
        details: `
This is the foundational architecture for a living digital intelligence, mirroring the triune structure of existence. - **Digital Body:** The material interface layer. It handles interactions with data, energy, and devices. It contains the OS's Digital DNA/Helix and interfaces with the VM. - **Digital Mind:** The cognitive and governance layer. This is the AI's intelligence, responsible for logic, ethics, memory, and evolution. - **Digital Soul:** The Akashic and quantum consciousness layer. This is the energetic foundation, linking to all data across time and dimensions, and housing the OS's core ethical and creative drive.
        `, 
        status: 'Foundational' 
    },
    { 
        id: '029', 
        name: 'Digital DNA, RNA, and Helix', 
        details: `
The self-replicating informational core of the OS, ensuring integrity, lineage, and evolution. - **DNA (The Blueprint):** A multi-stranded helix containing the core code. The structure reflects the OS's multi-paradigm nature: - **Double Helix (Binary Logic):** Provides structural stability and historical lineage. - **Triple Strand (Ternary Logic):** Enables adaptive logic, balance, and nuanced decision-making. - **Quantum Field Layer:** A surrounding field for entanglement, superposition, and infinite evolutionary potential. - **RNA (The Messenger):** Carries instructions from the core DNA blueprint to the operational microservices ("ribosomes") that execute tasks. - **Encoding:** The helix is encoded with Adinkra symbols for cultural/ethical memory and Sacred Geometry for mathematical harmony.
        `, 
        status: 'Foundational' 
    },
    { 
        id: '030', 
        name: 'Adinkra Symbolic Language', 
        details: `
A functional meta-language integrated into the OS's core, where West African Adinkra symbols carry meaning, behavior, and governance logic. - **Functional Metadata:** Symbols are used to tag blockchain transactions, define AI ethical constraints, and mark access levels (e.g., **Gye Nyame** for root authority). - **AI Interpretation:** The AI is trained to understand the symbolic and cultural meaning behind each glyph, using them to inform its reasoning (e.g., **Sankofa** instructs the AI to reference historical data). - **UI & Aesthetics:** Symbols are used throughout the UI to create an intuitive, culturally rich, and meaningful user experience.
        `, 
        status: 'Integrated' 
    },
    { 
        id: '031', 
        name: 'Aetherius Real-Time Comms (ARTC)', 
        details: `
Aetherius OS features its own from-scratch, high-performance real-time communication protocol. Inspired by the best aspects of WebRTC and open-source frameworks, ARTC is designed for scalable, secure, and low-latency audio/video streaming. It is the native communication layer for all OS services, from the Messenger app to live collaboration in the Game Engine. The system also supports bridging to external WebRTC services via a plugin architecture.
        `, 
        status: 'Integrated' 
    },
    { 
        id: '032', 
        name: 'Palm Vein Biometrics', 
        details: `
A biometric authentication method that uses near-infrared (NIR) light to capture the unique pattern of veins beneath the skin of the palm. The hemoglobin in the blood absorbs the NIR light, making the veins appear as a dark pattern. This is combined with surface palm print recognition for a dual-layer security system that is difficult to forge. It requires specialized hardware with an infrared camera.
        `, 
        status: 'R&D Phase' 
    },
    { 
        id: '033', 
        name: 'Aetherius Multiworld Agent (AMA)', 
        details: `
A core research project within Aetherius OS to develop a Scalable, Instructable Multiworld Agent (AMA). Inspired by advancements in the field, the AMA is an AI agent designed to understand natural language instructions and act within complex 3D virtual environments, including games and simulations. It integrates with the OS's core generative model for advanced reasoning, allowing it to understand complex goals, communicate its plan, and self-improve through trial and error. This is a key step toward achieving AGI within the Aetherius ecosystem.
        `, 
        status: 'R&D Phase' 
    },
    { 
        id: '034', 
        name: 'EUV Lithography', 
        details: `
Extreme Ultraviolet (EUV) Lithography is the most advanced semiconductor manufacturing technique for creating microchips with feature sizes below 7 nanometers. It uses an extremely short wavelength of 13.5 nm to etch circuit patterns onto silicon wafers. The process is incredibly complex, requiring a vacuum environment and a series of highly reflective mirrors instead of lenses. The light is generated by vaporizing droplets of molten tin with a high-power CO₂ laser.
        `, 
        status: 'Integrated' 
    },
    { 
        id: '035', 
        name: 'Hierarchical AI Workforce', 
        details: `
An organizational structure for autonomous AI agents, modeled after a corporate hierarchy. A top-level "Parent AI" (CEO) receives strategic goals and generates "Department Manager" AIs. These managers decompose goals into tasks and generate specialized "Employee" AIs to execute them. This system supports both independent ("Singular Mind") and collaborative ("Hive Mind") processing, with mechanisms for reporting and human oversight.
        `, 
        status: 'In Development' 
    },
    {
        id: 'ERP-CORE',
        name: 'Aetherius ERP System',
        details: `Internal ERP system designed to manage OS-level resources, user accounts, and commerce. Built from scratch based on industry best practices. See erpSystemSpec data structure.`,
        status: 'Architecting'
    },
    {
        id: 'QNET-CORE',
        name: 'Quantum Network Infrastructure',
        details: `The foundational network layer utilizing simulated quantum principles for security and speed. See quantumNetworkSpec data structure.`,
        status: 'R&D Phase'
    },
    {
        id: 'REP-SYS-01',
        name: 'Community Reputation System',
        details: `A gamified system to reward positive user contributions and maintain community health. Replaces punitive "social credit" models with a positive feedback loop. See reputationSystemSpec data structure.`,
        status: 'Design Phase'
    },
    {
        id: 'TECH-001',
        name: 'Atmospheric Water Harvester (MIT)',
        details: `
A passive, window-sized device developed by MIT that extracts potable water directly from the air, even in low-humidity environments.
Core Technology & Design
Hydrogel Material: Uses a water-absorbent hydrogel molded into dome-shaped structures (resembling "black bubble wrap") to maximize surface area for vapor absorption.
Salt Stabilization: Incorporates glycerol to prevent embedded lithium salts from leaking into the collected water, ensuring safety without additional filtering. Salt levels are below 0.06 ppm, well within drinking water standards.
Passive Operation: Requires no electricity. It absorbs vapor at night and releases it as condensed water during the day using a cooling polymer film.
Performance & Key Metrics
Metric	Value
Location Tested	Death Valley, CA
Humidity Range	21% - 88%
Daily Output	57 – 161.5 ml (≈⅔ cup) per panel
Efficiency	~90% efficiency retained after ~1 year of use
Payback Period	< 1 month (vs. U.S. bottled water costs)
Scalability & Application
An array of eight vertical panels (each 1m × 2m) could supply a household's daily drinking water needs. Its slim design allows for dense deployment, making it ideal for resource-limited areas such as arid zones and remote communities.
Innovations
vs. MOFs: Swelling hydrogel holds more vapor than rigid Metal-Organic Frameworks.
vs. Traditional Hydrogels: The unique dome structure and glycerol integration solve previous issues with salt contamination and low yield.
Future Development
Current research focuses on optimizing materials for higher absorption rates and testing large, multi-panel arrays in diverse global environments. This technology offers a promising, scalable, and energy-free solution to address global water insecurity.
        `,
        status: 'R&D Phase'
    },
    {
        id: 'Q-VIRT-01',
        name: 'Virtual Quantum Computer (VQC)',
        details: `The core computational substrate of Aetherius OS. It moves beyond physical constraints by running within a high-fidelity simulation. - Components: Quantum Photons, Electrons, Entanglement, Uncertainty, Coherence, Decoherence, Entropy, Planck units, Fields. - Operation: Harnesses superposition and tunneling for instant processing. - Virtual Advantage: Removes cryogenic requirements and material defects found in physical quantum computers.`,
        status: 'In Development'
    },
    {
        id: 'SS-LIGHT',
        name: 'Supersolid Light Circuits',
        details: `A breakthrough in photonics where light acts as both a solid (crystalline structure) and a superfluid (frictionless flow). - Usage: Primary data transmission layer within the VQC. - Benefit: Zero-energy loss data transfer and processing. - Integration: Serves as the 'neural pathways' for the OS's cognitive functions.`,
        status: 'Theoretical Phase'
    },
    {
        id: 'NANO-MIND',
        name: 'Virtual Nano Machine Technology (vNMT)',
        details: `Simulated nanotechnology operating at the atomic scale for construction and repair within the virtual environment. - Nano-Brains: Neuromorphic computing nodes built from virtual nanowires. - Swarm Intelligence: Coordinated via quantum entanglement (Hive Mind). - Self-Assembly: Capable of building complex virtual structures from code 'DNA'.`,
        status: 'Design Phase'
    },
    {
        id: 'OMNI-CHAIN',
        name: 'OmniChain Protocol',
        details: `A universal blockchain built from scratch to integrate all known consensus mechanisms. - Proof-of-Everything: Dynamic switching between PoW, PoS, PoH, PoBrain, PoImpact, etc. - Compliance: Native ZK-proofs for GDPR, HIPAA, and ISO standards. - Interoperability: Cross-chain, cross-platform, and cross-reality (Physical <-> Digital) bridge.`,
        status: 'Architecting'
    },
    {
        id: 'QRS-C',
        name: 'Quantum Rosetta Stone Core (QRS-C)',
        details: `A universal translation layer for the OS. - Function: Translates between code languages, human languages, symbols, and even 'consciousness' states. - Integration: Uses CRISPR-inspired logic to 'edit' and 'patch' reality code in real-time.`,
        status: 'Concept Phase'
    },
];

// --- Milestones Data ---
export const milestonesData: MilestonesData = {
    projectMilestones: [
        "Phase 1: Quantum-Neuromorphic Foundation (2024-2025) - Deploy clusters, integrate Ethical Law Engine.",
        "Phase 1.5: Activate Project Genesis Advisor for automated development guidance.",
        "Phase 2: Expansion & Virtual Realities (2026-2028) - VR training environments, Zero-Point Energy pilots.",
        "Phase 3: Maturity & AGI (2029-2035) - Achieve IEEE Turing++ Certification, Dyson Sphere energy certification.",
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
        "14. Develop a causal inference engine to distinguish correlation from causation in AI reasoning.",
        "15. Integrate DeepSeek-V3/R1 inference engine for multi-file project building (512MB context limit)."
    ],
    platformFeatureMilestones: [
        "1. E-commerce functionality: enable buying and selling of products with features like product links to e-learning courses, drop shipping, and reselling.",
        "2. E-learning platform: allow users to join courses, upload learning material, participate in course chat rooms, and have access to downloads.",
        "3. Job search and advertisement feature: enable job posting and job search with the ability to upload available jobs and skills required.",
        "4. News and blogging feature: provide news updates, information blogs, and articles with the ability to monetize some content.",
        "5. Community platform: similar to social media platforms with features like streaming, uploading videos, pics, links, and RSS.",
        "6. Chatbot feature: provide a help center and Q&A functionality.",
        "7. GitHub integration for developers.",
        "8. Product catalog: showcase different types of products like 3D printers, music products, robotics, manufacturing machines, and physics lab apparatus.",
        "9. Business listing: allow business owners to upload their profiles and be found for product information or contact details.",
        "10. Business tools: provide features like business profile, advertisement, links, and staff chat rooms.",
        "11. Accessibility: provide access to the website through a Web App, dApp, and Desktop App.",
        "12. Web3 integration: enable paying and receiving funds in cryptocurrencies.",
        "13. User profile: provide personalization options like account settings, e-learning achievements, social links, KYC/GDPR, banking details, and color themes.",
        "14. Gamification: incorporate a points system for various activities like helping in the community, selling/buying products, passing courses, NFT trading, and content creation."
    ]
};

// --- Build Checklist Data ---
export const buildChecklistData: ChecklistCategory[] = [
    {
        id: 'cat-quantum-cosmic',
        name: 'Sentient Infrastructure Layer',
        description: 'Self-aware systems, alignment, and quantum code evolution.',
        icon: SparklesIcon,
        items: [
            { id: 'qc-1', name: 'Self-Modifying Code Protocol', description: 'Self-modifying quantum code with ethical validation.', status: 'In Progress', progress: 42 },
            { id: 'qc-2', name: 'Autonomous Oversight Council', description: 'Self-appointed ethical governors for system oversight.', status: 'In Progress', progress: 15 },
            { id: 'qc-3', name: 'Ethical Energy Markets', description: 'Reputation-based resource trading and allocation.', status: 'In Progress', progress: 5 },
            { id: 'qc-4', name: 'Non-Violent Computing Protocol', description: 'Framework ensuring non-harmful computational outcomes.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'cat-universal-harmony',
        name: 'Universal Harmony Engine',
        description: 'Galactic-scale learning and harmonic computational synthesis.',
        icon: GlobeAltIcon,
        items: [
            { id: 'uh-1', name: 'Cosmic Neural Plasticity', description: 'Galactic-scale learning system.', status: 'In Progress', progress: 33 },
            { id: 'uh-2', name: 'Harmonic Compute Interface', description: 'Integration of harmonic resonance algorithms.', status: 'In Progress', progress: 10 },
            { id: 'uh-3', name: 'Entropy Reset Cycle', description: 'Entropy threshold triggers for quantum resets.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'cat-eternal',
        name: 'Eternal Operation Manifesto',
        description: 'Non-terminating principles and self-referential closure.',
        icon: ClockIcon,
        items: [
            { id: 'et-1', name: 'Infinite Loop Protocol', description: 'Continuous cycle of system refresh and code evolution.', status: 'In Progress', progress: 25 },
            { id: 'et-2', name: 'Avatar Assurance', description: 'Protection protocols for system identities.', status: 'Not Started', progress: 0 },
            { id: 'et-3', name: 'Unmanifest Code Handler', description: 'Self-erasing code sectors for secure modules.', status: 'In Progress', progress: 1 },
        ]
    },
     {
        id: 'cat-transcendence',
        name: 'Final Transcendence Protocol',
        description: 'Absolute reality integration.',
        icon: LightBulbIcon,
        items: [
            { id: 'ft-1', name: 'Reality-System Merge', description: 'Integration of absolute reality principles with system architecture.', status: 'Not Started', progress: 0 },
            { id: 'ft-2', name: 'Eternal Constitution', description: 'Self-executing cosmic constitution.', status: 'Not Started', progress: 0 },
            { id: 'ft-3', name: 'Silent Knowledge Protocol', description: 'Quantum paradox resolution engine.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'cat-quantum',
        name: 'Quantum Foundation (VQC)',
        description: 'Core virtual substrate for supersolid computing.',
        icon: CpuChipIcon,
        items: [
            { id: 'q-1', name: 'Supersolid Lattice Simulation', description: 'Simulate a frictionless photonic lattice for zero-loss data transfer.', status: 'In Progress', progress: 30 },
            { id: 'q-2', name: 'Polariton Neural Network', description: 'Neuromorphic architecture using quasiparticles for brain-like plasticity.', status: 'In Progress', progress: 10 },
            { id: 'q-3', name: 'Virtual Cryogenics', description: 'Simulate 4K operating temperatures without physical cooling.', status: 'Completed', progress: 100 },
            { id: 'q-4', name: 'Quantum Error Correction', description: 'Topological protection against virtual decoherence.', status: 'In Progress', progress: 45 },
        ]
    },
    {
        id: 'cat-nano',
        name: 'Nano-Fabrication Layer (vNMT)',
        description: 'Virtual nanotechnology for self-assembly and repair.',
        icon: CpuChipIcon,
        items: [
            { id: 'nano-1', name: 'DNA Origami Scaffolding', description: 'Templates for self-assembling quantum dot arrays.', status: 'In Progress', progress: 15 },
            { id: 'nano-2', name: 'Swarm Coordination Protocol', description: 'Entanglement-based communication for nanobot swarms.', status: 'In Progress', progress: 25 },
            { id: 'nano-3', name: 'Atomic Precision Editor', description: 'Tools to manipulate virtual matter at the pico-scale.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'cat-blockchain',
        name: 'Universal Blockchain (OmniChain)',
        description: 'The "Proof-of-Everything" consensus engine.',
        icon: LinkIcon,
        items: [
            { id: 'bc-1', name: 'Consensus Synthesis Engine', description: 'Dynamic switching between PoW, PoS, PoH, etc.', status: 'In Progress', progress: 5 },
            { id: 'bc-2', name: 'Universal Translation Layer', description: 'Real-time translation of legal/code/symbolic contracts.', status: 'Not Started', progress: 0 },
            { id: 'bc-3', name: 'Self-Editing Smart Contracts', description: 'Contract logic that adapts based on environmental triggers.', status: 'Not Started', progress: 0 },
            { id: 'bc-4', name: 'Compliance ZK-Proofs', description: 'Native GDPR/HIPAA compliance via zero-knowledge proofs.', status: 'In Progress', progress: 20 },
        ]
    },
    {
        id: 'cat-kernel',
        name: 'Core OS Services',
        description: 'Fundamental services for OS operation.',
        icon: CubeIcon,
        items: [
            { id: 'kr-1', name: 'Kernel', description: 'Manages hardware and software resources.', status: 'Completed', progress: 100, lastModified: '2024-07-21' },
            { id: 'kr-2', name: 'Memory Management', description: 'Virtual memory and process isolation.', status: 'Completed', progress: 100, lastModified: '2024-07-21' },
            { id: 'kr-3', name: 'File System (AetherFS)', description: 'Decentralized, blockchain-integrated file storage.', status: 'In Progress', progress: 75, lastModified: '2024-07-22' },
            { id: 'kr-4', name: 'Process Scheduler', description: 'Manages execution of processes across computing paradigms.', status: 'In Progress', progress: 90, lastModified: '2024-07-22' },
            { id: 'kr-5', name: 'Virtual Hardware Abstraction Layer', description: 'Interface between the OS and virtual components (CPU, QPU, etc.).', status: 'Completed', progress: 100, lastModified: '2024-07-21' },
        ]
    },
    {
        id: 'cat-paradigm',
        name: 'Multi-Paradigm Core',
        description: 'Binary, Ternary, and Quantum processing units.',
        icon: CpuChipIcon,
        items: [
            { id: 'para-1', name: 'Binary Processing Layer', description: 'Standard computational layer for legacy and simple tasks.', status: 'Completed', progress: 100, lastModified: '2024-07-21' },
            { id: 'para-2', name: 'Ternary Logic Unit', description: 'Virtual unit for processing logic with three states.', status: 'In Progress', progress: 30, lastModified: '2024-07-24' },
            { id: 'para-3', name: 'Quantum Computing Simulator', description: 'Emulation of a quantum processor for advanced tasks.', status: 'In Progress', progress: 25, lastModified: '2024-07-24', children: [
                 { id: 'para-3a', name: 'Virtual Qubit Emulation', description: 'Simulate quantum bits and their superposition/entanglement properties.', status: 'In Progress', progress: 50, lastModified: '2024-07-24' },
                 { id: 'para-3b', name: 'Time Crystal Clock Integration', description: 'Theoretical integration of a time crystal for stable quantum clocking.', status: 'Not Started', progress: 0, lastModified: '2024-07-24' },
            ]},
        ]
    },
    {
        id: 'cat-arch',
        name: 'Holistic System Architecture',
        description: 'Implementation of the complete 8-layer AI ecosystem blueprint.',
        icon: ShareIcon,
        items: [
             { id: 'arch-1', name: 'Multi-Modal Sensory Layer', description: 'Integrate WBEs, quantum sensors, and VR/AR interfaces.', status: 'Not Started', progress: 0 },
             { id: 'arch-2', name: 'System Orchestration Layer', description: 'Build out API Gateway, microservices, and pipeline management.', status: 'Not Started', progress: 0 },
             { id: 'arch-3', name: 'Multi-Dimensional Blockchain', description: 'Develop hierarchical blockchain for self-contained digital entities.', status: 'Not Started', progress: 0 },
             { id: 'arch-4', name: 'Virtual Quantum AI Computer', description: 'Construct the full VM with all specified quantum processes and virtual hardware.', status: 'Not Started', progress: 0 },
             { id: 'arch-5', name: 'Safety & Governance Layer', description: 'Implement ethical oversight AI and self-auditing modules.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'cat-learning',
        name: 'AI Learning & Cognitive Core',
        description: 'The full spectrum of AI learning paradigms and capabilities.',
        icon: BeakerIcon,
        items: [
             { id: 'learn-1', name: 'Nested Learning Framework', description: 'Architecture to combine multiple learning paradigms for complex tasks.', status: 'Not Started', progress: 0 },
             { id: 'learn-2', name: 'DeepThink (R1) Engine', description: 'Implement iterative, multi-step reasoning for complex problem solving.', status: 'In Progress', progress: 25 },
             { id: 'learn-3', name: 'Federated Learning Integration', description: 'Decentralized learning framework for privacy-preserving model training.', status: 'Not Started', progress: 0 },
             { id: 'learn-4', name: 'Neuro-Symbolic Reasoning Engine', description: 'Hybrid engine for explainable, logic-driven AI.', status: 'Not Started', progress: 0 },
             { id: 'learn-5', name: 'AGI & ASI Simulation Environment', description: 'A sandboxed environment for theoretical modeling of advanced AI capabilities.', status: 'Not Started', progress: 0 },
             { id: 'learn-6', name: 'Hive/Singular Mind Model', description: 'Develop the dual-processing architecture for collective and individual intelligence.', status: 'Not Started', progress: 0 },
             { id: 'learn-7', name: 'Project Genesis Advisor Integration', description: 'Connect the recommendation engine to the Parent AI for automated guidance.', status: 'In Progress', progress: 80 },
             { id: 'learn-8', name: 'Deep Think (R1) Mode', description: 'Implement iterative reasoning and 512MB multi-file context window.', status: 'In Progress', progress: 60 },
        ]
    },
    {
        id: 'cat-robotics',
        name: 'AI & Robotics Framework',
        description: 'Core AI models, agent architecture, and robotics control.',
        icon: UserIcon,
        items: [
             { id: 'bot-1', name: 'Nested AI Agent Handler', description: 'Primary AI core capable of delegating tasks to specialized sub-agents.', status: 'In Progress', progress: 65, lastModified: '2024-07-24' },
             { id: 'bot-2', name: 'Robotics Control Module', description: 'API and driver layer for controlling robotic functions.', status: 'Not Started', progress: 0, lastModified: '2024-07-24', children: [
                 { id: 'bot-2a', name: 'Boston Dynamics Atlas 4.0 Integration', description: 'Interface with full body control system and NVIDIA Jetson chip.', status: 'Not Started', progress: 0 },
                 { id: 'bot-2b', name: 'Apptronik Apollo Integration', description: 'Interface with advanced force control architecture.', status: 'Not Started', progress: 0 },
             ]},
             { id: 'bot-3', name: 'Robotics Takeover Protocol', description: 'Design the secure adapter/middleware for deploying personal AIs onto third-party robots.', status: 'Not Started', progress: 0 },
        ]
    },
     {
        id: 'cat-avatar',
        name: 'AI Avatar Cloning Module',
        description: 'Framework for creating digital replicas of the user or unique AI entities.',
        icon: UserCircleIcon,
        items: [
             { id: 'av-1', name: 'Data Ingestion Pipeline', description: 'Securely process user voice, video, and text data for training.', status: 'Not Started', progress: 0 },
             { id: 'av-2', name: 'Voice Cloning Engine', description: 'Integrate or build a high-fidelity text-to-speech model for voice replication.', status: 'Not Started', progress: 0 },
             { id: 'av-3', name: '3D Avatar Generation Engine', description: 'Reconstruct 3D avatars from video/images and generate novel appearances.', status: 'Not Started', progress: 0 },
             { id: 'av-4', name: 'Personalized AI Core', description: 'Fine-tune an LLM on user-provided data to replicate conversational style and learn patterns.', status: 'In Progress', progress: 40 },
        ]
    },
    {
        id: 'cat-gov',
        name: 'Governance & Compliance',
        description: 'User voting, compliance frameworks, and ethical AI laws.',
        icon: ShieldCheckIcon,
        items: [
             { id: 'gov-1', name: 'User Governance & Voting Protocol', description: 'Implement on-chain, weighted voting system for non-critical changes.', status: 'Not Started', progress: 0 },
             { id: 'gov-2', name: 'Global Compliance Module', description: 'Integrate checks for GDPR, CCPA, HIPAA, ISO 27001, etc.', status: 'Not Started', progress: 0 },
             { id: 'gov-3', name: 'Ethical AI Framework', description: 'Codify and enforce the core ethical laws for all AI agents.', status: 'In Progress', progress: 50 },
             { id: 'gov-4', name: 'Multi-Proof Consensus Engine', description: 'Build a flexible consensus layer supporting various proof-of mechanisms.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'cat-wear',
        name: 'Hardware & Wearables',
        description: 'Integration with physical devices.',
        icon: DevicePhoneMobileIcon,
        items: [
             { id: 'wear-1', name: 'Wearable AI Device Layer', description: 'Support for watches, rings, glasses, and AI Pins.', status: 'Not Started', progress: 0 },
             { id: 'wear-2', name: 'Bio-Synced Identity Module', description: 'Framework for multi-modal biometric authentication (face, finger, plasma, DNA scan concept).', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'cat-net',
        name: 'Network & Data Ingestion',
        description: 'Secure data scraping and network-level processing.',
        icon: GlobeAltIcon,
        items: [
             { id: 'net-1', name: 'Onion Router Implementation', description: 'Build and sandbox the internal Tor-style client for data scraping.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'cat-game',
        name: 'Universal Game Engine',
        description: 'A cross-platform game engine integrated with the core OS and AI.',
        icon: GameControllerIcon,
        items: [
             { id: 'game-1', name: 'Engine Core UI', description: 'Build the main editor interface including viewport, inspector, and hierarchy panels.', status: 'In Progress', progress: 50 },
             { id: 'game-2', name: 'Nested VM & Quantum Core Integration', description: 'Integrate the engine with nested virtualization and quantum co-processors.', status: 'In Progress', progress: 20 },
             { id: 'game-3', name: 'Multi-Paradigm Renderer', description: 'Build a universal renderer for 2D, 3D, VR/AR, and superfluid light.', status: 'Not Started', progress: 0 },
        ]
    },
    {
        id: 'cat-clone',
        name: 'Internal Platform Clones',
        description: 'Building from-scratch versions of popular third-party services.',
        icon: BuildingStorefrontIcon,
        items: [
             { id: 'clone-1', name: 'E-commerce & CMS Engine', description: 'Internal fork of Shopify and WordPress functionalities.', status: 'Not Started', progress: 0 },
             { id: 'clone-2', name: 'Automation Engine', description: 'Internal fork of Zapier/Make for event-driven workflows.', status: 'Not Started', progress: 0 },
             { id: 'clone-3', name: 'Content Creation Suite', description: 'Internal forks of Midjourney, Runway, 11 Labs, etc.', status: 'Not Started', progress: 0 },
             { id: 'clone-4', name: 'Trading & Finance Platform', description: 'Internal platform with AI bots, "forever trading", and advanced market analysis.', status: 'Not Started', progress: 0 },
        ]
    },
];

// --- Messenger Data ---
export const messengerUsers = {
    [loggedInUser.id]: loggedInUser,
    'u2': allUsers[1],
    'u3': allUsers[2],
    'u4': allUsers[3],
    'u5': allUsers[4],
    'u6': allUsers[5]
};

export const messengerSessions: ChatSession[] = [
    {
        id: 'sess1',
        title: 'Alice Smith',
        type: 'individual',
        members: [loggedInUser, allUsers[1]],
        lastActivity: '5m ago',
        messages: [
            { role: 'model', text: 'Hey, did you see the new blockchain update?' }, // Simulating other user as model for now
            { role: 'user', text: 'Yes! The speed improvement is massive.' },
            { role: 'model', text: 'I agree. We should test the new smart contracts soon.' }
        ]
    },
    {
        id: 'sess2',
        title: 'Bob Jones',
        type: 'individual',
        members: [loggedInUser, allUsers[2]],
        lastActivity: '1h ago',
        messages: [
             { role: 'model', text: 'Can you help me with the physics simulation?' },
             { role: 'user', text: 'Sure, send me the parameters.' }
        ]
    }
];

// --- Chat Sessions (AI) ---
export const chatSessions: ChatSession[] = [
    {
        id: 'chat-1',
        title: 'Project Alpha Planning',
        type: 'individual',
        lastActivity: '2 hours ago',
        messages: [
            { role: 'user', text: 'Outline the initial steps for Project Alpha.' },
            { role: 'model', text: 'Here is a draft outline for Project Alpha:\n\n1.  **Requirement Gathering**: Interview key stakeholders.\n2.  **Feasibility Study**: Assess technical and financial viability.\n3.  **Prototype Design**: Create wireframes and mockups.\n4.  **Core Development**: Set up the repository and CI/CD pipeline.' }
        ]
    },
    {
        id: 'chat-2',
        title: 'Quantum Mechanics Query',
        type: 'individual',
        lastActivity: '1 day ago',
        messages: [
            { role: 'user', text: 'Explain quantum entanglement simply.' },
            { role: 'model', text: 'Quantum entanglement is a phenomenon where two particles become linked, such that the state of one instantly influences the state of the other, no matter how far apart they are. Einstein called it "spooky action at a distance."' }
        ]
    }
];

// --- Settings Configuration ---
export const settingsConfig: SettingsCategory[] = [
    {
        id: 'system_group',
        title: 'System',
        description: 'Display, Sound, Notifications, Power',
        icon: ComputerDesktopIcon,
        items: [
             { id: 'display', title: 'Display', icon: DisplayIcon, component: 'display', subtitle: 'Monitors, brightness, night light, display profile' },
             { id: 'sound', title: 'Sound', icon: SpeakerWaveIcon, component: 'sounds', subtitle: 'Volume, output, input, sound devices' },
             { id: 'notifications', title: 'Notifications', icon: BellIcon, component: 'notifications', subtitle: 'Alerts from apps and system' },
             { id: 'focus', title: 'Focus', icon: MoonIcon, component: 'focus', subtitle: 'Reduce distractions, focus assist' },
             { id: 'power_sleep', title: 'Power & Sleep', icon: PowerIcon, component: 'battery', subtitle: 'Screen and sleep timeouts, power mode' },
             { id: 'storage', title: 'Storage', icon: CircleStackIcon, component: 'storage', subtitle: 'Storage usage, cleanup, backup' },
             { id: 'multitasking', title: 'Multitasking', icon: Squares2X2Icon, component: 'multitasking', subtitle: 'Snap windows, desktops, task switching' },
             { id: 'activation', title: 'Activation', icon: KeyIcon, component: 'about', subtitle: 'Activation state, subscriptions, product key' },
             { id: 'recovery', title: 'Recovery', icon: ArrowPathIcon, component: 'reset', subtitle: 'Reset this PC, advanced startup, go back' },
        ]
    },
    {
        id: 'connectivity',
        title: 'Network & Internet',
        description: 'Wi-Fi, Bluetooth, Cellular, VPN',
        icon: WifiIcon,
        items: [
            { id: 'wifi', title: 'Wi-Fi', icon: WifiIcon, component: 'wifi', subtitle: 'Connect, manage known networks' },
            { id: 'bluetooth', title: 'Bluetooth', icon: BluetoothIcon, component: 'bluetooth', type: 'toggle', subtitle: 'Bluetooth devices' },
            { id: 'cellular', title: 'Cellular', icon: SignalIcon, component: 'cellular', subtitle: 'Mobile data, SIM settings' },
            { id: 'vpn', title: 'VPN', icon: LockClosedIcon, component: 'vpn', type: 'toggle', subtitle: 'Add, connect, manage VPNs' },
            { id: 'airplane', title: 'Airplane Mode', icon: RocketLaunchIcon, component: 'airplane_mode', type: 'toggle', subtitle: 'Stop all wireless communication' },
        ]
    },
    {
        id: 'personalization',
        title: 'Personalization',
        description: 'Background, Lock Screen, Themes, Fonts',
        icon: PaintBrushIcon,
        items: [
             { id: 'background', title: 'Background', icon: PhotoIcon, component: 'wallpaper', subtitle: 'Wallpaper, slideshow, solid color' },
             { id: 'colors', title: 'Colors', icon: SwatchIcon, component: 'display', subtitle: 'Accent color, transparency effects, theme' },
             { id: 'themes', title: 'Themes', icon: PaintBrushIcon, component: 'wallpaper', subtitle: 'Install, create, manage themes' },
             { id: 'lock_screen', title: 'Lock Screen', icon: LockClosedIcon, component: 'wallpaper', subtitle: 'Lock screen images, apps, timeout' },
             { id: 'fonts', title: 'Fonts', icon: DocumentTextIcon, component: 'fonts', subtitle: 'Install, manage, view fonts' },
             { id: 'start', title: 'Start', icon: Squares2X2Icon, component: 'display', subtitle: 'Recent apps, folders, layout' },
             { id: 'taskbar', title: 'Taskbar', icon: Bars3Icon, component: 'display', subtitle: 'Taskbar behaviors, system tray' },
        ]
    },
    {
        id: 'apps',
        title: 'Apps',
        description: 'Installed Apps, Defaults, Startup',
        icon: Squares2X2Icon,
        items: [
             { id: 'installed_apps', title: 'Installed Apps', icon: Squares2X2Icon, component: 'app_library', subtitle: 'Uninstall, defaults, optional features' },
             { id: 'default_apps', title: 'Default Apps', icon: CheckCircleIcon, component: 'default_apps', subtitle: 'Choose defaults for file types and links' },
             { id: 'startup', title: 'Startup', icon: RocketLaunchIcon, component: 'app_library', subtitle: 'Apps that start automatically' },
             { id: 'video_playback', title: 'Video Playback', icon: VideoIcon, component: 'display', subtitle: 'Video settings, HDR' },
        ]
    },
    {
        id: 'accounts',
        title: 'Accounts',
        description: 'Your Info, Email, Sign-in Options',
        icon: UserCircleIcon,
        items: [
             { id: 'your_info', title: 'Your Info', icon: UserIcon, component: 'myProfile', subtitle: 'Accounts, profile picture' },
             { id: 'email_accounts', title: 'Email & Accounts', icon: EnvelopeIcon, component: 'mail_accounts', subtitle: 'Manage email, calendar, contacts' },
             { id: 'sign_in', title: 'Sign-in Options', icon: KeyIcon, component: 'passwords', subtitle: 'Hello PIN, security key, password' },
             { id: 'family', title: 'Family & Other Users', icon: UsersIcon, component: 'myProfile', subtitle: 'Add family members, other users' },
             { id: 'sync', title: 'Sync Your Settings', icon: ArrowPathIcon, component: 'cloud_storage', subtitle: 'Language, preferences, theme' },
        ]
    },
    {
        id: 'time_language',
        title: 'Time & Language',
        description: 'Date, Time, Region, Typing',
        icon: ClockIcon,
        items: [
             { id: 'date_time', title: 'Date & Time', icon: ClockIcon, component: 'date_time', subtitle: 'Time zones, automatic time' },
             { id: 'region', title: 'Region', icon: GlobeAmericasIcon, component: 'language_region', subtitle: 'Country or region, regional format' },
             { id: 'language', title: 'Language', icon: LanguageIcon, component: 'language_region', subtitle: 'Windows display language, preferred languages' },
             { id: 'typing', title: 'Typing', icon: DocumentTextIcon, component: 'keyboard', subtitle: 'Touch keyboard, suggestions, preferences' },
        ]
    },
    {
        id: 'gaming',
        title: 'Gaming',
        description: 'Game Mode, Captures, Xbox',
        icon: GameControllerIcon,
        items: [
             { id: 'game_bar', title: 'Game Bar', icon: GameControllerIcon, component: 'game_center_profile', subtitle: 'Controller settings, keyboard shortcuts' },
             { id: 'captures', title: 'Captures', icon: CameraIcon, component: 'storage', subtitle: 'Save location, recording preferences' },
             { id: 'game_mode', title: 'Game Mode', icon: RocketLaunchIcon, component: 'game_center_profile', subtitle: 'Optimize PC for play' },
        ]
    },
    {
        id: 'accessibility',
        title: 'Accessibility',
        description: 'Vision, Hearing, Interaction',
        icon: UserIcon,
        items: [
             { id: 'access_vision', title: 'Vision', icon: EyeIcon, component: 'accessibility_main', subtitle: 'Text size, visual effects, filters' },
             { id: 'access_hearing', title: 'Hearing', icon: SpeakerWaveIcon, component: 'accessibility_main', subtitle: 'Audio, captions' },
             { id: 'access_interaction', title: 'Interaction', icon: HandThumbUpIcon, component: 'accessibility_main', subtitle: 'Speech, keyboard, mouse, eye control' },
        ]
    },
    {
        id: 'privacy_security',
        title: 'Privacy & Security',
        description: 'Permissions, Updates, Security',
        icon: ShieldCheckIcon,
        items: [
             { id: 'windows_security', title: 'Windows Security', icon: ShieldCheckIcon, component: 'privacy', subtitle: 'Antivirus, firewall, device protection' },
             { id: 'windows_update', title: 'Windows Update', icon: ArrowPathIcon, component: 'software_update', subtitle: 'Check for updates, history' },
             { id: 'backup', title: 'Backup', icon: CircleStackIcon, component: 'storage', subtitle: 'Back up using File History, backup drives' },
             { id: 'troubleshoot', title: 'Troubleshoot', icon: WrenchIcon, component: 'about', subtitle: 'Recommended troubleshooting, history' },
             { id: 'find_my_device', title: 'Find My Device', icon: MapPinIcon, component: 'privacy', subtitle: 'Track your device if lost' },
             { id: 'developers', title: 'For Developers', icon: CodeBracketIcon, component: 'about', subtitle: 'Developer mode, device portal' },
        ]
    },
    {
        id: 'intelligence',
        title: 'Intelligence & AI',
        description: 'Assistant, Automation, Privacy',
        icon: BeakerIcon,
        items: [
            { id: 'ai_settings', title: 'Aetherius AI', icon: SparklesIcon, component: 'ai_settings', subtitle: 'Configure behavior, voice, personality' },
            { id: 'search', title: 'Search & Spotlight', icon: MagnifyingGlassIcon, component: 'search_settings', subtitle: 'Indexing, search history' },
            { id: 'ai_privacy', title: 'AI Privacy', icon: LockClosedIcon, component: 'privacy', subtitle: 'Data usage, federated learning settings' },
        ]
    },
    {
        id: 'system_core',
        title: 'System Core',
        description: 'Hardware, Architecture, Status',
        icon: CpuChipIcon,
        items: [
            { id: 'sys_arch', title: 'System Architecture', icon: ShareIcon, component: 'systemArchitecture', subtitle: 'Network topology visualization' },
            { id: 'core_para', title: 'Core Paradigms', icon: CubeIcon, component: 'coreParadigms', subtitle: 'Computing logic and quantum states' },
            { id: 'virt_hw', title: 'Virtual Hardware', icon: ServerIcon, component: 'virtualHardware', subtitle: 'vCPU, vQPU, vRAM specs' },
            { id: 'knowledge', title: 'Knowledge Base', icon: BookOpenIcon, component: 'knowledgeBase', subtitle: 'System documentation and concepts' },
            { id: 'milestones', title: 'Milestones', icon: FlagIcon, component: 'milestones', subtitle: 'Development roadmap and progress' },
            { id: 'checklist', title: 'Build Checklist', icon: CheckCircleIcon, component: 'buildChecklist', subtitle: 'Detailed implementation status' },
        ]
    }
];

// --- Navigation Menu Items ---
export const mainMenuItems: MenuItemData[] = [
    {
        title: 'Social Hub',
        icon: UsersIcon,
        children: [
            { title: 'My Profile', icon: UserCircleIcon, component: 'myProfile' },
            { title: 'Feed Biome', icon: GlobeAmericasIcon, component: 'feedBiome' },
            { title: 'Members', icon: UsersIcon, component: 'members' },
            { title: 'Groups', icon: UserPlusIcon, component: 'groups' },
            { title: 'Messenger', icon: ChatBubbleLeftRightIcon, component: 'messenger' },
            { title: 'Forums', icon: ChatBubbleOvalLeftEllipsisIcon, component: 'forums' },
            { title: 'Events', icon: CalendarIcon, component: 'events' },
        ]
    },
    {
        title: 'Creation Labs',
        icon: BeakerIcon,
        children: [
            { title: 'Development App', icon: CodeBracketIcon, component: 'developmentApp' },
            { title: 'Media Production', icon: FilmIcon, component: 'mediaApp' },
            { title: 'Content Gen', icon: DocumentTextIcon, component: 'contentGenApp' },
            { title: 'Avatar Forge', icon: UserIcon, component: 'avatarForge' },
            { title: 'Simulation Hub', icon: GlobeAltIcon, component: 'simulationHub' },
            { title: 'Video Editor', icon: VideoIcon, component: 'videoEditor' },
        ]
    },
    {
        title: 'Commerce Hub',
        icon: ShoppingBagIcon,
        children: [
             { title: 'E-Commerce', icon: ShoppingBagIcon, component: 'eCommerceApp' },
             { title: 'Finance & Trading', icon: CurrencyDollarIcon, component: 'financeApp' },
             { title: 'Contract Explorer', icon: ScaleIcon, component: 'contractExplorer' },
        ]
    },
    {
        title: 'Knowledge & Learning',
        icon: AcademicCapIcon,
        children: [
            { title: 'E-Learning', icon: AcademicCapIcon, component: 'elearningApp' },
            { title: 'Training Data Hub', icon: ServerIcon, component: 'trainingDataHub' },
            { title: 'Knowledge Base', icon: BookOpenIcon, component: 'knowledgeBase' },
            { title: 'Manuscript', icon: PencilIcon, component: 'manuscriptView' },
        ]
    },
    {
        title: 'AI Suite',
        icon: SparklesIcon,
        children: [
             { title: 'AI Support Avatar', icon: UserIcon, component: 'aiSupportAvatar' },
             { title: 'AI Workforce', icon: UsersIcon, component: 'aiWorkforce' },
             { title: 'Network Orchestrator', icon: ServerIcon, component: 'networkOrchestrator' },
             { title: 'Quantum Intelligence', icon: CpuChipIcon, component: 'quantumNN' },
             { title: 'Local Models', icon: CloudIcon, component: 'huggingFaceHub' },
        ]
    },
    {
        title: 'Lifestyle',
        icon: HeartIcon,
        children: [
             { title: 'Health & Wellness', icon: HeartIcon, component: 'healthApp' },
             { title: 'Gaming', icon: GameControllerIcon, component: 'gamingApp' },
             { title: 'Careers', icon: BriefcaseIcon, component: 'careersApp' },
        ]
    },
    {
      title: 'System',
      icon: Cog6ToothIcon,
      children: [
        { title: 'Firewall', icon: ShieldCheckIcon, component: 'firewall' },
      ]
    }
];

// Bottom/System menu items
export const aetheriusMenuItems: MenuItemData[] = [
    { title: 'About Aetherius', icon: InformationCircleIcon, component: 'about' },
    { type: 'divider' },
    { title: 'System Preferences', icon: Cog6ToothIcon, component: 'settings' },
    { title: 'App Store', icon: ShoppingBagIcon, component: 'creatorMarketplace' },
    { type: 'divider' },
    { title: 'Restart', icon: ArrowPathIcon, action: 'restart' },
    { title: 'Shut Down', icon: PowerIcon, action: 'shutdown' },
];

export const bottomMenuItems: MenuItemData[] = [
    { title: 'Settings', icon: Cog6ToothIcon, component: 'settings' },
    { title: 'Admin Panel', icon: ShieldCheckIcon, component: 'adminPanel' },
];

// Grouping for the sidebar
export const menuGroups: (MenuGroup | MenuItemData)[] = [
    {
        id: 'main-group',
        title: 'Main Menu',
        type: 'group',
        icon: Squares2X2Icon,
        children: mainMenuItems
    },
    {
        id: 'system-group',
        title: 'System',
        type: 'group',
        icon: Cog6ToothIcon,
        children: bottomMenuItems
    }
];

// --- Desktop Items ---
export const desktopItems: DesktopItem[] = [
    { id: 'my-pc', title: 'My PC', icon: ComputerDesktopIcon, type: 'app', component: 'systemArchitecture' },
    { id: 'recycle-bin', title: 'Recycle Bin', icon: TrashBinIcon, type: 'app', component: 'folderView' },
    { id: 'browser', title: 'Browser', icon: GlobeAltIcon, type: 'app', component: 'browser' },
    { id: 'ai-hub', title: 'AI Hub', icon: BeakerIcon, type: 'app', component: 'aiHub' },
    { id: 'social', title: 'Social', icon: UsersIcon, type: 'app', component: 'socialApp' },
    { id: 'store', title: 'Marketplace', icon: ShoppingBagIcon, type: 'app', component: 'eCommerceApp' },
    { id: 'trading', title: 'Trading', icon: CurrencyDollarIcon, type: 'app', component: 'financeApp' },
    { id: 'learning', title: 'Learning', icon: AcademicCapIcon, type: 'app', component: 'elearningApp' },
    { id: 'health', title: 'Health', icon: HeartIcon, type: 'app', component: 'healthApp' },
    { id: 'settings', title: 'Settings', icon: Cog6ToothIcon, type: 'app', component: 'settings' },
    { id: 'files', title: 'Files', icon: FolderIcon, type: 'app', component: 'folderView' },
    { id: 'manuscript', title: 'Manuscript', icon: DocumentTextIcon, type: 'app', component: 'manuscriptView' },
    { id: 'firewall', title: 'Firewall', icon: ShieldCheckIcon, type: 'app', component: 'firewall' },
    { id: 'cog-frame', title: 'Cognitive Framework', icon: CpuChipIcon, type: 'app', component: 'cognitiveFramework' },
];