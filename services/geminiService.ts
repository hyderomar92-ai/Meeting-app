
import { GoogleGenAI, Type } from "@google/genai";
import { MeetingLog, SafeguardingCase, BehaviourEntry, RiskAlert, StudentStats } from "../types";
import { STUDENTS } from "../data/students";

// Ideally, this service handles all AI interactions.
// We use gemini-2.5-flash for speed and efficiency in text processing.

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Centralized Error Handling Helper
const handleAIError = (error: any, actionDescription: string): never => {
  console.error(`AI Error [${actionDescription}]:`, error);

  const msg = (error.message || '').toLowerCase();

  // Network / Connectivity
  if (msg.includes('fetch failed') || msg.includes('network') || msg.includes('connection')) {
      throw new Error("Network Error: Unable to connect to AI service. Please check your internet connection.");
  }

  // Authentication & Permissions
  if (msg.includes('401') || msg.includes('api key') || msg.includes('unauthorized')) {
      throw new Error("Authentication Error: Invalid API Key. Please check your configuration.");
  }
  if (msg.includes('403') || msg.includes('permission') || msg.includes('location')) {
      throw new Error("Access Denied: AI service not available in your region or account restriction.");
  }

  // Resource & Limits
  if (msg.includes('429') || msg.includes('quota') || msg.includes('exhausted') || msg.includes('too many requests')) {
      throw new Error("Rate Limit Exceeded: The system is busy. Please wait a moment and try again.");
  }
  if (msg.includes('503') || msg.includes('overloaded')) {
      throw new Error("Service Overloaded: Google AI is currently experiencing high traffic. Please retry shortly.");
  }

  // Model & Request Issues
  if (msg.includes('400') || msg.includes('invalid argument')) {
      throw new Error("Request Error: The provided input data was invalid.");
  }
  if (msg.includes('404') || msg.includes('not found')) {
      throw new Error("Configuration Error: The selected AI model is currently unavailable.");
  }
  
  // Safety Filters
  if (msg.includes('safety') || msg.includes('blocked') || msg.includes('harmful')) {
      throw new Error("Safety Block: The AI response was blocked by safety filters. Please refine your input.");
  }

  // Parsing / Internal
  if (msg.includes('parse') || msg.includes('json') || msg.includes('empty response')) {
      throw new Error("Processing Error: Received invalid data format from AI. Please try again.");
  }

  // Default fallback
  throw new Error(`An unexpected error occurred while ${actionDescription}.`);
};

// Helper to reliably parse JSON from AI responses which might include Markdown code blocks
const cleanAndParseJSON = (text: string): any => {
  if (!text) throw new Error("Empty response from AI");
  try {
    let clean = text.trim();
    // Remove markdown code blocks if present
    clean = clean.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find the first '{' or '[' and the last '}' or ']' to handle extra text
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    
    let startIdx = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
        startIdx = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
        startIdx = firstBrace;
    } else if (firstBracket !== -1) {
        startIdx = firstBracket;
    }

    if (startIdx !== -1) {
        const lastBrace = clean.lastIndexOf('}');
        const lastBracket = clean.lastIndexOf(']');
        const endIdx = Math.max(lastBrace, lastBracket);
        if (endIdx > startIdx) {
            clean = clean.substring(startIdx, endIdx + 1);
        }
    }

    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    console.log("Raw text was:", text);
    throw new Error("Failed to parse AI response. The model may have returned invalid JSON.");
  }
};

export interface LogAnalysisResponse {
  summary: string;
  actionItems: string[];
  sentiment: 'Positive' | 'Neutral' | 'Concerned';
  detectedAttendees: string[];
  location: string;
  safeguarding: {
    flagged: boolean;
    reason?: string;
    riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  };
}

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

export interface CertificateResponse {
    title: string;
    message: string;
    awardType: string;
}

