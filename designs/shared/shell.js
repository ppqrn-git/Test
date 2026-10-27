/* App shell shared by the prototype pages: top bar, page transitions. Requires core.js (VAT) and lucide. */
(function () {
  'use strict';

  // Theme: pages opt in with <meta name="dark-ready">. ?theme=dark|light overrides (used by the mobile preview).
  const DARK_READY = !!document.querySelector('meta[name="dark-ready"]');
  const QS_THEME = new URLSearchParams(location.search).get('theme');
  let theme = 'light';
  try { theme = QS_THEME || localStorage.getItem('vat-theme') || 'light'; } catch (e) { theme = QS_THEME || 'light'; }
  if (DARK_READY && theme === 'dark') document.documentElement.dataset.theme = 'dark';
  // Keep an explicit ?theme= across internal links (mobile preview frames).
  if (QS_THEME) document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target) return;
    const u = new URL(a.getAttribute('href'), location.href);
    if (u.origin !== location.origin) return;
    u.searchParams.set('theme', document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    a.href = u.pathname.split('/').pop() + u.search + u.hash;
  }, true);

  const NOTES = [
    ['calendar-clock', 'Okres księgowy 2026 wymaga potwierdzenia', 'dziś, 09:12'],
    ['shield-alert', 'Kontekst VAT nie został potwierdzony', 'dziś, 09:12'],
    ['file-plus-2', 'Dodano 14 dokumentów demonstracyjnych za październik', 'wczoraj'],
    ['building-2', 'Masz dostęp do organizacji Onsaldo Preview Sp. z o.o.', '24 paź']
  ];

  const css = `
  /* cross-document page transition (Chromium); other browsers get .enter fallback */
  @view-transition{navigation:auto}
  ::view-transition-old(root){animation:shell-out .16s ease both}
  ::view-transition-new(root){animation:shell-in .3s cubic-bezier(.2,.7,.2,1) both}
  ::view-transition-group(vat-title){animation-duration:.32s;animation-timing-function:cubic-bezier(.2,.7,.2,1)}
  @keyframes shell-out{to{opacity:0}}
  @keyframes shell-in{from{opacity:0;transform:translateY(10px)}}
  html.enter .page-enter{animation:shell-in .3s cubic-bezier(.2,.7,.2,1) backwards}
  @media (prefers-reduced-motion:reduce){
    ::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}
    html.enter .page-enter{animation:none}
  }

  .topbar{view-transition-name:topbar;display:flex;align-items:center;gap:14px;max-width:1360px;margin:0 auto;padding:16px 20px;border-bottom:1px solid rgba(23,27,36,.07)}
  .topbar .hello{margin:0;margin-right:auto;font-size:22px;font-weight:700;letter-spacing:-.015em;line-height:1.2;color:var(--ink)}
  .tb-r{display:flex;align-items:center;gap:10px;position:relative}
  .tb-ic{position:relative;width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--panel);display:grid;place-items:center;color:var(--ink);cursor:pointer}
  .tb-ic:hover{background:var(--hover)}
  .tb-ic.flat{border-color:transparent;background:none}
  .tb-ic.flat:hover{background:rgba(255,255,255,.6)}
  .tb-ic .bdg{position:absolute;top:3px;right:3px;min-width:17px;height:17px;border-radius:999px;background:#C0262D;color:#fff;font-size:10.5px;font-weight:700;display:grid;place-items:center;padding:0 4px;border:2px solid #EEF1F5}
  .tb-sep{width:1px;height:28px;background:var(--line);margin:0 4px}
  .tb-user{display:flex;align-items:center;gap:10px;border:0;background:none;padding:4px 6px 4px 10px;border-radius:999px;cursor:pointer;text-align:right;color:var(--ink)}
  .tb-user:hover{background:rgba(255,255,255,.6)}
  .tb-user b{display:block;font-size:14px;font-weight:600;line-height:1.25}
  .tb-user small{display:block;font-size:12.5px;color:var(--muted)}
  .tb-av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#15274D,#1F3B76);color:#fff;display:grid;place-items:center;font-weight:600;font-size:14px}
  .tb-menu{position:absolute;right:0;top:calc(100% + 8px);z-index:60;background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:0 20px 50px rgba(23,27,36,.18);padding:6px;min-width:240px;color:var(--ink)}
  .tb-menu a,.tb-menu button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;padding:9px 10px;border-radius:9px;text-align:left;color:var(--ink);text-decoration:none;font:inherit;cursor:pointer}
  .tb-menu a:hover,.tb-menu button:hover{background:var(--hover)}
  .tb-menu hr{border:0;border-top:1px solid var(--line);margin:6px 0}
  .tb-notes{width:min(360px,calc(100vw - 24px));padding:0}
  .tb-notes .nh{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid var(--line);font-weight:600}
  .tb-notes .nh button{width:auto;padding:4px 8px;font-size:12.5px;color:#1F3B76;font-weight:600}
  .tb-notes ul{list-style:none;margin:0;padding:6px}
  .tb-notes li{display:flex;gap:10px;padding:10px 8px;border-radius:9px}
  .tb-notes li .ni{width:32px;height:32px;border-radius:9px;background:#E8EEF9;color:#1F3B76;display:grid;place-items:center;flex:none}
  .tb-notes li.read .ni{background:var(--hover);color:var(--muted)}
  .tb-notes li p{margin:0;font-size:13.5px;line-height:1.35}
  .tb-notes li small{color:var(--faint);font-size:12px}
  .tb-notes li:not(.read) p{font-weight:600}
  .crumbs{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);flex-wrap:wrap}
  .crumbs a{color:var(--muted);text-decoration:none;border-radius:6px;padding:2px 4px;margin:-2px -4px;display:inline-flex;align-items:center;gap:4px}
  .crumbs a:hover{color:var(--ink);background:rgba(255,255,255,.7)}
  .crumbs svg{width:14px;height:14px}
  @media (max-width:640px){
    .topbar{padding:12px 12px;gap:8px}
    .topbar .hello{font-size:17px}
    .tb-user .tx,.tb-sep,.tb-user>svg{display:none}
    .tb-user{padding:0}
    .tb-ic,.tb-av{width:36px;height:36px}
  }
  /* dark theme for the shared top bar */
  html[data-theme=dark] .topbar{border-bottom-color:rgba(255,255,255,.07)}
  html[data-theme=dark] .tb-ic.flat:hover,html[data-theme=dark] .tb-user:hover,html[data-theme=dark] .crumbs a:hover{background:var(--hover)}
  html[data-theme=dark] .tb-ic .bdg{border-color:var(--bg);background:#E5484D}
  html[data-theme=dark] .tb-av{background:linear-gradient(135deg,#C9D6F5,#E3EAFB);color:#15274D}
  html[data-theme=dark] .tb-menu{box-shadow:0 20px 50px rgba(0,0,0,.55)}
  html[data-theme=dark] .tb-notes li .ni{background:rgba(157,184,255,.13);color:#9DB8FF}
  html[data-theme=dark] .tb-notes .nh button{color:#9DB8FF}`;

  const VARIANTS = [
    ['home-1-sciezka.html', 'Ścieżka'], ['home-2-panel.html', 'Panel'], ['home-3-szukaj.html', 'Wyszukiwarka'],
    ['home-4-mapa.html', 'Mapa'], ['home-5-os.html', 'Oś roku'], ['home-6-tablica.html', 'Tablica'], ['home-7-bento.html', 'Bento']
  ];

  function mount(opts) {
    opts = opts || {};
    const st = document.createElement('style');
    st.textContent = css + `
  .hv{position:fixed;left:12px;bottom:12px;z-index:9999;display:flex;align-items:center;gap:2px;padding:4px;border-radius:10px;background:rgba(20,22,28,.88);backdrop-filter:blur(8px);color:#cfd3dc;font:500 12px/1 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.25);max-width:calc(100vw - 24px);overflow-x:auto}
  .hv a{color:#cfd3dc;text-decoration:none;padding:6px 8px;border-radius:7px;white-space:nowrap}
  .hv a:hover{background:rgba(255,255,255,.08)}
  .hv a[aria-current=page]{background:#fff;color:#111}
  .hv .sep{width:1px;height:16px;background:rgba(255,255,255,.18);margin:0 3px;flex:none}
  .hv .lbl{padding:0 4px 0 6px;opacity:.6;white-space:nowrap}
  @media (max-width:640px){.hv .nm{display:none}.hv .lbl{display:none}}`;
    document.head.appendChild(st);

    // Remember which home variant the user came from, so "back" links return there.
    const here = location.pathname.split('/').pop();
    let home = 'home-1-sciezka.html';
    try {
      if (opts.home) sessionStorage.setItem('vat-home', here);
      home = sessionStorage.getItem('vat-home') || home;
    } catch (e) {}
    document.querySelectorAll('a[data-home]').forEach(a => { a.href = home; });

    if (opts.home) {
      const bar = document.createElement('nav');
      bar.className = 'hv';
      bar.setAttribute('aria-label', 'Warianty strony głównej');
      bar.innerHTML = `<a href="index.html" title="Wszystkie koncepty">◂ Koncepty</a><span class="sep"></span><span class="lbl">Główna:</span>` +
        VARIANTS.map(([f, n], i) => `<a href="${f}" ${f === here ? 'aria-current="page"' : ''} title="${i + 1} · ${n}">${i + 1}<span class="nm"> ${n}</span></a>`).join('') +
        `<span class="sep"></span><a href="mobile.html" title="Podgląd na telefonach">Mobilny</a>`;
      document.body.appendChild(bar);
    }
    const host = document.getElementById('topbar');
    if (!host) return;
    let unread = NOTES.length;
    host.className = 'topbar';
    host.innerHTML = `
      <p class="hello">Witaj, Preview Reviewer!</p>
      <div class="tb-r">
        <button class="tb-ic" data-shell-theme id="tbTheme"></button>
        <button class="tb-ic flat" data-menu-toggle="tbNotes" aria-expanded="false" aria-label="Powiadomienia"><i data-lucide="bell"></i><span class="bdg" id="tbBdg">${unread}</span></button>
        <div class="tb-menu tb-notes js-menu" id="tbNotes" hidden>
          <div class="nh">Powiadomienia<button data-shell-read>Oznacz jako przeczytane</button></div>
          <ul>${NOTES.map(n => `<li><span class="ni"><i data-lucide="${n[0]}"></i></span><div><p>${n[1]}</p><small>${n[2]}</small></div></li>`).join('')}</ul>
        </div>
        <span class="tb-sep"></span>
        <button class="tb-user" data-menu-toggle="tbUser" aria-expanded="false"><span class="tx"><b>Preview Reviewer</b><small>Konto użytkownika</small></span><span class="tb-av">PR</span><i data-lucide="chevron-down"></i></button>
        <div class="tb-menu js-menu" id="tbUser" hidden>
          <a href="wkrotce.html?o=profil"><i data-lucide="user-round"></i>Mój profil</a>
          <a href="wkrotce.html?o=ustawienia"><i data-lucide="settings"></i>Ustawienia konta</a>
          <hr>
          <button data-shell-act="Wylogowanie jest wyłączone w wersji demonstracyjnej"><i data-lucide="log-out"></i>Wyloguj się</button>
        </div>
      </div>`;
    const paintThemeBtn = () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      const b = document.getElementById('tbTheme');
      b.title = dark ? 'Jasny motyw' : 'Ciemny motyw';
      b.setAttribute('aria-label', b.title);
      b.innerHTML = `<i data-lucide="${dark ? 'moon' : 'sun'}"></i>`;
      if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
    };
    paintThemeBtn();
    host.addEventListener('click', e => {
      if (e.target.closest('[data-shell-theme]')) {
        if (!DARK_READY) { VAT.toast('Ciemny motyw jest dostępny w wariancie „Panel” i w rejestrze VAT'); return; }
        const root = document.documentElement;
        const dark = root.dataset.theme !== 'dark';
        root.classList.add('theme-anim');
        if (dark) root.dataset.theme = 'dark'; else delete root.dataset.theme;
        try { if (!QS_THEME) localStorage.setItem('vat-theme', dark ? 'dark' : 'light'); } catch (err) {}
        paintThemeBtn();
        setTimeout(() => root.classList.remove('theme-anim'), 450);
        return;
      }
      const a = e.target.closest('[data-shell-act]');
      if (a) { VAT.closeMenus(); VAT.toast(a.dataset.shellAct); }
      if (e.target.closest('[data-shell-read]')) {
        unread = 0;
        document.getElementById('tbBdg').hidden = true;
        host.querySelectorAll('.tb-notes li').forEach(li => li.classList.add('read'));
      }
    });
  }

  // Fallback entrance animation when no cross-document view transition ran.
  if ('onpagereveal' in window) {
    window.addEventListener('pagereveal', e => { if (!e.viewTransition) document.documentElement.classList.add('enter'); });
  } else {
    document.documentElement.classList.add('enter');
  }

  window.Shell = { mount };
})();
