import { filterItems, safeQuestionResponse, translate } from './site-logic.mjs';

const body = document.body;
const root = body.dataset.root || '.';
const dataPath = (name) => `${root}/data/${name}.json`;

function by(selector, scope = document) { return scope.querySelector(selector); }
function all(selector, scope = document) { return [...scope.querySelectorAll(selector)]; }
function text(value) { return document.createTextNode(value ?? ''); }

export async function loadJson(name, fallback) {
  try {
    const response = await fetch(dataPath(name));
    if (!response.ok) throw new Error(`Could not load ${name}.json`);
    return await response.json();
  } catch (error) {
    all('[data-load-error]').forEach((node) => {
      node.hidden = false;
      node.textContent = 'Some content could not load. Please refresh or use the navigation to continue.';
    });
    return fallback;
  }
}

function getValue(source, path) { return path.split('.').reduce((value, key) => value?.[key], source); }
function hydrateSite(site) {
  all('[data-site]').forEach((node) => {
    const value = getValue(site, node.dataset.site);
    if (value !== undefined) node.textContent = value;
  });
}

export function setupNavigation(site) {
  const nav = by('[data-nav]');
  if (!nav) return;
  const page = body.dataset.page;
  nav.replaceChildren();
  const language = body.dataset.language || 'en';
  site.navigation.forEach((item) => {
    const link = document.createElement('a');
    link.href = `${root}/${item.href}`.replace('./', '');
    link.textContent = site.languages?.[language]?.nav?.[item.key] || item.label;
    if (item.key === page) link.setAttribute('aria-current', 'page');
    nav.append(link);
  });
  const toggle = by('[data-nav-toggle]');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
  });
  nav.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (toggle) toggle.textContent = 'Menu';
  });
}

function setupLanguage(site) {
  const toggle = by('[data-lang-toggle]');
  const available = site.languages ? ['en', 'ms'] : ['en'];
  let language = localStorage.getItem('vi-awwab-language') || 'en';
  if (!available.includes(language)) language = 'en';
  const apply = () => {
    body.dataset.language = language;
    document.documentElement.lang = language === 'ms' ? 'ms' : 'en';
    all('[data-i18n]').forEach((node) => {
      const value = site.languages?.[language]?.[node.dataset.i18n];
      if (value) node.textContent = value;
    });
    if (toggle) { toggle.textContent = site.languages?.[language]?.toggleLabel || 'BM'; toggle.setAttribute('aria-label', language === 'ms' ? 'Switch to English' : 'Tukar ke Bahasa Melayu'); }
    setupNavigation(site);
  };
  toggle?.addEventListener('click', () => { language = language === 'en' ? 'ms' : 'en'; localStorage.setItem('vi-awwab-language', language); apply(); });
  apply();
}

function renderFiller(items) {
  const rootNode = by('[data-filler]');
  if (!rootNode || !items.length) return;
  let index = Math.floor(Math.random() * items.length);
  const paint = () => {
    const item = items[index];
    rootNode.replaceChildren();
    const content = document.createElement('div');
    const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = item.eyebrow;
    const title = document.createElement('h2'); title.textContent = item.title;
    const bodyText = document.createElement('p'); bodyText.textContent = item.body;
    content.append(eyebrow, title, bodyText);
    const side = document.createElement('div'); side.className = 'filler-side';
    const link = document.createElement('a'); link.href = `${root}/${item.actionHref}`.replace('./', ''); link.textContent = item.actionLabel;
    const next = document.createElement('button'); next.type = 'button'; next.textContent = 'Show another ↻'; next.addEventListener('click', () => { index = (index + 1) % items.length; paint(); });
    side.append(link, next); rootNode.append(content, side);
  };
  paint();
}

function renderQuestionRedirect(questions) {
  const questionRoot = by('[data-question-root]');
  const responseRoot = by('[data-question-response]');
  if (!questionRoot || !responseRoot) return;
  questions.forEach((question) => {
    const button = document.createElement('button'); button.className = 'question-button'; button.type = 'button'; button.textContent = question.label;
    button.addEventListener('click', () => {
      const response = safeQuestionResponse(question);
      responseRoot.hidden = false; responseRoot.replaceChildren();
      const title = document.createElement('strong'); title.textContent = response.title;
      const bodyText = document.createElement('p'); bodyText.textContent = response.body;
      const next = document.createElement('a'); next.href = `${root}/${response.nextHref}`.replace('./', ''); next.textContent = response.nextStep;
      responseRoot.append(title, bodyText, next); responseRoot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    questionRoot.append(button);
  });
}

async function init() {
  const site = await loadJson('site', { navigation: [] });
  hydrateSite(site); setupLanguage(site);
  const filler = await loadJson('filler', { items: [] }); renderFiller(filler.items);
  if (body.dataset.page === 'services') {
    const questions = await loadJson('questions', { questions: [] }); renderQuestionRedirect(questions.questions);
  }
  if (body.dataset.page === 'tour' || body.dataset.page === 'services') {
    const module = await import('./page.js');
    await module.initPage(body.dataset.page, root);
  }
}

init();
