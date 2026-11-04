"""
Daily Playwright QA Job Scraper & Google Sheets Updater - Main Orchestrator.
Target Profile: Akash Kollabathula (3 YOE Playwright + TypeScript SDET)
Execution: Daily at 9:00 AM IST via GitHub Actions or manual run.
"""

import argparse
import json
import logging
import sys
from datetime import datetime
from typing import List, Dict, Any

from config import (
    CANDIDATE_NAME,
    IST_TIMEZONE,
    TARGET_ROLES,
    TARGET_LOCATIONS,
    MINIMUM_MATCH_SCORE,
    POSTING_WINDOW_HOURS,
    SPREADSHEET_ID,
)
from job_sources import (
    RapidAPIGoogleJobsSource,
    VerifiedPortalSimulatedSource,
    RawJobPosting,
)
from resume_matcher import evaluate_job
from sheets_updater import GoogleSheetsUpdater

# Structured logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("DailyPlaywrightScraper")


def run_pipeline(dry_run: bool = False, min_score: int = MINIMUM_MATCH_SCORE) -> Dict[str, Any]:
    """
    Main automation pipeline:
    1. Stamp execution time in Asia/Kolkata
    2. Collect jobs from enabled source adapters
    3. Apply strict 24-hour verification filter
    4. Run explainable resume matcher algorithm (threshold >= 90)
    5. Deduplicate and append to Google Sheet
    6. Return detailed audit report
    """
    start_time_ist = datetime.now(IST_TIMEZONE)
    logger.info("=" * 70)
    logger.info(f"Starting Daily Job Scraper for {CANDIDATE_NAME}")
    logger.info(f"Execution Time (Asia/Kolkata): {start_time_ist.strftime('%Y-%m-%d %H:%M:%S IST')}")
    logger.info(f"Strict 24h Window Cutoff: {(start_time_ist.timestamp() - POSTING_WINDOW_HOURS * 3600)}")
    logger.info(f"Minimum Match Score Required: {min_score}/100")
    logger.info("=" * 70)

    # 1. Initialize Sources
    sources = [
        RapidAPIGoogleJobsSource(),
        VerifiedPortalSimulatedSource(portal_name="LinkedIn / Naukri / Indian QA Portals"),
    ]

    all_raw_postings: List[RawJobPosting] = []
    source_stats: Dict[str, int] = {}

    for source in sources:
        try:
            if not source.is_enabled:
                logger.info(f"Source '{source.source_name}' is disabled or unconfigured.")
                continue
            logger.info(f"Querying source adapter: {source.source_name}...")
            postings = source.fetch_jobs(query="Playwright TypeScript QA Automation", locations=TARGET_LOCATIONS)
            all_raw_postings.extend(postings)
            source_stats[source.source_name] = len(postings)
            logger.info(f"Source '{source.source_name}' returned {len(postings)} raw job listings.")
        except Exception as e:
            logger.error(f"Error querying source '{source.source_name}': {e}")
            source_stats[source.source_name] = 0

    logger.info(f"Total raw postings gathered across all sources: {len(all_raw_postings)}")

    # 2. Strict 24-Hour Window & Verification Filter
    verified_24h_postings: List[RawJobPosting] = []
    filtered_out_reasons: Dict[str, int] = {
        "older_than_24h": 0,
        "unverified_timestamp": 0,
        "missing_mandatory_pw_ts": 0,
        "outside_2_to_5_yoe": 0,
        "score_below_90": 0,
    }

    for posting in all_raw_postings:
        if not posting.is_posting_time_verified or not posting.posting_timestamp_utc:
            filtered_out_reasons["unverified_timestamp"] += 1
            logger.debug(f"Excluded '{posting.job_title}': unverified timestamp.")
            continue

        if not posting.is_within_24_hours(start_time_ist):
            filtered_out_reasons["older_than_24h"] += 1
            logger.debug(f"Excluded '{posting.job_title}': older than 24 hours.")
            continue

        verified_24h_postings.append(posting)

    logger.info(f"Postings strictly within 24 hours in Asia/Kolkata: {len(verified_24h_postings)}")

    # 3. Match Evaluation & Scoring
    qualified_jobs: List[Dict[str, Any]] = []

    for posting in verified_24h_postings:
        eval_result = evaluate_job(
            job_title=posting.job_title,
            job_description=posting.job_description,
            location=posting.location,
            work_mode=posting.work_mode,
            experience_text=posting.experience_required,
        )

        if eval_result.missing_required_skills:
            filtered_out_reasons["missing_mandatory_pw_ts"] += 1
            continue

        if eval_result.breakdown.get("experience", 0) == 0 and eval_result.concerns:
            filtered_out_reasons["outside_2_to_5_yoe"] += 1
            continue

        if eval_result.score < min_score:
            filtered_out_reasons["score_below_90"] += 1
            logger.debug(f"Job score {eval_result.score} below threshold {min_score}: {posting.job_title}")
            continue

        # Passes all filters!
        job_record = {
            "first_seen_ist": start_time_ist.strftime("%Y-%m-%d %H:%M:%S IST"),
            "posting_time_ist": posting.posting_time_ist_str(),
            "job_title": posting.job_title,
            "company": posting.company,
            "experience_required": posting.experience_required,
            "location": posting.location,
            "work_mode": posting.work_mode,
            "required_skills": ["Playwright", "TypeScript"],
            "preferred_skills": [kw for kw in eval_result.matched_keywords if kw not in ["Playwright", "TypeScript"]],
            "score": eval_result.score,
            "score_breakdown": eval_result.format_breakdown_str(),
            "match_explanation": eval_result.match_explanation,
            "missing_skills": eval_result.missing_required_skills,
            "salary": posting.salary,
            "job_description_url": posting.job_description_url,
            "apply_url": posting.apply_url,
            "source": posting.source,
            "verification_status": posting.verification_status,
        }
        qualified_jobs.append(job_record)

    logger.info(f"Total jobs passing all strict filters with score >= {min_score}: {len(qualified_jobs)}")

    # Sort descending by score, then newest
    qualified_jobs.sort(key=lambda j: (j["score"], j["posting_time_ist"]), reverse=True)

    # 4. Google Sheets Sync
    appended_count = 0
    if not dry_run and qualified_jobs:
        updater = GoogleSheetsUpdater(spreadsheet_id=SPREADSHEET_ID)
        try:
            appended_count = updater.append_qualified_jobs(qualified_jobs)
        except Exception as e:
            logger.error(f"Failed to append jobs to Google Sheets: {e}")
    else:
        if dry_run:
            logger.info("[DRY RUN] Skipping Google Sheets append. Results displayed below.")

    # 5. Summary Report
    summary = {
        "candidate": CANDIDATE_NAME,
        "execution_time_ist": start_time_ist.strftime("%Y-%m-%d %H:%M:%S IST"),
        "raw_postings_found": len(all_raw_postings),
        "postings_verified_24h": len(verified_24h_postings),
        "qualified_jobs_count": len(qualified_jobs),
        "appended_to_sheet": appended_count,
        "dry_run": dry_run,
        "filter_rejections": filtered_out_reasons,
        "source_breakdown": source_stats,
        "qualified_jobs": qualified_jobs,
    }

    print("\n" + "=" * 70)
    print("DAILY PLAYWRIGHT QA SCRAPER RUN COMPLETE")
    print("=" * 70)
    print(f"Time (IST): {summary['execution_time_ist']}")
    print(f"Total Scraped: {summary['raw_postings_found']} | Qualified (>=90 Score): {summary['qualified_jobs_count']}")
    print(f"Rows Appended to Sheet: {appended_count} (Dry Run: {dry_run})")
    print("-" * 70)
    for idx, qj in enumerate(qualified_jobs, start=1):
        print(f"#{idx} [{qj['score']}/100] {qj['job_title']} @ {qj['company']}")
        print(f"   Location: {qj['location']} | Exp: {qj['experience_required']}")
        print(f"   Posted (IST): {qj['posting_time_ist']} | Source: {qj['source']}")
        print(f"   Breakdown: {qj['score_breakdown']}")
        print(f"   Apply: {qj['apply_url']}")
        print("")
    print("=" * 70)

    return summary


def main():
    parser = argparse.ArgumentParser(description="Daily Playwright QA Job Scraper & Google Sheets Updater")
    parser.add_argument("--dry-run", action="store_true", help="Perform run without modifying Google Sheet")
    parser.add_argument("--min-score", type=int, default=MINIMUM_MATCH_SCORE, help="Minimum resume match score (default 90)")
    args = parser.parse_args()

    run_pipeline(dry_run=args.dry_run, min_score=args.min_score)


if __name__ == "__main__":
    main()
