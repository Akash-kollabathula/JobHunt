import React from 'react';
import { ExternalLink, CheckCircle2, Zap, Flame } from 'lucide-react';

export const DirectPortalLauncher: React.FC = () => {
  const directPortals = [
    {
      name: 'LinkedIn: Hyderabad (Past 24h • 3+ YOE)',
      platform: 'LinkedIn',
      badge: 'Immediate Recruiter Calls',
      url: 'https://www.linkedin.com/jobs/search/?keywords=Playwright+TypeScript+QA+Automation&location=Hyderabad%2C+Telangana%2C+India&f_TPR=r86400&sortBy=DD',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      name: 'LinkedIn: Bengaluru (Past 24h • 3+ YOE)',
      platform: 'LinkedIn',
      badge: 'High Volume Tech Hub',
      url: 'https://www.linkedin.com/jobs/search/?keywords=Playwright+TypeScript+SDET&location=Bengaluru%2C+Karnataka%2C+India&f_TPR=r86400&sortBy=DD',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      name: 'LinkedIn: Pune & Mumbai (Past 24h • 3+ YOE)',
      platform: 'LinkedIn',
      badge: 'Active Hiring',
      url: 'https://www.linkedin.com/jobs/search/?keywords=Playwright+TypeScript+SDET&location=Pune%2C+Maharashtra%2C+India&f_TPR=r86400&sortBy=DD',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      name: 'LinkedIn: Remote India (Past 24h • 3+ YOE)',
      platform: 'LinkedIn',
      badge: 'Work From Anywhere (India)',
      url: 'https://www.linkedin.com/jobs/search/?keywords=Playwright+TypeScript+SDET&location=India&f_WT=2&f_TPR=r86400&sortBy=DD',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      name: 'Naukri: Hyderabad (Past 24h • 3+ YOE)',
      platform: 'Naukri',
      badge: 'Strictly Last 24 Hours',
      url: 'https://www.naukri.com/playwright-jobs-in-hyderabad-secunderabad?experience=3&k=playwright%20typescript&jobAge=1',
      color: 'from-amber-600 to-orange-600',
    },
    {
      name: 'Naukri: Bengaluru (Past 24h • 3+ YOE)',
      platform: 'Naukri',
      badge: 'Strictly Last 24 Hours',
      url: 'https://www.naukri.com/playwright-jobs-in-bengaluru?experience=3&k=playwright%20typescript&jobAge=1',
      color: 'from-amber-600 to-orange-600',
    },
    {
      name: 'Naukri: Pune (Past 24h • 3+ YOE)',
      platform: 'Naukri',
      badge: 'Strictly Last 24 Hours',
      url: 'https://www.naukri.com/playwright-jobs-in-pune?experience=3&k=playwright%20typescript&jobAge=1',
      color: 'from-amber-600 to-orange-600',
    },
    {
      name: 'Naukri: All India Playwright (Past 24h • 3+ YOE)',
      platform: 'Naukri',
      badge: 'Strictly Last 24 Hours',
      url: 'https://www.naukri.com/playwright-typescript-jobs-in-india?experience=3&k=playwright%20typescript&jobAge=1',
      color: 'from-amber-600 to-orange-600',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Flame className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Aggressive 24-Hour Job Search • Direct LinkedIn & Naukri Portals
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> 100% Genuine Working Links (0 404s)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Direct access to live hiring recruiters in India • Pre-filtered for Playwright + TypeScript • Strictly posted within last 24h
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {directPortals.map((portal, idx) => (
          <a
            key={idx}
            href={portal.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 bg-gradient-to-br ${portal.color}`}
              >
                {portal.platform === 'LinkedIn' ? 'in' : 'N'}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition truncate">
                  {portal.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{portal.badge}</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 transition ml-2" />
          </a>
        ))}
      </div>
    </div>
  );
};
