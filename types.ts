

export enum MeetingType {
  IEP = 'IEP Meeting',
  PARENT_TEACHER = 'Parent-Teacher Conference',
  BEHAVIORAL = 'Behavioral Intervention',
  ACADEMIC = 'Academic Check-in',
  PLANNING = 'Lesson Planning',
  OTHER = 'Other'
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'Teacher' | 'Head of Year' | 'DSL' | 'Admin';
  initials: string;
}

export interface ActionItem {
  id: string;
  task: string;
  status: 'Pending' | 'Completed';
}

export interface MeetingLog {
  id: string;
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

export type ViewState = 'DASHBOARD' | 'NEW_LOG' | 'HISTORY' | 'STUDENT_PROFILE' | 'STUDENTS_DIRECTORY' | 'SAFEGUARDING' | 'REPORTS' | 'BEHAVIOUR' | 'SEATING_PLAN';