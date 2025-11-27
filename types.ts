
import React from 'react';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface WindowState {
  id: string;
  title: string;
  icon: React.FC<any>;
  component: string;
  context?: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMaximized: boolean;
  isMinimized: boolean;
  workspace: number; // 0, 1, 2, etc.
}

export interface MenuItemData {
  title?:string;
  icon?: React.FC<any>;
  component?: string;
  children?: MenuItemData[];
  type?: 'item' | 'divider' | 'title';
  action?: string | (() => void);
}

export interface MenuGroup {
  id: string;
  title: string;
  icon: React.FC<any>;
  children: MenuItemData[];
  type: 'group';
}

export interface TaskbarConfig {
    position: 'bottom' | 'top' | 'left' | 'right';
    alignment: 'start' | 'center';
    color: string;
    transparency: number; // 0-100
    showLabels: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'text' | 'quiz';
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: number;
  title: string;
  instructor: string;
  rating: number;
  students: number;
  price: number;
  imageUrl: string;
  category: string;
  description: string;
  longDescription: string;
  whatYoullLearn: string[];
  modules: Module[];
  // New fields for Mega Platform
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  certificate?: boolean;
}

export interface SystemIdentity {
    governmentName?: string;
    userId: string;
    aiCoreName: string;
    aiNickname: string;
    aiId: string;
    osId: string;
    networkId: string;
    accountTier: 'verified' | 'anonymous';
    kycStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
    verificationLevel?: 'None' | 'Tier 1 (Basic)' | 'Tier 2 (Full Financial)';
    ageGroup?: 'Child' | 'Teen' | 'Adult';
    govtIdNumber?: string;
    buildType: 'Genesis' | 'Child' | 'Grandchild';
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string | null;
  username?: string;
  email?: string;
  bio?: string;
  socials?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
  role?: string;
  joinedDate?: string;
  followersCount?: number;
  followingCount?: number;
  online?: boolean;
  coverImageUrl?: string;
  roi?: number;
  riskScore?: number;
  followers?: number;
  systemIdentity?: SystemIdentity;
  
  // Mega Learning Extensions
  learning?: {
      points: number;
      level: number;
      streak: number;
      certificates: string[];
  };
  instructorProfile?: InstructorProfile;
  blockchainCV?: BlockchainCV;
}

export interface InstructorProfile {
    totalStudents: number;
    totalEarnings: number;
    averageRating: number;
    courses: Course[];
    payoutMethod: string;
}

export interface BlockchainCredential {
    id: string;
    name: string;
    issuer: string;
    issueDate: string;
    hash: string;
    skills: string[];
    url: string;
}

export interface BlockchainCV {
    id: string;
    credentials: BlockchainCredential[];
    verifiedSkills: string[];
    lastUpdated: string;
    profileHash: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  timestamp: string;
}

export type PostMedia = 
    | { type: 'video'; thumbnailUrl: string; duration: string; }
    | { type: 'code'; filename: string; content: string; }
    | { type: 'image'; url: string; }
    | { type: 'file'; filename: string; size: string; };

export interface Post {
  id: string;
  author: User;
  timestamp: string;
  content?: string;
  media?: PostMedia;
  likes: User[];
  comments: Comment[];
  group?: string;
  subAuthor?: string;
  coverImage?: string;
}

export interface Blog {
    id: string;
    title: string;
    date: string;
    imageUrl: string;
}

export interface Group {
  id: string;
  name: string;
  coverImageUrl: string;
  avatarUrl: string;
  privacy: 'Public' | 'Private';
  type: string;
  members: number;
  memberAvatars: (string | null)[];
  isOrganizer: boolean;
  lastActive: string;
}

// --- Social Platform Architecture Types ---

export type ChannelType = 'text' | 'voice' | 'video' | 'forum' | 'announcement';

export interface SocialChannel {
    id: string;
    name: string;
    type: ChannelType;
    unreadCount?: number;
    isPrivate?: boolean;
    activeUsers?: number; // For voice/video
}

export interface SocialCommunity {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    bannerUrl: string;
    memberCount: number;
    onlineCount: number;
    category: string;
    channels: SocialChannel[];
    roles?: string[];
}

