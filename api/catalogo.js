const catalog = [
  [/^capcut pro 1 month fw$/i, 'capcut', 'CapCut Pro', 'Diseño y video', '1 mes', 'CC'],
  [/^adobe express 12m$/i, 'adobe', 'Adobe Express', 'Diseño y video', '12 meses', 'AE'],
  [/^admin ms365 12m/i, 'office', 'Microsoft 365 Admin', 'Productividad', '12 meses', 'M'],
  [/^spotify premium account 1m/i, 'spotify-1m', 'Spotify Premium', 'Entretenimiento', '1 mes', 'SP'],
  [/^chatgpt go.*3 months/i, 'chatgpt', 'ChatGPT Go', 'Inteligencia artificial', '3 meses', 'AI'],
  [/^expressvpn.*1month/i, 'expressvpn', 'ExpressVPN', 'VPN', '1 mes', 'EV'],
  [/^capcut pro 6 months$/i, 'capcut-6m', 'CapCut Pro', 'Diseño y video', '6 meses', 'CC'],
  [/^capcut pro 7 months$/i, 'capcut-7m', 'CapCut Pro', 'Diseño y video', '7 meses', 'CC'],
  [/^capcut pro 7d.*500/i, 'capcut-7d-500', 'CapCut Pro · 500 créditos', 'Diseño y video', '7 días', 'CC'],
  [/^capcut pro 7d.*1200/i, 'capcut-7d-1200', 'CapCut Pro · 1.200 créditos', 'Diseño y video', '7 días', 'CC'],
  [/^capcut pro 1m.*1200/i, 'capcut-1m-1200', 'CapCut Pro · 1.200 créditos', 'Diseño y video', '1 mes', 'CC'],
  [/^notion plus 12m/i, 'notion-plus', 'Notion Plus', 'Productividad', '12 meses', 'N'],
  [/^notion business 3m/i, 'notion-business', 'Notion Business', 'Productividad', '3 meses', 'N'],
  [/^ilovepdf.*1yr/i, 'ilovepdf', 'iLovePDF Premium', 'Productividad', '12 meses', 'PDF'],
  [/^pdf2go.*1 years/i, 'pdf2go', 'PDF2Go Premium', 'Productividad', '12 meses', 'PDF'],
  [/^eleven labs 3m creator/i, 'elevenlabs', 'ElevenLabs Creator', 'Inteligencia artificial', '3 meses', 'EL'],
  [/^framer ai 1 year/i, 'framer', 'Framer AI', 'Diseño y video', '12 meses', 'F'],
  [/^zoom pro 1m/i, 'zoom', 'Zoom Pro', 'Productividad', '1 mes', 'Z'],
  [/^replit core 1 month/i, 'replit', 'Replit Core', 'Productividad', '1 mes', 'R'],
  [/^udemy personal plan.*1 month/i, 'udemy', 'Udemy Personal Plan', 'Educación', '1 mes', 'U'],
  [/^edx premium 12months/i, 'edx', 'edX Premium', 'Educación', '12 meses', 'ED'],
  [/^scribd premium 1m/i, 'scribd', 'Scribd Premium', 'Entretenimiento', '1 mes', 'S'],
  [/^prime video 6 months/i, 'prime', 'Prime Video', 'Entretenimiento', '6 meses', 'PV'],
  [/^shahid vip 7 months/i, 'shahid', 'Shahid VIP', 'Entretenimiento', '7 meses', 'SH'],
  [/^apple tv 12 months/i, 'appletv', 'Apple TV', 'Entretenimiento', '12 meses', 'AT'],
  [/^surfshark vpn 2m/i, 'surfshark-2m', 'Surfshark VPN', 'VPN', '2 meses', 'SV'],
  [/^surfshark vpn 7 days/i, 'surfshark-7d', 'Surfshark VPN', 'VPN', '7 días', 'SV'],
  [/^hma vpn 30 days/i, 'hma-account', 'HMA VPN · Cuenta', 'VPN', '30 días', 'HMA'],
  [/^\[key\] hma vpn 30d/i, 'hma-key', 'HMA VPN · Clave', 'VPN', '30 días', 'HMA'],
  [/^nord vpn 3 months account/i, 'nord-account', 'NordVPN · Cuenta', 'VPN', '3 meses', 'NV'],
  [/^nord vpn 3month link/i, 'nord-link', 'NordVPN · Enlace', 'VPN', '3 meses', 'NV'],
];

const fixedPrices = new Map([['adobe', 18000], ['capcut-7d-1200', 10000], ['capcut-1m-1200', 22000]]);

function salePrice(amount) {
  const cents = Math.round(amount * 100);
  const factor = cents <= 100 ? 37 : cents <= 300 ? 22 : cents <= 1000 ? 18 : cents <= 3000 ? 16 : 14;
  return Math.ceil(cents * 38 * factor / 10000) * 1000;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.setHeader('Allow', 'GET').status(405).json({ error: 'Método no permitido' });
  try {
    const response = await fetch(process.env.CATALOG_SOURCE_URL, { signal: AbortSignal.timeout(8000), redirect: 'error' });
    if (!response.ok) throw new Error('Catalog unavailable');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid catalog');
    const products = [];
    for (const [pattern, id, name, category, period, mark] of catalog) {
      const item = data.find(product => product?.isActive === true && typeof product.name === 'string' && pattern.test(product.name.trim()));
      if (!item || !Number.isFinite(item.price) || item.price <= 0 || item.price > 10000) continue;
      products.push({ id, name, category, period, mark, price: fixedPrices.get(id) ?? salePrice(item.price), available: Number(item.keysCount) > 0, description: 'Consulta las condiciones de activación por WhatsApp.' });
    }
    if (!products.length) throw new Error('Empty catalog');
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.status(200).json(products);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Catálogo temporalmente no disponible' });
  }
};
