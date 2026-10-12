/* Language before the first paint (an Arabic visitor never sees English first), the Latin half of
   the Arabic face fetched early, html.js for the enhanced layout, html.scrolled for the header. The rest is /site.js.
   Every page has two addresses, data-en-path ("/privacy/") and data-ar-path ("/ar/privacy/"); both files hold both
   languages, so the address simply follows the language shown — no reload. An /ar/ address always opens in Arabic. */
(function (d) {
  var en = d.getAttribute('data-en-path'), ar = d.getAttribute('data-ar-path');
  var onAr = /^\/ar(\/|$)/.test(location.pathname);
  var s = null, q = null;
  try { s = localStorage.getItem('yuba-lang'); } catch (e) {}
  try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (q !== 'ar' && q !== 'en') q = null;
  if (q) s = q;
  else if (onAr) s = 'ar';
  else if (s !== 'ar' && s !== 'en') {
    // no choice saved yet: a phone set to Arabic opens the Arabic page
    try { if (/^ar(-|$)/i.test((navigator.languages && navigator.languages[0]) || navigator.language || '')) s = 'ar'; } catch (e) {}
  }
  if (q || onAr) { try { localStorage.setItem('yuba-lang', s); } catch (e) {} }
  var want = s === 'ar' ? ar : en;
  if (want && want !== location.pathname) { try { history.replaceState(null, '', want + location.hash); } catch (e) {} }
  else if (q) { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {} }
  d.className = 'js';
  if (s === 'ar') {
    d.setAttribute('data-lang', 'ar'); d.lang = 'ar';
    var l = document.createElement('link');
    l.rel = 'preload'; l.as = 'font'; l.type = 'font/woff2'; l.crossOrigin = 'anonymous';
    l.href = '/fonts/noto-kufi-arabic-latin.woff2';
    document.head.appendChild(l);
  } else { d.removeAttribute('data-lang'); d.lang = 'en'; }
  var on = false, f = function () { var y = (window.scrollY || 0) > 8; if (y !== on) { on = y; d.classList.toggle('scrolled', y); } };
  f(); addEventListener('scroll', f, { passive: true });
})(document.documentElement);
