(() => {
  const API = 'https://mercy-malaysia-orders-reviews.shahiranuar.chatgpt.site';
  const dialog = document.getElementById('thread-dialog');
  const section = dialog?.querySelector('.lens-explorer');
  if (!section) return;
  const box = document.createElement('div');
  box.className = 'lens-access';
  box.innerHTML = '<label for="lens-code">Reader access code</label> <input id="lens-code" type="text" inputmode="text" autocomplete="off" placeholder="MERCY-L-…" aria-describedby="lens-auth-status"><button id="lens-unlock" type="button">Unlock six lenses</button><div id="google-signin"></div><p id="lens-auth-status" role="status">A verified digital copy allows two Google readers. An internet connection is required.</p>';
  section.append(box);
  const field = box.querySelector('#lens-code');
  const status = box.querySelector('#lens-auth-status');
  const unlock = box.querySelector('#lens-unlock');
  const googleMount = box.querySelector('#google-signin');
  let credential = '', code = '', unlocked = false, configured = false, pending = null;
  function message(value) { status.textContent = value; }
  async function json(path, options) {
    if (!navigator.onLine) throw Error('Connect to the internet to use the six lenses.');
    const response = await fetch(API + path, { cache:'no-store', ...options });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'Access is unavailable.');
    return data;
  }
  async function showExample() {
    if (!pending || !unlocked) return;
    const {number, lens, panel, choices} = pending;
    try {
      const data = await json('/api/lenses/' + number + '/' + lens, {
        headers: {'authorization':'Bearer ' + credential, 'x-mercy-access-code':code}
      });
      choices.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.lens === lens)));
      panel.textContent = data.example;
      panel.hidden = false;
      message('Reader access: ' + code.split('-').slice(0,3).join('-') + ' · Online');
    } catch (error) {
      unlocked = false;
      panel.textContent = '';
      panel.hidden = true;
      message(error.message);
    }
  }
  async function claim() {
    code = field.value.trim();
    if (!credential) { message('Sign in with Google first.'); return; }
    if (!/^MERCY-L-[a-f0-9-]{36}$/.test(code)) { message('Enter the reader access code supplied with your verified digital copy.'); return; }
    try {
      const data = await json('/api/lenses/claim', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({code, credential})
      });
      unlocked = true;
      message(data.serial + ' · Reader access granted');
      await showExample();
    } catch (error) { unlocked = false; message(error.message); }
  }
  unlock.addEventListener('click', claim);
  window.mercyLens = {
    show(number, lens, panel, choices) {
      pending = {number,lens,panel,choices};
      panel.hidden = false;
      panel.textContent = '';
      if (!navigator.onLine) { message('Connect to the internet to use the six lenses.'); return; }
      if (!configured) { message('Six-lens sign-in is being configured. The book and Qur’an links remain available.'); return; }
      if (unlocked) showExample();
      else message('Enter the access code for this digital copy and sign in with Google. Each copy allows two readers.');
    }
  };
  json('/api/lenses/config').then(({clientId}) => {
    if (!clientId) { message('Six-lens sign-in is being configured. The book and Qur’an links remain available.'); return; }
    configured = true;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id:clientId,
        callback: response => { credential = response.credential || ''; if (credential) claim(); }
      });
      window.google.accounts.id.renderButton(googleMount, {theme:'outline',size:'large',text:'signin_with',width:240});
    };
    script.onerror = () => message('Google sign-in could not load. Check your connection.');
    document.head.append(script);
  }).catch(error => message(error.message));
})();
