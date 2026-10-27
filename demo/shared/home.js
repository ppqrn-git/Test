/* Content of the "Obszary księgowe" home page, shared by all home variants. Requires core.js (VAT). */
(function () {
  'use strict';
  const V = window.VAT;

  const STATUS = {
    confirm: { label: 'Wymaga potwierdzenia', cls: 'confirm' },
    config: { label: 'Wymaga konfiguracji', cls: 'config' },
    na: { label: 'Niedostępne w wersji demo', cls: 'na' },
    soon: { label: 'Wkrótce', cls: 'soon' }
  };

  // The four "Obszary" (sections of the app). Only Rejestry i VAT is a real page.
  const AREAS = [
    { id: 'vat', name: 'Rejestry i VAT', icon: 'receipt-text', href: 'rejestr.html', live: true,
      desc: 'Sprzedaż i zakupy w wybranym okresie, sumy według stawek VAT, statusy KSeF.' },
    { id: 'ksiegowania', name: 'Księgowania', icon: 'landmark', href: 'wkrotce.html?o=ksiegowania',
      desc: 'KPiR, ewidencja przychodów i pełne księgi.' },
    { id: 'majatek', name: 'Majątek', icon: 'archive', href: 'wkrotce.html?o=majatek',
      desc: 'Środki trwałe i wyposażenie.' },
    { id: 'kontrole', name: 'Kontrole', icon: 'list-checks', href: 'wkrotce.html?o=kontrole',
      desc: 'Weryfikacja kompletności i spójności danych.' }
  ];

  // "Dostępność obszarów": readiness of six ledgers. c = conditions: y met, n to do, x not applicable.
  const AVAIL = [
    { id: 'vat', area: 'vat', name: 'Rejestr VAT', icon: 'receipt-text', status: 'confirm', href: 'rejestr.html', cta: 'Otwórz rejestr VAT',
      next: 'Potwierdź kontekst VAT', c: [['y', 'Organizacja jest aktywna'], ['n', 'Kontekst VAT nie został potwierdzony'], ['y', 'Dostępne dane demonstracyjne za 2026 rok']] },
    { id: 'kpir', area: 'ksiegowania', name: 'KPiR', icon: 'book-open', status: 'config', href: 'wkrotce.html?o=kpir', cta: 'Otwórz KPiR',
      next: 'Wybierz formę opodatkowania', c: [['n', 'Nie wybrano formy opodatkowania'], ['x', 'Brak zapisów w okresie']] },
    { id: 'przychody', area: 'ksiegowania', name: 'Ewidencja przychodów', icon: 'banknote', status: 'config', href: 'wkrotce.html?o=przychody', cta: 'Otwórz ewidencję',
      next: 'Wybierz stawkę ryczałtu', c: [['n', 'Nie wybrano stawki ryczałtu'], ['x', 'Brak zapisów w okresie']] },
    { id: 'ksiegi', area: 'ksiegowania', name: 'Pełne księgi', icon: 'file-text', status: 'na', href: 'wkrotce.html?o=ksiegi', cta: 'Zobacz szczegóły',
      next: 'Niedostępne w wersji demo', c: [['x', 'Plan kont nie został przygotowany'], ['x', 'Obszar nie jest częścią wersji demonstracyjnej']] },
    { id: 'majatek', area: 'majatek', name: 'Majątek', icon: 'archive', status: 'config', href: 'wkrotce.html?o=majatek', cta: 'Otwórz majątek',
      next: 'Dodaj ewidencję środków trwałych', c: [['n', 'Brak ewidencji środków trwałych'], ['y', 'Okres księgowy jest określony']] },
    { id: 'kontrole', area: 'kontrole', name: 'Kontrole', icon: 'list-checks', status: 'config', href: 'wkrotce.html?o=kontrole', cta: 'Otwórz kontrole',
      next: 'Potwierdź kontekst VAT', c: [['n', 'Kontrole uruchomią się po potwierdzeniu kontekstu VAT']] }
  ];

  const PERIOD = {
    title: 'Okres księgowy · 2026', year: 2026, status: 'config',
    text: 'Orientacyjny rok rozliczeniowy aktywnej organizacji. Wymaga potwierdzenia przed uruchomieniem operacji księgowych.'
  };
  const NOTE = 'To jest mapa zakresu, a nie uruchomienie księgowania. Dane pozostają demonstracyjne.';
  const AVAIL_TEXT = 'Status pokazuje gotowość warunków, ale nie uruchamia księgowania ani operacji zewnętrznych.';
  const ORG = 'Onsaldo Preview Sp. z o.o.';

  const sales = V.query({ kind: 'sales', year: 2026, month: 9 }).rows;
  const purchases = V.query({ kind: 'purchases', year: 2026, month: 9 }).rows;
  const s = V.sum(sales), p = V.sum(purchases);
  const STATS = {
    month: 'październik 2026', monthShort: 'paź',
    salesCount: s.count, salesVat: s.vat, salesGross: s.gross,
    purchCount: p.count, purchVat: p.vat,
    ksefMissing: sales.concat(purchases).filter(d => !d.ksef).length,
    monthly: V.monthStats('sales', 2026).map(m => ({ count: m.count, gross: m.gross, vat: m.vat }))
  };
  const met = AVAIL.reduce((a, x) => a + x.c.filter(c => c[0] === 'y').length, 0);
  const total = AVAIL.reduce((a, x) => a + x.c.length, 0);

  const LI = { y: 'circle-check', n: 'circle-alert', x: 'circle-minus' };
  const chip = (st, extra) => `<span class="chip ${STATUS[st].cls} ${extra || ''}"><i></i>${STATUS[st].label}</span>`;
  const conds = item => `<ul class="conds">${item.c.map(([k, t]) => `<li class="${k}"><i data-lucide="${LI[k]}"></i>${t}</li>`).join('')}</ul>`;
  const area = id => AREAS.find(a => a.id === id);
  const availOf = id => AVAIL.filter(a => a.area === id);

  window.HOME = { STATUS, AREAS, AVAIL, PERIOD, NOTE, AVAIL_TEXT, ORG, STATS, READY: { met, total }, chip, conds, area, availOf, LI };
})();
