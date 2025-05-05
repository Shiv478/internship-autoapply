// Required dependencies: npm install node-fetch simple-oauth2
const fetch = require('node-fetch');
const { create } = require('simple-oauth2');

// All credentials and endpoints from environment variables
const HANDSHAKE_CLIENT_ID = process.env.HANDSHAKE_CLIENT_ID;
const HANDSHAKE_CLIENT_SECRET = process.env.HANDSHAKE_CLIENT_SECRET;
const HANDSHAKE_TOKEN_HOST = process.env.HANDSHAKE_TOKEN_HOST;
const HANDSHAKE_API_BASE = process.env.HANDSHAKE_API_BASE;

const oauth2 = create({
  client: {
    id: HANDSHAKE_CLIENT_ID,
    secret: HANDSHAKE_CLIENT_SECRET,
  },
  auth: {
    tokenHost: HANDSHAKE_TOKEN_HOST,
    tokenPath: '/token',
    authorizePath: '/authorize',
  },
});

/**
 * Get an OAuth2 access token for the Handshake API.
 * @returns {Promise<string>} The access token string.
 * @throws {Error} If token retrieval fails.
 */
async function getAccessToken() {
  try {
    const tokenConfig = {
      scope: 'read:internships', // Adjust scope as needed
    };
    const result = await oauth2.clientCredentials.getToken(tokenConfig);
    return result.access_token;
  } catch (err) {
    throw new Error(`Failed to obtain Handshake access token: ${err.message}`);
  }
}

function normalizeInternship(posting) {
  return {
    id: posting.id,
    title: posting.title,
    company: posting.company_name || (posting.company && posting.company.name),
    location: posting.location || (posting.locations && posting.locations.join(', ')),
    description: posting.description,
    deadline: posting.deadline || posting.application_deadline,
  };
}

/**
 * Fetch internships from Handshake filtered by major and location, with pagination.
 * @param {Object} profile - { major: string, location: string }
 * @returns {Promise<Array<{id, title, company, location, description, deadline}>>}
 * @throws {Error} If fetching or parsing fails.
 */
async function fetchInternships(profile) {
  const internships = [];
  let page = 1;
  let hasMore = true;
  let accessToken;
  try {
    accessToken = await getAccessToken();
  } catch (err) {
    throw new Error(`Handshake Auth Error: ${err.message}`);
  }

  try {
    while (hasMore) {
      const params = new URLSearchParams();
      if (profile.major) params.append('major', profile.major);
      if (profile.location) params.append('location', profile.location);
      params.append('page', page);
      const url = `${HANDSHAKE_API_BASE}/internships?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`Handshake API error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      console.debug('Raw response page', page, data);
      const pageResults = data.results || data.internships || [];
      internships.push(...pageResults.map(normalizeInternship));
      // Pagination logic: stop if no more results
      if (pageResults.length === 0 || (typeof data.next === 'undefined' && (!data.meta || !data.meta.next_page))) {
        hasMore = false;
      } else {
        page++;
      }
    }
    return internships;
  } catch (err) {
    throw new Error(`Failed to fetch internships from Handshake: ${err.message}`);
  }
}

module.exports = { fetchInternships };
