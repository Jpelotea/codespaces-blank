export type EvidenceStatus = 'DRAFT' | 'USER_CONFIRMED' | 'SOURCE_BACKED';

export type EvidenceOrigin =
  | 'manual'
  | 'resume_import'
  | 'portfolio_import'
  | 'legacy'
  | 'demo'
  | 'generated';

export interface EvidenceMeta {
  status: EvidenceStatus;
  origin: EvidenceOrigin;
  sourceRef?: string;
  confirmedAt?: string;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  period: string;
  isRemote: boolean;
  roleType: 'Executive Assistant' | 'Business Operations' | 'Virtual Assistant' | 'AI Workflow' | 'General';
  description: string;
  verifiedAchievements: string[];
  toolsUsed: string[];
  evidence?: EvidenceMeta;
}

export interface SkillItem {
  name: string;
  level: 'Expert' | 'Proficient' | 'Familiar';
  isVerified: boolean;
  yearsExperience?: number;
  evidence?: EvidenceMeta;
}

export interface SkillCategory {
  id: string;
  categoryName: string;
  skills: SkillItem[];
}

export interface PortfolioProject {
  id: string;
  title: string;
  roleCategory: 'Executive Support' | 'Workflow Automation' | 'Business Operations' | 'Project Management';
  description: string;
  verifiedImpactMetric?: string;
  toolsUsed: string[];
  deliverableSnippetOrLink?: string;
  evidence?: EvidenceMeta;
}

export interface ApplicationAnswerBankItem {
  id: string;
  prompt: string;
  verifiedResponse: string;
  tags: string[];
  evidence?: EvidenceMeta;
}

export interface UserProfile {
  /** Version 2 adds evidence metadata while remaining readable from legacy records. */
  schemaVersion?: 2;
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  timezone: string;
  targetRoles: string[];
  yearsExperience?: number;
  executiveSummary: string;
  verifiedOnlyMode: boolean; // legacy profile preference; does not establish evidence status or guarantee AI behavior
  workExperiences: WorkExperience[];
  skillCategories: SkillCategory[];
  portfolioProjects: PortfolioProject[];
  answerBank: ApplicationAnswerBankItem[];
  headlineEvidence?: EvidenceMeta;
  yearsExperienceEvidence?: EvidenceMeta;
  executiveSummaryEvidence?: EvidenceMeta;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  roleType: 'Executive Assistant' | 'Business Operations' | 'Virtual Assistant' | 'AI Workflow' | 'Other';
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Fractional';
  salaryOrRate: string;
  sourceUrl?: string;
  description: string;
  parsedRequirements: string[];
  detectedTechStack: string[];
}

export interface StrengthMatch {
  requirement: string;
  matchingExperience: string;
  sourceContext: string;
  status?: 'MATCH' | 'PARTIAL_MATCH' | 'GAP' | 'UNKNOWN';
}

export interface GapAnalysisItem {
  gap: string;
  severity: 'Low' | 'Medium' | 'High';
  honestBridgeStrategy: string;
}

export interface JobFitAnalysis {
  overallScore: number;
  verdictSummary: string;
  scores: {
    experienceAlignment: number;
    skillRelevance: number;
    toolCompetency: number;
    remoteReadiness: number;
  };
  strengths: StrengthMatch[];
  gaps: GapAnalysisItem[];
  recommendedProjects: {
    projectId: string;
    projectTitle: string;
    whyRelevant: string;
  }[];
  strategicAdvice: string[];
}

export interface TailoredResumeContent {
  targetedSummary: string;
  highlightedCoreSkills: string[];
  alignedRoleBullets: {
    roleTitle: string;
    company: string;
    bullets: string[];
  }[];
  atsKeywords: string[];
}

export interface CoverLetterPitch {
  pitchType: 'executive_formal' | 'conversational_modern' | 'upwork_proposal' | 'direct_inbound';
  subjectLine: string;
  letterBody: string;
}

export interface ApplicationScreeningAnswer {
  question: string;
  tailoredAnswer: string;
  verifiedBackingDetail: string;
}

export interface TailoredMaterials {
  resume: TailoredResumeContent;
  coverLetter: CoverLetterPitch;
  screeningAnswers: ApplicationScreeningAnswer[];
  disclaimer?: string;
  generatedAt?: string;
}

export interface StarAnswer {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface PredictedInterviewQuestion {
  id: string;
  category: 'Executive Scenarios' | 'Workflow & AI Tech' | 'Prioritization & Deadlines' | 'Remote Operations';
  question: string;
  interviewerIntent: string;
  starAnswer: StarAnswer;
}

export interface SmartQuestionForInterviewer {
  topic: string;
  question: string;
  rationale: string;
}

export interface InterviewPrepPlan {
  roleOverview: string;
  keyThemesToEmphasize: string[];
  predictedQuestions: PredictedInterviewQuestion[];
  smartQuestionsToAsk: SmartQuestionForInterviewer[];
}

export interface FollowUpDraft {
  actionType: 'Post-Application (5-Day)' | 'Post-Interview Thank You' | 'Status Check-In' | 'Counter-Offer / Next Steps';
  suggestedTiming: string;
  subject: string;
  body: string;
}

export type ApplicationStatus =
  | 'Discovered'
  | 'Ready to Apply'
  | 'Applied'
  | 'Screening'
  | 'Interviewing'
  | 'Offer'
  | 'Archived'
  | 'Rejected'
  | 'Withdrawn';

export interface ApplicationRecord {
  id: string;
  job: JobPosting;
  status: ApplicationStatus;
  fitScore: number;
  dateAdded: string;
  dateApplied?: string;
  applicationDeadline?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewType?: 'Screening' | 'Technical / Task' | 'Hiring Manager' | 'Final Round' | 'Panel';
  nextFollowUpDate?: string;
  nextActionNote?: string;
  fitAnalysis?: JobFitAnalysis;
  materials?: TailoredMaterials;
  interviewPrep?: InterviewPrepPlan;
  followUpDrafts?: FollowUpDraft[];
  notes: string;
  contactName?: string;
  contactEmail?: string;
  updatedAt?: string;
  rejectionReason?: string;
}
