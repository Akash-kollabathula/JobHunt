import { JobPosting } from '../types';

export const SHEET_HEADERS = [
  'First Seen IST',
  'Posting Time IST',
  'Job Title',
  'Company',
  'Experience Required',
  'Location',
  'Work Mode',
  'Required Skills',
  'Preferred Skills',
  'Resume Match Score',
  'Score Breakdown',
  'Match Explanation',
  'Missing Skills',
  'Salary',
  'Job Description URL',
  'Apply URL',
  'Source',
  'Verification Status',
  'Status',
];

export async function createSpreadsheetInDrive(
  token: string,
  title: string = 'Akash Kollabathula - Daily Playwright QA Jobs'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  
  const body = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Sheet1',
          gridProperties: {
            frozenRowCount: 1,
            columnCount: 26,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: SHEET_HEADERS.map((header) => ({
                  userEnteredValue: { stringValue: header },
                  userEnteredFormat: {
                    backgroundColor: { red: 0.08, green: 0.16, blue: 0.28 },
                    textFormat: {
                      bold: true,
                      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                      fontSize: 10,
                    },
                    horizontalAlignment: 'CENTER',
                  },
                })),
              },
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create spreadsheet (HTTP ${response.status})`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

export async function appendJobsToSheet(
  token: string,
  spreadsheetId: string,
  jobs: JobPosting[],
  worksheetName: string = 'Sheet1'
): Promise<{ updatedRows: number }> {
  if (jobs.length === 0) return { updatedRows: 0 };

  // First verify if headers exist
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${worksheetName}!A1:S1`;
  const getRes = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (getRes.ok) {
    const getData = await getRes.json();
    if (!getData.values || getData.values.length === 0) {
      // Append header row first
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${worksheetName}!A1:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [SHEET_HEADERS] }),
        }
      );
    }
  }

  // Format job rows
  const nowIstStr = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date()) + ' IST';

  const rows = jobs.map((job) => {
    const linkedinLiveUrl =
      job.linkedin_apply_url ||
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
        `${job.company} Playwright TypeScript`
      )}&location=${encodeURIComponent(job.location.split(',')[0].trim())}&f_TPR=r86400&sortBy=DD`;

    const naukriLiveUrl =
      job.naukri_apply_url ||
      `https://www.naukri.com/playwright-jobs-in-india?k=${encodeURIComponent(
        `${job.company} playwright`
      )}&experience=3&jobAge=1`;

    const officialApplyUrl = job.company_careers_url || job.apply_url || naukriLiveUrl;

    return [
      nowIstStr,
      job.posting_time_ist,
      job.job_title,
      job.company,
      job.experience_required,
      job.location,
      job.work_mode,
      'Playwright, TypeScript',
      job.matched_keywords.filter((k) => !['Playwright', 'TypeScript'].includes(k)).join(', '),
      job.score,
      `Core: ${job.score_breakdown.playwright_typescript}/30 | Exp: ${job.score_breakdown.experience}/15 | POM: ${job.score_breakdown.framework_engineering}/15 | API: ${job.score_breakdown.api_testing}/10 | CI: ${job.score_breakdown.ci_cd}/10 | E2E: ${job.score_breakdown.e2e_regression}/10 | Tools: ${job.score_breakdown.tools_ai}/5 | Loc: ${job.score_breakdown.location}/5`,
      job.match_explanation,
      job.missing_skills.length > 0 ? job.missing_skills.join(', ') : 'None',
      job.salary || 'Not Disclosed',
      job.linkedin_apply_url || linkedinLiveUrl,
      officialApplyUrl,
      job.source || 'LinkedIn / Naukri',
      job.is_verified ? 'Verified' : 'Unverified',
      'New Match',
    ];
  });

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${worksheetName}!A:S:append?valueInputOption=USER_ENTERED`;
  const response = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rows,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Append failed with status ${response.status}`);
  }

  const resData = await response.json();
  return { updatedRows: resData.updates?.updatedRows || rows.length };
}
