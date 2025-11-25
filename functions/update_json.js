// Netlify Function example: update_json
// Place this file in the Netlify functions folder and set environment variables:
// GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }
  // basic auth from body? we expect front-end already gated with login.
  const body = JSON.parse(event.body);
  const path = body.path; // e.g., data/operadoras.json
  const content = body.content;

  if (!path || !content) {
    return { statusCode: 400, body: JSON.stringify({ message: 'path and content required' }) };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER = process.env.GITHUB_OWNER;
  const REPO = process.env.GITHUB_REPO;
  const BRANCH = process.env.GITHUB_BRANCH || 'main';

  if (!GITHUB_TOKEN || !OWNER || !REPO) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Server not configured (missing env vars)' }) };
  }

  // get file to obtain current sha
  const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  try {
    // fetch current file
    const getRes = await fetch(apiBase + `?ref=${BRANCH}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'netlify-function' }
    });
    const getJson = await getRes.json();
    const sha = getJson.sha;

    const putBody = {
      message: `Atualiza ${path} via Netlify Function`,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      branch: BRANCH,
      sha
    };

    const putRes = await fetch(apiBase, {
      method: 'PUT',
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'netlify-function', 'Content-Type': 'application/json' },
      body: JSON.stringify(putBody)
    });
    const putJson = await putRes.json();
    if (!putRes.ok) {
      return { statusCode: putRes.status, body: JSON.stringify(putJson) };
    }
    return { statusCode: 200, body: JSON.stringify({ message: 'OK', result: putJson }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};
