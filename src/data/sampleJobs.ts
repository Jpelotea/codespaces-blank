import { JobPosting, ApplicationRecord } from '../types';

export const SAMPLE_JOB_PRESETS: JobPosting[] = [
  {
    id: "job-preset-1",
    title: "Executive Assistant to Founder & CEO",
    company: "Aura Health AI (Series A)",
    location: "Remote (US / Americas Timezones)",
    roleType: "Executive Assistant",
    employmentType: "Full-time",
    salaryOrRate: "$70,000 - $85,000 / year",
    sourceUrl: "https://jobs.aurahealth.ai/careers/executive-assistant",
    description: `About the Role:
We are looking for an exceptional, proactive Executive Assistant to be the true strategic right-hand to our Founder & CEO. Aura Health AI is an AI-native healthcare infrastructure platform. The CEO's day is relentless: investor pitches, technical deep-dives, board meetings, customer discussions, and international conference keynotes.

Key Responsibilities:
- Master calendar management: protect executive focus blocks, ruthlessly prioritize meetings, and deconflict multi-party timezone schedules across PST/EST/GMT.
- Inbox triage & ghostwriting: manage high-volume executive email, draft thoughtful responses in the CEO's voice, and ensure zero VIP inquiries fall through the cracks.
- Executive briefing & preparation: prepare daily agendas, compile background research on prospective investors/clients, and track follow-up action items.
- Travel & logistics: coordinate multi-city domestic and international travel, lodging, private transport, and contingency plans.
- Meeting facilitation: capture crisp action items in leadership syncs and hold stakeholders accountable.
- Leverage modern AI tools (Gemini, Claude, Zapier) to automate daily administrative bottlenecks.

Qualifications & Experience:
- 4+ years of experience as an Executive Assistant supporting C-suite or startup founders in a fast-paced or remote environment.
- Mastery of Google Workspace, Slack, Notion, and modern scheduling tools.
- Demonstrated experience building or using AI automation tools (Zapier, LLM prompts) to increase personal leverage.
- Extreme discretion, high emotional intelligence, and impeccable written English communication.
- Proactive problem solver who anticipates needs 3 steps ahead.`,
    parsedRequirements: [
      "4+ years C-suite or startup founder EA experience",
      "Mastery of multi-timezone calendar scheduling & focus protection",
      "Executive inbox triage, zero-inbox discipline & ghostwriting",
      "AI workflow tools & automation experience (Zapier, Gemini)",
      "High-touch domestic & international travel coordination",
      "Meeting action item tracking and leadership accountability"
    ],
    detectedTechStack: ["Google Workspace", "Notion", "Slack", "Zapier", "Gemini", "Superhuman"]
  },
  {
    id: "job-preset-2",
    title: "Remote Business Operations Specialist",
    company: "Kinetix Workflow Systems",
    location: "Remote (Worldwide)",
    roleType: "Business Operations",
    employmentType: "Full-time",
    salaryOrRate: "$65,000 - $80,000 / year",
    sourceUrl: "https://kinetix.co/roles/bizops-specialist",
    description: `Kinetix is a 100% remote software studio. We help enterprises optimize asynchronous business processes. We need a detail-obsessed Business Operations Specialist to keep our client delivery, knowledge base, billing processes, and internal tooling operating like clockwork.

What you'll do:
- Own and optimize our company-wide Notion knowledge base, project trackers, and standard operating procedures (SOPs).
- Coordinate monthly billing, client invoicing, contractor agreements, and budget reconciliation with our finance team.
- Streamline client onboarding pipelines using automation tools like Zapier, Make, and Airtable.
- Monitor team KPIs, prepare weekly operational dashboards, and flag delivery bottlenecks.
- Support executive leadership on ad-hoc strategic projects, board prep, and vendor evaluations.

Requirements:
- 3+ years in Business Operations, Project Coordination, or Operations Management in a remote company.
- Deep expertise in Notion, ClickUp/Asana, Airtable, and Google Sheets.
- Hands-on experience with workflow automations (Zapier, Make.com, webhooks).
- Strong numerical aptitude, invoice tracking, and contract management basics.
- Clear, empathetic asynchronous communication skills.`,
    parsedRequirements: [
      "3+ years experience in Business Operations or remote Project Coordination",
      "Advanced Notion, Airtable, and ClickUp/Asana workflow management",
      "Hands-on automation building with Zapier or Make.com",
      "Invoice reconciliation, billing support & vendor coordination",
      "Creation of clear asynchronous SOPs and documentation"
    ],
    detectedTechStack: ["Notion", "Airtable", "ClickUp", "Zapier", "Make.com", "Google Sheets"]
  },
  {
    id: "job-preset-3",
    title: "AI Virtual Assistant & Workflow Automator",
    company: "Synthetix Labs",
    location: "Remote (PST/EST Overlap)",
    roleType: "AI Workflow",
    employmentType: "Contract",
    salaryOrRate: "$35 - $50 / hour",
    sourceUrl: "https://upwork.com/jobs/ai-virtual-assistant-workflow",
    description: `We are a boutique growth advisory seeking an AI-savvy Virtual Assistant to supercharge our client engagement operations. We are looking for someone who doesn't just do tasks manually, but actively uses AI prompts and automation tools to deliver 10x faster results.

Responsibilities:
- Conduct rapid web and market research using AI tools to summarize company prospect profiles.
- Manage outreach email pipelines, review drafted AI messages for tone and factual accuracy.
- Maintain our CRM, update contact statuses, and log meeting recordings into Notion summaries.
- Schedule partner meetings and resolve calendar clashes across multiple executive schedules.
- Build lightweight automations to connect our form submissions, Slack notifications, and spreadsheets.

Requirements:
- 2+ years of Virtual Assistant or Admin support experience.
- Genuine enthusiasm and practical experience with AI tools (Gemini, ChatGPT, Zapier).
- Outstanding written English skills and high attention to detail.
- Reliable high-speed internet and dedicated home office workspace.`,
    parsedRequirements: [
      "2+ years experience in Virtual Assistant or administrative support",
      "Practical experience using AI tools for research, drafting & summaries",
      "CRM updates and executive calendar scheduling",
      "Lightweight automation skills with Zapier or Slack bots",
      "Meticulous attention to detail and careful factual review"
    ],
    detectedTechStack: ["Gemini", "Zapier", "Notion", "Slack", "HubSpot", "Google Workspace"]
  }
];

