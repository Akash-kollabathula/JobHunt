export interface JobPosting {
  id: string;
  job_title: string;
  company: string;
  location: string;
  work_mode: 'Hybrid' | 'Remote' | 'On-site';
  experience_required: string;
  job_description: string;
  job_description_url: string;
  apply_url: string;
  company_careers_url?: string;
  linkedin_apply_url?: string;
  naukri_apply_url?: string;
  google_jobs_url?: string;
  posting_time_utc: string; // ISO string
  posting_time_ist: string;
  source: string;
  salary: string;
  is_verified: boolean;
  score: number;
  is_qualified: boolean;
  score_breakdown: {
    playwright_typescript: number;
    experience: number;
    framework_engineering: number;
    api_testing: number;
    ci_cd: number;
    e2e_regression: number;
    tools_ai: number;
    location: number;
  };
  matched_keywords: string[];
  missing_skills: string[];
  match_explanation: string;
  concerns: string[];
  synced_to_sheet?: boolean;
}

export interface SheetRowData {
  first_seen_ist: string;
  posting_time_ist: string;
  job_title: string;
  company: string;
  experience_required: string;
  location: string;
  work_mode: string;
  required_skills: string;
  preferred_skills: string;
  score: number;
  score_breakdown: string;
  match_explanation: string;
  missing_skills: string;
  salary: string;
  job_description_url: string;
  apply_url: string;
  source: string;
  verification_status: string;
  status: string;
}

export interface AutomationSettings {
  enabled: boolean;
  scheduledTime: string; // "09:00" in 24-hour format
  timezone: string; // "Asia/Kolkata"
  autoSyncToSheet: boolean;
  lastRunDate: string | null; // e.g. "2026-11-01"
  lastRunTimestamp: string | null; // e.g. "01 Nov 2026, 09:00:00 AM IST"
  lastRunStatus: string | null; // Status message of last run
  notifyOnCompletion: boolean;
}
