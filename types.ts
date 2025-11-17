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
  // For copy trading
  roi?: number;
  riskScore?: number;
  followers?: number;
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
  // For new feed design
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
  type: string; // e.g., 'Club', 'Meetup', 'Group'
  members: number;
  memberAvatars: (string | null)[];
  isOrganizer: boolean;
  lastActive: string;
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

export type MarketplaceItemType = 'App' | 'Plugin' | 'Theme' | 'Game' | 'Digital Asset';

export interface MarketplaceItem {
  id: string;
  name: string;
  creator: User;
  type: MarketplaceItemType;
  price: number | 'Free';
  rating: number;
  downloads: number;
  iconUrl: string;
  description: string;
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
}

export interface MilestonesData {
  projectMilestones: string[];
  technicalBreakdown: string[];
  platformFeatureMilestones?: string[];
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
  certificateUrl: string; // URL to a mock certificate image
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
export type ProcessingMode = 'Singular Mind' | 'Hive Mind' | 'Dual Processing';

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