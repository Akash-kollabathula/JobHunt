# Daily Playwright QA Job Scraper & Google Sheets Updater

**Automated High-Relevance Job Hunting Engine for Akash Kollabathula**  
*SDET | Playwright + TypeScript Automation Engineer | AI-Assisted Testing (3 YOE)*

---

## 1. Architectural Overview

```
                                      +-----------------------------------+
                                      |   GitHub Actions (Daily 9 AM IST) |
                                      |     Cron: '30 3 * * *' (UTC)      |
                                      +-----------------+-----------------+
                                                        |
                                                        v
                                          +-------------+-------------+
                                          |      job_scraper.py       |
                                          |   (Main CLI Orchestrator) |
                                          +-------------+-------------+
                                                        |
                 +--------------------------------------+--------------------------------------+
                 |                                      |                                      |
                 v                                      v                                      v
   +-------------+--------------+        +--------------+--------------+        +--------------+--------------+
   |        job_sources.py      |        |      resume_matcher.py      |        |      sheets_updater.py      |
   | - RapidAPI (Google Jobs)   |        | - Strict PW+TS (30 pts)     |        | - gspread + google-auth     |
   | - LinkedIn / Portals Feed  |        | - Experience 2-5y (15 pts)  |        | - Deduplicate URLs & Keys   |
   | - 24h Asia/Kolkata Filter  |        | - POM/Fixtures (15 pts)     |        | - Sort: High Score, Newest  |
   | - URL Canonicalization     |        | - REST API Testing (10 pts) |        | - Exponential Retry Backoff |
   | - Verified Posting Timestamps|      | - Score Threshold >= 90/100 |        | - 19 Standardized Columns   |
   +----------------------------+        +-----------------------------+        +--------------+--------------+
                                                                                               |
                                                                                               v
                                                                                +--------------+--------------+
                                                                                |   Google Sheets in Drive    |
                                                                                |   "Sheet1" (Live Updated)   |
                                                                                +-----------------------------+
```

### Core Design Principles:
- **Strict 24-Hour Posting Window**: Compares the listing's verified UTC timestamp against the current wall-clock execution time in `Asia/Kolkata`. Any listing older than 24 hours or with unverified dates is strictly excluded.
- **Explainable 100-Point Scoring Rubric**: Every qualified job must score **90+ points**, with mandatory presence of both **Playwright** and **TypeScript**, plus overlap with the **2–5 YOE** range (prioritizing 3 years).
- **Canonical Deduplication**: Strips tracking parameters (`utm_*`, `ref`, `trk`, `gclid`) and hashes canonical URLs + normalized `(Company, Title)` keys so no job is duplicated across daily runs.
- **Resilient Batch Appends**: Handles Google Sheets API quotas and rate limits with exponential backoff retries.

---

## 2. Complete Folder Structure

```
daily-playwright-qa-scraper/
│
├── .github/
│   └── workflows/
│       └── daily-job-scraper.yml        # GitHub Actions workflow (9:00 AM IST)
│
├── config.py                            # Constants, Candidate profile, 19 headers
├── job_sources.py                       # Modular scrapers & URL canonicalizer
├── resume_matcher.py                    # 100-point transparent scoring engine
├── sheets_updater.py                    # gspread Google Sheets updater & deduplicator
├── job_scraper.py                       # Main pipeline runner & audit reporter
├── test_scraper.py                      # Comprehensive pytest unit tests
│
├── requirements.txt                     # Pinned Python package dependencies
├── .env.example                         # Environment configuration template
├── .gitignore                           # Git ignore rules (prevents credential leaks)
└── README.md                            # Comprehensive operational guide
```

---

## 3. Windows & VS Code Setup Step-by-Step

