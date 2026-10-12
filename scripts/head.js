/* Language before the first paint (an Arabic visitor never sees English first), the Latin half of
   the Arabic face fetched early, html.js for the enhanced layout, html.scrolled for the header. The rest is /site.js. */
(function (d) {
  var s = null, q = null;
  try { s = localStorage.getItem('yuba-lang'); } catch (e) {}
  try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (q === 'ar' || q === 'en') {
    s = q;
    try { localStorage.setItem('yuba-lang', q); } catch (e) {}
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
  } else if (s !== 'ar' && s !== 'en') {
    // no choice saved yet: a phone set to Arabic opens the Arabic page
    try { if (/^ar(-|$)/i.test((navigator.languages && navigator.languages[0]) || navigator.language || '')) s = 'ar'; } catch (e) {}
  }
  d.className = 'js';
  if (s === 'ar') {
    d.setAttribute('data-lang', 'ar'); d.lang = 'ar';
    var l = document.createElement('link');
    l.rel = 'preload'; l.as = 'font'; l.type = 'font/woff2'; l.crossOrigin = 'anonymous';
    l.href = '/fonts/noto-kufi-arabic-latin.woff2';
    document.head.appendChild(l);
  }
  var on = false, f = function () { var y = (window.scrollY || 0) > 8; if (y !== on) { on = y; d.classList.toggle('scrolled', y); } };
  f(); addEventListener('scroll', f, { passive: true });
})(document.documentElement);
