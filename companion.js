import * as THREE from './vendor/three.module.min.js';

const host = document.createElement('aside');
host.className = 'companion';
host.setAttribute('aria-label', 'Portfolio guide');
host.innerHTML = `<div class="companion-note" role="status" aria-live="polite"></div><div class="companion-stage"><img src="assets/muhammed-fayaz-portrait.png" alt="Fayaz, your portfolio guide" class="companion-poster"><canvas aria-label="Animated 3D portfolio guide"></canvas></div><div class="companion-controls"><button type="button" class="guide-voice" aria-pressed="false">Voice off</button><button type="button" class="guide-wave">Wave</button><button type="button" class="guide-hide" aria-label="Hide portfolio guide">×</button></div>`;
document.body.append(host);
const show = document.createElement('button');
show.className = 'guide-show'; show.textContent = 'Show guide'; show.hidden = true;
document.body.append(show);
const note = host.querySelector('.companion-note');
const voice = host.querySelector('.guide-voice');
const canvas = host.querySelector('canvas');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let voiceEnabled = false, speaking = false, wavingUntil = performance.now() + 4200;
let pointing = false, hidden = false, lastTime = 0, raf = 0;
const speechAvailable = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
if (!speechAvailable) { voice.disabled = true; voice.textContent = 'Voice unavailable'; }
function cancelSpeech() { if (speechAvailable) speechSynthesis.cancel(); speaking = false; }
function say(text) {
  note.textContent = text;
  cancelSpeech();
  if (!voiceEnabled || hidden || document.hidden) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB'; utterance.rate = 0.95;
  utterance.onstart = () => { speaking = true; };
  utterance.onend = utterance.onerror = () => { speaking = false; };
  speechSynthesis.speak(utterance);
}
voice.onclick = () => {
  voiceEnabled = !voiceEnabled;
  voice.setAttribute('aria-pressed', String(voiceEnabled));
  voice.textContent = voiceEnabled ? 'Voice on' : 'Voice off';
  if (voiceEnabled) say(note.textContent); else cancelSpeech();
};
host.querySelector('.guide-wave').onclick = () => { wavingUntil = performance.now() + 3200; pointing = false; say('Hello! I’m Fayaz’s portfolio guide. Explore the work, or try the interactive data explorer.'); };
host.querySelector('.guide-hide').onclick = () => { hidden = true; host.hidden = true; show.hidden = false; cancelSpeech(); stop(); show.focus(); };
show.onclick = () => { hidden = false; host.hidden = false; show.hidden = true; wavingUntil = performance.now() + 3200; start(); host.querySelector('.guide-wave').focus(); };

