import { filterItems } from './site-logic.mjs';

const create = (tag, className, content) => { const node = document.createElement(tag); if (className) node.className = className; if (content !== undefined) node.textContent = content; return node; };
const by = (selector) => document.querySelector(selector);

export function renderTour(items, state) {
  const list = by('[data-tour-list]'); const detail = by('[data-tour-detail]'); const count = by('[data-tour-count]');
  list.replaceChildren(); count.textContent = `${items.length} ${items.length === 1 ? 'stop' : 'stops'}`;
  if (!items.length) { list.append(create('p', 'empty-state', 'No stops match that search.')); detail.replaceChildren(create('div', 'empty-state', 'Try another area, service, or role.')); return; }
  items.forEach((item, index) => {
    const button = create('button', 'stop-button'); button.type = 'button'; button.setAttribute('aria-selected', String(item.id === state.selected)); button.dataset.id = item.id;
    button.append(create('strong', '', item.title), create('small', '', item.area)); button.addEventListener('click', () => { state.selected = item.id; renderTour(items, state); }); list.append(button);
  });
  const currentIndex = Math.max(0, items.findIndex((item) => item.id === state.selected)); const item = items[currentIndex] || items[0]; state.selected = item.id;
  detail.replaceChildren();
  detail.append(create('p', 'eyebrow', `${item.area} · ${item.role}`), create('h2', '', item.title), create('p', 'detail-summary', item.summary));
  const meta = create('div', 'detail-meta'); (item.tags || []).forEach((tag) => meta.append(create('span', 'meta-chip', `#${tag}`))); detail.append(meta);
  const value = create('div', 'detail-value'); value.append(create('strong', '', 'Why it matters'), create('p', '', item.patientValue)); detail.append(value);
  const ask = create('p', 'detail-ask', `Good question to ask: “${item.ask}”`); detail.append(ask);
  const controls = create('div', 'detail-controls'); controls.style.marginTop = '30px';
  const previous = create('button', 'button button-ghost', '← Previous'); const next = create('button', 'button button-primary', 'Next stop →'); previous.type = next.type = 'button'; previous.disabled = currentIndex === 0; next.disabled = currentIndex === items.length - 1;
  previous.addEventListener('click', () => { state.selected = items[currentIndex - 1].id; renderTour(items, state); }); next.addEventListener('click', () => { state.selected = items[currentIndex + 1].id; renderTour(items, state); }); controls.append(previous, next); detail.append(controls);
}

export function renderServices(items, state) {
  const list = by('[data-service-list]'); const count = by('[data-service-count]'); const filters = by('[data-service-filters]');
  const categories = ['All', ...new Set(items.map((item) => item.category))];
  if (!filters.children.length) categories.forEach((category) => { const button = create('button', 'filter-button', category); button.type = 'button'; button.setAttribute('aria-pressed', String(category === state.category)); button.addEventListener('click', () => { state.category = category; renderServices(items, state); }); filters.append(button); });
  [...filters.children].forEach((button) => button.setAttribute('aria-pressed', String(button.textContent === state.category)));
  const categoryItems = state.category === 'All' ? items : items.filter((item) => item.category === state.category); const visible = filterItems(categoryItems, state.query);
  count.textContent = `${visible.length} ${visible.length === 1 ? 'service' : 'services'}`; list.replaceChildren();
  if (!visible.length) { list.append(create('p', 'empty-state', 'No services match that search. Try a different word or category.')); return; }
  visible.forEach((item) => { const card = create('article', 'service-card'); card.id = item.id; card.append(create('span', 'service-icon', item.icon), create('h3', '', item.name), create('p', '', item.shortDescription)); const button = create('button', '', 'View service details ↗'); button.type = 'button'; button.addEventListener('click', () => openServiceDialog(item)); card.append(button); list.append(card); });
}

function openServiceDialog(item) {
  const dialog = by('[data-service-dialog]'); if (!dialog) return;
  by('[data-dialog-category]').textContent = `${item.category} · ${item.audience}`; by('[data-dialog-title]').textContent = item.name; by('[data-dialog-details]').textContent = item.details;
  const questions = by('[data-dialog-questions]'); questions.replaceChildren(); item.questions.forEach((question) => questions.append(create('span', '', question)));
  const ask = by('[data-dialog-ask]'); ask.href = `#questions`; ask.onclick = () => dialog.close(); dialog.showModal();
}

export async function initPage(page, root) {
  try {
    if (page === 'tour') {
      const response = await fetch(`${root}/data/tour.json`); if (!response.ok) throw new Error('Tour data unavailable'); const data = await response.json(); const state = { selected: data.stops[0]?.id || '', query: '' }; renderTour(data.stops, state); const search = by('[data-tour-search]'); search.addEventListener('input', () => { state.query = search.value; const visible = filterItems(data.stops, state.query); state.selected = visible[0]?.id || ''; renderTour(visible, state); });
    }
    if (page === 'services') {
      const response = await fetch(`${root}/data/services.json`); if (!response.ok) throw new Error('Service data unavailable'); const data = await response.json(); const state = { category: 'All', query: '' }; renderServices(data.services, state); const search = by('[data-service-search]'); search.addEventListener('input', () => { state.query = search.value; renderServices(data.services, state); }); const dialog = by('[data-service-dialog]'); by('[data-dialog-close]')?.addEventListener('click', () => dialog.close()); dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    }
  } catch (error) {
    const container = by('[data-tour-detail]') || by('[data-service-list]');
    container?.replaceChildren(create('div', 'empty-state', 'This content could not load right now. Please refresh or use the other pages to continue.'));
  }
}
