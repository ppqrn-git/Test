/* Shared demo data + helpers for all "Rejestry i VAT" concepts. */
(function () {
  'use strict';

  const MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
  const MONTHS_LOC = ['styczniu', 'lutym', 'marcu', 'kwietniu', 'maju', 'czerwcu', 'lipcu', 'sierpniu', 'wrześniu', 'październiku', 'listopadzie', 'grudniu'];
  const MONTHS_SHORT = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
  const WEEKDAYS = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'niedz'];

  const KINDS = {
    sales: { short: 'Sprzedaż', register: 'Rejestr VAT sprzedaży', party: 'Demo Alfa', code: 'S' },
    purchases: { short: 'Zakupy', register: 'Rejestr VAT zakupów', party: 'Demo Beta', code: 'Z' }
  };
  const OPS = {
    sales: [['krajowa', 'Sprzedaż krajowa'], ['korekta', 'Korekta'], ['wdt', 'WDT'], ['eksport', 'Eksport usług']],
    purchases: [['krajowy', 'Zakup krajowy'], ['korekta', 'Korekta'], ['wnt', 'WNT'], ['import', 'Import usług']]
  };
  const JPK = [['GTU_06', 'GTU_06'], ['GTU_12', 'GTU_12'], ['TP', 'TP'], ['MPP', 'MPP'], ['none', 'Bez kodu']];
  const SERIES = { sales: ['FV', 'KOR', 'FVE'], purchases: ['FZ', 'KZ', 'FZI'] };
  const SERIES_LABEL = { FV: 'FV · faktury', KOR: 'KOR · korekty', FVE: 'FVE · eksport i WDT', FZ: 'FZ · faktury zakupu', KZ: 'KZ · korekty zakupu', FZI: 'FZI · zakupy zagraniczne' };
  const RATE_ORDER = ['23%', '8%', '5%', '0%', 'np'];
  const RATE_VAL = { '23%': 0.23, '8%': 0.08, '5%': 0.05, '0%': 0, np: 0 };
  const COLUMNS = [
    { key: 'party', label: 'Kontrahent' },
    { key: 'date', label: 'Data' },
    { key: 'number', label: 'Numer dokumentu' },
    { key: 'ksef', label: 'Numer KSeF' },
    { key: 'ident', label: 'Identyfikator' }
  ];

  function rng(seed) { let s = seed % 2147483647; return () => { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  const pad = n => String(n).padStart(2, '0');
  const r2 = n => Math.round(n * 100) / 100;
  const round50 = n => 50 * Math.round(n / 50);
  const line = (rate, net) => ({ rate, net, vat: r2(net * RATE_VAL[rate]) });

  function build(kind) {
    const r = rng(kind === 'sales' ? 11 : 29);
    const counts = kind === 'sales' ? [9, 11, 8, 12, 10, 13, 7, 9, 12, 14] : [6, 7, 5, 8, 9, 6, 7, 5, 8, 9];
    const K = KINDS[kind];
    const out = [];
    counts.forEach((c, mi) => {
      const mm = pad(mi + 1);
      const oct = mi === 9;
      for (let i = 1; i <= c; i++) {
        const day = oct ? i : Math.max(1, Math.min(28, Math.round(i * 28 / c - r() * 2)));
        let op;
        if (kind === 'sales') {
          if (oct) op = i === 3 ? 'korekta' : i === 13 ? 'eksport' : 'krajowa';
          else { const x = r(); op = x < 0.08 ? 'korekta' : x < 0.15 ? 'wdt' : x < 0.21 ? 'eksport' : 'krajowa'; }
        } else {
          const x = r(); op = x < 0.08 ? 'korekta' : x < 0.15 ? 'wnt' : x < 0.22 ? 'import' : 'krajowy';
        }
        const base = round50(250 + r() * 1500);
        const lines = [];
        if (op === 'korekta') lines.push(line('23%', -round50(100 + r() * 300)));
        else if (op === 'eksport') lines.push(line('np', base));
        else if (op === 'wdt') lines.push(line('0%', base));
        else {
          lines.push(line('23%', base));
          if (!oct && r() < 0.2) lines.push(line('8%', round50(100 + r() * 500)));
        }
        let series;
        if (kind === 'sales') series = op === 'korekta' ? 'KOR' : (op === 'eksport' || op === 'wdt') ? 'FVE' : 'FV';
        else series = op === 'korekta' ? 'KZ' : (op === 'wnt' || op === 'import') ? 'FZI' : 'FZ';
        let jpk = null;
        if (kind === 'sales') jpk = oct ? ({ 5: 'GTU_12', 9: 'TP', 11: 'MPP' })[i] || null : [null, null, null, 'GTU_06', 'GTU_12', 'TP', 'MPP'][Math.floor(r() * 7)];
        else jpk = [null, null, null, 'MPP'][Math.floor(r() * 4)];
        const hex = Math.floor(r() * 0xffffff).toString(16).toUpperCase().padStart(6, '0');
        const ksef = oct || r() < 0.15 ? null : `5260250274-2026${mm}${pad(day)}-${hex}-${hex.slice(0, 2)}`;
        const net = r2(lines.reduce((a, l) => a + l.net, 0));
        const vat = r2(lines.reduce((a, l) => a + l.vat, 0));
        const partyNo = oct ? i : ((i + mi * 5) % 16) + 1;
        out.push({
          id: `${kind}-${mi}-${i}`,
          kind,
          party: `${K.party} ${pad(partyNo)}`,
          date: `2026-${mm}-${pad(day)}`,
          year: 2026, month: mi, day,
          number: `${series}/${i}/${mm}/2026/DEMO`,
          series, op, opLabel: OPS[kind].find(o => o[0] === op)[1],
          jpk, ksef,
          ident: `DEMO-${K.code}-${oct ? i : (mi + 1) + '.' + i}`,
          lines, net, vat, gross: r2(net + vat)
        });
      }
    });
    return out;
  }

  const DATA = { sales: build('sales'), purchases: build('purchases') };

  function sum(rows) {
    const t = { net: 0, vat: 0, gross: 0, count: rows.length };
    const by = {};
    rows.forEach(d => {
      t.net += d.net; t.vat += d.vat; t.gross += d.gross;
      d.lines.forEach(l => { by[l.rate] = by[l.rate] || { rate: l.rate, net: 0, vat: 0 }; by[l.rate].net += l.net; by[l.rate].vat += l.vat; });
    });
    t.net = r2(t.net); t.vat = r2(t.vat); t.gross = r2(t.gross);
    t.byRate = RATE_ORDER.filter(k => by[k]).map(k => ({ rate: k, net: r2(by[k].net), vat: r2(by[k].vat), gross: r2(by[k].net + by[k].vat) }));
    return t;
  }

  /**
   * q: { kind, year, month (0-11 | null = whole year), day?, op, jpk, series: [], q, sort: {key, dir} }
   */
  function query(q) {
    const term = (q.q || '').trim().toLowerCase();
    let rows = DATA[q.kind].filter(d =>
      d.year === q.year &&
      (q.month == null || d.month === q.month) &&
      (q.day == null || d.day === q.day) &&
      (!q.op || q.op === 'all' || d.op === q.op) &&
      (!q.jpk || q.jpk === 'all' || (q.jpk === 'none' ? !d.jpk : d.jpk === q.jpk)) &&
      (!q.series || !q.series.length || q.series.includes(d.series)) &&
      (!term || [d.party, d.number, d.ident, d.ksef || 'brak potwierdzenia', d.opLabel, d.jpk || ''].join(' ').toLowerCase().includes(term))
    );
    const s = q.sort || { key: 'date', dir: 1 };
    rows = rows.slice().sort((a, b) => {
      const av = s.key === 'ksef' ? (a.ksef || '') : a[s.key];
      const bv = s.key === 'ksef' ? (b.ksef || '') : b[s.key];
      const c = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv), 'pl', { numeric: true });
      return (c || a.date.localeCompare(b.date) || a.number.localeCompare(b.number, 'pl', { numeric: true })) * s.dir;
    });
    return { rows, totals: sum(rows) };
  }

  function page(rows, p, size) {
    const pages = Math.max(1, Math.ceil(rows.length / size));
    const cur = Math.min(Math.max(1, p), pages);
    const from = (cur - 1) * size;
    return { items: rows.slice(from, from + size), page: cur, pages, from: rows.length ? from + 1 : 0, to: Math.min(from + size, rows.length), total: rows.length };
  }

  function monthStats(kind, year, filters) {
    return MONTHS.map((_, m) => sum(query(Object.assign({}, filters || {}, { kind, year, month: m, day: null, q: '' })).rows));
  }

  function dayStats(kind, year, month, filters) {
    const map = {};
    query(Object.assign({}, filters || {}, { kind, year, month, day: null })).rows.forEach(d => {
      map[d.day] = map[d.day] || { count: 0, gross: 0, vat: 0 };
      map[d.day].count++; map[d.day].gross = r2(map[d.day].gross + d.gross); map[d.day].vat = r2(map[d.day].vat + d.vat);
    });
    return map;
  }

  const money = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });
  const num = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt = n => money.format(n);
  const fmtNum = n => num.format(n);
  function fmtDate(iso, style) {
    const [y, m, d] = iso.split('-').map(Number);
    if (style === 'short') return `${d} ${MONTHS_SHORT[m - 1]}`;
    if (style === 'long') return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
    return iso;
  }
  function plural(n, one, few, many) {
    if (n === 1) return one;
    const d = n % 10, h = n % 100;
    return d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many;
  }
  const docs = n => `${n} ${plural(n, 'dokument', 'dokumenty', 'dokumentów')}`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- tiny UI helpers ---------- */

  function icons() { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } }); }

  // [data-menu-toggle="id"] toggles #id (class js-menu). Outside click / Esc closes.
  function bindMenus(root) {
    (root || document).addEventListener('click', e => {
      const t = e.target.closest('[data-menu-toggle]');
      if (t) {
        const m = document.getElementById(t.dataset.menuToggle);
        const willOpen = m.hidden;
        closeMenus();
        m.hidden = !willOpen;
        t.setAttribute('aria-expanded', String(willOpen));
        if (willOpen) fitMenu(m);
        e.stopPropagation();
        return;
      }
      if (!e.target.closest('.js-menu')) closeMenus();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });
  }
  // Keep an opened menu fully inside the viewport: cap its width and nudge it horizontally if needed.
  function fitMenu(m) {
    const vw = document.documentElement.clientWidth, pad = 8;
    m.style.translate = '';
    m.style.maxWidth = (vw - pad * 2) + 'px';
    const r = m.getBoundingClientRect();
    let dx = 0;
    if (r.right > vw - pad) dx = vw - pad - r.right;
    if (r.left + dx < pad) dx = pad - r.left;
    if (dx) m.style.translate = Math.round(dx) + 'px 0';
  }
  window.addEventListener('resize', () => document.querySelectorAll('.js-menu:not([hidden])').forEach(fitMenu));

  function closeMenus() {
    document.querySelectorAll('.js-menu').forEach(m => { m.hidden = true; });
    document.querySelectorAll('[data-menu-toggle]').forEach(t => t.setAttribute('aria-expanded', 'false'));
  }

  let toastTimer;
  function toast(msg) {
    let el = document.getElementById('vat-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'vat-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), 2400);
  }

  // Demo-only control: switches between filled / empty / error states.
  function demoBar(onChange, opts) {
    opts = opts || {};
    const bar = document.createElement('div');
    bar.className = 'vat-demobar' + (opts.top ? ' top' : '');
    bar.innerHTML = `<span class="lbl">Stan danych:</span>
      <button data-s="data" aria-pressed="true">Dane</button>
      <button data-s="empty" aria-pressed="false">Pusto</button>
      <button data-s="error" aria-pressed="false">Błąd</button>`;
    bar.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      set(b.dataset.s); onChange(b.dataset.s);
    });
    function set(s) { bar.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.s === s))); }
    document.body.appendChild(bar);
    return { set };
  }

  const css = document.createElement('style');
  css.textContent = `
  .vat-demobar{position:fixed;left:12px;bottom:12px;z-index:9999;display:flex;align-items:center;gap:4px;padding:4px;border-radius:10px;
    background:rgba(20,22,28,.86);backdrop-filter:blur(8px);color:#cfd3dc;font:500 12px/1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25)}
  .vat-demobar.top{top:12px;bottom:auto;left:auto;right:12px}
  .vat-demobar a{color:#cfd3dc;text-decoration:none;padding:6px 8px;border-radius:7px}
  .vat-demobar a:hover{background:rgba(255,255,255,.08)}
  .vat-demobar .sep{width:1px;height:16px;background:rgba(255,255,255,.18);margin:0 2px}
  .vat-demobar .lbl{padding:0 4px 0 8px;opacity:.6;white-space:nowrap}
  .vat-demobar button{all:unset;cursor:pointer;padding:6px 9px;border-radius:7px}
  .vat-demobar button[aria-pressed=true]{background:#fff;color:#111}
  .vat-demobar button:focus-visible,.vat-demobar a:focus-visible{outline:2px solid #8ab4ff}
  @media (max-width:480px){.vat-demobar .lbl{display:none}.vat-demobar{left:8px;bottom:8px}}
  #vat-toast{position:fixed;left:50%;bottom:64px;transform:translate(-50%,12px);opacity:0;pointer-events:none;z-index:9998;
    background:var(--toast-bg,#1d232b);color:var(--toast-fg,#fff);padding:10px 16px;border-radius:var(--toast-r,10px);font:500 14px/1.3 inherit;
    transition:opacity .2s,transform .2s;max-width:calc(100vw - 32px)}
  #vat-toast.on{opacity:1;transform:translate(-50%,0)}
  @media (prefers-reduced-motion:reduce){#vat-toast{transition:none}}`;
  document.head.appendChild(css);

  window.VAT = {
    DATA, MONTHS, MONTHS_LOC, MONTHS_SHORT, WEEKDAYS, KINDS, OPS, JPK, SERIES, SERIES_LABEL, RATE_ORDER, COLUMNS,
    query, page, sum, monthStats, dayStats, fmt, fmtNum, fmtDate, docs, plural, esc, cap,
    icons, bindMenus, closeMenus, fitMenu, toast, demoBar,
    ORG: 'Onsaldo Preview Sp. z o.o.',
    TITLE: 'Rejestry i VAT',
    SUBTITLE: 'Sprzedaż i zakupy w wybranym okresie — podgląd danych demonstracyjnych.',
    WARNING: 'Kontekst VAT wymaga potwierdzenia. Poniżej wyłącznie dane demonstracyjne, nie ewidencja organizacji.',
    ERROR_TITLE: 'Nie udało się wczytać rejestru',
    ERROR_TEXT: 'Serwer nie odpowiedział w ciągu 30 sekund. Sprawdź połączenie i spróbuj ponownie — filtry zostaną zachowane.'
  };
})();
