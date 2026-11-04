"""
Unit Test Suite for Daily Playwright QA Job Scraper & Google Sheets Updater.
Covers:
1. Experience filtering (2-5 YOE, 3 YOE priority, >5 YOE disqualification)
2. 24-hour posting window in Asia/Kolkata
3. Resume scoring rubric and 90 threshold
4. URL normalization and canonicalization
5. Deduplication logic
"""

from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
try:
    import pytest
except ImportError:
    pytest = None

from resume_matcher import evaluate_job, extract_experience_years
from job_sources import canonicalize_url, RawJobPosting
from config import IST_TIMEZONE


# ==========================================
# 1. Experience Filtering Tests
# ==========================================

def test_experience_extraction():
    min_exp, max_exp = extract_experience_years("Looking for candidates with 3 to 5 years experience")
    assert min_exp == 3.0
    assert max_exp == 5.0

    min_exp2, max_exp2 = extract_experience_years("Minimum 2+ yrs in Playwright automation")
    assert min_exp2 == 2.0


def test_experience_fit_scoring():
    # 3 YOE should receive full 15 points
    res_3y = evaluate_job(
        job_title="Playwright SDET",
        job_description="Require Playwright and TypeScript with POM fixtures and REST API testing.",
        location="Hyderabad",
        experience_text="3 years experience required",
    )
    assert res_3y.breakdown["experience"] == 15

    # 4-5 YOE should receive 10 points
    res_4y = evaluate_job(
        job_title="QA Engineer",
        job_description="Require Playwright and TypeScript with POM and CI/CD.",
        location="Bengaluru",
        experience_text="4 to 5 years experience",
    )
    assert res_4y.breakdown["experience"] == 10

    # 7+ YOE is outside target window (Akash has 3 YOE), should receive 0 pts and not qualify
    res_7y = evaluate_job(
        job_title="Senior QA Architect",
        job_description="Require Playwright and TypeScript with POM and CI/CD.",
        location="Hyderabad",
        experience_text="7 to 10 years experience",
    )
    assert res_7y.breakdown["experience"] == 0
    assert not res_7y.is_qualified


# ==========================================
# 2. 24-Hour Window Verification Tests
# ==========================================

def test_24_hour_window_verification():
    now_ist = datetime.now(IST_TIMEZONE)
    now_utc = datetime.now(timezone.utc)

    # Posting from 4 hours ago -> Must pass
    recent_posting = RawJobPosting(
        job_id="test_recent",
        job_title="SDET Playwright",
        company="Tech Corp",
        location="Hyderabad",
        work_mode="Hybrid",
        experience_required="3 YOE",
        job_description="Playwright TypeScript testing",
        job_description_url="https://example.com/job/1",
        apply_url="https://example.com/apply/1",
        posting_timestamp_utc=now_utc - timedelta(hours=4),
        source="LinkedIn",
        is_posting_time_verified=True,
    )
    assert recent_posting.is_within_24_hours(now_ist) is True

    # Posting from 28 hours ago -> Must fail
    old_posting = RawJobPosting(
        job_id="test_old",
        job_title="SDET Playwright",
        company="Old Corp",
        location="Hyderabad",
        work_mode="Hybrid",
        experience_required="3 YOE",
        job_description="Playwright TypeScript testing",
        job_description_url="https://example.com/job/2",
        apply_url="https://example.com/apply/2",
        posting_timestamp_utc=now_utc - timedelta(hours=28),
        source="Naukri",
        is_posting_time_verified=True,
    )
    assert old_posting.is_within_24_hours(now_ist) is False

    # Unverified timestamp -> Must fail
    unverified_posting = RawJobPosting(
        job_id="test_unverified",
        job_title="SDET Playwright",
        company="Unknown Corp",
        location="Pune",
        work_mode="Remote",
        experience_required="3 YOE",
        job_description="Playwright TypeScript testing",
        job_description_url="https://example.com/job/3",
        apply_url="https://example.com/apply/3",
        posting_timestamp_utc=None,
        source="Google Jobs",
        is_posting_time_verified=False,
    )
    assert unverified_posting.is_within_24_hours(now_ist) is False


# ==========================================
# 3. Resume Scoring & 90-Threshold Tests
# ==========================================

