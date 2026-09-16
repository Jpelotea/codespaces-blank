import { UserProfile } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: "Alex Morgan",
  headline: "Senior Executive Assistant & AI Operations Specialist",
  email: "alex.morgan.ops@example.com",
  phone: "+1 (555) 234-8901",
  location: "Remote (Global / PST & EST Coverage)",
  timezone: "UTC-8 (Flexible for US / EU overlap)",
  yearsExperience: 6,
  targetRoles: [
    "Executive Assistant to Founder / C-Suite",
    "Business Operations Associate",
    "Remote Virtual Assistant Lead",
    "AI-Assisted Workflow Specialist"
  ],
  executiveSummary: "Dynamic Executive Assistant and Operations Specialist with 6+ years supporting high-growth tech founders, remote leadership teams, and fast-paced venture-backed startups. Proven expertise in multi-calendar deconfliction, high-touch travel logistics, confidential communications, and designing zero-friction asynchronous workflows using Notion, Slack, Zapier, and generative AI tools. Dedicated to strict integrity and documented, verified outcomes.",
  verifiedOnlyMode: true,
  workExperiences: [
    {
      id: "exp-1",
      title: "Senior Executive Assistant & BizOps Coordinator",
      company: "Vanguard Tech Partners (Remote)",
      period: "2023 - Present",
      isRemote: true,
      roleType: "Executive Assistant",
      description: "Direct right-hand support to the CEO and COO of a 75-person remote fintech company across 4 time zones.",
      verifiedAchievements: [
        "Architected an automated AI briefing workflow using Gemini & Zapier that synthesized 150+ daily Slack & email threads into a 5-minute morning executive dossier.",
        "Managed dual 24/7 executive calendars with 99.8% conflict-free scheduling across US, European, and APAC client partners.",
        "Organized 4 bi-annual global team offsites (80+ attendees each) managing budget ($140k/ea), venue sourcing, multi-leg international flights, and agendas.",
        "Drafted investor updates, board meeting decks, and quarterly town hall slide assets with rapid turnaround."
      ],
      toolsUsed: ["Google Workspace", "Notion", "Slack", "Zapier", "Make.com", "Gemini AI", "Superhuman", "Calendly"]
    },
    {
      id: "exp-2",
      title: "Business Operations & Virtual Assistant Lead",
      company: "Apex Growth Studio",
      period: "2021 - 2023",
      isRemote: true,
      roleType: "Business Operations",
      description: "Led client onboarding, operational SOP creation, and virtual administrative support for 12 partner agencies.",
      verifiedAchievements: [
        "Cut client onboarding cycle time from 11 days to 3 days by building a standardized Notion workspace with automated ClickUp task generation.",
        "Managed daily billing operations, monthly expense reconciliation (up to $85k/mo), and vendor communications in QuickBooks.",
        "Trained and delegated tasks to a squad of 4 junior virtual assistants with zero SLA breaches over 18 months."
      ],
      toolsUsed: ["Notion", "ClickUp", "QuickBooks", "Airtable", "Google Sheets", "Loom", "Miro"]
    },
    {
      id: "exp-3",
      title: "Virtual Executive Assistant",
      company: "CloudScale Digital (Contract)",
      period: "2019 - 2021",
      isRemote: true,
      roleType: "Virtual Assistant",
      description: "Provided fractional administrative support to 3 serial entrepreneurs managing e-commerce and SaaS portfolios.",
      verifiedAchievements: [
        "Screened and triaged 200+ executive emails daily, achieving Inbox Zero consistently by 4:00 PM local time.",
        "Built CRM pipelines in HubSpot and coordinated sales demo bookings with prospective enterprise buyers.",
        "Coordinated complex domestic & international travel itineraries with contingency bookings and visa documentation."
      ],
      toolsUsed: ["Google Workspace", "HubSpot", "Trello", "Asana", "Expensify", "Zoom"]
    }
  ],
  skillCategories: [
    {
      id: "cat-1",
      categoryName: "Executive & Administrative Support",
      skills: [
        { name: "Complex Calendar Management", level: "Expert", isVerified: true, yearsExperience: 6 },
        { name: "High-Touch Travel Logistics", level: "Expert", isVerified: true, yearsExperience: 5 },
        { name: "Inbox Triage & Ghostwriting", level: "Expert", isVerified: true, yearsExperience: 6 },
        { name: "Board & Investor Presentation Decks", level: "Proficient", isVerified: true, yearsExperience: 4 },
        { name: "Meeting Minutes & Action Item Tracking", level: "Expert", isVerified: true, yearsExperience: 6 },
        { name: "Confidentiality & Gatekeeping", level: "Expert", isVerified: true, yearsExperience: 6 }
      ]
    },
    {
      id: "cat-2",
      categoryName: "AI-Assisted Workflows & Automations",
      skills: [
        { name: "Gemini / LLM Prompt Engineering for Ops", level: "Expert", isVerified: true, yearsExperience: 2 },
        { name: "Zapier Multi-Step Zaps", level: "Expert", isVerified: true, yearsExperience: 4 },
        { name: "Make.com Scenario Orchestration", level: "Proficient", isVerified: true, yearsExperience: 2 },
        { name: "Automated Meeting Summarization", level: "Expert", isVerified: true, yearsExperience: 2 },
        { name: "AI Research & Competitive Briefs", level: "Expert", isVerified: true, yearsExperience: 3 }
      ]
    },
    {
      id: "cat-3",
      categoryName: "Business Operations & Project Management",
      skills: [
        { name: "Notion Systems & SOP Architecture", level: "Expert", isVerified: true, yearsExperience: 5 },
        { name: "Asana / ClickUp Project Management", level: "Expert", isVerified: true, yearsExperience: 5 },
        { name: "Expense Reconciliation & Invoicing", level: "Proficient", isVerified: true, yearsExperience: 4 },
        { name: "Vendor Contract Coordination", level: "Proficient", isVerified: true, yearsExperience: 3 },
        { name: "Cross-Functional Remote Team Coordination", level: "Expert", isVerified: true, yearsExperience: 5 }
      ]
    },
    {
      id: "cat-4",
      categoryName: "Software & Digital Tools",
      skills: [
        { name: "Google Workspace Admin", level: "Expert", isVerified: true, yearsExperience: 6 },
        { name: "Slack / Microsoft Teams", level: "Expert", isVerified: true, yearsExperience: 6 },
        { name: "Superhuman / Spark", level: "Expert", isVerified: true, yearsExperience: 4 },
        { name: "Airtable Relational Databases", level: "Proficient", isVerified: true, yearsExperience: 3 },
        { name: "Loom Video SOPs", level: "Expert", isVerified: true, yearsExperience: 4 }
      ]
    }
  ],
  portfolioProjects: [
    {
      id: "proj-1",
      title: "Executive Daily AI Briefing & Task Triaging Hub",
      roleCategory: "Workflow Automation",
      description: "Engineered an automated pipeline connecting Gmail, Slack, and Google Calendar via Zapier & Gemini AI. Extracts action items, tags priority client emails, flags urgent calendar clashes, and compiles a clean Markdown briefing delivered to the CEO's Telegram and Notion dashboard every weekday at 7:30 AM.",
      verifiedImpactMetric: "Saved 9.5 hours/week of executive triage time and eliminated missed VIP follow-ups.",
      toolsUsed: ["Gemini AI", "Zapier", "Notion", "Google Calendar", "Slack Webhooks"],
      deliverableSnippetOrLink: "Documented SOP & Zapier blueprint with privacy-safe redactions available for review."
    },
    {
      id: "proj-2",
      title: "Multi-Timezone Team Offsite Logistics Playbook (85 Pax)",
      roleCategory: "Executive Support",
      description: "End-to-end management of a 5-day company offsite in Lisbon, Portugal. Sourced hotels, negotiated master vendor contracts, arranged ground transportation, scheduled keynote agendas, and coordinated specialized dietary/accessibility requirements under strict budget caps.",
      verifiedImpactMetric: "Delivered 8% under the $140,000 budget cap with a 98% attendee satisfaction rating in post-event survey.",
      toolsUsed: ["Airtable", "Google Sheets", "TripActions", "Slack", "Notion"],
      deliverableSnippetOrLink: "Live Notion Master Tracker template & itinerary sample."
    },
    {
      id: "proj-3",
      title: "Self-Service Client Onboarding & SOP Knowledge Base",
      roleCategory: "Business Operations",
      description: "Restructured the fragmented knowledge base into a unified Notion workspace. Included interactive checklists for clients, video walkthroughs, and automated Slack notification pings for milestone sign-offs.",
      verifiedImpactMetric: "Reduced client onboarding friction questions by 62% and accelerated time-to-first-deliverable by 8 days.",
      toolsUsed: ["Notion", "Loom", "ClickUp", "Google Drive"],
      deliverableSnippetOrLink: "Interactive onboarding workflow diagram and public Notion template sample."
    }
  ],
  answerBank: [
    {
      id: "ans-1",
      prompt: "How do you handle conflicting priorities between senior executives or urgent last-minute requests?",
      verifiedResponse: "I establish a proactive triage matrix during my first 30 days. When conflicts arise, I rapidly evaluate urgency versus strategic impact, verify deadlines directly, and offer immediate solutions rather than open-ended problems (e.g. 'I can shift the quarterly sync to 3 PM to accommodate the urgent Board prep without dropping our partner deadline'). I maintain transparent visibility so executives never guess what is on my radar.",
      tags: ["Prioritization", "Executive Communication", "Conflict Resolution"]
    },
    {
      id: "ans-2",
      prompt: "Describe your experience working fully remotely across different time zones.",
      verifiedResponse: "I have worked 100% remotely for over 5 years supporting teams spread across PST, EST, GMT, and SGT. I thrive on asynchronous communication—documenting decisions clearly in Notion/Loom, setting explicit expectation timestamps, and reserving synchronous meetings only for high-leverage decisions. I am accustomed to managing early-morning or evening overlap windows to support leadership seamlessly.",
      tags: ["Remote Work", "Asynchronous Operations", "Time Zone Management"]
    },
    {
      id: "ans-3",
      prompt: "How do you utilize AI tools in your daily administrative and operational work?",
      verifiedResponse: "I treat AI as a high-precision force multiplier for repetitive operations. I utilize Gemini for drafting structured meeting minutes, distilling 40-page PDFs into key decision points, automating inbox categorization, and generating initial slide outlines. Crucially, I always verify all generated data against human source facts to ensure 100% accuracy and strict confidentiality.",
      tags: ["AI Workflows", "Prompting", "Productivity"]
    }
  ]
};
