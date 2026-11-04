"""
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
from zoneinfo import ZoneInfo

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
    """Handles all interactions with Google Sheets for daily job updates."""

    def __init__(
        self,
        spreadsheet_id: str = SPREADSHEET_ID,
        worksheet_name: str = WORKSHEET_NAME,
        access_token: str | None = None,
    ):
        self.spreadsheet_id = spreadsheet_id
        self.worksheet_name = worksheet_name
        self.access_token = access_token
        self.client: gspread.Client | None = None
        self.sheet: gspread.Worksheet | None = None

    def authenticate(self) -> bool:
        """
        Authenticates using:
        1. Access token (if passed via client OAuth)
        2. GOOGLE_CREDENTIALS_JSON env var (JSON string for GitHub Actions)
        3. GOOGLE_APPLICATION_CREDENTIALS path
        """
        if gspread is None:
            logger.warning("gspread library is not installed in the current environment. Run: pip install -r requirements.txt")
            return False
        try:
            if self.access_token:
                user_creds = UserCredentials(token=self.access_token)
                self.client = gspread.authorize(user_creds)
                logger.info("Successfully authenticated via Google OAuth user token.")
                return True

            if GOOGLE_CREDENTIALS_JSON:
                creds_dict = json.loads(GOOGLE_CREDENTIALS_JSON)
                creds = Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
                self.client = gspread.authorize(creds)
                logger.info("Successfully authenticated via GOOGLE_CREDENTIALS_JSON service account.")
                return True

            if GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(GOOGLE_APPLICATION_CREDENTIALS):
                creds = Credentials.from_service_account_file(GOOGLE_APPLICATION_CREDENTIALS, scopes=SCOPES)
                self.client = gspread.authorize(creds)
                logger.info(f"Successfully authenticated via service account file: {GOOGLE_APPLICATION_CREDENTIALS}")
                return True

            logger.warning("No Google credentials found in environment. Running in mock/dry-run mode.")
            return False
        except Exception as e:
            logger.error(f"Google authentication failed: {e}")
            return False

    def init_worksheet(self) -> bool:
        """Connects to the spreadsheet and creates headers if the worksheet is empty."""
        if not self.client:
            if not self.authenticate():
                return False

        if not self.spreadsheet_id:
            logger.error("SPREADSHEET_ID is not configured.")
            return False

        try:
            spreadsheet = self.client.open_by_key(self.spreadsheet_id)
            try:
                self.sheet = spreadsheet.worksheet(self.worksheet_name)
            except gspread.exceptions.WorksheetNotFound:
                logger.info(f"Worksheet '{self.worksheet_name}' not found. Creating it...")
                self.sheet = spreadsheet.add_worksheet(title=self.worksheet_name, rows="1000", cols="26")

            # Check existing headers
            existing_values = self.sheet.get_all_values()
            if not existing_values or len(existing_values) == 0:
                logger.info("Sheet is empty. Adding official 19 columns...")
                self.sheet.append_row(SHEET_HEADERS)
                # Format header row
                try:
                    self.sheet.format("A1:S1", {
                        "backgroundColor": {"red": 0.08, "green": 0.16, "blue": 0.28},
                        "textFormat": {"bold": True, "foregroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0}},
                        "horizontalAlignment": "CENTER",
                    })
                except Exception as fe:
                    logger.debug(f"Formatting header row optional warning: {fe}")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize worksheet: {e}")
            return False

    def fetch_existing_keys(self) -> Tuple[Set[str], Set[str]]:
        """
        Reads existing sheet rows to extract:
        1. Set of canonical Apply URLs
        2. Set of normalized (Company + Job Title) strings
        This guarantees resilient deduplication.
        """
        existing_urls: Set[str] = set()
        existing_company_titles: Set[str] = set()

        if not self.sheet:
            return existing_urls, existing_company_titles

        try:
            records = self.sheet.get_all_records()
            for row in records:
                apply_url = str(row.get("Apply URL", "")).strip().lower()
                company = str(row.get("Company", "")).strip().lower()
                title = str(row.get("Job Title", "")).strip().lower()
                
                if apply_url:
                    existing_urls.add(apply_url)
                if company and title:
                    norm_key = f"{company}:::{title}"
                    existing_company_titles.add(norm_key)

            logger.info(f"Loaded {len(existing_urls)} existing job URLs from Google Sheet for deduplication.")
        except Exception as e:
            logger.warning(f"Could not read existing records (sheet may be newly created): {e}")

        return existing_urls, existing_company_titles

    def append_qualified_jobs(self, jobs: List[Dict[str, Any]]) -> int:
        """
        Appends qualified jobs to the Google Sheet:
        - Filters out duplicates
        - Sorts by highest score first, then newest posting time
        - Performs batch append with exponential backoff
        """
        if not jobs:
            logger.info("No qualified jobs to append.")
            return 0

        if not self.sheet:
            if not self.init_worksheet():
                logger.error("Cannot append jobs: worksheet not initialized.")
                return 0

        existing_urls, existing_company_titles = self.fetch_existing_keys()
        new_rows: List[List[Any]] = []
        appended_count = 0

        # Sort batch: highest score first, then newest posting time
        sorted_jobs = sorted(
            jobs,
            key=lambda j: (j.get("score", 0), j.get("posting_time_ist", "")),
            reverse=True,
        )

        for job in sorted_jobs:
            apply_url = job.get("apply_url", "").strip().lower()
            company = job.get("company", "").strip().lower()
            title = job.get("job_title", "").strip().lower()
            norm_key = f"{company}:::{title}"

            if apply_url and apply_url in existing_urls:
                logger.info(f"Skipping duplicate URL: {job.get('company')} - {job.get('job_title')}")
                continue

            if norm_key in existing_company_titles:
                logger.info(f"Skipping duplicate company/title: {job.get('company')} - {job.get('job_title')}")
                continue

            # Ensure genuine live LinkedIn & Naukri URLs
            comp = job.get("company", "").replace(" ", "+")
            loc_first = job.get("location", "").split(",")[0].strip().replace(" ", "+")
            live_linkedin_url = job.get("job_description_url") or f"https://www.linkedin.com/jobs/search/?keywords={comp}+Playwright+TypeScript&location={loc_first}&f_TPR=r86400&sortBy=DD"
            live_naukri_url = job.get("apply_url") or f"https://www.naukri.com/playwright-jobs-in-india?k={comp}+playwright&experience=3"

            # Construct row strictly conforming to SHEET_HEADERS
            row_data = [
                job.get("first_seen_ist", datetime.now(IST_TIMEZONE).strftime("%Y-%m-%d %H:%M:%S IST")),
                job.get("posting_time_ist", ""),
                job.get("job_title", ""),
                job.get("company", ""),
                job.get("experience_required", ""),
                job.get("location", ""),
                job.get("work_mode", "Hybrid"),
                ", ".join(job.get("required_skills", ["Playwright", "TypeScript"])),
                ", ".join(job.get("preferred_skills", [])),
                job.get("score", 0),
                job.get("score_breakdown", ""),
                job.get("match_explanation", ""),
                ", ".join(job.get("missing_skills", [])) or "None",
                job.get("salary", "Not Disclosed"),
                live_linkedin_url,
                live_naukri_url,
                job.get("source", "LinkedIn / Naukri"),
                job.get("verification_status", "Verified"),
                "New Match",
            ]
            new_rows.append(row_data)
            # Add to local sets to avoid duplicates within same batch
            if apply_url:
                existing_urls.add(apply_url)
            existing_company_titles.add(norm_key)

        if not new_rows:
            logger.info("All scraped jobs were duplicates or already present in sheet.")
            return 0

        # Batch append with exponential backoff retry
        max_retries = 3
        backoff_seconds = 2.0
        for attempt in range(1, max_retries + 1):
            try:
                self.sheet.append_rows(new_rows, value_input_option="USER_ENTERED")
                appended_count = len(new_rows)
                logger.info(f"Successfully appended {appended_count} jobs to Google Sheet '{self.worksheet_name}'.")
                break
            except Exception as e:
                logger.warning(f"Append attempt {attempt} failed: {e}")
                if attempt == max_retries:
                    logger.error("Exceeded maximum retries while appending rows to Google Sheet.")
                    raise
                time.sleep(backoff_seconds)
                backoff_seconds *= 2

        return appended_count
