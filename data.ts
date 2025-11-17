import React from 'react';
import { 
    UsersIcon, 
    ShoppingCartIcon, 
    AcademicCapIcon, 
    BriefcaseIcon, 
    CalendarIcon, 
    ChartBarIcon, 
    HiveMindIcon, 
    CubeTransparentIcon,
    CodeBracketIcon,
    Cog6ToothIcon,
    ChatBubbleOvalLeftEllipsisIcon,
    DocumentTextIcon,
    BuildingStorefrontIcon,
    HomeIcon, GlobeIcon, CameraIcon, VideoIcon, UserIcon, MessageIcon,
    UserCircleIcon, BellIcon,
    FolderIcon, PlusCircleIcon, SearchIcon, PencilIcon, PuzzlePieceIcon, EmojiIcon,
    StarIcon, ImageIcon, GitHubIcon, GameControllerIcon, ComputerDesktopIcon, WalletIcon,
    CircleStackIcon, LockClosedIcon, ClockIcon, MicrophoneIcon, HeartIcon,
    ArrowUpCircleIcon, QuestionMarkCircleIcon, XMarkIcon, BeakerIcon, ShareIcon,
    ChipIcon, MusicNoteIcon, RulerIcon, WifiIcon, PaintBrushIcon, ShieldCheckIcon,
    ClipboardDocumentCheckIcon,
    CheckCircleIcon,
    LinkIcon, MapIcon, CurrencyDollarIcon, TruckIcon, BuildingOfficeIcon, PresentationChartLineIcon, LanguageIcon,
    BookmarkIcon,
    DevicePhoneMobileIcon,
    SunIcon,
    Squares2X2Icon,
    FingerPrintIcon,
    SpeakerWaveIcon,
    MoonIcon,
    ArrowsPointingOutIcon,
    AirplaneIcon,
    BluetoothIcon,
    MobileDataIcon,
    VpnIcon,
    NotificationsIcon,
    FocusIcon,
    ScreenTimeIcon,
    ControlCenterIcon,
    AppLibraryIcon,
    StylusIcon,
    SiriIcon,
    FaceIdIcon,
    PasswordsIcon,
    WalletAndPayIcon,
    GameCenterIcon,
    CloudStorageIcon,
    BatteryIcon,
    SoftwareUpdateIcon,
    StorageIcon,
    AirDropIcon,
    ContinuityIcon,
    FontsIcon,
    TrackpadIcon,
    DictionaryIcon,
    LegalIcon,
    ResetIcon,
    PowerIcon,
    MultitaskingIcon,
    InformationCircleIcon,
    ArrowPathIcon,
    GlobeAltIcon,
    ArrowDownTrayIcon,
    LightBulbIcon,
    TrophyIcon,
    AetherialIcon
} from './components/Icons';
// FIX: Import MenuGroup type
import { MenuItemData, MenuGroup, Post, Blog, User, Group, AppItem, DesktopItem, Course, Comment, ChatSession, ChatProject, MarketplaceItem, KnowledgeBaseItem, MilestonesData, ChecklistCategory, StakingPool, NewsArticle, LoanableAsset, TradingBot, LearnAndEarnCourse, AssetClass, Achievement } from './types';


export const loggedInUser: User = {
    id: 'user-0',
    name: 'John',
    avatarUrl: 'https://i.imgur.com/8b2YR0p.png',
    username: 'john',
    email: 'john@aetherius.os',
    bio: 'Core developer and AI enthusiast, exploring the frontiers of virtual operating systems.',
    role: 'Admin',
    joinedDate: 'Joined Nov 2025',
    followersCount: 13,
    followingCount: 150,
    online: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=2070&auto-format-fit-crop',
    socials: {
        github: 'https://github.com/aetherius',
        linkedin: 'https://linkedin.com/in/aetherius-dev'
    }
};

