export default async function handler(req, res) {
  const username = process.env.RACING_API_USERNAME;
  const password = process.env.RACING_API_PASSWORD;
  if (!username || !password) {
    res.status(500).json({ error: "API username or password not set!" });
    return;
  }
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  try {
    const apiRes = await fetch("https://api.theracingapi.com/v1/results/today", {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    if (!apiRes.ok) {
      const text = await apiRes.text();
      res.status(apiRes.status).json({ error: "API error", details: text });
      return;
    }
    const data = await apiRes.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error fetching from RacingAPI', details: e.message });
  }
}
