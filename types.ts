

export enum MeetingType {
  IEP = 'IEP Meeting',
  PARENT_TEACHER = 'Parent-Teacher Conference',
  BEHAVIORAL = 'Behavioral Intervention',
  ACADEMIC = 'Academic Check-in',
  PLANNING = 'Lesson Planning',
  OTHER = 'Other'
}

export type UserRole = 'Teacher' | 'Head of Year' | 'DSL' | 'Admin' | 'Super Admin';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  initials: string;
  orgId?: string; // Links user to specific tenant
  email?: string;
  lastLogin?: string;
  status?: 'Active' | 'Locked' | 'Suspended';
}

export interface Organization {
  id: string;
  name: string;
  type: 'School' | 'College' | 'University';
  status: 'Active' | 'Trial' | 'Suspended';
  licenseTier: 'Starter' | 'Pro' | 'Enterprise';
  studentCount: number;
  staffCount: number;
  renewalDate: string;
  logo?: string;
  // New fields for AI Monitoring
  tokenUsageCurrentPeriod: number;
  tokenLimit: number;
  aiCostEstimate: number;
  // Feature Flags
  features: {
    safeguarding: boolean;
    aiAssistant: boolean;
    parentPortal: boolean;
  };
  churnRisk?: 'Low' | 'Medium' | 'High';
}

export interface ActionItem {
  id: string;
  task: string;
  status: 'Pending' | 'Completed';
}

export interface MeetingLog {
  id: string;
  orgId?: string; // Tenancy
  date: string;
  time: string;
  attendees: string[]; // List of names (Students, Parents, etc.)
  type: MeetingType;
  notes: string;
  actionItems: ActionItem[];
  sentiment?: 'Positive' | 'Neutral' | 'Concerned'; // AI inferred
  createdBy?: string; // Name of the user who created this log
}

export interface BehaviourEntry {
  id: string;
  orgId?: string; // Tenancy
  studentName: string;
  studentClass?: string;
  date: string;
  type: 'POSITIVE' | 'NEGATIVE';
  category: string;
  points: number;
  description?: string;
  loggedBy: string;
}

export interface StudentStats {
  name: string;
  totalMeetings: number;
  lastMeeting: string;
  types: Record<string, number>;
}

export interface SafeguardingCase {
  id: string;
  orgId?: string; // Tenancy
  studentName: string;
  date: string;
  incidentType: string;
  rawDescription: string;
  relatedLogIds?: string[]; // IDs of attached evidence logs
  generatedReport: {
    dslSummary: string;
    chronology: string[];
    keyEvidence: string[]; // Explicit evidence cited by AI
    evidenceAnalysis?: string; // AI synthesis of patterns/trends
    policiesApplied: string[];
    witnessQuestions: string[];
    nextSteps: string[];
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    sentiment: 'Critical' | 'Serious' | 'Cautionary' | 'Routine';
  };
  status: 'Open' | 'Investigating' | 'Closed';
  createdBy?: string; // Name of the user who filed this case
  isConfidential?: boolean; // New flag for sensitive cases
  resolutionNotes?: string; // Notes on how the case was resolved
  completedSteps?: string[]; // Array of completed next steps/actions
  updatedAt?: string; // Timestamp of last update
}

export interface GeneratedReport {
  title: string;
  period: string;
  studentName?: string;
  executiveSummary: string;
  keyStrengths: string[];
  areasForGrowth: string[];
  attendanceTrend: string; // e.g. "Consistent", "Declining"
  actionPlan: string[];
}

export interface RiskAlert {
  studentName: string;
  riskScore: number; // 0-100
  riskFactor: string; // e.g. "Sudden Isolation + Negative Sentiment"
  details: string; // "3 negative logs in 1 week + recess isolation"
  suggestedIntervention: string;
}

export interface Desk {
  id: string;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  studentId?: string; // If null, empty desk
  type: 'STUDENT' | 'TEACHER' | 'DOOR' | 'BOARD' | 'GROUP_TABLE' | 'RESOURCE';
}

export interface SeatingLayout {
  id: string;
  name: string; // Name of the plan (e.g. "Standard", "Exam Mode")
  className: string;
  desks: Desk[];
  updatedAt: string;
}