export const analyzeLogEntry = async (rawNotes: string, language: string = 'en'): Promise<LogAnalysisResponse> => {
    if (!apiKey) {
         return {
            summary: rawNotes,
            actionItems: [],
            sentiment: 'Neutral',
            detectedAttendees: [],
            location: 'Unknown',
            safeguarding: { flagged: false }
        };
    }

    const studentNames = STUDENTS.map(s => s.name).join(', ');

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
            Analyze the following meeting/observation notes for a school context.

            NOTES:
            "${rawNotes}"

            KNOWN STUDENTS LIST:
            [${studentNames}]

            TASKS:
            1. **Identify Attendees**: Extract names of students mentioned. Match loosely against the "KNOWN STUDENTS LIST" if possible.
            2. **Summarize**: Create a concise summary in ${language}.
            3. **Action Items**: Extract actionable tasks in ${language}.
            4. **Sentiment**: 'Positive', 'Neutral', or 'Concerned'.
            5. **Location**: Infer the location (e.g., Classroom, Playground) if mentioned or implied.
            6. **Safeguarding Scan**: CRITICAL. Detect if this entry describes bullying, abuse, neglect, radicalization, or serious behavioral incidents. 
               - Set 'flagged' to true if ANY risk is detected.
               - Assign a 'riskLevel' (Low/Medium/High/Critical).
               - Provide a short 'reason' for the flag.

            Output strictly JSON.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                        sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Concerned"] },
                        detectedAttendees: { type: Type.ARRAY, items: { type: Type.STRING } },
                        location: { type: Type.STRING },
                        safeguarding: {
                            type: Type.OBJECT,
                            properties: {
                                flagged: { type: Type.BOOLEAN },
                                reason: { type: Type.STRING },
                                riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] }
                            },
                            required: ["flagged"]
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response from AI");
        return cleanAndParseJSON(text) as LogAnalysisResponse;
    } catch (e) {
        handleAIError(e, "analyzing log entry");
    }
};

export const enhanceMeetingNotes = async (rawNotes: string, language: string = 'en'): Promise<EnhancedNotesResponse> => {
  if (!apiKey) {
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

      1. **Summary**: Create a professional, concise summary of the interaction in ${language}.
      2. **Action Items**: Extract extracted tasks or suggest 2-3 logical follow-up steps in ${language}.
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
    if (!text) throw new Error("Empty response from AI");
    
    return cleanAndParseJSON(text) as EnhancedNotesResponse;
  } catch (error) {
    handleAIError(error, "enhancing notes");
  }
};

export const generateSmartActions = async (notes: string, language: string = 'en'): Promise<string[]> => {
  if (!apiKey) return ["Review notes and define next steps", "Follow up with student in 1 week"];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Analyze the following meeting notes and generate a list of 4-6 specific, actionable, and distinct "SMART" (Specific, Measurable, Achievable, Relevant, Time-bound) action items.
        
        The actions should be practical next steps for the teacher, parent, or student.
        Output ONLY a JSON array of strings.
        Output Language: ${language}

        NOTES:
        "${notes}"
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return cleanAndParseJSON(text) as string[];
  } catch (e) {
    handleAIError(e, "generating actions");
  }
};

