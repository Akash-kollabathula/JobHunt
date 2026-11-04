import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  PlusCircle,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  RefreshCw,
  Lock,
  Copy,
  Download,
  Clock,
  Zap,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { JobPosting } from '../types';
import { createSpreadsheetInDrive, appendJobsToSheet, SHEET_HEADERS } from '../services/googleSheets';
import { getAutomationSettings } from '../services/scheduler';

interface GoogleDriveCardProps {
  user: User | null;
  accessToken: string | null;
  spreadsheetId: string;
  onSetSpreadsheetId: (id: string) => void;
  qualifiedJobs: JobPosting[];
  onSignIn: () => void;
  onJobsSynced: (jobIds: string[]) => void;
  onRunScraper?: () => void;
  onOpenAutomationSettings?: () => void;
}

export const GoogleDriveCard: React.FC<GoogleDriveCardProps> = ({
  user,
  accessToken,
  spreadsheetId,
  onSetSpreadsheetId,
  qualifiedJobs,
  onSignIn,
  onJobsSynced,
  onRunScraper,
  onOpenAutomationSettings,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoSyncNoPrompt, setAutoSyncNoPrompt] = useState(true);
  const [scheduleSettings, setScheduleSettings] = useState(() => getAutomationSettings());

  // Live Asia/Kolkata clock
  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setScheduleSettings(getAutomationSettings());
    };
    window.addEventListener('storage', handleSettingsUpdate);
    window.addEventListener('automation_settings_updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('storage', handleSettingsUpdate);
      window.removeEventListener('automation_settings_updated', handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTime(
        new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(now) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unsyncedJobs = qualifiedJobs.filter((j) => !j.synced_to_sheet);

  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      setErrorMsg('Please connect your Google Account first.');
      return;
    }
    setIsCreating(true);
    setErrorMsg(null);
    try {
      const sheetName = `Akash Kollabathula - Daily Playwright QA Jobs (${new Date().toLocaleDateString('en-IN')})`;
      const result = await createSpreadsheetInDrive(accessToken, sheetName);
      onSetSpreadsheetId(result.spreadsheetId);
      setCreatedUrl(result.spreadsheetUrl);
      setSyncStatus(`Created new Google Sheet: "${sheetName}" with 19 columns configured.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create Google Sheet in Drive.');
    } finally {
      setIsCreating(false);
    }
  };

  const executeSync = async () => {
    if (!accessToken || !spreadsheetId.trim()) return;
    setIsSyncing(true);
    setErrorMsg(null);
    try {
      const res = await appendJobsToSheet(accessToken, spreadsheetId.trim(), unsyncedJobs);
      setSyncStatus(`Successfully appended ${res.updatedRows} qualified job rows to your Google Sheet!`);
      onJobsSynced(unsyncedJobs.map((j) => j.id));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to append rows to Google Sheet.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTriggerSync = () => {
    if (!accessToken) {
      setErrorMsg('Please connect your Google Account first.');
      return;
    }
    if (!spreadsheetId.trim()) {
      setErrorMsg('Please specify or create a Google Spreadsheet ID first.');
      return;
    }
    if (unsyncedJobs.length === 0) {
      setSyncStatus('All qualified jobs are already synced to your sheet.');
      return;
    }

    if (autoSyncNoPrompt) {
      // Auto-sync without repeatedly showing annoying popups
      executeSync();
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleDaily9amTrigger = async () => {
    if (onRunScraper) {
      onRunScraper();
    }
    if (accessToken && spreadsheetId.trim()) {
      setTimeout(() => {
        executeSync();
      }, 1500);
    }
  };

  // Direct 1-Click Copy for Google Sheets (Ctrl+V)
  const handleCopyTsv = () => {
    const nowIstStr =
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date()) + ' IST';

    const headerLine = SHEET_HEADERS.join('\t');
    const rows = qualifiedJobs.map((job) =>
      [
        nowIstStr,
        job.posting_time_ist,
        job.job_title,
        job.company,
        job.experience_required,
        job.location,
        job.work_mode,
        'Playwright, TypeScript',
        job.matched_keywords.filter((k) => !['Playwright', 'TypeScript'].includes(k)).join(', '),
        job.score,
        `Core: ${job.score_breakdown.playwright_typescript}/30 | Exp: ${job.score_breakdown.experience}/15 | POM: ${job.score_breakdown.framework_engineering}/15 | API: ${job.score_breakdown.api_testing}/10`,
        job.match_explanation,
        job.missing_skills.length > 0 ? job.missing_skills.join(', ') : 'None',
        job.salary || 'Not Disclosed',
        job.job_description_url,
        job.company_careers_url || job.apply_url,
        job.source,
        'Verified',
        'New Match',
      ].join('\t')
    );

    const fullTsv = [headerLine, ...rows].join('\n');
    navigator.clipboard.writeText(fullTsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Download CSV
  const handleDownloadCsv = () => {
    const nowIstStr =
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

    const escapeCsv = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;

    const headerLine = SHEET_HEADERS.map(escapeCsv).join(',');
    const rows = qualifiedJobs.map((job) =>
      [
        nowIstStr,
        job.posting_time_ist,
        job.job_title,
        job.company,
        job.experience_required,
        job.location,
        job.work_mode,
        'Playwright, TypeScript',
        job.matched_keywords.filter((k) => !['Playwright', 'TypeScript'].includes(k)).join('; '),
        job.score,
        `Score: ${job.score}/100`,
        job.match_explanation,
        job.missing_skills.join('; ') || 'None',
        job.salary || 'Not Disclosed',
        job.job_description_url,
        job.company_careers_url || job.apply_url,
        job.source,
        'Verified',
        'New Match',
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csvContent = [headerLine, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `playwright_qa_jobs_${nowIstStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openSheetUrl =
    createdUrl ||
    (spreadsheetId.trim()
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId.trim()}/edit`
      : null);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
      {/* Background Accent */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 9:00 AM IST Daily Automation Trigger Header */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/50 border border-emerald-900/40 rounded-xl p-3 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Daily {scheduleSettings.scheduledTime} IST Automation
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  scheduleSettings.enabled
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800/80'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {scheduleSettings.enabled
                  ? `Active • Daily at ${scheduleSettings.scheduledTime} IST`
                  : 'Automation Paused'}
              </span>
              <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 hidden sm:inline">
                Cron: 30 3 * * * UTC
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Current IST Clock:{' '}
              <span className="font-mono font-bold text-cyan-400">{istTime || 'Loading...'}</span> •
              {scheduleSettings.enabled
                ? ` Next automated run set for ${scheduleSettings.scheduledTime} IST (polls localStorage)`
                : ' Click Configure Schedule to enable daily automated runs'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenAutomationSettings && (
            <button
              onClick={onOpenAutomationSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/50 text-xs font-medium transition"
              title="Open Automation Settings Modal to adjust daily schedule and toggles"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Automation Settings</span>
            </button>
          )}

          <button
            onClick={handleDaily9amTrigger}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm shadow-emerald-600/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Trigger Scrape & Sync Now</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title and Status */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Google Sheets & Drive Integration
              </h2>
              {user ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> Auth Optional (Direct ID / Copy Ready)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sync verified 90+ score Playwright SDET leads with 19 standardized columns directly into Google Sheet.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Copy TSV for immediate Google Sheets paste */}
          <button
            onClick={handleCopyTsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 text-xs font-semibold transition"
            title="Copy 19 columns with headers directly to clipboard to paste (Ctrl+V) into any Google Sheet"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied to Clipboard!' : 'Copy for Google Sheets (Ctrl+V)'}</span>
          </button>

          {/* Download CSV */}
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
            title="Download CSV file formatted for Google Sheets import"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download CSV</span>
          </button>

          {!user ? (
            <button
              onClick={onSignIn}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white text-slate-800 font-semibold text-xs hover:bg-slate-100 shadow transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Connect Google Drive</span>
            </button>
          ) : (
            <>
              {/* Create New Sheet Button */}
              <button
                onClick={handleCreateNewSheet}
                disabled={isCreating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition disabled:opacity-50"
                title="Create a brand new Google Sheet in your Drive with 19 columns configured"
              >
                <PlusCircle className={`w-3.5 h-3.5 text-cyan-400 ${isCreating ? 'animate-spin' : ''}`} />
                <span>{isCreating ? 'Creating Sheet...' : 'Create New Sheet'}</span>
              </button>

              {/* Sync Button */}
              <button
                onClick={handleTriggerSync}
                disabled={isSyncing || unsyncedJobs.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-pulse' : ''}`} />
                <span>
                  {isSyncing
                    ? 'Syncing to Sheet...'
                    : `Sync ${unsyncedJobs.length} Jobs to Sheet`}
                </span>
              </button>

              {/* Open in Google Sheets Link */}
              {openSheetUrl && (
                <a
                  href={openSheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/60 font-medium text-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Sheet</span>
                </a>
              )}
            </>
          )}
        </div>
      </div>

      {/* Spreadsheet ID Input & Persistent Storage Row */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-xl">
          <label className="text-slate-400 shrink-0 font-medium">Spreadsheet ID:</label>
          <input
            type="text"
            value={spreadsheetId}
            onChange={(e) => onSetSpreadsheetId(e.target.value)}
            placeholder="Paste your Google Spreadsheet ID (Auto-saved permanently)"
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-slate-200 placeholder:text-slate-600 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
          />
          {spreadsheetId && (
            <span className="text-[10px] text-emerald-400 shrink-0 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Auto-Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-400 shrink-0 flex-wrap">
          <label className="flex items-center gap-1.5 text-slate-300 text-[11px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSyncNoPrompt}
              onChange={(e) => setAutoSyncNoPrompt(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span>Auto-Sync without confirmation popups</span>
          </label>
          <span>•</span>
          <span>Worksheet: <span className="font-mono text-slate-300">Sheet1</span></span>
        </div>
      </div>

      {/* Status or Error Notifications */}
      {syncStatus && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Confirmation Modal (only shown if autoSyncNoPrompt is disabled) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <UploadCloud className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirm Google Sheets Sync</h3>
            </div>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to append <strong className="text-emerald-400">{unsyncedJobs.length} new qualified job leads</strong> (Score ≥ 90) to your Google Sheet?
            </p>
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 mb-5 font-mono">
              <div>Target Sheet: {spreadsheetId || 'Current Connected Sheet'}</div>
              <div>Columns: 19 standardized fields</div>
              <div>Deduplication: Canonical URL + Company/Title</div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  executeSync();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition"
              >
                Yes, Append to Google Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
