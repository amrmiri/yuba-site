/**
 * yuba-app.com page generator — pours scripts/content.json into the house
 * template. Run `node scripts/build.js` from the repo root after editing
 * content; it rewrites privacy/terms/support index.html files in place.
 *
 * The markdown dialect is deliberately tiny (##, tables, lists, bold, links,
 * paragraphs) — everything the pages use, nothing more.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const content = JSON.parse(fs.readFileSync(path.join(__dirname, 'content.json'), 'utf8'));
// The few lines that pick the language before the first paint. index.html carries the same lines by hand.
const HEAD_JS = fs.readFileSync(path.join(__dirname, 'head.js'), 'utf8').trimEnd();

// /privacy → /privacy/ : the address GitHub Pages actually serves, so a click costs no redirect.
const siteHref = (u) => u.replace(/^\/(privacy|terms|support)(?=$|#)/, '/$1/');
// Section addresses read the same in both languages: #network-traffic (English) and
// #network-traffic-ar (its Arabic twin). site.js sends either to whichever language is showing.
const slug = (t) => t.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) =>
  esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => `<a href="${siteHref(u).replace(/"/g, '%22')}">${t}</a>`);

function renderTable(lines) {
  const rows = lines.map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const header = rows[0];
  const body = rows.slice(2); // row 1 is the |---| divider
  const isFacts = header.every((c) => c === '');
  const tbody = body
    .map((r) => `      <tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
    .join('\n');
  if (isFacts) return `    <table class="facts">\n${tbody}\n    </table>`;
  const thead = `      <tr>${header.map((c) => `<th>${inline(c)}</th>`).join('')}</tr>`;
  return `    <table>\n${thead}\n${tbody}\n    </table>`;
}

function renderMd(md, ids, toc = []) {
  const blocks = md.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out = [];
  for (const b of blocks) {
    if (b.startsWith('# ')) continue; // the template owns the h1
    if (/^\*\*(Effective|سارية|تسري)/.test(b) || /^(Effective |سارية |تسري )/.test(b)) {
      out.push(`    <p class="date">${inline(b.replace(/^\*\*|\*\*$/g, ''))}</p>`);
      continue;
    }
    if (b.startsWith('## ')) {
      const id = ids[toc.length];
      toc.push({ id, text: b.slice(3) });
      out.push(`    <h2 id="${id}">${inline(b.slice(3))}</h2>`);
      continue;
    }
    if (b.startsWith('|')) { out.push(renderTable(b.split('\n'))); continue; }
    if (/^- /.test(b)) {
      out.push(`    <ul>\n${b.split('\n').map((l) => `      <li>${inline(l.replace(/^- /, ''))}</li>`).join('\n')}\n    </ul>`);
      continue;
    }
    if (/^\d+\. /.test(b)) {
      out.push(`    <ol>\n${b.split('\n').map((l) => `      <li>${inline(l.replace(/^\d+\. /, ''))}</li>`).join('\n')}\n    </ol>`);
      continue;
    }
    out.push(`    <p>${inline(b).replace(/ {2}\n|\n/g, '<br>')}</p>`);
  }
  return out.join('\n');
}

// One language's page: the contents column (built from its ## headings) beside the text.
// On a phone or tablet the same list drops from the header's contents button.
function docBody(lang, ids, key, tocTitle, homeLabel) {
  const toc = [];
  const body = renderMd(lang.md, ids, toc);
  const items = toc.map((t) => `        <li><a href="#${t.id}">${inline(t.text)}</a></li>`).join('\n');
  return `    <div class="doc-grid">
      <nav class="toc" id="toc-${key}" aria-label="${tocTitle}">
        <p class="toc-title">${tocTitle}</p>
        <ol>
${items}
        </ol>
        <a class="toc-home" href="/">${homeLabel}</a>
      </nav>
      <div class="doc-body">
    <h1>${esc(lang.title)}</h1>
${body}
      </div>
    </div>`;
}

// The tab title in each language; the brand is added only where the title lacks it.
const titled = (t, brand) => (/Yuba|يوبا/.test(t) ? t : `${t} · ${brand}`);

const template = (key, page) => `<!doctype html>
<html lang="en" data-title-ar="${esc(titled(page.ar.title, 'يوبا'))}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${esc(titled(page.en.title, 'Yuba'))}</title>
<script>
${HEAD_JS}
</script>
<meta name="description" content="${esc(page.desc)}">
<link rel="canonical" href="https://yuba-app.com/${key}/">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_US">
<meta property="og:locale:alternate" content="ar_SA">
<meta property="og:site_name" content="Yuba · يوبا">
<meta property="og:url" content="https://yuba-app.com/${key}/">
<meta property="og:title" content="${esc(titled(page.en.title, 'Yuba'))}">
<meta property="og:description" content="${esc(page.desc)}">
<meta property="og:image" content="https://yuba-app.com/og/yuba-og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Yuba — your bank texts you all month, Yuba adds it up. أين تذهب فلوسك؟ الجواب في رسائل بنكك.">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="theme-color" content="#0b0c0f">
<link rel="preload" href="/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/site.css">
<script src="/site.js" async></script>
<noscript><style>body [lang="ar"]{display:revert !important}.langbtn{display:none}</style></noscript>
</head>
<body class="p-doc">
<a class="skip" href="#main"><span lang="en">Skip to content</span><span lang="ar">انتقل إلى المحتوى</span></a>
<header class="site">
  <div class="head-in">
    <a class="lockup" href="/" aria-label="Yuba · يوبا, home" data-aria-en="Yuba · يوبا, home" data-aria-ar="يوبا · Yuba، الصفحة الرئيسية">
      <span class="latin">YUBA</span><span class="dot"></span><span class="arabic">يوبا</span>
    </a>
    <button class="langbtn" type="button">
      <span lang="ar">العربية</span><span lang="en">English</span>
    </button>
    <button class="menubtn" type="button" aria-expanded="false" aria-controls="toc-en" data-controls-en="toc-en" data-controls-ar="toc-ar" aria-label="On this page" data-aria-en="On this page" data-aria-ar="في هذه الصفحة"><i></i><i></i></button>
  </div>
</header>
<div class="page wide doc">

  <main id="main">
    <article lang="en">
${docBody(page.en, page.ids, 'en', 'On this page', 'Yuba home')}
    </article>
    <article lang="ar" dir="rtl">
${docBody(page.ar, page.ids.map((i) => i + '-ar'), 'ar', 'في هذه الصفحة', 'الصفحة الرئيسية')}
    </article>
  </main>

  <footer class="site">
    <a class="lockup small" href="/"><span class="latin">YUBA</span><span class="dot"></span><span class="arabic">يوبا</span></a>
    <span><span lang="en">Built in Saudi Arabia</span><span lang="ar">صُنع في السعودية</span></span>
    <span class="quiet"><span lang="en">No cookies, no trackers.</span><span lang="ar">لا كوكيز ولا تتبّع.</span></span>
    <span class="spacer"></span>
    <a href="/privacy/"><span lang="en">Privacy</span><span lang="ar">الخصوصية</span></a>
    <a href="/terms/"><span lang="en">Terms</span><span lang="ar">الشروط</span></a>
    <a href="/support/"><span lang="en">Support</span><span lang="ar">الدعم</span></a>
    <a href="mailto:support@yuba-app.com">support@yuba-app.com</a>
  </footer>

</div>
</body>
</html>
`;

// What a search result or a shared link says under the title.
const DESCS = {
  privacy: 'How Yuba handles your data, in full. Your spending stays on your phone; nothing about your money reaches us unless you send it.',
  terms: 'Yuba’s terms of use: the 60 free days, the membership (SAR 29.99 a month or SAR 179.99 a year), cancelling and refunds.',
  support: 'Help with Yuba: quick directions, missed bank texts, membership, exporting and deleting your data. Email support@yuba-app.com.',
};

for (const key of ['privacy', 'terms', 'support']) {
  // one address per section, shared by its two languages — so both must have the same sections, in order
  const heads = (md) => (md.match(/^## .*/gm) || []).map((h) => h.slice(3));
  const en = heads(content[key].en.md), ar = heads(content[key].ar.md);
  if (en.length !== ar.length) throw new Error(`${key}: ${en.length} English sections but ${ar.length} Arabic`);
  const ids = en.map(slug);
  if (new Set(ids).size !== ids.length) throw new Error(`${key}: two sections share an address`);
  const page = { ...content[key], desc: DESCS[key], ids };
  const file = path.join(ROOT, key, 'index.html');
  fs.writeFileSync(file, template(key, page));
  console.log('wrote', path.relative(ROOT, file));
}
