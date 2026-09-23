const fallback = { version: 'fallback', redirect: 'I’m Shahir, a learning guide—not a medical or medication chatbot. I can explain pharmacy work, but I can’t diagnose, recommend a medicine or dose, or answer personal medication questions. Please speak with a real pharmacist or doctor.', stations: [] };
const state = { data: fallback, selected: null, language: 'EN' };
const $ = (selector) => document.querySelector(selector);
const speech = $('#speech');

async function loadKnowledge() {
  try {
    const response = await fetch('data/knowledge.json', { cache: 'force-cache' });
    if (!response.ok) throw new Error('knowledge unavailable');
    state.data = await response.json();
  } catch (error) {
    console.info('Using built-in cache fallback.', error.message);
  }
  renderStations();
  selectStation(state.data.stations[0]);
}

function renderStations() {
  $('#stations').innerHTML = state.data.stations.map((station) => `
    <button class="station" type="button" role="listitem" data-id="${station.id}">
      <span class="station-number">${station.icon}</span><h3>${station.title}</h3><p>${station.summary}</p>
    </button>`).join('');
  document.querySelectorAll('.station').forEach((button) => {
    button.addEventListener('click', () => selectStation(state.data.stations.find((item) => item.id === button.dataset.id)));
  });
}

function selectStation(station) {
  if (!station) return;
  state.selected = station;
  document.querySelectorAll('.station').forEach((button) => button.classList.toggle('active', button.dataset.id === station.id));
  speech.textContent = `${station.title}: ${station.detail}`;
  $('#mediaStatus').textContent = 'Shahir is explaining';
}

function speakCurrent() {
  const text = state.selected ? `${state.selected.title}. ${state.selected.detail}` : speech.textContent;
  if (!('speechSynthesis' in window)) {
    $('#mediaStatus').textContent = 'Text mode ready';
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = state.language === 'BM' ? 'ms-MY' : 'en-US';
  utterance.rate = .96;
  utterance.onstart = () => { $('#mediaStatus').textContent = 'Shahir is talking'; $('#shahirStage').classList.add('talking'); };
  utterance.onend = () => { $('#mediaStatus').textContent = 'Shahir is ready'; $('#shahirStage').classList.remove('talking'); };
  window.speechSynthesis.speak(utterance);
}

$('#listen').addEventListener('click', speakCurrent);
$('#replay').addEventListener('click', speakCurrent);
$('#redirect').addEventListener('click', () => { speech.textContent = state.data.redirect; $('#mediaStatus').textContent = 'Safe redirect'; });
$('#language').addEventListener('click', () => {
  state.language = state.language === 'EN' ? 'BM' : 'EN';
  $('#language').textContent = state.language === 'EN' ? 'BM / EN' : 'EN / BM';
  speech.textContent = state.language === 'BM' ? 'Shahir menerangkan skop kerja pengurusan stor farmasi. Untuk soalan ubat atau kesihatan peribadi, sila rujuk ahli farmasi atau doktor.' : (state.selected?.detail || state.data.redirect);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(() => { $('#offlineState').textContent = 'Offline-ready shell enabled'; }).catch(() => { $('#offlineState').textContent = 'Offline cache pending deployment'; });
} else { $('#offlineState').textContent = 'Offline support unavailable in this browser'; }
loadKnowledge();