export const INITIAL_SAMPLE_APPLICATIONS: ApplicationRecord[] = [
  {
    id: "app-rec-1",
    job: SAMPLE_JOB_PRESETS[0],
    status: "Interviewing",
    fitScore: 94,
    dateAdded: "2026-09-08",
    dateApplied: "2026-09-10",
    applicationDeadline: "2026-09-09",
    interviewDate: "2026-09-18",
    interviewTime: "2:00 PM PST",
    interviewType: "Final Round",
    nextFollowUpDate: "2026-09-19",
    nextActionNote: "Second round interview scheduled with VP of People. Review STAR responses on handling executive calendar clashes.",
    notes: "Initial screen with Talent Lead went smoothly. They were highly impressed by the AI briefing workflow built with Gemini & Zapier.",
    contactName: "Sarah Lin (Head of Talent)",
    contactEmail: "sarah.lin@aurahealth.ai"
  },
  {
    id: "app-rec-2",
    job: SAMPLE_JOB_PRESETS[1],
    status: "Applied",
    fitScore: 91,
    dateAdded: "2026-09-12",
    dateApplied: "2026-09-13",
    applicationDeadline: "2026-09-22",
    nextFollowUpDate: "2026-09-18",
    nextActionNote: "Send 5-day post-application check-in if no response received by Thursday.",
    notes: "Submitted customized cover letter emphasizing client onboarding cycle reduction from 11 to 3 days using Notion & ClickUp.",
    contactName: "Marcus Vance (COO)",
    contactEmail: "marcus@kinetix.co"
  },
  {
    id: "app-rec-3",
    job: SAMPLE_JOB_PRESETS[2],
    status: "Ready to Apply",
    fitScore: 89,
    dateAdded: "2026-09-15",
    applicationDeadline: "2026-09-20",
    interviewDate: "2026-09-23",
    interviewTime: "11:00 AM PST",
    interviewType: "Screening",
    nextFollowUpDate: "2026-09-17",
    nextActionNote: "Review tailored Upwork proposal draft and submit portfolio link to AI Briefing project.",
    notes: "Great match for the AI workflow specialization. Highlights prompt engineering and Zapier expertise.",
    contactName: "David Chen (Partner)"
  }
];