export type ViewState = 
  | 'DASHBOARD' 
  | 'NEW_LOG' 
  | 'HISTORY' 
  | 'STUDENT_PROFILE' 
  | 'STUDENTS_DIRECTORY' 
  | 'CLASS_OVERVIEW'
  | 'SAFEGUARDING' 
  | 'REPORTS' 
  | 'BEHAVIOUR' 
  | 'SEATING_PLAN' 
  | 'SUPER_ADMIN_DASHBOARD' 
  | 'SUPER_ADMIN_TENANTS'
  | 'SUPER_ADMIN_AI'
  | 'SUPER_ADMIN_SECURITY'
  | 'SUPER_ADMIN_TOOLS'
  | 'SUPER_ADMIN_OPS'
  | 'SUPER_ADMIN_SUBSCRIPTIONS'
  | 'SUPER_ADMIN_INTEGRATIONS'
  | 'SUPER_ADMIN_DATA'
  | 'SUPER_ADMIN_RESOURCES'
  | 'SUPER_ADMIN_BRANDING'
  | 'SUPER_ADMIN_FEEDBACK'
  | 'ORG_SETTINGS'
  | 'IT_DASHBOARD'
  | 'IT_USERS'
  | 'IT_ASSETS'
  | 'IT_DATA'
  | 'IT_HELPDESK';

export interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  studentClass?: string;
  nationality?: string;
  gender?: string;
  qId?: string;
  dob?: string;
  
  // Parent/Guardian Details
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
}

// Super Admin Types

export interface LicenseKey {
    key: string;
    tier: 'Starter' | 'Pro' | 'Enterprise';
    durationDays: number;
    generatedDate: string;
    status: 'Active' | 'Used' | 'Expired';
}

export interface GlobalAIConfig {
    safeguardingSensitivity: 'Standard' | 'Strict' | 'Lenient';
    baseSystemPrompt: string;
    excludedKeywords: string[];
}

export interface SystemAnnouncement {
    id: string;
    message: string;
    type: 'Info' | 'Warning' | 'Critical';
    active: boolean;
    expiresAt: string;
}

export interface Subscription {
    id: string;
    orgId: string;
    orgName: string;
    plan: 'Starter' | 'Pro' | 'Enterprise';
    amount: number;
    billingCycle: 'Monthly' | 'Annual';
    nextBillingDate: string;
    status: 'Active' | 'Past Due' | 'Trial' | 'Canceled';
    paymentMethod: 'Card' | 'Invoice' | 'Bank Transfer';
}

export interface Integration {
    id: string;
    name: string;
    category: string;
    status: 'Active' | 'Maintenance' | 'Beta' | 'Disabled';
    connectedTenants: number;
    icon: string;
    description: string;
}

export interface DataExportJob {
    id: string;
    orgName: string;
    requestDate: string;
    status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
    size: string;
    type: string;
}

export interface ResourceItem {
    id: string;
    title: string;
    category: 'Guide' | 'Template' | 'Policy' | 'Other';
    targetTier: 'All' | 'Pro' | 'Enterprise';
    uploadDate: string;
    fileType: 'PDF' | 'DOCX' | 'Video' | 'Other';
    downloadCount: number;
}

export interface FeedbackItem {
    id: string;
    user: string;
    orgName: string;
    type: 'Bug' | 'Feature' | 'General';
    message: string;
    status: 'New' | 'Reviewing' | 'Planned' | 'Shipped';
    date: string;
    priority: 'Low' | 'Medium' | 'High';
}

export interface AppThemeConfig {
    appName: string;
    primaryColor: string;
    logoUrl: string;
    loginBackgroundUrl?: string;
}

// IT Admin Types
export interface Device {
  id: string;
  serialNumber: string;
  type: 'Laptop' | 'Tablet' | 'Interactive Panel' | 'Desktop';
  assignedTo?: string; // User Name or Room Number
  status: 'Active' | 'Repair' | 'Lost' | 'Storage';
  lastCheckIn: string;
  model: string;
}

export interface SupportTicket {
  id: string;
  requester: string;
  role: string;
  subject: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  date: string;
  category: 'Account' | 'Hardware' | 'Network' | 'Software';
}

export interface SyncLog {
    id: string;
    system: 'SIMS' | 'Wonde' | 'Google' | 'Arbor';
    status: 'Success' | 'Failed' | 'Partial';
    recordsProcessed: number;
    timestamp: string;
    message?: string;
}