export interface SocialStream {
    id: string;
    broadcaster: User;
    title: string;
    category: string;
    viewers: number;
    thumbnailUrl: string;
    isLive: boolean;
    tags: string[];
}

export interface AppItem {
    id: string;
    type: 'app';
    title: string;
    icon: React.FC<any>;
    component: string;
}

export interface FolderItem {
    id: string;
    type: 'folder';
    title: string;
    children: AppItem[];
}

export type DesktopItem = AppItem | FolderItem;

export interface ChatSession {
  id: string;
  title: string;
  type: 'individual' | 'group';
  messages: ChatMessage[];
  members?: User[];
  lastActivity: string;
}

export interface ChatProject {
  id: string;
  name: string;
  description: string;
  chatSessionIds: string[]; 
}

// --- Commerce Types ---
export type MarketplaceItemType = 'App' | 'Plugin' | 'Theme' | 'Game' | 'Digital Asset' | 'Physical Product' | 'Software' | 'Subscription';
export type CommerceSource = 'ecommerce' | 'marketplace';
export type DeliveryMethod = 'shipping' | 'digital-download' | 'app-install' | 'service-activation';

// Extended Technical Data for Product Information System
export interface TechnicalSpecification {
    patentNumber?: string;
    patentStatus?: 'Pending' | 'Granted' | 'Expired';
    blueprints?: { title: string; url: string }[];
    circuitDiagrams?: { title: string; url: string }[];
    materials?: { name: string; percentage?: string }[];
    processSteps?: string[];
    weight?: string;
    dimensions?: string;
}

// Smart Contract Licensing Options
export interface SmartContractOption {
    id: string;
    type: 'One-Time' | 'Monthly' | 'Quarterly' | 'Yearly' | 'Per-Unit Royalty';
    price: number;
    currency: 'Æ' | 'USD' | 'ETH';
    terms: string;
    rights: string[];
}

export interface MarketplaceItem {
  id: string;
  name: string;
  creator: User;
  type: MarketplaceItemType;
  price: number | 'Free';
  rating: number;
  downloads?: number;
  stock?: number; // For physical items
  iconUrl: string;
  description: string;
  category?: string;
  
  // Unified Commerce Fields
  source: CommerceSource;
  deliveryMethod: DeliveryMethod;
  
  // Digital Product Specifics
  digitalType?: 'cad' | 'software' | 'ebook' | 'pdf' | 'none';
  fileFormat?: string;
  fileSize?: string;
  
  // Software/App Specifics
  version?: string;
  systemRequirements?: string;
  
  // CAD Specifics
  is3DViewable?: boolean;

  // Product Information System (New)
  technicalSpecs?: TechnicalSpecification;
  licensingOptions?: SmartContractOption[];
  relatedCourseIds?: number[]; // Links to Learning courses
}

// Health & Wellness Data Structures
export interface BodyCompositionRow {
  feature: string;
  dexa: string;
  mri: string;
  bia: string;
}

export interface BodyCompositionInDepth {
  id: 'dexa' | 'mri' | 'bia';
  title: string;
  principle: string;
  primaryUse: { title: string; points: string[] };
  pros: string;
  cons: string;
}

export interface FrequencyHealingConcept {
  id: string;
  title: string;
  icon: React.FC<any>;
  content: string[];
}

export interface HealingWebAilment {
  ailment: string;
  pharma: {
    points: string[];
  };
  nature: {
    points: string[];
  };
}

export interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string;
}

export interface DirtyFood {
  title: string;
  description: string;
}

export interface HealthWellnessData {
  bodyComposition: {
    table: BodyCompositionRow[];
    inDepth: BodyCompositionInDepth[];
  };
  frequencyHealing: FrequencyHealingConcept[];
  healingWeb: HealingWebAilment[];
  nutrition: {
    cleanRecipes: Recipe[];
    dirtyFoods: DirtyFood[];
  };
}

// OS Knowledge & Build Data
export type KnowledgeBaseStatus = 'Concept Phase' | 'R&D Phase' | 'Theoretical Phase' | 'Integrated' | 'Deployed' | 'In Development' | 'Optimizing' | 'Design Phase' | 'Awaiting Build' | 'Architecting' | 'Foundational';

export interface KnowledgeBaseItem {
  id: string;
  name: string;
  details: string;
  status: KnowledgeBaseStatus;
  progress: number; // 0-100
}

