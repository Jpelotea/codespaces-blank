import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  MoreVertical, 
  Trash2, 
  CalendarClock, 
  Sparkles, 
  Building, 
  DollarSign, 
  MapPin, 
  FileText, 
  MessageSquare,
  AlertCircle,
  ChevronRight,
  Plus
} from 'lucide-react';
import { ApplicationRecord, ApplicationStatus, JobPosting } from '../types';

interface ApplicationTrackerViewProps {
  applications: ApplicationRecord[];
  onUpdateApplicationStatus: (id: string, newStatus: ApplicationStatus) => void;
  onDeleteApplication: (id: string) => void;
  onSelectApplicationForInterview: (app: ApplicationRecord) => void;
  onOpenNewJobAnalysis: () => void;
  onUpdateNotes: (id: string, notes: string, nextActionDate?: string, nextActionNote?: string) => void;
}

const STAGES: { key: ApplicationStatus; label: string; color: string }[] = [
  { key: 'Discovered', label: 'Discovered', color: 'border-slate-300 bg-slate-50 text-slate-700' },
  { key: 'Ready to Apply', label: 'Ready to Apply', color: 'border-blue-300 bg-blue-50 text-blue-800' },
  { key: 'Applied', label: 'Applied', color: 'border-indigo-300 bg-indigo-50 text-indigo-800' },
  { key: 'Screening', label: 'Screening', color: 'border-amber-300 bg-amber-50 text-amber-800' },
  { key: 'Interviewing', label: 'Interviewing', color: 'border-purple-300 bg-purple-50 text-purple-800' },
  { key: 'Offer', label: 'Offer Received', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  { key: 'Archived', label: 'Archived', color: 'border-slate-200 bg-slate-100 text-slate-600' }
];

export const ApplicationTrackerView: React.FC<ApplicationTrackerViewProps> = ({
  applications,
  onUpdateApplicationStatus,
  onDeleteApplication,
  onSelectApplicationForInterview,
  onOpenNewJobAnalysis,
  onUpdateNotes
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedAppModal, setSelectedAppModal] = useState<ApplicationRecord | null>(null);

  // Edit notes state inside modal
  const [modalNotes, setModalNotes] = useState('');
  const [modalNextAction, setModalNextAction] = useState('');
  const [modalActionDate, setModalActionDate] = useState('');

  const openAppDetails = (app: ApplicationRecord) => {
    setSelectedAppModal(app);
    setModalNotes(app.notes || '');
    setModalNextAction(app.nextActionNote || '');
    setModalNextAction(app.nextActionNote || '');
    setModalActionDate(app.nextFollowUpDate || '');
  };

  const handleSaveModalUpdates = () => {
    if (selectedAppModal) {
      onUpdateNotes(selectedAppModal.id, modalNotes, modalActionDate, modalNextAction);
      setSelectedAppModal({
        ...selectedAppModal,
        notes: modalNotes,
        nextFollowUpDate: modalActionDate,
        nextActionNote: modalNextAction
      });
    }
  };

  // Filtered applications
  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.contactName && app.contactName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || app.job.roleType === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Summary Metrics
  const totalCount = applications.length;
  const interviewingCount = applications.filter(a => a.status === 'Interviewing' || a.status === 'Screening').length;
  const readyOrAppliedCount = applications.filter(a => a.status === 'Applied' || a.status === 'Ready to Apply').length;
  const offersCount = applications.filter(a => a.status === 'Offer').length;

  return (
    <div className="space-y-6">
      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Tracked Roles</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active applications</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-indigo-600">In Pipeline</div>
          <div className="text-2xl font-bold text-indigo-900 mt-1">{readyOrAppliedCount}</div>
          <div className="text-[11px] text-indigo-600/80 mt-0.5">Applied / Ready to send</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-purple-600">Active Interviews</div>
          <div className="text-2xl font-bold text-purple-900 mt-1">{interviewingCount}</div>
          <div className="text-[11px] text-purple-600/80 mt-0.5">Screening & Interview rounds</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-emerald-600">Offers & Success</div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{offersCount}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Secured roles</div>
        </div>
      </div>

      {/* Action Controls & Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search roles, companies, contacts..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
            >
              <option value="all">All Role Types</option>
              <option value="Executive Assistant">Executive Assistant</option>
              <option value="Business Operations">Business Operations</option>
              <option value="Virtual Assistant">Virtual Assistant</option>
              <option value="AI Workflow">AI Workflow</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-medium">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Table View
            </button>
          </div>

          <button
            onClick={onOpenNewJobAnalysis}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Analyze New Job</span>
          </button>
        </div>
      </div>

      {/* Main Board View (Kanban) */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.slice(0, 6).map((stage) => {
            const stageApps = filteredApps.filter(a => a.status === stage.key);
            return (
              <div key={stage.key} className="bg-slate-100/70 rounded-2xl p-3 flex flex-col min-w-[260px] md:min-w-0">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800 text-xs">{stage.label}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200">
                      {stageApps.length}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] scrollbar-thin">
                  {stageApps.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      No roles here
                    </div>
                  ) : (
                    stageApps.map((app) => (
                      <div
                        key={app.id}
                        className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs hover:shadow-xs transition space-y-2 relative group"
                      >
                        {/* Card Header: Role & Company */}
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <h4 
                              onClick={() => openAppDetails(app)}
                              className="font-bold text-slate-900 text-xs leading-snug hover:text-indigo-600 cursor-pointer line-clamp-2"
                            >
                              {app.job.title}
                            </h4>
                            <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span>{app.job.company}</span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {app.fitScore}%
                            </span>
                          </div>
                        </div>

                        {/* Badges: Salary, Location */}
                        <div className="flex flex-wrap gap-1 text-[10px] text-slate-500">
                          {app.job.salaryOrRate && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100">
                              {app.job.salaryOrRate}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100">
                            {app.job.roleType}
                          </span>
                        </div>

                        {/* Next Action Pill */}
                        {app.nextActionNote && (
                          <div className="text-[11px] bg-amber-50 text-amber-900 p-1.5 rounded-lg border border-amber-100 leading-tight">
                            <div className="font-semibold text-[10px] text-amber-700 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Due: {app.nextFollowUpDate || 'Soon'}</span>
                            </div>
                            <div className="line-clamp-2 mt-0.5">{app.nextActionNote}</div>
                          </div>
                        )}

                        {/* Action Buttons Footer */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          {/* Change Stage dropdown */}
                          <select
                            value={app.status}
                            onChange={(e) => onUpdateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                            className="text-[10px] py-1 px-1.5 rounded border border-slate-200 bg-white font-medium text-slate-700 cursor-pointer"
                          >
                            {STAGES.map(s => (
                              <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onSelectApplicationForInterview(app)}
                              title="Prepare for interview"
                              className="p-1 rounded text-purple-700 hover:bg-purple-50 transition"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openAppDetails(app)}
                              title="View details"
                              className="p-1 rounded text-slate-500 hover:bg-slate-100 transition"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteApplication(app.id)}
                              title="Remove"
                              className="p-1 rounded text-slate-400 hover:text-red-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table / List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Role & Company</th>
                  <th className="py-3 px-3">Role Track</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Match</th>
                  <th className="py-3 px-3">Next Action</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div 
                        onClick={() => openAppDetails(app)}
                        className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                      >
                        {app.job.title}
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                        <span>{app.job.company}</span>
                        {app.job.salaryOrRate && <span>• {app.job.salaryOrRate}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {app.job.roleType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={app.status}
                        onChange={(e) => onUpdateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                        className="text-xs py-1 px-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
                      >
                        {STAGES.map(s => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md text-xs">
                        {app.fitScore}%
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate text-slate-600">
                      {app.nextActionNote ? (
                        <div className="text-[11px]">
                          <span className="font-medium text-amber-700">{app.nextFollowUpDate}: </span>
                          <span>{app.nextActionNote}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No pending action</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => onSelectApplicationForInterview(app)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                      >
                        Interview Prep
                      </button>
                      <button
                        onClick={() => openAppDetails(app)}
                        className="p-1 rounded text-slate-500 hover:bg-slate-100"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteApplication(app.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                    {selectedAppModal.job.roleType}
                  </span>
                  <span className="text-xs text-slate-500">
                    Added {selectedAppModal.dateAdded}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedAppModal.job.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {selectedAppModal.job.company} — {selectedAppModal.job.location}
                </p>
              </div>
              <button
                onClick={() => setSelectedAppModal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Current Stage and Score */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                  Hiring Stage
                </label>
                <select
                  value={selectedAppModal.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as ApplicationStatus;
                    onUpdateApplicationStatus(selectedAppModal.id, newStatus);
                    setSelectedAppModal({ ...selectedAppModal, status: newStatus });
                  }}
                  className="w-full text-xs font-medium py-1.5 px-2 rounded-lg border border-slate-300 bg-white"
                >
                  {STAGES.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                  Verified Match Score
                </label>
                <div className="text-lg font-bold text-indigo-700 flex items-center gap-1.5">
                  <span>{selectedAppModal.fitScore} / 100</span>
                  <span className="text-xs font-normal text-slate-500">Grounded in vault</span>
                </div>
              </div>
            </div>

            {/* Next Action & Follow-Up Planner */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800 block">
                Next Scheduled Action / Reminder
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="date"
                  value={modalActionDate}
                  onChange={(e) => setModalActionDate(e.target.value)}
                  className="text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
                <input
                  type="text"
                  value={modalNextAction}
                  onChange={(e) => setModalNextAction(e.target.value)}
                  placeholder="e.g. Follow up on interview feedback"
                  className="sm:col-span-2 text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            {/* Candidate Internal Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800 block">
                Application Notes & Contact Context
              </label>
              <textarea
                rows={4}
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="Log interviewer names, compensation discussions, questions asked, or key takeaways..."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                onClick={() => {
                  setSelectedAppModal(null);
                  onSelectApplicationForInterview(selectedAppModal);
                }}
                className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
              >
                <CalendarClock className="w-4 h-4" />
                <span>Open in Interview Studio</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedAppModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleSaveModalUpdates();
                    setSelectedAppModal(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
