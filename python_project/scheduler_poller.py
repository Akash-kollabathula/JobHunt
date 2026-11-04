"""
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
                logger.debug("Automation is paused in settings. Waiting...")
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
                    logger.info(f"Run finished successfully: {result.get('qualified_count', 0)} jobs qualified.")
                except Exception as ex:
                    logger.error(f"Error during scheduled execution: {ex}", exc_info=True)

            time.sleep(15)  # Poll every 15 seconds
        except KeyboardInterrupt:
            logger.info("Scheduler poller stopped by user.")
            break
        except Exception as e:
            logger.error(f"Unexpected error in poller loop: {e}")
            time.sleep(15)


if __name__ == "__main__":
    main()