export interface MilestoneItem {
  id: string;
  title: string;
  description?: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Not Started';
  progress: number; // 0-100
}

export interface MilestonesData {
  projectMilestones: MilestoneItem[];
  technicalBreakdown: MilestoneItem[];
  platformFeatureMilestones: MilestoneItem[];
}

// OS Build Checklist Data Structures
export type ChecklistStatus = 'Completed' | 'In Progress' | 'Not Started';

export interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  status: ChecklistStatus;
  progress?: number; // 0-100
  children?: ChecklistItem[];
  component?: string;
  completedDate?: string;
  lastModified?: string;
}

export interface ChecklistCategory {
  id: string;
  name: string;
  description: string;
  icon: React.FC<any>;
  items: ChecklistItem[];
}

// --- Trading Platform Data Structures ---
export type AssetClass = 'Crypto' | 'Stocks' | 'Forex' | 'Commodities';

export interface TradingAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume24h?: number;
  logoUrl: string;
  assetClass: AssetClass;
}

export interface StakingPool {
    id: string;
    asset: {
        symbol: string;
        name: string;
        logoUrl: string;
    };
    apy: number;
    tvl: number; // Total Value Locked in USD
    lockupPeriod: string;
}

export interface NewsArticle {
    id: string;
    source: string;
    title: string;
    timestamp: string;
    imageUrl: string;
    category: 'Crypto' | 'Forex' | 'World Markets' | 'Analysis';
}

export interface LoanableAsset {
    symbol: string;
    logoUrl: string;
    supplyApy: number;
    borrowApy: number;
    totalSupplied: number;
    totalBorrowed: number;
}

export interface TradingBot {
    id: string;
    name: string;
    strategy: 'Grid Trading' | 'DCA Bot' | 'Rebalancing';
    pair: string;
    status: 'Running' | 'Stopped';
    pnl: number; // Profit and Loss
    runtime: string;
}

export interface LearnAndEarnCourse {
    id: string;
    title: string;
    asset: {
        symbol: string;
        logoUrl: string;
    };
    reward: number;
    duration: string;
    lessons: number;
}

export interface AssetMetric {
  label: string;
  value: string;
}

export interface AssetNews {
  id: string;
  source: string;
  title: string;
  time: string;
}

export interface AiTradingPlatform {
    id: string;
    name: string;
    category: 'Stock' | 'Crypto' | 'Forex' | 'Multi-Asset';
    description: string;
    features: string[];
    pricing: string;
    bestFor: string[];
    strengths: string[];
    weaknesses: string[];
    pros: string[];
    cons: string[];
    logoUrl?: string;
}

// --- E-Learning AI Assistant ---
export interface LearningPath {
  title: string;
  description: string;
  steps: {
    courseId: number;
    rationale: string;
  }[];
}

export interface Achievement {
  id: string;
  courseTitle: string;
  completionDate: string;
  transactionId: string;
  certificateUrl: string;
}

// --- AI Support Avatar ---
export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'processing';
  title: string;
  message: string;
  duration?: number;
}

