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

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) =>
  esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => `<a href="${u.replace(/"/g, '%22')}">${t}</a>`);

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

function renderMd(md) {
  const blocks = md.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out = [];
  for (const b of blocks) {
    if (b.startsWith('# ')) continue; // the template owns the h1
    if (/^\*\*(Effective|سارية|تسري)/.test(b) || /^(Effective |سارية |تسري )/.test(b)) {
      out.push(`    <p class="date">${inline(b.replace(/^\*\*|\*\*$/g, ''))}</p>`);
      continue;
    }
    if (b.startsWith('## ')) { out.push(`    <h2>${inline(b.slice(3))}</h2>`); continue; }
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

const template = (key, page) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${esc(page.en.title)} · Yuba</title>
<meta name="description" content="${esc(page.desc)}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%23141519'/><rect x='26' y='26' width='12' height='12' fill='%23e31937'/></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Noto+Kufi+Arabic:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/site.css">
<noscript><style>[lang="ar"]{display:revert !important}.langbtn{display:none}</style></noscript>
</head>
<body>
<div class="page">

  <header class="site">
    <a class="lockup" href="/">
      <span class="latin">YUBA</span><span class="dot"></span><span class="arabic">يوبا</span>
    </a>
    <button class="langbtn" type="button">
      <span lang="ar">العربية</span><span lang="en">English</span>
    </button>
  </header>

  <main>
    <article lang="en">
    <h1>${esc(page.en.title)}</h1>
${renderMd(page.en.md)}
    </article>
    <article lang="ar" dir="rtl">
    <h1>${esc(page.ar.title)}</h1>
${renderMd(page.ar.md)}
    </article>
  </main>

  <footer class="site">
    <span>Yuba · يوبا</span>
    <span class="spacer"></span>
    <a href="/privacy"><span lang="en">Privacy</span><span lang="ar">الخصوصية</span></a>
    <a href="/terms"><span lang="en">Terms</span><span lang="ar">الشروط</span></a>
    <a href="/support"><span lang="en">Support</span><span lang="ar">الدعم</span></a>
    <a href="mailto:support@yuba-app.com">support@yuba-app.com</a>
  </footer>

</div>
<script>
(function () {
  var el = document.documentElement;
  function apply(ar) {
    if (ar) el.setAttribute('data-lang', 'ar'); else el.removeAttribute('data-lang');
    el.lang = ar ? 'ar' : 'en';
  }
  var s = null;
  try { s = localStorage.getItem('yuba-lang'); } catch (e) {}
  try {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'ar' || q === 'en') {
      s = q;
      try { localStorage.setItem('yuba-lang', q); } catch (e) {}
      history.replaceState(null, '', location.pathname);
    }
  } catch (e) {}
  apply(s === 'ar');
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.langbtn');
    if (!b) return;
    var ar = el.getAttribute('data-lang') !== 'ar';
    apply(ar);
    try { localStorage.setItem('yuba-lang', ar ? 'ar' : 'en'); } catch (e) {}
  });
})();
</script>
</body>
</html>
`;

const DESCS = {
  privacy: 'How Yuba handles your data: everything stays on your phone. The complete policy.',
  terms: 'The terms and membership rules for Yuba.',
  support: 'How to reach Yuba support: support@yuba-app.com.',
};

for (const key of ['privacy', 'terms', 'support']) {
  const page = { ...content[key], desc: DESCS[key] };
  const file = path.join(ROOT, key, 'index.html');
  fs.writeFileSync(file, template(key, page));
  console.log('wrote', path.relative(ROOT, file));
}