export const generateSafeguardingReport = async (
  studentName: string, 
  description: string,
  evidenceLogs: MeetingLog[] = [],
  language: string = 'en'
): Promise<SafeguardingReportResponse> => {
  
  const evidenceContext = evidenceLogs.map(l => 
    `[LOG DATE: ${l.date} | TYPE: ${l.type}] Notes: ${l.notes} (Sentiment: ${l.sentiment})`
  ).join('\n');

  if (!apiKey) {
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

      Generate a formal Safeguarding & Behaviour Case File. IMPORTANT: Output all text fields in ${language} language.
      1. **DSL Summary**: Professional, objective summary suitable for a legal file.
      2. **Chronology**: Extract a timeline of events from the current incident.
      3. **Key Evidence**: Analyze the "Attached Evidence" and the current description. List specific quotes, dates of previous behavior, or patterns that substantiate this case.
      4. **Evidence Analysis**: Synthesize the key evidence. Are there specific recurring patterns?
      5. **Policies Applied**: List standard school policies relevant to this incident.
      6. **Witness Questions**: Draft 3-5 specific, non-leading questions to ask witnesses.
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
            keyEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
            evidenceAnalysis: { type: Type.STRING },
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
    if (!text) throw new Error("Empty response from AI");

    return cleanAndParseJSON(text) as SafeguardingReportResponse;
  } catch (error) {
    handleAIError(error, "generating safeguarding report");
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
  audience: 'PARENTS' | 'SLT' | 'DSL' | 'TEACHER' | 'EXTERNAL' = 'PARENTS',
  language: string = 'en'
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
      `;
  }

  const audienceInstructions = {
    'PARENTS': `Tone: Professional but accessible, supportive, partnership-oriented.`,
    'SLT': `Tone: Formal, concise, data-driven, executive.`,
    'DSL': `Tone: Strictly formal, objective, factual, legalistic.`,
    'TEACHER': `Tone: Professional, practical, collaborative.`,
    'EXTERNAL': `Tone: Formal, objective, detached.`,
  };

  if (!apiKey) {
    return {
      title: `${type === 'STUDENT' ? 'Student' : 'Class'} Progress Report`,
      period: `${startDate} to ${endDate}`,
      executiveSummary: "Demo Mode: API Key missing.",
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
      **OUTPUT LANGUAGE**: ${language}

      Report Subject: ${type === 'STUDENT' ? `Individual Student Report for ${name}` : `Class/General Report for ${name}`}
      Period: ${startDate} to ${endDate}
      
      ${profileContext}

      Based ONLY on the provided interaction logs and safeguarding records, generate a comprehensive report.
      
      Interaction Logs:
      ${contextData.length > 0 ? contextData : "No specific meeting logs found matching the filter criteria."}

      Safeguarding/Behavioral Incidents:
      ${safetyData.length > 0 ? safetyData : "No safeguarding incidents recorded in this period."}

      Tasks (Respond in ${language}):
      1. **Executive Summary**: A paragraph summarizing the progress/behavior/engagement.
      2. **Key Strengths**: List 3-4 positive observations.
      3. **Areas for Growth**: List 2-3 specific areas needing improvement.
      4. **Attendance/Engagement Trend**: One word or short phrase.
      5. **Action Plan**: 3-4 concrete, actionable recommendations.
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
    if (!text) throw new Error("Empty response from AI");
    
    return cleanAndParseJSON(text) as GeneratedReportResponse;
  } catch (error) {
    handleAIError(error, "generating comprehensive report");
  }
};

export const scanForRisks = async (logs: MeetingLog[], behavior: BehaviourEntry[], language: string = 'en'): Promise<RiskAlert[]> => {
    if (!apiKey) return [];

    const studentMap = new Map<string, string[]>();
    const recentLogs = logs.slice(0, 50); 
    
    recentLogs.forEach(l => {
        l.attendees.forEach(s => {
            if(!studentMap.has(s)) studentMap.set(s, []);
            studentMap.get(s)?.push(`LOG [${l.date}]: (${l.sentiment}) ${l.notes}`);
        });
    });

    behavior.slice(0, 50).forEach(b => {
        if(!studentMap.has(b.studentName)) studentMap.set(b.studentName, []);
        studentMap.get(b.studentName)?.push(`BEHAVIOR [${b.date}]: (${b.type}) ${b.category} - ${b.description || ''}`);
    });

    let context = "";
    studentMap.forEach((history, name) => {
        if(history.length > 1) { 
             context += `\nSTUDENT: ${name}\n${history.join('\n')}\n`;
        }
    });

    if (!context) return [];

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
            Analyze the following student interaction logs and behavior entries.
            Identify students exhibiting "emerging risks" based on patterns like:
            - Social isolation or withdrawal
            - Spikes in negative sentiment
            - escalating behavioral sanctions
            - sudden drop in engagement

            Return a JSON array of students with a risk score > 50.
            The 'riskFactor', 'details', and 'suggestedIntervention' fields must be in ${language}.
            
            DATA:
            ${context}
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            studentName: { type: Type.STRING },
                            riskScore: { type: Type.NUMBER, description: "Risk score from 0 to 100" },
                            riskFactor: { type: Type.STRING, description: "Short title of the risk factor" },
                            details: { type: Type.STRING, description: "One sentence explanation of the pattern" },
                            suggestedIntervention: { type: Type.STRING, description: "One sentence suggested intervention" }
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response from AI");
        return cleanAndParseJSON(text) as RiskAlert[];
    } catch (e) {
        handleAIError(e, "scanning for risks");
    }
}

export const querySentinel = async (
    query: string,
    dataContext: {
        logs: MeetingLog[];
        safeguarding: SafeguardingCase[];
        behavior: BehaviourEntry[];
    },
    language: string = 'en'
): Promise<string> => {
    if (!apiKey) return "Sentinel Intelligence is unavailable in demo mode (Missing API Key).";

    const logsSummary = dataContext.logs.slice(0, 30).map(l => 
        `- ${l.date} (${l.type}): ${l.notes.substring(0, 100)}... [Attendees: ${l.attendees.join(', ')}]`
    ).join('\n');

    const safetySummary = dataContext.safeguarding.map(s => 
        `- CASE ${s.id}: ${s.studentName} - ${s.incidentType} (Status: ${s.status}, Risk: ${s.generatedReport.riskLevel})`
    ).join('\n');

    const behaviorStats: Record<string, number> = {};
    dataContext.behavior.forEach(b => {
        behaviorStats[b.studentName] = (behaviorStats[b.studentName] || 0) + b.points;
    });
    const behaviorSummary = Object.entries(behaviorStats)
        .map(([name, points]) => `${name}: ${points} pts`)
        .join(', ');

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
            You are "Sentinel", an intelligent assistant for a school safeguarding and education platform.
            
            Current System Data:
            [RECENT LOGS]
            ${logsSummary || "No recent logs."}

            [SAFEGUARDING]
            ${safetySummary || "No active cases."}

            [BEHAVIOR]
            ${behaviorSummary || "No behavior data."}

            USER QUERY: "${query}"

            Instructions:
            1. Answer the user's question based strictly on the data provided.
            2. Be professional, concise, and helpful.
            3. Answer in the following language: ${language}.
            4. If the data is not available, state so clearly in ${language}.
            `,
        });

        return response.text || "I processed the data but couldn't generate a text response.";
    } catch (e) {
        handleAIError(e, "processing chat query");
    }
};

