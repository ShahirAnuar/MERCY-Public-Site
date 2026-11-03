(function () {
  'use strict';

  function initReviewHelper() {
    var form = document.getElementById('review-form');
    if (!form || form.dataset.reviewHelperReady === 'true') return;
    var byId = function (id) { return document.getElementById(id); };
    var language = byId('review-language');
    var mode = byId('review-mode');
    var choices = byId('review-choices');
    var useSelections = byId('review-use-selections');
    var previewButton = byId('review-preview');
    var preview = byId('review-submission-preview');
    var previewContent = byId('review-preview-content');
    var confirmation = byId('review-confirm');
    var sendButton = byId('review-send');
    var status = byId('review-status');
    var review = byId('review-text') || form.elements.namedItem('review');
    if (!language || !mode || !choices || !useSelections || !previewButton || !preview || !previewContent || !confirmation || !sendButton || !status || !review) return;
    form.dataset.reviewHelperReady = 'true';

    var endpoint = 'https://mercy-malaysia-orders-reviews.shahiranuar.chatgpt.site/api/reviews';
    var categories = [
      { id: 'clarity', ms: 'Kejelasan bahasa', en: 'Clarity of the writing', options: [
        { id: 'clear', ms: 'Bahasanya mudah saya fahami.', en: 'I found the writing easy to understand.' },
        { id: 'mixed', ms: 'Kebanyakan bahagian jelas, tetapi ada bahagian yang perlu saya baca semula.', en: 'Most parts were clear, although I needed to reread some sections.' },
        { id: 'difficult', ms: 'Saya sukar memahami beberapa bahagian.', en: 'I found some sections difficult to understand.' }
      ] },
      { id: 'story', ms: 'Cerita dan watak', en: 'Story and characters', options: [
        { id: 'engaging', ms: 'Cerita dan wataknya menarik perhatian saya.', en: 'The story and characters held my interest.' },
        { id: 'mixed', ms: 'Ada bahagian cerita yang menarik, tetapi ada bahagian yang kurang menarik bagi saya.', en: 'Some parts of the story interested me more than others.' },
        { id: 'not_engaging', ms: 'Cerita ini kurang menarik perhatian saya.', en: 'The story did not hold my interest.' }
      ] },
      { id: 'reflection', ms: 'Ruang untuk berfikir', en: 'Room for reflection', options: [
        { id: 'helpful', ms: 'Bacaan ini memberi saya perkara untuk difikirkan.', en: 'The reading gave me something to reflect on.' },
        { id: 'mixed', ms: 'Sesetengah idea membantu saya berfikir, manakala yang lain kurang dekat dengan pengalaman saya.', en: 'Some ideas prompted reflection, while others felt less relevant to my experience.' },
        { id: 'limited', ms: 'Bacaan ini belum banyak menambah sudut pandang saya.', en: 'The reading added little to my perspective.' }
      ] },
      { id: 'discussion', ms: 'Perbincangan bersama', en: 'Reading and discussing together', options: [
        { id: 'helpful', ms: 'Bacaan ini membantu kami memulakan perbincangan.', en: 'The reading helped us start a conversation.' },
        { id: 'mixed', ms: 'Ada topik yang sesuai kami bincangkan, tetapi ada yang memerlukan penjelasan lanjut.', en: 'Some topics worked well for our discussion, while others needed more explanation.' },
        { id: 'difficult', ms: 'Kami sukar menggunakan bacaan ini untuk memulakan perbincangan.', en: 'We found it difficult to use the reading to start a discussion.' }
      ] },
      { id: 'presentation', ms: 'Susun atur dan ilustrasi', en: 'Layout and illustrations', options: [
        { id: 'helpful', ms: 'Susun atur dan ilustrasinya membantu pengalaman membaca saya.', en: 'The layout and illustrations supported my reading experience.' },
        { id: 'mixed', ms: 'Saya menyukai sebahagian persembahannya, tetapi beberapa bahagian boleh diperjelas.', en: 'I liked parts of the presentation, although some areas could be clearer.' },
        { id: 'difficult', ms: 'Beberapa pilihan susun atur atau ilustrasi mengganggu pengalaman membaca saya.', en: 'Some layout or illustration choices made reading harder for me.' }
      ] },
      { id: 'app', ms: 'Penggunaan aplikasi — jika berkenaan', en: 'Using the app — if applicable', options: [
        { id: 'easy', ms: 'Aplikasi ini mudah saya gunakan.', en: 'I found the app easy to use.' },
        { id: 'mixed', ms: 'Kebanyakan fungsi aplikasi mudah digunakan, tetapi ada yang memerlukan masa untuk difahami.', en: 'Most app features were straightforward, although some took time to understand.' },
        { id: 'difficult', ms: 'Saya menghadapi kesukaran semasa menggunakan aplikasi.', en: 'I had difficulty using the app.' }
      ] }
    ];
    var copy = {
      ms: {
        skip: 'Tidak mahu ulas / tidak berkenaan',
        instruction: 'Pilih hanya ayat yang sepadan dengan pengalaman anda. Semua topik adalah pilihan; anda boleh mengubah ayat sebelum menghantar.',
        selectionDraft: 'Ayat berdasarkan pilihan anda',
        noSelections: 'Belum ada pilihan dibuat.',
        chooseOne: 'Pilih sekurang-kurangnya satu maklum balas dahulu.',
        use: 'Gunakan pilihan saya',
        preview: 'Pratonton ulasan',
        send: 'Hantar untuk semakan',
        sending: 'Sedang menghantar…',
        guidedApplied: 'Pilihan anda telah dimasukkan. Semak dan ubah ayat jika perlu, kemudian buka pratonton.',
        changed: 'Maklumat telah berubah. Buka pratonton semula sebelum menghantar.',
        langChanged: 'Bahasa pilihan telah dikemas kini. Teks yang anda tulis dikekalkan; tekan “Gunakan pilihan saya” jika mahu menggantikannya dengan ayat pilihan dalam bahasa ini.',
        missing: 'Lengkapkan nama, e-mel, edisi dan rating pilihan anda.',
        invalidEmail: 'Masukkan alamat e-mel yang sah.',
        short: 'Tulis sekurang-kurangnya 15 aksara atau pilih mod rating sahaja.',
        confirmRequired: 'Buka pratonton dan sahkan bahawa maklum balas ini berdasarkan pengalaman anda sendiri.',
        confirm: 'Saya mengesahkan bahawa rating dan maklum balas ini mencerminkan pengalaman saya sendiri. Saya telah menyemak ayat sebelum menghantar.',
        previewReady: 'Semak pratonton di bawah. Jika tepat, tandakan pengesahan untuk menghantarnya kepada pemilik.',
        success: 'Terima kasih. Maklum balas anda telah dihantar kepada pemilik untuk semakan sebelum diterbitkan.',
        failed: 'Maklum balas belum dihantar. Sila cuba lagi; maklumat anda masih dikekalkan.',
        previewTitle: 'Pratonton maklum balas anda',
        name: 'Nama', email: 'E-mel — dirahsiakan', edition: 'Edisi', rating: 'Rating', review: 'Ulasan',
        ratingOnly: 'Rating sahaja — tiada ulasan bertulis.',
        textHint: 'Semak ayat berdasarkan pilihan anda atau tulis ulasan sendiri.',
        written: 'Tulis sendiri', guided: 'Pilih maklum balas', rating_only: 'Rating sahaja',
        selectRating: 'Pilih rating sendiri', selectEdition: 'Pilih edisi',
        editionLabels: { Paperback: 'Kulit lembut', Hardcover: 'Kulit keras', eBook: 'eBook / The Guide App', 'Not sure': 'Tidak pasti' },
        modeLabel: 'Cara memberi maklum balas', languageLabel: 'Bahasa ulasan'
      },
      en: {
        skip: 'Skip / not applicable',
        instruction: 'Choose only statements that match your experience. Every topic is optional, and you can edit the wording before submitting.',
        selectionDraft: 'Wording based on your selections',
        noSelections: 'No feedback selected yet.',
        chooseOne: 'Choose at least one feedback option first.',
        use: 'Use my selections',
        preview: 'Preview my review',
        send: 'Send for review',
        sending: 'Sending…',
        guidedApplied: 'Your selections have been added. Check and edit the wording if needed, then open the preview.',
        changed: 'Your details changed. Open the preview again before submitting.',
        langChanged: 'The choice language has changed. Your written text has been kept; select “Use my selections” to replace it with selected wording in this language.',
        missing: 'Complete your name, email, edition and your chosen rating.',
        invalidEmail: 'Enter a valid email address.',
        short: 'Write at least 15 characters, or choose rating only.',
        confirmRequired: 'Open the preview and confirm that this feedback reflects your own experience.',
        confirm: 'I confirm that this rating and feedback reflect my own experience. I have checked the wording before submitting.',
        previewReady: 'Check the preview below. If it is accurate, tick the confirmation to send it to the owner.',
        success: 'Thank you. Your feedback has been sent to the owner for review before publication.',
        failed: 'Your feedback has not been sent. Please try again; your details have been kept.',
        previewTitle: 'Preview your feedback',
        name: 'Name', email: 'Email — kept private', edition: 'Edition', rating: 'Rating', review: 'Review',
        ratingOnly: 'Rating only — no written review.',
        textHint: 'Check the wording from your selections, or write your own review.',
        written: 'Write my own', guided: 'Choose feedback', rating_only: 'Rating only',
        selectRating: 'Choose your own rating', selectEdition: 'Choose an edition',
        editionLabels: { Paperback: 'Paperback', Hardcover: 'Hardcover', eBook: 'eBook / The Guide App', 'Not sure': 'Not sure' },
        modeLabel: 'How would you like to give feedback?', languageLabel: 'Review language'
      }
    };
    var selected = {};
    var previewSnapshot = null;
    var sending = false;
    var generatedDraft;
    var edition = form.elements.namedItem('edition');
    var rating = form.elements.namedItem('rating');
    var name = form.elements.namedItem('name');
    var email = form.elements.namedItem('email');
    var website = form.elements.namedItem('website');
    if (!edition || !rating || !name || !email) return;

    language.value = 'ms';
    if (!/^(written|guided|rating_only)$/.test(mode.value)) mode.value = 'written';
    // Rating remains the reader's choice; no option is inferred from feedback.
    var lang = function () { return language.value === 'en' ? 'en' : 'ms'; };
    var words = function () { return copy[lang()]; };
    var currentMode = function () { return /^(written|guided|rating_only)$/.test(mode.value) ? mode.value : 'written'; };

    function setStatus(message, isError) {
      status.textContent = message || '';
      status.classList.toggle('error', Boolean(isError));
      status.setAttribute('role', isError ? 'alert' : 'status');
    }
    function invalidate(showMessage) {
      var wasReady = previewSnapshot !== null;
      previewSnapshot = null;
      confirmation.checked = false;
      preview.hidden = true;
      sendButton.disabled = true;
      if (showMessage && wasReady) setStatus(words().changed);
    }
    function labelFor(control, text) {
      var existing = control.id && form.querySelector('label[for="' + control.id + '"]');
      if (existing && !existing.contains(control)) existing.textContent = text;
      var marked = form.querySelector('[data-review-label="' + control.id + '"]');
      if (marked) marked.textContent = text;
    }
    function selectionText() {
      return categories.map(function (category) {
        var option = category.options.find(function (item) { return item.id === selected[category.id]; });
        return option ? option[lang()] : '';
      }).filter(Boolean).join(' ');
    }
    function updateDraft() {
      if (generatedDraft) generatedDraft.textContent = selectionText() || words().noSelections;
    }
    function renderChoices() {
      choices.replaceChildren();
      var hint = document.createElement('p');
      hint.textContent = words().instruction;
      choices.appendChild(hint);
      categories.forEach(function (category) {
        var row = document.createElement('div');
        row.className = 'review-choice-row';
        var label = document.createElement('label');
        var select = document.createElement('select');
        select.id = 'review-choice-' + category.id;
        select.name = 'review_choice_' + category.id;
        label.htmlFor = select.id;
        label.textContent = category[lang()];
        var skip = document.createElement('option');
        skip.value = '';
        skip.textContent = words().skip;
        select.appendChild(skip);
        category.options.forEach(function (option) {
          var element = document.createElement('option');
          element.value = option.id;
          element.textContent = option[lang()];
          select.appendChild(element);
        });
        select.value = selected[category.id] || '';
        select.addEventListener('change', function () {
          selected[category.id] = select.value;
          updateDraft();
          invalidate(true);
        });
        row.append(label, select);
        choices.appendChild(row);
      });
      var draftLabel = document.createElement('p');
      draftLabel.textContent = words().selectionDraft;
      generatedDraft = document.createElement('p');
      generatedDraft.className = 'review-selected-draft';
      generatedDraft.setAttribute('aria-live', 'polite');
      choices.append(draftLabel, generatedDraft);
      updateDraft();
    }
    function localize() {
      useSelections.textContent = words().use;
      previewButton.textContent = words().preview;
      sendButton.textContent = words().send;
      review.placeholder = words().textHint;
      Array.from(mode.options).forEach(function (option) { if (words()[option.value]) option.textContent = words()[option.value]; });
      Array.from(edition.options).forEach(function (option) { option.textContent = words().editionLabels[option.value] || words().selectEdition; });
      Array.from(rating.options).forEach(function (option) { option.textContent = /^[1-5]$/.test(option.value) ? option.value + (lang() === 'ms' ? ' bintang' : option.value === '1' ? ' star' : ' stars') : words().selectRating; });
      labelFor(name, words().name);
      labelFor(email, words().email);
      labelFor(edition, words().edition);
      labelFor(rating, words().rating);
      labelFor(language, words().languageLabel);
      labelFor(mode, words().modeLabel);
      labelFor(review, words().review);
      var confirmLabel = form.querySelector('[data-review-confirm-label]');
      if (!confirmLabel) {
        var surrounding = confirmation.closest('label');
        if (surrounding) {
          // Keep the checkbox node and any accessibility text it already owns.
          confirmLabel = surrounding.querySelector('span');
          if (!confirmLabel) {
            Array.from(surrounding.childNodes).forEach(function (node) { if (node.nodeType === 3) node.textContent = ''; });
            confirmLabel = document.createElement('span');
            surrounding.appendChild(confirmLabel);
          }
        } else {
          confirmLabel = form.querySelector('label[for="review-confirm"]');
        }
      }
      if (confirmLabel) confirmLabel.textContent = words().confirm;
      renderChoices();
    }
    function updateMode() {
      var ratingOnly = currentMode() === 'rating_only';
      var guidedWrapper = byId('review-guided');
      if (guidedWrapper) guidedWrapper.hidden = currentMode() !== 'guided';
      choices.hidden = currentMode() !== 'guided';
      useSelections.hidden = currentMode() !== 'guided';
      review.hidden = ratingOnly;
      review.required = !ratingOnly;
      review.setAttribute('aria-hidden', String(ratingOnly));
      var surroundingReviewLabel = review.closest('label');
      if (surroundingReviewLabel) surroundingReviewLabel.hidden = ratingOnly;
      var reviewLabel = review.id && form.querySelector('label[for="' + review.id + '"]');
      if (reviewLabel && !reviewLabel.contains(review)) reviewLabel.hidden = ratingOnly;
    }
    function payload() {
      return {
        name: String(name.value || '').trim(),
        email: String(email.value || '').trim(),
        edition: String(edition.value || ''),
        rating: /^[1-5]$/.test(String(rating.value)) ? Number(rating.value) : null,
        review: currentMode() === 'rating_only' ? '' : String(review.value || '').trim(),
        ratingOnly: currentMode() === 'rating_only',
        reviewMethod: currentMode(),
        reviewLanguage: lang(),
        readerConfirmed: true,
        website: website ? String(website.value || '') : ''
      };
    }
    function validate(data) {
      if (!data.name || !data.email || !['Paperback', 'Hardcover', 'eBook', 'Not sure'].includes(data.edition) || !Number.isInteger(data.rating)) throw new Error(words().missing);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error(words().invalidEmail);
      if (!data.ratingOnly && data.review.length < 15) throw new Error(words().short);
      if (data.name.length > 80 || data.email.length > 180 || data.review.length > 2000) {
        throw new Error(lang() === 'ms' ? 'Sila ringkaskan nama kepada 80 aksara, e-mel kepada 180 aksara dan ulasan kepada 2,000 aksara.' : 'Keep your name within 80 characters, email within 180 and review within 2,000.');
      }
    }
    function addPreviewRow(label, value) {
      var paragraph = document.createElement('p');
      var strong = document.createElement('strong');
      strong.textContent = label + ': ';
      paragraph.append(strong, document.createTextNode(value));
      previewContent.appendChild(paragraph);
    }
    function showPreview() {
      invalidate(false);
      try {
        var data = payload();
        validate(data);
        previewContent.replaceChildren();
        var heading = document.createElement('h3');
        heading.textContent = words().previewTitle;
        previewContent.appendChild(heading);
        addPreviewRow(words().name, data.name);
        addPreviewRow(words().email, data.email);
        addPreviewRow(words().edition, words().editionLabels[data.edition]);
        addPreviewRow(words().rating, String(data.rating) + ' / 5');
        addPreviewRow(words().review, data.ratingOnly ? words().ratingOnly : data.review);
        previewSnapshot = JSON.stringify(data);
        preview.hidden = false;
        confirmation.checked = false;
        setStatus(words().previewReady);
        preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (error) { setStatus(error.message, true); }
    }

    useSelections.type = 'button';
    previewButton.type = 'button';
    confirmation.required = true;
    sendButton.disabled = true;
    preview.hidden = true;
    useSelections.addEventListener('click', function () {
      if (sending) return;
      var draft = selectionText();
      if (!draft) { setStatus(words().chooseOne, true); return; }
      review.value = draft;
      invalidate(false);
      setStatus(words().guidedApplied);
      review.focus();
    });
    previewButton.addEventListener('click', function () { if (!sending) showPreview(); });
    language.addEventListener('change', function () {
      invalidate(false);
      localize();
      updateMode();
      setStatus(words().langChanged);
    });
    mode.addEventListener('change', function () { invalidate(true); updateMode(); });
    ['input', 'change'].forEach(function (type) {
      form.addEventListener(type, function (event) {
        if (event.target === confirmation) {
          sendButton.disabled = sending || !confirmation.checked || !previewSnapshot;
          return;
        }
        if (event.target === language || event.target === mode || choices.contains(event.target)) return;
        invalidate(true);
      });
    });
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (sending) return;
      var data = payload();
      try {
        validate(data);
        if (!confirmation.checked || !previewSnapshot || JSON.stringify(data) !== previewSnapshot) throw new Error(words().confirmRequired);
      } catch (error) { setStatus(error.message, true); return; }
      sending = true;
      var frozenControls = Array.from(form.querySelectorAll('input,select,textarea,button')).map(function (control) {
        var original = control.disabled;
        control.disabled = true;
        return { control: control, disabled: original };
      });
      setStatus(words().sending);
      try {
        var response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data), credentials: 'omit' });
        var result = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(result.error || words().failed);
        var successLanguage = data.reviewLanguage;
        form.reset();
        language.value = successLanguage;
        selected = {};
        localize();
        updateMode();
        invalidate(false);
        previewContent.replaceChildren();
        setStatus(words().success);
      } catch (error) {
        setStatus(error.message || words().failed, true);
        sendButton.disabled = !confirmation.checked || !previewSnapshot;
      } finally {
        sending = false;
        frozenControls.forEach(function (entry) { entry.control.disabled = entry.disabled; });
        sendButton.disabled = !confirmation.checked || !previewSnapshot;
      }
    });
    form.addEventListener('reset', function () {
      // Native reset applies control defaults after this event returns.
      setTimeout(function () { selected = {}; localize(); updateMode(); invalidate(false); }, 0);
    });
    localize();
    updateMode();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initReviewHelper, { once: true });
  else initReviewHelper();
})();
