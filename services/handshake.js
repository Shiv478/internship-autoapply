// Required dependencies: npm install node-fetch simple-oauth2
const fetch = require('node-fetch');
const { create } = require('simple-oauth2');

// TODO: Replace these with your actual Handshake API credentials and endpoints
const HANDSHAKE_CLIENT_ID = process.env.HANDSHAKE_CLIENT_ID || 'YOUR_CLIENT_ID';
const HANDSHAKE_CLIENT_SECRET = process.env.HANDSHAKE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const HANDSHAKE_TOKEN_HOST = 'https://handshake.com/oauth'; // Example, replace with actual
const HANDSHAKE_API_BASE = 'https://handshake.com/api/v1'; // Example, replace with actual

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

async function getAccessToken() {
  // For client credentials grant
  const tokenConfig = {
    scope: 'read:internships', // Adjust scope as needed
  };
  const result = await oauth2.clientCredentials.getToken(tokenConfig);
  return result.access_token;
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
 * Fetch internships from Handshake filtered by major and location.
 * @param {Object} profile - { major: string, location: string }
 * @returns {Promise<Array<{id, title, company, location, description, deadline}>>}
 */
async function fetchInternships(profile) {
  const accessToken = await getAccessToken();
  const params = new URLSearchParams();
  if (profile.major) params.append('major', profile.major);
  if (profile.location) params.append('location', profile.location);

  // TODO: Adjust endpoint and query params as per Handshake API docs
  const url = `${HANDSHAKE_API_BASE}/internships?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Handshake API error: ${res.status}`);
  const data = await res.json();
  // Assume data.results or data.internships contains the array
  const internships = data.results || data.internships || [];
  return internships.map(normalizeInternship);
}

module.exports = { fetchInternships };
