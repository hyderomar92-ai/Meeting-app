
import { GoogleGenAI, Type } from "@google/genai";
import { MeetingLog, SafeguardingCase } from "../types";

// Ideally, this service handles all AI interactions.
// We use gemini-2.5-flash for speed and efficiency in text processing.

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface EnhancedNotesResponse {
  summary: string;
  actionItems: string[];
  sentiment: 'Positive' | 'Neutral' | 'Concerned';
}

export interface SafeguardingReportResponse {
  dslSummary: string;
  chronology: string[];
  keyEvidence: string[];
  evidenceAnalysis: string;
  policiesApplied: string[];
  witnessQuestions: string[];
  nextSteps: string[];
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  sentiment: 'Critical' | 'Serious' | 'Cautionary' | 'Routine';
}

export interface GeneratedReportResponse {
  title: string;
  period: string;
  executiveSummary: string;
  keyStrengths: string[];
  areasForGrowth: string[];
  attendanceTrend: string;
  actionPlan: string[];
}

export const enhanceMeetingNotes = async (rawNotes: string): Promise<EnhancedNotesResponse> => {
  // Fallback immediately if no key (development mode safety)
  if (!apiKey) {
    console.warn("No API Key provided for Gemini. Using fallback.");
    return {
      summary: rawNotes,
      actionItems: ["(AI Unavailable) Review notes manually."],
      sentiment: 'Neutral'
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert educational assistant helping a teacher document a meeting. Analyze the following raw notes:
      
      "${rawNotes}"

      1. **Summary**: Create a professional, concise summary of the interaction.
      2. **Action Items**: Extract any explicit tasks mentioned. **CRITICAL**: If no specific tasks are written, SUGGEST 2-3 logical, professional follow-up steps the teacher should take based on the context (e.g., "Schedule follow-up meeting", "Send progress report to parents", "Monitor attendance for next week").
      3. **Sentiment**: Determine if the tone is Positive, Neutral, or Concerned.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A polished summary of the meeting." },
            actionItems: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of extracted or suggested action items."
            },
            sentiment: { 
              type: Type.STRING, 
              enum: ["Positive", "Neutral", "Concerned"],
              description: "The overall sentiment of the interaction."
            }
          },
          required: ["summary", "actionItems", "sentiment"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from AI");
    
    return JSON.parse(text) as EnhancedNotesResponse;
  } catch (error) {
    console.error("Error enhancing notes:", error);
    // Graceful fallback to prevent UI crash
    return {
      summary: rawNotes, // Use original notes as summary
      actionItems: ["Could not generate action items. Please add manually."],
      sentiment: 'Neutral'
    };
  }
};

