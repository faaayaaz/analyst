// An opt-in avatar panel; the portfolio has no floating guide or scroll narration.
// Mount after app.js has initialized its existing study/contact dialogs.
function mountAvatar() {
  const story = document.querySelector('.about-story');
  if (!story || !('HTMLDialogElement' in window)) return;
  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'avatar-launch';
  launch.textContent = 'Meet my avatar';
  launch.setAttribute('aria-haspopup', 'dialog');
  launch.setAttribute('aria-controls', 'avatar-dialog');
  story.append(launch);

  const dialog = document.createElement('dialog');
  dialog.id = 'avatar-dialog';
  dialog.className = 'avatar-dialog';
  dialog.setAttribute('aria-labelledby', 'avatar-title');
  dialog.innerHTML = `
    <div class="avatar-panel">
      <button class="avatar-close" type="button" aria-label="Close avatar" autofocus>×</button>
      <p class="avatar-eyebrow">THE PERSON BEHIND THE DATA</p>
      <h2 id="avatar-title">Hello, I’m Fayaz.</h2>
      <div class="avatar-stage">
        <img class="avatar-portrait" src="assets/muhammed-fayaz-portrait.png" alt="Muhammed Fayaz" loading="lazy">
        <div class="avatar-art" role="img" aria-label="Fayaz smiling" data-frame="neutral" hidden></div>
      </div>
      <p class="avatar-intro">I connect data, technology, and people to turn complex questions into clear business decisions.</p>
      <div class="avatar-actions">
        <button class="avatar-audio" type="button" aria-pressed="false">Play introduction</button>
        <button class="avatar-wave" type="button" disabled>Wave</button>
      </div>
      <p class="avatar-status" role="status" aria-live="polite">Play a short introduction, or say hello.</p>
    </div>`;
  document.body.append(dialog);

  const art = dialog.querySelector('.avatar-art');
  const portrait = dialog.querySelector('.avatar-portrait');
  const audio = dialog.querySelector('.avatar-audio');
  const wave = dialog.querySelector('.avatar-wave');
  const status = dialog.querySelector('.avatar-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const speechAvailable = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let sheetRequested = false;
  let sheetReady = false;
  let audioActive = false;
  let generation = 0;
  let waveTimer;

  function still() {
    clearTimeout(waveTimer);
    art.dataset.frame = 'neutral';
    art.setAttribute('aria-label', 'Fayaz smiling');
  }
  function stopped(message = 'Introduction stopped.') {
    const cancel = audioActive;
    generation += 1;
    audioActive = false;
    if (cancel && speechAvailable) speechSynthesis.cancel();
    audio.textContent = 'Play introduction';
    audio.setAttribute('aria-pressed', 'false');
    status.textContent = message;
    still();
  }
  function loadSheet() {
    if (sheetRequested) return;
    sheetRequested = true;
    const image = new Image();
    image.onload = () => {
      sheetReady = true;
      art.style.backgroundImage = `url("${image.src}")`;
      art.hidden = false;
      portrait.hidden = true;
      wave.disabled = false;
    };
    image.onerror = () => { wave.title = 'The avatar image could not be loaded.'; };
    image.src = new URL('./assets/fayaz-avatar-poses.png', import.meta.url).href;
  }

function narrationVoice(voices) {
  // SpeechSynthesisVoice has no gender field. Match identifiable English male
  // voices from Google, Microsoft and Apple rather than relying on the default.
  const english = voices.filter((item) => /^en(?:[-_]|$)/i.test(item.lang));
  const male = /\b(?:male|daniel|alex|fred|aaron|arthur|david|george|guy|james|mark|oliver|ryan|ravi|rishi|thomas|sean|evan|liam|matthew|joey|justin|brian|prabhat|andrew|eric|roger)\b/i;
  const preferred = english.filter((item) => male.test(item.name));
  preferred.sort((a, b) => Number(/^en[-_]GB$/i.test(b.lang)) - Number(/^en[-_]GB$/i.test(a.lang)));
  return preferred[0] || english.find((item) => item.default) || english[0] || null;
}
function availableVoices() {
  const voices = speechSynthesis.getVoices?.() || [];
  if (voices.length || !speechSynthesis.addEventListener) return Promise.resolve(voices);
  // Some browsers populate voices after page load. Give that first inventory a
  // chance to arrive, without blocking narration indefinitely on unsupported devices.
  return new Promise((resolve) => {
    let timer;
    const finish = () => {
      clearTimeout(timer);
      speechSynthesis.removeEventListener('voiceschanged', changed);
      resolve(speechSynthesis.getVoices?.() || []);
    };
    const changed = () => { if (speechSynthesis.getVoices().length) finish(); };
    speechSynthesis.addEventListener('voiceschanged', changed);
    timer = setTimeout(finish, 900);
    changed();
  });
}

  if (!speechAvailable) {
    audio.disabled = true;
    audio.textContent = 'Audio unavailable';
  }
  audio.addEventListener('click', async () => {
    if (audioActive) { stopped(); return; }
    still();
    audioActive = true;
    const id = ++generation;
    audio.textContent = 'Stop introduction';
    audio.setAttribute('aria-pressed', 'true');
    status.textContent = 'Preparing introduction…';
    const voices = await availableVoices();
    if (id !== generation || !audioActive || !dialog.open || document.hidden) return;
    const utterance = new SpeechSynthesisUtterance('Hi, I’m Fayaz. I’m a data analyst and business intelligence professional based in the UAE. I connect data, technology, and people to turn complex questions into clear business decisions. Explore my selected work to see more.');
    const selected = narrationVoice(voices);
    if (selected) utterance.voice = selected;
    utterance.lang = selected?.lang || 'en-GB';
    utterance.rate = 0.94;
    utterance.pitch = 0.88;
    const active = () => id === generation && audioActive && dialog.open && !document.hidden;
    utterance.onstart = utterance.onresume = () => { if (active()) status.textContent = 'Playing introduction.'; };
    utterance.onpause = () => { if (active()) status.textContent = 'Introduction paused.'; };
    utterance.onend = () => { if (active()) stopped('Introduction finished.'); };
    utterance.onerror = () => { if (active()) stopped('Audio could not play. You can read the introduction above.'); };
    try { speechSynthesis.speak(utterance); }
    catch { if (active()) stopped('Audio could not play. You can read the introduction above.'); }
  });

  wave.addEventListener('click', () => {
    stopped('Hello! Thanks for stopping by.');
    if (!sheetReady || reduced.matches || document.documentElement.classList.contains('motion-paused')) return;
    const end = performance.now() + 2400;
    function frame() {
      if (!dialog.open || document.hidden || performance.now() >= end) { still(); return; }
      art.dataset.frame = art.dataset.frame === 'wave-a' ? 'wave-b' : 'wave-a';
      art.setAttribute('aria-label', 'Fayaz waving hello');
      waveTimer = setTimeout(frame, 400);
    }
    frame();
  });
  launch.addEventListener('click', () => {
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add('dialog-open');
    status.textContent = 'Play a short introduction, or say hello.';
    loadSheet();
  });
  dialog.querySelector('.avatar-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', () => stopped());
  dialog.addEventListener('close', () => {
    stopped();
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
    launch.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopped(); });
  addEventListener('pagehide', () => stopped());
  document.addEventListener('portfolio:motion', still);
  reduced.addEventListener('change', still);
}

if (document.readyState !== 'complete') {
  document.addEventListener('DOMContentLoaded', mountAvatar, { once: true });
} else mountAvatar();
