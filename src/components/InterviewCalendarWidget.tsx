import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  CalendarDays, 
  AlertCircle, 
  CheckCircle2, 
  Building, 
  Sparkles, 
  X, 
  Edit3, 
  ListFilter,
  UserCheck,
  Video,
  FileCheck
} from 'lucide-react';
import { ApplicationRecord } from '../types';

export interface CalendarEventItem {
  id: string;
  applicationId: string;
  company: string;
  roleTitle: string;
  dateStr: string; // YYYY-MM-DD
  type: 'interview' | 'deadline' | 'followup';
  title: string;
  time?: string;
  subType?: string; // e.g. 'Final Round', 'Screening'
  notes?: string;
  contactName?: string;
}

interface InterviewCalendarWidgetProps {
  applications: ApplicationRecord[];
  selectedAppId?: string;
  onSelectApplication: (appId: string) => void;
  onUpdateApplication?: (app: ApplicationRecord) => void;
}

export const InterviewCalendarWidget: React.FC<InterviewCalendarWidgetProps> = ({
  applications,
  selectedAppId,
  onSelectApplication,
  onUpdateApplication
}) => {
  // Calendar current view date
  // Anchor on September 2026 as per application state/timeline, or current real month
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Check if any application has an upcoming event date to center on
    const dates = applications
      .flatMap(a => [a.interviewDate, a.applicationDeadline, a.nextFollowUpDate])
      .filter((d): d is string => Boolean(d));
    if (dates.length > 0) {
      const parsed = new Date(dates[0]);
      if (!isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      }
    }
    return new Date(2026, 8, 1); // September 2026
  });

  const [selectedDayStr, setSelectedDayStr] = useState<string | null>('2026-09-18');
  const [filterType, setFilterType] = useState<'all' | 'interview' | 'deadline' | 'followup'>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');

  // Schedule / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAppId, setModalAppId] = useState<string>(applications[0]?.id || '');
  const [modalEventType, setModalEventType] = useState<'interview' | 'deadline' | 'followup'>('interview');
  const [modalDate, setModalDate] = useState<string>('2026-09-20');
  const [modalTime, setModalTime] = useState<string>('2:00 PM PST');
  const [modalInterviewType, setModalInterviewType] = useState<'Screening' | 'Technical / Task' | 'Hiring Manager' | 'Final Round' | 'Panel'>('Hiring Manager');
  const [modalNotes, setModalNotes] = useState<string>('');

  // Extract all calendar events from application state
  const allEvents = useMemo<CalendarEventItem[]>(() => {
    const list: CalendarEventItem[] = [];

    applications.forEach(app => {
      // 1. Interview Date
      if (app.interviewDate) {
        list.push({
          id: `int-${app.id}`,
          applicationId: app.id,
          company: app.job.company,
          roleTitle: app.job.title,
          dateStr: app.interviewDate.split('T')[0],
          type: 'interview',
          title: `${app.interviewType || 'Interview'} with ${app.job.company}`,
          time: app.interviewTime || 'TBD',
          subType: app.interviewType || 'Interview',
          notes: app.nextActionNote || app.notes,
          contactName: app.contactName
        });
      }

      // 2. Application Deadline
      if (app.applicationDeadline) {
        list.push({
          id: `dead-${app.id}`,
          applicationId: app.id,
          company: app.job.company,
          roleTitle: app.job.title,
          dateStr: app.applicationDeadline.split('T')[0],
          type: 'deadline',
          title: `Application Deadline: ${app.job.title}`,
          subType: 'Hard Deadline',
          notes: `Submit verified materials before close.`
        });
      }

      // 3. Next Follow-Up Check-In
      if (app.nextFollowUpDate && app.nextFollowUpDate !== app.interviewDate) {
        list.push({
          id: `fup-${app.id}`,
          applicationId: app.id,
          company: app.job.company,
          roleTitle: app.job.title,
          dateStr: app.nextFollowUpDate.split('T')[0],
          type: 'followup',
          title: `Follow-Up Check-In: ${app.job.company}`,
          subType: 'Action Item',
          notes: app.nextActionNote || 'Send follow-up email'
        });
      }
    });

    // Sort chronologically
    return list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [applications]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return allEvents;
    return allEvents.filter(e => e.type === filterType);
  }, [allEvents, filterType]);

  // Counts for pills
  const counts = useMemo(() => ({
    all: allEvents.length,
    interview: allEvents.filter(e => e.type === 'interview').length,
    deadline: allEvents.filter(e => e.type === 'deadline').length,
    followup: allEvents.filter(e => e.type === 'followup').length
  }), [allEvents]);

  // Calendar Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in current month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  // Total days in previous month
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    // Jump to September 2026 or current year
    setCurrentDate(new Date(2026, 8, 1));
    setSelectedDayStr('2026-09-16');
  };

  // Open Add/Edit Modal
  const handleOpenScheduleModal = (presetAppId?: string, presetType?: 'interview' | 'deadline' | 'followup', presetDate?: string) => {
    const targetApp = applications.find(a => a.id === presetAppId) || applications[0];
    if (targetApp) {
      setModalAppId(targetApp.id);
      setModalEventType(presetType || 'interview');
      setModalDate(presetDate || targetApp.interviewDate || '2026-09-20');
      setModalTime(targetApp.interviewTime || '2:00 PM PST');
      setModalInterviewType(targetApp.interviewType || 'Hiring Manager');
      setModalNotes(targetApp.nextActionNote || '');
    }
    setIsModalOpen(true);
  };

  // Save Modal Updates
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateApplication) {
      setIsModalOpen(false);
      return;
    }

    const appToUpdate = applications.find(a => a.id === modalAppId);
    if (!appToUpdate) return;

    let updated: ApplicationRecord = { ...appToUpdate };

    if (modalEventType === 'interview') {
      updated = {
        ...updated,
        interviewDate: modalDate,
        interviewTime: modalTime,
        interviewType: modalInterviewType,
        status: updated.status === 'Discovered' || updated.status === 'Ready to Apply' ? 'Interviewing' : updated.status,
        nextActionNote: modalNotes || `Interview scheduled for ${modalDate} (${modalTime})`
      };
    } else if (modalEventType === 'deadline') {
      updated = {
        ...updated,
        applicationDeadline: modalDate,
        nextActionNote: modalNotes || `Application deadline on ${modalDate}`
      };
    } else if (modalEventType === 'followup') {
      updated = {
        ...updated,
        nextFollowUpDate: modalDate,
        nextActionNote: modalNotes || `Follow-up scheduled on ${modalDate}`
      };
    }

    onUpdateApplication(updated);
    setSelectedDayStr(modalDate);
    setIsModalOpen(false);
  };

  // Events on selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDayStr) return [];
    return allEvents.filter(e => e.dateStr === selectedDayStr);
  }, [allEvents, selectedDayStr]);

  // Days of week
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar cells generation
  const calendarCells = useMemo(() => {
    const cells: {
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      events: CalendarEventItem[];
      isToday: boolean;
    }[] = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = totalDaysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayEvents = filteredEvents.filter(e => e.dateStr === dateStr);
      cells.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        events: dayEvents,
        isToday: dateStr === '2026-09-16'
      });
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = filteredEvents.filter(e => e.dateStr === dateStr);
      cells.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        events: dayEvents,
        isToday: dateStr === '2026-09-16'
      });
    }

    // Next month filler days (to complete 35 or 42 grid slots)
    const remainingSlots = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayEvents = filteredEvents.filter(e => e.dateStr === dateStr);
      cells.push({
        dayNumber: i,
        dateStr,
        isCurrentMonth: false,
        events: dayEvents,
        isToday: dateStr === '2026-09-16'
      });
    }

    return cells;
  }, [year, month, firstDayIndex, totalDaysInMonth, totalDaysInPrevMonth, filteredEvents]);

  // Helper for humanized relative time
  const getRelativeBadge = (dateStr: string) => {
    const target = new Date(dateStr);
    const today = new Date('2026-09-16'); // synced reference date
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Today', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (diffDays === 1) return { label: 'Tomorrow', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    if (diffDays > 1 && diffDays <= 7) return { label: `In ${diffDays} days`, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    if (diffDays > 7) return { label: `In ${diffDays} days`, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    return { label: `${Math.abs(diffDays)}d ago`, color: 'bg-slate-100 text-slate-500 border-slate-200' };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header & Controls */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Interview Schedule & Application Deadlines
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                {counts.interview} Scheduled Interview{counts.interview !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Real-time tracker of upcoming interview rounds, application closing dates, and follow-ups.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Calendar / Agenda toggle */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300 text-xs font-semibold">
            <button
              id="calendar-grid-view-btn"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'calendar' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month Grid
            </button>
            <button
              id="calendar-agenda-view-btn"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'agenda' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda List ({counts.all})
            </button>
          </div>

          <button
            id="schedule-new-event-btn"
            onClick={() => handleOpenScheduleModal()}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* Filter and Month Navigation Bar */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-900 min-w-[130px] text-center">
              {monthName} {year}
            </span>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleJumpToToday}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Today (Sept 2026)
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilterType('interview')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              filterType === 'interview'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Interviews ({counts.interview})</span>
          </button>
          <button
            onClick={() => setFilterType('deadline')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              filterType === 'deadline'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Deadlines ({counts.deadline})</span>
          </button>
          <button
            onClick={() => setFilterType('followup')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              filterType === 'followup'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Follow-Ups ({counts.followup})</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Calendar Grid (8 cols on lg) */}
          <div className="lg:col-span-8 p-4 border-b lg:border-b-0 lg:border-r border-slate-200">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1 text-center">
              {weekDays.map((d, i) => (
                <div key={d} className={`text-[11px] font-bold py-1.5 uppercase ${i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-700'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day Cells Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, idx) => {
                const isSelected = selectedDayStr === cell.dateStr;
                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => setSelectedDayStr(cell.dateStr)}
                    className={`min-h-[88px] sm:min-h-[96px] p-1.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      !cell.isCurrentMonth
                        ? 'bg-slate-50/50 border-slate-100 opacity-40'
                        : isSelected
                        ? 'bg-purple-50/40 border-purple-400 ring-2 ring-purple-400/20'
                        : cell.isToday
                        ? 'bg-amber-50/30 border-amber-300'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    {/* Day number header */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                          cell.isToday
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : isSelected
                            ? 'bg-purple-100 text-purple-900'
                            : cell.isCurrentMonth
                            ? 'text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Dot indicators if multiple */}
                      {cell.events.length > 0 && (
                        <div className="flex items-center gap-0.5">
                          {cell.events.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className={`w-1.5 h-1.5 rounded-full ${
                                ev.type === 'interview'
                                  ? 'bg-purple-600'
                                  : ev.type === 'deadline'
                                  ? 'bg-amber-500'
                                  : 'bg-blue-500'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Event badges */}
                    <div className="space-y-1 overflow-hidden">
                      {cell.events.slice(0, 2).map((ev) => {
                        const isInterview = ev.type === 'interview';
                        const isDeadline = ev.type === 'deadline';
                        return (
                          <div
                            key={ev.id}
                            title={`${ev.title} (${ev.time || ''})`}
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate border leading-tight ${
                              isInterview
                                ? 'bg-purple-100/90 text-purple-900 border-purple-200'
                                : isDeadline
                                ? 'bg-amber-100/90 text-amber-900 border-amber-200'
                                : 'bg-blue-100/90 text-blue-900 border-blue-200'
                            }`}
                          >
                            <span className="font-bold">{isInterview ? '🎙️ ' : isDeadline ? '⏳ ' : '📬 '}</span>
                            {ev.company}
                          </div>
                        );
                      })}
                      {cell.events.length > 2 && (
                        <div className="text-[9px] text-slate-500 font-semibold px-1">
                          +{cell.events.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day / Active Milestone Detail (4 cols on lg) */}
          <div className="lg:col-span-4 p-5 bg-slate-50/50 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Day Schedule
                  </h4>
                  <div className="text-sm font-bold text-slate-900">
                    {selectedDayStr ? new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('default', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Select a date'}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenScheduleModal(undefined, 'interview', selectedDayStr || undefined)}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Event</span>
                </button>
              </div>

              {/* Day Events list */}
              {selectedDayEvents.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-white space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    No interviews or deadlines scheduled for this day.
                  </p>
                  <button
                    onClick={() => handleOpenScheduleModal(undefined, 'interview', selectedDayStr || undefined)}
                    className="text-xs font-semibold text-purple-600 hover:underline"
                  >
                    + Schedule an interview on this date
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedDayEvents.map((ev) => {
                    const rel = getRelativeBadge(ev.dateStr);
                    const isTargetSelected = ev.applicationId === selectedAppId;
                    return (
                      <div
                        key={ev.id}
                        className={`p-3.5 rounded-xl border bg-white shadow-2xs space-y-2 transition ${
                          isTargetSelected ? 'border-purple-400 ring-1 ring-purple-400' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              ev.type === 'interview'
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : ev.type === 'deadline'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}>
                              {ev.type === 'interview' ? '🎙️ Upcoming Interview' : ev.type === 'deadline' ? '⏳ Application Deadline' : '📬 Follow-Up'}
                            </span>
                            <h5 className="font-bold text-slate-900 text-xs">
                              {ev.roleTitle}
                            </h5>
                            <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span>{ev.company}</span>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${rel.color}`}>
                            {rel.label}
                          </span>
                        </div>

                        {ev.time && (
                          <div className="flex items-center gap-1 text-[11px] text-purple-900 bg-purple-50/70 px-2 py-1 rounded-lg border border-purple-100 font-medium">
                            <Clock className="w-3 h-3 text-purple-600" />
                            <span>Time: <strong>{ev.time}</strong></span>
                            {ev.subType && <span className="text-slate-400">• {ev.subType}</span>}
                          </div>
                        )}

                        {ev.notes && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
                            {ev.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => onSelectApplication(ev.applicationId)}
                            className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Prepare STAR Answers</span>
                          </button>

                          <button
                            onClick={() => handleOpenScheduleModal(ev.applicationId, ev.type, ev.dateStr)}
                            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Summary of all upcoming events */}
            <div className="pt-4 border-t border-slate-200 mt-4 text-xs text-slate-500 flex items-center justify-between">
              <span>Total Tracked Milestones:</span>
              <span className="font-bold text-slate-800">{allEvents.length} events</span>
            </div>
          </div>
        </div>
      ) : (
        /* Agenda / Timeline View */
        <div className="p-5 space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">No events match the selected filter</div>
              <p className="text-xs text-slate-500">Change your filter or click below to schedule an event.</p>
              <button
                onClick={() => handleOpenScheduleModal()}
                className="mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition"
              >
                + Schedule Interview or Deadline
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEvents.map((ev) => {
                const rel = getRelativeBadge(ev.dateStr);
                const isSelected = ev.applicationId === selectedAppId;
                return (
                  <div
                    key={ev.id}
                    className={`py-3.5 px-3 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected ? 'bg-purple-50/50 border border-purple-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        ev.type === 'interview'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : ev.type === 'deadline'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {ev.type === 'interview' ? (
                          <Video className="w-5 h-5" />
                        ) : ev.type === 'deadline' ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <CalendarIcon className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            ev.type === 'interview'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : ev.type === 'deadline'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}>
                            {ev.type === 'interview' ? 'Interview' : ev.type === 'deadline' ? 'Deadline' : 'Follow-Up'}
                          </span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {ev.roleTitle}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            at <strong>{ev.company}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                          <span>Date: <strong>{ev.dateStr}</strong></span>
                          {ev.time && (
                            <span>Time: <strong>{ev.time}</strong></span>
                          )}
                          {ev.subType && (
                            <span className="text-slate-500 font-medium">• {ev.subType}</span>
                          )}
                          {ev.contactName && (
                            <span className="text-slate-500 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              {ev.contactName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${rel.color}`}>
                        {rel.label}
                      </span>
                      <button
                        onClick={() => onSelectApplication(ev.applicationId)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 transition shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Open STAR Prep</span>
                      </button>
                      <button
                        onClick={() => handleOpenScheduleModal(ev.applicationId, ev.type, ev.dateStr)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Edit event"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Schedule / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Schedule Interview or Deadline
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 text-xs">
              {/* Select Application */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Application / Role
                </label>
                <select
                  value={modalAppId}
                  onChange={(e) => setModalAppId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                >
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.job.title} ({app.job.company})
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Event Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalEventType('interview')}
                    className={`py-2 px-2 text-center rounded-xl font-semibold border transition ${
                      modalEventType === 'interview'
                        ? 'bg-purple-50 border-purple-400 text-purple-900 ring-1 ring-purple-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    🎙️ Interview
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalEventType('deadline')}
                    className={`py-2 px-2 text-center rounded-xl font-semibold border transition ${
                      modalEventType === 'deadline'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ⏳ Deadline
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalEventType('followup')}
                    className={`py-2 px-2 text-center rounded-xl font-semibold border transition ${
                      modalEventType === 'followup'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    📬 Follow-Up
                  </button>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800"
                  />
                </div>

                {modalEventType === 'interview' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Time & Timezone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2:30 PM PST"
                      value={modalTime}
                      onChange={(e) => setModalTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Interview Round Type */}
              {modalEventType === 'interview' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Interview Round
                  </label>
                  <select
                    value={modalInterviewType}
                    onChange={(e) => setModalInterviewType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                  >
                    <option value="Screening">Initial Recruiter Screen</option>
                    <option value="Hiring Manager">Hiring Manager / Founder Sync</option>
                    <option value="Technical / Task">Task Presentation / Scenario Walkthrough</option>
                    <option value="Panel">Team / Cross-Functional Panel</option>
                    <option value="Final Round">Final Decision Round</option>
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Preparation Notes / Specific Touchpoints (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Review STAR responses on handling executive calendar conflicts and Notion SOPs..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white transition shadow-xs"
                >
                  Save to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