export const generateSafeguardingReport = async (
  studentName: string, 
  description: string,
  evidenceLogs: MeetingLog[] = []
): Promise<SafeguardingReportResponse> => {
  
  // Format evidence for the prompt
  const evidenceContext = evidenceLogs.map(l => 
    `[LOG DATE: ${l.date} | TYPE: ${l.type}] Notes: ${l.notes} (Sentiment: ${l.sentiment})`
  ).join('\n');

  if (!apiKey) {
    console.warn("No API Key provided for Gemini.");
    return {
      dslSummary: `Manual Entry for ${studentName}: ${description.substring(0, 50)}...`,
      chronology: ["Incident recorded"],
      keyEvidence: ["Evidence log checking unavailable in demo mode"],
      evidenceAnalysis: "Demo mode: Unable to analyze patterns.",
      policiesApplied: ["Standard Safeguarding Policy"],
      witnessQuestions: ["Who observed the incident?"],
      nextSteps: ["Notify DSL", "Log in secure file"],
      riskLevel: 'Medium',
      sentiment: 'Serious'
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a Designated Safeguarding Lead (DSL) and expert in school behavioral compliance. 
      
      A teacher has reported an incident involving student: ${studentName}.
      
      CURRENT INCIDENT DESCRIPTION:
      "${description}"

      ATTACHED EVIDENCE (Past Logs & Interactions):
      ${evidenceContext || "No past logs attached."}

      Generate a formal Safeguarding & Behaviour Case File.
      1. **DSL Summary**: Professional, objective summary suitable for a legal file.
      2. **Chronology**: Extract a timeline of events from the current incident.
      3. **Key Evidence**: Analyze the "Attached Evidence" and the current description. List specific quotes, dates of previous behavior, or patterns that substantiate this case.
      4. **Evidence Analysis**: Synthesize the key evidence. Are there specific recurring patterns (e.g. "happens every Monday", "always during Math")? Is the behavior escalating in severity? Is it isolated? Provide a concise analytical paragraph highlighting these trends.
      5. **Policies Applied**: List standard school policies relevant to this incident (e.g., Anti-Bullying, Physical Intervention, Peer-on-Peer Abuse, Online Safety, Attendance Policy).
      6. **Witness Questions**: Draft 3-5 specific, non-leading questions to ask witnesses to investigate further.
      7. **Next Steps**: Provide immediate and long-term actions required.
      8. **Risk Level**: Assess risk based on the description and any escalating patterns in the evidence.
      9. **Sentiment**: Analyze the urgency.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dslSummary: { type: Type.STRING },
            chronology: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyEvidence: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific facts, quotes, or patterns that serve as evidence." },
            evidenceAnalysis: { type: Type.STRING, description: "Analysis of patterns, frequency, triggers, or escalation based on the evidence." },
            policiesApplied: { type: Type.ARRAY, items: { type: Type.STRING } },
            witnessQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
            sentiment: { type: Type.STRING, enum: ["Critical", "Serious", "Cautionary", "Routine"] }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from AI");

    return JSON.parse(text) as SafeguardingReportResponse;
  } catch (error) {
    console.error("Error generating safeguarding report:", error);
    // Graceful fallback
    return {
      dslSummary: "System Error: Could not generate AI report. Please complete manually.",
      chronology: ["Incident occurred"],
      keyEvidence: ["System Error"],
      evidenceAnalysis: "System Error",
      policiesApplied: ["Check School Policy"],
      witnessQuestions: ["N/A"],
      nextSteps: ["Manual Review Required"],
      riskLevel: 'Medium',
      sentiment: 'Serious'
    };
  }
};

export const generateComprehensiveReport = async (
  type: 'STUDENT' | 'CLASS',
  logs: MeetingLog[],
  safeguarding: SafeguardingCase[],
  name: string,
  startDate: string,
  endDate: string,
  studentProfile?: any,
  audience: 'PARENTS' | 'SLT' | 'DSL' | 'TEACHER' | 'EXTERNAL' = 'PARENTS'
): Promise<GeneratedReportResponse> => {

  const contextData = logs.map(l => `Date: ${l.date}, Type: ${l.type}, Notes: ${l.notes}, Outcome/Sentiment: ${l.sentiment}`).join('\n');
  const safetyData = safeguarding.map(s => `Date: ${s.date}, Incident: ${s.incidentType}, Summary: ${s.generatedReport.dslSummary}, Risk: ${s.generatedReport.riskLevel}`).join('\n');

  let profileContext = "";
  if (studentProfile) {
      profileContext = `
      STUDENT PROFILE CONTEXT:
      Name: ${studentProfile.name}
      Class: ${studentProfile.studentClass || "N/A"}
      ID: ${studentProfile.id}
      Nationality: ${studentProfile.nationality || "N/A"}
      Parent/Guardian: ${studentProfile.fatherName || studentProfile.motherName || "Unknown"}
      Contact: ${studentProfile.fatherEmail || studentProfile.motherEmail || "N/A"}
      `;
  }

  // Audience Instructions
  const audienceInstructions = {
    'PARENTS': `Tone: Professional but accessible, supportive, partnership-oriented. Avoid internal jargon. Focus on wellbeing, progress, social development, and how the home can support the school. Highlight strengths warmly.`,
    'SLT': `Tone: Formal, concise, data-driven, executive. Focus on attainment, attendance stats, behavioral trends, and high-level strategic interventions. Minimize fluff.`,
    'DSL': `Tone: Strictly formal, objective, factual, legalistic. Focus on risk levels, specific chronology of incidents, disclosure details, and compliance with statutory frameworks.`,
    'TEACHER': `Tone: Professional, practical, collaborative. Focus on classroom strategies, specific learning gaps, behavioral triggers, and peer-to-peer advice.`,
    'EXTERNAL': `Tone: Formal, objective, detached. Focus on factual history, support needs, and inter-agency cooperation requirements.`,
  };

  if (!apiKey) {
    return {
      title: `${type === 'STUDENT' ? 'Student' : 'Class'} Progress Report`,
      period: `${startDate} to ${endDate}`,
      executiveSummary: "Demo Mode: API Key missing. This represents a summary of interactions.",
      keyStrengths: ["Participation", "Attendance"],
      areasForGrowth: ["Homework submission"],
      attendanceTrend: "Consistent",
      actionPlan: ["Review goals next term"]
    };
  }

  try {
    const prompt = `
      You are a senior educator writing a formal report.
      
      **TARGET AUDIENCE**: ${audience}
      **AUDIENCE INSTRUCTION**: ${audienceInstructions[audience]}

      Report Subject: ${type === 'STUDENT' ? `Individual Student Report for ${name}` : `Class/General Report for ${name}`}
      Period: ${startDate} to ${endDate}
      
      ${profileContext}

      Based ONLY on the provided interaction logs and safeguarding records, generate a comprehensive report tailored specifically for the target audience.
      
      Interaction Logs (Filtered):
      ${contextData.length > 0 ? contextData : "No specific meeting logs found matching the filter criteria."}

      Safeguarding/Behavioral Incidents (If applicable):
      ${safetyData.length > 0 ? safetyData : "No safeguarding incidents recorded in this period."}

      Tasks:
      1. **Executive Summary**: A paragraph summarizing the progress/behavior/engagement. Tone must match the audience.
      2. **Key Strengths**: List 3-4 positive observations.
      3. **Areas for Growth**: List 2-3 specific areas needing improvement or attention.
      4. **Attendance/Engagement Trend**: One word or short phrase (e.g., "Improving", "Inconsistent", "Excellent").
      5. **Action Plan**: 3-4 concrete, actionable recommendations appropriate for the specific audience to read.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            period: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasForGrowth: { type: Type.ARRAY, items: { type: Type.STRING } },
            attendanceTrend: { type: Type.STRING },
            actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from AI");
    
    return JSON.parse(text) as GeneratedReportResponse;
  } catch (error) {
    console.error("Error generating report:", error);
     return {
      title: "Report Generation Failed",
      period: `${startDate} to ${endDate}`,
      executiveSummary: "An error occurred while communicating with the AI service.",
      keyStrengths: [],
      areasForGrowth: [],
      attendanceTrend: "Unknown",
      actionPlan: ["Try again later"]
    };
  }
};
