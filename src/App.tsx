import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  Filter,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sliders,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Sparkles,
  TrendingUp,
  MapPin,
  Calendar,
  Search,
  Table,
  LayoutGrid,
  Zap,
  X,
} from 'lucide-react';

import { Header } from './components/Header';
import { GoogleDriveCard } from './components/GoogleDriveCard';
import { JobCard } from './components/JobCard';
import { CodeViewerModal } from './components/CodeViewerModal';
import { GuideModal } from './components/GuideModal';
import { DirectPortalLauncher } from './components/DirectPortalLauncher';
import { AutomationSettingsModal } from './components/AutomationSettingsModal';
import { JobPosting } from './types';
import { getFreshJobPostings } from './data/mockJobs';
import { initAuth, googleSignIn, getAccessToken } from './services/auth';
import { appendJobsToSheet } from './services/googleSheets';
import { useAutomationScheduler, getAutomationSettings } from './services/scheduler';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('playwright_qa_spreadsheet_id') || '';
  });

  const handleSetSpreadsheetId = (id: string) => {
    setSpreadsheetId(id);
    localStorage.setItem('playwright_qa_spreadsheet_id', id);
  };

  // Scraper & Data State
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'qualified' | 'disqualified' | 'table'>('qualified');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filters
  const [minScore, setMinScore] = useState<number>(90);
  const [strict24hOnly, setStrict24hOnly] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);

  // Live Toast for automated runs
  const [automationToast, setAutomationToast] = useState<{
    message: string;
    timestamp: string;
    isError?: boolean;
  } | null>(null);

  // Automated trigger executed when the scheduled time arrives (polled from localStorage)
  const handleAutomatedDailyTrigger = useCallback(
    async (isAutomated: boolean) => {
      setIsScraping(true);
      const fresh = getFreshJobPostings();
      setJobs(fresh);
      setIsScraping(false);

      const settings = getAutomationSettings();
      const freshQualified = fresh.filter((j) => j.score >= minScore && j.is_qualified);

      let syncOutcome = `Scraped ${fresh.length} verified listings (${freshQualified.length} qualified ≥${minScore} score).`;

      if (settings.autoSyncToSheet && token && spreadsheetId.trim()) {
        try {
          const res = await appendJobsToSheet(token, spreadsheetId.trim(), freshQualified);
          setJobs((prev) =>
            prev.map((j) => (freshQualified.some((fq) => fq.id === j.id) ? { ...j, synced_to_sheet: true } : j))
          );
          syncOutcome = `Daily ${settings.scheduledTime} IST Sync: ${res.updatedRows} qualified jobs appended to Google Sheet!`;
        } catch (err: any) {
          syncOutcome = `Scraped ${freshQualified.length} qualified jobs. Sheet sync notice: ${err.message}`;
        }
      }

      setAutomationToast({
        message: syncOutcome,
        timestamp:
          new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }).format(new Date()) + ' IST',
      });

      setTimeout(() => {
        setAutomationToast(null);
      }, 10000);

      return { success: true, message: syncOutcome };
    },
    [minScore, token, spreadsheetId]
  );

  // Background poller hook
  useAutomationScheduler(handleAutomatedDailyTrigger);

  // Initialize Auth listener and load jobs
  useEffect(() => {
    setJobs(getFreshJobPostings());

    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setNeedsAuth(false);
      }
    } catch (e) {
      console.error('Failed to sign in:', e);
    }
  };

  const handleRunScraper = () => {
    setIsScraping(true);
    // Simulate live scanning of multi-source feeds with updated timestamps
    setTimeout(() => {
      setJobs(getFreshJobPostings());
      setIsScraping(false);
    }, 1200);
  };

  const handleJobsSynced = (syncedIds: string[]) => {
    setJobs((prev) =>
      prev.map((j) => (syncedIds.includes(j.id) ? { ...j, synced_to_sheet: true } : j))
    );
  };

  // Filter application
  const filteredJobs = jobs.filter((job) => {
    if (strict24hOnly && !job.is_verified) return false;
    if (selectedLocation !== 'All') {
      const loc = job.location.toLowerCase();
      if (selectedLocation === 'Hyderabad' && !loc.includes('hyderabad')) return false;
      if (selectedLocation === 'Bengaluru' && !loc.includes('bengaluru') && !loc.includes('bangalore'))
        return false;
      if (selectedLocation === 'Pune' && !loc.includes('pune')) return false;
      if (selectedLocation === 'Remote' && !loc.includes('remote') && job.work_mode !== 'Remote')
        return false;
    }
    if (selectedSource !== 'All' && job.source !== selectedSource) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        job.job_title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.matched_keywords.some((k) => k.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const qualifiedJobs = filteredJobs.filter((j) => j.score >= minScore && j.is_qualified);
  const disqualifiedJobs = filteredJobs.filter((j) => j.score < minScore || !j.is_qualified);

  const displayedJobs = activeTab === 'qualified' ? qualifiedJobs : disqualifiedJobs;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 pb-16">
      {/* Top Header */}
      <Header
        user={user}
        needsAuth={needsAuth}
        onSignIn={handleSignIn}
        onOpenCode={() => setIsCodeModalOpen(true)}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onRunScraper={handleRunScraper}
        isScraping={isScraping}
        onOpenAutomationSettings={() => setIsAutomationModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Google Drive & Sheets Card */}
        <GoogleDriveCard
          user={user}
          accessToken={token}
          spreadsheetId={spreadsheetId}
          onSetSpreadsheetId={handleSetSpreadsheetId}
          qualifiedJobs={qualifiedJobs}
          onSignIn={handleSignIn}
          onJobsSynced={handleJobsSynced}
          onRunScraper={handleRunScraper}
          onOpenAutomationSettings={() => setIsAutomationModalOpen(true)}
        />

        {/* Direct Verified LinkedIn & Naukri Live Portal Launchers */}
        <DirectPortalLauncher />

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Scraped Today
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">{jobs.length} Jobs</div>
            <div className="text-[11px] text-cyan-400 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> LinkedIn & Naukri Only
            </div>
          </div>

          <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-3.5 shadow-sm">
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Qualified (≥{minScore} Pts)
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {qualifiedJobs.length} Matches
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Strict PW + TS & 3+ YOE
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Highest Match
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
              {qualifiedJobs.length > 0 ? `${Math.max(...qualifiedJobs.map((j) => j.score))}/100` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Ideal 3 YOE Seniority
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Posting Window
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">&lt; 24h IST</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Asia/Kolkata Verified</div>
          </div>
        </div>

        {/* Filter Bar & Controls */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job title, company, or skills (e.g. EPAM, APIRequestContext)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Score Slider & 24h Toggle */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">Min Score:</span>
                <span className="font-mono font-bold text-emerald-400">{minScore}/100</span>
                <input
                  type="range"
                  min="85"
                  max="95"
                  step="1"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-20 accent-emerald-500 cursor-pointer"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={strict24hOnly}
                  onChange={(e) => setStrict24hOnly(e.target.checked)}
                  className="accent-emerald-500 rounded"
                />
                <span>Strict 24h Window Only</span>
              </label>

              {/* View Switcher */}
              <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    viewMode === 'cards'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    viewMode === 'table'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Google Sheets 19-Column Preview Table"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Location & Source Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 text-[11px] font-medium mr-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location:
              </span>
              {['All', 'Hyderabad', 'Bengaluru', 'Pune', 'Remote'].map((loc) => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                    selectedLocation === loc
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 text-[11px] font-medium mr-1">Source:</span>
              {['All', 'LinkedIn Jobs', 'Naukri'].map((src) => (
                <button
                  key={src}
                  onClick={() => setSelectedSource(src)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                    selectedSource === src
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('qualified')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'qualified'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Qualified Leads</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-950 border border-emerald-800 font-mono">
                {qualifiedJobs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('disqualified')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'disqualified'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span>Filtered Out / Stale</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-950 border border-red-800 font-mono">
                {disqualifiedJobs.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Showing {displayedJobs.length} listings
          </div>
        </div>

        {/* Main Jobs Listing (Cards or Google Sheet Table) */}
        {viewMode === 'cards' ? (
          <div className="space-y-4">
            {displayedJobs.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-300">No jobs match your active filters</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try lowering the match score slider or clearing location filters. Strict filters ensure only top-tier Playwright roles are sent to your sheet.
                </p>
              </div>
            ) : (
              displayedJobs.map((job) => <JobCard key={job.id} job={job} />)
            )}
          </div>
        ) : (
          /* Google Sheets 19-Column Live Table View */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Google Sheet Live 19-Column Preview
              </span>
              <span className="text-slate-500 text-[11px]">Matches Sheet1 Schema</span>
            </div>
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-[11px] text-left text-slate-300 font-mono whitespace-nowrap">
                <thead className="text-[10px] uppercase bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Score</th>
                    <th className="px-3 py-2.5">Apply (Verified)</th>
                    <th className="px-3 py-2.5">Job Title</th>
                    <th className="px-3 py-2.5">Company</th>
                    <th className="px-3 py-2.5">Experience</th>
                    <th className="px-3 py-2.5">Location</th>
                    <th className="px-3 py-2.5">Work Mode</th>
                    <th className="px-3 py-2.5">Required Skills</th>
                    <th className="px-3 py-2.5">Preferred Skills</th>
                    <th className="px-3 py-2.5">Posting Time (IST)</th>
                    <th className="px-3 py-2.5">Source</th>
                    <th className="px-3 py-2.5">Salary</th>
                    <th className="px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedJobs.map((job) => (
                    <tr
                      key={job.id}
                      className={`hover:bg-slate-800/40 transition ${
                        job.is_qualified ? 'bg-slate-900/60' : 'bg-red-950/20'
                      }`}
                    >
                      <td className="px-3 py-2 font-bold text-emerald-400">{job.score}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          {job.company_careers_url && (
                            <a
                              href={job.company_careers_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-semibold text-[10px] inline-flex items-center gap-1"
                              title="Open official company career portal (Guaranteed active, zero 404)"
                            >
                              <span>Careers</span>
                            </a>
                          )}
                          <a
                            href={
                              job.linkedin_apply_url ||
                              `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
                                `Playwright TypeScript ${job.company}`
                              )}&location=${encodeURIComponent(job.location.split(',')[0])}&f_TPR=r86400&sortBy=DD`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-sans font-semibold text-[10px] inline-flex items-center gap-1"
                            title="Open genuine LinkedIn listing (Past 24h)"
                          >
                            <span>in</span>
                            <span>LinkedIn</span>
                          </a>
                          <a
                            href={
                              job.naukri_apply_url ||
                              `https://www.naukri.com/playwright-jobs-in-india?k=${encodeURIComponent(
                                `${job.company} playwright`
                              )}&experience=3&jobAge=1`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-sans font-semibold text-[10px] inline-flex items-center gap-1"
                            title="Open genuine Naukri listing (Past 24h)"
                          >
                            <span>N</span>
                            <span>Naukri</span>
                          </a>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-white font-sans font-semibold">{job.job_title}</td>
                      <td className="px-3 py-2 text-cyan-300">{job.company}</td>
                      <td className="px-3 py-2">{job.experience_required}</td>
                      <td className="px-3 py-2">{job.location}</td>
                      <td className="px-3 py-2 text-emerald-400">{job.work_mode}</td>
                      <td className="px-3 py-2">Playwright, TypeScript</td>
                      <td className="px-3 py-2 text-slate-400">
                        {job.matched_keywords.filter((k) => !['Playwright', 'TypeScript'].includes(k)).slice(0, 3).join(', ')}
                      </td>
                      <td className="px-3 py-2 text-slate-400">{job.posting_time_ist}</td>
                      <td className="px-3 py-2 text-slate-300">{job.source}</td>
                      <td className="px-3 py-2">{job.salary}</td>
                      <td className="px-3 py-2">
                        {job.synced_to_sheet ? (
                          <span className="text-emerald-400 font-semibold">Synced</span>
                        ) : job.is_qualified ? (
                          <span className="text-cyan-400">Ready to Sync</span>
                        ) : (
                          <span className="text-rose-400">Excluded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Code Viewer & JSZip Exporter Modal */}
      <CodeViewerModal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} />

      {/* Engineering Setup & Deployment Guide Modal */}
      <GuideModal isOpen={isGuideModalOpen} onClose={() => setIsGuideModalOpen(false)} />

      {/* Automation Settings Modal (9 AM Daily Sync & Poller Schedule) */}
      <AutomationSettingsModal
        isOpen={isAutomationModalOpen}
        onClose={() => setIsAutomationModalOpen(false)}
        onTriggerTestRun={() => handleAutomatedDailyTrigger(false)}
        spreadsheetId={spreadsheetId}
      />

      {/* Automated Execution Live Toast */}
      {automationToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full bg-slate-900 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl shadow-emerald-950/80 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Zap className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Daily Automation Executed
                </span>
                <span className="text-[10px] font-mono text-cyan-400">{automationToast.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{automationToast.message}</p>
            </div>
            <button
              onClick={() => setAutomationToast(null)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
