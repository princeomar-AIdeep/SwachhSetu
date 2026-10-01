// AI vision helper. Key stays on the backend (ANTHROPIC_API_KEY). Output is ASSISTIVE ONLY:
// callers must never auto-punish a user from this result; admins verify reports.
// ENHANCE: swap provider here only; route code depends on the returned shape, not the vendor.
const LOW = 0.6;
const parse = (t) => { try { return JSON.parse(t.replace(/```json|```/g, '').trim()); } catch { return null; } };

async function ask(buffer, mime, prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { unavailable: true };
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 500,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: mime, data: buffer.toString('base64') } },
          { type: 'text', text: prompt }] }],
      }),
    });
    if (!r.ok) return { unavailable: true };
    const data = await r.json();
    return parse((data.content || []).map((c) => c.text || '').join('')) || { unavailable: true };
  } catch { return { unavailable: true }; }
}

// Report photo: is there a genuine waste/garbage issue visible?
async function verifyReportImage(buffer, mime) {
  const j = await ask(buffer, mime, 'You assist municipal waste reporting. Does this photo show a waste/garbage issue (overflowing bin, garbage on road, dumping, litter)? Reply ONLY JSON: {"relevant":boolean,"confidence":number 0-1,"label":"short description of what you see","note":"one sentence"}');
  if (j.unavailable) return { available: false };
  const c = Math.min(1, Math.max(0, Number(j.confidence) || 0));
  return { available: true, relevant: !!j.relevant, confidence: c, label: String(j.label || '').slice(0, 120), note: String(j.note || '').slice(0, 240), lowConfidence: c < LOW };
}

// WasteWise: identify the item and map it to our category slugs.
async function identifyWaste(buffer, mime) {
  const j = await ask(buffer, mime, 'Identify the main waste item in this photo for Indian household segregation. Reply ONLY JSON: {"item":"name","category":"wet|dry|hazardous|ewaste|sanitary|special","confidence":number 0-1,"biodegradable":boolean,"recyclable":boolean,"disposal":"one or two sentences"}');
  if (j.unavailable) return { available: false };
  const c = Math.min(1, Math.max(0, Number(j.confidence) || 0));
  const cats = ['wet', 'dry', 'hazardous', 'ewaste', 'sanitary', 'special'];
  return { available: true, item: String(j.item || '').slice(0, 80), category: cats.includes(j.category) ? j.category : null, confidence: c,
    biodegradable: !!j.biodegradable, recyclable: !!j.recyclable, disposal: String(j.disposal || '').slice(0, 300), lowConfidence: c < LOW };
}
module.exports = { verifyReportImage, identifyWaste, LOW };
