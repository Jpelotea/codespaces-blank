import React, { useState } from 'react';
import { 
  CalendarClock, 
  Sparkles, 
  Send, 
  MessageSquare, 
  HelpCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  RotateCw, 
  Building, 
  Clock, 
  Mail, 
  ChevronRight,
  BookOpen,
  CalendarDays
} from 'lucide-react';
import { 
  ApplicationRecord, 
  InterviewPrepPlan, 
  FollowUpDraft, 
  UserProfile, 
  JobPosting,
  JobFitAnalysis
} from '../types';
import { generateInterviewPrep, generateFollowUpDraft } from '../services/api';
import { InterviewCalendarWidget } from './InterviewCalendarWidget';

interface InterviewStudioViewProps {
  applications: ApplicationRecord[];
  activeJob: JobPosting | null;
  activeAnalysis: JobFitAnalysis | null;
  userProfile: UserProfile;
  onUpdateApplication?: (app: ApplicationRecord) => void;
  onSelectJob?: (job: JobPosting, analysis?: JobFitAnalysis) => void;
}

export const InterviewStudioView: React.FC<InterviewStudioViewProps> = ({
  applications,
  activeJob,
  activeAnalysis,
  userProfile,
  onUpdateApplication,
  onSelectJob
}) => {
  // Selected Application / Role
  const [selectedAppId, setSelectedAppId] = useState<string>(
    applications[0]?.id || (activeJob ? 'active-job' : '')
  );

  // Prep Plan State
  const [prepPlan, setPrepPlan] = useState<InterviewPrepPlan | null>(null);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);

  // Follow Up Draft State
  const [followUpStage, setFollowUpStage] = useState<string>('Post-Interview Thank You');
  const [recipientName, setRecipientName] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [followUpDraft, setFollowUpDraft] = useState<FollowUpDraft | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Current Target Job
  const currentApp = applications.find(a => a.id === selectedAppId);
  const currentJob = currentApp ? currentApp.job : activeJob;

  // Hydrate prepPlan from persisted application data
  React.useEffect(() => {
    if (currentApp?.interviewPrep) {
      setPrepPlan(currentApp.interviewPrep);
    } else if (!currentApp) {
      setPrepPlan(null);
    }
  }, [selectedAppId, currentApp]);

  const handleSelectAppFromCalendar = (appId: string) => {
    setSelectedAppId(appId);
    const target = applications.find(a => a.id === appId);
    if (target && onSelectJob) {
      onSelectJob(target.job, target.fitAnalysis);
    }
    // Smooth scroll down to the STAR prep section
    const prepSection = document.getElementById('interview-prep-workspace');
    if (prepSection) {
      prepSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Generate Interview Prep and persist to Firestore via onUpdateApplication
  const handleGeneratePrep = async () => {
    if (!currentJob) return;
    setIsGeneratingPrep(true);
    try {
      const plan = await generateInterviewPrep(
        currentJob.description,
        currentJob.title,
        currentJob.company,
        userProfile,
        currentApp?.fitAnalysis || activeAnalysis || undefined
      );
      setPrepPlan(plan);
      if (currentApp && onUpdateApplication) {
        onUpdateApplication({
          ...currentApp,
          interviewPrep: plan,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to generate interview prep:', err);
    } finally {
      setIsGeneratingPrep(false);
    }
  };

  // Generate Follow Up Draft
  const handleGenerateFollowUp = async () => {
    if (!currentJob) return;
    setIsGeneratingDraft(true);
    try {
      const draft = await generateFollowUpDraft(
        followUpStage,
        currentJob.title,
        currentJob.company,
        recipientName || 'Hiring Manager',
        userProfile,
        customNotes
      );
      setFollowUpDraft(draft);
    } catch (err) {
      console.error('Failed to generate follow-up draft:', err);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Calendar Widget: Tracks upcoming interview dates, rounds, and application deadlines */}
      <InterviewCalendarWidget
        applications={applications}
        selectedAppId={selectedAppId}
        onSelectApplication={handleSelectAppFromCalendar}
        onUpdateApplication={onUpdateApplication}
      />

      {/* Top Banner & Selector */}
      <div id="interview-prep-workspace" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Interview Preparation & Follow-Up Studio
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              STAR Method Guidance
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Role-specific behavioral questions, executive scenario simulations, and smart candidate questions—all backed by your verified experiences. Plus, 1-click tailored post-interview thank you and follow-up email drafts.
          </p>
        </div>

        {/* Application Selector */}
        <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Active Role:
          </label>
          <select
            value={selectedAppId}
            onChange={(e) => {
              setSelectedAppId(e.target.value);
              setPrepPlan(null);
              setFollowUpDraft(null);
            }}
            className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-2xs w-full md:w-64"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.job.title} ({app.job.company})
              </option>
            ))}
            {activeJob && !applications.some(a => a.job.title === activeJob.title) && (
              <option value="active-job">
                Current: {activeJob.title} ({activeJob.company})
              </option>
            )}
          </select>
        </div>
      </div>

      {/* Main Grid: Interview Guidance vs Follow-Up Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interview Prep & STAR Answers (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Role-Specific Interview Prep & STAR Answers
                </h3>
              </div>
              <button
                id="generate-interview-prep-btn"
                onClick={handleGeneratePrep}
                disabled={isGeneratingPrep || !currentJob}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                {isGeneratingPrep ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Scenarios...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    <span>{prepPlan ? 'Regenerate Prep' : 'Generate Prep Plan'}</span>
                  </>
                )}
              </button>
            </div>

            {!prepPlan && !isGeneratingPrep && (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">No Prep Plan Generated Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click <strong>"Generate Prep Plan"</strong> to predict behavioral questions for {currentJob?.title || 'this role'} and synthesize custom STAR answers using your real accomplishments.
                </p>
                <button
                  onClick={handleGeneratePrep}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition"
                >
                  Start Interview Prep
                </button>
              </div>
            )}

            {isGeneratingPrep && (
              <div className="p-10 text-center space-y-3">
                <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  Formulating predicted questions and mapping verified achievements to the STAR framework...
                </p>
              </div>
            )}

            {prepPlan && !isGeneratingPrep && (
              <div className="space-y-5 pt-1">
                {/* Role Overview and Key Themes */}
                <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-4 text-xs space-y-2">
                  <div className="font-bold text-purple-900 text-sm">Interviewer Focus & Core Themes</div>
                  <p className="text-purple-950 leading-relaxed">{prepPlan.roleOverview}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {prepPlan.keyThemesToEmphasize.map((th, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-white text-purple-800 font-medium border border-purple-200 text-[11px]">
                        ★ {th}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Predicted Questions with STAR breakdown */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Predicted Role Questions & Custom STAR Responses ({prepPlan.predictedQuestions.length})
                  </h4>

                  {prepPlan.predictedQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {q.category}
                          </span>
                          <h5 className="font-bold text-slate-900 text-sm mt-1">
                            "{q.question}"
                          </h5>
                        </div>
                        <button
                          onClick={() => handleCopy(
                            `Question: ${q.question}\n\nSituation: ${q.starAnswer.situation}\nTask: ${q.starAnswer.task}\nAction: ${q.starAnswer.action}\nResult: ${q.starAnswer.result}`,
                            `q-${idx}`
                          )}
                          className="text-slate-400 hover:text-slate-700 p-1 shrink-0"
                          title="Copy STAR answer"
                        >
                          {copiedKey === `q-${idx}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <strong>Why they ask this: </strong>{q.interviewerIntent}
                      </div>

                      {/* STAR Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="font-bold text-slate-900 block mb-0.5 text-[10px] uppercase text-indigo-700">
                            [S] Situation
                          </span>
                          <p className="text-slate-700 leading-relaxed">{q.starAnswer.situation}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="font-bold text-slate-900 block mb-0.5 text-[10px] uppercase text-indigo-700">
                            [T] Task
                          </span>
                          <p className="text-slate-700 leading-relaxed">{q.starAnswer.task}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 sm:col-span-2">
                          <span className="font-bold text-indigo-950 block mb-0.5 text-[10px] uppercase text-indigo-700">
                            [A] Action Taken (Verified Method)
                          </span>
                          <p className="text-indigo-950 leading-relaxed">{q.starAnswer.action}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 sm:col-span-2">
                          <span className="font-bold text-emerald-950 block mb-0.5 text-[10px] uppercase text-emerald-700">
                            [R] Result & Measurable Impact
                          </span>
                          <p className="text-emerald-950 font-medium leading-relaxed">{q.starAnswer.result}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Smart Questions to Ask the Interviewer */}
                {prepPlan.smartQuestionsToAsk && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      High-Leverage Questions to Ask the Interviewer
                    </h4>
                    <div className="space-y-2">
                      {prepPlan.smartQuestionsToAsk.map((sq, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                          <div className="font-semibold text-slate-900">
                            "{sq.question}"
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            <strong>Strategy: </strong>{sq.rationale}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Follow-Up Drafts & Reminders (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Mail className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Follow-Up Email Drafts</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Follow-Up Stage / Type
                </label>
                <select
                  value={followUpStage}
                  onChange={(e) => setFollowUpStage(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
                >
                  <option value="Post-Interview Thank You">Post-Interview Thank You (Within 24h)</option>
                  <option value="Post-Application (5-Day)">5-Day Post-Application Check-In</option>
                  <option value="Status Check-In">2-Week Hiring Decision Check-In</option>
                  <option value="Counter-Offer / Next Steps">Next Steps & Offer Alignment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Interviewer / Recipient Name (Optional)
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Sarah Lin or Marcus Vance"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Conversation Touchpoints / Highlights
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Discussed our mutual passion for AI automation, offsite planning in Lisbon..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <button
                id="generate-followup-draft-btn"
                onClick={handleGenerateFollowUp}
                disabled={isGeneratingDraft || !currentJob}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                {isGeneratingDraft ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Drafting Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Generate Follow-Up Draft</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Email View */}
            {followUpDraft && (
              <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    Recommended Timing: {followUpDraft.suggestedTiming}
                  </span>
                  <button
                    onClick={() => handleCopy(`${followUpDraft.subject}\n\n${followUpDraft.body}`, 'draft')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                  >
                    {copiedKey === 'draft' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-800">
                  <div className="font-semibold text-slate-900 border-b border-slate-200 pb-1">
                    Subject: {followUpDraft.subject}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {followUpDraft.body}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