export interface AITask {
  id: string;
  name: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface AgentChatMessage {
    id: string;
    role: 'user' | 'agent' | 'system' | 'tool';
    content: string;
    timestamp: string;
}

// --- Network Orchestrator ---
export type ServerStatus = 'Online' | 'Degraded' | 'Offline';

export interface Server {
    id: string;
    name: string;
    status: ServerStatus;
    cpu: number;
    memory: number;
}

export interface RpcLog {
    id: string;
    timestamp: string;
    method: string;
    source: string;
    status: 'Success' | 'Failed';
}

// --- Training Data Hub ---
export interface TrainingDataSample {
    id: string;
    input: string;
    output: string;
    intent: string;
}

// --- AI Workforce Orchestrator ---
export type AIAgentStatus = 'Idle' | 'Working' | 'Reporting' | 'Awaiting Task';
export type ProcessingMode = 'Singular Mind' | 'Hive Mind' | 'Dual Processing' | 'Deep Think (R1)';

export interface AIAgentProfile {
  id: string;
  name: string;
  role: 'Parent' | 'Manager' | 'Employee';
  specialization: string;
  status: AIAgentStatus;
  mode: ProcessingMode;
}

export interface AIAgentTask {
    id: string;
    description: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Requires Review';
    assignee?: string; // Agent ID
    report?: string;
}

export interface AIDepartment {
    id: string;
    name: string;
    manager: AIAgentProfile;
    employees: AIAgentProfile[];
    tasks: AIAgentTask[];
}

// --- AI Memory Node ---
export interface MemoryVector {
    id: string;
    content: string;
    embedding: number[];
    timestamp: string;
    type: 'Conversation' | 'Document' | 'Code' | 'System';
    score?: number;
}

// --- Blockchain & Consensus ---
export type ConsensusMechanism = 
    | 'Proof-of-Work' 
    | 'Proof-of-Stake' 
    | 'Delegated Proof-of-Stake' 
    | 'Proof-of-Authority' 
    | 'Proof-of-History'
    | 'Proof-of-Reputation';

export interface Validator {
    id: string;
    name: string;
    stake: number;
    reputation: number;
    isAuthority: boolean;
    status: 'Active' | 'Jailed' | 'Inactive';
    votes?: number;
}

export interface Transaction {
    hash: string;
    type: 'CERTIFICATE_MINT' | 'AI_INTERACTION_VERIFIED' | 'GOVERNANCE_VOTE' | 'ASSET_TRANSFER' | 'REPUTATION_SLASH' | 'VALIDATOR_ELECTION';
    details: any;
}

export interface Block {
    height: number;
    hash: string;
    timestamp: string;
    transactions: Transaction[];
    consensusType: ConsensusMechanism;
    validator: string;
}

// --- NEW OS BUILD DATA STRUCTURES ---
// ERP System
export interface ErpFeature {
  id: string;
  name: string;
  description: string;
}

export interface ErpModule {
  id: string;
  name: 'Finance' | 'Supply Chain' | 'Human Resources' | 'Manufacturing' | 'CRM';
  icon: React.FC<any>;
  description: string;
  features: ErpFeature[];
}

export interface ErpSystemSpec {
  name: string;
  version: string;
  modules: ErpModule[];
}

// Quantum Network
export interface QuantumProtocol {
  id: string;
  name: 'Quantum Key Distribution (QKD)' | 'Post-Quantum Cryptography' | 'Quantum Teleportation (Theoretical)';
  description: string;
  status: 'In Development' | 'Research' | 'Integrated';
}

export interface QuantumHardwareSpec {
    id: string;
    component: 'vQPU' | 'Quantum Interconnect' | 'Time Crystal Oscillator';
    specification: string;
    status: 'Simulated' | 'Theoretical';
}

export interface QuantumNetworkSpec {
    name: string;
    protocols: QuantumProtocol[];
    hardware: QuantumHardwareSpec[];
}

// Reputation System
export interface ReputationAction {
    id: string;
    action: string;
    points: number;
    category: 'Community' | 'Commerce' | 'Learning' | 'Content Creation';
    description: string;
}

export interface ReputationTier {
    level: number;
    name: string;
    minPoints: number;
    rewards: string[];
}

export interface ReputationSystemSpec {
    actions: ReputationAction[];
    tiers: ReputationTier[];
}

// Media Content
export interface Article {
    id: string;
    title: string;
    author: string;
    category: 'OS Development' | 'Tech Explainers' | 'Community Guides' | 'Case Studies';
    tags: string[];
    content: string;
    publicationDate: string;
}

// --- NEW CAREERS MODULE STRUCTURES ---
export interface Company {
    id: string;
    name: string;
    description: string;
    industry: string;
    size: string;
    website: string;
    locations: string[];
    logoUrl: string;
    verified: boolean;
}

export interface Job {
    id: number;
    title: string;
    company: string; // Company Name
    companyId?: string;
    location: string;
    type: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance' | 'Internship';
    salary: string;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    tags: string[];
    logoUrl: string;
    description?: string;
    postedDate?: string;
    category?: string;
    requirements?: string[];
}

export interface FreelanceProject {
    id: string;
    title: string;
    description: string;
    category: string;
    skills: string[];
    budget: {
        type: 'fixed' | 'hourly';
        min: number;
        max: number;
        currency: string;
    };
    duration: string;
    clientName: string;
    postedDate: string;
    proposalsCount: number;
}

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
