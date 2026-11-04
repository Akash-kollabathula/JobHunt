import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Zap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sliders,
  FileSpreadsheet,
  ShieldCheck,
  Play,
  Save,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { AutomationSettings } from '../types';
import {
  getAutomationSettings,
  saveAutomationSettings,
  getNextScheduledRunInfo,
  getIstDateTimeDetails,
} from '../services/scheduler';

interface AutomationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerTestRun: () => Promise<{ success: boolean; message: string } | void>;
  spreadsheetId: string;
}

export const AutomationSettingsModal: React.FC<AutomationSettingsModalProps> = ({
  isOpen,
  onClose,
  onTriggerTestRun,
  spreadsheetId,
}) => {
  const [settings, setSettings] = useState<AutomationSettings>(getAutomationSettings);
  const [nextRunInfo, setNextRunInfo] = useState(() => getNextScheduledRunInfo(settings));
  const [istTime, setIstTime] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  // Live IST clock
  useEffect(() => {
    const updateTime = () => {
      const ist = getIstDateTimeDetails();
      setIstTime(ist.displayFull);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update on open
  useEffect(() => {
    if (isOpen) {
      const current = getAutomationSettings();
      setSettings(current);
      setNextRunInfo(getNextScheduledRunInfo(current));
      setTestResult(null);
      setSavedNotice(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleEnabled = () => {
    const updated = { ...settings, enabled: !settings.enabled };
    setSettings(updated);
    setNextRunInfo(getNextScheduledRunInfo(updated));
  };

  const handleTimeChange = (newTime: string) => {
    const updated = { ...settings, scheduledTime: newTime };
    setSettings(updated);
    setNextRunInfo(getNextScheduledRunInfo(updated));
  };

  const handleToggleAutoSync = () => {
    const updated = { ...settings, autoSyncToSheet: !settings.autoSyncToSheet };
    setSettings(updated);
  };

  const handleSave = () => {
    saveAutomationSettings(settings);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 900);
  };

  const handleResetDefaults = () => {
    const defaults: AutomationSettings = {
      enabled: true,
      scheduledTime: '09:00',
      timezone: 'Asia/Kolkata',
      autoSyncToSheet: true,
      lastRunDate: null,
      lastRunTimestamp: null,
      lastRunStatus: null,
      notifyOnCompletion: true,
    };
    setSettings(defaults);
    setNextRunInfo(getNextScheduledRunInfo(defaults));
    saveAutomationSettings(defaults);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await onTriggerTestRun();
      const updated = getAutomationSettings();
      setSettings(updated);
      setNextRunInfo(getNextScheduledRunInfo(updated));
      setTestResult('Test run completed! Verified leads updated and queued for Google Sheet.');
    } catch (err: any) {
      setTestResult(`Test run failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const timePresets = [
    { label: '9:00 AM IST (Default & User Target)', time: '09:00' },
    { label: '8:30 AM IST (Early Morning Scan)', time: '08:30' },
    { label: '10:00 AM IST (Post-Standup Scan)', time: '10:00' },
    { label: '6:00 PM IST (Evening Batch)', time: '18:00' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Automation Settings</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                  Asia/Kolkata (IST)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure your daily Playwright QA scraper and automatic Google Sheets sync schedule.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 flex-1">
          {/* Main 9 AM Daily Sync Toggle Card */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl mt-0.5 ${
                  settings.enabled
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">Daily Automated Scrape & Sync</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      settings.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {settings.enabled ? 'Enabled' : 'Paused'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  When enabled, the background process automatically triggers every day at your chosen IST time,
                  scrapes multi-source listings within 24h, filters for 90+ score, and updates Google Sheets.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleEnabled}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.enabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Schedule Time Configuration */}
          <div className="space-y-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Scheduled Execution Time (Daily IST)</span>
              </label>
              <span className="text-[11px] font-mono text-cyan-400">
                Timezone: Asia/Kolkata (UTC+5:30)
              </span>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {timePresets.map((preset) => {
                const isSelected = settings.scheduledTime === preset.time;
                return (
                  <button
                    key={preset.time}
                    type="button"
                    onClick={() => handleTimeChange(preset.time)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium border text-left transition ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1.5" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Time Selector */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400">Or pick custom 24h IST time:</span>
              <input
                type="time"
                value={settings.scheduledTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500 font-mono">
                {settings.scheduledTime} IST daily
              </span>
            </div>
          </div>

          {/* Auto-Sync to Sheet Setting */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-900 text-cyan-400 border border-slate-800 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-white">Auto-Append to Google Sheet</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automatically append 19-column structured rows to your connected Google Sheet without asking for confirmation.
                </p>
                {spreadsheetId ? (
                  <div className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Target Sheet ID: {spreadsheetId.slice(0, 16)}...
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Please configure a Spreadsheet ID in the main panel.
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleAutoSync}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.autoSyncToSheet ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.autoSyncToSheet ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Live Scheduler Diagnostics & Next Execution */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3 font-mono text-xs">
            <div className="text-[11px] font-sans font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Scheduler Polling & Live Status</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CURRENT ASIA/KOLKATA CLOCK</span>
                <span className="text-cyan-300 font-bold">{istTime || 'Loading...'}</span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">NEXT SCHEDULED EXECUTION</span>
                <span className="text-emerald-400 font-bold">
                  {nextRunInfo.nextRunFormatted}
                </span>
                <span className="text-slate-400 text-[10px] ml-1">({nextRunInfo.timeRemaining})</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">LAST RUN STATUS</span>
              <span className="text-slate-300">
                {settings.lastRunStatus || 'No automated run recorded today yet.'}
              </span>
              {settings.lastRunTimestamp && (
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Executed at: {settings.lastRunTimestamp}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
              <span>Saved in: <span className="text-slate-400">localStorage('playwright_qa_automation_settings')</span></span>
              <span>Poller frequency: <span className="text-slate-400">Every 15s</span></span>
            </div>
          </div>

          {/* Test Run Feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.startsWith('Test run failed')
                  ? 'bg-red-950/40 border border-red-800 text-red-300'
                  : 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
              }`}
            >
              {testResult.startsWith('Test run failed') ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{testResult}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleRunTest}
              disabled={isTesting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 text-xs font-semibold transition disabled:opacity-50"
              title="Immediately test execution of the scrape & sync pipeline"
            >
              <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing Pipeline...' : 'Test Run Pipeline Now'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition"
              title="Reset schedule to default 09:00 AM IST"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedNotice ? 'Saved to LocalStorage!' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
