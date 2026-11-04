import { initialiseInternationalCountry } from './locale.mjs';
import { copy } from './copy.mjs?v=20261104-purchase';
import { mountCompanionBook } from './book.mjs?v=20261104-purchase';

const backend = 'https://mercy-malaysia-orders-reviews.shahiranuar.chatgpt.site';
const sessionPath = '/api/guide/international/session';
const $ = id => document.getElementById(id);
const sessionId = crypto.randomUUID().replaceAll('-', '');
const preferences = {
  get(key) { try { return localStorage.getItem('mercyInternational.' + key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem('mercyInternational.' + key, value); } catch {} }
};

const link = new URL(location.href);
const linkedThread = Number(link.searchParams.get('thread') || link.hash.match(/^#thread-(\d+)$/)?.[1]);
const validThread = number => Number.isInteger(number) && number >= 1 && number <= 86;
let currentThread = validThread(linkedThread) ? linkedThread : Number(preferences.get('thread')) || 1;
if (validThread(linkedThread)) preferences.set('thread', linkedThread);

let language = 'en';
let locale;
let credential;
let heartbeat;
let lease = false;
let generation = 0;
let releasePending;
let busy = false;
let statusKey = '';
let installKey = '';
let installPrompt;
let googleReady = false;
let googleLoading;
const book = mountCompanionBook({
  copy,
  getLanguage: () => language,
  onPosition(position) {
    currentThread = position;
    preferences.set('thread', position);
  }
});

function status(key = '', canRetry = false) {
  statusKey = key;
  $('reading-status').textContent = copy[language][key] || '';
  $('retry').hidden = !canRetry;
}

function showInstallHelp(key) {
  installKey = key;
  for (const id of ['install-help', 'book-install-help']) {
    $(id).hidden = !key;
    $(id).textContent = copy[language][key] || '';
  }
}

function label(element, key) {
  element.textContent = copy[language][key];
}

function setLanguage(next) {
  const changed = next !== language;
  language = next;
  $('international-language').value = next;
  $('book-language').value = next;
  preferences.set('language', next);
  document.documentElement.lang = next;
  document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  document.title = copy[next].title + ' | MERCY';
  for (const element of document.querySelectorAll('[data-copy]')) label(element, element.dataset.copy);
  for (const element of document.querySelectorAll('[data-label]')) element.setAttribute('aria-label', copy[next][element.dataset.label]);
  $('reading-status').textContent = copy[next][statusKey] || '';
  showInstallHelp(installKey);
  if (changed && lease) {
    hideReader();
    openReading();
  }
}

initialiseInternationalCountry($('international-country'), {
  onChange(model) {
    const preferred = locale ? language : preferences.get('language');
    locale = model;
    for (const id of ['international-language', 'book-language']) $(id).replaceChildren(...model.languages.map(code => {
      const option = new Option(model.labels[code], code);
      option.lang = code;
      return option;
    }));
    setLanguage(model.languages.includes(preferred) ? preferred : 'en');
  }
});
for (const id of ['international-language', 'book-language']) $(id).addEventListener('change', event => setLanguage(event.target.value));

function showReader(entries) {
  if (!Array.isArray(entries) || entries.length !== 86) throw new Error('Guide content unavailable');
  book.show(entries, validThread(currentThread) ? currentThread : 1);
}

function hideReader() {
  book.hide();
}

async function request(path, options = {}, token = credential) {
  const response = await fetch(backend + path, {
    ...options,
    cache: 'no-store',
    headers: { ...options.headers, ...(token ? { authorization: 'Bearer ' + token } : {}) }
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw Object.assign(new Error('Guide request failed'), { status: response.status, code: data.code });
  }
  return response.json();
}

function session(operation, token = credential) {
  return request(sessionPath, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, operation }),
    keepalive: operation === 'release'
  }, token);
}

function stopReading({ release = false, keepSignIn = true } = {}) {
  clearInterval(heartbeat);
  heartbeat = undefined;
  const token = credential;
  if (release && lease && token) releasePending = session('release', token).catch(() => {});
  lease = false;
  generation++;
  if (!keepSignIn) credential = undefined;
  hideReader();
  $('finish').hidden = true;
  $('install').hidden = true;
  $('purchase-claim').hidden = true;
  $('google-sign-in').hidden = Boolean(credential);
}

function readingError(error) {
  if (error.code === 'purchase_required') {
    stopReading();
    $('purchase-claim').hidden = false;
    status('purchaseRequired');
    return;
  }
  const expired = error.status === 401 || error.status === 403;
  stopReading({ release: !expired, keepSignIn: !expired });
  const reason = expired ? 'expired'
    : error.status === 429 ? 'full'
    : error.status === 409 ? 'sessionExpired'
    : navigator.onLine ? 'unavailable' : 'offline';
  status(reason, !expired);
}

async function renew() {
  if (!lease) return;
  const activeGeneration = generation;
  const token = credential;
  try {
    await session('heartbeat', token);
  } catch (error) {
    if (lease && activeGeneration === generation) readingError(error);
  }
}

async function openReading() {
  if (!credential || busy) return;
  busy = true;
  $('google-sign-in').hidden = true;
  $('purchase-claim').hidden = true;
  $('retry').hidden = true;
  status('loading');
  const token = credential;
  const activeGeneration = generation;
  try {
    if (!lease) {
      await releasePending;
      if (activeGeneration !== generation) return;
      await session('acquire', token);
      if (activeGeneration !== generation) {
        session('release', token).catch(() => {});
        return;
      }
      lease = true;
      heartbeat = setInterval(renew, 30_000);
      $('finish').hidden = false;
      $('install').hidden = false;
    }
    let entries;
    let requested;
    do {
      requested = language;
      entries = await request('/api/guide/international/threads?lang=' + requested, {
        headers: { 'x-mercy-family': sessionId }
      }, token);
      if (!lease || activeGeneration !== generation) return;
    } while (language !== requested);
    showReader(entries.threads);
    status();
  } catch (error) {
    if (activeGeneration === generation) readingError(error);
  } finally {
    busy = false;
  }
}

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => { script.remove(); reject(new Error('Google sign-in unavailable')); };
    document.head.append(script);
  });
}

