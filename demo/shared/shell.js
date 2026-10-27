/* App shell for the demo: top bar, theme, page transitions, link to the demo launcher. Requires core.js (VAT) and lucide. */
(function () {
  'use strict';

  /* ---------- theme (runs in <head>, before first paint) ---------- */
  const QS_THEME = new URLSearchParams(location.search).get('theme');
  let stored = null;
  try { stored = localStorage.getItem('vat-theme'); } catch (e) {}
  const initial = QS_THEME || stored || 'light';
  if (initial === 'dark') document.documentElement.dataset.theme = 'dark';

  function applyTheme(t, animate) {
    const root = document.documentElement;
    if (animate) root.classList.add('theme-anim');
    if (t === 'dark') root.dataset.theme = 'dark'; else delete root.dataset.theme;
    try { localStorage.setItem('vat-theme', t); } catch (e) {}
    paintThemeBtn();
    if (animate) setTimeout(() => root.classList.remove('theme-anim'), 450);
    notifyParent();
  }
  const currentTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

  // Keep the active theme across internal links (needed when storage is unavailable, e.g. inside the launcher on file://).
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || /^(https?:|mailto:|#)/.test(href)) return;
    const [path, rest = ''] = href.split('?');
    const [query, hash] = rest.split('#');
    const p = new URLSearchParams(query || '');
    p.set('theme', currentTheme());
    a.setAttribute('href', path + '?' + p.toString() + (hash ? '#' + hash : ''));
  }, true);

  // Talk to the demo launcher (index.html) when embedded in it.
  const EMBEDDED = window.parent !== window;
  function notifyParent() {
    if (!EMBEDDED) return;
    const q = new URLSearchParams(location.search); q.delete('theme');
    const page = (location.pathname.split('/').pop() || 'glowna.html') + (q.toString() ? '?' + q.toString() : '');
    try { window.parent.postMessage({ type: 'vat-page', page, theme: currentTheme(), title: document.title }, '*'); } catch (e) {}
  }
  window.addEventListener('message', e => {
    if (!e.data) return;
    if (e.data.type === 'vat-theme') applyTheme(e.data.theme, true);
    // phone frame in the launcher: phones use overlay scrollbars, so hide the desktop one
    if (e.data.type === 'vat-frame') document.documentElement.classList.toggle('phone-frame', !!e.data.phone);
  });

  const NOTES = [
    ['calendar-clock', 'Okres księgowy 2026 wymaga potwierdzenia', 'dziś, 09:12'],
    ['shield-alert', 'Kontekst VAT nie został potwierdzony', 'dziś, 09:12'],
    ['file-plus-2', 'Dodano 14 dokumentów demonstracyjnych za październik', 'wczoraj'],
    ['building-2', 'Masz dostęp do organizacji Onsaldo Preview Sp. z o.o.', '24 paź']
  ];

  const css = `
  /* cross-document page transition (Chromium over http); other cases get the .enter fallback */
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
  i[data-lucide]{display:inline-block;width:18px;height:18px;flex:none}
  html.phone-frame,html.phone-frame *{scrollbar-width:none}
  html.phone-frame ::-webkit-scrollbar{display:none}

  .topbar{view-transition-name:topbar;display:flex;align-items:center;gap:14px;max-width:1360px;margin:0 auto;padding:16px 20px;border-bottom:1px solid rgba(23,27,36,.07);min-height:73px}
  .topbar .hello{margin:0;margin-right:auto;font-size:22px;font-weight:700;letter-spacing:-.015em;line-height:1.2;color:var(--ink);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tb-r{display:flex;align-items:center;gap:10px;position:relative;flex:none}
  .tb-ic{position:relative;width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--panel);display:grid;place-items:center;color:var(--ink);cursor:pointer;flex:none}
  .tb-ic:hover{background:var(--hover)}
  .tb-ic.flat{border-color:transparent;background:none}
  .tb-ic.flat:hover{background:rgba(255,255,255,.6)}
  .tb-ic .bdg{position:absolute;top:3px;right:3px;min-width:17px;height:17px;border-radius:999px;background:#C0262D;color:#fff;font-size:10.5px;font-weight:700;display:grid;place-items:center;padding:0 4px;border:2px solid #EEF1F5}
  .tb-sep{width:1px;height:28px;background:var(--line);margin:0 4px}
  .tb-user{display:flex;align-items:center;gap:10px;border:0;background:none;padding:4px 6px 4px 10px;border-radius:999px;cursor:pointer;text-align:right;color:var(--ink)}
  .tb-user:hover{background:rgba(255,255,255,.6)}
  .tb-user b{display:block;font-size:14px;font-weight:600;line-height:1.25}
  .tb-user small{display:block;font-size:12.5px;color:var(--muted)}
  .tb-av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#15274D,#1F3B76);color:#fff;display:grid;place-items:center;font-weight:600;font-size:14px;flex:none}
  .tb-menu{position:absolute;right:0;top:calc(100% + 8px);z-index:60;background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:0 20px 50px rgba(23,27,36,.18);padding:6px;min-width:240px;color:var(--ink)}
  .tb-menu a,.tb-menu button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;padding:9px 10px;border-radius:9px;text-align:left;color:var(--ink);text-decoration:none;font:inherit;cursor:pointer}
  .tb-menu a:hover,.tb-menu button:hover{background:var(--hover)}
  .tb-menu hr{border:0;border-top:1px solid var(--line);margin:6px 0}
  .tb-notes{width:min(360px,calc(100vw - 24px));padding:0}
  .tb-notes .nh{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--line);font-weight:600}
  .tb-notes .nh button{width:auto;padding:4px 8px;font-size:12.5px;color:#1F3B76;font-weight:600;white-space:nowrap}
  .tb-notes ul{list-style:none;margin:0;padding:6px;max-height:min(60vh,420px);overflow:auto}
  .tb-notes li{display:flex;gap:10px;padding:10px 8px;border-radius:9px}
  .tb-notes li .ni{width:32px;height:32px;border-radius:9px;background:#E8EEF9;color:#1F3B76;display:grid;place-items:center;flex:none}
  .tb-notes li.read .ni{background:var(--hover);color:var(--muted)}
  .tb-notes li p{margin:0;font-size:13.5px;line-height:1.35}
  .tb-notes li small{color:var(--faint);font-size:12px}
  .tb-notes li:not(.read) p{font-weight:600}
  .crumbs{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);flex-wrap:wrap}
  .crumbs a{color:var(--muted);text-decoration:none;border-radius:6px;padding:2px 4px;margin:-2px -4px;display:inline-flex;align-items:center;gap:4px}
  .crumbs a:hover{color:var(--ink);background:rgba(255,255,255,.7)}
  .crumbs svg,.crumbs i[data-lucide]{width:14px;height:14px}
  @media (max-width:640px){
    .topbar{padding:12px;gap:8px;min-height:61px}
    .topbar .hello{font-size:17px}
    .tb-r{gap:6px}
    .tb-user .tx,.tb-sep,.tb-user>svg,.tb-user>i{display:none}
    .tb-user{padding:0}
    .tb-ic,.tb-av{width:36px;height:36px}
  }
  @media (max-width:340px){ .topbar .hello{font-size:15px} }
  /* dark theme for the shared top bar */
  html[data-theme=dark] .topbar{border-bottom-color:rgba(255,255,255,.07)}
  html[data-theme=dark] .tb-ic.flat:hover,html[data-theme=dark] .tb-user:hover,html[data-theme=dark] .crumbs a:hover{background:var(--hover)}
  html[data-theme=dark] .tb-ic .bdg{border-color:#0F141C;background:#E5484D}
  html[data-theme=dark] .tb-av{background:linear-gradient(135deg,#24396B,#3358A8);color:#EEF3FF}
  html[data-theme=dark] .tb-menu{box-shadow:0 20px 50px rgba(0,0,0,.55)}
  html[data-theme=dark] .tb-notes li .ni{background:rgba(110,150,255,.14);color:#9DB8FF}
  html[data-theme=dark] .tb-notes .nh button{color:#9DB8FF}`;

  let paintThemeBtn = () => {};

  function mount() {
    const st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    const host = document.getElementById('topbar');
    if (!host) { notifyParent(); return; }
    host.className = 'topbar';
    host.innerHTML = `
      <p class="hello">Witaj, Preview Reviewer!</p>
      <div class="tb-r">
        <button class="tb-ic" data-shell-theme id="tbTheme"></button>
        <button class="tb-ic flat" data-menu-toggle="tbNotes" aria-expanded="false" aria-label="Powiadomienia"><i data-lucide="bell"></i><span class="bdg" id="tbBdg">${NOTES.length}</span></button>
        <div class="tb-menu tb-notes js-menu" id="tbNotes" hidden>
          <div class="nh">Powiadomienia<button data-shell-read>Oznacz jako przeczytane</button></div>
          <ul>${NOTES.map(n => `<li><span class="ni"><i data-lucide="${n[0]}"></i></span><div><p>${n[1]}</p><small>${n[2]}</small></div></li>`).join('')}</ul>
        </div>
        <span class="tb-sep"></span>
        <button class="tb-user" data-menu-toggle="tbUser" aria-expanded="false" aria-label="Konto użytkownika"><span class="tx"><b>Preview Reviewer</b><small>Konto użytkownika</small></span><span class="tb-av">PR</span><i data-lucide="chevron-down"></i></button>
        <div class="tb-menu js-menu" id="tbUser" hidden>
          <a href="wkrotce.html?o=profil"><i data-lucide="user-round"></i>Mój profil</a>
          <a href="wkrotce.html?o=ustawienia"><i data-lucide="settings"></i>Ustawienia konta</a>
          <hr>
          <button data-shell-act="Wylogowanie jest wyłączone w wersji demonstracyjnej"><i data-lucide="log-out"></i>Wyloguj się</button>
        </div>
      </div>`;
    paintThemeBtn = () => {
      const dark = currentTheme() === 'dark';
      const b = document.getElementById('tbTheme');
      if (!b) return;
      b.title = dark ? 'Jasny motyw' : 'Ciemny motyw';
      b.setAttribute('aria-label', b.title);
      b.innerHTML = `<i data-lucide="${dark ? 'moon' : 'sun'}"></i>`;
      if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
    };
    paintThemeBtn();
    host.addEventListener('click', e => {
      if (e.target.closest('[data-shell-theme]')) { applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true); return; }
      const a = e.target.closest('[data-shell-act]');
      if (a) { VAT.closeMenus(); VAT.toast(a.dataset.shellAct); }
      if (e.target.closest('[data-shell-read]')) {
        document.getElementById('tbBdg').hidden = true;
        host.querySelectorAll('.tb-notes li').forEach(li => li.classList.add('read'));
      }
    });
    notifyParent();
  }

  // Fallback entrance animation when no cross-document view transition ran.
  if ('onpagereveal' in window) {
    window.addEventListener('pagereveal', e => { if (!e.viewTransition) document.documentElement.classList.add('enter'); });
  } else {
    document.documentElement.classList.add('enter');
  }

  window.Shell = { mount, applyTheme };
})();