### Step 3.1: Install Python 3.12
1. Download Python 3.12 from [python.org](https://www.python.org/downloads/).
2. During installation, **check the box**: `[x] Add python.exe to PATH`.
3. Open Windows Terminal (PowerShell) and verify:
   ```powershell
   python --version
   ```

### Step 3.2: Open Project in VS Code
1. Open Visual Studio Code.
2. Select **File > Open Folder...** and choose the `daily-playwright-qa-scraper` directory.
3. Install the recommended extensions:
   - **Python** (by Microsoft)
   - **Pylance** (by Microsoft)

### Step 3.3: Create and Activate Virtual Environment
Open the integrated terminal in VS Code (`Ctrl + ~`) and run:
```powershell
# Create virtual environment named .venv
python -m venv .venv

# Activate virtual environment
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# (If PowerShell blocks script execution, run once: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned)
# On macOS / Linux:
source .venv/bin/activate
```

### Step 3.4: Install Dependencies
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

## 4. Google Sheets API & Service Account Setup

To allow the Python script to update your Google Sheet without manual sign-in prompts during GitHub Actions:

### Step 4.1: Enable Google Sheets & Drive APIs
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named `playwright-qa-scraper` or select an existing one.
3. Go to **APIs & Services > Library**.
4. Search for and enable both:
   - **Google Sheets API**
   - **Google Drive API**

### Step 4.2: Create a Service Account
1. Go to **APIs & Services > Credentials**.
2. Click **+ Create Credentials > Service account**.
3. Enter Name: `qa-job-updater` and click **Create and Continue**.
4. Role: Select **Project > Editor** (or Basic Editor), then click **Done**.

### Step 4.3: Generate JSON Key File
1. Under **Service Accounts**, click on your newly created service account email.
2. Click on the **Keys** tab > **Add Key > Create new key**.
3. Select **JSON** and click **Create**.
4. A file named something like `your-project-123456-abc.json` will be downloaded.
5. Rename it to `service_account_credentials.json` and place it in the project root (never commit this file).

### Step 4.4: Share Your Google Sheet with the Service Account
1. Open your Google Sheet in Google Drive.
2. Click the green **Share** button at the top right.
3. Paste the service account's client email:
   ```
   qa-job-updater@your-project-id.iam.gserviceaccount.com
   ```
4. Set permission to **Editor**, uncheck "Notify people", and click **Share**.
5. Copy your **Spreadsheet ID** from the browser address bar:
   `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`**`/edit`

---

## 5. RapidAPI Key Configuration

1. Visit [JSearch on RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch).
2. Sign up and subscribe to the free basic tier (includes 500 free requests/month).
3. Copy your `X-RapidAPI-Key` from the API console.

---

## 6. Local Testing and Dry-Run Commands

### Create your local `.env`:
```powershell
cp .env.example .env
```
Fill in your `SPREADSHEET_ID` and `RAPIDAPI_KEY`.

### Run Dry-Run (Safe mode, does not alter sheet):
```powershell
python job_scraper.py --dry-run
```

### Run Live Scraper & Append to Sheet:
```powershell
python job_scraper.py
```

### Custom Minimum Match Score:
```powershell
python job_scraper.py --min-score 92
```

---

## 7. Running Unit Tests

Run the test suite with pytest:
```powershell
pytest test_scraper.py -v
```

### Expected Output:
```
============================= test session starts ==============================
test_scraper.py::test_experience_extraction PASSED                        [ 16%]
test_scraper.py::test_experience_fit_scoring PASSED                       [ 33%]
test_scraper.py::test_24_hour_window_verification PASSED                  [ 50%]
test_scraper.py::test_resume_high_match_score PASSED                      [ 66%]
test_scraper.py::test_resume_missing_typescript_disqualified PASSED       [ 83%]
test_scraper.py::test_url_canonicalization PASSED                         [100%]
============================== 6 passed in 0.18s ===============================
```

---

## 8. GitHub Actions Deployment (Daily at 9:00 AM IST)

### Step 8.1: Configure Repository Secrets
In your GitHub repository, navigate to:
**Settings > Secrets and variables > Actions > New repository secret**

Add the following 3 secrets:

1. `SPREADSHEET_ID`: Your Google Sheets ID string.
2. `RAPIDAPI_KEY`: Your RapidAPI key.
3. `GOOGLE_CREDENTIALS_JSON`: The **entire raw text content** of your `service_account_credentials.json` file pasted directly.

### Step 8.2: Schedule Verification
The workflow in `.github/workflows/daily-job-scraper.yml` uses:
```yaml
schedule:
  - cron: '30 3 * * *'  # 3:30 AM UTC = 9:00 AM IST
```
> **Note on GitHub Actions Cron Timing**: GitHub schedules run on shared virtual machine queues and may occasionally experience a 5–15 minute queue delay during peak global hours.

### Step 8.3: Manual Trigger
You can test the GitHub Actions workflow at any time without waiting for 9:00 AM IST:
1. Go to the **Actions** tab in GitHub.
2. Select **Daily Playwright QA Job Scraper & Google Sheets Updater**.
3. Click **Run workflow > Branch: main > Run workflow**.

---

## 9. 24-Hour Posting Window Verification Details

To guarantee no stale or re-indexed listings are included:
1. **Timestamp Extraction**: We capture the original `job_posted_at_datetime_utc` ISO timestamp directly from the primary job provider.
2. **Re-indexing vs. Original Date**: Aggregator "last updated" or "indexed date" tags are discarded in favor of original posting metadata.
3. **Asia/Kolkata Reference**: The system records `datetime.now(ZoneInfo("Asia/Kolkata"))` at start of execution.
4. **Delta Calculation**:
   ```python
   age = now_ist - posting_timestamp_utc.astimezone(ZoneInfo("Asia/Kolkata"))
   if 0 <= age.total_seconds() <= 86400:
       # Verified within 24h
   ```

---

## 10. Sample Google Sheet Row & Score Calculation

### Sample Appended Row (19 Columns):
| Col # | Header | Sample Cell Value |
|---|---|---|
| 1 | **First Seen IST** | `2026-10-17 09:00:14 IST` |
| 2 | **Posting Time IST** | `2026-10-17 05:30:00 IST` |
| 3 | **Job Title** | `SDET - Playwright & TypeScript (E2E & API Automation)` |
| 4 | **Company** | `EPAM Systems` |
| 5 | **Experience Required** | `3 - 5 Years (Target 3 YOE)` |
| 6 | **Location** | `Hyderabad, Telangana` |
| 7 | **Work Mode** | `Hybrid` |
| 8 | **Required Skills** | `Playwright, TypeScript` |
| 9 | **Preferred Skills** | `POM, Fixtures, APIRequestContext, GitHub Actions, Allure, Trace Viewer` |
| 10 | **Resume Match Score** | `96` |
| 11 | **Score Breakdown** | `Core(PW+TS): 30/30 \| Exp: 15/15 \| Framework/POM: 15/15 \| API: 10/10 \| CI/CD: 10/10 \| E2E/Reg: 10/10 \| Tools/AI: 5/5 \| Location: 5/5` |
| 12 | **Match Explanation** | `Mandatory Playwright + TypeScript match confirmed (30/30). Ideal 3-year experience fit aligned with Akash's seniority. Strong framework POM/fixtures requirements matching candidate's core stack. REST API automation & validation explicitly requested. CI/CD pipeline execution requested.` |
| 13 | **Missing Skills** | `None` |
| 14 | **Salary** | `₹14,00,000 - ₹20,00,000 P.A.` |
| 15 | **Job Description URL** | `https://www.epam.com/careers/job/sdet-playwright-typescript-hyderabad` |
| 16 | **Apply URL** | `https://www.epam.com/careers/apply/sdet-playwright-ts-hyd` |
| 17 | **Source** | `LinkedIn Jobs` |
| 18 | **Verification Status**| `Verified` |
| 19 | **Status** | `New Match` |

---

## 11. Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| **Google Auth 403: "The caller does not have permission"** | The Google Sheet has not been shared with the service account client email. | Open the Google Sheet > Share > add the `client_email` from your JSON key with **Editor** permissions. |
| **Empty Results (0 jobs qualified)** | Strict filters eliminated all jobs (e.g. no postings <24h with both Playwright and TypeScript in target locations). | Run `python job_scraper.py --dry-run` to view the `filter_rejections` log. This is working as designed to protect quality over noise. |
| **RapidAPI 429: "Too Many Requests"** | Monthly or per-minute rate limit reached on JSearch free tier. | The script automatically handles retries with exponential backoff. Wait a few minutes or upgrade the API plan. |
| **GitHub Actions Cron did not trigger at exactly 9:00 AM** | GitHub shared queue delays. | Scheduled runs can be delayed by 5–20 minutes under heavy platform load. Trigger manually via `workflow_dispatch` if urgent. |
| **Spreadsheet ID Not Found** | Incorrect ID or worksheet name. | Verify `SPREADSHEET_ID` matches the alphanumeric string between `/d/` and `/edit` in your Google Sheet URL. |
