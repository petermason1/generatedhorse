export default async function handler(req, res) {
  const apiKey = process.env.RACING_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "API key not set!" });
    return;
  }
  try {
    const apiRes = await fetch("https://api.theracingapi.com/v1/results/today", {
      headers: { 'x-api-key': apiKey }
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
