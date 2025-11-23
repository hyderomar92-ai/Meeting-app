
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

export type ViewState = 'DASHBOARD' | 'NEW_LOG' | 'HISTORY' | 'STUDENT_PROFILE' | 'STUDENTS_DIRECTORY' | 'SAFEGUARDING' | 'REPORTS';