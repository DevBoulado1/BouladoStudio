/* script.js - Boulado portfolio
   IMPORTANT:
   - If you want Firestore realtime set the FIREBASE_CONFIG variable below.
   - If you need a proxy for groups API set PROXY_URL (Cloudflare Worker or Vercel function recommended).
*/

/* =========================
   CONFIG (replace these)
   ========================= */
const FIREBASE_CONFIG = null;
/*
  If you want to use Firebase Firestore realtime, replace null with your firebase config object:
  const FIREBASE_CONFIG = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "...",
    measurementId: "..."
  };
*/

const PROXY_URL = null; // e.g. "https://seu-worker.workers.dev/proxy" or "https://seu-projeto.vercel.app/api"

/* =========================
   DEFAULTS / FALLBACK DATA
   ========================= */
const DEFAULT_IMAGE = 'imagem/default-project.png';
const DEFAULT_PROFILE = 'imagem/default-profile.png';

const FALLBACK_PROJECTS = [
  {
    universeId: "1234567",
    gameTitle: "Example Game A",
    gameUrl: "https://www.roblox.com/games/1234567/example-a",
    image: "imagem/sample-game-a.jpg",
    show: true
  },
  {
    universeId: "2345678",
    gameTitle: "Example Game B",
    gameUrl: "https://www.roblox.com/games/2345678/example-b",
    image: "imagem/sample-game-b.jpg",
    show: true
  }
];

const FALLBACK_ANIMATIONS = [
  { title: "Fortnite dance", image: "imagem/sample-anim-1.jpg", url: "#" },
  { title: "Mutation Anims", image: "imagem/sample-anim-2.jpg", url: "#" }
];

const FALLBACK_MY_PROJECTS = [
  { title: "Echoes Of Battle (LOGO)", image: "imagem/sample-project-1.jpg", show: true }
];

const FALLBACK_WORKED = [
  { groupId: "112233", groupTitle: "Exército BR (Demo)", image: "imagem/sample-group.jpg", show: true }
];

/* =========================
   Helpers
   ========================= */
function handleImageError(img){
  img.src = img.classList.contains('profile-img') ? DEFAULT_PROFILE : DEFAULT_IMAGE;
  img.onerror = null;
}

function formatNumber(num){
  return Number(num).toLocaleString("en-US") || "0";
}

/* =========================
   FIREBASE init (optional)
   ========================= */
function initializeFirebase() {
  if(!FIREBASE_CONFIG) return null;
  if(typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded; FIREBASE_CONFIG ignored.');
    return null;
  }
  if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  return firebase.firestore();
}

/* =========================
   NAVIGATION
   ========================= */
function setupNavigation(){
  const sections = document.querySelectorAll(".section");
  const navLinks = document.querySelectorAll(".sidebar nav a");

  function activateSection(targetId){
    sections.forEach(s=>s.classList.remove('active'));
    const el = document.getElementById(targetId);
    if(el) el.classList.add('active');
    navLinks.forEach(l=>l.classList.toggle('active', l.getAttribute('href') === `#${targetId}`));
    el?.scrollIntoView({behavior:'smooth', block:'start'});
    history.pushState(null,null,`#${targetId}`);
  }

  navLinks.forEach(link=>{
    link.addEventListener('click', e=>{
      e.preventDefault();
      activateSection(link.getAttribute('href').substring(1));
    });
  });

  document.getElementById("viewAnimationsBtn")?.addEventListener('click', e=>{
    e.preventDefault();
    activateSection('animations');
  });

  const hash = location.hash.substring(1);
  if(hash && document.getElementById(hash)) activateSection(hash);
  window.addEventListener('popstate', ()=> {
    const h = location.hash.substring(1);
    if(h && document.getElementById(h)) activateSection(h);
  });
}

/* =========================
   Lazy loading images
   ========================= */
function enableLazyLoading(){
  const imgs = document.querySelectorAll('img');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries, obs)=>{
      entries.forEach(ent=>{
        if(ent.isIntersecting){
          const el = ent.target;
          if(el.dataset && el.dataset.src) el.src = el.dataset.src;
          obs.unobserve(el);
        }
      });
    }, {rootMargin:'200px'});
    imgs.forEach(img=>{
      if(img.dataset && img.dataset.src){
        io.observe(img);
      }
    });
  } else {
    imgs.forEach(i=>{
      if(i.dataset && i.dataset.src) i.src = i.dataset.src;
    });
  }
}

/* =========================
   DOM / render helpers
   ========================= */
function createStat(label, id){
  const stat = document.createElement('div'); stat.className = 'stat';
  const value = document.createElement('span'); value.className = 'stat-value'; value.id = id; value.textContent = '0';
  const lab = document.createElement('span'); lab.className = 'stat-label'; lab.textContent = label;
  stat.appendChild(value); stat.appendChild(lab);
  return stat;
}
function updateStatElement(id, value){
  const el = document.getElementById(id);
  if(el){
    el.textContent = typeof value === 'number' ? value.toLocaleString() : value;
    el.classList.add('loaded');
  }
}

