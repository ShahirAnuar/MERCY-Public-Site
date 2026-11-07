(() => {
  'use strict';
  // Keep attribution through the public campaign, book, purchase and affiliate guides.
  // No storage, external requests, checkout changes or dashboard/auth link changes.
  const incoming = new URLSearchParams(location.search);
  if (!incoming.size) return;
  const paths = new Set([
    '/', '/index.html',
    '/buy/', '/buy/index.html',
    '/mercy/', '/mercy/index.html',
    '/learn/', '/learn/index.html',
    '/mercy/canada/', '/mercy/canada/index.html',
    '/guide/international/', '/guide/international/index.html',
    '/malaysia/', '/malaysia/index.html',
    '/islamic-childrens-books/', '/islamic-childrens-books/index.html',
    '/affiliate-program/', '/affiliate-program/index.html',
    '/affiliate-program/promote/', '/affiliate-program/promote/index.html',
    '/affiliate-program/amazon-clickbank/', '/affiliate-program/amazon-clickbank/index.html'
  ]);
  function preserve(link) {
    const raw = link.getAttribute('href');
    if (!raw || raw.startsWith('#')) return;
    let target;
    try { target = new URL(raw, location.href); } catch { return; }
    if (target.origin !== location.origin || !paths.has(target.pathname)) return;
    const explicit = new Set(target.searchParams.keys());
    const sourceAffiliate = incoming.get('affiliate');
    const targetAffiliate = target.searchParams.get('affiliate');
    const differentAffiliate = targetAffiliate && sourceAffiliate &&
      targetAffiliate.trim().toUpperCase() !== sourceAffiliate.trim().toUpperCase();
    for (const [key, value] of incoming) {
      if (explicit.has(key)) continue;
      // An explicitly attributed destination keeps its own referral/coupon combination.
      if (differentAffiliate && ['affiliate', 'coupon', 'ref'].includes(key)) continue;
      target.searchParams.append(key, value);
    }
    link.href = target.href;
  }
  const init = () => document.querySelectorAll('a[href]').forEach(preserve);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (link) preserve(link);
  }, true);
})();

