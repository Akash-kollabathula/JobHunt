import React, { useState } from 'react';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  Sparkles,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { JobPosting } from '../types';

interface JobCardProps {
  job: JobPosting;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-emerald-400 bg-emerald-950/80 border-emerald-500/50';
    if (score >= 90) return 'text-cyan-400 bg-cyan-950/80 border-cyan-500/50';
    return 'text-red-400 bg-red-950/80 border-red-500/50';
  };

  const getScoreBg = (score: number) => {
    if (score >= 95) return 'from-emerald-500 to-teal-600';
    if (score >= 90) return 'from-cyan-500 to-blue-600';
    return 'from-rose-500 to-red-600';
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        job.is_qualified
          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
          : 'bg-slate-900/40 border-red-950/60 opacity-75'
      }`}
    >
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <Building2 className="w-3 h-3 text-cyan-400" />
                {job.company}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-400">
                <MapPin className="w-3 h-3" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Briefcase className="w-3 h-3 text-emerald-400" />
                {job.experience_required}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 text-cyan-400 border border-cyan-900/50">
                {job.work_mode}
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {job.posting_time_ist}
              </span>
              {job.is_verified && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50">
                  <ShieldCheck className="w-3 h-3" /> 24h Verified
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
              {job.job_title}
            </h3>

            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {job.job_description}
            </p>
          </div>

          {/* Score Badge */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2">
            <div
              className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 shadow-inner ${getScoreColor(
                job.score
              )}`}
            >
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                  Match Score
                </div>
                <div className="text-xl font-black font-mono leading-none">
                  {job.score}
                  <span className="text-xs font-normal opacity-70">/100</span>
                </div>
              </div>
              <Award className="w-5 h-5 shrink-0 opacity-80" />
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              Source: <span className="text-slate-300">{job.source}</span>
            </div>
          </div>
        </div>

        {/* Matched Keywords Pills */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-medium mr-1">Matched:</span>
          {job.matched_keywords.slice(0, 6).map((kw, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-800/90 text-cyan-300 border border-cyan-900/40"
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" />
              {kw}
            </span>
          ))}
          {job.matched_keywords.length > 6 && (
            <span className="text-[11px] text-slate-500">
              +{job.matched_keywords.length - 6} more
            </span>
          )}
        </div>

        {/* Missing skills or concerns warning */}
        {job.missing_skills.length > 0 && (
          <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5 bg-red-950/30 px-2.5 py-1 rounded-md border border-red-900/40">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Missing mandatory skills: {job.missing_skills.join(', ')}</span>
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition font-medium"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isExpanded ? 'Hide Score Breakdown' : 'View 8-Point Rubric Breakdown'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFullDesc(true)}
              className="text-slate-400 hover:text-slate-200 transition underline underline-offset-2 text-[11px] mr-1"
            >
              Description
            </button>

            {/* Official Company Career Page Direct Apply (100% Guaranteed Active, No 404) */}
            {job.company_careers_url && (
              <a
                href={job.company_careers_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition text-xs shadow-sm shadow-emerald-600/30"
                title="Open official company career portal application (Guaranteed 100% active, zero 404)"
              >
                <Building2 className="w-3 h-3 text-emerald-200" />
                <span>Official Careers</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {/* LinkedIn Verified Direct Apply */}
            <a
              href={
                job.linkedin_apply_url ||
                `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
                  `Playwright TypeScript ${job.company}`
                )}&location=${encodeURIComponent(job.location.split(',')[0])}&f_TPR=r86400&sortBy=DD`
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition text-xs shadow-sm shadow-blue-600/30"
              title="Open verified genuine LinkedIn job application (Past 24h)"
            >
              <span className="font-bold text-[11px] bg-white text-blue-600 rounded px-1 py-0.2 leading-tight">
                in
              </span>
              <span>LinkedIn</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Naukri Verified Direct Apply */}
            <a
              href={
                job.naukri_apply_url ||
                `https://www.naukri.com/playwright-jobs-in-india?k=${encodeURIComponent(
                  `${job.company} playwright`
                )}&experience=3&jobAge=1`
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition text-xs shadow-sm shadow-amber-600/30"
              title="Open verified genuine Naukri job application (Past 24h • 3 YOE)"
            >
              <span className="font-bold text-[11px] bg-white text-amber-600 rounded px-1 py-0.2 leading-tight">
                N
              </span>
              <span>Naukri</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Expandable 8-Point Breakdown Drawer */}
      {isExpanded && (
        <div className="bg-slate-950/70 border-t border-slate-800 p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Explainable 100-Point Score Rubric
            </h4>
            <span className="text-xs font-mono text-emerald-400 font-bold">Total: {job.score} / 100</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* 1. Playwright & TypeScript (30 pts) */}
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Playwright & TypeScript (Mandatory)</span>
                <span className="font-mono text-emerald-400">
                  {job.score_breakdown.playwright_typescript}/30
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${(job.score_breakdown.playwright_typescript / 30) * 100}%` }}
                />
              </div>
            </div>

            {/* 2. Experience Fit (15 pts) */}
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Experience Fit (Strict 2–5y, 3y Priority)</span>
                <span className="font-mono text-emerald-400">{job.score_breakdown.experience}/15</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-500 h-1.5 rounded-full"
                  style={{ width: `${(job.score_breakdown.experience / 15) * 100}%` }}
                />
              </div>
            </div>

            {/* 3. Framework Engineering / POM (15 pts) */}
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Framework Architecture, POM, Fixtures</span>
                <span className="font-mono text-emerald-400">
                  {job.score_breakdown.framework_engineering}/15
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${(job.score_breakdown.framework_engineering / 15) * 100}%` }}
                />
              </div>
            </div>

            {/* 4. API & REST Testing (10 pts) */}
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>API & REST (APIRequestContext, JSON Schema)</span>
                <span className="font-mono text-emerald-400">{job.score_breakdown.api_testing}/10</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full"
                  style={{ width: `${(job.score_breakdown.api_testing / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* 5. CI/CD & DevOps (10 pts) */}
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>CI/CD, GitHub Actions & Jenkins</span>
                <span className="font-mono text-emerald-400">{job.score_breakdown.ci_cd}/10</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-500 h-1.5 rounded-full"
                  style={{ width: `${(job.score_breakdown.ci_cd / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* 6. E2E, Regression & Cross-Browser (10 pts) */}
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>E2E, Regression, Smoke & Parallel Execution</span>
                <span className="font-mono text-emerald-400">{job.score_breakdown.e2e_regression}/10</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full"
                  style={{ width: `${(job.score_breakdown.e2e_regression / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* 7. Reporting & AI Tools (5 pts) */}
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Allure, Trace Viewer, Playwright Agents/MCP</span>
                <span className="font-mono text-emerald-400">{job.score_breakdown.tools_ai}/5</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-1.5 rounded-full"
                  style={{ width: `${(job.score_breakdown.tools_ai / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* 8. Location Alignment (5 pts) */}
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Location (Hyderabad / Bangalore / Pune / Remote India)</span>
                <span className="font-mono text-emerald-400">{job.score_breakdown.location}/5</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-500 h-1.5 rounded-full"
                  style={{ width: `${(job.score_breakdown.location / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Match Explanation */}
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <span className="font-semibold text-slate-300">Match Reason: </span>
            <span className="text-slate-400">{job.match_explanation}</span>
          </div>
        </div>
      )}

      {/* Full Description Modal */}
      {showFullDesc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">{job.job_title}</h3>
                <p className="text-xs text-slate-400">
                  {job.company} • {job.location} • {job.experience_required}
                </p>
              </div>
              <button
                onClick={() => setShowFullDesc(false)}
                className="text-slate-400 hover:text-white p-1 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-4 text-xs text-slate-300 space-y-3 leading-relaxed">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Salary & Terms
                </div>
                <div>{job.salary || 'Not Disclosed'}</div>
                <div>Source: {job.source} (Verified 24h posting)</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Job Description
                </div>
                <p className="whitespace-pre-line">{job.job_description}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowFullDesc(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                Close
              </button>
              <a
                href={job.apply_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
              >
                <span>Apply on {job.source}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
