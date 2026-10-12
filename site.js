/* yuba-app.com — the whole site's behaviour, in one small file. No libraries, no requests,
   no cookies; the language choice lives in localStorage ('yuba-lang').
   The tiny script in each page's <head> has already picked the language (so an Arabic visitor
   never sees English first), stamped html.js, and keeps html.scrolled for the header.
   Everything here is an extra: without it the page still reads top to bottom. */
(function start() {
  // loaded async (it never holds up the first paint), so it may arrive before the page is parsed
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); return; }
  var d = document, html = d.documentElement;
  var head = d.querySelector('header.site');
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var ar = function () { return html.getAttribute('data-lang') === 'ar'; };
  var shown = function (el) { return !!(el && el.getClientRects().length); };
  var how = function () { return reduce.matches ? 'instant' : 'smooth'; };
  var headBottom = function () { return head ? head.getBoundingClientRect().bottom : 0; };
  var L = {
    en: { close: 'Close', prev: 'Previous screen', next: 'Next screen', dialog: 'App screen' },
    ar: { close: 'إغلاق', prev: 'الشاشة السابقة', next: 'الشاشة التالية', dialog: 'شاشة من التطبيق' }
  };
  var t = function (k) { return L[ar() ? 'ar' : 'en'][k]; };

  /* ── language ─────────────────────────────────────────────── */
  var titleEn = d.title, titleAr = html.getAttribute('data-title-ar');
  function labels() {
    var a = ar();
    if (titleAr) d.title = a ? titleAr : titleEn;
    d.querySelectorAll('[data-aria-en]').forEach(function (el) {
      el.setAttribute('aria-label', el.getAttribute(a ? 'data-aria-ar' : 'data-aria-en'));
    });
    d.querySelectorAll('[data-controls-en]').forEach(function (el) {
      el.setAttribute('aria-controls', el.getAttribute(a ? 'data-controls-ar' : 'data-controls-en'));
    });
  }
  // The visible language's own landmarks, in order: the home page's blocks, or a policy's headings.
  // Both languages have the same blocks in the same order, so index N in one is index N in the other.
  function marks() {
    var root = d.querySelector(ar() ? '.home[lang="ar"], article[lang="ar"]' : '.home[lang="en"], article[lang="en"]');
    return root ? [].slice.call(root.querySelectorAll('.hero-grid, .band, .doc-body > h1, .doc-body > h2')) : [];
  }
  function spans(ms) {
    return ms.map(function (m, i) {
      var top = m.getBoundingClientRect().top;
      var end = ms[i + 1] ? ms[i + 1].getBoundingClientRect().top : m.parentNode.getBoundingClientRect().bottom;
      return { top: top, span: Math.max(1, end - top) };
    });
  }
  // Switching language keeps your place: the same block, the same way through it.
  function switchLang() {
    var line = headBottom() + 1, ms = marks(), s = spans(ms), at = null;
    var fromEnd = html.scrollHeight - scrollY;
    if (scrollY > 4) for (var i = s.length - 1; i >= 0; i--) if (s[i].top <= line) { at = { i: i, r: (line - s[i].top) / s[i].span }; break; }
    var toAr = !ar();
    if (toAr) html.setAttribute('data-lang', 'ar'); else html.removeAttribute('data-lang');
    html.lang = toAr ? 'ar' : 'en';
    try { localStorage.setItem('yuba-lang', toAr ? 'ar' : 'en'); } catch (e) {}
    labels();
    var y = 0;
    if (at && at.r > 1) y = html.scrollHeight - fromEnd;               // below the last block: keep the distance from the end
    else if (at) { var ms2 = marks(), s2 = spans(ms2)[at.i]; if (s2) y = scrollY + s2.top + at.r * s2.span - line; }
    window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
    tocMark(); galleries();
  }

  /* ── jumps: one link, either language ─────────────────────────
     #faq and #faq-ar are the same place; a link (or a shared URL) finds whichever is showing. */
  function find(id) {
    if (!id) return null;
    var el = d.getElementById(id);
    if (shown(el)) return el;
    var twin = d.getElementById(/-ar$/.test(id) ? id.slice(0, -3) : id + '-ar');
    if (shown(twin)) return twin;
    var m = /^(en|ar)-(\d+)$/.exec(id); // the policies' old numbered headings
    if (m) { var hs = marks().filter(function (h) { return h.tagName === 'H2'; }); return hs[m[2] - 1] || null; }
    return null;
  }
  function go(el, opts) {
    opts = opts || {};
    if (el.tagName === 'DETAILS') el.open = true;
    el.scrollIntoView({ behavior: opts.instant ? 'instant' : how(), block: 'start' });
    if (opts.focus !== false) {
      var f = el.tagName === 'DETAILS' ? el.querySelector('summary') : el;
      if (!/^(A|BUTTON|SUMMARY)$/.test(f.tagName) && !f.hasAttribute('tabindex')) f.setAttribute('tabindex', '-1');
      f.focus({ preventScroll: true });
    }
    var id = el.id.replace(/-ar$/, '');
    if (opts.push && id !== 'main' && location.hash !== '#' + id) history.pushState(null, '', '#' + id);
  }
  function fromHash(onLoad) {
    var id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
    var el = find(id);
    if (!el) return;
    if (el.id === id && el.tagName !== 'DETAILS' && !onLoad) return; // the browser has done it
    go(el, { instant: true, focus: !onLoad });
  }

  /* ── the header's menu (phone) / contents (policies) ────────── */
  var mbtn = d.querySelector('.menubtn'), open = false;
  function panel() {
    var p = [].slice.call(d.querySelectorAll('.menu, .toc')).filter(function (x) { return !x.closest('[lang]') || shown(x.closest('[lang]')); });
    return p[0] || null;
  }
  // A keyboard opening moves focus into the list; a tap leaves it on the button.
  function setMenu(on, refocus, inside) {
    if (!mbtn || on === open) return;
    open = on;
    html.style.setProperty('--hb', Math.round(headBottom()) + 'px');
    html.classList.toggle('menu-open', on);
    mbtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on && inside) {
      var p = panel(), f = p && (p.querySelector('a.on') || p.querySelector('a'));
      if (f) f.focus({ preventScroll: true });
    } else if (refocus) mbtn.focus();
  }

  /* ── the policies' contents: the section you are reading is marked ── */
  function tocMark() {
    var hs = marks().filter(function (h) { return h.tagName === 'H2'; });
    if (!hs.length) return;
    var line = headBottom() + innerHeight * 0.25, cur = null;
    hs.forEach(function (h) { if (h.getBoundingClientRect().top <= line) cur = h; });
    if (innerHeight + scrollY >= html.scrollHeight - 4) cur = hs[hs.length - 1];
    d.querySelectorAll('.toc a[href^="#"]').forEach(function (a) {
      var on = !!cur && a.getAttribute('href') === '#' + cur.id;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  /* ── the screens: a row you can move with buttons, and a larger view ── */
  function galleries() {
    d.querySelectorAll('.gallery').forEach(function (g) {
      var row = g.querySelector('.shots');
      if (!row || !shown(row)) return;
      var max = row.scrollWidth - row.clientWidth, pos = Math.abs(row.scrollLeft);
      g.classList.toggle('scrolls', max > 4);
      var p = g.querySelector('.shot-nav .prev'), n = g.querySelector('.shot-nav .next');
      if (p) p.setAttribute('aria-disabled', pos <= 4 ? 'true' : 'false');
      if (n) n.setAttribute('aria-disabled', pos >= max - 4 ? 'true' : 'false');
    });
  }
  function nudge(btn) {
    if (btn.getAttribute('aria-disabled') === 'true') return;
    var row = btn.closest('.gallery').querySelector('.shots'), k = row.children;
    var step = k.length > 1 ? Math.abs(k[1].offsetLeft - k[0].offsetLeft) : row.clientWidth;
    var dir = getComputedStyle(row).direction === 'rtl' ? -1 : 1;
    row.scrollBy({ left: (btn.classList.contains('next') ? 1 : -1) * dir * step, behavior: how() });
  }

  var lb, lbImg, lbCap, lbCount, lbPrev, lbNext, items = [], idx = 0, back = null;
  function lbBuild() {
    var chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    lb = d.createElement('dialog');
    lb.className = 'lb';
    lb.innerHTML = '<div class="lb-top"><span class="lb-count"></span><button type="button" class="lb-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<figure class="lb-fig"><img alt="" width="600" height="1304"><figcaption></figcaption></figure>' +
      '<button type="button" class="lb-prev">' + chev + '</button><button type="button" class="lb-next">' + chev + '</button>';
    d.body.appendChild(lb);
    lbImg = lb.querySelector('img'); lbCap = lb.querySelector('figcaption'); lbCount = lb.querySelector('.lb-count');
    lbPrev = lb.querySelector('.lb-prev'); lbNext = lb.querySelector('.lb-next');
    lb.querySelector('.lb-close').addEventListener('click', function () { lb.close(); });
    lbPrev.addEventListener('click', function () { lbShow(idx - 1); });
    lbNext.addEventListener('click', function () { lbShow(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); }); // the empty dark around the screen
    lb.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      lbShow(idx + ((e.key === 'ArrowRight') !== ar() ? 1 : -1));
    });
    var sx = null, sy = 0, fig = lb.querySelector('.lb-fig');
    fig.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
    fig.addEventListener('pointercancel', function () { sx = null; });
    fig.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) lbShow(idx + ((dx < 0) !== ar() ? 1 : -1));
    });
    lb.addEventListener('close', function () {
      html.classList.remove('lb-open');
      if (back) {
        back.focus({ preventScroll: true });
        back.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      }
    });
  }
  function lbShow(i) {
    if (i < 0 || i >= items.length) return;
    idx = i;
    var a = items[i], im = a.querySelector('img'), cap = a.querySelector('figcaption');
    lbImg.src = a.getAttribute('href');
    lbImg.alt = im ? im.alt : '';
    lbCap.textContent = cap ? cap.textContent : '';
    lbCount.textContent = (i + 1) + ' / ' + items.length;
    lbPrev.setAttribute('aria-disabled', i === 0 ? 'true' : 'false');
    lbNext.setAttribute('aria-disabled', i === items.length - 1 ? 'true' : 'false');
    back = a;
  }
  function lbOpen(a) {
    if (!window.HTMLDialogElement) return false;
    if (!lb) lbBuild();
    var row = a.closest('.shots');
    items = [].slice.call(row.querySelectorAll('a.shot'));
    lb.lang = ar() ? 'ar' : 'en'; lb.dir = ar() ? 'rtl' : 'ltr';
    lb.setAttribute('aria-label', t('dialog'));
    lb.querySelector('.lb-close').setAttribute('aria-label', t('close'));
    lbPrev.setAttribute('aria-label', t('prev'));
    lbNext.setAttribute('aria-label', t('next'));
    lbShow(items.indexOf(a));
    html.classList.add('lb-open');
    lb.showModal();
    return true;
  }

  /* ── one listener for every click ───────────────────────────── */
  d.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button) return;
    var x = e.target;
    if (x.closest('.langbtn')) { setMenu(false); switchLang(); return; }
    if (x.closest('.menubtn')) { setMenu(!open, false, e.detail === 0); return; }
    var nb = x.closest('.shot-nav button');
    if (nb) { nudge(nb); return; }
    var a = x.closest('a[href]');
    if (open && !(a && a.closest('.menu, .toc')) && !x.closest('.menu, .toc')) setMenu(false);
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.classList.contains('shot')) { if (lbOpen(a)) e.preventDefault(); return; }
    var href = a.getAttribute('href'), hash = null;
    if (href.charAt(0) === '#') hash = href.slice(1);
    else if (href.indexOf('/#') === 0 && location.pathname === '/') hash = href.slice(2);
    if (hash === null) { if (open) setMenu(false); return; }
    var el = find(hash);
    if (!el) return;
    e.preventDefault();
    setMenu(false);
    go(el, { push: true });
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) { setMenu(false, true); e.preventDefault(); }
  });
  d.addEventListener('focusin', function (e) { // tabbing out of an open menu closes it
    if (open && !e.target.closest('header.site, .toc')) setMenu(false);
  });
  // A question you open becomes the address, so it can be shared (yuba-app.com/#q-banks).
  d.querySelectorAll('.faq details[id]').forEach(function (q) {
    q.addEventListener('toggle', function () {
      if (q.open) history.replaceState(null, '', '#' + q.id.replace(/-ar$/, ''));
    });
  });
  d.querySelectorAll('.shots').forEach(function (r) { r.addEventListener('scroll', galleries, { passive: true }); });

  var queued = false;
  addEventListener('scroll', function () {
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; tocMark(); });
  }, { passive: true });
  addEventListener('resize', function () {
    if (open && !shown(mbtn)) setMenu(false);
    galleries(); tocMark();
  });
  addEventListener('hashchange', function () { fromHash(false); });

  // The five screens of the visible language load as their row comes near (lazy loading alone
  // can leave the last one of a sideways row blank on a phone).
  if ('IntersectionObserver' in window) {
    var near = new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        if (!x.isIntersecting) return;
        x.target.querySelectorAll('img[loading="lazy"]').forEach(function (i) { i.loading = 'eager'; });
        near.unobserve(x.target);
      });
    }, { rootMargin: '1500px 0px' });
    d.querySelectorAll('.shots').forEach(function (r) { near.observe(r); });
  }

  labels();
  galleries();
  tocMark();
  if (location.hash) fromHash(true);
})();
