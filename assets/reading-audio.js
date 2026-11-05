/* MERCY reading audio: one user-initiated recitation or read-aloud session at a time. */
(() => {
  'use strict';
  const instances = new Set();
  const synth = window.speechSynthesis;
  const supported = !!(synth && window.SpeechSynthesisUtterance);
  let active = null;
  let sequence = 0;
  const voiceLocales = { en: 'en-GB', ms: 'ms-MY', ar: 'ar' };
  const labels = {
    ar: {
      summary: 'استمع أثناء القراءة', surah: 'سورة القلم', recitation: 'تشغيل التلاوة', loop: 'تكرار السورة',
      aloud: 'اقرأ بصوت عالٍ', pause: 'إيقاف مؤقت', resume: 'استئناف', stop: 'إيقاف', voice: 'الصوت', speed: 'السرعة',
      introduction: 'اختر التلاوة أو استمع إلى النص الحالي. تشغيل أحدهما يوقف الآخر مؤقتًا.',
      voices: 'جارٍ تحميل الأصوات المتاحة…', unavailable: 'لا يتوفر صوت عربي على هذا الجهاز. أضف صوتًا عربيًا في إعدادات النطق ثم افتح هذه القائمة مجددًا.',
      unsupported: 'هذا المتصفح لا يدعم القراءة بصوت عالٍ. جرّب متصفحًا يدعم النطق.',
      ready: 'النص الحالي جاهز للقراءة.', loading: 'جارٍ إعداد النص…', reading: 'جارٍ القراءة بصوت عالٍ…', paused: 'توقفت القراءة مؤقتًا.',
      empty: 'افتح صفحة أو موضوعًا أولاً، ثم اختر القراءة بصوت عالٍ.', contentFailed: 'تعذر إعداد النص الحالي. افتح صفحة أو موضوعًا آخر وحاول مجددًا.', failed: 'تعذر بدء القراءة. تحقّق من إعدادات النطق وحاول مجددًا.',
      audioFailed: 'تعذر تحميل التلاوة. تحقّق من الاتصال وحاول مجددًا.', done: 'انتهت القراءة.', stopped: 'توقفت القراءة.',
      help: 'الأصوات المتاحة تعتمد على جهازك. أضف صوتًا عربيًا في إعدادات الجهاز للقراءة بالعربية.', defaultVoice: 'الصوت الافتراضي', of: 'من'
    },
    en: {
      summary: 'Listen while reading', surah: 'Surah Al-Qalam · The Pen', recitation: 'Play the recitation', loop: 'Repeat surah',
      aloud: 'Read aloud', pause: 'Pause', resume: 'Resume', stop: 'Stop', voice: 'Voice', speed: 'Speed',
      introduction: 'Choose the surah or listen to the current reading. Starting one pauses the other.',
      voices: 'Loading device voices…', unavailable: 'No English voice is available on this device. Add an English voice in your device speech settings, then reopen these controls.',
      unsupported: 'Read aloud is not supported in this browser. Try a browser with device speech support.',
      ready: 'Ready to read the current text.', loading: 'Preparing the current text…', reading: 'Reading aloud…', paused: 'Read aloud paused.',
      empty: 'Open a book page or thread first, then choose Read aloud.', contentFailed: 'The current text could not be prepared. Open a readable page or thread and try again.', failed: 'Read aloud could not start. Check your device speech settings, then try again.',
      audioFailed: 'The recitation could not load. Check your connection and try again.', done: 'Reading finished.', stopped: 'Read aloud stopped.',
      help: 'Voices depend on your device. An English or Malay voice must be installed for the selected language.', defaultVoice: 'Default voice', of: 'of'
    },
    ms: {
      summary: 'Dengar sambil membaca', surah: 'Surah Al-Qalam · Pena', recitation: 'Mainkan bacaan surah', loop: 'Ulang surah',
      aloud: 'Baca dengan suara', pause: 'Jeda', resume: 'Sambung', stop: 'Henti', voice: 'Suara', speed: 'Kelajuan',
      introduction: 'Pilih bacaan surah atau dengar teks semasa. Memulakan satu akan menjeda yang lain.',
      voices: 'Memuatkan suara peranti…', unavailable: 'Tiada suara Bahasa Melayu tersedia pada peranti ini. Tambah suara Bahasa Melayu dalam tetapan pertuturan peranti, kemudian buka semula kawalan ini.',
      unsupported: 'Pelayar ini tidak menyokong bacaan bersuara. Cuba pelayar yang menyokong pertuturan peranti.',
      ready: 'Sedia untuk membaca teks semasa.', loading: 'Menyediakan teks semasa…', reading: 'Sedang membaca…', paused: 'Bacaan bersuara dijeda.',
      empty: 'Buka halaman buku atau tema dahulu, kemudian pilih Baca dengan suara.', contentFailed: 'Teks semasa tidak dapat disediakan. Buka halaman atau tema yang boleh dibaca dan cuba lagi.', failed: 'Bacaan bersuara tidak dapat dimulakan. Semak tetapan pertuturan peranti, kemudian cuba lagi.',
      audioFailed: 'Bacaan surah tidak dapat dimuatkan. Semak sambungan internet dan cuba lagi.', done: 'Bacaan selesai.', stopped: 'Bacaan bersuara dihentikan.',
      help: 'Suara bergantung pada peranti anda. Suara bahasa Inggeris atau Bahasa Melayu perlu dipasang untuk bahasa yang dipilih.', defaultVoice: 'Suara lalai', of: 'daripada'
    }
  };

  // Short utterances avoid the long-utterance stalls found in several speech engines.
  function chunksFor(text) {
    const normalized = String(text || '').replace(/\u00ad/g, '').replace(/[\t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    if (!normalized) return [];
    const result = [];
    for (const paragraph of normalized.split(/\n+/)) {
      for (const sentence of paragraph.match(/[^.!?。！？]+[.!?。！？]*|[.!?。！？]+/g) || []) {
        let remaining = sentence.trim();
        while (remaining.length > 180) {
          let at = remaining.lastIndexOf(' ', 180);
          if (at < 40) at = 180;
          result.push(remaining.slice(0, at).trim());
          remaining = remaining.slice(at).trim();
        }
        if (remaining) result.push(remaining);
      }
    }
    return result;
  }

  function mount(container, options = {}) {
    if (!container || typeof container.append !== 'function') throw new TypeError('MERCY audio requires a container');
    const id = 'mercy-audio-' + (++sequence);
    const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; };
    const root = make('details', 'mercy-reading-audio');
    root.dataset.mercyAudio = id;
    const summary = make('summary', 'mercy-audio-summary');
    const content = make('div', 'mercy-audio-content');
    const intro = make('p', 'mercy-audio-intro');
    const recitationSection = make('div', 'mercy-audio-surah');
    const surah = make('p', 'mercy-audio-heading');
    const audio = make('audio');
    audio.controls = true; audio.preload = 'none'; audio.src = '/assets/audio/al-qalam.mp3';
    const loopLabel = make('label', 'mercy-audio-loop');
    const loop = make('input'); loop.type = 'checkbox';
    const loopText = make('span'); loopLabel.append(loop, loopText);
    recitationSection.append(surah, audio, loopLabel);
    const ttsSection = make('div', 'mercy-audio-tts');
    const controls = make('div', 'mercy-audio-actions');
    const start = make('button'), pause = make('button'), stop = make('button');
    [start, pause, stop].forEach(button => { button.type = 'button'; });
    controls.append(start, pause, stop);
    const settings = make('div', 'mercy-audio-settings');
    const voiceLabel = make('label'), voiceText = make('span'), voice = make('select');
    voiceLabel.append(voiceText, voice);
    const speedLabel = make('label'), speedText = make('span'), speed = make('select');
    for (const value of [0.75, 1, 1.25, 1.5]) { const option = make('option', '', value + '×'); option.value = String(value); option.selected = value === 1; speed.append(option); }
    speedLabel.append(speedText, speed); settings.append(voiceLabel, speedLabel);
    const status = make('p', 'mercy-audio-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const help = make('p', 'mercy-audio-help');
    ttsSection.append(controls, settings, status, help); content.append(intro, recitationSection, ttsSection); root.append(summary, content); container.append(root);
    let language = '', texts = labels.en, voices = [], run = 0, current = null, timer = null, mode = 'idle', index = 0, chunks = [], destroyed = false, statusKey = 'ready';
    const lang = () => { const requested = options.getLanguage?.(); return Object.hasOwn(voiceLocales, requested) ? requested : 'en'; };
    const clearTimer = () => { if (timer !== null) { window.clearTimeout(timer); timer = null; } };
    const setStatus = key => { statusKey = key; status.textContent = texts[key] || key; };
    function buttons() { start.disabled = !supported || !voices.length || mode === 'loading'; voice.disabled = !supported || !voices.length; speed.disabled = !supported; pause.disabled = !['reading', 'paused'].includes(mode); pause.textContent = mode === 'paused' ? texts.resume : texts.pause; stop.disabled = !['loading', 'reading', 'paused'].includes(mode); }
    function cancel(reason = 'stopped') {
      ++run; clearTimer();
      if (typeof options.onCancel === 'function') { try { options.onCancel(); } catch {} }
      if (active === api) { if (supported) synth.cancel(); active = null; }
      current = null; chunks = []; index = 0; mode = 'idle';
      if (!destroyed) { setStatus(reason); buttons(); }
    }
    function pauseOtherSessions() {
      instances.forEach(instance => { if (instance !== api) { instance.stop(); instance.audio.pause(); } });
      audio.pause();
    }
    function watchdog(token) {
      clearTimer();
      timer = window.setTimeout(() => { if (!destroyed && run === token && mode === 'reading') cancel('failed'); }, 45000);
    }
    function next(token) {
      if (destroyed || run !== token || active !== api) return;
      if (index >= chunks.length) { cancel('done'); return; }
      if (!voices.length) { cancel('unavailable'); return; }
      const utterance = new window.SpeechSynthesisUtterance(chunks[index]);
      current = utterance; utterance.lang = voiceLocales[language]; utterance.rate = Number(speed.value) || 1;
      utterance.voice = voices.find(candidate => candidate.voiceURI === voice.value) || voices[0];
      utterance.onstart = () => { if (run !== token) return; mode = 'reading'; setStatus('reading'); buttons(); watchdog(token); };
      utterance.onend = () => { if (run !== token || active !== api) return; clearTimer(); current = null; ++index; next(token); };
      utterance.onerror = event => { if (run !== token || active !== api) return; cancel('failed'); };
      mode = 'reading'; setStatus('reading'); buttons(); watchdog(token);
      try { synth.speak(utterance); } catch { cancel('failed'); }
    }
    function loadVoices() {
      if (destroyed || !supported) return;
      const selected = voice.value;
      voices = synth.getVoices().filter(candidate => String(candidate.lang).toLowerCase().split(/[-_]/)[0] === language);
      voice.replaceChildren();
      for (const candidate of voices) { const option = make('option', '', candidate.name + ' · ' + candidate.lang); option.value = candidate.voiceURI; voice.append(option); }
      if (voices.some(candidate => candidate.voiceURI === selected)) voice.value = selected;
      else { const preferred = voices.find(candidate => String(candidate.lang).toLowerCase() === voiceLocales[language].toLowerCase()) || voices.find(candidate => candidate.default) || voices[0]; if (preferred) voice.value = preferred.voiceURI; }
      if (mode === 'idle') setStatus(voices.length ? 'ready' : 'unavailable'); buttons();
    }
    function refresh() {
      if (destroyed) return;
      const nextLanguage = lang();
      if (language && nextLanguage !== language) cancel();
      language = nextLanguage; texts = labels[language]; root.lang = language;
      summary.textContent = texts.summary; intro.textContent = texts.introduction; surah.textContent = texts.surah; audio.setAttribute('aria-label', texts.recitation); loopText.textContent = texts.loop;
      start.textContent = texts.aloud; stop.textContent = texts.stop; voiceText.textContent = texts.voice; speedText.textContent = texts.speed; help.textContent = texts.help;
      if (options.scopeLabel) start.setAttribute('aria-label', texts.aloud + ' · ' + options.scopeLabel);
      loadVoices(); if (!supported) setStatus('unsupported'); else if (mode !== 'idle') setStatus(statusKey); buttons();
    }
    async function begin() {
      if (destroyed || !supported || !voices.length) return;
      window.MercyVerses?.stop(); cancel(); pauseOtherSessions(); active = api;
      const token = ++run; mode = 'loading'; setStatus('loading'); buttons();
      try {
        const text = await (typeof options.getText === 'function' ? options.getText() : '');
        if (destroyed || run !== token || active !== api) return;
        chunks = chunksFor(text); index = 0;
        if (!chunks.length) { cancel('empty'); return; }
        // Clear any stale browser speech queue before starting this one.
        synth.cancel(); synth.resume(); next(token);
      } catch (error) {
        if (run === token) {
          const message = error && typeof error.message === 'string' ? error.message.replace(/\s+/g, ' ').trim().slice(0, 300) : '';
          cancel(message || 'contentFailed');
        }
      }
    }
    function pauseOrResume() {
      if (active !== api || !current) return;
      if (mode === 'paused') { mode = 'reading'; synth.resume(); setStatus('reading'); watchdog(run); }
      else { mode = 'paused'; clearTimer(); synth.pause(); setStatus('paused'); }
      buttons();
    }
    const onAudioPlay = () => { window.MercyVerses?.stop(); instances.forEach(instance => { instance.stop(); if (instance !== api) instance.audio.pause(); }); };
    const onAudioError = () => setStatus('audioFailed');
    const onContext = () => { cancel(); refresh(); };
    const onLanguage = () => refresh();
    const onSetting = () => { if (['loading', 'reading', 'paused'].includes(mode)) cancel(); };
    const onPageHide = () => { cancel(); audio.pause(); };
    const api = { audio, element: root, read: begin, start: begin, open() { root.open = true; refresh(); }, stop: () => cancel(), refresh, destroy() {
      if (destroyed) return; cancel(); audio.pause(); destroyed = true; audio.removeAttribute('src'); audio.load();
      instances.delete(api); root.remove();
      window.removeEventListener('mercy-language-change', onLanguage); window.removeEventListener('mercy-reading-context-change', onContext); window.removeEventListener('pagehide', onPageHide);
      if (supported) synth.removeEventListener('voiceschanged', loadVoices);
    }};
    instances.add(api);
    start.addEventListener('click', begin); pause.addEventListener('click', pauseOrResume); stop.addEventListener('click', () => cancel());
    voice.addEventListener('change', onSetting); speed.addEventListener('change', onSetting); loop.addEventListener('change', () => { audio.loop = loop.checked; });
    audio.addEventListener('play', onAudioPlay); audio.addEventListener('error', onAudioError); root.addEventListener('toggle', () => { if (root.open) refresh(); });
    window.addEventListener('mercy-language-change', onLanguage); window.addEventListener('mercy-reading-context-change', onContext); window.addEventListener('pagehide', onPageHide);
    if (supported) synth.addEventListener('voiceschanged', loadVoices);
    refresh();
    return api;
  }
  window.MercyAudio = { mount, stop() { instances.forEach(instance => { instance.stop(); instance.audio.pause(); }); } };
})();