function displayProjects(projects, containerId){
  const container = document.getElementById(containerId);
  if(!container) return;
  if(!projects || projects.length === 0){
    container.innerHTML = '<p class="no-projects">No projects available at this time.</p>';
    return;
  }
  container.innerHTML = '';
  projects.forEach(project=>{
    const card = document.createElement('div'); card.className = containerId === 'projectsContainer' ? 'game-card' : 'project-card';
    const link = document.createElement('a'); link.href = project.gameUrl || '#'; link.target='_blank';
    const header = document.createElement('div'); header.className = containerId === 'projectsContainer' ? 'game-header' : 'project-header';
    const title = document.createElement('h3'); title.textContent = containerId==='projectsContainer' ? (project.gameTitle||'Untitled Project') : (project.title||'Untitled');
    header.appendChild(title);
    if(containerId==='projectsContainer'){
      const badge = document.createElement('span'); badge.className = 'game-badge'; badge.textContent='Roblox'; header.appendChild(badge);
    }
    link.appendChild(header);

    if(containerId==='projectsContainer'){
      const stats = document.createElement('div'); stats.className='game-stats';
      const playingStat = createStat('Playing', `playing-${project.universeId||'0'}`);
      const visitsStat = createStat('Visits', `visits-${project.universeId||'0'}`);
      stats.appendChild(playingStat); stats.appendChild(visitsStat);
      link.appendChild(stats);
    }

    const imageDiv = document.createElement('div'); imageDiv.className = containerId==='projectsContainer' ? 'game-image' : 'project-image';
    const img = document.createElement('img');
    img.dataset.src = project.image || DEFAULT_IMAGE;
    img.alt = project.gameTitle || project.title || 'Project image';
    img.onerror = function(){ this.src = DEFAULT_IMAGE };
    imageDiv.appendChild(img);
    link.appendChild(imageDiv);
    card.appendChild(link);
    container.appendChild(card);
  });
  setTimeout(enableLazyLoading, 50);
}

function displayWorkedGroups(groups){
  const container = document.getElementById('workedContainer');
  if(!container) return;
  if(!groups || groups.length === 0){
    container.innerHTML = '<p class="no-projects">No groups available at this time.</p>';
    return;
  }
  container.innerHTML = '';
  groups.forEach(group=>{
    const card = document.createElement('div'); card.className = 'worked-group';
    const link = document.createElement('a'); link.href = group.groupUrl||'#'; link.target='_blank';
    const header = document.createElement('div'); header.className='group-header';
    const title = document.createElement('h3'); title.textContent = group.groupTitle||'Untitled Group';
    header.appendChild(title);
    const badge = document.createElement('span'); badge.className='group-badge'; badge.textContent='Group';
    header.appendChild(badge);
    link.appendChild(header);

    const stats = document.createElement('div'); stats.className='group-stats';
    const membersStat = createStat('Members', `memberCount-${group.groupId||'0'}`);
    stats.appendChild(membersStat);
    link.appendChild(stats);

    const imageDiv = document.createElement('div'); imageDiv.className='group-image';
    const img = document.createElement('img'); img.dataset.src = group.image || DEFAULT_IMAGE;
    img.alt = group.groupTitle || 'Group image'; img.onerror = function(){ this.src = DEFAULT_IMAGE; };
    imageDiv.appendChild(img);
    link.appendChild(imageDiv);
    card.appendChild(link);
    container.appendChild(card);
  });
  setTimeout(enableLazyLoading, 50);
}

function displayAnimations(animations){
  const container = document.getElementById('animationsContainer');
  if(!container) return;
  if(!animations || animations.length === 0){
    container.innerHTML = '<p class="no-projects">No animations available at this time.</p>';
    return;
  }
  container.innerHTML = '';
  animations.forEach(animation=>{
    const card = document.createElement('div'); card.className='animation-card';
    const link = document.createElement('a'); link.href = animation.url||'#'; link.target='_blank';
    const header = document.createElement('div'); header.className='animation-header';
    const title = document.createElement('h3'); title.textContent = animation.title||'Untitled Animation';
    header.appendChild(title); link.appendChild(header);
    const imageDiv = document.createElement('div'); imageDiv.className='animation-image';
    const img = document.createElement('img'); img.dataset.src = animation.image || DEFAULT_IMAGE;
    img.alt = animation.title || 'Animation image'; img.onerror = function(){ this.src = DEFAULT_IMAGE; };
    imageDiv.appendChild(img); link.appendChild(imageDiv); card.appendChild(link); container.appendChild(card);
  });
  setTimeout(enableLazyLoading, 50);
}

/* =========================
   ROBLOX STATS (batch)
   ========================= */
let statsPollingInterval = 9000;
let statsTimer = null;
const statsBackoff = { tries: 0 };

