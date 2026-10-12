/**
 * The Arabic addresses — /ar/, /ar/privacy/, /ar/terms/, /ar/support/ — and sitemap.xml.
 * Run by scripts/build.js (so `node scripts/build.js` builds everything); also runnable alone after
 * editing the hand-written index.html: `node scripts/build-ar.js`.
 *
 * Every page holds both languages, so an Arabic twin is the English file with Arabic stamped on it:
 * <html lang="ar" data-lang="ar">, the Arabic title and description, its own canonical and og:url,
 * and links to the other pages pointing at their Arabic addresses. Search engines get one page per
 * language (with hreflang pairs); visitors switching language in place just see the address change.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://yuba-app.com';

// What a search result or a shared link says under the title, in Arabic.
const DESC_AR = {
  '/': 'يقرأ يوبا رسائل بنكك على جوالك نفسه، ويُريك أين تذهب فلوسك. بياناتك المالية تبقى على جوالك.',
  '/privacy/': 'كيف يتعامل يوبا مع بياناتك، بالتفصيل. بياناتك المالية تبقى على جوالك، ولا يصلنا شيء عن مالك إلا ما ترسله أنت.',
  '/terms/': 'شروط استخدام يوبا: الأيام الستون المجانية، والعضوية (29.99 ر.س شهريًا أو 179.99 ر.س سنويًا)، والإلغاء والاسترداد.',
  '/support/': 'المساعدة في يوبا: إرشادات سريعة، والرسائل البنكية الفائتة، والعضوية، وتصدير بياناتك وحذفها. راسلنا على support@yuba-app.com.',
};
const PAGES = ['/', '/privacy/', '/terms/', '/support/'];

const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const unattr = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function swap(html, re, to, what) {
  if (!re.test(html)) throw new Error(`build-ar: ${what} not found`);
  return html.replace(re, to);
}

function twin(page) {
  const src = path.join(ROOT, page, 'index.html');
  let h = fs.readFileSync(src, 'utf8');
  const ar = '/ar' + page;
  const m = /<html lang="en"([^>]*)>/.exec(h);
  if (!m || !/data-ar-path="/.test(m[1])) throw new Error(`build-ar: ${page} has no data-ar-path`);
  const titleAr = unattr((/data-title-ar="([^"]*)"/.exec(m[1]) || [])[1] || '');
  const titleEn = (/<title>([^<]*)<\/title>/.exec(h) || [])[1] || '';
  if (!titleAr || !titleEn) throw new Error(`build-ar: ${page} lacks a title`);
  const desc = DESC_AR[page];
  if (!desc) throw new Error(`build-ar: no Arabic description for ${page}`);

  h = h.replace(m[0], `<html lang="ar" data-lang="ar"${m[1]} data-title-en="${attr(unattr(titleEn))}">`);
  h = swap(h, /<title>[^<]*<\/title>/, `<title>${attr(titleAr)}</title>`, 'title');
  h = swap(h, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(desc)}">`, 'description');
  h = swap(h, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}${ar}">`, 'canonical');
  h = swap(h, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}${ar}">`, 'og:url');
  h = swap(h, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(titleAr)}">`, 'og:title');
  h = swap(h, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(desc)}">`, 'og:description');
  h = swap(h, /<meta property="og:locale" content="en_US">\n<meta property="og:locale:alternate" content="ar_SA">/,
    '<meta property="og:locale" content="ar_SA">\n<meta property="og:locale:alternate" content="en_US">', 'og:locale');
  // links to the four pages go to their Arabic addresses (assets like /site.css are untouched)
  h = h.replace(/href="\/((?:privacy|terms|support)\/)?(#[^"]*)?"/g, (x, p, hash) => `href="/ar/${p || ''}${hash || ''}"`);

  const out = path.join(ROOT, 'ar', page, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, h);
  console.log('wrote', path.relative(ROOT, out));
}

PAGES.forEach(twin);

const day = new Date().toISOString().slice(0, 10);
const alt = (p) => `    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${p}"/>\n    <xhtml:link rel="alternate" hreflang="ar" href="${SITE}/ar${p}"/>`;
const urls = PAGES.flatMap((p) => [p, '/ar' + p]).map((u) => {
  const p = u.replace(/^\/ar/, '') || '/';
  return `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${day}</lastmod>\n${alt(p)}\n  </url>`;
});
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
console.log('wrote sitemap.xml');
