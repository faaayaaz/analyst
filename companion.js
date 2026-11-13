// Animate the supplied likeness as poses; never reconstruct the face from geometry.
const host = document.createElement('aside');
host.className = 'companion';
host.setAttribute('aria-label', 'Portfolio guide');
host.innerHTML = `
  <div class="companion-note" role="status" aria-live="polite"></div>
  <div class="companion-stage">
    <img src="assets/muhammed-fayaz-portrait.png" alt="Fayaz, your portfolio guide" class="companion-poster">
    <div class="companion-avatar" role="img" aria-label="Fayaz smiling" data-frame="neutral" hidden></div>
  </div>
  <div class="companion-controls">
    <button type="button" class="guide-voice" aria-pressed="false">Voice off</button>
    <button type="button" class="guide-wave" disabled>Wave</button>
    <button type="button" class="guide-hide" aria-label="Hide portfolio guide">×</button>
  </div>`;
document.body.append(host);

const show = document.createElement('button');
show.className = 'guide-show';
show.textContent = 'Show guide';
show.hidden = true;
document.body.append(show);

const note = host.querySelector('.companion-note');
const voice = host.querySelector('.guide-voice');
const wave = host.querySelector('.guide-wave');
const avatar = host.querySelector('.companion-avatar');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const speechAvailable = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
let avatarReady = false;
let voiceEnabled = false;
let speaking = false;
let hidden = false;
let current = 'home';
let waveUntil = 0;
let talkUntil = 0;
let poseTimer;
let speechGeneration = 0;

const messages = {
  home: 'Hi, I’m Fayaz. Let’s explore the stories behind the data.',
  projects: 'Take a look at my selected work. Open a study to see the question, approach, and outcome.',
  about: 'A little about me: the person behind the data and the work.',
  skills: 'Explore my toolkit. Select a tab to see how each skill becomes an output.',
  contact: 'Have a project in mind? Say hello below. The form helps you prepare an email.',
};
const labels = {
  neutral: 'Fayaz smiling', tilt: 'Fayaz smiling with a tilted head',
  'wave-a': 'Fayaz waving hello', 'wave-b': 'Fayaz waving hello',
  'talk-a': 'Fayaz explaining with open hands', 'talk-b': 'Fayaz speaking with open hands',
  point: 'Fayaz pointing toward the projects', down: 'Fayaz pointing down toward contact',
};

function paused() {
  return reduced.matches || document.documentElement.classList.contains('motion-paused');
}
function setFrame(frame) {
  avatar.dataset.frame = frame;
  avatar.setAttribute('aria-label', labels[frame]);
}
function restingFrame() {
  if (current === 'projects') return 'point';
  if (current === 'contact') return 'down';
  return current === 'about' ? 'tilt' : 'neutral';
}
function updatePose() {
  clearTimeout(poseTimer);
  if (!avatarReady || hidden || document.hidden) return;
  if (paused()) { setFrame(restingFrame()); return; }
  const now = performance.now();
  if (now < waveUntil) {
    setFrame(Math.floor(now / 380) % 2 ? 'wave-a' : 'wave-b');
    poseTimer = setTimeout(updatePose, 380);
  } else if (speaking || now < talkUntil) {
    setFrame(Math.floor(now / 300) % 2 ? 'talk-a' : 'talk-b');
    poseTimer = setTimeout(updatePose, 300);
  } else {
    setFrame(restingFrame());
  }
}
function cancelSpeech() {
  speechGeneration += 1;
  if (speechAvailable) speechSynthesis.cancel();
  speaking = false;
}
function say(text, { animate = true } = {}) {
  cancelSpeech();
  note.textContent = text;
  talkUntil = animate && !hidden && !document.hidden ? performance.now() + 1500 : 0;
  updatePose();
  if (!voiceEnabled || hidden || document.hidden) return;
  const generation = speechGeneration;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = 0.95;
  utterance.onstart = () => {
    if (generation !== speechGeneration) return;
    speaking = true;
    updatePose();
  };
  utterance.onend = utterance.onerror = () => {
    if (generation !== speechGeneration) return;
    speaking = false;
    talkUntil = 0;
    updatePose();
  };
  speechSynthesis.speak(utterance);
}
function greet() {
  waveUntil = performance.now() + 3000;
  say('Hello! Welcome to my portfolio. Explore my projects or try the interactive data explorer.');
}
if (!speechAvailable) {
  voice.disabled = true;
  voice.textContent = 'Voice unavailable';
}
voice.addEventListener('click', () => {
  voiceEnabled = !voiceEnabled;
  voice.setAttribute('aria-pressed', String(voiceEnabled));
  voice.textContent = voiceEnabled ? 'Voice on' : 'Voice off';
  if (voiceEnabled) say(note.textContent);
  else { cancelSpeech(); talkUntil = 0; updatePose(); }
});
wave.addEventListener('click', greet);
host.querySelector('.guide-hide').addEventListener('click', () => {
  hidden = true;
  host.hidden = true;
  show.hidden = false;
  clearTimeout(poseTimer);
  waveUntil = talkUntil = 0;
  cancelSpeech();
  show.focus();
});
show.addEventListener('click', () => {
  hidden = false;
  host.hidden = false;
  show.hidden = true;
  waveUntil = performance.now() + 2000;
  updatePose();
  wave.focus();
});
function motionChanged() {
  // Pausing clears pending gestures, so resuming does not replay a stale wave.
  if (paused()) waveUntil = talkUntil = 0;
  updatePose();
}
reduced.addEventListener('change', motionChanged);
document.addEventListener('portfolio:motion', motionChanged);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearTimeout(poseTimer);
    waveUntil = talkUntil = 0;
    cancelSpeech();
  } else updatePose();
});
function updateSection() {
  let next = 'home';
  for (const id of Object.keys(messages)) {
    const element = document.getElementById(id);
    if (element && element.getBoundingClientRect().top <= innerHeight * 0.45) next = id;
  }
  if (next === current) return;
  current = next;
  host.dataset.section = next;
  waveUntil = 0;
  say(messages[next], { animate: next !== 'projects' && next !== 'contact' });
}
let scrollPending = false;
addEventListener('scroll', () => {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => { scrollPending = false; updateSection(); });
}, { passive: true });
document.querySelectorAll('[data-project]').forEach((button) => {
  button.addEventListener('click', () => {
    // Account for scrolling into view before a queued scroll callback can
    // replace this project's introduction with the generic section greeting.
    updateSection();
    waveUntil = 0;
    const title = button.querySelector('strong')?.innerText.trim().replace(/\s+/g, ' ')
      || button.textContent.trim().replace(/\s+/g, ' ');
    say(`Explore ${title.replace(/[.!?]+$/, '')}. Open the study to learn more.`, { animate: false });
  });
});

const sheet = new Image();
sheet.onload = () => {
  avatarReady = true;
  host.dataset.avatar = 'supplied-poses';
  avatar.style.backgroundImage = `url("${sheet.src}")`;
  avatar.hidden = false;
  host.querySelector('.companion-poster').hidden = true;
  wave.disabled = false;
  if (current === 'home') waveUntil = performance.now() + 3000;
  updatePose();
};
sheet.onerror = () => {
  host.dataset.avatar = 'portrait';
  wave.disabled = true;
  wave.title = 'The avatar image could not be loaded.';
};
sheet.src = new URL('./assets/fayaz-avatar-poses.png', import.meta.url).href;
say(messages.home, { animate: false });
updateSection();
