// Show the supplied artwork directly in About. Speech is a self-hosted recording,
// with one consistent voice rather than a device-dependent speech synthesizer.
function mountAvatar() {
  const host = document.querySelector('.about-portrait');
  if (!host) return;
  const avatar = document.createElement('div');
  avatar.className = 'inline-avatar';
  avatar.hidden = true;
  avatar.dataset.audio = 'idle';
  avatar.innerHTML = `
    <div class="avatar-stage">
      <div class="avatar-art" role="img" aria-label="Fayaz smiling" data-frame="neutral"></div>
    </div>
    <div class="avatar-actions">
      <button class="avatar-audio" type="button" aria-pressed="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>
        <span>Hear my story</span>
      </button>
      <button class="avatar-wave" type="button" aria-label="Wave hello">Wave</button>
    </div>
    <p class="avatar-status" role="status" aria-live="polite"></p>
    <audio class="avatar-narration" preload="none" hidden></audio>`;
  host.prepend(avatar);

  const art = avatar.querySelector('.avatar-art');
  const audio = avatar.querySelector('.avatar-audio');
  const label = audio.querySelector('span');
  const wave = avatar.querySelector('.avatar-wave');
  const status = avatar.querySelector('.avatar-status');
  const player = avatar.querySelector('audio');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let requested = false;
  let generation = 0;
  let waveTimer;

  function still() {
    clearTimeout(waveTimer);
    art.dataset.frame = 'neutral';
    art.setAttribute('aria-label', 'Fayaz smiling');
  }
  function stop(message = '') {
    generation += 1;
    requested = false;
    player.pause();
    if (player.readyState) player.currentTime = 0;
    label.textContent = 'Hear my story';
    audio.setAttribute('aria-pressed', 'false');
    audio.removeAttribute('aria-busy');
    avatar.dataset.audio = 'idle';
    status.textContent = message;
  }
  audio.addEventListener('click', async () => {
    if (requested) { stop(); return; }
    still();
    requested = true;
    const id = ++generation;
    status.textContent = '';
    label.textContent = 'Stop introduction';
    audio.setAttribute('aria-pressed', 'true');
    audio.setAttribute('aria-busy', 'true');
    avatar.dataset.audio = 'loading';
    if (!player.getAttribute('src')) {
      player.src = new URL('./assets/fayaz-introduction.mp3', import.meta.url).href;
    } else if (player.error) player.load();
    try {
      await player.play();
      if (id !== generation || !requested || document.hidden) return;
      audio.removeAttribute('aria-busy');
      avatar.dataset.audio = 'playing';
    } catch {
      if (id === generation) stop('Audio could not play. Please try again.');
    }
  });
  player.addEventListener('playing', () => {
    if (!requested || document.hidden) { stop(); return; }
    audio.removeAttribute('aria-busy');
    avatar.dataset.audio = 'playing';
  });
  player.addEventListener('ended', () => stop());
  player.addEventListener('pause', () => { if (requested && !player.ended) stop(); });
  player.addEventListener('error', () => { if (requested) stop('Audio could not load. Please try again.'); });

  wave.addEventListener('click', () => {
    stop();
    still();
    if (reduced.matches || document.documentElement.classList.contains('motion-paused')) return;
    const end = performance.now() + 2000;
    function frame() {
      if (document.hidden || performance.now() >= end) { still(); return; }
      art.dataset.frame = art.dataset.frame === 'wave-a' ? 'wave-b' : 'wave-a';
      art.setAttribute('aria-label', 'Fayaz waving hello');
      waveTimer = setTimeout(frame, 400);
    }
    frame();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stop(); still(); }
  });
  addEventListener('pagehide', () => { stop(); still(); });
  document.addEventListener('portfolio:motion', still);
  reduced.addEventListener('change', still);

  function loadArtwork() {
    const image = new Image();
    image.onload = () => {
      art.style.backgroundImage = `url("${image.src}")`;
      avatar.hidden = false;
      host.classList.add('has-inline-avatar');
    };
    // Keep the original portrait if the artwork cannot load.
    image.src = new URL('./assets/fayaz-avatar-poses.png', import.meta.url).href;
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      loadArtwork();
    }, { rootMargin: '300px' });
    observer.observe(host);
  } else loadArtwork();
}

if (document.readyState !== 'complete') {
  document.addEventListener('DOMContentLoaded', mountAvatar, { once: true });
} else mountAvatar();
