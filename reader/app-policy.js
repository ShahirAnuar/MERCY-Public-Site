(function () {
  'use strict';
  if (window.GuideAppPolicy) return;
  const VERSION = '2026-11-08-unlocked-v1';
  const BACKEND = new URL(document.currentScript?.dataset?.guideApi || 'https://mercy-malaysia-orders-reviews.shahiranuar.chatgpt.site', location.href).origin;
  const POLICY_URL = BACKEND + '/api/reader/app-policy';
  const nativeFetch = window.fetch.bind(window);
  let approved = false;
  let checking;
  let message = 'Checking for the latest Guide update…';
  let updating = false;
  let resolveReady;
  let lastVerified = 0;
  const root = document.documentElement;
  root.classList.add('guide-update-blocked');
  const style = document.createElement('style');
  style.textContent = '.guide-update-blocked body>:not(#guide-update-overlay):not(script):not(style){visibility:hidden!important;pointer-events:none!important}.guide-update-blocked dialog[open]{display:none!important}#guide-update-overlay{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:1.2rem;background:#07182f;color:#fff8e8;font:1rem/1.6 system-ui,sans-serif}#guide-update-overlay[hidden]{display:none!important}#guide-update-overlay section{max-width:35rem;padding:1.8rem;border:1px solid #d5a63d;border-radius:18px;background:#102b4d}#guide-update-overlay h1{font:700 1.9rem Georgia,serif;margin:0 0 .7rem}#guide-update-overlay button{font:700 1rem system-ui;padding:.75rem 1rem;margin:.4rem .5rem .2rem 0;border:1px solid #d5a63d;border-radius:10px;background:#d5a63d;color:#07182f;cursor:pointer}#guide-update-overlay button+button{background:transparent;color:#fff8e8}';
  document.head.append(style);
  function mount() {
    if (!document.body) return;
    let overlay = document.getElementById('guide-update-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'guide-update-overlay';
      overlay.setAttribute('role', 'alertdialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'guide-update-title');
      overlay.innerHTML = '<section><h1 id="guide-update-title">The Guide update</h1><p id="guide-update-message" role="status" aria-live="polite"></p><p>Install the latest update before reading. Your registered account allowance and reading position are kept.</p><button id="guide-update-now" type="button">Update app</button><button id="guide-close-app" type="button">Close app</button></section>';
      document.body.append(overlay);
      document.getElementById('guide-update-now').addEventListener('click', update);
      document.getElementById('guide-close-app').addEventListener('click', close);
    }
    overlay.hidden = approved;
    document.getElementById('guide-update-message').textContent = message;
    document.getElementById('guide-update-now').disabled = updating;
  }
  function block(nextMessage) {
    approved = false;
    message = nextMessage || 'An update is required before you can continue reading.';
    root.classList.add('guide-update-blocked');
    window.MercyAudio?.stop();
    window.speechSynthesis?.cancel();
    for (const media of document.querySelectorAll('audio,video')) media.pause?.();
    for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close?.();
    window.dispatchEvent(new CustomEvent('guide-update-required', { detail: { version: VERSION } }));
    mount();
  }
  function isGuideRequest(input) {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
    return url.origin === BACKEND && (url.pathname === '/api/book' || url.pathname === '/api/lenses/config' || /^\/api\/(?:reader|guide\/international|access)\//.test(url.pathname) || /^\/initiative\/[^/]+\/(?:book|translation|threads|session)$/.test(url.pathname));
  }
  async function check() {
    if (checking) return checking;
    checking = (async () => {
      try {
        const response = await nativeFetch(POLICY_URL, { cache: 'no-store', headers: { 'x-guide-app-version': VERSION } });
        if (!response.ok) throw new Error('The update check could not connect. Reconnect to the internet, then choose Update app.');
        const policy = await response.json();
        if (policy.mandatory !== true || policy.minVersion !== VERSION || policy.deviceLocks !== false || policy.accountLimitsPreserved !== true) throw new Error('A newer Guide update is required. Choose Update app to continue.');
        approved = true;
        lastVerified = Date.now();
        root.classList.remove('guide-update-blocked');
        mount();
        resolveReady?.(policy);
        return policy;
      } catch (error) {
        block(error.message || 'Reconnect to the internet and update The Guide before reading.');
        throw error;
      } finally { checking = undefined; }
    })();
    return checking;
  }
  async function guideFetch(input, init) {
    if (!isGuideRequest(input)) return nativeFetch(input, init);
    await api.ready;
    if (!approved) await check();
    if (!approved) throw Object.assign(new Error('The Guide update is required.'), { code: 'update_required' });
    const headers = new Headers(init?.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined));
    headers.set('x-guide-app-version', VERSION);
    const response = await nativeFetch(input, { ...init, headers });
    if (response.status === 426) {
      block('A newer Guide update is required. Choose Update app to continue.');
      throw Object.assign(new Error('The Guide update is required.'), { code: 'update_required', status: 426 });
    }
    return response;
  }
  async function update() {
    if (updating) return;
    updating = true;
    block('Updating The Guide… Keep your internet connection on.');
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.filter(reg => /^\/(?:reader\/|guide\/international\/|initiative\/[^/]+\/)/.test(new URL(reg.scope).pathname)).map(async reg => {
          await reg.update();
          reg.waiting?.postMessage({ type: 'GUIDE_SKIP_WAITING' });
        }));
      }
      const next = new URL(location.href);
      next.searchParams.set('guide_version', VERSION);
      next.searchParams.set('guide_refresh', String(Date.now()));
      location.replace(next.href);
    } catch {
      updating = false;
      block('The update could not finish. Check your internet connection and choose Update app again.');
    }
  }
  function close() {
    block('Reading is closed. Update The Guide to open it again, or close this window from your device.');
    window.close();
  }
  const api = { version: VERSION, ready: null, check, update, close, fetch: guideFetch, block, isGuideRequest };
  window.GuideAppPolicy = api;
  window.fetch = guideFetch;
  api.ready = new Promise(resolve => { resolveReady = resolve; });
  check().catch(() => {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
  function refreshPolicy() {
    if (document.hidden || (approved && Date.now() - lastVerified < 60_000)) return;
    approved = false;
    message = 'Checking for the latest Guide update…';
    root.classList.add('guide-update-blocked');
    mount();
    check().catch(() => {});
  }
  window.addEventListener('focus', refreshPolicy);
  window.addEventListener('pageshow', refreshPolicy);
  window.addEventListener('online', refreshPolicy);
  window.addEventListener('offline', () => block('Reconnect to the internet to check the latest Guide update before reading.'));
  document.addEventListener('visibilitychange', refreshPolicy);
  setInterval(refreshPolicy, 60_000);
})();