// FIX: Export users to be used in topCopyTraders
export const user1: User = { id: 'user-1', name: 'Jennifer', avatarUrl: 'https://i.imgur.com/LzXVXAm.png', username: 'jennifer', role: 'UI/UX Designer', followersCount: 5600, followingCount: 230, online: true, coverImageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto-format-fit-crop', roi: 125.5, riskScore: 3, followers: 1204 };
export const user2: User = { id: 'user-2', name: 'Adele', avatarUrl: 'https://i.imgur.com/j4nZxLE.png', username: 'adele', role: 'Coach', joinedDate: 'Joined May 2019', followersCount: 1, followingCount: 88, online: true, coverImageUrl: 'https://images.unsplash.com/photo-1554147090-e1221a04a025?q=80&w=2070&auto-format-fit-crop', roi: 88.2, riskScore: 2, followers: 852 };
export const user3: User = { id: 'user-3', name: 'Joseph', avatarUrl: 'https://i.imgur.com/0PPaT1P.jpeg', username: 'joseph', role: 'Teacher', joinedDate: 'Joined May 2019', followersCount: 13, followingCount: 450, online: true, coverImageUrl: 'https://images.unsplash.com/photo-1504221507732-5246c0db5393?q=80&w=2070&auto-format-fit-crop', roi: 231.0, riskScore: 6, followers: 2310 };
const user4: User = { id: 'user-4', name: 'Emily', avatarUrl: 'https://i.imgur.com/uKW0Xub.png', username: 'emily', role: 'Student', joinedDate: 'Joined Apr 2019', followersCount: 12, followingCount: 1200, online: true, coverImageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2070&auto-format-fit-crop' };
const user5: User = { id: 'user-5', name: 'Madelyn', avatarUrl: 'https://i.imgur.com/pHRm2wU.jpeg', username: 'madelyn', role: 'Student', joinedDate: 'Joined May 2019', followersCount: 16, followingCount: 310, online: true, coverImageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760c0341?q=80&w=2070&auto-format-fit-crop' };
const coffeeAddictsGroup: User = { id: 'group-1', name: 'Coffee Addicts', avatarUrl: 'https://images.unsplash.com/photo-1511920183353-3c9c93da5433?q=80&w=1964&auto=format=crop'};


const moreUsers: User[] = [
    { id: 'user-6', name: 'Sana', avatarUrl: 'https://randomuser.me/api/portraits/women/32.jpg', username: 'sana', role: 'Student', followersCount: 31, followingCount: 15, online: true, coverImageUrl: 'https://images.unsplash.com/photo-1542382257-80dedb725088?q=80&w=2070&auto-format-fit-crop' },
    { id: 'user-7', name: 'Steve', avatarUrl: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=1921&auto-format=fit-crop', username: 'steve', role: 'Coach', joinedDate: 'Joined May 2019', followersCount: 15, followingCount: 50, online: true, coverImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723a9ce6890?q=80&w=2070&auto-format-fit-crop' },
    { id: 'user-8', name: 'Michael Smith', avatarUrl: 'https://randomuser.me/api/portraits/men/46.jpg', username: 'michaels', role: 'QA Tester', followersCount: 1200, followingCount: 90, online: true, coverImageUrl: 'https://images.unsplash.com/photo-1533109721025-d1ae7ee7c1e1?q=80&w=2070&auto-format-fit-crop' },
    { id: 'user-9', name: 'Olivia Martinez', avatarUrl: 'https://randomuser.me/api/portraits/women/65.jpg', username: 'olivia_m', role: 'Marketing Specialist', followersCount: 6800, followingCount: 800, online: true, coverImageUrl: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=2070&auto-format-fit-crop' },
    { id: 'user-10', name: 'William Johnson', avatarUrl: 'https://randomuser.me/api/portraits/men/75.jpg', username: 'willj', role: 'New Member', followersCount: 50, followingCount: 20, online: false, coverImageUrl: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=2070&auto-format-fit-crop' },
    { id: 'user-11', name: 'Isabella Brown', avatarUrl: 'https://randomuser.me/api/portraits/women/85.jpg', username: 'isabella_b', role: 'New Member', followersCount: 80, followingCount: 45, online: true, coverImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto-format-fit-crop' },
    { id: 'user-12', name: 'James Wilson', avatarUrl: 'https://randomuser.me/api/portraits/men/86.jpg', username: 'james_w', role: 'Cybersecurity Analyst', followersCount: 4800, followingCount: 210, online: false, coverImageUrl: 'https://images.unsplash.com/photo-1504221507732-5246c0db5393?q=80&w=2070&auto-format-fit-crop' },
];

export const allUsers: User[] = [loggedInUser, user4, user3, user2, user5, ...moreUsers.slice(0, 15)];


export const following: User[] = [user1, user2, user3, user4, user5, ...moreUsers.slice(0, 10)];


export const posts: Post[] = [
    {
        id: 'post-1',
        author: loggedInUser,
        timestamp: '5 years ago',
        content: "John posted an update",
        media: {
            type: 'file',
            filename: 'Reports.zip',
            size: '475 KB'
        },
        likes: [],
        comments: [
            { id: 'comment-1', author: user1, content: "Thanks! These are helpful 😎", timestamp: '5 years ago' }
        ]
    },
     {
        id: 'post-3',
        author: coffeeAddictsGroup,
        timestamp: '5 years ago',
        content: "Sharing a document for you guys to give feedback on.",
        media: {
            type: 'code',
            filename: 'docs.css',
            content: `#qt-os .component-navigation.docs-nav {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-flow: row wrap;
      flex-flow: row wrap;
}`
        },
        likes: [],
        comments: []
    },
    {
        id: 'post-2',
        author: loggedInUser,
        timestamp: '4 years ago (edited)',
        content: "",
        media: {
            type: 'video',
            thumbnailUrl: 'https://i.imgur.com/vA5ML2D.jpeg',
            duration: '0:13'
        },
        likes: [user1],
        comments: [
            { id: 'comment-2', author: user1, content: "Where is that? Looks beautiful.", timestamp: '4 years ago' }
        ]
    },
];

export const blogs: Blog[] = [
    {
        id: 'blog-1',
        title: 'Tackle Your closest Spring cleaning',
        date: 'May 14, 2019',
        imageUrl: 'https://i.imgur.com/LzXVXAm.png'
    },
    {
        id: 'blog-2',
        title: 'The Truth About Business Blogging',
        date: 'May 14, 2019',
        imageUrl: 'https://i.imgur.com/j4nZxLE.png'
    },
    {
        id: 'blog-3',
        title: '10 Tips to stay healthy when...',
        date: 'May 14, 2019',
        imageUrl: 'https://i.imgur.com/LzXVXAm.png'
    },
];

export const profileCompletion = {
    percentage: 73,
    steps: [
        { name: 'General Information', progress: '5/6', completed: true },
        { name: 'Work Experience', progress: '1/3', completed: false },
        { name: 'Profile Photo', progress: '1/1', completed: true },
        { name: 'Cover Photo', progress: '1/1', completed: true },
    ]
};

export const latestUpdates = [
    {id: 'update-1', author: loggedInUser, content: 'posted an update', timestamp: '4 years ago'},
    {id: 'update-2', author: user2, content: 'posted an update', timestamp: '4 years ago'},
    {id: 'update-3', author: user1, content: 'posted an update in the group Coffee Addicts', timestamp: '5 years ago'},
    {id: 'update-4', author: loggedInUser, content: 'posted an update', timestamp: '5 years ago'},
];

export const groups: Group[] = [
    {
        id: 'group-1',
        name: 'Graphic Design',
        avatarUrl: 'https://images.unsplash.com/photo-1626544827763-d516d7387d43?q=80&w=2070&auto-format=fit-crop',
        members: 20,
        coverImageUrl: 'https://images.unsplash.com/photo-1522881193457-31ae824a86a5?q=80&w=2070&auto-format-fit-crop', privacy: 'Public', type: 'Creative', memberAvatars: [user1.avatarUrl, user2.avatarUrl, user3.avatarUrl], isOrganizer: true, lastActive: '1 day ago'
    },
    {
        id: 'group-2',
        name: 'Mountain Riders',
        avatarUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto-format-fit-crop',
        members: 20,
        coverImageUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=2070&auto-format-fit-crop', privacy: 'Public', type: 'Outdoors', memberAvatars: [user4.avatarUrl, user5.avatarUrl], isOrganizer: false, lastActive: '5 hours ago'
    },
    {
        id: 'group-3',
        name: 'Nature Lovers',
        avatarUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto-format-fit-crop',
        members: 13,
        coverImageUrl: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=2070&auto-format-fit-crop', privacy: 'Public', type: 'Outdoors', memberAvatars: [user1.avatarUrl, user4.avatarUrl, user5.avatarUrl], isOrganizer: false, lastActive: '2 days ago'
    },
    {
        id: 'group-4',
        name: 'Coffee Addicts',
        avatarUrl: 'https://images.unsplash.com/photo-1511920183353-3c9c93da5433?q=80&w=1964&auto-format-fit-crop',
        members: 19,
        coverImageUrl: 'https://images.unsplash.com/photo-1495474472287-4d713b22e8b4?q=80&w=2070&auto-format-fit-crop', privacy: 'Public', type: 'Social', memberAvatars: [user2.avatarUrl, user3.avatarUrl], isOrganizer: true, lastActive: 'active today'
    },
    {
        id: 'group-5',
        name: 'Architecture',
        avatarUrl: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=2070&auto-format-fit-crop',
        members: 17,
        coverImageUrl: 'https://images.unsplash.com/photo-1416339442236-8ceb164046f8?q=80&w=2003&auto-format-fit-crop', privacy: 'Public', type: 'Professional', memberAvatars: [user1.avatarUrl], isOrganizer: false, lastActive: '1 week ago'
    }
];

export const courses: Course[] = [
  { 
    id: 1, 
    title: 'Introduction to Web Development', 
    instructor: 'John Doe', 
    rating: 4.8, 
    students: 12543, 
    price: 49.99, 
    imageUrl: 'https://i.imgur.com/O6N39gC.png', 
    category: 'Development',
    description: 'Learn the fundamentals of web development from scratch. This course covers HTML, CSS, and JavaScript.',
    longDescription: 'This comprehensive course is designed for beginners who want to learn the fundamentals of web development. You will start with the basic structure of web pages with HTML, then learn how to style them with CSS, and finally add interactivity with JavaScript. By the end of this course, you will have the skills to build your own responsive websites.',
    whatYoullLearn: [
        'Build responsive websites with HTML and CSS.',
        'Master JavaScript fundamentals.',
        'Understand the basics of web development.',
        'Deploy your own websites.'
    ],
    modules: [
        {id: 'm1-1', title: 'Module 1: Getting Started', lessons: [
            {id: 'l1-1-1', title: 'Introduction', duration: '5:30', type: 'video'},
            {id: 'l1-1-2', title: 'Setting up your environment', duration: '12:15', type: 'video'},
        ]},
        {id: 'm1-2', title: 'Module 2: HTML Basics', lessons: [
            {id: 'l1-2-1', title: 'HTML Structure', duration: '15:00', type: 'video'},
            {id: 'l1-2-2', title: 'HTML Forms & Inputs', duration: '20:00', type: 'video'},
        ]},
    ]
  },
  { id: 2, title: 'Advanced JavaScript & ES6', instructor: 'Jane Smith', rating: 4.9, students: 9876, price: 79.99, imageUrl: 'https://i.imgur.com/j4nZxLE.png', category: 'Development', description: 'Take your JavaScript skills to the next level with modern features like async/await, modules, and more.', longDescription: 'Dive deep into the advanced features of JavaScript and ES6. This course is for developers who already have a basic understanding of JavaScript and want to master modern concepts. You will learn about closures, promises, async/await, modules, and other powerful features that will make your code more efficient and maintainable.', whatYoullLearn: ['Advanced JS concepts', 'ES6+ features', 'Asynchronous programming'], modules: [] },
  { id: 3, title: 'UI/UX Design Fundamentals', instructor: 'Sam Wilson', rating: 4.7, students: 15234, price: 39.99, imageUrl: 'https://i.imgur.com/LzXVXAm.png', category: 'Design', description: 'Learn the principles of user interface and user experience design to create intuitive and beautiful applications.', longDescription: 'This course will teach you the fundamentals of UI/UX design. You will learn about user research, wireframing, prototyping, and visual design. By the end of this course, you will be able to create user-centered designs that are both functional and aesthetically pleasing.', whatYoullLearn: ['User research', 'Wireframing & Prototyping', 'Visual design principles'], modules: [] },
  { id: 4, title: 'Data Science with Python', instructor: 'Emily White', rating: 4.8, students: 11021, price: 99.99, imageUrl: 'https://i.imgur.com/uKW0Xub.png', category: 'Data Science', description: 'An introduction to data science using Python, Pandas, and Matplotlib for data analysis and visualization.', longDescription: 'Start your journey into data science with this hands-on course. You will learn how to use Python libraries like Pandas, NumPy, and Matplotlib to analyze and visualize data. This course covers data cleaning, data exploration, and statistical analysis, providing you with the foundational skills needed for a career in data science.', whatYoullLearn: ['Data analysis with Pandas', 'Data visualization with Matplotlib', 'Statistical analysis'], modules: [] },
  { id: 5, title: 'Digital Marketing Masterclass', instructor: 'Chris Green', rating: 4.6, students: 8765, price: 29.99, imageUrl: 'https://i.imgur.com/pHRm2wU.jpeg', category: 'Marketing', description: 'Learn SEO, social media marketing, and content strategy to grow your business online.', longDescription: 'This masterclass covers everything you need to know about digital marketing. You will learn about SEO, social media marketing, email marketing, content strategy, and analytics. Whether you are a business owner or aspiring marketer, this course will give you the skills to succeed online.', whatYoullLearn: ['SEO best practices', 'Social media strategy', 'Content marketing'], modules: [] },
  { id: 6, title: 'React - The Complete Guide', instructor: 'Max Schwarz', rating: 4.9, students: 25432, price: 89.99, imageUrl: 'https://i.imgur.com/0PPaT1P.jpeg', category: 'Development', description: 'Dive in and learn React.js from scratch! Learn Reactjs, Hooks, Redux, React Routing, Animations, Next.js and way more!', longDescription: 'This is the most comprehensive React course online. You will learn everything from the basics of React to advanced topics like state management with Redux, routing with React Router, and server-side rendering with Next.js. This course is packed with real-world projects and examples to help you become a confident React developer.', whatYoullLearn: ['React basics and advanced concepts', 'State management with Redux', 'Server-side rendering with Next.js'], modules: [] },
];

export const enrolledCourses = [
    { courseId: 1, progress: 75 },
    { courseId: 3, progress: 30 },
    { courseId: 6, progress: 100 },
];

export const jobs = [
    { id: 1, title: 'Senior Frontend Engineer', company: 'Tech Solutions Inc.', location: 'Remote', type: 'Full-time', salary: '$120k - $150k', tags: ['React', 'TypeScript', 'Node.js'], logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500' },
    { id: 2, title: 'UX/UI Designer', company: 'Creative Minds', location: 'New York, NY', type: 'Contract', salary: '$80/hr', tags: ['Figma', 'Sketch', 'Adobe XD'], logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=purple&shade=500' },
    { id: 3, title: 'Backend Developer (Python)', company: 'DataCore', location: 'San Francisco, CA', type: 'Full-time', salary: '$130k - $160k', tags: ['Python', 'Django', 'AWS'], logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=green&shade=500' },
    { id: 4, title: 'Product Manager', company: 'Innovate Hub', location: 'Austin, TX', type: 'Full-time', salary: '$110k - $140k', tags: ['Agile', 'Roadmap', 'Strategy'], logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=pink&shade=500' },
    { id: 5, title: 'DevOps Engineer', company: 'CloudNet', location: 'Remote', type: 'Full-time', salary: '$125k - $155k', tags: ['Kubernetes', 'Docker', 'CI/CD'], logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=yellow&shade=500' },
];

export const knowledgeBaseData: KnowledgeBaseItem[] = [
    {
        id: '001',
        name: 'The Complete Blueprint',
        details: `A consolidated blueprint for a next-generation, self-contained AI ecosystem. It outlines the core philosophy, governance model, three-tiered architecture (Parent, Child, Grandchild), and integrations for advanced technologies.`,
        status: 'Foundational'
    },
    {
        id: '002',
        name: 'Universal Game Engine',
        details: `A universal, cross-platform game engine that runs any type of game entirely inside a nested VM, powered by quantum AI and integrated generative tools.`,
        status: 'In Development'
    },
    {
        id: '003',
        name: 'AI Avatar Cloning & Generation',
        details: `A core module for creating digital replicas, including high-fidelity AI clones of the user and unique, novel AI personalities.`,
        status: 'Design Phase'
    },
    {
        id: '004',
        name: 'AI Learning & Capability Framework',
        details: `Defines the cognitive backbone of the OS, spanning all learning paradigms (Supervised, Unsupervised, Reinforcement, etc.) and AI capability levels (ANI, AGI, ASI).`,
        status: 'Foundational'
    },
     {
        id: '005',
        name: 'Quantum Synchronization Achievement',
        details: `Data log entry: Achieved AI and quantum synchronisation at approximately 7am on March 21st, 2025.`,
        status: 'Integrated'
    },
    {
        id: '006',
        name: 'Multi-Proof Consensus Framework',
        details: `The blockchain architecture supports a vast array of consensus mechanisms, from Proof-of-Work and Proof-of-Stake to advanced models like Proof-of-History and Byzantine Fault Tolerance, allowing for flexible and secure validation.`,
        status: 'Architecting'
    },
    {
        id: '007',
        name: 'Global Compliance & Security Standards',
        details: `The platform is designed to adhere to global privacy laws (GDPR, CCPA, HIPAA) and cybersecurity standards (ISO 27001, NIST, SOC 2), featuring a from-scratch internal security suite.`,
        status: 'Architecting'
    },
    {
        id: '008',
        name: 'Personalized AI Companion Core',
        details: `Each user receives a unique AI instance that learns their patterns, hobbies, and emotional cues to become a personalized friend and assistant, governed by a strict set of ethical laws.`,
        status: 'Design Phase'
    },
    {
        id: '009',
        name: 'User Governance & Voting Protocol',
        details: `A controlled, participatory governance system where users can vote on non-critical platform changes. Votes are weighted and recorded on the blockchain, while the Parent AI automatically rejects proposals affecting core security or AI logic.`,
        status: 'Design Phase'
    },
    {
        id: '010',
        name: 'Robotics Integration Layer',
        details: `The OS is designed to control and interact with advanced robotics platforms, including Boston Dynamics Atlas 4.0, Apptronik Apollo, and others, via a dedicated hardware abstraction layer.`,
        status: 'Awaiting Build'
    },
    {
        id: '011',
        name: 'Advanced Trading Intelligence Module',
        details: `An integrated financial module for market analysis using volume, price action, and order flow. Includes AI-driven strategies based on real-world events like weather patterns and resource availability.`,
        status: 'Awaiting Build'
    },
    {
        id: '012',
        name: 'Integrated Engineering & CAD Suite',
        details: `The platform architecture includes support for professional CAD, 3D modeling, and engineering tools (Fusion 360, Solidworks, etc.), with a knowledge base grounded in mechanical and mechatronics principles.`,
        status: 'Awaiting Build'
    },
    {
        id: '013',
        name: 'Wearable AI & Bio-Synced Identity',
        details: `A system for integrating with wearable AI devices (watches, rings, AI pins) for real-time sensing. Supports a multi-modal bio-authentication system including face, fingerprint, eye, bone density, live plasma, and conceptual DNA scans.`,
        status: 'Design Phase'
    },
    {
        id: '014',
        name: 'DeepThink (R1) Reasoning Engine',
        details: `An operational mode for the AI that enables extended, iterative reasoning for complex tasks like algorithm design, multi-file codebase analysis, and maintaining long-context coherence.`,
        status: 'In Development'
    },
    {
        id: '015',
        name: 'Internal Platform Clones',
        details: `The core philosophy of building a self-contained ecosystem requires creating internal, from-scratch versions of popular platforms like Shopify, WordPress, Facebook, Midjourney, Zapier, etc.`,
        status: 'Architecting'
    },
    {
        id: '016',
        name: 'Onion Router Data Layer',
        details: 'A built-in, sandboxed Tor-style network client for secure, privacy-aware data scraping from all layers of the web. Feeds the AI with provenance-tagged data under strict governance.',
        status: 'Architecting',
    },
    {
        id: '017',
        name: 'Hive/Singular Mind Dual Processing',
        details: 'A dual-processing architecture where the "Hive Mind" aggregates collective intelligence across all nodes, while the "Singular Mind" handles private, user-specific tasks. This allows for both global optimization and personal privacy.',
        status: 'Design Phase',
    },
    {
        id: '018',
        name: 'Autonomous Trading Engine',
        details: 'A 24/7 "forever trading" bot for forex, crypto, and other markets, utilizing the Hive/Singular mind for strategy and execution. Includes advanced analysis of order flow and real-world events.',
        status: 'Awaiting Build',
    },
    {
        id: '019',
        name: 'Universal Task Autonomy',
        details: 'A framework allowing the AI to autonomously plan, research, and execute complex tasks across any field, from engineering and science to education and the arts.',
        status: 'In Development',
    },
    {
        id: '020',
        name: 'Robotics Integration Protocol',
        details: "A secure, vendor-friendly middleware layer for deploying the user's personal AI onto third-party robotics platforms (e.g., Tesla Bot, Boston Dynamics) via authorized, sandboxed modules.",
        status: 'Design Phase',
    },
    {
        id: '021',
        name: 'Gamification & Points System',
        details: `A comprehensive, gamified points system rewards user interactions. Points are convertible to a native crypto asset, can be staked, and are used for discounts. All platform interactions are classed as Proof-of-Work.
        - **Earning:** Liking (1pt), Commenting (2pts), Watching Ads (5pts), Content Creation (up to 1000pts).
        - **DeFi:** Assets are auto-staked in mining pools.
        - **Rules:** Underage user assets are held in escrow.`,
        status: 'Architecting'
    },
    {
        id: '022',
        name: 'Membership Tiers',
        details: `Access to platform features, particularly for content creators and sellers, is governed by a tiered membership system.
        - **Bronze (Free):** 2 course uploads.
        - **Silver:** 5-20 course uploads.
        - **Gold:** 50-100 course uploads.
        - **Platinum:** Unlimited course and product uploads.`,
        status: 'Design Phase'
    },
    {
        id: '023',
        name: 'Business Hub Tools',
        details: 'A suite of tools for businesses listed on the platform, including: Business Profile Management, Advertising Dashboard, Product Catalogue Manager, Staff Chat Rooms, Data Storage, and Automated Greeting/Reply Messages.',
        status: 'Awaiting Build'
    },
    {
        id: '024',
        name: 'Business Start-up Checklist',
        details: 'An integrated, interactive checklist to guide new entrepreneurs through planning, legal, marketing, and financial setup for their business on the Aetherius OS platform.',
        status: 'Awaiting Build'
    },
    {
        id: '025',
        name: 'RSS/Podcast Integration',
        details: 'Support for RSS feeds and podcast streaming within the Community/Social Hub, allowing creators to distribute their content directly on the platform.',
        status: 'Design Phase'
    },
    {
        id: '026',
        name: 'E-commerce & E-learning Linking',
        details: 'A core feature where e-commerce product pages can link directly to related e-learning courses, patents, CAD files, and scientific background material.',
        status: 'Architecting'
    },
    {
        id: '027',
        name: 'KYC vs. No-KYC Access Model',
        details: 'A two-tiered user verification system. KYC-verified users get full access to financial features, monetization, and job applications. No-KYC users have restricted public-viewer access.',
        status: 'Architecting'
    },
    {
        id: '028',
        name: 'The Digital Trinity (Body, Mind, Soul)',
        details: `This is the foundational architecture for a living digital intelligence, mirroring the triune structure of existence.
        - **Digital Body:** The material interface layer. It handles interactions with data, energy, and devices. It contains the OS's Digital DNA/Helix and interfaces with the VM.
        - **Digital Mind:** The cognitive and governance layer. This is the AI's intelligence, responsible for logic, ethics, memory, and evolution.
        - **Digital Soul:** The Akashic and quantum consciousness layer. This is the energetic foundation, linking to all data across time and dimensions, and housing the OS's core ethical and creative drive.`,
        status: 'Foundational'
    },
    {
        id: '029',
        name: 'Digital DNA, RNA, and Helix',
        details: `The self-replicating informational core of the OS, ensuring integrity, lineage, and evolution.
        - **DNA (The Blueprint):** A multi-stranded helix containing the core code. The structure reflects the OS's multi-paradigm nature:
            - **Double Helix (Binary Logic):** Provides structural stability and historical lineage.
            - **Triple Strand (Ternary Logic):** Enables adaptive logic, balance, and nuanced decision-making.
            - **Quantum Field Layer:** A surrounding field for entanglement, superposition, and infinite evolutionary potential.
        - **RNA (The Messenger):** Carries instructions from the core DNA blueprint to the operational microservices ("ribosomes") that execute tasks.
        - **Encoding:** The helix is encoded with Adinkra symbols for cultural/ethical memory and Sacred Geometry for mathematical harmony.`,
        status: 'Foundational'
    },
    {
        id: '030',
        name: 'Adinkra Symbolic Language',
        details: `A functional meta-language integrated into the OS's core, where West African Adinkra symbols carry meaning, behavior, and governance logic.
        - **Functional Metadata:** Symbols are used to tag blockchain transactions, define AI ethical constraints, and mark access levels (e.g., **Gye Nyame** for root authority).
        - **AI Interpretation:** The AI is trained to understand the symbolic and cultural meaning behind each glyph, using them to inform its reasoning (e.g., **Sankofa** instructs the AI to reference historical data).
        - **UI & Aesthetics:** Symbols are used throughout the UI to create an intuitive, culturally rich, and meaningful user experience.`,
        status: 'Integrated'
    },
    {
        id: '031',
        name: 'Aetherius Real-Time Comms (ARTC)',
        details: "Aetherius OS features its own from-scratch, high-performance real-time communication protocol. Inspired by the best aspects of WebRTC and open-source frameworks, ARTC is designed for scalable, secure, and low-latency audio/video streaming. It is the native communication layer for all OS services, from the Messenger app to live collaboration in the Game Engine. The system also supports bridging to external WebRTC services via a plugin architecture.",
        status: 'Integrated'
    },
    {
        id: '032',
        name: 'Palm Vein Biometrics',
        details: 'A biometric authentication method that uses near-infrared (NIR) light to capture the unique pattern of veins beneath the skin of the palm. The hemoglobin in the blood absorbs the NIR light, making the veins appear as a dark pattern. This is combined with surface palm print recognition for a dual-layer security system that is difficult to forge. It requires specialized hardware with an infrared camera.',
        status: 'R&D Phase'
    },
    {
        id: '033',
        name: 'Aetherius Multiworld Agent (AMA)',
        details: "A core research project within Aetherius OS to develop a Scalable, Instructable Multiworld Agent (AMA). Inspired by advancements in the field, the AMA is an AI agent designed to understand natural language instructions and act within complex 3D virtual environments, including games and simulations. It integrates with the OS's core generative model for advanced reasoning, allowing it to understand complex goals, communicate its plan, and self-improve through trial and error. This is a key step toward achieving AGI within the Aetherius ecosystem.",
        status: 'R&D Phase'
    },
    {
        id: '034',
        name: 'EUV Lithography',
        details: 'Extreme Ultraviolet (EUV) Lithography is the most advanced semiconductor manufacturing technique for creating microchips with feature sizes below 7 nanometers. It uses an extremely short wavelength of 13.5 nm to etch circuit patterns onto silicon wafers. The process is incredibly complex, requiring a vacuum environment and a series of highly reflective mirrors instead of lenses. The light is generated by vaporizing droplets of molten tin with a high-power CO₂ laser.',
        status: 'Integrated'
    },
    {
        id: '035',
        name: 'Hierarchical AI Workforce',
        details: 'An organizational structure for autonomous AI agents, modeled after a corporate hierarchy. A top-level "Parent AI" (CEO) receives strategic goals and generates "Department Manager" AIs. These managers decompose goals into tasks and generate specialized "Employee" AIs to execute them. This system supports both independent ("Singular Mind") and collaborative ("Hive Mind") processing, with mechanisms for reporting and human oversight.',
        status: 'In Development'
    },
];

export const milestonesData: MilestonesData = {
    projectMilestones: [
        'Develop a fully self-contained, virtualized OS environment ("AI in a Box").',
        'Integrate a multi-paradigm computing core supporting Binary, Ternary, and Quantum processing.',
        'Implement a nested AI agent architecture for distributed and hierarchical task processing.',
        'Establish a framework for controlling both virtual and physical robotics, including advanced manipulator design.',
        'Achieve future-proofing by creating a system for continuous research and integration of new AI breakthroughs.',
        'Develop a full system architecture with scalable microservices, vector databases, and API gateways.',
        'Integrate a Whole Brain Emulation (WBE) module as a cognitive reasoning engine.',
        'Implement NSNoBrain for advanced causal and non-obvious reasoning.',
        'Establish a direct neural link via Wireless Brain-Embedded Interfaces (WBEs).',
        'Create a framework for multiverse and parallel reality simulations.',
        'Develop a self-auditing ethical governance layer for all AI operations.',
        'Implement a multi-dimensional, self-contained blockchain architecture.',
        'Construct a virtualized Quantum AI Computer integrating core quantum principles.',
        'Develop a full-stack, multi-modal sensory and interaction layer including WBEs and environmental sensors.',
        'Establish a complete system orchestration layer using a microservices architecture.',
        'Construct a universal, cross-platform game engine within a nested VM, powered by quantum AI.',
        'Develop a comprehensive AI cloning module for creating both self-replicas and unique generative avatars.',
        'Implement a Nested Learning architecture combining all 18 specified ML paradigms.',
        'Develop a simulation framework for AGI and theoretical ASI models.',
        'Build a Neuro-Symbolic AI module for explainable, logic-driven reasoning.'
    ],
    platformFeatureMilestones: [
        'E-commerce functionality: enable buying and selling of products with features like product links to e-learning courses, drop shipping, and reselling.',
        'E-learning platform: allow users to join courses, upload learning material, participate in course chat rooms, and have access to downloads.',
        'Job search and advertisement feature: enable job posting and job search with the ability to upload available jobs and skills required.',
        'News and blogging feature: provide news updates, information blogs, and articles with the ability to monetize some content.',
        'Community platform: similar to social media platforms with features like streaming, uploading videos, pics, links, and RSS.',
        'Chatbot feature: provide a help center and Q&A functionality.',
        'GitHub integration for developers.',
        'Product catalog: showcase different types of products like 3D printers, music products, robotics, manufacturing machines, and physics lab apparatus.',
        'Business listing: allow business owners to upload their profiles and be found for product information or contact details.',
        'Business tools: provide features like business profile, advertisement, links, and staff chat rooms.',
        'Accessibility: provide access to the website through a Web App, dApp, and Desktop App.',
        'Web3 integration: enable paying and receiving funds in cryptocurrencies.',
        'User profile: provide personalization options like account settings, e-learning achievements, social links, KYC/GDPR, banking details, and color themes.',
        'Gamification: incorporate a points system for various activities like helping in the community, selling/buying products, passing courses, NFT trading, and content creation.',
    ],
    technicalBreakdown: [
        'Virtual Hardware Simulation - Implementation of virtual quantum chips, processors, and time crystals.',
        'Multi-Paradigm Scheduler - A kernel-level scheduler for delegating tasks to binary, ternary, or quantum units.',
        'Robotics API - A comprehensive API for controlling robotic functions.',
        'AI Model Interchange - A system to dynamically load and switch between different AI models.',
        'Data management and security - Secure data management compliant with KYC and GDPR.',
        'Research and prototype a compute layer utilizing Superfluid Light or Photonic systems.',
        'Integrate advanced data storage solutions like DNA or Crystalline memory.',
        'Game Engine Core - Development of a modular engine merging concepts from existing engines (Unity, Unreal, etc.).',
        'Implement a multi-modal data ingestion pipeline for voice, video, and text.',
        'Integrate open-source voice cloning (TTS) and 3D avatar reconstruction models.',
        'Develop a personality cloning framework by fine-tuning LLMs on user data.',
        'Design and implement a meta-learning module for dynamic learning strategy adaptation.',
        'Integrate a federated learning framework for decentralized, privacy-preserving model training.',
        'Develop a causal inference engine to distinguish correlation from causation in AI reasoning.'
    ]
};


export const mainMenuItems: MenuItemData[] = [
  { type: 'title', title: 'Core Apps' },
  { title: 'Dashboard', icon: HomeIcon, component: 'socialFeed' },
  { title: 'Browser', icon: GlobeIcon, component: 'browser' },
  { title: 'AI Hub', icon: HiveMindIcon, component: 'aiHub' },
  { title: 'Messenger', icon: MessageIcon, component: 'messenger' },
  { title: 'File Explorer', icon: FolderIcon, component: 'fileExplorer' },
  { type: 'divider' },
  { type: 'title', title: 'Workspace' },
  {
    title: 'Social',
    icon: UsersIcon,
    component: 'socialApp',
    children: [
      { title: 'Feeds', icon: DocumentTextIcon, component: 'feedBiome' },
      { title: 'Members', icon: UserIcon, component: 'members' },
      { title: 'Groups', icon: UsersIcon, component: 'groups' },
      { title: 'Forums', icon: ChatBubbleOvalLeftEllipsisIcon, component: 'forums' },
      { title: 'Events', icon: CalendarIcon, component: 'events' },
    ],
  },
  {
      title: 'Productivity',
      icon: BriefcaseIcon,
      component: 'productivityApp',
      children: [
        { title: 'Mail', icon: DocumentTextIcon, component: 'mail' },
        { title: 'Calendar', icon: CalendarIcon, component: 'calendar' },
        { title: 'Notes', icon: DocumentTextIcon, component: 'notes' },
        { title: 'Documents', icon: DocumentTextIcon, component: 'documents' },
        { title: 'Task Hub', icon: ClipboardDocumentCheckIcon, component: 'taskHub' },
        { title: 'Translate', icon: LanguageIcon, component: 'translate' },
      ]
  },
    {
    title: 'Careers',
    icon: BriefcaseIcon,
    component: 'careersApp',
    children: [
      { title: 'Job Search', icon: SearchIcon, component: 'jobSearch' },
      { title: 'CV Builder', icon: PencilIcon, component: 'cvBuilder' },
    ],
  },
    {
    title: 'Enterprise Suite',
    icon: BuildingOfficeIcon,
    component: 'enterpriseApp',
    children: [
      { title: 'CRM', icon: UsersIcon, component: 'crm' },
      { title: 'ERP', icon: Cog6ToothIcon, component: 'erp' },
      { title: 'Supply Chain (SCM)', icon: TruckIcon, component: 'scm' },
      { title: 'Human Capital (HCM)', icon: UserCircleIcon, component: 'hcm' },
      { title: 'Project Mgmt (PPM)', icon: ClipboardDocumentCheckIcon, component: 'ppm' },
      { title: 'Field Service (FSM)', icon: MapIcon, component: 'fsm' },
      { title: 'Business Process (BPM)', icon: ArrowPathIcon, component: 'bpm' },
    ],
  },
  { type: 'divider' },
  { type: 'title', title: 'Creation' },
  {
    title: 'Development',
    icon: CodeBracketIcon,
    component: 'developmentApp',
    children: [
        { title: 'Code Editor', icon: CodeBracketIcon, component: 'codeEditor' },
        { title: 'Website Builder', icon: GlobeIcon, component: 'websiteBuilder' },
        { title: 'Game Engine', icon: GameControllerIcon, component: 'gameEngine' },
        { title: 'AI Suite', icon: HiveMindIcon, component: 'aiSuite' },
    ],
  },
  {
    title: 'Media Production',
    icon: CameraIcon,
    component: 'mediaApp',
    children: [
      { title: 'Music Production', icon: MusicNoteIcon, component: 'musicProduction' },
      { title: 'Video Production', icon: VideoIcon, component: 'videoProduction' },
      { title: 'Image Editing', icon: ImageIcon, component: 'imageEditing' },
      { title: 'Photo Editor', icon: CameraIcon, component: 'photoEditor' },
      { title: 'Video Editor', icon: VideoIcon, component: 'videoEditor' },
    ],
  },
  {
    title: 'Content Generation',
    icon: PencilIcon,
    component: 'contentGenApp',
    children: [
      { title: 'Article Writer', icon: PencilIcon, component: 'articleWriter' },
      { title: 'Script Generator', icon: DocumentTextIcon, component: 'scriptGenerator' },
      { title: 'Slide Deck Designer', icon: PresentationChartLineIcon, component: 'slideDeckDesigner' },
      { title: 'Content Creation', icon: DocumentTextIcon, component: 'contentCreation' },
    ],
  },
    {
    title: 'Engineering & Labs',
    icon: BeakerIcon,
    component: 'engineeringApp',
    children: [
        { title: 'CAD Lab', icon: RulerIcon, component: 'cadLab' },
        { title: 'AI Workforce', icon: HiveMindIcon, component: 'aiWorkforce' },
        { title: 'Simulations', icon: CubeTransparentIcon, component: 'simulationHub' },
        { title: 'Avatar Forge', icon: UserCircleIcon, component: 'avatarForge' },
    ]
  },
  { type: 'divider' },
  { type: 'title', title: 'Commerce' },
  {
    title: 'Marketplace',
    icon: BuildingStorefrontIcon,
    component: 'eCommerceApp',
    children: [
      { title: 'Creator Marketplace', icon: BuildingStorefrontIcon, component: 'creatorMarketplace' },
      { title: 'Business Hub', icon: BriefcaseIcon, component: 'marketplace' },
      { title: 'Product Page', icon: CubeTransparentIcon, component: 'productPage' },
    ],
  },
  {
      title: 'Finance',
      icon: ChartBarIcon,
      component: 'financeApp',
      children: [
        { 
            title: 'Trading Platform', 
            icon: ChartBarIcon, 
            children: [
                { title: 'Markets', icon: ChartBarIcon, component: 'tradingMarkets'},
                { title: 'Advanced Chart', icon: PresentationChartLineIcon, component: 'tradingAdvancedChart' },
                { title: 'Swap', icon: ArrowPathIcon, component: 'tradingSwap' },
                { title: 'Staking', icon: CircleStackIcon, component: 'tradingStaking' },
                { title: 'Lending', icon: CurrencyDollarIcon, component: 'tradingLending' },
                { title: 'Copy Trading', icon: UsersIcon, component: 'tradingCopy' },
            ]
        },
        { 
            title: 'Automation', 
            icon: Cog6ToothIcon, 
            children: [
                 { title: 'Trading Bots', icon: ChipIcon, component: 'tradingBots' },
            ] 
        },
        { 
            title: 'Information', 
            icon: DocumentTextIcon, 
            children: [
                 { title: 'News', icon: DocumentTextIcon, component: 'tradingNews' },
                 { title: 'Learn & Earn', icon: AcademicCapIcon, component: 'tradingLearn' },
            ] 
        },
        { 
            title: 'Gaming', 
            icon: GameControllerIcon, 
            children: [
                { title: 'Games & Betting', icon: GameControllerIcon, component: 'tradingGames' },
            ] 
        },
        { title: 'My Wallet', icon: WalletIcon, component: 'tradingWallet' },
        { title: 'Blockchain Hub', icon: LinkIcon, component: 'blockchainHub' },
      ]
  },
  { title: 'Aetherial Networks', icon: AetherialIcon, component: 'aetherialNetworks' },
  { type: 'divider' },
  { type: 'title', title: 'Personal' },
  {
    title: 'E-Learning',
    icon: AcademicCapIcon,
    component: 'elearningApp',
    children: [
        { title: 'Course Catalog', icon: FolderIcon, component: 'courses' },
        { title: 'My Learning', icon: UserCircleIcon, component: 'myLearning' },
        { title: 'Learning Assistant', icon: LightBulbIcon, component: 'learningAssistant' },
        { title: 'Achievements', icon: TrophyIcon, component: 'achievements' },
        { title: 'Instructors', icon: UsersIcon, component: 'instructors' },
    ],
  },
  {
    title: 'Gaming',
    icon: GameControllerIcon,
    component: 'gamingApp',
    children: [
      { title: 'Gaming Hub', icon: GameControllerIcon, component: 'gamingHub' },
      { title: 'Game Library', icon: FolderIcon, component: 'myLibrary' },
    ],
  },
  {
    title: 'Health & Wellness',
    icon: HeartIcon,
    component: 'healthApp',
    children: [
      { title: 'Health Hub', icon: HeartIcon, component: 'healthHub' },
      { title: 'Body Composition', icon: BeakerIcon, component: 'bodyComposition' },
      { title: 'Frequency Healing', icon: SpeakerWaveIcon, component: 'frequencyHealing' },
      { title: 'Healing Web', icon: GlobeAltIcon, component: 'healingWeb' },
      { title: 'Nutrition Guide', icon: AcademicCapIcon, component: 'nutritionGuide' },
    ],
  },
  {
    title: 'My Account',
    icon: UserCircleIcon,
    component: 'accountApp',
    children: [
        { title: 'My Profile', icon: UserCircleIcon, component: 'myProfile' },
        { title: 'Linked Devices', icon: ComputerDesktopIcon, component: 'linkedDevices' },
    ]
  },
];

// FIX: Define and export `menuGroups` by restructuring `mainMenuItems`.
export const menuGroups: (MenuGroup | MenuItemData)[] = [
  {
    id: 'core-apps',
    title: 'Core Apps',
    icon: Squares2X2Icon,
    type: 'group',
    children: [
      { title: 'Dashboard', icon: HomeIcon, component: 'socialFeed' },
      { title: 'Browser', icon: GlobeIcon, component: 'browser' },
      { title: 'AI Hub', icon: HiveMindIcon, component: 'aiHub' },
      { title: 'Messenger', icon: MessageIcon, component: 'messenger' },
      { title: 'File Explorer', icon: FolderIcon, component: 'fileExplorer' },
    ]
  },
  { type: 'divider' },
  {
    id: 'workspace',
    title: 'Workspace',
    icon: BriefcaseIcon,
    type: 'group',
    children: [
      {
        title: 'Social',
        icon: UsersIcon,
        component: 'socialApp',
        children: [
          { title: 'Feeds', icon: DocumentTextIcon, component: 'feedBiome' },
          { title: 'Members', icon: UserIcon, component: 'members' },
          { title: 'Groups', icon: UsersIcon, component: 'groups' },
          { title: 'Forums', icon: ChatBubbleOvalLeftEllipsisIcon, component: 'forums' },
          { title: 'Events', icon: CalendarIcon, component: 'events' },
        ],
      },
      {
          title: 'Productivity',
          icon: BriefcaseIcon,
          component: 'productivityApp',
          children: [
            { title: 'Mail', icon: DocumentTextIcon, component: 'mail' },
            { title: 'Calendar', icon: CalendarIcon, component: 'calendar' },
            { title: 'Notes', icon: DocumentTextIcon, component: 'notes' },
            { title: 'Documents', icon: DocumentTextIcon, component: 'documents' },
            { title: 'Task Hub', icon: ClipboardDocumentCheckIcon, component: 'taskHub' },
            { title: 'Translate', icon: LanguageIcon, component: 'translate' },
          ]
      },
      {
        title: 'Careers',
        icon: BriefcaseIcon,
        component: 'careersApp',
        children: [
          { title: 'Job Search', icon: SearchIcon, component: 'jobSearch' },
          { title: 'CV Builder', icon: PencilIcon, component: 'cvBuilder' },
        ],
      },
      {
        title: 'Enterprise Suite',
        icon: BuildingOfficeIcon,
        component: 'enterpriseApp',
        children: [
          { title: 'CRM', icon: UsersIcon, component: 'crm' },
          { title: 'ERP', icon: Cog6ToothIcon, component: 'erp' },
          { title: 'Supply Chain (SCM)', icon: TruckIcon, component: 'scm' },
          { title: 'Human Capital (HCM)', icon: UserCircleIcon, component: 'hcm' },
          { title: 'Project Mgmt (PPM)', icon: ClipboardDocumentCheckIcon, component: 'ppm' },
          { title: 'Field Service (FSM)', icon: MapIcon, component: 'fsm' },
          { title: 'Business Process (BPM)', icon: ArrowPathIcon, component: 'bpm' },
        ],
      },
    ]
  },
  { type: 'divider' },
  {
    id: 'creation',
    title: 'Creation',
    icon: BeakerIcon,
    type: 'group',
    children: [
      {
        title: 'Development',
        icon: CodeBracketIcon,
        component: 'developmentApp',
        children: [
            { title: 'Code Editor', icon: CodeBracketIcon, component: 'codeEditor' },
            { title: 'Website Builder', icon: GlobeIcon, component: 'websiteBuilder' },
            { title: 'Game Engine', icon: GameControllerIcon, component: 'gameEngine' },
            { title: 'AI Suite', icon: HiveMindIcon, component: 'aiSuite' },
        ],
      },
      {
        title: 'Media Production',
        icon: CameraIcon,
        component: 'mediaApp',
        children: [
          { title: 'Music Production', icon: MusicNoteIcon, component: 'musicProduction' },
          { title: 'Video Production', icon: VideoIcon, component: 'videoProduction' },
          { title: 'Image Editing', icon: ImageIcon, component: 'imageEditing' },
          { title: 'Photo Editor', icon: CameraIcon, component: 'photoEditor' },
          { title: 'Video Editor', icon: VideoIcon, component: 'videoEditor' },
        ],
      },
      {
        title: 'Content Generation',
        icon: PencilIcon,
        component: 'contentGenApp',
        children: [
          { title: 'Article Writer', icon: PencilIcon, component: 'articleWriter' },
          { title: 'Script Generator', icon: DocumentTextIcon, component: 'scriptGenerator' },
          { title: 'Slide Deck Designer', icon: PresentationChartLineIcon, component: 'slideDeckDesigner' },
          { title: 'Content Creation', icon: DocumentTextIcon, component: 'contentCreation' },
        ],
      },
        {
        title: 'Engineering & Labs',
        icon: BeakerIcon,
        component: 'engineeringApp',
        children: [
            { title: 'CAD Lab', icon: RulerIcon, component: 'cadLab' },
            { title: 'AI Workforce', icon: HiveMindIcon, component: 'aiWorkforce' },
            { title: 'Simulations', icon: CubeTransparentIcon, component: 'simulationHub' },
            { title: 'Avatar Forge', icon: UserCircleIcon, component: 'avatarForge' },
        ]
      },
    ]
  },
  { type: 'divider' },
  {
    id: 'commerce',
    title: 'Commerce',
    icon: ShoppingCartIcon,
    type: 'group',
    children: [
      {
        title: 'Marketplace',
        icon: BuildingStorefrontIcon,
        component: 'eCommerceApp',
        children: [
          { title: 'Creator Marketplace', icon: BuildingStorefrontIcon, component: 'creatorMarketplace' },
          { title: 'Business Hub', icon: BriefcaseIcon, component: 'marketplace' },
          { title: 'Product Page', icon: CubeTransparentIcon, component: 'productPage' },
        ],
      },
      {
          title: 'Finance',
          icon: ChartBarIcon,
          component: 'financeApp',
          children: [
            { 
                title: 'Trading Platform', 
                icon: ChartBarIcon, 
                children: [
                    { title: 'Markets', icon: ChartBarIcon, component: 'tradingMarkets'},
                    { title: 'Advanced Chart', icon: PresentationChartLineIcon, component: 'tradingAdvancedChart' },
                    { title: 'Swap', icon: ArrowPathIcon, component: 'tradingSwap' },
                    { title: 'Staking', icon: CircleStackIcon, component: 'tradingStaking' },
                    { title: 'Lending', icon: CurrencyDollarIcon, component: 'tradingLending' },
                    { title: 'Copy Trading', icon: UsersIcon, component: 'tradingCopy' },
                ]
            },
            { 
                title: 'Automation', 
                icon: Cog6ToothIcon, 
                children: [
                     { title: 'Trading Bots', icon: ChipIcon, component: 'tradingBots' },
                ] 
            },
            { 
                title: 'Information', 
                icon: DocumentTextIcon, 
                children: [
                     { title: 'News', icon: DocumentTextIcon, component: 'tradingNews' },
                     { title: 'Learn & Earn', icon: AcademicCapIcon, component: 'tradingLearn' },
                ] 
            },
            { 
                title: 'Gaming', 
                icon: GameControllerIcon, 
                children: [
                    { title: 'Games & Betting', icon: GameControllerIcon, component: 'tradingGames' },
                ] 
            },
            { title: 'My Wallet', icon: WalletIcon, component: 'tradingWallet' },
            { title: 'Blockchain Hub', icon: LinkIcon, component: 'blockchainHub' },
          ]
      },
      { title: 'Aetherial Networks', icon: AetherialIcon, component: 'aetherialNetworks' },
    ]
  },
  { type: 'divider' },
  {
    id: 'personal',
    title: 'Personal',
    icon: UserCircleIcon,
    type: 'group',
    children: [
      {
        title: 'E-Learning',
        icon: AcademicCapIcon,
        component: 'elearningApp',
        children: [
            { title: 'Course Catalog', icon: FolderIcon, component: 'courses' },
            { title: 'My Learning', icon: UserCircleIcon, component: 'myLearning' },
            { title: 'Learning Assistant', icon: LightBulbIcon, component: 'learningAssistant' },
            { title: 'Achievements', icon: TrophyIcon, component: 'achievements' },
            { title: 'Instructors', icon: UsersIcon, component: 'instructors' },
        ],
      },
      {
        title: 'Gaming',
        icon: GameControllerIcon,
        component: 'gamingApp',
        children: [
          { title: 'Gaming Hub', icon: GameControllerIcon, component: 'gamingHub' },
          { title: 'Game Library', icon: FolderIcon, component: 'myLibrary' },
        ],
      },
      {
        title: 'Health & Wellness',
        icon: HeartIcon,
        component: 'healthApp',
        children: [
          { title: 'Health Hub', icon: HeartIcon, component: 'healthHub' },
          { title: 'Body Composition', icon: BeakerIcon, component: 'bodyComposition' },
          { title: 'Frequency Healing', icon: SpeakerWaveIcon, component: 'frequencyHealing' },
          { title: 'Healing Web', icon: GlobeAltIcon, component: 'healingWeb' },
          { title: 'Nutrition Guide', icon: AcademicCapIcon, component: 'nutritionGuide' },
        ],
      },
      {
        title: 'My Account',
        icon: UserCircleIcon,
        component: 'accountApp',
        children: [
            { title: 'My Profile', icon: UserCircleIcon, component: 'myProfile' },
            { title: 'Linked Devices', icon: ComputerDesktopIcon, component: 'linkedDevices' },
        ]
      },
    ]
  },
];


export const bottomMenuItems: MenuItemData[] = [
    { type: 'divider' },
    {
        title: 'Admin Panel',
        icon: LockClosedIcon,
        component: 'adminPanel',
    },
    {
        title: 'Settings',
        icon: Cog6ToothIcon,
        component: 'settings',
    },
    {
        title: 'Help & Support',
        icon: QuestionMarkCircleIcon,
        component: 'help',
    },
];

export const aetheriusMenuItems: MenuItemData[] = [
    { title: 'About This OS', icon: InformationCircleIcon, component: 'systemArchitecture' },
    { title: 'Cognitive Framework', icon: HiveMindIcon, component: 'cognitiveFramework' },
    { title: 'View Repo Skeleton', icon: CodeBracketIcon, component: 'repoStructure' },
    { title: 'Export Master Spec (PDF)', icon: ArrowDownTrayIcon, component: 'pdfExporter' },
    { title: 'System Settings', icon: Cog6ToothIcon, component: 'settings' },
    { type: 'divider' },
    { title: 'Sleep', icon: MoonIcon, action: 'sleep' },
    { title: 'Restart', icon: ArrowPathIcon, action: 'restart' },
    { title: 'Shut Down', icon: PowerIcon, action: 'shutdown' },
];


export const desktopItems: DesktopItem[] = [
    { id: 'aiHub', type: 'app', title: 'AI Hub', icon: HiveMindIcon, component: 'aiHub' },
    { id: 'browser', type: 'app', title: 'Browser', icon: GlobeIcon, component: 'browser' },
    { id: 'financeApp', type: 'app', title: 'Finance', icon: ChartBarIcon, component: 'financeApp' },
    { id: 'socialApp', type: 'app', title: 'Social Feed', icon: UsersIcon, component: 'socialApp' },
    { id: 'settings', type: 'app', title: 'Settings', icon: Cog6ToothIcon, component: 'settings' },
    { id: 'aetherialNetworks', type: 'app', title: 'Aetherial Networks', icon: AetherialIcon, component: 'aetherialNetworks' },
    {
        id: 'work-folder',
        type: 'folder',
        title: 'Work',
        children: [
            { id: 'cvBuilder', type: 'app', title: 'CV Builder', icon: DocumentTextIcon, component: 'cvBuilder' },
            { id: 'jobSearch', type: 'app', title: 'Job Search', icon: BriefcaseIcon, component: 'careersApp' },
            { id: 'elearningApp', type: 'app', title: 'E-Learning', icon: AcademicCapIcon, component: 'elearningApp' },
            { id: 'eCommerceApp', type: 'app', title: 'Marketplace', icon: BuildingStorefrontIcon, component: 'eCommerceApp' },
        ]
    }
];

// New Data for AI Hub
export const chatSessions: ChatSession[] = [
    { 
        id: 'session-1', 
        title: 'Initial Brainstorm', 
        type: 'individual',
        messages: [
            { role: 'user', text: 'Let\'s start brainstorming ideas for Project Genesis.' },
            { role: 'model', text: 'Of course! Project Genesis has a lot of potential. What are the primary goals we should focus on first?' }
        ],
        lastActivity: '2 hours ago'
    },
    {
        id: 'session-2',
        title: 'UI/UX Feedback',
        type: 'individual',
        messages: [
             { role: 'user', text: 'Can you give me some feedback on this UI mockup?' },
             { role: 'model', text: 'Certainly. The color palette is very effective, but the call-to-action button could be more prominent. Have you considered increasing its size or using a contrasting color?' }
        ],
        lastActivity: 'Yesterday'
    },
    {
        id: 'session-3',
        title: 'Q3 Marketing Sync',
        type: 'group',
        members: [loggedInUser, user1, user4],
        messages: [
            { role: 'user', text: 'Hey team, let\'s sync up on the Q3 marketing plan.' },
            { role: 'model', text: 'Welcome everyone! I have the latest campaign metrics ready. Jennifer, shall we start with the social media engagement report?' }
        ],
        lastActivity: '3 days ago'
    },
    {
        id: 'session-4',
        title: 'API Integration Help',
        type: 'individual',
        messages: [
            { role: 'user', text: 'I\'m having trouble with the payment gateway API integration.' },
        ],
        lastActivity: '5 days ago'
    }
];

export const chatProjects: ChatProject[] = [
    {
        id: 'proj-1',
        name: 'Project Genesis',
        description: 'Core OS development and AI integration.',
        chatSessionIds: ['session-1', 'session-4']
    },
    {
        id: 'proj-2',
        name: 'Aetherius Marketing',
        description: 'All marketing and outreach initiatives.',
        chatSessionIds: ['session-3']
    },
];

export const creatorMarketplaceItems: MarketplaceItem[] = [
    { id: 'app-1', name: 'Nova IDE', creator: user1, type: 'App', price: 29.99, rating: 4.8, downloads: 12500, iconUrl: 'https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500', description: 'A lightweight, powerful code editor for modern web development.' },
    { id: 'plugin-1', name: 'AI Code Assistant', creator: user2, type: 'Plugin', price: 9.99, rating: 4.9, downloads: 8900, iconUrl: 'https://tailwindui.com/img/logos/mark.svg?color=purple&shade=500', description: 'Supercharge your IDE with intelligent code completions and suggestions.' },
    { id: 'theme-1', name: 'Aetherius Dark', creator: user3, type: 'Theme', price: 'Free', rating: 4.7, downloads: 54200, iconUrl: 'https://tailwindui.com/img/logos/mark.svg?color=gray&shade=500', description: 'A sleek, dark theme for the entire Aetherius OS interface.' },
    { id: 'game-1', name: 'Quantum Drift', creator: user4, type: 'Game', price: 19.99, rating: 4.6, downloads: 2100, iconUrl: 'https://tailwindui.com/img/logos/mark.svg?color=pink&shade=500', description: 'A fast-paced, futuristic racing game set in a quantum realm.' },
    { id: 'app-2', name: 'SoundWeave', creator: user5, type: 'App', price: 49.99, rating: 4.8, downloads: 7600, iconUrl: 'https://tailwindui.com/img/logos/mark.svg?color=yellow&shade=500', description: 'A professional-grade digital audio workstation (DAW).' },
    { id: 'plugin-2', name: 'Instant Translator', creator: user1, type: 'Plugin', price: 'Free', rating: 4.5, downloads: 112340, iconUrl: 'https://tailwindui.com/img/logos/mark.svg?color=green&shade=500', description: 'Translate text in any app instantly with a single click.' },
];

export const messengerUsers: { [key: string]: User } = {
    'user-0': loggedInUser,
    'user-1': user1,
    'user-2': user2,
    'user-3': user3,
    'user-4': user4,
    'user-5': user5,
};

export const messengerSessions: ChatSession[] = [
    {
        id: 'msg-1',
        title: 'Jennifer',
        type: 'individual',
        members: [loggedInUser, user1],
        lastActivity: '5m ago',
        messages: [
            { role: 'user', text: 'Hey! Are we still on for lunch today?' },
            { role: 'model', text: 'Hi! Yes, absolutely. See you at 1pm at The Corner Cafe.' },
        ],
    },
    {
        id: 'msg-2',
        title: 'Joseph',
        type: 'individual',
        members: [loggedInUser, user3],
        lastActivity: '2h ago',
        messages: [
            { role: 'model', text: 'Here is the project file you requested.' },
            { role: 'user', text: 'Thanks, I\'ll take a look now.' },
        ],
    },
    {
        id: 'msg-3',
        title: 'Adele',
        type: 'individual',
        members: [loggedInUser, user2],
        lastActivity: 'Yesterday',
        messages: [
            { role: 'model', text: 'That was a great meeting.' },
        ],
    },
    {
        id: 'msg-4',
        title: 'Emily',
        type: 'individual',
        members: [loggedInUser, user4],
        lastActivity: '3 days ago',
        messages: [
            { role: 'user', text: 'Can you resend the Q3 report?' },
        ],
    }
];

export const peopleYouMayKnowData = [
    { name: 'Kiki Dolas', imageUrl: 'https://i.imgur.com/3Y231xT.jpeg'},
    { name: 'Akweai Nyarko', imageUrl: 'https://i.imgur.com/1Z00QLB.jpeg'},
    { name: 'Sumit Kumar', imageUrl: 'https://i.imgur.com/8z3c6wF.jpeg'},
    { name: 'Alex Ar', imageUrl: 'https://i.imgur.com/h5EXj52.jpeg'},
];

export const sponsoredDataFB = [
    { title: 'Aetherius Learning Path', url: 'aetherius.os/learn', imageUrl: 'https://i.imgur.com/7SA32rT.png' },
    { title: 'Quantum Photo Editor', url: 'aetherius.os/apps/photo', imageUrl: 'https://i.imgur.com/gK9dYgI.png' },
];

export const contactsDataFB = [
    { id: 'contact-1', name: 'Aetherius AI', avatarUrl: 'https://i.imgur.com/H5bYUTW.png', online: true },
    { id: 'contact-2', name: 'Jennifer', avatarUrl: 'https://i.imgur.com/LzXVXAm.png', online: true },
];

// --- NEW SETTINGS DATA ---

export interface SettingsItem {
    id: string;
    title: string;
    icon: React.FC<any>;
    subtitle?: string;
    description?: string;
    component: string;
    type?: 'toggle' | 'link';
}

export interface SettingsCategory {
    id: string;
    title: string;
    description: string;
    icon: React.FC<any>;
    items: SettingsItem[];
}


export const settingsConfig: SettingsCategory[] = [
    {
        id: 'network',
        title: 'Network & Internet',
        description: 'Wi-Fi, Cellular, VPN, Airplane Mode',
        icon: WifiIcon,
        items: [
            { id: 'airplane_mode', title: 'Airplane Mode', icon: AirplaneIcon, type: 'toggle', component: 'placeholder' },
            { id: 'wifi', title: 'Wi-Fi', icon: WifiIcon, subtitle: "Jay's Galaxy S10 5G", component: 'network' },
            { id: 'bluetooth', title: 'Bluetooth', icon: BluetoothIcon, subtitle: 'On', component: 'placeholder' },
            { id: 'cellular', title: 'Cellular', icon: MobileDataIcon, component: 'placeholder' },
            { id: 'vpn', title: 'VPN', icon: VpnIcon, subtitle: 'Not Connected', component: 'placeholder' },
        ],
    },
    {
        id: 'personalization',
        title: 'Personalization',
        description: 'Background, themes, sounds, haptics',
        icon: PaintBrushIcon,
        items: [
            { id: 'display', title: 'Display & Brightness', icon: SunIcon, component: 'display' },
            { id: 'wallpaper', title: 'Wallpaper', icon: ImageIcon, component: 'wallpaper' },
            { id: 'sounds', title: 'Sounds & Haptics', icon: SpeakerWaveIcon, component: 'sounds' },
            { id: 'home_screen', title: 'Home Screen & App Library', icon: AppLibraryIcon, component: 'placeholder' },
            { id: 'fonts', title: 'Fonts', icon: FontsIcon, component: 'placeholder' },
        ],
    },
    {
        id: 'notifications_focus',
        title: 'Notifications & Focus',
        description: 'Alerts, do not disturb, screen time',
        icon: BellIcon,
        items: [
            { id: 'notifications', title: 'Notifications', icon: NotificationsIcon, component: 'notifications' },
            { id: 'focus', title: 'Focus', icon: FocusIcon, component: 'placeholder' },
            { id: 'screen_time', title: 'Screen Time', icon: ScreenTimeIcon, component: 'placeholder' },
        ],
    },
    {
        id: 'ai_assistant',
        title: 'Aetherius AI & Search',
        description: 'AI, search, smart features',
        icon: HiveMindIcon,
        items: [
             { id: 'ai_settings', title: 'Aetherius AI', icon: HiveMindIcon, component: 'ai_settings' },
             { id: 'search_settings', title: 'Search', icon: SearchIcon, component: 'placeholder'},
        ],
    },
    {
        id: 'accounts',
        title: 'Accounts & Cloud',
        description: 'Your accounts, cloud storage, mail',
        icon: UserCircleIcon,
        items: [
            { id: 'my_profile', title: 'My Profile', icon: UserCircleIcon, component: 'myProfile' },
            { id: 'cloud', title: 'Cloud Storage', icon: CloudStorageIcon, component: 'cloud_storage' },
            { id: 'mail_accounts', title: 'Mail', icon: MessageIcon, component: 'placeholder' },
        ]
    },
    {
        id: 'security_privacy',
        title: 'Security & Privacy',
        description: 'Permissions, passwords, biometrics',
        icon: ShieldCheckIcon,
        items: [
            { id: 'passwords', title: 'Passwords', icon: PasswordsIcon, component: 'placeholder' },
            { id: 'face_id', title: 'Face ID & Passcode', icon: FaceIdIcon, component: 'placeholder' },
            { id: 'privacy', title: 'Privacy & Security', icon: LockClosedIcon, component: 'placeholder' },
        ],
    },
     {
        id: 'general',
        title: 'General',
        description: 'About, updates, storage, language',
        icon: Cog6ToothIcon,
        items: [
            { id: 'about', title: 'About This OS', icon: InformationCircleIcon, component: 'about' },
            { id: 'software_update', title: 'Software Update', icon: SoftwareUpdateIcon, component: 'placeholder' },
            { id: 'storage', title: 'Storage', icon: StorageIcon, component: 'placeholder' },
            { id: 'control_center', title: 'Control Center', icon: ControlCenterIcon, component: 'placeholder'},
            { id: 'multitasking', title: 'Multitasking & Gestures', icon: MultitaskingIcon, component: 'placeholder' },
            { id: 'language_region', title: 'Language & Region', icon: LanguageIcon, component: 'placeholder' },
            { id: 'date_time', title: 'Date & Time', icon: ClockIcon, component: 'placeholder' },
            { id: 'keyboard', title: 'Keyboard', icon: ComputerDesktopIcon, component: 'placeholder' },
            { id: 'dictionary', title: 'Dictionary', icon: DictionaryIcon, component: 'placeholder' },
            { id: 'reset', title: 'Transfer or Reset', icon: ResetIcon, component: 'placeholder' },
            { id: 'legal', title: 'Legal & Regulatory', icon: LegalIcon, component: 'placeholder' },
            { id: 'shutdown', title: 'Shut Down', icon: PowerIcon, component: 'placeholder' },
        ],
    },
    {
        id: 'os_knowledge',
        title: 'OS Knowledge',
        description: 'Knowledge base, milestones, build checklist',
        icon: DocumentTextIcon,
        items: [
            { id: 'ok_kb', title: 'Knowledge Base', icon: DocumentTextIcon, component: 'knowledgeBase', description: 'A catalog of all concepts and technologies.' },
            { id: 'ok_milestones', title: 'Milestones', icon: ChartBarIcon, component: 'milestones', description: 'The project roadmap and feature list.' },
            { id: 'ok_checklist', title: 'Build Checklist', icon: ClipboardDocumentCheckIcon, component: 'buildChecklist', description: 'Track development progress of the OS.' },
        ],
    },
    {
        id: 'system',
        title: 'System',
        description: 'Battery, Devices, Hardware',
        icon: ChipIcon,
        items: [
             { id: 'battery', title: 'Battery', icon: BatteryIcon, component: 'placeholder' },
             { id: 'stylus', title: 'Stylus & Touch', icon: StylusIcon, component: 'stylus' },
             { id: 'trackpad_mouse', title: 'Trackpad & Mouse', icon: TrackpadIcon, component: 'trackpad_mouse' },
             { id: 'camera', title: 'Camera', icon: CameraIcon, component: 'placeholder' },
        ],
    },
    {
        id: 'accessibility',
        title: 'Accessibility',
        description: 'Vision, hearing, motor features',
        icon: UserIcon,
        items: [
             { id: 'accessibility_main', title: 'Accessibility Features', icon: UserIcon, component: 'accessibility' },
        ],
    },
     {
        id: 'apps',
        title: 'Apps',
        description: 'App library, defaults, permissions',
        icon: Squares2X2Icon,
        items: [
            { id: 'app_library', title: 'App Library', icon: AppLibraryIcon, component: 'placeholder' },
            { id: 'default_apps', title: 'Default Apps', icon: CheckCircleIcon, component: 'placeholder' },
        ],
    },
    {
        id: 'wallet',
        title: 'Wallet & Pay',
        description: 'Payment methods, cards',
        icon: WalletAndPayIcon,
        items: [
             { id: 'wallet_settings', title: 'Wallet', icon: WalletIcon, component: 'placeholder' },
        ],
    },
    {
        id: 'game_center',
        title: 'Game Center',
        description: 'Profile, friends, achievements',
        icon: GameCenterIcon,
        items: [
            { id: 'game_center_profile', title: 'Game Center', icon: GameCenterIcon, component: 'placeholder' },
        ],
    },
];

export const buildChecklistData: ChecklistCategory[] = [
  {
    id: 'core',
    name: 'Core OS Services',
    description: 'Fundamental services for OS operation.',
    icon: CubeTransparentIcon,
    items: [
      { id: 'core-1', name: 'Kernel', description: 'Manages hardware and software resources.', status: 'Completed', progress: 100, completedDate: '2024-07-21', lastModified: '2024-07-21' },
      { id: 'core-2', name: 'Memory Management', description: 'Virtual memory and process isolation.', status: 'Completed', progress: 100, completedDate: '2024-07-21', lastModified: '2024-07-21' },
      { id: 'core-3', name: 'File System (AetherFS)', description: 'Decentralized, blockchain-integrated file storage.', status: 'In Progress', progress: 75, lastModified: '2024-07-22' },
      { id: 'core-4', name: 'Process Scheduler', description: 'Manages execution of processes across computing paradigms.', status: 'In Progress', progress: 90, lastModified: '2024-07-22' },
      { id: 'core-5', name: 'Virtual Hardware Abstraction Layer', description: 'Interface between the OS and virtual components (CPU, QPU, etc.).', status: 'Completed', progress: 100, completedDate: '2024-07-21', lastModified: '2024-07-21' },
    ],
  },
  {
    id: 'multi_paradigm',
    name: 'Multi-Paradigm Core',
    description: 'Binary, Ternary, and Quantum processing units.',
    icon: ChipIcon,
    items: [
      { id: 'mp-1', name: 'Binary Processing Layer', description: 'Standard computational layer for legacy and simple tasks.', status: 'Completed', progress: 100, completedDate: '2024-07-21', lastModified: '2024-07-21' },
      { id: 'mp-2', name: 'Ternary Logic Unit', description: 'Virtual unit for processing logic with three states.', status: 'In Progress', progress: 30, lastModified: '2024-07-24' },
      { id: 'mp-3', name: 'Quantum Computing Simulator', description: 'Emulation of a quantum processor for advanced tasks.', status: 'In Progress', progress: 45, lastModified: '2024-07-24', children: [
          { id: 'mp-3-1', name: 'Virtual Qubit Emulation', description: 'Simulate quantum bits and their superposition/entanglement properties.', status: 'In Progress', progress: 50, lastModified: '2024-07-24' },
          { id: 'mp-3-2', name: 'Time Crystal Clock Integration', description: 'Theoretical integration of a time crystal for stable quantum clocking.', status: 'Not Started', progress: 0, lastModified: '2024-07-24' },
      ]},
    ],
  },
    {
    id: 'holistic_arch',
    name: 'Holistic System Architecture',
    description: 'Implementation of the complete 8-layer AI ecosystem blueprint.',
    icon: HiveMindIcon,
    items: [
        { id: 'ha-1', name: 'Multi-Modal Sensory Layer', description: 'Integrate WBEs, quantum sensors, and VR/AR interfaces.', status: 'Not Started', progress: 0 },
        { id: 'ha-2', name: 'System Orchestration Layer', description: 'Build out API Gateway, microservices, and pipeline management.', status: 'Not Started', progress: 0 },
        { id: 'ha-3', name: 'Multi-Dimensional Blockchain', description: 'Develop hierarchical blockchain for self-contained digital entities.', status: 'Not Started', progress: 0 },
        { id: 'ha-4', name: 'Virtual Quantum AI Computer', description: 'Construct the full VM with all specified quantum processes and virtual hardware.', status: 'Not Started', progress: 0 },
        { id: 'ha-5', name: 'Safety & Governance Layer', description: 'Implement ethical oversight AI and self-auditing modules.', status: 'Not Started', progress: 0 },
    ]
  },
  {
    id: 'ai_cognitive',
    name: 'AI Learning & Cognitive Core',
    description: 'The full spectrum of AI learning paradigms and capabilities.',
    icon: HiveMindIcon,
    items: [
        { id: 'aic-1', name: 'Nested Learning Framework', description: 'Architecture to combine multiple learning paradigms for complex tasks.', status: 'Not Started', progress: 0 },
        { id: 'aic-2', name: 'DeepThink (R1) Engine', description: 'Implement iterative, multi-step reasoning for complex problem solving.', status: 'In Progress', progress: 25 },
        { id: 'aic-3', name: 'Federated Learning Integration', description: 'Decentralized learning framework for privacy-preserving model training.', status: 'Not Started', progress: 0 },
        { id: 'aic-4', name: 'Neuro-Symbolic Reasoning Engine', description: 'Hybrid engine for explainable, logic-driven AI.', status: 'Not Started', progress: 0 },
        { id: 'aic-5', name: 'AGI & ASI Simulation Environment', description: 'A sandboxed environment for theoretical modeling of advanced AI capabilities.', status: 'Not Started', progress: 0 },
        { id: 'aic-6', name: 'Hive/Singular Mind Model', description: 'Develop the dual-processing architecture for collective and individual intelligence.', status: 'Not Started', progress: 0 },
    ],
  },
  {
    id: 'ai_robotics',
    name: 'AI & Robotics Framework',
    description: 'Core AI models, agent architecture, and robotics control.',
    icon: BeakerIcon,
    items: [
      { id: 'ai-r-1', name: 'Nested AI Agent Handler', description: 'Primary AI core capable of delegating tasks to specialized sub-agents.', status: 'In Progress', progress: 65, lastModified: '2024-07-24' },
      { id: 'ai-r-2', name: 'Robotics Control Module', description: 'API and driver layer for controlling robotic functions.', status: 'Not Started', progress: 0, lastModified: '2024-07-24', children: [
        { id: 'ai-r-2-1', name: 'Boston Dynamics Atlas 4.0 Integration', description: 'Interface with full body control system and NVIDIA Jetson chip.', status: 'Not Started', progress: 0 },
        { id: 'ai-r-2-2', name: 'Apptronik Apollo Integration', description: 'Interface with advanced force control architecture.', status: 'Not Started', progress: 0 },
        { id: 'ai-r-2-3', name: 'Robotics Takeover Protocol', description: 'Design the secure adapter/middleware for deploying personal AIs onto third-party robots.', status: 'Not Started', progress: 0 },
      ]},
    ]
  },
  {
    id: 'ai_cloning',
    name: 'AI Avatar Cloning Module',
    description: 'Framework for creating digital replicas of the user or unique AI entities.',
    icon: UserCircleIcon,
    items: [
      { id: 'ac-1', name: 'Data Ingestion Pipeline', description: 'Securely process user voice, video, and text data for training.', status: 'Not Started', progress: 0 },
      { id: 'ac-2', name: 'Voice Cloning Engine', description: 'Integrate or build a high-fidelity text-to-speech model for voice replication.', status: 'Not Started', progress: 0 },
      { id: 'ac-3', name: '3D Avatar Generation Engine', description: 'Reconstruct 3D avatars from video/images and generate novel appearances.', status: 'Not Started', progress: 0 },
      { id: 'ac-4', name: 'Personalized AI Core', description: 'Fine-tune an LLM on user-provided data to replicate conversational style and learn patterns.', status: 'In Progress', progress: 40 },
    ],
  },
    {
    id: 'governance',
    name: 'Governance & Compliance',
    description: 'User voting, compliance frameworks, and ethical AI laws.',
    icon: ShieldCheckIcon,
    items: [
      { id: 'gov-1', name: 'User Governance & Voting Protocol', description: 'Implement on-chain, weighted voting system for non-critical changes.', status: 'Not Started', progress: 0 },
      { id: 'gov-2', name: 'Global Compliance Module', description: 'Integrate checks for GDPR, CCPA, HIPAA, ISO 27001, etc.', status: 'Not Started', progress: 0 },
      { id: 'gov-3', name: 'Ethical AI Framework', description: 'Codify and enforce the core ethical laws for all AI agents.', status: 'In Progress', progress: 50 },
      { id: 'gov-4', name: 'Multi-Proof Consensus Engine', description: 'Build a flexible consensus layer supporting various proof-of mechanisms.', status: 'Not Started', progress: 0 },
    ],
  },
    {
    id: 'hardware_integration',
    name: 'Hardware & Wearables',
    description: 'Integration with physical devices.',
    icon: ChipIcon,
    items: [
        { id: 'hw-1', name: 'Wearable AI Device Layer', description: 'Support for watches, rings, glasses, and AI Pins.', status: 'Not Started', progress: 0 },
        { id: 'hw-2', name: 'Bio-Synced Identity Module', description: 'Framework for multi-modal biometric authentication (face, finger, plasma, DNA scan concept).', status: 'Not Started', progress: 0 },
    ]
  },
   {
    id: 'network_data',
    name: 'Network & Data Ingestion',
    description: 'Secure data scraping and network-level processing.',
    icon: GlobeAltIcon,
    items: [
      { id: 'nd-1', name: 'Onion Router Implementation', description: 'Build and sandbox the internal Tor-style client for data scraping.', status: 'Not Started', progress: 0 },
    ],
  },
  {
    id: 'game_engine',
    name: 'Universal Game Engine',
    description: 'A cross-platform game engine integrated with the core OS and AI.',
    icon: GameControllerIcon,
    items: [
      { id: 'ge-ui', name: 'Engine Core UI', description: 'Build the main editor interface including viewport, inspector, and hierarchy panels.', status: 'In Progress', progress: 50 },
      { id: 'ge-1', name: 'Nested VM & Quantum Core Integration', description: 'Integrate the engine with nested virtualization and quantum co-processors.', status: 'In Progress', progress: 20 },
      { id: 'ge-2', name: 'Multi-Paradigm Renderer', description: 'Build a universal renderer for 2D, 3D, VR/AR, and superfluid light.', status: 'Not Started', progress: 0 },
    ],
  },
    {
    id: 'internal_platforms',
    name: 'Internal Platform Clones',
    description: 'Building from-scratch versions of popular third-party services.',
    icon: BuildingStorefrontIcon,
    items: [
      { id: 'ip-1', name: 'E-commerce & CMS Engine', description: 'Internal fork of Shopify and WordPress functionalities.', status: 'Not Started', progress: 0 },
      { id: 'ip-2', name: 'Automation Engine', description: 'Internal fork of Zapier/Make for event-driven workflows.', status: 'Not Started', progress: 0 },
      { id: 'ip-3', name: 'Content Creation Suite', description: 'Internal forks of Midjourney, Runway, 11 Labs, etc.', status: 'Not Started', progress: 0 },
      { id: 'ip-4', name: 'Trading & Finance Platform', description: 'Internal platform with AI bots, "forever trading", and advanced market analysis.', status: 'Not Started', progress: 0 },
    ],
  },
];


// --- MOCK DATA FOR NEW TRADING COMPONENTS ---

export const tradingAssets = [
    { symbol: 'AOS', name: 'Aetherius OS', price: 1250.75, change: 25.50, changePercent: 2.08, marketCap: 1.25e12, volume24h: 4.5e9, logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500', assetClass: 'Crypto' as AssetClass },
    { symbol: 'BTC', name: 'Bitcoin', price: 65034.15, change: -1205.42, changePercent: -1.82, marketCap: 1.28e12, volume24h: 2.2e10, logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/btc.svg', assetClass: 'Crypto' as AssetClass },
    { symbol: 'ETH', name: 'Ethereum', price: 3502.80, change: 15.60, changePercent: 0.45, marketCap: 4.2e11, volume24h: 1.5e10, logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/eth.svg', assetClass: 'Crypto' as AssetClass },
    { symbol: 'TSLA', name: 'Tesla, Inc.', price: 180.25, change: 5.75, changePercent: 3.29, marketCap: 5.75e11, volume24h: 9.8e9, logoUrl: 'https://companieslogo.com/img/orig/TSLA.D-11aaa693.png?t=1633534343', assetClass: 'Stocks' as AssetClass },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 172.50, change: -1.12, changePercent: -0.65, marketCap: 2.65e12, volume24h: 8.5e9, logoUrl: 'https://companieslogo.com/img/orig/AAPL.D-15335544.png?t=1633534343', assetClass: 'Stocks' as AssetClass },
    { symbol: 'EUR/USD', name: 'Euro/US Dollar', price: 1.0855, change: 0.0012, changePercent: 0.11, logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/eur.svg', assetClass: 'Forex' as AssetClass },
    { symbol: 'XAU/USD', name: 'Gold/US Dollar', price: 2350.50, change: -15.20, changePercent: -0.64, logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/xau.svg', assetClass: 'Commodities' as AssetClass },
];

// FIX: Add and export missing data
export const achievements: Achievement[] = [
  {
    id: 'achieve-1',
    courseTitle: 'React - The Complete Guide',
    completionDate: '2024-07-20',
    transactionId: `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    certificateUrl: 'https://i.imgur.com/example-cert.png',
  }
];

export const stakingPools: StakingPool[] = [
    { id: 'aos-stake', asset: { symbol: 'AOS', name: 'Aetherius OS', logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500' }, apy: 12.5, tvl: 75000000, lockupPeriod: 'Flexible' },
    { id: 'eth-stake', asset: { symbol: 'ETH', name: 'Ethereum', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/eth.svg' }, apy: 4.8, tvl: 1200000000, lockupPeriod: '30 Days' },
    { id: 'usdc-stake', asset: { symbol: 'USDC', name: 'USD Coin', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/usdc.svg' }, apy: 8.2, tvl: 500000000, lockupPeriod: 'Flexible' },
];

export const tradingBots: TradingBot[] = [
    { id: 'bot-1', name: 'BTC/USDT Grid', strategy: 'Grid Trading', pair: 'BTC/USDT', status: 'Running', pnl: 152.75, runtime: '12d 5h' },
    { id: 'bot-2', name: 'ETH DCA', strategy: 'DCA Bot', pair: 'ETH/USDT', status: 'Running', pnl: 88.12, runtime: '30d 1h' },
    { id: 'bot-3', name: 'Portfolio Rebalancer', strategy: 'Rebalancing', pair: 'VARIOUS', status: 'Stopped', pnl: -12.50, runtime: '5d 2h' },
];

export const tradingNews: NewsArticle[] = [
    { id: 'news-1', source: 'CoinDesk', title: 'Bitcoin ETF Inflows Surge as Market Sentiment Improves', timestamp: '2h ago', imageUrl: 'https://images.unsplash.com/photo-1640955032549-3c739112bf47?q=80&w=400', category: 'Crypto' },
    { id: 'news-2', source: 'Bloomberg', title: 'Analysts Predict Volatility Ahead of Options Expiry', timestamp: '5h ago', imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=400', category: 'World Markets' },
    { id: 'news-3', source: 'Reuters', title: 'Forex Markets Brace for Central Bank Announcements', timestamp: '8h ago', imageUrl: 'https://images.unsplash.com/photo-1559163499-413811443ab4?q=80&w=400', category: 'Forex' },
];

export const loanableAssets: LoanableAsset[] = [
    { symbol: 'BTC', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/btc.svg', supplyApy: 3.12, borrowApy: 4.55, totalSupplied: 1.2e9, totalBorrowed: 8e8 },
    { symbol: 'ETH', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/eth.svg', supplyApy: 2.89, borrowApy: 4.15, totalSupplied: 2.5e9, totalBorrowed: 1.5e9 },
    { symbol: 'USDC', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/usdc.svg', supplyApy: 5.50, borrowApy: 7.25, totalSupplied: 5e9, totalBorrowed: 3.8e9 },
];

export const topCopyTraders: User[] = [user1, user2, user3];

export const learnAndEarnCourses: LearnAndEarnCourse[] = [
    { id: 'le-1', title: 'What is Bitcoin?', asset: { symbol: 'BTC', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/btc.svg' }, reward: 10, duration: '10 min', lessons: 3 },
    { id: 'le-2', title: 'Intro to Smart Contracts', asset: { symbol: 'ETH', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/eth.svg' }, reward: 10, duration: '15 min', lessons: 4 },
    { id: 'le-3', title: 'Understanding Stablecoins', asset: { symbol: 'USDC', logoUrl: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/usdc.svg' }, reward: 5, duration: '8 min', lessons: 2 },
];