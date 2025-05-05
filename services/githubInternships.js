const fetch = require('node-fetch');

// URL of the raw README containing internship tables
const GITHUB_README_URL = 'https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/main/README.md';

/**
 * Fetches the raw README from GitHub and parses all markdown tables under every '##' heading.
 * Extracts company, role, location, and applyUrl from each row.
 * @returns {Promise<Array<{company: string, role: string, location: string, applyUrl: string}>>}
 */
async function fetchGitHubInternships() {
  // Step 1: Fetch the raw README
  let text;
  try {
    const res = await fetch(GITHUB_README_URL);
    if (!res.ok) throw new Error(`Failed to fetch README: ${res.status} ${res.statusText}`);
    text = await res.text();
  } catch (err) {
    throw new Error(`Error fetching GitHub README: ${err.message}`);
  }

  // Step 2: Parse all markdown tables under every '##' heading
  // We'll use regex to find each section and its tables
  const sections = text.split(/^## /gm).slice(1); // Remove content before first '##'
  const internships = [];

  for (const section of sections) {
    // Find all markdown tables in the section
    // A markdown table starts and ends with lines containing '|'
    const tableRegex = /((?:^\|.*\|\s*$\n?)+)/gm;
    let match;
    while ((match = tableRegex.exec(section)) !== null) {
      const table = match[1].trim();
      const lines = table.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) continue; // Need at least header and separator
      // Step 3: Parse table rows
      // Assume first line is header, second is separator, rest are data
      for (let i = 2; i < lines.length; i++) {
        const row = lines[i];
        // Split row by '|' and trim
        const cells = row.split('|').map(cell => cell.trim()).filter(Boolean);
        if (cells.length < 3) continue; // Malformed row
        // Extract company (first cell), role (second), location (third), applyUrl (from markdown link in any cell)
        let company = cells[0];
        let role = cells[1];
        let location = cells[2];
        let applyUrl = '';
        // Try to find a markdown link in any cell
        for (const cell of cells) {
          const linkMatch = cell.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            applyUrl = linkMatch[2];
            break;
          }
        }
        // If no URL found, skip row
        if (!applyUrl) continue;
        // Clean up company/role/location (remove markdown links if present)
        company = company.replace(/\[([^\]]+)\]\(([^)]+)\)/, '$1');
        role = role.replace(/\[([^\]]+)\]\(([^)]+)\)/, '$1');
        location = location.replace(/\[([^\]]+)\]\(([^)]+)\)/, '$1');
        internships.push({ company, role, location, applyUrl });
      }
    }
  }
  return internships;
}

module.exports = { fetchGitHubInternships };