async function fetchAllGameStatsOnce(){
  try{
    const ids = Array.from(document.querySelectorAll('[id^="playing-"]'))
      .map(el => el.id.replace('playing-',''))
      .filter(Boolean);
    if(ids.length === 0) return;
    const unique = Array.from(new Set(ids)).slice(0, 50);
    const url = `https://games.roproxy.com/v1/games?universeIds=${unique.join(',')}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('Failed to fetch game stats');
    const json = await res.json();
    if(json?.data){
      json.data.forEach(game=>{
        if(game.universeId){
          updateStatElement(`playing-${game.universeId}`, game.playing ?? 0);
          updateStatElement(`visits-${game.universeId}`, game.visits ?? 0);
        }
      });
    }
    statsBackoff.tries = 0;
  }catch(err){
    console.error('fetchAllGameStatsOnce error', err);
    statsBackoff.tries++;
    const wait = Math.min(30000, 2000 * Math.pow(2, statsBackoff.tries));
    clearInterval(statsTimer);
    statsTimer = setInterval(fetchAllGameStatsOnce, Math.max(statsPollingInterval, wait));
  }
}
function startStatsPolling(){
  if(statsTimer) clearInterval(statsTimer);
  fetchAllGameStatsOnce();
  statsTimer = setInterval(fetchAllGameStatsOnce, statsPollingInterval);
}

/* =========================
   GROUPS STATS (proxy)
   ========================= */
async function fetchGroupStatsOnce(){
  const memberEls = Array.from(document.querySelectorAll('[id^="memberCount-"]'))
    .map(el => ({id: el.id.replace('memberCount-',''), elId: el.id}));
  if(memberEls.length === 0) return;
  for(const m of memberEls){
    try{
      if(!PROXY_URL) {
        // fallback: try direct fetch (may fail due to CORS)
        const rDirect = await fetch(`https://groups.roblox.com/v1/groups/${m.id}`);
        if(!rDirect.ok) throw new Error('direct groups fetch failed');
        const dataDirect = await rDirect.json();
        if(dataDirect?.memberCount !== undefined) updateStatElement(m.elId, dataDirect.memberCount);
      } else {
        const res = await fetch(`${PROXY_URL}/groups/${m.id}`);
        if(!res.ok) throw new Error('proxy groups failed');
        const data = await res.json();
        if(data?.memberCount !== undefined) updateStatElement(m.elId, data.memberCount);
      }
    }catch(err){
      console.error('fetchGroupStatsOnce', err);
    }
  }
}

/* =========================
   FIRESTORE realtime listeners (optional)
   ========================= */
function installRealtimeListeners(db){
  if(!db) return false;

  db.collection("projects").where("show","==",true).orderBy("createdAt","desc")
    .onSnapshot(snapshot => {
      const projects = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      displayProjects(projects, 'projectsContainer');
      startStatsPolling();
    }, err => console.error('projects snapshot error', err));

  db.collection("animations").where("show","==",true).orderBy("createdAt","desc")
    .onSnapshot(snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      displayAnimations(items);
    }, err => console.error('animations snapshot', err));

  db.collection("myProjects").where("show","==",true).orderBy("createdAt","desc")
    .onSnapshot(snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      displayProjects(items, 'myProjectsContainer');
      startStatsPolling();
    }, err => console.error('myProjects snapshot', err));

  db.collection("worked").where("show","==",true).orderBy("createdAt","desc")
    .onSnapshot(snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      displayWorkedGroups(items);
      fetchGroupStatsOnce();
    }, err => console.error('worked snapshot', err));

  return true;
}

/* =========================
   image rotation
   ========================= */
function initImageRotation(){
  const list = [
    "imagem/showcase.png",
    "imagem/showcase-2.png",
    "imagem/showcase-3.png"
  ];
  const el = document.getElementById('mainImage');
  if(!el) return;
  let i = 0;
  setInterval(()=> {
    i = (i+1) % list.length;
    el.src = list[i];
  }, 3500);
}

/* =========================
   INIT
   ========================= */
function initializePortfolio(){
  try{
    document.getElementById("current-year").textContent = new Date().getFullYear();
    setupNavigation();
    initImageRotation();

    const db = initializeFirebase();
    const haveRealtime = installRealtimeListeners(db);

    // if not using Firestore realtime, use fallback data
    if(!haveRealtime){
      displayProjects(FALLBACK_PROJECTS, 'projectsContainer');
      displayAnimations(FALLBACK_ANIMATIONS);
      displayProjects(FALLBACK_MY_PROJECTS, 'myProjectsContainer');
      displayWorkedGroups(FALLBACK_WORKED);
      // start polling (will attempt games.roproxy and group fetch with proxy if set)
      startStatsPolling();
      setInterval(fetchGroupStatsOnce, 20000);
    }

    document.getElementById("app-loader").style.display = 'none';
    document.querySelector('.container').style.display = 'flex';
  }catch(err){
    console.error('initialize error', err);
    document.getElementById("app-loader").innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><h2>Failed to load portfolio</h2><p>Please refresh the page or try again later.</p><button onclick="window.location.reload()">Reload</button></div>`;
  }
}

if(document.readyState === 'complete' || document.readyState === 'interactive'){
  setTimeout(initializePortfolio, 10);
} else {
  document.addEventListener('DOMContentLoaded', initializePortfolio);
}
