"""
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
