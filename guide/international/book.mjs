export function mountCompanionBook({copy, getLanguage, onPosition}) {
  const $ = id => document.getElementById(id);
  const reader = $('reader'), stage = $('book-stage'), pages = $('book-pages'), dialog = $('thread-dialog');
  const spreadMode = matchMedia('(orientation: landscape) and (min-width: 640px)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const lenses = ['science', 'history', 'psychology', 'ethics', 'faith', 'art'];
  let threads = [], index = 0, zoom = 1, panX = 0, panY = 0;
  let controlsTimer, turnTimer, detail, activeLens, returnFocus;
  let pointerOrigin, pinchOrigin, usedPinch = false;
  const pointers = new Map();
  const audioMounts = [];
  const labels = () => copy[getLanguage()];
  const isRTL = () => getLanguage() === 'ar';
  const displayLocale = () => isRTL() ? 'ar-u-nu-arab' : getLanguage();
  const number = value => new Intl.NumberFormat(displayLocale()).format(value);

  function visibleThreads() {
    const first = spreadMode.matches ? index - index % 2 : index;
    return threads.slice(first, first + (spreadMode.matches ? 2 : 1));
  }

  function node(tag, value, className) {
    const item = document.createElement(tag);
    if (value) item.textContent = value;
    if (className) item.className = className;
    return item;
  }

  function pageFor(thread) {
    const leaf = node('article', '', 'companion-page');
    const marker = node('button', number(thread.number) + ' · ' + labels().lenses, 'thread-marker');
    marker.type = 'button';
    marker.dataset.thread = thread.number;
    marker.setAttribute('aria-label', labels().thread + ' ' + number(thread.number) + ' · ' + labels().lenses);
    marker.addEventListener('click', () => openThread(thread, marker));
    leaf.append(
      node('p', labels().thread + ' ' + number(thread.number), 'thread-kicker'),
      node('h2', thread.title),
      node('p', thread.note),
      marker,
      node('span', number(thread.number), 'book-page-number')
    );
    return leaf;
  }

  function notifyAudio() {
    window.dispatchEvent(new Event('mercy-reading-context-change'));
    audioMounts.forEach(audio => audio.refresh?.());
  }

  function showControls() {
    clearTimeout(controlsTimer);
    reader.classList.add('controls-visible');
    controlsTimer = setTimeout(() => {
      if (!reader.querySelector('details.book-menu[open]')) reader.classList.remove('controls-visible');
    }, 4500);
  }

  function clearTurn() {
    clearTimeout(turnTimer);
    pages.querySelector('.turning-leaf')?.remove();
  }

  function paint(direction = 0) {
    if (!threads.length) return;
    clearTurn();
    const outgoing = pages.querySelectorAll('.companion-page');
    const oldLeaf = direction > 0 ? outgoing[outgoing.length - 1] : outgoing[0];
    const overlay = direction && oldLeaf && !reduceMotion.matches && zoom === 1 ? oldLeaf.cloneNode(true) : null;
    const oldOffset = oldLeaf?.offsetLeft;
    const visible = visibleThreads();
    pages.classList.toggle('spread', spreadMode.matches);
    pages.replaceChildren(...visible.map(pageFor));
    if (overlay) {
      overlay.classList.add('turning-leaf', (direction > 0) !== isRTL() ? 'turn-left' : 'turn-right');
      overlay.style.left = oldOffset + 'px';
      overlay.inert = true;
      overlay.setAttribute('aria-hidden', 'true');
      pages.append(overlay);
      turnTimer = setTimeout(() => overlay.remove(), 670);
    }
    $('thread-index').value = threads[index].number;
    $('page-count').textContent = visible.map(thread => number(thread.number)).join('–') + ' / ' + number(threads.length);
    $('previous').disabled = visible[0] === threads[0];
    $('next').disabled = visible.at(-1) === threads.at(-1);
    setView(zoom, panX, panY);
    notifyAudio();
  }

  function goTo(number, direction = 0) {
    const target = threads.findIndex(thread => thread.number === Number(number));
    if (target < 0) return;
    index = target;
    onPosition(threads[index].number);
    paint(direction);
    showControls();
  }

  function move(direction) {
    if (!threads.length) return;
    const size = spreadMode.matches ? 2 : 1;
    const base = index - index % size;
    const target = threads[base + direction * size];
    if (target) goTo(target.number, direction);
  }

  function showLens(lens) {
    if (!detail) return;
    activeLens = lens;
    const data = detail.lenses[lens];
    const exercise = node('p');
    exercise.append(node('strong', labels().practice + '. '), data.practice || '');
    $('lens-list').replaceChildren(node('p', data.answer), exercise);
    for (const control of $('lens-buttons').children) {
      control.setAttribute('aria-pressed', String(control.dataset.lens === lens));
    }
    notifyAudio();
  }

  function openThread(thread, trigger) {
    detail = thread;
    returnFocus = trigger;
    index = threads.indexOf(thread);
    $('thread-index').value = thread.number;
    onPosition(thread.number);
    $('thread-kicker').textContent = labels().thread + ' ' + number(thread.number);
    $('thread-title').textContent = thread.title;
    $('thread-note').textContent = thread.note;
    const verse = $('thread-verse');
    verse.replaceChildren();
    verse.hidden = !thread.verse;
    if (thread.verse) {
      const reference = node('a', labels().verse + ' ' + thread.verse);
      reference.href = 'https://quran.com/' + String(thread.verse).replaceAll('–', '-');
      reference.target = '_blank';
      reference.rel = 'noopener noreferrer';
      verse.append(reference);
      window.MercyVerses?.enhance(reference, thread.verse, { getLanguage });
    }
    $('lens-buttons').replaceChildren(...lenses.map(lens => {
      const button = node('button', labels()[lens]);
      button.type = 'button';
      button.dataset.lens = lens;
      button.addEventListener('click', () => showLens(lens));
      return button;
    }));
    showLens(lenses[0]);
    dialog.showModal();
  }

  function currentPageText() {
    return visibleThreads().flatMap(thread => [thread.title, thread.note]).join('\n\n');
  }

  function currentThreadText() {
    if (!detail) return '';
    const lens = detail.lenses[activeLens];
    return [detail.title, detail.note, labels()[activeLens], lens.answer, lens.practice].filter(Boolean).join('\n\n');
  }

  function setView(value, x = 0, y = 0) {
    zoom = Math.min(3, Math.max(1, value));
    const maxX = Math.max(0, (pages.offsetWidth * zoom - stage.clientWidth) / 2);
    const maxY = Math.max(0, (pages.offsetHeight * zoom - stage.clientHeight) / 2);
    panX = Math.max(-maxX, Math.min(maxX, x));
    panY = Math.max(-maxY, Math.min(maxY, y));
    pages.style.setProperty('--zoom', zoom);
    pages.style.setProperty('--pan-x', panX + 'px');
    pages.style.setProperty('--pan-y', panY + 'px');
    $('zoom-reset').textContent = new Intl.NumberFormat(displayLocale(), { style: 'percent' }).format(zoom);
    $('zoom-out').disabled = zoom === 1;
    $('zoom-in').disabled = zoom === 3;
  }

  function distance() {
    const [first, second] = pointers.values();
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  stage.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button')) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    stage.setPointerCapture(event.pointerId);
    if (pointers.size === 1) {
      pointerOrigin = { x: event.clientX, y: event.clientY, panX, panY };
      usedPinch = false;
    }
    if (pointers.size === 2) {
      pinchOrigin = { distance: distance(), zoom };
      usedPinch = true;
    }
  });

  stage.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && pinchOrigin?.distance) {
      setView(pinchOrigin.zoom * distance() / pinchOrigin.distance, panX, panY);
    } else if (pointers.size === 1 && zoom > 1 && !usedPinch) {
      setView(zoom, pointerOrigin.panX + event.clientX - pointerOrigin.x, pointerOrigin.panY + event.clientY - pointerOrigin.y);
    }
  });

  function finishPointer(event) {
    if (!pointers.delete(event.pointerId) || pointers.size || !pointerOrigin) return;
    if (event.type === 'pointerup' && !usedPinch) {
      const dx = event.clientX - pointerOrigin.x;
      const dy = event.clientY - pointerOrigin.y;
      if (zoom === 1 && Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        move((dx < 0) !== isRTL() ? 1 : -1);
      } else if (Math.hypot(dx, dy) < 12) {
        if (reader.classList.contains('controls-visible')) reader.classList.remove('controls-visible');
        else showControls();
      }
    }
    pointerOrigin = null;
    pinchOrigin = null;
  }

  stage.addEventListener('pointerup', finishPointer);
  stage.addEventListener('pointercancel', finishPointer);
  stage.addEventListener('lostpointercapture', finishPointer);
  stage.addEventListener('dblclick', event => {
    if (!event.target.closest('button')) setView(zoom === 1 ? 1.6 : 1);
  });
  window.addEventListener('resize', () => { if (threads.length) setView(zoom, panX, panY); });
  window.addEventListener('keydown', event => {
    if (reader.hidden || dialog.open || event.target.closest?.('select,input,textarea,summary')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move((event.key === 'ArrowRight') !== isRTL() ? 1 : -1);
    }
  });

  $('previous').addEventListener('click', () => move(-1));
  $('next').addEventListener('click', () => move(1));
  $('thread-index').addEventListener('change', event => {
    goTo(event.target.value);
    $('book-menu').open = false;
  });
  $('zoom-out').addEventListener('click', () => { setView(zoom - .25, panX, panY); showControls(); });
  $('zoom-in').addEventListener('click', () => { setView(zoom + .25, panX, panY); showControls(); });
  $('zoom-reset').addEventListener('click', () => { setView(1); showControls(); });
  $('thread-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    detail = null;
    notifyAudio();
    if (returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  });
  for (const menu of [$('book-menu'), $('book-more')]) {
    menu.addEventListener('toggle', () => {
      if (menu.open) {
        for (const other of reader.querySelectorAll('.book-menu')) if (other !== menu) other.open = false;
      }
      showControls();
    });
  }
  reader.addEventListener('focusin', showControls);
  spreadMode.addEventListener('change', () => {
    if (threads.length) { setView(1); paint(); }
  });

  if (window.MercyAudio) {
    audioMounts.push(
      window.MercyAudio.mount($('reader-audio'), { getLanguage, getText: currentPageText, context: 'thread' }),
      window.MercyAudio.mount($('thread-audio'), { getLanguage, getText: currentThreadText, context: 'thread' })
    );
  }

  return {
    show(entries, position) {
      threads = entries;
      index = Math.max(0, entries.findIndex(thread => thread.number === position));
      $('thread-index').replaceChildren(...threads.map(thread => new Option(number(thread.number) + ' · ' + thread.title, thread.number)));
      reader.hidden = false;
      paint();
      showControls();
    },
    hide() {
      if (dialog.open) dialog.close();
      threads = [];
      reader.hidden = true;
      for (const menu of reader.querySelectorAll('.book-menu')) menu.open = false;
      pages.replaceChildren();
      $('thread-index').replaceChildren();
      $('lens-list').replaceChildren();
      $('thread-title').textContent = '';
      $('thread-note').textContent = '';
      $('thread-verse').replaceChildren();
      $('lens-buttons').replaceChildren();
      detail = null;
      clearTimeout(controlsTimer);
      clearTurn();
      setView(1);
      notifyAudio();
      window.MercyAudio?.stop();
    }
  };
}
