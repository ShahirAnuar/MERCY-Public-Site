import { initialiseInternationalCountry } from './locale.mjs';
import { copy } from './copy.mjs';

const backend = 'https://mercy-malaysia-orders-reviews.shahiranuar.chatgpt.site';
const sessionPath = '/api/guide/international/session';
const $ = id => document.getElementById(id);
const lenses = ['science', 'history', 'psychology', 'ethics', 'faith', 'art'];
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
let busy = false;
let statusKey = '';
let installKey = '';
let installPrompt;
let googleReady = false;
let googleLoading;
let threads = [];

function status(key = '', canRetry = false) {
  statusKey = key;
  $('reading-status').textContent = copy[language][key] || '';
  $('retry').hidden = !canRetry;
}

function showInstallHelp(key) {
  installKey = key;
  $('install-help').hidden = !key;
  $('install-help').textContent = copy[language][key] || '';
}

function label(element, key) {
  element.textContent = copy[language][key];
}

function setLanguage(next) {
  const changed = next !== language;
  language = next;
  $('international-language').value = next;
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
    $('international-language').replaceChildren(...model.languages.map(code => {
      const option = new Option(model.labels[code], code);
      option.lang = code;
      return option;
    }));
    setLanguage(model.languages.includes(preferred) ? preferred : 'en');
  }
});
$('international-language').addEventListener('change', event => setLanguage(event.target.value));

function showThread(number) {
  const index = threads.findIndex(thread => thread.number === number);
  if (index < 0) return;
  const thread = threads[index];
  currentThread = number;
  preferences.set('thread', number);
  $('thread-index').value = number;
  $('previous').disabled = index === 0;
  $('next').disabled = index === threads.length - 1;
  $('thread-title').textContent = thread.title;
  $('thread-note').textContent = thread.note;
  $('thread-verse').textContent = thread.verse ? copy[language].verse + ' ' + thread.verse : '';
  $('thread-verse').hidden = !thread.verse;
  $('lens-list').replaceChildren(...lenses.map(lens => {
    const article = document.createElement('article');
    const heading = document.createElement('h3');
    heading.textContent = copy[language][lens];
    const answer = document.createElement('p');
    answer.textContent = thread.lenses[lens].answer;
    const practice = document.createElement('p');
    const prompt = document.createElement('strong');
    prompt.textContent = copy[language].practice + '. ';
    practice.append(prompt, thread.lenses[lens].practice);
    article.append(heading, answer, practice);
    return article;
  }));
}

function showReader(entries) {
  if (!Array.isArray(entries) || entries.length !== 86) throw new Error('Guide content unavailable');
  threads = entries;
  const numbers = new Intl.NumberFormat(language);
  $('thread-index').replaceChildren(...threads.map(thread => new Option(numbers.format(thread.number) + ' · ' + thread.title, thread.number)));
  showThread(validThread(currentThread) ? currentThread : 1);
  $('reader').hidden = false;
}

function hideReader() {
  threads = [];
  $('reader').hidden = true;
  for (const id of ['thread-index', 'thread-title', 'thread-note', 'thread-verse', 'lens-list']) $(id).replaceChildren();
}

function moveThread(offset) {
  const index = threads.findIndex(thread => thread.number === currentThread);
  if (threads[index + offset]) showThread(threads[index + offset].number);
}

$('previous').addEventListener('click', () => moveThread(-1));
$('next').addEventListener('click', () => moveThread(1));
$('thread-index').addEventListener('change', event => showThread(Number(event.target.value)));

async function request(path, options = {}, token = credential) {
  const response = await fetch(backend + path, {
    ...options,
    cache: 'no-store',
    headers: { ...options.headers, ...(token ? { authorization: 'Bearer ' + token } : {}) }
  });
  if (!response.ok) throw Object.assign(new Error('Guide request failed'), { status: response.status });
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
  if (release && lease && token) session('release', token).catch(() => {});
  lease = false;
  if (!keepSignIn) credential = undefined;
  hideReader();
  $('finish').hidden = true;
  $('google-sign-in').hidden = Boolean(credential);
}

function readingError(error) {
  const expired = error.status === 401 || error.status === 403;
  stopReading({ release: !expired, keepSignIn: !expired });
  const reason = expired ? 'expired'
    : error.status === 429 ? 'full'
    : error.status === 409 ? 'sessionExpired'
    : navigator.onLine ? 'unavailable' : 'offline';
  status(reason, !expired);
}

async function renew() {
  if (!lease || busy) return;
  const token = credential;
  try {
    await session('heartbeat', token);
  } catch (error) {
    if (lease && token === credential) readingError(error);
  }
}

async function openReading() {
  if (!credential || busy) return;
  busy = true;
  $('google-sign-in').hidden = true;
  $('retry').hidden = true;
  status('loading');
  const token = credential;
  try {
    if (!lease) {
      await session('acquire', token);
      if (token !== credential) {
        session('release', token).catch(() => {});
        return;
      }
      lease = true;
      heartbeat = setInterval(renew, 30_000);
      $('finish').hidden = false;
    }
    let entries;
    let requested;
    do {
      requested = language;
      entries = await request('/api/guide/international/threads?lang=' + requested, {
        headers: { 'x-mercy-family': sessionId }
      }, token);
      if (!lease || token !== credential) return;
    } while (language !== requested);
    showReader(entries.threads);
    status();
  } catch (error) {
    if (token === credential) readingError(error);
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
$('finish').addEventListener('click', () => {
  stopReading({ release: true, keepSignIn: false });
  status('signIn');
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
$('install').addEventListener('click', async () => {
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
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