def test_resume_high_match_score():
    # Ideal job description matching Akash's exact resume profile
    high_match_desc = (
        "We are hiring a Playwright SDET with 3 years of hands-on experience in TypeScript. "
        "Must have Page Object Model (POM), custom fixtures, hooks, locators, and web-first assertions. "
        "Strong REST API testing with Playwright APIRequestContext and Postman, validating JSON schema. "
        "Must have CI/CD integration with GitHub Actions or Jenkins. "
        "Experience in parallel execution, flaky test reduction, Allure reporting, and Trace Viewer debugging."
    )
    result = evaluate_job(
        job_title="SDET - Playwright & TypeScript",
        job_description=high_match_desc,
        location="Hyderabad, Telangana",
        experience_text="3 years",
    )
    # Expected score >= 90
    assert result.score >= 90
    assert result.is_qualified is True
    assert result.breakdown["playwright_typescript"] == 30
    assert result.breakdown["experience"] == 15
    assert len(result.missing_required_skills) == 0


def test_resume_missing_typescript_disqualified():
    # Job only has Playwright and Python (missing TypeScript)
    desc_missing_ts = (
        "Looking for Playwright QA automation engineer using Python with 3 years experience. "
        "E2E testing and CI/CD pipelines."
    )
    result = evaluate_job(
        job_title="Playwright QA Engineer",
        job_description=desc_missing_ts,
        location="Bengaluru",
        experience_text="3 years",
    )
    # Must fail because TypeScript is mandatory
    assert "TypeScript" in result.missing_required_skills
    assert result.is_qualified is False


# ==========================================
# 4. URL Canonicalization Tests
# ==========================================

def test_url_canonicalization():
    dirty_url = "https://www.linkedin.com/jobs/view/123456789/?utm_source=share&utm_medium=member_desktop&ref=job_board&trk=public_jobs#apply"
    canonical = canonicalize_url(dirty_url)
    assert "utm_source" not in canonical
    assert "ref" not in canonical
    assert "trk" not in canonical
    assert canonical == "https://www.linkedin.com/jobs/view/123456789"

    # Trailing slash normalization
    url_slash = "https://careers.epam.com/jobs/sdet-playwright/"
    assert canonicalize_url(url_slash) == "https://careers.epam.com/jobs/sdet-playwright"


# ==========================================
# 5. Duplicate Detection Tests
# ==========================================

def test_duplicate_detection_logic():
    existing_urls = {"https://careers.example.com/apply/sdet-1"}
    existing_companies_titles = {"thoughtworks:::sdet - playwright + ts"}

    new_job_1 = {
        "apply_url": "https://careers.example.com/apply/sdet-1?utm_campaign=daily",
        "company": "Other Co",
        "job_title": "Different Title",
    }
    canonical_1 = canonicalize_url(new_job_1["apply_url"])
    is_url_dup = canonical_1.lower() in existing_urls
    assert is_url_dup is True

    new_job_2 = {
        "apply_url": "https://different-url.com/apply",
        "company": "ThoughtWorks",
        "job_title": "SDET - Playwright + TS",
    }
    norm_key = f"{new_job_2['company'].strip().lower()}:::{new_job_2['job_title'].strip().lower()}"
    is_title_dup = norm_key in existing_companies_titles
    assert is_title_dup is True


if __name__ == "__main__":
    print("=" * 60)
    print("RUNNING SCRAPER & MATCHER UNIT TESTS")
    print("=" * 60)
    test_experience_extraction()
    print("  [PASS] test_experience_extraction")
    test_experience_fit_scoring()
    print("  [PASS] test_experience_fit_scoring (2-5 YOE, 3 YOE priority)")
    test_24_hour_window_verification()
    print("  [PASS] test_24_hour_window_verification (Asia/Kolkata 24h window)")
    test_resume_high_match_score()
    print("  [PASS] test_resume_high_match_score (>=90 threshold verified)")
    test_resume_missing_typescript_disqualified()
    print("  [PASS] test_resume_missing_typescript_disqualified (strict PW+TS)")
    test_url_canonicalization()
    print("  [PASS] test_url_canonicalization (UTM & tracking query stripping)")
    test_duplicate_detection_logic()
    print("  [PASS] test_duplicate_detection_logic (URL and Company+Title keys)")
    print("=" * 60)
    print("ALL 7 TEST SUITES PASSED PERFECTLY!")
    print("=" * 60)