let renderer, scene, camera, body, head, left, right, mouth;
function mesh(geometry, color, parent, x=0,y=0,z=0) {
  const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color,roughness:0.75}));
  m.position.set(x,y,z); parent.add(m); return m;
}
function sphere(parent,color,x,y,z,sx,sy,sz) {
 const m=mesh(new THREE.SphereGeometry(1,24,16),color,parent,x,y,z); m.scale.set(sx,sy,sz); return m;
}
try {
 const context = canvas.getContext('webgl2',{alpha:true,antialias:true});
 if (!context) throw new Error('WebGL unavailable');
 renderer = new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.setSize(220,260,false);
 renderer.outputColorSpace = THREE.SRGBColorSpace;
 scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(34,220/260,0.1,30); camera.position.set(0,0.6,7); camera.lookAt(0,0.65,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0x67769e,2.8));
 const light=new THREE.DirectionalLight(0xffe5ce,3);light.position.set(-3,5,6);scene.add(light);
 body=new THREE.Group();scene.add(body);
 sphere(body,0x182238,0,-0.45,0,.67,.85,.33);
 sphere(body,0xffffff,0,.03,.29,.25,.44,.045);
 const tie=mesh(new THREE.ConeGeometry(.105,.63,4),0x792f40,body,0,-.09,.36);tie.rotation.z=Math.PI;
 sphere(body,0x792f40,0,.25,.35,.085,.09,.055);
 sphere(body,0xba7c59,0,.48,0,.19,.26,.18);
 head=new THREE.Group();head.position.y=1.13;body.add(head);
 sphere(head,0xc68d68,0,0,0,.48,.57,.4);
 sphere(head,0xc68d68,-.48,-.02,0,.09,.15,.1);sphere(head,0xc68d68,.48,-.02,0,.09,.15,.1);
 // Rounded curls, dark brows and a short beard echo the supplied reference.
 for(let i=0;i<28;i++) {const a=i*2.39996;const r=.44*Math.sqrt(i/28);sphere(head,0x251c1a,Math.cos(a)*r,.37+(.44-r)*.4,Math.sin(a)*r,.15,.17,.14);}
 sphere(head,0x342622,0,-.32,.19,.38,.23,.24);
 sphere(head,0xc68d68,0,-.19,.37,.28,.18,.07);
 for(const x of [-.18,.18]) {
 sphere(head,0xffffff,x,.05,.36,.105,.075,.035);sphere(head,0x33251e,x,.05,.393,.046,.052,.025);
 const brow=sphere(head,0x30231e,x,.17,.365,.12,.028,.025);brow.rotation.z=x;
 }
 sphere(head,0xc18a63,0,-.055,.405,.075,.105,.09);
 mouth=sphere(head,0x542e2c,0,-.245,.43,.13,.025,.02);
 function arm(x) { const pivot=new THREE.Group();pivot.position.set(x,.08,0);body.add(pivot);sphere(pivot,0x202b43,0,-.34,0,.19,.47,.2);sphere(pivot,0xc68d68,0,-.82,.015,.145,.19,.12);return pivot; }
 left=arm(-.64);right=arm(.64);
 host.classList.add('has-3d');
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();renderer=null;host.classList.remove('has-3d');});
} catch { canvas.hidden=true; }
function paused() { return reduced.matches || document.documentElement.classList.contains('motion-paused'); }
function frame(now) {
 raf=0; if(hidden || document.hidden || !renderer) return;
 const t=now/1000, still=paused();
 if(now-lastTime>33 || still) {
 lastTime=now;
 body.rotation.y=still?0:Math.sin(t*.7)*.12;
 body.position.y=still?0:Math.sin(t*1.5)*.025;
 head.rotation.z=still?0:Math.sin(t*.9)*.04;
 const wave=!still&&now<wavingUntil;
 left.rotation.z=wave?-2.45+Math.sin(t*9)*.24:pointing?-1.4:-.12;
 right.rotation.z=.12;
 mouth.scale.y=speaking&&!still?.045+Math.abs(Math.sin(t*13))*.07:.025;
 renderer.render(scene,camera);
 }
 if(!paused()) raf=requestAnimationFrame(frame);
}
function stop(){cancelAnimationFrame(raf);raf=0;}
function start(){stop();if(!hidden&&!document.hidden)raf=requestAnimationFrame(frame);}
reduced.addEventListener('change',start);
document.addEventListener('portfolio:motion',start);
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();cancelSpeech();}else start();});
const messages={home:'Welcome! I’m your guide. Scroll to explore Fayaz’s work.',projects:'Explore the projects. Select a study to see its question, approach, and outcome.',about:'Meet Fayaz: the person behind the data and the work.',skills:'Explore the toolkit. Choose a tab to see how each skill becomes an output.',contact:'Have a project in mind? Open the contact form to prepare an email.'};
let current='home';
function updateSection(){
 const ids=Object.keys(messages);let next='home';
 for(const id of ids){const el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<=innerHeight*.45)next=id;}
 if(next!==current){current=next;pointing=next==='projects';host.dataset.section=next;say(messages[next]);start();}
}
let scrollPending=false;
addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(()=>{scrollPending=false;updateSection();});}},{passive:true});
document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{pointing=true;say(`Explore ${button.textContent.trim().replace(/\s+/g,' ')}. Open the study to learn more.`);start();}));
say(messages.home); start();
