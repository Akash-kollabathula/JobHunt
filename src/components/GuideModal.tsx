import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Terminal,
  ShieldCheck,
  Calendar,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'windows' | 'google' | 'github' | 'scoring' | 'trouble'>('windows');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Deployment & Engineering Setup Walkthrough
              </h2>
              <p className="text-xs text-slate-400">
                Official guide for Akash Kollabathula • Windows, Service Account & Daily 9:00 AM IST Cron
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

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-950/40 gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('windows')}
            className={`py-3 px-3 font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'windows'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Windows & VS Code
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`py-3 px-3 font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'google'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Google Sheets & Service Account
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`py-3 px-3 font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'github'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. GitHub Actions 9 AM IST Cron
          </button>
          <button
            onClick={() => setActiveTab('scoring')}
            className={`py-3 px-3 font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'scoring'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            4. 100-Point Scoring & 24h Window
          </button>
          <button
            onClick={() => setActiveTab('trouble')}
            className={`py-3 px-3 font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'trouble'
                ? 'border-rose-400 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            5. Troubleshooting
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-300 space-y-4">
          {activeTab === 'windows' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" /> Windows 11/10 & VS Code Setup
              </h3>
              <p className="leading-relaxed">
                Follow these exact steps in your VS Code terminal to initialize your Python environment:
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
                <div>
                  <div className="text-slate-500 mb-1"># 1. Create Python 3.12 Virtual Environment:</div>
                  <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded text-slate-200">
                    <span>python -m venv .venv</span>
                    <button
                      onClick={() => copyToClipboard('python -m venv .venv', 'c1')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedText === 'c1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1"># 2. Activate Virtual Environment (PowerShell):</div>
                  <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded text-slate-200">
                    <span>.\.venv\Scripts\Activate.ps1</span>
                    <button
                      onClick={() => copyToClipboard('.\\.venv\\Scripts\\Activate.ps1', 'c2')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedText === 'c2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1"># 3. Install Required Dependencies:</div>
                  <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded text-slate-200">
                    <span>pip install -r requirements.txt</span>
                    <button
                      onClick={() => copyToClipboard('pip install -r requirements.txt', 'c3')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedText === 'c3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1"># 4. Run Pytest Suite:</div>
                  <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded text-slate-200">
                    <span>pytest test_scraper.py -v</span>
                    <button
                      onClick={() => copyToClipboard('pytest test_scraper.py -v', 'c4')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedText === 'c4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-1"># 5. Execute Safe Dry-Run:</div>
                  <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded text-slate-200">
                    <span>python job_scraper.py --dry-run</span>
                    <button
                      onClick={() => copyToClipboard('python job_scraper.py --dry-run', 'c5')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedText === 'c5' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'google' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Google Service Account Setup
              </h3>
              <ol className="list-decimal list-inside space-y-2.5 leading-relaxed text-slate-300">
                <li>
                  Go to <strong className="text-white">Google Cloud Console</strong> & create or select your project.
                </li>
                <li>
                  Under <strong className="text-white">APIs & Services &gt; Library</strong>, enable both <span className="text-emerald-400 font-mono">Google Sheets API</span> and <span className="text-emerald-400 font-mono">Google Drive API</span>.
                </li>
                <li>
                  Go to <strong className="text-white">Credentials &gt; Create Credentials &gt; Service Account</strong>. Name it <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">qa-job-updater</code>.
                </li>
                <li>
                  Click on the service account email &gt; <strong className="text-white">Keys &gt; Add Key &gt; Create new key (JSON)</strong>.
                </li>
                <li>
                  Save the key as <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">service_account_credentials.json</code>.
                </li>
                <li>
                  <strong className="text-amber-400">CRITICAL STEP:</strong> Open your Google Sheet in browser &gt; click <strong className="text-white">Share</strong> &gt; paste the service account client email (<code className="bg-slate-800 px-1 text-slate-300">...@...iam.gserviceaccount.com</code>) with <strong className="text-emerald-400">Editor</strong> permissions!
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" /> GitHub Actions Daily 9:00 AM IST Cron
              </h3>
              <p className="leading-relaxed">
                The workflow in <code className="text-cyan-300 font-mono">.github/workflows/daily-job-scraper.yml</code> is scheduled at:
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-emerald-400 text-center text-sm font-bold">
                cron: '30 3 * * *' # 3:30 AM UTC = 9:00 AM IST
              </div>
              <p className="text-slate-400 text-[11px]">
                Note: GitHub Actions crons run on shared virtualization runners. Under high global traffic, runs may experience a 5–15 minute queue delay before executing.
              </p>

              <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-4">
                Required Repository Secrets:
              </h4>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-mono text-cyan-400 font-bold">SPREADSHEET_ID</div>
                  <div className="text-slate-400 text-[11px]">Your Google Sheet ID from URL.</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-mono text-amber-400 font-bold">GOOGLE_CREDENTIALS_JSON</div>
                  <div className="text-slate-400 text-[11px]">Paste the entire raw text of your service-account JSON key.</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-mono text-emerald-400 font-bold">RAPIDAPI_KEY</div>
                  <div className="text-slate-400 text-[11px]">Your free JSearch RapidAPI Key.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" /> 100-Point Match Score & 24h Window
              </h3>
              <p className="leading-relaxed">
                Every job is evaluated against Akash\'s 3-year Playwright + TypeScript resume:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                  <span>1. Playwright & TypeScript (Mandatory)</span>
                  <span className="text-emerald-400 font-bold">30 pts</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                  <span>2. Experience Fit (2–5 YOE, 3 priority)</span>
                  <span className="text-emerald-400 font-bold">15 pts</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                  <span>3. Framework POM & Custom Fixtures</span>
                  <span className="text-emerald-400 font-bold">15 pts</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                  <span>4. API Testing (APIRequestContext)</span>
                  <span className="text-emerald-400 font-bold">10 pts</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                  <span>5. CI/CD (GitHub Actions / Jenkins)</span>
                  <span className="text-emerald-400 font-bold">10 pts</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                  <span>6. E2E, Parallel & Flaky Reduction</span>
                  <span className="text-emerald-400 font-bold">10 pts</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                  <span>7. Allure, Trace Viewer & AI Tools</span>
                  <span className="text-emerald-400 font-bold">5 pts</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                  <span>8. Location Alignment (India / Remote)</span>
                  <span className="text-emerald-400 font-bold">5 pts</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                <strong>Threshold:</strong> Only jobs scoring <strong>≥ 90/100</strong> with verified original posting timestamp &lt; 24h are appended.
              </div>
            </div>
          )}

          {activeTab === 'trouble' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" /> Troubleshooting Common Issues
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-bold text-rose-400">403: The caller does not have permission</div>
                  <p className="text-slate-400 mt-1">
                    You have not shared your Google Sheet with the Service Account email. Open the Sheet, click Share, add the email with Editor permission.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-bold text-amber-400">Empty results (0 qualified jobs found)</div>
                  <p className="text-slate-400 mt-1">
                    Strict filters are functioning as designed: jobs older than 24 hours or missing TypeScript were excluded to preserve high-match quality.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-bold text-cyan-400">429: Too Many Requests on RapidAPI</div>
                  <p className="text-slate-400 mt-1">
                    Monthly quota exceeded on free plan. Exponential backoff will retry automatically, or use the multi-portal compliant scraper adapter.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