function configureGoogle() {
  if (googleLoading || googleReady) return;
  status('connecting');
  googleLoading = Promise.all([loadGoogleScript(), request('/api/lenses/config')])
    .then(([, config]) => {
      if (!config.clientId || !window.google?.accounts?.id) throw new Error('Google sign-in unavailable');
      const google = window.google.accounts.id;
      google.initialize({
        client_id: config.clientId,
        callback: response => {
          if (!response.credential) { status('signIn'); return; }
          credential = response.credential;
          openReading();
        },
        auto_select: false
      });
      google.renderButton($('google-sign-in'), { type: 'standard', text: 'signin_with', theme: 'outline', size: 'large' });
      googleReady = true;
      status('signIn');
    })
    .catch(() => status('unavailable', true))
    .finally(() => { googleLoading = undefined; });
}

$('retry').addEventListener('click', () => credential ? openReading() : configureGoogle());
function finishReading() {
  stopReading({ release: true, keepSignIn: false });
  status('signIn');
}

for (const id of ['finish', 'book-finish', 'change-account']) $(id).addEventListener('click', finishReading);
$('claim-form').addEventListener('submit', async event => {
  event.preventDefault();
  const code = $('claim-code').value.trim();
  if (!credential || !code || $('claim-submit').disabled) return;
  const token = credential;
  $('claim-submit').disabled = true;
  status('claiming');
  try {
    await request('/api/guide/international/claim', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code })
    }, token);
    if (credential !== token) return;
    $('claim-code').value = '';
    await openReading();
  } catch (error) {
    if (credential !== token) return;
    if (error.status === 401) readingError(error);
    else status(error.status >= 400 && error.status < 500 ? 'claimRejected' : 'claimUnavailable');
  } finally {
    $('claim-submit').disabled = false;
  }
});
window.addEventListener('pagehide', () => stopReading({ release: true, keepSignIn: false }));
window.addEventListener('pageshow', event => { if (event.persisted && googleReady) status('signIn'); });
window.addEventListener('offline', () => {
  if (credential) { stopReading(); status('offline', true); }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) renew(); });
configureGoogle();

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
});
window.addEventListener('appinstalled', () => {
  installPrompt = undefined;
  showInstallHelp('installed');
});
async function installApp() {
  if (!lease) return;
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
    showInstallHelp('installed');
    return;
  }
  if (!installPrompt) {
    showInstallHelp('installHelp');
    return;
  }
  const prompt = installPrompt;
  installPrompt = undefined;
  try {
    const choice = await prompt.prompt();
    if (choice.outcome === 'accepted') showInstallHelp('installed');
  } catch { showInstallHelp('installHelp'); }
}
for (const id of ['install', 'book-install']) $(id).addEventListener('click', installApp);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
