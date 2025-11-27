
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
  allowedYearGroups?: string[]; // RBAC Scope: e.g., ["07", "08"]
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
  createdAt?: string; // ISO Timestamp for DB
  updatedAt?: string; // ISO Timestamp for DB
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
  createdAt?: string; // ISO Timestamp for DB
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
  createdAt?: string; // ISO Timestamp for DB
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
