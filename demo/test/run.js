/* Layout test harness for the demo. Load test/index.html over http (node serve.js 5174 demo) — results print on the page. */
(async function () {
  const WIDTHS = [320, 360, 375, 390, 414, 600, 760, 761, 768, 820, 900, 1024, 1180, 1280, 1440, 1920];
  const PAGES = ['glowna.html', 'rejestr.html', 'wkrotce.html?o=kpir'];
  const THEMES = ['light', 'dark'];
  const issues = [];
  let checks = 0;
  const log = document.getElementById('log');
  const out = (t, cls) => { const d = document.createElement('div'); d.textContent = t; if (cls) d.className = cls; log.appendChild(d); };
  // Yield without timers: hidden tabs throttle setTimeout to ~1/s, MessageChannel is not throttled.
  // Animations are disabled during measurement, so no real delay is needed.
  const wait = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
  const fail = (ctx, msg) => issues.push(ctx + ' — ' + msg);

  function frame(w, h) {
    const f = document.createElement('iframe');
    f.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;border:0;opacity:0;pointer-events:none;z-index:-1`;
    document.body.appendChild(f);
    return f;
  }
  async function load(f, src) {
    const errs = [];
    await new Promise(res => { f.onload = res; f.src = src; });
    const win = f.contentWindow;
    win.addEventListener('error', e => errs.push(e.message));
    // buffered layout-shift entries since navigation start
    let cls = 0;
    try { new win.PerformanceObserver(l => l.getEntries().forEach(en => { if (!en.hadRecentInput) cls += en.value; })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
    await (win.document.fonts ? win.document.fonts.ready : Promise.resolve());
    await wait(120);
    const st = win.document.createElement('style'); st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; win.document.head.appendChild(st);
    return { win, doc: win.document, errs, cls: () => cls };
  }
  const visible = el => { const cs = el.ownerDocument.defaultView.getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[hidden]'); };
  function inScroller(el) {
    const win = el.ownerDocument.defaultView;
    for (let p = el.parentElement; p && p !== el.ownerDocument.body; p = p.parentElement) {
      const cs = win.getComputedStyle(p);
      if (/(auto|scroll|hidden|clip)/.test(cs.overflowX)) return true;
      if (cs.position === 'fixed' && p.classList.contains('detail')) return true; // off-canvas sheet
    }
    return false;
  }
  function layoutChecks(ctx, doc, w) {
    checks++;
    w = doc.documentElement.clientWidth;
    const sw = doc.documentElement.scrollWidth;
    if (sw > w + 1) fail(ctx, `poziomy scroll: ${sw}px > ${w}px`);
    const els = [...doc.body.querySelectorAll('*')].filter(e => !e.closest('.vat-demobar,#vat-toast,svg,.js-menu[hidden]'));
    let outside = 0, spill = 0;
    for (const el of els) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if ((r.right > w + 1 || r.left < -1) && !inScroller(el) && !(el.classList.contains('detail') && !el.classList.contains('on'))) { if (outside++ < 3) fail(ctx, `poza ekranem: <${el.tagName.toLowerCase()} class="${el.className}"> ${Math.round(r.left)}…${Math.round(r.right)}`); }
      const cs = doc.defaultView.getComputedStyle(el);
      if (cs.overflowX === 'visible' && el.children.length === 0 && el.textContent.trim() && el.scrollWidth > el.clientWidth + 2 && cs.display !== 'inline') {
        if (spill++ < 3) fail(ctx, `tekst wychodzi z elementu: "${el.textContent.trim().slice(0, 40)}" (${el.scrollWidth}>${el.clientWidth})`);
      }
    }
    // top bar: greeting must not run under the controls
    const hello = doc.querySelector('.topbar .hello'), right = doc.querySelector('.tb-r');
    if (hello && right && hello.getBoundingClientRect().right > right.getBoundingClientRect().left + 1) fail(ctx, 'nagłówek nachodzi na przyciski w pasku górnym');
  }
  function menuChecks(ctx, doc, w) {
    w = doc.documentElement.clientWidth;
    const toggles = [...doc.querySelectorAll('[data-menu-toggle]')].filter(visible);
    for (const t of toggles) {
      t.click();
      const m = doc.getElementById(t.dataset.menuToggle);
      checks++;
      if (!m || m.hidden) { fail(ctx, `menu ${t.dataset.menuToggle} nie otwiera się`); continue; }
      const r = m.getBoundingClientRect();
      if (r.left < -1 || r.right > w + 1) fail(ctx, `menu ${t.dataset.menuToggle} wychodzi poza ekran (${Math.round(r.left)}…${Math.round(r.right)})`);
      // nothing may paint on top of an open menu: probe points inside it
      checks++;
      const vh = doc.documentElement.clientHeight;
      const pts = [[.5, .5], [.15, .2], [.85, .2], [.15, .8], [.85, .8]]
        .map(([fx, fy]) => [r.left + r.width * fx, r.top + r.height * fy])
        .filter(([x, y]) => x > 0 && x < w && y > 0 && y < vh);
      const covered = pts.map(([x, y]) => doc.elementFromPoint(x, y)).filter(hit => hit && !m.contains(hit));
      if (covered.length) fail(ctx, `menu ${t.dataset.menuToggle} jest zasłonięte przez <${covered[0].tagName.toLowerCase()} class="${covered[0].className}">`);
      doc.body.click();
    }
  }

  for (const theme of THEMES) for (const page of PAGES) {
    out(`▸ ${page} · ${theme}`, 'h');
    for (const w of WIDTHS) {
      const h = w < 700 ? 667 : 860;
      const f = frame(w, h);
      const ctx = `${page} @${w}px ${theme}`;
      const sep = page.includes('?') ? '&' : '?';
      const { win, doc, errs, cls } = await load(f, `../${page}${sep}theme=${theme}`);
      if ((doc.documentElement.dataset.theme === 'dark') !== (theme === 'dark')) fail(ctx, 'motyw nie został zastosowany');
      if (!doc.querySelector('.topbar .hello')) fail(ctx, 'brak paska górnego');
      layoutChecks(ctx, doc, w);
      menuChecks(ctx, doc, w);
      const shift = cls();
      checks++;
      if (shift > 0.02) fail(ctx, `przesunięcia układu przy ładowaniu (CLS ${shift.toFixed(3)})`);

      if (page === 'rejestr.html') {
        // purchases tab + thumb position
        doc.querySelector('[data-kind=purchases]').click(); await wait(40);
        const th = doc.querySelector('.tabs .thumb'), z = doc.querySelector('[data-kind=purchases]');
        checks++;
        if (Math.abs(th.getBoundingClientRect().left - z.getBoundingClientRect().left) > 1.5 || Math.abs(th.offsetWidth - z.offsetWidth) > 1) fail(ctx, 'suwak Sprzedaż/Zakupy nie trafia w zakładkę');
        if (!/Beta/.test(doc.querySelector('.it .p')?.textContent || '')) fail(ctx, 'po przełączeniu na Zakupy lista się nie zmieniła');
        layoutChecks(ctx + ' [zakupy]', doc, w);
        doc.querySelector('[data-kind=sales]').click(); await wait(40);
        // states
        for (const s of ['empty', 'error']) {
          doc.querySelector(`.vat-demobar [data-s=${s}]`).click(); await wait(30);
          checks++;
          const txt = doc.querySelector('#md .state h3')?.textContent || '';
          if (s === 'empty' && !/Brak/.test(txt)) fail(ctx, 'brak stanu pustego');
          if (s === 'error' && !/Nie udało/.test(txt)) fail(ctx, 'brak stanu błędu');
          layoutChecks(ctx + ` [${s}]`, doc, w);
        }
        doc.querySelector('.vat-demobar [data-s=data]').click(); await wait(30);
        // the demo state switcher stays clickable above page content
        checks++;
        const bar = doc.querySelector('.vat-demobar'), br = bar.getBoundingClientRect();
        const hitBar = doc.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2);
        if (!hitBar || !bar.contains(hitBar)) fail(ctx, `przełącznik stanów jest zasłonięty przez <${hitBar && hitBar.tagName.toLowerCase()} class="${hitBar && hitBar.className}">`);
        // next page + page size
        doc.querySelector('[data-pg="1"]').click(); await wait(30);
        checks++;
        if (!/11/.test(doc.querySelector('.mfoot span')?.textContent || '')) fail(ctx, 'paginacja nie działa');
        layoutChecks(ctx + ' [strona 2]', doc, w);
        // phone: detail sheet
        if (w <= 820) {
          doc.querySelector('.it[data-id]').click(); await wait(40);
          const d = doc.querySelector('.detail').getBoundingClientRect();
          checks++;
          if (Math.abs(d.left) > 1 || Math.abs(d.width - doc.documentElement.clientWidth) > 1) fail(ctx, `szczegóły dokumentu nie zajmują ekranu (${Math.round(d.left)}, ${Math.round(d.width)})`);
          layoutChecks(ctx + ' [szczegóły]', doc, w);
          doc.querySelector('[data-back]').click(); await wait(40);
          const d2 = doc.querySelector('.detail').getBoundingClientRect();
          checks++;
          if (d2.left < doc.documentElement.clientWidth - 1) fail(ctx, 'szczegóły nie chowają się po „Lista dokumentów”');
        }
        // filters: pick a series, then clear
        const tg = doc.querySelector('[data-menu-toggle=fMenu]'); tg.click();
        const cb = doc.querySelector('#fMenu [data-series]'); cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); await wait(30);
        layoutChecks(ctx + ' [filtr]', doc, w);
        doc.querySelector('#fMenu [data-clear]')?.click(); doc.body.click();
      }

      if (page === 'glowna.html') {
        const phone = w <= 760;
        checks++;
        const desk = doc.querySelector('.desk'), mob = doc.querySelector('.mob');
        if (phone ? !visible(mob) || visible(desk) : !visible(desk) || visible(mob)) fail(ctx, 'zły układ dla tej szerokości (Panel / Wyszukiwarka)');
        if (phone) {
          const q = doc.getElementById('q'); q.value = 'alfa 03'; q.dispatchEvent(new Event('input', { bubbles: true })); await wait(30);
          checks++;
          if (!doc.querySelector('#res a[href*="rejestr.html"]')) fail(ctx, 'wyszukiwarka nie znajduje dokumentu');
          layoutChecks(ctx + ' [wyszukiwanie]', doc, w);
          q.value = 'xyz'; q.dispatchEvent(new Event('input', { bubbles: true })); await wait(40);
          checks++;
          if (!doc.querySelector('#res .empty')) fail(ctx, 'brak komunikatu „nic nie znaleziono”');
          q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true }));
          doc.querySelectorAll('[data-mrow]').forEach(r => r.click()); await wait(30);
          layoutChecks(ctx + ' [rozwinięte]', doc, w);
        } else {
          doc.querySelectorAll('[data-row]').forEach(r => r.click()); await wait(30);
          layoutChecks(ctx + ' [rozwinięte]', doc, w);
          // KPI values on one line per row
          const vals = [...doc.querySelectorAll('.kp b')].map(b => b.getBoundingClientRect());
          const rows = {};
          vals.forEach(r => { const k = Math.round(r.top / 40); (rows[k] = rows[k] || []).push(r.top); });
          checks++;
          const cards = [...doc.querySelectorAll('.kp > div')];
          const byRow = {};
          cards.forEach(c => { const k = Math.round(c.getBoundingClientRect().top); (byRow[k] = byRow[k] || []).push(c.querySelector('b').getBoundingClientRect().top); });
          for (const k in byRow) { const t = byRow[k]; if (Math.max(...t) - Math.min(...t) > 1) fail(ctx, `wartości w kartach nie są w jednej linii (${t.map(Math.round).join(', ')})`); }
        }
      }
      if (errs.length) fail(ctx, 'błędy JS: ' + errs.join('; '));
      f.remove();
    }
  }
  out('');
  out(`Sprawdzeń: ${checks}. Problemów: ${issues.length}.`, issues.length ? 'bad' : 'ok');
  const groups = {};
  issues.forEach(i => { const [c, m] = i.split(' — '); const k = m.replace(/-?\d+(\.\d+)?/g, '#'); (groups[k] = groups[k] || []).push(c); });
  const summary = Object.entries(groups).sort((a, b) => b[1].length - a[1].length).map(([k, v]) => `${v.length}× ${k} | np. ${v.slice(0, 4).join(' ; ')}`);
  summary.forEach(s => out('✗ ' + s, 'bad'));
  window.__RESULT = { checks, issues, summary };
  try { localStorage.setItem('vat-test', JSON.stringify({ at: new Date().toISOString(), checks, count: issues.length, summary, issues })); } catch (e) {}
})();
