import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  BookOpen,
  LogOut,
  Sparkles,
  Zap,
  Sliders,
} from 'lucide-react';
import { logout } from '../services/auth';
import { getAutomationSettings } from '../services/scheduler';

interface HeaderProps {
  user: User | null;
  needsAuth: boolean;
  onSignIn: () => void;
  onOpenCode: () => void;
  onOpenGuide: () => void;
  onRunScraper: () => void;
  isScraping: boolean;
  onOpenAutomationSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  needsAuth,
  onSignIn,
  onOpenCode,
  onOpenGuide,
  onRunScraper,
  isScraping,
  onOpenAutomationSettings,
}) => {
  const [istTime, setIstTime] = useState<string>('');
  const [isAutoEnabled, setIsAutoEnabled] = useState<boolean>(true);
  const [scheduledTime, setScheduledTime] = useState<string>('09:00');

  useEffect(() => {
    const syncSettings = () => {
      const s = getAutomationSettings();
      setIsAutoEnabled(s.enabled);
      setScheduledTime(s.scheduledTime);
    };
    syncSettings();
    window.addEventListener('storage', syncSettings);
    window.addEventListener('automation_settings_updated', syncSettings);
    return () => {
      window.removeEventListener('storage', syncSettings);
      window.removeEventListener('automation_settings_updated', syncSettings);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour12: true,
      }).format(now);
      setIstTime(formatted);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Candidate Profile Info & JobHunt Brand */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-extrabold text-slate-950 text-xl shadow-lg shadow-emerald-500/20 shrink-0 tracking-tight">
              JH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  <span>JobHunt</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Akash (3+ YOE)
                  </span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Playwright & TS Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Strictly LinkedIn & Naukri Verified 24h Roles • Score ≥90 • Daily 9:00 AM IST Sync
              </p>
            </div>
          </div>

          {/* Time & Clock Widget */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <button
              onClick={onOpenAutomationSettings}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-xs text-slate-300 transition cursor-pointer"
              title="Click to view and adjust Daily 9:00 AM IST Automation Settings"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>IST:</span>
              <span className="font-mono font-semibold text-white">{istTime || 'Loading...'}</span>
              <span className="hidden sm:inline text-slate-500">|</span>
              <span className="hidden sm:inline text-slate-400 flex items-center gap-1">
                {isAutoEnabled ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>Next: {scheduledTime} IST</span>
                  </>
                ) : (
                  <span className="text-slate-500">Auto: Paused</span>
                )}
              </span>
            </button>

            {/* Google Drive / Auth state */}
            {user ? (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google Account'}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <div className="max-w-[130px] sm:max-w-[180px] truncate text-slate-200">
                  <span className="text-slate-400 block text-[10px] leading-tight">Drive & Sheets</span>
                  {user.displayName || user.email}
                </div>
                <button
                  onClick={() => logout()}
                  title="Sign out of Google"
                  className="p-1 hover:text-red-400 text-slate-400 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-slate-800 font-medium text-xs hover:bg-slate-100 transition shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            )}

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                title="View and download complete Python project files"
              >
                <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Project Files</span>
              </button>

              <button
                onClick={onOpenGuide}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                title="Setup guide for Windows, VS Code, Service Account & GitHub Actions"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Setup Guide</span>
              </button>

              <button
                onClick={onOpenAutomationSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 hover:border-emerald-500/50 transition relative"
                title="Configure 9:00 AM IST Daily Automation and Google Sheets sync schedule"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Automation</span>
                {isAutoEnabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-slate-900" />
                )}
              </button>

              <button
                onClick={onRunScraper}
                disabled={isScraping}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition"
              >
                <Zap className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
                <span>{isScraping ? 'Scraping...' : 'Run Scraper'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
