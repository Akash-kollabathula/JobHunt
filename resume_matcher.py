"""
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
    
    range_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?|yoe)', clean_text)
    if range_match:
        return float(range_match.group(1)), float(range_match.group(2))

    single_match = re.search(r'(?:min(?:imum)?|at least)?\s*(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?|yoe)', clean_text)
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
    has_playwright = bool(re.search(r'\bplaywright\b', full_text))
    has_typescript = bool(re.search(r'\btypescript\b', full_text) or re.search(r'\bts\b', full_text))

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
            exp_score = 10
            matched_keywords.append(f"Experience Fit ({min_exp} yrs)")
    else:
        if any(term in job_title.lower() for term in ["architect", "director", "principal"]):
            exp_score = 0
            concerns.append("Role seniority is outside 2-5 YOE target window.")
        else:
            exp_score = 15  # Target 3 YOE mid-level QA role
            matched_keywords.append("Experience inferred mid-level (2-4 yrs)")

    breakdown["experience"] = exp_score

    # 3. Framework Engineering, POM, Fixtures & Utilities: 15 pts
    fw_score = 0
    fw_keywords = [
        "page object model", "pom", "fixtures", "custom fixtures", "hooks",
        "locators", "web-first", "assertions", "auto-wait", "browser contexts",
        "reusable", "framework", "utilities", "data-driven"
    ]
    fw_hits = [kw for kw in fw_keywords if kw in full_text]
    if len(fw_hits) >= 2 or "pom" in full_text or "fixture" in full_text or "framework" in full_text:
        fw_score = 15
    elif fw_hits:
        fw_score = 12
    else:
        fw_score = 8
        concerns.append("Limited framework architecture details.")
    for kw in fw_hits[:4]:
        matched_keywords.append(kw.title())
    breakdown["framework_engineering"] = fw_score

    # 4. API & REST API Testing: 10 pts
    api_score = 0
    api_keywords = ["apirequestcontext", "rest api", "api testing", "postman", "json", "api", "payload", "sql", "contracts"]
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
    ci_score = 0
    ci_keywords = ["github actions", "jenkins", "ci/cd", "ci cd", "pipeline", "git", "github", "devops"]
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

    # 6. E2E, Regression, Smoke, Cross-Browser Testing: 10 pts
    e2e_score = 0
    e2e_keywords = ["e2e", "end to end", "end-to-end", "regression", "smoke", "sanity", "parallel", "cross-browser", "flaky", "functional"]
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

    # 7. Reporting, Debugging & AI-assisted Testing Tools: 5 pts
    tools_score = 0
    tools_keywords = ["allure", "trace viewer", "trace", "html reporter", "jira", "defect", "triage", "playwright agents", "mcp", "copilot", "claude", "debugging"]
    tools_hits = [kw for kw in tools_keywords if kw in full_text]
    if tools_hits:
        tools_score = 5
        for kw in tools_hits[:2]:
            matched_keywords.append(kw.title())
    elif has_playwright:
        tools_score = 5  # Playwright provides native trace viewer & HTML reporter out-of-the-box
    breakdown["tools_ai"] = tools_score

    # 8. Location Alignment: 5 pts (Hyderabad, Bengaluru, Pune, Chennai, Delhi NCR, Remote India)
    loc_clean = f"{location} {work_mode}".lower()
    target_cities = ["hyderabad", "bengaluru", "bangalore", "pune", "chennai", "delhi", "noida", "gurugram", "gurgaon", "mumbai", "remote", "india"]
    if any(city in loc_clean for city in target_cities):
        loc_score = 5
        matched_keywords.append(f"Location: {location.strip()}")
    else:
        loc_score = 0
        concerns.append(f"Location '{location}' may be outside primary target cities.")
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

    match_explanation = " ".join(explanation_parts) if explanation_parts else "Strong match with candidate profile."

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
