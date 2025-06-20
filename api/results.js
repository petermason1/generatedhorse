require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3001;

app.get('/api/results', async (req, res) => {
  const username = process.env.RACINGAPI_USERNAME;
  const password = process.env.RACINGAPI_PASSWORD;
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  const apiUrl = `https://api.theracingapi.com/v1/results/today`;

  try {
    const apiRes = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      }
    });

    if (!apiRes.ok) {
      res.status(apiRes.status).json({ error: "API error" });
      return;
    }

    const data = await apiRes.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error fetching from RacingAPI' });
  }
});

app.listen(port, () => {
  console.log(`Local API server running at http://localhost:${port}/api/results`);
});
