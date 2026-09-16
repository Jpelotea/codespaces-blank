import React, { useState } from 'react';
import { 
  UserCheck, 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Briefcase, 
  Sparkles, 
  FolderGit2, 
  MessageSquare, 
  Save, 
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  UserProfile, 
  WorkExperience, 
  SkillCategory, 
  PortfolioProject, 
  ApplicationAnswerBankItem 
} from '../types';
import { INITIAL_USER_PROFILE } from '../data/defaultProfile';

interface VerifiedProfileVaultViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const VerifiedProfileVaultView: React.FC<VerifiedProfileVaultViewProps> = ({
  userProfile,
  onUpdateProfile
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'skills' | 'portfolio' | 'answerBank'>('experience');
  const [profileState, setProfileState] = useState<UserProfile>(userProfile);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // New Experience Modal / Inline Form
  const [showAddExp, setShowAddExp] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPeriod, setNewPeriod] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAchievementsText, setNewAchievementsText] = useState('');
  const [newToolsText, setNewToolsText] = useState('');

  // New Project Form
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjMetric, setNewProjMetric] = useState('');
  const [newProjTools, setNewProjTools] = useState('');

  // New Skill Form
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState(profileState.skillCategories[0]?.id || 'cat-1');

  // Trigger save to the authenticated workspace
  const handleSaveAll = () => {
    onUpdateProfile(profileState);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  // Reset to default sample profile
  const handleResetToDefault = () => {
    if (confirm('Reset your profile and vault back to the default verified portfolio?')) {
      setProfileState(INITIAL_USER_PROFILE);
      onUpdateProfile(INITIAL_USER_PROFILE);
    }
  };

  // Add new experience
  const handleAddExperience = () => {
    if (!newRoleTitle.trim() || !newCompany.trim()) return;
    const achievements = newAchievementsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const tools = newToolsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      title: newRoleTitle,
      company: newCompany,
      period: newPeriod || '2024 - Present',
      isRemote: true,
      roleType: 'Executive Assistant',
      description: newDescription,
      verifiedAchievements: achievements.length > 0 ? achievements : ['Executed daily administrative and operational priorities with high accuracy.'],
      toolsUsed: tools.length > 0 ? tools : ['Google Workspace', 'Slack', 'Notion']
    };

    const updated = {
      ...profileState,
      workExperiences: [newExp, ...profileState.workExperiences]
    };
    setProfileState(updated);
    onUpdateProfile(updated);
    setShowAddExp(false);
    setNewRoleTitle('');
    setNewCompany('');
    setNewPeriod('');
    setNewDescription('');
    setNewAchievementsText('');
    setNewToolsText('');
  };

  // Remove experience
  const handleRemoveExp = (id: string) => {
    const updated = {
      ...profileState,
      workExperiences: profileState.workExperiences.filter(e => e.id !== id)
    };
    setProfileState(updated);
    onUpdateProfile(updated);
  };

  // Add new project
  const handleAddProject = () => {
    if (!newProjTitle.trim()) return;
    const tools = newProjTools.split(',').map(s => s.trim()).filter(Boolean);
    const newProj: PortfolioProject = {
      id: `proj-${Date.now()}`,
      title: newProjTitle,
      roleCategory: 'Workflow Automation',
      description: newProjDesc,
      verifiedImpactMetric: newProjMetric || 'Demonstrated high operational leverage.',
      toolsUsed: tools.length > 0 ? tools : ['Notion', 'Zapier'],
      deliverableSnippetOrLink: 'Available upon request.'
    };
    const updated = {
      ...profileState,
      portfolioProjects: [newProj, ...profileState.portfolioProjects]
    };
    setProfileState(updated);
    onUpdateProfile(updated);
    setShowAddProject(false);
    setNewProjTitle('');
    setNewProjDesc('');
    setNewProjMetric('');
    setNewProjTools('');
  };

  // Remove project
  const handleRemoveProject = (id: string) => {
    const updated = {
      ...profileState,
      portfolioProjects: profileState.portfolioProjects.filter(p => p.id !== id)
    };
    setProfileState(updated);
    onUpdateProfile(updated);
  };

  // Add new skill
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const updatedCategories = profileState.skillCategories.map(cat => {
      if (cat.id === newSkillCategory) {
        return {
          ...cat,
          skills: [
            ...cat.skills,
            { name: newSkillName.trim(), level: 'Expert' as const, isVerified: true, yearsExperience: 2 }
          ]
        };
      }
      return cat;
    });
    const updated = { ...profileState, skillCategories: updatedCategories };
    setProfileState(updated);
    onUpdateProfile(updated);
    setNewSkillName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Strict Grounding Directive */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Verified Professional Vault & Ground Truth
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Anti-Hallucination Safe
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            All AI tailoring, resume bullet generation, and interview guidance are strictly constrained to the items below. The Copilot will never fabricate experience, employers, or metrics you have not verified here.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleResetToDefault}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition"
            title="Reset to recommended verified sample profile"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Profile</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            {isSavedNotice ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-300" />
                <span>Save Vault</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2">
        <button
          onClick={() => setActiveTab('experience')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'experience'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" />
            Verified Work Experience ({profileState.workExperiences.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'skills'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Verified Skills Library ({profileState.skillCategories.reduce((acc, c) => acc + c.skills.length, 0)})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'portfolio'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FolderGit2 className="w-4 h-4" />
            Portfolio Projects & Deliverables ({profileState.portfolioProjects.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('answerBank')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'answerBank'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            Application Answer Bank ({profileState.answerBank.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" />
            Candidate Bio & Targets
          </span>
        </button>
      </div>

      {/* Tab 1: Work Experience */}
      {activeTab === 'experience' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Documented roles, verified accomplishments, and operational impact metrics.
            </span>
            <button
              onClick={() => setShowAddExp(!showAddExp)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Role</span>
            </button>
          </div>

          {showAddExp && (
            <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Add New Verified Experience</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role Title</label>
                  <input
                    type="text"
                    value={newRoleTitle}
                    onChange={(e) => setNewRoleTitle(e.target.value)}
                    placeholder="e.g. Executive Assistant to Founder"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Horizon Labs (Remote)"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Period</label>
                  <input
                    type="text"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    placeholder="e.g. 2022 - Present"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Short Description of Scope</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Primary executive support or operations scope..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Verified Achievements & Metrics (One per line)
                </label>
                <textarea
                  rows={3}
                  value={newAchievementsText}
                  onChange={(e) => setNewAchievementsText(e.target.value)}
                  placeholder="• Managed dual executive calendars with 99% conflict-free rate...&#10;• Built Zapier automation saving 8 hours weekly..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tools Used (Comma-separated)
                </label>
                <input
                  type="text"
                  value={newToolsText}
                  onChange={(e) => setNewToolsText(e.target.value)}
                  placeholder="Google Workspace, Notion, Slack, Zapier"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowAddExp(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExperience}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  Add Experience
                </button>
              </div>
            </div>
          )}

          {/* List of existing experiences */}
          <div className="space-y-4">
            {profileState.workExperiences.map((exp) => (
              <div key={exp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{exp.title}</h3>
                    <div className="text-xs text-indigo-700 font-medium mt-0.5">
                      {exp.company} • <span className="text-slate-500 font-normal">{exp.period}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveExp(exp.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                    title="Remove experience"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                    Verified Accomplishments:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                    {exp.verifiedAchievements.map((ach, aIdx) => (
                      <li key={aIdx} className="leading-relaxed">{ach}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {exp.toolsUsed.map((tool, tIdx) => (
                    <span key={tIdx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Skills Library */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Add new verified skill (e.g. Make.com, HubSpot CRM, AirTable)..."
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 w-full"
            />
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
            >
              {profileState.skillCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
              ))}
            </select>
            <button
              onClick={handleAddSkill}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0"
            >
              Add Skill
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileState.skillCategories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-sm">{cat.categoryName}</h3>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {cat.skills.length} skills
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill, sIdx) => (
                    <div
                      key={sIdx}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium text-slate-800">{skill.name}</span>
                      <span className="text-[10px] text-slate-400">({skill.level})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Portfolio Projects */}
      {activeTab === 'portfolio' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Tangible systems, workflows, playbooks, and deliverables ready for application recommendations.
            </span>
            <button
              onClick={() => setShowAddProject(!showAddProject)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          {showAddProject && (
            <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Add Portfolio Project</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Project / System Title</label>
                  <input
                    type="text"
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                    placeholder="e.g. Automated Client Onboarding Pipeline"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Verified Impact Metric</label>
                  <input
                    type="text"
                    value={newProjMetric}
                    onChange={(e) => setNewProjMetric(e.target.value)}
                    placeholder="e.g. Cut turnaround time by 60% and saved 10 hrs/wk"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">System Description & Deliverables</label>
                <textarea
                  rows={3}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Describe how the system was built, problem solved, and how it works..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tools Used (Comma-separated)</label>
                <input
                  type="text"
                  value={newProjTools}
                  onChange={(e) => setNewProjTools(e.target.value)}
                  placeholder="Notion, Zapier, Google Sheets"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowAddProject(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProject}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  Add Project
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileState.portfolioProjects.map((proj) => (
              <div key={proj.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
                      {proj.roleCategory}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{proj.title}</h3>
                  </div>
                  <button
                    onClick={() => handleRemoveProject(proj.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition"
                    title="Remove project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>

                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 font-medium">
                  <strong>Verified Impact: </strong>{proj.verifiedImpactMetric}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.toolsUsed.map((tool, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Answer Bank */}
      {activeTab === 'answerBank' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Pre-verified answers to tough screening questions. The AI uses these authentic anecdotes when drafting application questions.
          </div>
          <div className="space-y-3">
            {profileState.answerBank.map((ans) => (
              <div key={ans.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{ans.prompt}</h4>
                  <div className="flex gap-1">
                    {ans.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {ans.verifiedResponse}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Candidate Bio & Targets */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-3xl">
          <h3 className="font-bold text-slate-900 text-base">Candidate Profile Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profileState.name}
                onChange={(e) => setProfileState({ ...profileState, name: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Headline</label>
              <input
                type="text"
                value={profileState.headline}
                onChange={(e) => setProfileState({ ...profileState, headline: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={profileState.email}
                onChange={(e) => setProfileState({ ...profileState, email: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={profileState.phone}
                onChange={(e) => setProfileState({ ...profileState, phone: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Location / Coverage</label>
              <input
                type="text"
                value={profileState.location}
                onChange={(e) => setProfileState({ ...profileState, location: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Years of Experience</label>
              <input
                type="number"
                value={profileState.yearsExperience}
                onChange={(e) => setProfileState({ ...profileState, yearsExperience: parseInt(e.target.value) || 0 })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Executive Summary</label>
            <textarea
              rows={4}
              value={profileState.executiveSummary}
              onChange={(e) => setProfileState({ ...profileState, executiveSummary: e.target.value })}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              Update Profile Information
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
