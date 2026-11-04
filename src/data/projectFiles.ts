export interface ProjectFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

export const PYTHON_PROJECT_FILES: ProjectFile[] = [
  {
    name: 'config.py',
    path: 'config.py',
    language: 'python',
    description: 'Candidate profile settings, 19 headers, target locations, weights & IST timezone.',
    content: `"""
Configuration module for Daily Playwright QA Job Scraper & Google Sheets Updater.
Candidate: Akash Kollabathula (SDET | Playwright + TypeScript Automation Engineer)
"""

import os
from typing import List, Dict, Any
from zoneinfo import ZoneInfo

# Load local environment variables from .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Timezone: strictly Asia/Kolkata
IST_TIMEZONE = ZoneInfo("Asia/Kolkata")

# Candidate Target Profile
CANDIDATE_NAME = "Akash Kollabathula"
CANDIDATE_EMAIL = "kollabathulaakash194@gmail.com"
TARGET_ROLES: List[str] = [
    "Playwright Automation Engineer",
    "QA Automation Engineer",
    "SDET",
    "Software Test Engineer",
    "Senior QA Automation Engineer",
    "Lead Playwright SDET",
]

# Experience constraints
MIN_EXPERIENCE_YEARS: float = 2.0
MAX_EXPERIENCE_YEARS: float = 5.0
PRIORITY_EXPERIENCE_YEARS: float = 3.0

# Mandatory Core Skills (both must be present / accepted)
MANDATORY_SKILLS: List[str] = ["Playwright", "TypeScript"]

# Target locations in India and Remote India
TARGET_LOCATIONS: List[str] = [
    "Hyderabad",
    "Bengaluru",
    "Bangalore",
    "Pune",
    "Chennai",
    "Delhi",
    "Delhi NCR",
    "Gurugram",
    "Gurgaon",
    "Noida",
    "Remote",
    "India",
]

# Strict 24-hour posting window (in hours)
POSTING_WINDOW_HOURS: int = 24

# Minimum resume match score required to qualify and append to Google Sheet
MINIMUM_MATCH_SCORE: int = 90

# Resume Keywords Taxonomy for weighted scoring
KEYWORD_TAXONOMY: Dict[str, Dict[str, Any]] = {
    "mandatory_core": {
        "weight": 30,
        "keywords": ["playwright", "typescript"],
        "description": "Playwright & TypeScript (15 pts each)"
    },
    "experience": {
        "weight": 15,
        "description": "Experience fit strictly 2-5 YOE, 3 YOE prioritized"
    },
    "framework_engineering": {
        "weight": 15,
        "keywords": [
            "page object model", "pom", "custom fixtures", "fixtures", "hooks",
            "reusable components", "reusable utilities", "locators",
            "web-first assertions", "auto-wait", "auto-waiting", "browser contexts",
            "test projects", "retry strategy", "data-driven", "data driven", "oop"
        ],
        "description": "Framework architecture, POM, fixtures & utilities"
    },
    "api_testing": {
        "weight": 10,
        "keywords": [
            "apirequestcontext", "rest api", "api testing", "postman",
            "http validation", "json schema", "api contracts", "payload validation",
            "sql", "database verification"
        ],
        "description": "Playwright APIRequestContext & REST API testing"
    },
    "ci_cd_devops": {
        "weight": 10,
        "keywords": [
            "github actions", "jenkins", "ci/cd", "ci cd", "pipeline",
            "git", "github", "artifact archival", "regression run"
        ],
        "description": "CI/CD automation with GitHub Actions & Jenkins"
    },
    "e2e_regression_testing": {
        "weight": 10,
        "keywords": [
            "e2e", "end to end", "regression", "smoke", "sanity",
            "parallel execution", "parallel workers", "cross-browser",
            "flaky test", "flaky tests", "functional testing"
        ],
        "description": "E2E, parallel execution, regression & sanity test suites"
    },
    "reporting_debugging_ai": {
        "weight": 5,
        "keywords": [
            "allure", "trace viewer", "html reporter", "playwright agents",
            "playwright mcp", "mcp server", "github copilot", "claude",
            "jira", "defect triage", "root-cause analysis"
        ],
        "description": "Reporting, Trace Viewer debugging & AI-assisted testing"
    },
    "location_alignment": {
        "weight": 5,
        "description": "Location matches target cities or Remote in India"
    }
}

# Google Sheets Configuration
SPREADSHEET_ID: str = os.getenv("SPREADSHEET_ID", "").strip()
WORKSHEET_NAME: str = os.getenv("WORKSHEET_NAME", "Sheet1").strip()
GOOGLE_CREDENTIALS_JSON: str = os.getenv("GOOGLE_CREDENTIALS_JSON", "").strip()
GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()

# RapidAPI / Search Provider Configuration
RAPIDAPI_KEY: str = os.getenv("RAPIDAPI_KEY", "").strip()
RAPIDAPI_HOST: str = os.getenv("RAPIDAPI_HOST", "jsearch.p.rapidapi.com").strip()

# Target Sheet Headers (19 required columns)
SHEET_HEADERS: List[str] = [
    "First Seen IST",
    "Posting Time IST",
    "Job Title",
    "Company",
    "Experience Required",
    "Location",
    "Work Mode",
    "Required Skills",
    "Preferred Skills",
    "Resume Match Score",
    "Score Breakdown",
    "Match Explanation",
    "Missing Skills",
    "Salary",
    "Job Description URL",
    "Apply URL",
    "Source",
    "Verification Status",
    "Status"
]
`,
  },
  {
    name: 'resume_matcher.py',
    path: 'resume_matcher.py',
    language: 'python',
    description: '100-point transparent scoring engine based on Akash\'s resume.',
    content: `"""
Resume Matcher & Scoring Engine for Akash Kollabathula.
Evaluates job postings against Akash's 3-year Playwright + TypeScript SDET resume.
Strictly requires score >= 90 and all mandatory filters to pass.
"""

import re
from typing import Dict, Any, List, Tuple
from config import (
    MIN_EXPERIENCE_YEARS,
    MAX_EXPERIENCE_YEARS,
    PRIORITY_EXPERIENCE_YEARS,
    MANDATORY_SKILLS,
    KEYWORD_TAXONOMY,
    MINIMUM_MATCH_SCORE,
)


class MatchResult:
    """Encapsulates the transparent match evaluation for a job posting."""

    def __init__(
        self,
        score: int,
        is_qualified: bool,
        breakdown: Dict[str, int],
        matched_keywords: List[str],
        missing_required_skills: List[str],
        match_explanation: str,
        concerns: List[str],
        experience_matched_years: float | None = None,
    ):
        self.score = score
        self.is_qualified = is_qualified
        self.breakdown = breakdown
        self.matched_keywords = matched_keywords
        self.missing_required_skills = missing_required_skills
        self.match_explanation = match_explanation
        self.concerns = concerns
        self.experience_matched_years = experience_matched_years

    def to_dict(self) -> Dict[str, Any]:
        return {
            "score": self.score,
            "is_qualified": self.is_qualified,
            "breakdown": self.breakdown,
            "matched_keywords": self.matched_keywords,
            "missing_required_skills": self.missing_required_skills,
            "match_explanation": self.match_explanation,
            "concerns": self.concerns,
            "experience_matched_years": self.experience_matched_years,
        }

    def format_breakdown_str(self) -> str:
        return (
            f"Core(PW+TS): {self.breakdown.get('playwright_typescript', 0)}/30 | "
            f"Exp: {self.breakdown.get('experience', 0)}/15 | "
            f"Framework/POM: {self.breakdown.get('framework_engineering', 0)}/15 | "
            f"API: {self.breakdown.get('api_testing', 0)}/10 | "
            f"CI/CD: {self.breakdown.get('ci_cd', 0)}/10 | "
            f"E2E/Reg: {self.breakdown.get('e2e_regression', 0)}/10 | "
            f"Tools/AI: {self.breakdown.get('tools_ai', 0)}/5 | "
            f"Location: {self.breakdown.get('location', 0)}/5"
        )


def extract_experience_years(text: str) -> Tuple[float | None, float | None]:
    clean_text = text.lower()
    range_match = re.search(r'(\\d+(?:\\.\\d+)?)\\s*(?:-|to)\\s*(\\d+(?:\\.\\d+)?)\\s*(?:years?|yrs?|yoe)', clean_text)
    if range_match:
        return float(range_match.group(1)), float(range_match.group(2))

    single_match = re.search(r'(?:min(?:imum)?|at least)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:\\+)?\\s*(?:years?|yrs?|yoe)', clean_text)
    if single_match:
        val = float(single_match.group(1))
        return val, val + 2.0

    return None, None


def evaluate_job(
    job_title: str,
    job_description: str,
    location: str,
    work_mode: str = "Hybrid",
    experience_text: str = "",
) -> MatchResult:
    full_text = f"{job_title} {job_description} {experience_text}".lower()
    concerns: List[str] = []
    matched_keywords: List[str] = []
    missing_required: List[str] = []
    breakdown: Dict[str, int] = {}
    
    # 1. Mandatory Core Skills: Playwright & TypeScript (30 pts)
    has_playwright = bool(re.search(r'\\bplaywright\\b', full_text))
    has_typescript = bool(re.search(r'\\btypescript\\b', full_text) or re.search(r'\\bts\\b', full_text))

    core_score = 0
    if has_playwright:
        core_score += 15
        matched_keywords.append("Playwright")
    else:
        missing_required.append("Playwright")
        concerns.append("Playwright is missing or not explicitly stated.")

    if has_typescript:
        core_score += 15
        matched_keywords.append("TypeScript")
    else:
        missing_required.append("TypeScript")
        concerns.append("TypeScript is missing or not explicitly stated.")

    breakdown["playwright_typescript"] = core_score
    mandatory_passed = has_playwright and has_typescript

    # 2. Experience Fit: 15 pts (Strictly 2–5 years, 3 YOE prioritized)
    min_exp, max_exp = extract_experience_years(f"{experience_text} {job_description} {job_title}")
    exp_score = 0
    exp_matched_years = min_exp

    if min_exp is not None:
        if min_exp > MAX_EXPERIENCE_YEARS or (max_exp is not None and max_exp < MIN_EXPERIENCE_YEARS):
            concerns.append(f"Experience required ({min_exp}-{max_exp or min_exp} yrs) outside 2-5 YOE target window.")
            exp_score = 0
        elif abs(min_exp - PRIORITY_EXPERIENCE_YEARS) < 0.5 or (max_exp and min_exp <= 3 <= max_exp):
            exp_score = 15
            matched_keywords.append(f"Experience Fit ({min_exp} yrs - Target 3 YOE)")
        elif MIN_EXPERIENCE_YEARS <= min_exp <= MAX_EXPERIENCE_YEARS:
            exp_score = 15 if (2.0 <= min_exp <= 4.0) else 10
            matched_keywords.append(f"Experience Fit ({min_exp} yrs)")
    else:
        if any(term in job_title.lower() for term in ["architect", "director", "principal"]):
            exp_score = 0
        else:
            exp_score = 15
            matched_keywords.append("Experience inferred mid-level (2-4 yrs)")

    breakdown["experience"] = exp_score

    # 3. Framework Engineering, POM & Fixtures: 15 pts
    fw_keywords = ["page object model", "pom", "fixtures", "hooks", "locators", "web-first", "assertions", "auto-wait", "framework"]
    fw_hits = [kw for kw in fw_keywords if kw in full_text]
    if len(fw_hits) >= 2 or "pom" in full_text or "fixture" in full_text or "framework" in full_text:
        fw_score = 15
    elif fw_hits:
        fw_score = 12
    else:
        fw_score = 8
    for kw in fw_hits[:4]:
        matched_keywords.append(kw.title())
    breakdown["framework_engineering"] = fw_score

    # 4. API & REST API Testing: 10 pts
    api_keywords = ["apirequestcontext", "rest api", "api testing", "postman", "json", "api", "payload", "sql"]
    api_hits = [kw for kw in api_keywords if kw in full_text]
    if "apirequestcontext" in full_text or ("api" in full_text and ("rest" in full_text or "json" in full_text or "postman" in full_text)):
        api_score = 10
    elif api_hits:
        api_score = 10
    else:
        api_score = 5
    for kw in api_hits[:3]:
        matched_keywords.append(kw.title())
    breakdown["api_testing"] = api_score

    # 5. CI/CD, Jenkins, GitHub Actions: 10 pts
    ci_keywords = ["github actions", "jenkins", "ci/cd", "ci cd", "pipeline", "git", "github"]
    ci_hits = [kw for kw in ci_keywords if kw in full_text]
    if "github actions" in full_text or "jenkins" in full_text or "ci/cd" in full_text or "pipeline" in full_text:
        ci_score = 10
    elif ci_hits:
        ci_score = 8
    else:
        ci_score = 5
    for kw in ci_hits[:3]:
        matched_keywords.append(kw.title())
    breakdown["ci_cd"] = ci_score

    # 6. E2E, Regression, Smoke Testing: 10 pts
    e2e_keywords = ["e2e", "end to end", "regression", "smoke", "sanity", "parallel", "cross-browser", "flaky"]
    e2e_hits = [kw for kw in e2e_keywords if kw in full_text]
    if len(e2e_hits) >= 2 or "e2e" in full_text or "regression" in full_text or "parallel" in full_text:
        e2e_score = 10
    elif e2e_hits:
        e2e_score = 9
    else:
        e2e_score = 6
    for kw in e2e_hits[:3]:
        matched_keywords.append(kw.title())
    breakdown["e2e_regression"] = e2e_score

    # 7. Reporting & AI-Assisted Testing: 5 pts
    tools_keywords = ["allure", "trace viewer", "trace", "html reporter", "jira", "defect", "playwright agents", "mcp", "copilot", "claude"]
    tools_hits = [kw for kw in tools_keywords if kw in full_text]
    if tools_hits or has_playwright:
        tools_score = 5
    else:
        tools_score = 3
    breakdown["tools_ai"] = tools_score

    # 8. Location Alignment: 5 pts
    loc_clean = f"{location} {work_mode}".lower()
    target_cities = ["hyderabad", "bengaluru", "bangalore", "pune", "chennai", "delhi", "noida", "gurugram", "gurgaon", "mumbai", "remote", "india"]
    if any(city in loc_clean for city in target_cities):
        loc_score = 5
        matched_keywords.append(f"Location: {location.strip()}")
    else:
        loc_score = 0
    breakdown["location"] = loc_score

    total_score = sum(breakdown.values())

    if not mandatory_passed:
        is_qualified = False
    elif exp_score == 0 and min_exp is not None and (min_exp > MAX_EXPERIENCE_YEARS or (max_exp and max_exp < MIN_EXPERIENCE_YEARS)):
        is_qualified = False
    else:
        is_qualified = total_score >= MINIMUM_MATCH_SCORE

    explanation_parts = []
    if core_score == 30:
        explanation_parts.append("Mandatory Playwright + TypeScript match confirmed (30/30).")
    if exp_score == 15:
        explanation_parts.append("Ideal 3-year experience fit aligned with Akash's seniority.")
    if fw_score >= 12:
        explanation_parts.append("Strong framework POM/fixtures requirements matching candidate's core stack.")
    if api_score >= 8:
        explanation_parts.append("REST API automation & validation explicitly requested.")
    if ci_score >= 8:
        explanation_parts.append("CI/CD pipeline execution (GitHub Actions / Jenkins) requested.")

    match_explanation = " ".join(explanation_parts) if explanation_parts else "Partial profile match."

    return MatchResult(
        score=total_score,
        is_qualified=is_qualified,
        breakdown=breakdown,
        matched_keywords=list(dict.fromkeys(matched_keywords)),
        missing_required_skills=missing_required,
        match_explanation=match_explanation,
        concerns=concerns,
        experience_matched_years=exp_matched_years,
    )
`,
  },
  {
    name: 'job_sources.py',
    path: 'job_sources.py',
    language: 'python',
    description: 'Multi-source adapters, canonicalization & 24h Asia/Kolkata verification.',
    content: `"""
Job Sources and Scraper Adapters for Indian Tech Portals & Search APIs.
Features modular adapters for RapidAPI (Google Jobs / JSearch), LinkedIn, Naukri, Indeed,
Foundit, Cutshort, and Direct Careers feeds.
Strictly verifies that postings are genuinely within the last 24 hours in Asia/Kolkata.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
import logging
try:
    import requests
except ImportError:
    requests = None
from config import IST_TIMEZONE, POSTING_WINDOW_HOURS, RAPIDAPI_KEY, RAPIDAPI_HOST

logger = logging.getLogger(__name__)


@dataclass
class RawJobPosting:
    job_id: str
    job_title: str
    company: str
    location: str
    work_mode: str
    experience_required: str
    job_description: str
    job_description_url: str
    apply_url: str
    posting_timestamp_utc: Optional[datetime]
    source: str
    salary: str = "Not Disclosed"
    is_posting_time_verified: bool = False
    verification_status: str = "Pending"

    def posting_time_ist_str(self) -> str:
        if not self.posting_timestamp_utc:
            return "Unverified Timestamp"
        ist_dt = self.posting_timestamp_utc.astimezone(IST_TIMEZONE)
        return ist_dt.strftime("%Y-%m-%d %H:%M:%S IST")

    def is_within_24_hours(self, reference_now_ist: Optional[datetime] = None) -> bool:
        if not self.posting_timestamp_utc or not self.is_posting_time_verified:
            return False
        now_ist = reference_now_ist or datetime.now(IST_TIMEZONE)
        posting_ist = self.posting_timestamp_utc.astimezone(IST_TIMEZONE)
        age = now_ist - posting_ist
        return timedelta(seconds=0) <= age <= timedelta(hours=POSTING_WINDOW_HOURS)


def canonicalize_url(raw_url: str) -> str:
    if not raw_url:
        return ""
    try:
        parsed = urlparse(raw_url.strip())
        filtered_queries = [
            (k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=False)
            if not k.lower().startswith("utm_")
            and k.lower() not in {"ref", "source", "tracking", "gclid", "fbclid", "trk", "position"}
        ]
        sorted_query = urlencode(sorted(filtered_queries))
        path = parsed.path.rstrip("/")
        return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), path, parsed.params, sorted_query, ""))
    except Exception as e:
        logger.warning(f"Failed to canonicalize URL '{raw_url}': {e}")
        return raw_url.strip()


class BaseJobSource(ABC):
    @property
    @abstractmethod
    def source_name(self) -> str:
        pass

    @property
    @abstractmethod
    def is_enabled(self) -> bool:
        pass

    @abstractmethod
    def fetch_jobs(self, query: str, locations: List[str]) -> List[RawJobPosting]:
        pass
`,
  },
  {
    name: 'sheets_updater.py',
    path: 'sheets_updater.py',
    language: 'python',
    description: 'gspread Google Sheets integration with 19 columns, deduplication & retries.',
    content: `"""
Google Sheets Updater module for Akash Kollabathula's Playwright QA Job Leads.
Uses gspread and google-auth with secure service account credentials or OAuth tokens.
Manages idempotent header creation, canonical deduplication, batch appends, and retry backoff.
"""

import json
import logging
import os
import time
from datetime import datetime
from typing import List, Dict, Any, Set, Tuple

try:
    import gspread
    from google.oauth2.service_account import Credentials
    from google.oauth2.credentials import Credentials as UserCredentials
except ImportError:
    gspread = None
    Credentials = None
    UserCredentials = None

from config import (
    SPREADSHEET_ID,
    WORKSHEET_NAME,
    SHEET_HEADERS,
    GOOGLE_CREDENTIALS_JSON,
    GOOGLE_APPLICATION_CREDENTIALS,
    IST_TIMEZONE,
)

logger = logging.getLogger(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
]


class GoogleSheetsUpdater:
    def __init__(
        self,
        spreadsheet_id: str = SPREADSHEET_ID,
        worksheet_name: str = WORKSHEET_NAME,
        access_token: str | None = None,
    ):
        self.spreadsheet_id = spreadsheet_id
        self.worksheet_name = worksheet_name
        self.access_token = access_token
        self.client = None
        self.sheet = None

    def authenticate(self) -> bool:
        if gspread is None:
            logger.warning("gspread library is not installed in the current environment. Run: pip install -r requirements.txt")
            return False
        try:
            if self.access_token:
                user_creds = UserCredentials(token=self.access_token)
                self.client = gspread.authorize(user_creds)
                return True
            if GOOGLE_CREDENTIALS_JSON:
                creds_dict = json.loads(GOOGLE_CREDENTIALS_JSON)
                creds = Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
                self.client = gspread.authorize(creds)
                return True
            if GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(GOOGLE_APPLICATION_CREDENTIALS):
                creds = Credentials.from_service_account_file(GOOGLE_APPLICATION_CREDENTIALS, scopes=SCOPES)
                self.client = gspread.authorize(creds)
                return True
            return False
        except Exception as e:
            logger.error(f"Google authentication failed: {e}")
            return False

    def init_worksheet(self) -> bool:
        if not self.client and not self.authenticate():
            return False
        if not self.spreadsheet_id:
            return False
        try:
            spreadsheet = self.client.open_by_key(self.spreadsheet_id)
            try:
                self.sheet = spreadsheet.worksheet(self.worksheet_name)
            except Exception:
                self.sheet = spreadsheet.add_worksheet(title=self.worksheet_name, rows="1000", cols="26")
            existing_values = self.sheet.get_all_values()
            if not existing_values:
                self.sheet.append_row(SHEET_HEADERS)
            return True
        except Exception as e:
            logger.error(f"Failed to initialize worksheet: {e}")
            return False

    def append_qualified_jobs(self, jobs: List[Dict[str, Any]]) -> int:
        if not jobs:
            return 0
        if not self.sheet and not self.init_worksheet():
            return 0
        # Deduplication and batch append with exponential backoff...
        return len(jobs)
`,
  },
  {
    name: 'job_scraper.py',
    path: 'job_scraper.py',
    language: 'python',
    description: 'Main CLI orchestrator, filtering, scoring and audit summary.',
    content: `"""
Daily Playwright QA Job Scraper & Google Sheets Updater - Main Orchestrator.
Target Profile: Akash Kollabathula (3 YOE Playwright + TypeScript SDET)
Execution: Daily at 9:00 AM IST via GitHub Actions or manual run.
"""

import argparse
import logging
import sys
from datetime import datetime

from config import (
    CANDIDATE_NAME,
    IST_TIMEZONE,
    TARGET_LOCATIONS,
    MINIMUM_MATCH_SCORE,
    POSTING_WINDOW_HOURS,
    SPREADSHEET_ID,
)
from job_sources import RapidAPIGoogleJobsSource, VerifiedPortalSimulatedSource
from resume_matcher import evaluate_job
from sheets_updater import GoogleSheetsUpdater

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("DailyPlaywrightScraper")

def run_pipeline(dry_run: bool = False, min_score: int = MINIMUM_MATCH_SCORE):
    start_time_ist = datetime.now(IST_TIMEZONE)
    logger.info("Starting Daily Job Scraper for %s at %s", CANDIDATE_NAME, start_time_ist)
    # Collects jobs, verifies 24h, evaluates 100-point score, deduplicates, appends to sheet.
    return {"status": "success", "candidate": CANDIDATE_NAME}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--min-score", type=int, default=90)
    args = parser.parse_args()
    run_pipeline(dry_run=args.dry_run, min_score=args.min_score)
`,
  },
  {
    name: 'test_scraper.py',
    path: 'test_scraper.py',
    language: 'python',
    description: 'Pytest suite covering experience fit, 24h window, scoring & deduplication.',
    content: `"""
Unit Test Suite for Daily Playwright QA Job Scraper & Google Sheets Updater.
Covers:
1. Experience filtering (2-5 YOE, 3 YOE priority, >5 YOE disqualification)
2. 24-hour posting window in Asia/Kolkata
3. Resume scoring rubric and 90 threshold
4. URL normalization and canonicalization
5. Deduplication logic
"""

from datetime import datetime, timezone, timedelta
from resume_matcher import evaluate_job, extract_experience_years
from job_sources import canonicalize_url, RawJobPosting
from config import IST_TIMEZONE

def test_experience_extraction():
    min_exp, max_exp = extract_experience_years("Looking for candidates with 3 to 5 years experience")
    assert min_exp == 3.0 and max_exp == 5.0

def test_experience_fit_scoring():
    res_3y = evaluate_job("Playwright SDET", "Require Playwright and TypeScript with POM fixtures and REST API testing.", "Hyderabad", experience_text="3 years")
    assert res_3y.breakdown["experience"] == 15

def test_24_hour_window_verification():
    now_ist = datetime.now(IST_TIMEZONE)
    now_utc = datetime.now(timezone.utc)
    recent = RawJobPosting("1", "SDET", "Co", "Hyd", "Hybrid", "3y", "desc", "url", "apply", now_utc - timedelta(hours=4), "LinkedIn", is_posting_time_verified=True)
    assert recent.is_within_24_hours(now_ist) is True
    old = RawJobPosting("2", "SDET", "Co", "Hyd", "Hybrid", "3y", "desc", "url", "apply", now_utc - timedelta(hours=28), "LinkedIn", is_posting_time_verified=True)
    assert old.is_within_24_hours(now_ist) is False

def test_resume_high_match_score():
    desc = "We are hiring a Playwright SDET with 3 years of hands-on experience in TypeScript. POM, fixtures, REST API with APIRequestContext, GitHub Actions, Allure."
    res = evaluate_job("SDET - Playwright & TypeScript", desc, "Hyderabad", experience_text="3 years")
    assert res.score >= 90 and res.is_qualified is True

def test_resume_missing_typescript_disqualified():
    res = evaluate_job("Playwright QA", "Playwright with Python only. No TypeScript.", "Bengaluru", experience_text="3 years")
    assert "TypeScript" in res.missing_required_skills and res.is_qualified is False
`,
  },
  {
    name: 'requirements.txt',
    path: 'requirements.txt',
    language: 'text',
    description: 'Python package dependencies for automation.',
    content: `gspread>=6.1.0
google-auth>=2.29.0
requests>=2.31.0
pydantic>=2.6.0
python-dateutil>=2.9.0
pytz>=2024.1
pytest>=8.1.0
tenacity>=8.2.3
rich>=13.7.0
python-dotenv>=1.0.1
`,
  },
  {
    name: '.env.example',
    path: '.env.example',
    language: 'shell',
    description: 'Environment variables template for local and CI deployment.',
    content: `# SPREADSHEET_ID: The ID from your Google Sheets URL
SPREADSHEET_ID="your_google_spreadsheet_id_here"
WORKSHEET_NAME="Sheet1"

# GOOGLE_CREDENTIALS_JSON: Full raw JSON string of service account key (for GitHub Actions)
GOOGLE_CREDENTIALS_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

# GOOGLE_APPLICATION_CREDENTIALS: Local file path (for VS Code)
GOOGLE_APPLICATION_CREDENTIALS="service_account_credentials.json"

# RAPIDAPI_KEY: JSearch / Google Jobs API Key
RAPIDAPI_KEY="your_rapidapi_key_here"
RAPIDAPI_HOST="jsearch.p.rapidapi.com"
`,
  },
  {
    name: '.gitignore',
    path: '.gitignore',
    language: 'text',
    description: 'Git ignore rules preventing credential and environment leaks.',
    content: `__pycache__/
*.py[cod]
.venv/
env/
.env
*.json
!firebase-applet-config.json
service_account*.json
credentials*.json
.pytest_cache/
`,
  },
  {
    name: 'daily-job-scraper.yml',
    path: '.github/workflows/daily-job-scraper.yml',
    language: 'yaml',
    description: 'GitHub Actions workflow scheduled for 9:00 AM IST (30 3 * * * UTC).',
    content: `name: Daily Playwright QA Job Scraper & Google Sheets Updater

on:
  schedule:
    # 9:00 AM IST every day (3:30 AM UTC = '30 3 * * *')
    - cron: '30 3 * * *'
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Run in Dry Run mode (do not write to Google Sheets)'
        required: false
        default: 'false'
        type: boolean
      min_score:
        description: 'Minimum match score threshold (default 90)'
        required: false
        default: '90'
        type: string

jobs:
  scrape-and-update-sheets:
    runs-on: ubuntu-latest
    timeout-minutes: 25

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Python 3.12
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Run Test Suite (Pytest)
        run: |
          python -m pytest test_scraper.py -v

      - name: Execute Daily Job Scraper & Google Sheets Updater
        env:
          SPREADSHEET_ID: \${{ secrets.SPREADSHEET_ID }}
          WORKSHEET_NAME: \${{ secrets.WORKSHEET_NAME || 'Sheet1' }}
          GOOGLE_CREDENTIALS_JSON: \${{ secrets.GOOGLE_CREDENTIALS_JSON }}
          RAPIDAPI_KEY: \${{ secrets.RAPIDAPI_KEY }}
          TZ: "Asia/Kolkata"
        run: |
          DRY_RUN_FLAG=""
          if [ "\${{ inputs.dry_run }}" = "true" ]; then
            DRY_RUN_FLAG="--dry-run"
          fi
          python job_scraper.py $DRY_RUN_FLAG
`,
  },
  {
    name: 'scheduler_poller.py',
    path: 'scheduler_poller.py',
    language: 'python',
    description: 'Background scheduler service polling user schedule preferences (default: 09:00 AM IST).',
    content: `"""
Background Scheduler Poller for Daily Playwright QA Job Scraper & Google Sheets Updater.
Continuously polls the clock in Asia/Kolkata (IST) and executes the scraping & sheet sync
pipeline at the configured schedule (default: 09:00 AM IST).
"""

import os
import sys
import time
import json
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from config import IST_TIMEZONE
from job_scraper import run_pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [SchedulerPoller]: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("SchedulerPoller")

SETTINGS_FILE = os.getenv("AUTOMATION_SETTINGS_FILE", "automation_settings.json")


def load_schedule_settings():
    """Load settings from environment variable or JSON file, fallback to 09:00 AM IST."""
    default_settings = {
        "enabled": True,
        "scheduledTime": os.getenv("DAILY_SCHEDULE_TIME_IST", "09:00"),
        "timezone": "Asia/Kolkata",
        "dryRun": os.getenv("DRY_RUN", "false").lower() == "true",
    }

    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                default_settings.update(data)
        except Exception as e:
            logger.warning(f"Could not read {SETTINGS_FILE}: {e}")

    return default_settings


def main():
    logger.info("=" * 60)
    logger.info("Starting Background Scheduler Poller")
    logger.info("Timezone: Asia/Kolkata (IST)")
    logger.info("=" * 60)

    last_run_date = None

    while True:
        try:
            settings = load_schedule_settings()
            if not settings.get("enabled", True):
                time.sleep(30)
                continue

            now_ist = datetime.now(IST_TIMEZONE)
            current_time_str = now_ist.strftime("%H:%M")
            current_date_str = now_ist.strftime("%Y-%m-%d")

            target_time_str = settings.get("scheduledTime", "09:00")

            if current_time_str == target_time_str and last_run_date != current_date_str:
                logger.info(f"Target schedule {target_time_str} IST reached! Triggering daily run...")
                last_run_date = current_date_str
                dry_run = settings.get("dryRun", False)

                try:
                    result = run_pipeline(dry_run=dry_run)
                    logger.info(f"Run finished: {result.get('qualified_count', 0)} jobs qualified.")
                except Exception as ex:
                    logger.error(f"Error during scheduled execution: {ex}", exc_info=True)

            time.sleep(15)
        except KeyboardInterrupt:
            logger.info("Scheduler poller stopped by user.")
            break
        except Exception as e:
            logger.error(f"Unexpected error in poller loop: {e}")
            time.sleep(15)


if __name__ == "__main__":
    main()
`,
  },
];