export const generateCertificateContent = async (
    studentName: string,
    positiveLogs: string[],
    merits: string[],
    language: string = 'en'
): Promise<CertificateResponse> => {
     if (!apiKey) return {
         title: "Certificate of Excellence",
         message: `Congratulations to ${studentName} for their outstanding performance. Keep up the great work!`,
         awardType: "General Excellence"
     };

     try {
         const response = await ai.models.generateContent({
             model: "gemini-2.5-flash",
             contents: `
             Generate content for a school "Certificate of Praise" for student: ${studentName}.
             
             Context of their success:
             POSITIVE LOGS:
             ${positiveLogs.join('\n')}

             BEHAVIOR MERITS:
             ${merits.join('\n')}

             Language: ${language}

             Tasks:
             1. Create a catchy 'title' (e.g. "Star of the Week", "Resilience Award").
             2. Write a short, inspiring 'message' (2-3 sentences) specifically mentioning why they are receiving this, referencing the context provided.
             3. Define an 'awardType' (e.g. Academic, Behavioral, Leadership).
             `,
             config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                     type: Type.OBJECT,
                     properties: {
                         title: { type: Type.STRING },
                         message: { type: Type.STRING },
                         awardType: { type: Type.STRING }
                     }
                 }
             }
         });
         
         const text = response.text;
         if(!text) throw new Error("Empty response from AI");
         return cleanAndParseJSON(text) as CertificateResponse;
     } catch (e) {
         handleAIError(e, "generating certificate");
     }
}
