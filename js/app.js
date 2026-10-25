(async function () {
  /* ---------------- PAGE ROUTING ---------------- */
  const pages = document.querySelectorAll('.page');
  const navBtns = document.querySelectorAll('.nav-btn');

  function goPage(id){
    pages.forEach(p => p.classList.toggle('active', p.id === 'page-' + id));
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.page === id));
    window.scrollTo({top:0, behavior:'smooth'});
  }
  navBtns.forEach(b => b.addEventListener('click', () => goPage(b.dataset.page)));
  document.querySelectorAll('.back-link').forEach(b => b.addEventListener('click', (e) => {
    e.preventDefault();
    goPage(b.dataset.page);
  }));
  document.getElementById('headerHome').addEventListener('click', () => goPage('main'));

  /* ---------------- CAROUSEL ---------------- */
  function openSlideBox(s, url, body){
    const box = document.getElementById('slideBoxBody');
    box.innerHTML = `${s.image ? `<img class="slide-box-img" src="${esc(s.image)}" alt="">` : ''}
      ${url ? `<div class="slide-box-link"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(s.linkText || url)} &#8599;</a></div>` : ''}
      <hr class="slide-box-line"><div class="slide-box-text profile-text rich">${toRich(body)}</div>`;
    document.getElementById('slideModal').classList.add('active');
  }
  function initCarousel(slidesData){
    const stage = document.getElementById('carouselStage');
    const ticksWrap = document.getElementById('carouselTicks');
    let current = 0;

    slidesData.forEach((s, i) => {
      const el = document.createElement('div');
      el.className = 'slide' + (i === 0 ? ' active' : '');
      el.style.background = s.image ? `url("${s.image}") center / cover no-repeat, ${s.gradient}` : s.gradient;
      const sUrl = safeUrl(s.link), sBody = isEmptyVal(s.body) ? '' : String(s.body).trim();
      if(sBody || sUrl) el.classList.add('clickable');
      el.addEventListener('click', () => {
        if(sBody){ openSlideBox(s, sUrl, sBody); }
        else if(sUrl){ window.open(sUrl, '_blank', 'noopener'); }
      });
      el.innerHTML = `<div class="slide-overlay">${s.date ? `<div class="date">${esc(s.date)}</div>` : ''}<div class="title">${esc(s.title)}</div></div>`;
      stage.appendChild(el);
      const tick = document.createElement('div');
      tick.className = 'tick' + (i === 0 ? ' active' : '');
      tick.addEventListener('click', () => { setSlide(i, i > current ? 1 : -1); startAuto(); });
      ticksWrap.appendChild(tick);
    });

    function setSlide(i, dir){
      const slides = [...stage.querySelectorAll('.slide')];
      const ticks = ticksWrap.querySelectorAll('.tick');
      const n = slides.length;
      const next = ((i % n) + n) % n;
      if(next === current) return;
      if(!dir) dir = 1;
      const cur = slides[current], nx = slides[next];
      slides.forEach(sl => { if(sl !== cur && sl !== nx){ sl.style.transition = 'none'; sl.style.transform = 'translateX(100%)'; sl.classList.remove('active'); } });
      nx.style.transition = 'none'; nx.style.transform = `translateX(${dir > 0 ? 100 : -100}%)`; void nx.offsetWidth;
      nx.style.transition = ''; nx.style.transform = 'translateX(0)';
      cur.style.transition = ''; cur.style.transform = `translateX(${dir > 0 ? -100 : 100}%)`;
      cur.classList.remove('active'); nx.classList.add('active');
      current = next;
      ticks.forEach((t, idx) => t.classList.toggle('active', idx === current));
    }
    if(slidesData.length < 2){ document.getElementById('bannerPrev').style.visibility = 'hidden'; document.getElementById('bannerNext').style.visibility = 'hidden'; }
    let autoTimer = null;
    const startAuto = () => { clearInterval(autoTimer); if(slidesData.length > 1) autoTimer = setInterval(() => setSlide(current + 1, 1), 5000); };
    document.getElementById('bannerPrev').addEventListener('click', () => { setSlide(current - 1, -1); startAuto(); });
    document.getElementById('bannerNext').addEventListener('click', () => { setSlide(current + 1, 1); startAuto(); });
    stage.addEventListener('mouseenter', () => clearInterval(autoTimer));
    stage.addEventListener('mouseleave', startAuto);
    startAuto();
  }

  /* ---------------- COLOR HELPERS ---------------- */
  function shade(hex, percent){
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00FF) + percent;
    let b = (num & 0x0000FF) + percent;
    r = Math.max(Math.min(255, r), 0);
    g = Math.max(Math.min(255, g), 0);
    b = Math.max(Math.min(255, b), 0);
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  }
  function colorGradient(hex){
    return `linear-gradient(155deg, ${shade(hex, 45)} 0%, ${hex} 55%, ${shade(hex, -55)} 100%)`;
  }

  const colorMap = {
    '레드':'#d64545', '옐로우':'#e0b23c', '그린':'#4f9c5e', '블루':'#3f6fb0', '브라운':'#8a5a3a',
    '오렌지':'#e0812f', '핑크':'#d1638f', '퍼플':'#7d5fa6', '민트':'#4fb3a0', '네이비':'#34497a',
    '라임':'#9cbf3f', '그레이':'#8a8a8a', '스카이':'#4fa3d1', '와인':'#7a3f4f', '코랄':'#e0705a',
    '블랙':'#202020', '화이트':'#ffffff', '버밀리온':'#e34234', '시안':'#22b8cf', '마젠타':'#c2368a',
    '틸 그린':'#2f8f7a', '콘플라워블루':'#6699e0', '앰버':'#d99a2b', '딥 레드':'#8b2020',
    '크림':'#eaddb8', '로지브라운':'#b98a86', '비스터 브라운':'#4a3423', '로얄블루':'#3454c9',
    '골드':'#c9a227', '마룬':'#6e1f2b', '스페이스':'#232323', '하트':'#d1454f', '다이아몬드':'#c9576a'
  };

  /* ---------------- 저장소 설정 / 공용 유틸 ---------------- */
  const GH_OWNER = 'xowonim';
  const GH_REPO = 'ymkb';
  const GH_BRANCH = 'main';
  const CHAR_DIR = 'data/characters';
  const TOKEN_KEY = 'ymkb_gh_token';
  const OWNERS = ['도원', '세잇', '해원', '호원'];

  function getToken(){ try { return localStorage.getItem(TOKEN_KEY) || ''; } catch(e){ return ''; } }
  function setToken(t){
    try { if(t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch(e){}
  }
  function esc(v){
    return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escDeep(o){
    if(typeof o === 'string') return esc(o);
    if(o && typeof o === 'object') { const r = {}; Object.keys(o).forEach(k => r[k] = escDeep(o[k])); return r; }
    return o;
  }
  function mergeProfile(base, custom){
    const out = JSON.parse(JSON.stringify(base));
    Object.keys(custom || {}).forEach(k => {
      if(out[k] && typeof out[k] === 'object' && custom[k] && typeof custom[k] === 'object') Object.assign(out[k], custom[k]);
      else if(custom[k] !== undefined) out[k] = custom[k];
    });
    return out;
  }

  const TEMPLATE_PATH = 'data/templates.json';
  const FIELD_TYPES = { text:'텍스트', tags:'태그', textarea:'긴 글', collapse:'접기 글', rating:'별점', gallery:'갤러리' };
  // oc의 YMKB 세계관 항목을 그대로 가져온 기본 틀. 오너 네 명이 처음에는 똑같은 템플릿을 가진다.
  const DEFAULT_FIELDS = [{"key": "name", "label": "이름", "type": "text", "core": true}, {"key": "f_1790459852228", "label": "영어 / 한자 이름", "type": "text"}, {"key": "f_1790459909805", "label": "나이", "type": "text"}, {"key": "f_1790485356104", "label": "생일", "type": "text"}, {"key": "f_1790485416027", "label": "신체", "type": "text"}, {"key": "f_1790460026132", "label": "학과", "type": "text"}, {"key": "f_1790460191966", "label": "학년", "type": "text"}, {"key": "f_1790477497994", "label": "학급", "type": "text"}, {"key": "f_1790484073611", "label": "소속", "type": "tags"}, {"key": "f_1790484157581", "label": "동아리", "type": "text"}, {"key": "f_1790484238483", "label": "학생회", "type": "text"}, {"key": "f_1790484328878", "label": "기숙사", "type": "text"}, {"key": "f_1790484388805", "label": "소개", "type": "textarea"}, {"key": "f_1790484546744", "label": "성격", "type": "textarea"}, {"key": "f_1790484621408", "label": "좋아하는 음식", "type": "text"}, {"key": "f_1790484726646", "label": "좋아하는 것", "type": "text"}, {"key": "f_1790484814456", "label": "좋아하는 사람", "type": "text"}, {"key": "f_1790484946547", "label": "싫어하는 음식", "type": "text"}, {"key": "f_1790484951928", "label": "싫어하는 것", "type": "text"}, {"key": "f_1790484957343", "label": "싫어하는 사람", "type": "text"}, {"key": "f_1790484965565", "label": "여담", "type": "textarea"}, {"key": "f_1790490251818", "label": "캐릭터 이야기 1", "type": "collapse"}, {"key": "f_1790490342827", "label": "보컬", "type": "rating"}, {"key": "f_1790492405183", "label": "정신력", "type": "rating"}, {"key": "f_1790492376210", "label": "무용", "type": "rating"}, {"key": "f_1790492415019", "label": "눈치", "type": "rating"}, {"key": "f_1790492385635", "label": "연기", "type": "rating"}, {"key": "f_1790492423525", "label": "성적", "type": "rating"}, {"key": "f_1790492394900", "label": "체력", "type": "rating"}];
  const OWNER_IDS = ['dowon', 'seit', 'haewon', 'howon'];
  const SITE_PATH = 'data/site.json';
  const DEFAULT_SLIDE = { id:'s0', date:'', title:'plz wait a little bit of..♡', image:null };
  const SLIDE_GRADIENT = 'linear-gradient(160deg,#c6b8d4,#9B85AD)';
  const PAGE_KEYS = [['counsel','COUNCIL'], ['agency','DORMITORY'], ['etc','ETC']];
  const SITE_DEFAULTS = { title:'유메키보고등학교', subtitle:'YUMEKIBO HIGH SCHOOL', youtube:'https://youtube.com/@ymkbhighschool', soundcloud:'https://soundcloud.com/ymkbofficial', footer:'© ymkb high school', logo:null, logoV:null, favicon:null, faviconV:null, slides:[DEFAULT_SLIDE], pages:{}, council:{
    president:'하츠키 세이시', vice:'이자요이 키츠네',
    reps:[{name:'센코 이치고',label:'3-A'},{name:'니시 케이쇼',label:'3-B'},{name:'나카스 헤이지',label:'2-A'},{name:'사쿠라 시류',label:'2-B'},{name:'카미하츠 마모루',label:'1-A'},{name:'나미카와 류',label:'1-B'},{name:'에나미 큐',label:'中-A'},{name:'시이나 이나',label:'中-B'}],
    depts:[{name:'미요시 아로마',label:'회계'},{name:'아오키 켄',label:'관리팀장'},{name:'나미카와 우미',label:'도서팀장'},{name:'아라키 카이로',label:'미화팀장'},{name:'토오노 아야토',label:'홍보팀장'},{name:'나카아키 세츠나',label:'방송팀장'}],
    broadcast:[{name:'나카아키 세츠나'},{name:'이즈미 테이'},{name:'하나나시 사나기'},{name:'유키무라 카논'}]
  } };

  const GROUP_DIR = 'data/groups';
  function apiHeaders(){ const h = { Accept:'application/vnd.github+json' }; const t = getToken(); if(t) h.Authorization = 'Bearer ' + t; return h; }
  async function ghGet(url){
    const h = apiHeaders();
    let res = await fetch(url, { headers:h, cache:'no-cache' });
    if((res.status === 401 || res.status === 403) && h.Authorization){
      res = await fetch(url, { headers:{ Accept:h.Accept }, cache:'no-cache' });
    }
    return res;
  }
  // 방금 올린 이미지는 깃허브에 퍼지기까지 몇 초 걸릴 수 있어서, 올린 직후에는 내 브라우저가 가진 사본을 먼저 보여준다.
  function freshImg(path){
    path = assetPath(path);
    try { const j = JSON.parse(sessionStorage.getItem('ymkb_img_' + path)); if(j && Date.now() - j.t < 600000) return j.u; } catch(e){}
    return null;
  }
  function rememberImg(path, base64){
    const ext = (path.split('.').pop() || 'png').toLowerCase();
    const mime = ext === 'jpg' ? 'image/jpeg' : 'image/' + ext;
    try { sessionStorage.setItem('ymkb_img_' + path, JSON.stringify({ t:Date.now(), u:`data:${mime};base64,${base64}` })); } catch(e){}
  }
  // 이미지는 항상 assets 폴더 안에서만 찾는다.
  function assetPath(p){ return p ? (String(p).startsWith('assets/') ? String(p) : 'assets/' + String(p).replace(/^\/+/, '')) : p; }
  // 이미지가 안 뜨면 깨진 그림은 숨기고, 같은 주소를 몇 번 다시 불러본다.
  window.__imgErr = function(img){
    const n = (+img.dataset.try || 0) + 1; img.dataset.try = n;
    img.style.visibility = 'hidden';
    if(n > 4){ img.style.display = 'none'; return; }
    if(!img.dataset.base){ img.dataset.base = img.getAttribute('src'); img.onload = () => { img.style.visibility = ''; }; }
    const base = img.dataset.base;
    setTimeout(() => { img.src = base + (base.includes('?') ? '&' : '?') + 'r=' + n; }, 1000 * n);
  };
  function cacheGet(k){ try { return JSON.parse(localStorage.getItem('ymkb_cache_' + k)); } catch(e){ return null; } }
  function cacheSet(k, v){ try { localStorage.setItem('ymkb_cache_' + k, JSON.stringify(v)); } catch(e){} }

  // 캐시가 있으면 바로 보여주고, 뒤에서 최신 내용을 확인한다. 달라졌을 때만 한 번 새로 고친다.
  const stripSha = (v) => JSON.stringify(v, (k, x) => k === '_sha' ? undefined : x);
  // 바뀐 내용을 발견했는데 지금은 다시 불러올 수 없는 때(창이 열려 있거나, 방금 한 번 불러온 직후)에는 잠시 뒤에 다시 시도한다.
  let autoReloadTries = 0, autoReloadTimer = null;
  function autoReloadSoon(){
    if(canAutoReload()){ reloadKeepingView(); return; }
    if(autoReloadTimer || autoReloadTries >= 8) return;
    autoReloadTimer = setTimeout(() => { autoReloadTimer = null; autoReloadTries++; autoReloadSoon(); }, 4000);
  }
  function canAutoReload(){
    if(document.querySelector('.modal-overlay.active')) return false;
    try {
      const t = +sessionStorage.getItem('ymkb_rl') || 0;
      if(Date.now() - t < 15000) return false;
      sessionStorage.setItem('ymkb_rl', String(Date.now()));
    } catch(e){ return false; }
    return true;
  }
  // 내가 방금 저장한 파일은 깃허브 쪽 목록이 아직 옛날 내용을 줄 수 있으니, 3분 동안은 내가 저장한 내용을 우선한다.
  const RECENT_KEY = 'ymkb_recent', RECENT_TTL = 180000;
  function recentGet(){
    try {
      const m = JSON.parse(localStorage.getItem(RECENT_KEY)) || {}; const now = Date.now();
      Object.keys(m).forEach(p => { if(now - m[p].t > RECENT_TTL) delete m[p]; });
      return m;
    } catch(e){ return {}; }
  }
  function recentSet(path, obj){
    try { const m = recentGet(); m[path] = { t:Date.now(), obj:obj === undefined ? null : obj }; localStorage.setItem(RECENT_KEY, JSON.stringify(m)); } catch(e){}
  }
  function applyRecent(key, v){
    try {
      const m = recentGet(), paths = Object.keys(m);
      if(!paths.length) return v;
      const single = { templates:'data/templates.json', site:'data/site.json', classes:'data/classes.json' };
      if(single[key]){ const r = m[single[key]]; return r && r.obj ? JSON.parse(JSON.stringify(r.obj)) : v; }
      if(key === 'chars' || key === 'groups'){
        const dir = key === 'chars' ? 'data/characters' : 'data/groups';
        const out = Object.assign({}, v);
        paths.filter(p => p.startsWith(dir + '/')).forEach(p => {
          Object.keys(out).forEach(k => { if(out[k] && out[k]._path === p) delete out[k]; });
          const o = m[p].obj;
          if(o && o.name){
            const c = JSON.parse(JSON.stringify(o)); c._path = p; c.id = c.id || p.split('/').pop().replace(/\.json$/, '');
            out[key === 'chars' ? c.name : c.id] = c;
          }
        });
        return out;
      }
    } catch(e){}
    return v;
  }
  let swrNoticed = false;
  function swrFailNotice(){
    if(swrNoticed) return; swrNoticed = true;
    setTimeout(() => { showToast('최신 내용을 불러오지 못했어요. 깃허브 요청 한도에 걸렸을 수 있어요. 잠시 뒤 다시 열어 주세요.', 6000); }, 600);
  }
  function swr(key, fetcher){
    const cached = cacheGet(key);
    const before = cached !== null ? stripSha(cached) : null;
    const live = fetcher().then((v) => {
      if(v === undefined || v === null) return cached;
      v = applyRecent(key, v);
      cacheSet(key, v);
      if(before !== null && stripSha(v) !== before) autoReloadSoon();
      return v;
    }).catch((err) => { console.warn(key + ' 를 불러오지 못했어요.', err); if(/ (403|429)\b/.test(String(err && err.message))) swrFailNotice(); return cached; });
    return cached !== null ? Promise.resolve(cached) : live;
  }
  function fetchJsonDir(dir, cacheKey, idFrom){
    return swr(cacheKey, async () => {
      const res = await ghGet(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${dir}?ref=${GH_BRANCH}`);
      if(res.status === 404) return {};
      if(!res.ok) throw new Error('목록 실패 ' + res.status);
      const entries = await res.json();
      if(!Array.isArray(entries)) throw new Error('형식 오류');
      const files = entries.filter(e => e.type === 'file' && e.name.endsWith('.json') && !e.name.startsWith('_'));
      const list = await Promise.all(files.map(async f => {
        const r = await fetch(`${f.download_url}?v=${f.sha}`);
        if(!r.ok) throw new Error('파일 실패 ' + r.status);
        const d = await r.json();
        d._path = f.path; d._sha = f.sha; d.id = d.id || f.name.replace(/\.json$/, '');
        return d;
      }));
      const map = {};
      list.filter(c => c && c.name).forEach(c => { map[idFrom(c)] = c; });
      return map;
    }).then(v => v || {});
  }
  // 저장하자마자 화면에 반영되도록, 저장한 내용을 캐시에도 바로 넣어 둔다.
  function cacheTouch(path, obj){
    if(path.endsWith('.json')) recentSet(path, obj ? JSON.parse(JSON.stringify(obj)) : null);
    try {
      const isChar = path.startsWith(CHAR_DIR + '/'), isGroup = path.startsWith(GROUP_DIR + '/');
      if(isChar || isGroup){
        const key = isChar ? 'chars' : 'groups';
        const map = cacheGet(key) || {};
        Object.keys(map).forEach(k => { if(map[k]._path === path) delete map[k]; });
        if(obj && obj.name){
          obj._path = path;
          obj.id = obj.id || path.split('/').pop().replace(/\.json$/, '');
          map[isChar ? obj.name : obj.id] = obj;
        }
        cacheSet(key, map);
      } else if(path === TEMPLATE_PATH){ if(Array.isArray(obj)) cacheSet('templates', obj); }
      else if(path === SITE_PATH){ if(obj && typeof obj === 'object') cacheSet('site', obj); }
      else if(path === 'data/classes.json'){ if(Array.isArray(obj)) cacheSet('classes', obj); }
    } catch(e){}
  }
  function fetchOwnCharacters(){ return fetchJsonDir(CHAR_DIR, 'chars', c => c.name); }
  function fetchGroupFiles(){ return fetchJsonDir(GROUP_DIR, 'groups', g => g.id); }

  function loadClasses(){
    return swr('classes', async () => {
      for(const u of [`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/data/classes.json?t=${Date.now()}`, `data/classes.json?t=${Date.now()}`]){
        try { const r = await fetch(u, { cache:'no-store' }); if(r.ok){ const j = await r.json(); if(Array.isArray(j)) return j; } } catch(e){}
      }
      throw new Error('classes');
    }).then(v => v || fetch('data/classes.json').then(r => r.json()));
  }
  // 서로 기다리지 않도록, 필요한 원격 데이터를 한꺼번에 먼저 요청한다.
  const remoteP = {
    data: Promise.all([
      fetch('data/groups.json').then((r) => r.json()),
      loadClasses(),
      fetch('data/profiles.json').then((r) => r.json())
    ]),
    chars: fetchOwnCharacters(),
    templates: loadTemplates(),
    site: loadSite(),
    groups: fetchGroupFiles()
  };

  /* ---------------- OC 연동 (호원 담당 캐릭터의 사진·기본 정보를 oc 저장소에서 가져오기) ----------------
     oc 쪽 "YMKB" 카테고리에 등록된 캐릭터와 이름이 똑같으면, 그 캐릭터의 사진과 나이 정보를
     oc 쪽 것으로 덮어써서 보여준다. oc 파일은 전혀 건드리지 않고 읽기만 한다. */
  const OC_OWNER = 'xowonim';
  const OC_REPO = 'oc';
  const OC_BRANCH = 'main';
  let ocOverrides = {};
  let ocFields = []; // oc의 YMKB 세계관 항목 정의 (키 -> 라벨 대응용)
  const ocStatus = { error:'', listCount:0, worldFound:false, charCount:0 };

  function ocAssetUrl(path) {
    if (!path) return path;
    return `https://raw.githubusercontent.com/${OC_OWNER}/${OC_REPO}/${OC_BRANCH}/${path}`;
  }

  async function fetchOcYmkbCharacters() {
    try {
      const listUrl = `https://api.github.com/repos/${OC_OWNER}/${OC_REPO}/contents/data/characters?ref=${OC_BRANCH}`;
      const listRes = await ghGet(listUrl);
      if (!listRes.ok) throw new Error('oc 캐릭터 목록을 불러오지 못했습니다 (' + listRes.status + ')');
      const entries = await listRes.json();
      if (!Array.isArray(entries)) throw new Error('oc 캐릭터 목록 형식 오류');
      const jsonFiles = entries.filter((e) => e.type === 'file' && e.name.endsWith('.json') && !e.name.startsWith('_'));
      ocStatus.listCount = jsonFiles.length;
      const all = await Promise.all(
        jsonFiles.map(async (f) => {
          try {
            const raw = await fetch(`${f.download_url}${f.download_url.includes('?') ? '&' : '?'}v=${f.sha || Date.now()}`);
            const j = await raw.json();
            if(j && typeof j === 'object') j._path = f.path;
            return j;
          } catch (e) {
            console.warn('oc 캐릭터 파일을 불러오지 못했어요:', f.name, e);
            return null;
          }
        })
      );
      // oc의 세계관 id는 'w_숫자' 형태라서, worlds.json에서 이름이 YMKB인 세계관의 id를 찾아 쓴다.
      let ymkbWorldIds = ['ymkb'];
      try {
        const wr = await fetch(`https://raw.githubusercontent.com/${OC_OWNER}/${OC_REPO}/${OC_BRANCH}/data/worlds.json?t=${Date.now()}`);
        const wj = await wr.json();
        const list = Array.isArray(wj) ? wj : (wj.worlds || []);
        const ids = list.filter((w) => [w.id, w.name, w.shortName].some((v) => String(v || '').toLowerCase() === 'ymkb')).map((w) => w.id);
        if (ids.length){ ymkbWorldIds = ids; ocStatus.worldFound = true; }
        const yw = list.find((w) => ids.includes(w.id));
        if (yw) ocFields = yw.fields || [];
      } catch (e) { console.warn('oc 세계관 목록을 불러오지 못했어요.', e); }
      const byName = {};
      all.filter(Boolean)
        .filter((c) => ymkbWorldIds.includes(c.world))
        .forEach((c) => { byName[c.name] = c; });
      ocStatus.charCount = Object.keys(byName).length;
      cacheSet('oc', { byName, fields:ocFields });
      return byName;
    } catch (err) {
      ocStatus.error = String((err && err.message) || err);
      console.warn('oc 연동에 실패해서, 저장된 이전 내용을 사용합니다.', err);
      const c = cacheGet('oc');
      if(c && c.byName){ ocFields = c.fields || []; ocStatus.cached = true; ocStatus.charCount = Object.keys(c.byName).length; return c.byName; }
      return {};
    }
  }

  // 그룹/학급 상세나 프로필을 열 때, oc 데이터를 다 가져올 때까지만 살짝 기다린다.
  // (보통 클릭하기 전에 이미 끝나있어서 체감되는 지연은 없다.)
  // 탭으로 돌아왔을 때, 한동안 비워 두었다면 다른 사람이 바꾼 내용을 가져온다.
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if(document.hidden){ hiddenAt = Date.now(); return; }
    if(hiddenAt && Date.now() - hiddenAt > 60000 && canAutoReload()) reloadKeepingView();
  });
  let ownersReady = false;
  const ocCached = cacheGet('oc');
  const ocLive = fetchOcYmkbCharacters().then((map) => { ocOverrides = map; return map; });
  if(ocCached && ocCached.byName){
    ocOverrides = ocCached.byName; ocFields = ocCached.fields || [];
    ocStatus.cached = true; ocStatus.charCount = Object.keys(ocCached.byName).length;
  }
  const ocBefore = ocCached ? stripSha(ocCached.byName) : null;
  const ocReadyPromise = (ocCached && ocCached.byName ? Promise.resolve() : ocLive.then(() => {}));
  ocLive.then((map) => { if(ownersReady) filterOcByOwner();
    if(ocBefore !== null && !ocStatus.error && stripSha(map) !== ocBefore) autoReloadSoon(); });

  /* ---------------- 데이터 불러오기 (groups / classes / profiles) ----------------
     예전에는 이 셋이 코드 안에 통째로 박혀있었는데, 이제 data 폴더의 JSON 파일로 분리했다.
     깃허브 페이지가 같은 저장소에서 서빙하는 파일이라 그냥 상대경로로 fetch하면 된다. */
  const [groups, classes, characterProfiles] = await remoteP.data;

  /* ---------------- ymkb 자체 캐릭터 파일 (data/characters/*.json, 파일 하나 = 캐릭터 한 명) ---------------- */
  const charFiles = await remoteP.chars;

  /* ---------------- 프로필 템플릿 (data/templates.json) ---------------- */
  function defaultTemplates(){
    return OWNERS.map((o, i) => ({ id:'t_' + OWNER_IDS[i], name:o, fields:JSON.parse(JSON.stringify(DEFAULT_FIELDS)) }));
  }
  function loadTemplates(){
    return swr('templates', async () => {
      for(const u of [`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${TEMPLATE_PATH}?t=${Date.now()}`, `${TEMPLATE_PATH}?t=${Date.now()}`]){
        try { const r = await fetch(u, { cache:'no-store' }); if(r.ok){ const j = await r.json(); if(Array.isArray(j) && j.length) return j; } } catch(e){}
      }
      throw new Error('templates');
    }).then(v => v || defaultTemplates());
  }
  // 호원 템플릿은 oc에서 불러온 프로필 항목을 따로 갖지 않는다. 기본 항목은 비우고, 직접 추가한 항목(ymkb 전용)만 남긴다.
  const DEFAULT_KEYS = new Set(DEFAULT_FIELDS.map(f => f.key));
  function normalizeTemplates(arr){
    (arr || []).forEach(t => { if(t && t.name === '호원' && Array.isArray(t.fields)) t.fields = t.fields.filter(f => f.core || !DEFAULT_KEYS.has(f.key)); });
    return arr;
  }
  let templates = normalizeTemplates(await remoteP.templates);

  // 에디터에서 넣은 사진은 '저장'을 눌러야 올라간다. 그 전까지는 이 브라우저 안에서만 들고 있는다.
  const pendImgs = {};
  const RICH_OK = ['b','i','u','s','strike','del','strong','em','br','div','p','span','h3'];
  const rtToolbarHtml = () => '<div class="rt-toolbar"><button type="button" data-rt="bold" title="굵게"><b>B</b></button><button type="button" data-rt="italic" title="기울임"><i>I</i></button><button type="button" data-rt="underline" title="밑줄"><u>U</u></button><button type="button" data-rt="strikeThrough" title="취소선"><s>S</s></button><button type="button" data-rt="header" title="제목">H</button><button type="button" data-rt="removeFormat">서식 지우기</button></div>';
  function rtExec(cmd){
    if(cmd === 'header'){
      const sel = window.getSelection(); let n = sel && sel.anchorNode; if(n && n.nodeType === 3) n = n.parentNode;
      const inH = n && n.closest && n.closest('h3');
      document.execCommand('formatBlock', false, inH ? 'div' : 'h3');
    } else document.execCommand(cmd, false, null);
  }

  /* ---------------- 사이트 설정 (data/site.json): 제목, 링크, 푸터, 로고, 캐러셀, 빈 페이지 본문 ---------------- */
  function loadSite(){
    return swr('site', async () => {
      for(const u of [`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${SITE_PATH}?t=${Date.now()}`, `${SITE_PATH}?t=${Date.now()}`]){
        try { const r = await fetch(u, { cache:'no-store' }); if(r.ok){ const j = await r.json(); if(j && typeof j === 'object') return j; } } catch(e){}
      }
      throw new Error('site');
    }).then(v => v || {});
  }
  function rawUrl(path, v){ const f = freshImg(path); if(f) return f; return `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${assetPath(path)}?v=${v || ''}`; }
  const siteRaw = await remoteP.site;
  const site = Object.assign({}, SITE_DEFAULTS, siteRaw);
  Object.assign(colorMap, site.colors || {});
  const orderMap = (site.order && typeof site.order === 'object') ? JSON.parse(JSON.stringify(site.order)) : {};
  function applyOrder(list, keyFn, key){
    const ord = orderMap[key];
    if(!Array.isArray(ord) || !ord.length) return list;
    const idx = new Map(ord.map((k, i) => [k, i]));
    return list.map((x, i) => [x, i]).sort((a, b) => {
      const ia = idx.has(keyFn(a[0])) ? idx.get(keyFn(a[0])) : 1e6 + a[1];
      const ib = idx.has(keyFn(b[0])) ? idx.get(keyFn(b[0])) : 1e6 + b[1];
      return ia - ib;
    }).map(x => x[0]);
  }
  const hiddenColors = new Set(Array.isArray(site.hiddenColors) ? site.hiddenColors : []);
  // 무지개 순서(빨강 → 주황 → 노랑 → 초록 → 파랑 → 보라 → 분홍)로 정렬하고, 무채색(화이트/그레이/블랙)은 맨 뒤로 보낸다.
  function colorSortKey(name){
    const hex = (colorMap[name] || '#888888').replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if(sat < 0.18 || l > 0.96 || l < 0.08) return [1, -l, 0];
    let h = d === 0 ? 0 : mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    return [0, (h + 15) % 360, -l];
  }
  function sortColors(names){
    return names.slice().sort((a, b) => {
      const x = colorSortKey(a), y = colorSortKey(b);
      return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
    });
  }
  function pickableColors(keep){ return sortColors(Object.keys(colorMap).filter(c => !hiddenColors.has(c) || (keep || []).includes(c))); }
  if(!Array.isArray(site.slides) || !site.slides.length) site.slides = [DEFAULT_SLIDE];
  site.pages = site.pages || {};

  const SNS_ICONS = {
    yt:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.9 4 12 4 12 4s-3.9 0-6.7.2c-.4 0-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2.2 9 2.2 10.7v1.6c0 1.7.2 3.5.2 3.5s.2 1.5.8 2.1c.8.8 1.9.8 2.4.9C7.5 19 12 19 12 19s3.9 0 6.7-.2c.4 0 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.7.2-3.5v-1.6c0-1.7-.2-3.5-.2-3.5zM9.9 14.6V8.9l5.4 2.9-5.4 2.8z"/></svg>',
    sc:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2 15.5c0 1.9 1.6 3.5 3.5 3.5H18c2.2 0 4-1.8 4-4 0-1.9-1.4-3.5-3.2-3.9-.3-2.8-2.6-5-5.5-5-2 0-3.7 1.1-4.6 2.7-.2 0-.3-.1-.5-.1C6 8.7 4.4 10.2 4.2 12.1 2.9 12.5 2 13.9 2 15.5z"/></svg>',
    etc:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>'
  };
  // SNS 목록: 새 형식(sns)이 없으면 예전 YouTube/Soundcloud 칸으로 만든다.
  function snsOf(st){
    if(Array.isArray(st.sns)) return st.sns.filter(x => x && (x.name || x.url));
    return [{ name:'YouTube', url:st.youtube || '' }, { name:'Soundcloud', url:st.soundcloud || '' }].filter(x => x.url);
  }
  (function applySite(){
    document.querySelector('.title-bar h1').textContent = site.title;
    document.querySelector('.title-bar span').textContent = site.subtitle;
    const snsList = snsOf(site);
    const side = document.querySelector('.side-col');
    if(side) side.innerHTML = snsList.map(x => {
      const kind = /youtube|youtu\.be/i.test(x.url + x.name) ? 'yt' : /soundcloud/i.test(x.url + x.name) ? 'sc' : 'etc';
      const icon = kind === 'yt' ? SNS_ICONS.yt : kind === 'sc' ? SNS_ICONS.sc : SNS_ICONS.etc;
      return `<a class="link-row" href="${esc(safeUrl(x.url) || '#')}" target="_blank" rel="noopener noreferrer" title="${esc(x.name)}" aria-label="${esc(x.name)}"><div class="icon-box ${kind}">${icon}</div><span>${esc(x.name)}</span></a>`;
    }).join('');
    document.querySelector('footer').textContent = site.footer;
    if(site.favicon){
      let fl = document.querySelector('link[rel~="icon"]');
      if(!fl){ fl = document.createElement('link'); fl.rel = 'icon'; document.head.appendChild(fl); }
      fl.href = rawUrl(site.favicon, site.faviconV);
    }
    if(site.logo) document.querySelector('.logo').innerHTML = `<img src="${esc(rawUrl(site.logo, site.logoV))}" alt="" onerror="window.__imgErr(this)">`;
    PAGE_KEYS.forEach(([k, label]) => {
      const box = document.querySelector(`#page-${k} .placeholder`);
      const pg = site.pages[k];
      if(!box || !pg) return;
      if(pg.title) box.querySelector('h2').textContent = pg.title;
      if(!isEmptyVal(pg.body)) box.innerHTML = `<h2>${esc(pg.title || label)}</h2><div class="profile-text rich page-body">${toRich(pg.body)}</div>`;
    });
    initCarousel(site.slides.map(sl => ({ date:sl.date || '', title:sl.title || '', gradient:SLIDE_GRADIENT, image:sl.image ? rawUrl(sl.image, sl.imageV) : null, link:sl.link || '', linkText:sl.linkText || '', body:sl.body || '' })));
  })();

  /* 값 정리용 유틸: 리치 텍스트는 허용한 태그만 남기고 속성은 모두 지운다. */
  function cleanHtml(html){
    const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
    const walk = (node) => {
      let out = '';
      node.childNodes.forEach(n => {
        if(n.nodeType === 3) out += esc(n.nodeValue).replace(/&quot;/g, '"');
        else if(n.nodeType === 1){
          const t = n.tagName.toLowerCase();
          if(t === 'script' || t === 'style') return;
          if(t === 'br') out += '<br>';
          else if(t === 'img'){ const srcAttr = n.getAttribute('src') || ''; const pid = n.getAttribute('data-pend') || (srcAttr.startsWith('pending:') ? srcAttr.slice(8) : ''); const ip = n.getAttribute('data-path') || n.getAttribute('src') || ''; if(pid){ if(pendImgs[pid]) out += `<img src="pending:${pid}">`; } else if(/^assets\/[\w\-.\/]+$/.test(ip) && !ip.includes('..')) out += `<img src="${ip}">`; }
          else if(RICH_OK.includes(t)) out += `<${t}>${walk(n)}</${t}>`;
          else out += walk(n);
        }
      });
      return out;
    };
    return walk(doc.body);
  }
  function toRich(v){
    const str = String(v == null ? '' : v);
    if(/<\/?[a-z][^>]*>/i.test(str)) return cleanHtml(str).replace(/<img src="pending:(\w+)">/g, (m0, pid) => pendImgs[pid] ? `<img src="${pendImgs[pid].url}" data-pend="${pid}">` : '').replace(/<img src="(assets\/[^"]+)">/g, (m0, ip) => `<img src="${esc(rawUrl(ip))}" data-path="${ip}" loading="lazy" onerror="window.__imgErr(this)">`);
    return esc(str).replace(/\n/g, '<br>');
  }
  function isEmptyVal(v){
    if(v === undefined || v === null) return true;
    if(Array.isArray(v)) return v.length === 0;
    if(typeof v === 'number') return false;
    return String(v).replace(/<(?!img )[^>]*>/g, '').trim() === '';
  }

  /* ---------------- 그룹 파일 (data/groups/*.json): 기존 그룹을 덮어쓰거나 새 그룹을 추가 ---------------- */
  function slugOf(str){ return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  const groupFiles = await remoteP.groups;
  const groupRename = {};
  groups.forEach(g => { g.id = slugOf(g.name) || ('g-' + Math.random().toString(36).slice(2, 7)); g.base = true; });
  Object.values(groupFiles).forEach(gf => {
    if(gf.deleted){ const di = groups.findIndex(x => x.id === gf.id); if(di >= 0) groups.splice(di, 1); return; }
    const g = groups.find(x => x.id === gf.id);
    if(g){
      if(g.name !== gf.name) groupRename[g.name] = gf.name;
      ['name','concept','genre','fandom','intro','image','imageV','discography'].forEach(k => { if(gf[k] !== undefined) g[k] = gf[k]; });
      if(Array.isArray(gf.colors)) g.colors = gf.colors;
      g.file = gf;
    } else {
      groups.push({ id:gf.id, name:gf.name, colors:Array.isArray(gf.colors) ? gf.colors : [], concept:gf.concept || '', genre:gf.genre || '', fandom:gf.fandom || '', intro:gf.intro || '', image:gf.image || null, imageV:gf.imageV || null, discography:Array.isArray(gf.discography) ? gf.discography : [], members:[], manager:null, base:false, file:gf });
    }
  });

  groups.splice(0, groups.length, ...applyOrder(groups, g => g.id, 'groups'));

  // 캐릭터 파일의 내용을 그룹 데이터에 반영한다. 기존 캐릭터(groups.json)는 file(영어명) 또는 이름으로 찾아서
  // 이름·그룹·역할·컬러를 덮어쓰고, 처음 보는 캐릭터는 지정한 그룹에 추가한다. 역할이 '매니저'면 매니저 칸으로 간다.
  const renames = {};
  const deletedNames = new Set();
  // 예전에 groups.json에 적어 둔 역할과 매니저 설정은 쓰지 않는다. 역할은 캐릭터 프로필의 체크박스(리더/매니저)로만 정한다.
  groups.forEach(g => {
    if(g.manager){ g.members.push(g.manager); g.manager = null; }
    g.members.forEach(m => { m.base = true; m.role = ''; });
  });
  Object.values(charFiles).forEach(c => {
    let gi = -1, mi = -1, old = null;
    groups.forEach((g, i) => {
      g.members.forEach((m, j) => { if((m.file && m.file === c.id) || m.name === c.name){ gi = i; mi = j; old = m; } });
    });
    if(c.deleted){
      if(old){ groups[gi].members.splice(mi, 1); deletedNames.add(old.name); }
      return;
    }
    const gname = groupRename[c.group] || c.group;
    const target = groups.find(x => x.name === gname) || (gi >= 0 && !c.group ? groups[gi] : null);
    if(!target){
      // 그룹명이 비었거나 맞지 않으면 그룹 소속에서는 빠진다.
      if(old){ groups[gi].members.splice(mi, 1); if(old.name !== c.name) renames[old.name] = c.name; }
      return;
    }
    const entry = { name:c.name, role:c.role || '', color:c.color || null, file:c.id, base:!!(old && old.base) };
    let keepIndex = -1;
    if(old){
      if(old.name !== c.name) renames[old.name] = c.name;
      groups[gi].members.splice(mi, 1);
      if(groups[gi] === target) keepIndex = mi;
    }
    if(keepIndex >= 0) target.members.splice(keepIndex, 0, entry);
    else target.members.push(entry);
  });
  Object.keys(charFiles).forEach(k => { if(charFiles[k].deleted) delete charFiles[k]; });
  classes.forEach(gr => gr.sections.forEach(sec => { sec.roster = sec.roster.filter(r => !deletedNames.has(r.name)); }));
  Object.keys(renames).forEach(oldName => {
    const nn = renames[oldName];
    if(characterProfiles[oldName] && !characterProfiles[nn]) characterProfiles[nn] = characterProfiles[oldName];
    classes.forEach(gr => gr.sections.forEach(sec => sec.roster.forEach(r => { if(r.name === oldName) r.name = nn; })));
  });

  function imgSrcFor(name, file){
    const cf = charFiles[name];
    if(cf && cf.noImage && !cf.image){ // 이미지를 일부러 지운 캐릭터: oc와 연동된 캐릭터는 oc 사진을 따라가고, 아니면 비워 둔다
      const oc0 = ocOverrides[name]; const p0 = oc0 && (oc0.image || oc0.profileImage);
      return p0 ? ocAssetUrl(p0) : '';
    }
    if(cf && cf.image){ const f = freshImg(cf.image); if(f) return f; }
    if(!(cf && cf.image)){
      const oc = ocOverrides[name];
      const ocPath = oc && (oc.image || oc.profileImage);
      if(ocPath) return ocAssetUrl(ocPath);
    }
    if(cf && cf.image) return `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${assetPath(cf.image)}?v=${cf.imageV || ''}`;
    return file ? `assets/ymkb_icon_${file}.png` : '';
  }

  const classesBase = JSON.parse(JSON.stringify(classes));

  function groupThumbGradient(g){
    const hexes = g.colors.map(c => colorMap[c] || '#cccccc');
    if(!hexes.length) return '#d9d9d6';
    return hexes.length > 1 ? `linear-gradient(135deg, ${hexes.join(', ')})` : hexes[0];
  }

  function groupImgSrc(g){
    const f = freshImg(g.image); if(f) return f;
    return `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${assetPath(g.image)}?v=${g.imageV || ''}`;
  }

  /* ---------------- 알림 / 드래그로 순서 바꾸기 ---------------- */
  function showToast(msg, ms){
    let t = document.getElementById('toast');
    if(!t){ t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(showToast._t); showToast._t = setTimeout(() => t.classList.remove('show'), ms || 1800);
  }
  let dragSuppress = false;
  document.addEventListener('click', (e) => { if(dragSuppress){ e.stopPropagation(); e.preventDefault(); dragSuppress = false; } }, true);
  // container 안의 itemSel 요소들을 끌어서 순서를 바꾼다. 편집 모드에서만 동작하고(always가 아니면),
  // 손가락은 잠깐 꾹 눌러야 끌리게 해서 스크롤과 겹치지 않게 한다. handleSel이 있으면 그 부분만 끌린다.
  function makeSortable(container, itemSel, onDone, opts){
    opts = opts || {};
    container._sortCb = onDone;
    if(container._sortBound) return;
    container._sortBound = true;
    let st = null;
    const start = () => { st.active = true; st.item.classList.add('dragging'); document.body.classList.add('sorting'); };
    container.addEventListener('dragstart', (e) => { if(opts.always || document.body.classList.contains('edit-mode')) e.preventDefault(); });
    container.addEventListener('pointerdown', (e) => {
      if(!opts.always && !document.body.classList.contains('edit-mode')) return;
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      if(opts.handle && !e.target.closest(opts.handle)) return;
      if(!opts.handle && e.target.closest('input,select,textarea,button,a')) return;
      const item = e.target.closest(itemSel);
      if(!item || !container.contains(item)) return;
      st = { item, x:e.clientX, y:e.clientY, active:false, id:e.pointerId, timer:null, touch:e.pointerType === 'touch' && !opts.handle };
      if(st.touch) st.timer = setTimeout(() => { if(st) start(); }, 280);
    });
    window.addEventListener('pointermove', (e) => {
      if(!st || e.pointerId !== st.id || st.item.closest('body') === null) return;
      if(!st.active){
        if(Math.hypot(e.clientX - st.x, e.clientY - st.y) > 6){
          if(st.touch){ clearTimeout(st.timer); st = null; return; }
          start();
        } else return;
      }
      e.preventDefault();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const over = el && el.closest(itemSel);
      if(over && over !== st.item && over.parentElement === st.item.parentElement){
        const kids = [...st.item.parentElement.children];
        if(kids.indexOf(st.item) < kids.indexOf(over)) over.after(st.item); else over.before(st.item);
      }
    }, { passive:false });
    container.addEventListener('touchmove', (e) => { if(st && st.active) e.preventDefault(); }, { passive:false });
    const finish = () => {
      if(!st) return;
      clearTimeout(st.timer);
      const was = st;
      st = null;
      if(!was.active) return;
      was.item.classList.remove('dragging');
      document.body.classList.remove('sorting');
      dragSuppress = true; setTimeout(() => { dragSuppress = false; }, 60);
      container._sortCb([...was.item.parentElement.children].filter(c => c.matches(itemSel)));
    };
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }
  function saveOrder(key, arr){
    orderMap[key] = arr;
    if(!getToken()){ alert('먼저 토큰 설정에서 토큰을 등록해 주세요.'); return; }
    jsonChange(SITE_PATH, () => ({}), (d) => { d.order = d.order || {}; d.order[key] = arr; }, 'Update order').then(ok => { if(ok) showToast('순서를 저장했어요.'); });
  }

  /* ---------------- GROUP LIST ---------------- */
  const gallery = document.getElementById('groupGallery');
  document.getElementById('groupCountLabel').textContent = '';

  groups.forEach((g) => {
    const card = document.createElement('div');
    card.className = 'photo-card ratio-1x1';
    card.innerHTML = `
      <div class="p-thumb" style="background:${groupThumbGradient(g)}">${g.image ? `<img src="${esc(groupImgSrc(g))}" alt="" onerror="window.__imgErr(this)">` : ''}</div>
      <div class="p-overlay">
        <div class="p-name">${esc(g.name)}</div>
      </div>`;
    card.dataset.gid = g.id;
    card.addEventListener('click', () => openGroupDetail(g));
    gallery.appendChild(card);
  });
  makeSortable(gallery, '.photo-card', (items) => saveOrder('groups', items.map(c => c.dataset.gid)));

  /* ---------------- CHARACTER CARD (shared style with group cards) ---------------- */
  function charCard(member){
    const hex = colorMap[member.color] || '#b7b7b7';
    const roleTxt = [member.role, member.color].filter(Boolean).join(' · ');
    const imgSrc = imgSrcFor(member.name, member.file);
    return `
      <div class="photo-card ratio-3x4" data-name="${member.name}">
        <div class="p-thumb" style="background:${colorGradient(hex)}">
          ${imgSrc ? `<img src="${imgSrc}" alt="${member.name}" onerror="window.__imgErr(this)">` : ''}
        </div>
        <div class="p-overlay">
          <div class="p-cat">${roleTxt}</div>
          <div class="p-name">${member.name}</div>
        </div>
      </div>`;
  }

  /* ---------------- GROUP DETAIL MODAL ---------------- */
  const groupModal = document.getElementById('groupModal');

  let currentGroup = null;
  async function openGroupDetail(g){
    currentGroup = g;
    await ocReadyPromise;
    document.getElementById('gdTitle').textContent = g.name;
    const colorsValue = (g.colors || []).map(c => {
      const hex = colorMap[c] || '#cccccc';
      const textColor = hex.toLowerCase() === '#ffffff' ? '#a8a69f' : hex;
      return `<span class="gd-color-chip" style="color:${textColor}"><span class="gd-color-dot" style="background:${hex}"></span>${esc(c)}</span>`;
    }).join('');
    const tagRows = [];
    const trio = [];
    if(g.concept) trio.push(infoRow('컨셉', esc(g.concept)));
    if(g.genre) trio.push(infoRow('주력 장르', esc(g.genre)));
    if(g.fandom) trio.push(infoRow('팬덤명', esc(g.fandom)));
    if(trio.length) tagRows.push(`<div class="gd-trio">${trio.join('')}</div>`);
    if(colorsValue) tagRows.push(infoRow('대표 컬러', colorsValue));
    const tagsEl = document.getElementById('gdTags');
    tagsEl.innerHTML = tagRows.join('');
    tagsEl.style.display = tagRows.length ? '' : 'none';
    const introEl = document.getElementById('gdIntro');
    introEl.textContent = g.intro || '';
    introEl.style.display = g.intro ? '' : 'none';
    g.members = applyOrder(g.members, m => m.name, 'members:' + g.id);
    const plain = g.members.filter(m => m.role !== '매니저');
    plain.sort((a, b) => (b.role === '리더' ? 1 : 0) - (a.role === '리더' ? 1 : 0));
    const mgrs = g.members.filter(m => m.role === '매니저');
    document.getElementById('gdCharGallery').innerHTML = plain.map(charCard).join('');
    document.getElementById('gdMembersSec').style.display = plain.length ? '' : 'none';
    document.getElementById('gdManagerGallery').innerHTML = mgrs.map(charCard).join('');
    document.getElementById('gdManagerSec').style.display = mgrs.length ? '' : 'none';
    const discs = Array.isArray(g.discography) ? g.discography.filter(d => d && (d.title || d.cover)) : [];
    document.getElementById('gdDiscoGallery').innerHTML = discs.map(d => {
      const cover = d.cover ? `<img src="${esc(discCoverSrc(d))}" alt="" onerror="window.__imgErr(this)">` : '';
      const link = safeUrl(d.link);
      const wrap = (inner, cls) => link ? `<a class="${cls}" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${inner}</a>` : `<span class="${cls}">${inner}</span>`;
      return `<div class="disco-item">${wrap(cover, 'disco-cover')}${wrap(esc(d.title || ''), 'disco-title')}${d.date ? `<span class="disco-date">${esc(String(d.date).replace(/-/g, '.'))}</span>` : ''}</div>`;
    }).join('');
    document.getElementById('gdDiscoSec').style.display = discs.length ? '' : 'none';
    groupModal.classList.add('active');
  }
  function safeUrl(u){
    u = String(u || '').trim(); if(!u) return '';
    if(/^https?:\/\//i.test(u)) return u;
    if(/^[a-z][a-z0-9+.-]*:/i.test(u)) return ''; // javascript: 같은 주소는 막는다
    return 'https://' + u;
  }
  function discCoverSrc(d){
    const f = freshImg(d.cover); if(f) return f;
    return `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${assetPath(d.cover)}?v=${d.coverV || ''}`;
  }
  const saveMemberOrder = () => {
    if(!currentGroup) return;
    const names = [...document.querySelectorAll('#gdCharGallery .photo-card, #gdManagerGallery .photo-card')].map(c => c.dataset.name);
    saveOrder('members:' + currentGroup.id, names);
  };
  makeSortable(document.getElementById('gdCharGallery'), '.photo-card', saveMemberOrder);
  makeSortable(document.getElementById('gdManagerGallery'), '.photo-card', saveMemberOrder);
  const slideModal = document.getElementById('slideModal');
  document.getElementById('slideModalClose').addEventListener('click', () => slideModal.classList.remove('active'));
  slideModal.addEventListener('click', (e) => { if(e.target === slideModal) slideModal.classList.remove('active'); });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && slideModal.classList.contains('active')){ e.stopImmediatePropagation(); slideModal.classList.remove('active'); } }, true);
  document.getElementById('groupModalClose').addEventListener('click', () => groupModal.classList.remove('active'));
  groupModal.addEventListener('click', (e) => { if(e.target === groupModal) groupModal.classList.remove('active'); });

  /* ---------------- MASTER CHARACTER REGISTRY ---------------- */
  /* 모든 그룹의 멤버·매니저를 이름 기준으로 한 곳에 모아, GROUP/CLASS 어디서 눌러도
     같은 프로필 모달로 연결되도록 합니다. */
  const masterCharacters = {};
  groups.forEach(g => {
    g.members.forEach(m => {
      masterCharacters[m.name] = { name:m.name, color:m.color, file:m.file, group:g.name, role:m.role, base:!!m.base };
    });
  });

  // 그룹이 없거나 그룹명이 맞지 않는 캐릭터도 사라지지 않게 함께 등록한다.
  Object.values(charFiles).forEach(c => {
    if(c.deleted || !c.name || masterCharacters[c.name]) return;
    masterCharacters[c.name] = { name:c.name, color:c.color, file:c.id, group:c.group || '', role:c.role || '', base:false };
  });

  // 학급/직책 정보를 마스터 캐릭터 정보에도 합쳐서, 프로필에서 함께 보여줄 수 있게 합니다.
  classes.forEach(g => g.sections.forEach(sec => sec.roster.forEach(r => {
    if(!masterCharacters[r.name]){
      // 명단에만 있고 아직 프로필이 없는 이름도 프로필 카드가 열리도록 빈 캐릭터로 등록한다. 수정해서 저장하면 그때 파일이 만들어진다.
      masterCharacters[r.name] = { name:r.name, color:null, file:'', group:'', role:'', base:false };
    }
    masterCharacters[r.name].classId = sec.id;
  })));

  function emptyProfile(){
    return {
      nameEn:'', nameKanji:'', birth:'', age:'', height:'',
      personality:'', info:'',
      school:{ 학급:'', 학생회:'', 학과:'', 기숙사:'', 동아리:'' },
      like:{ 음식:'', 사람:'' }, hate:{ 음식:'', 사람:'' },
      hobby:'', specialty:'',
      etc:{ 반려동물:'', 최근관심사:'', 가족구성:'' },
      ability:{ 음악:0, 보컬:0, 무용:0, 연기:0, 체력:0, 정신력:0, 열정:0, 눈치:0 },
      specialNote:''
    };
  }
  await ocReadyPromise;
  // 아직 정보를 받지 못한 캐릭터도 전부 같은 틀을 갖도록, 빈 프로필로 기본값을 채워둡니다.
  Object.keys(masterCharacters).forEach(name => {
    const cf = charFiles[name] || {};
    const raw = mergeProfile(mergeProfile(emptyProfile(), characterProfiles[name] || {}), cf.profile || {});
    masterCharacters[name].rawProfile = raw;
    masterCharacters[name].owner = cf.owner || (ocOverrides[name] ? '호원' : '');
    masterCharacters[name].id = cf.id || masterCharacters[name].file || '';
    masterCharacters[name].hasFile = !!charFiles[name];
    masterCharacters[name].fieldsOwn = cf.fields || {};
    masterCharacters[name].template = cf.template || '';
    masterCharacters[name].clubHead = !!cf.clubHead;
    masterCharacters[name].classFlags = Array.isArray(cf.classFlags) ? cf.classFlags : [];
  });
  // oc 저장소에서 자동으로 불러오는 것은 오너가 호원인 캐릭터만 해당한다.
  const ocSkipped = [];
  function filterOcByOwner(){
    Object.keys(ocOverrides).forEach(n => {
      const m = masterCharacters[n];
      if(m && m.owner !== '호원'){ ocSkipped.push(n); delete ocOverrides[n]; }
    });
  }
  filterOcByOwner();
  ownersReady = true;

  /* ---------------- CLASS PAGE RENDER ---------------- */
  const classListEl = document.getElementById('classList');
  classes.forEach((g, idx) => {
    const row = document.createElement('div');
    row.innerHTML = `
      <div class="grade-line">
        <span class="grade-label">${g.grade}</span>
        <div class="grade-buttons">
          ${g.sections.map(s => `<button class="class-btn" data-class-id="${s.id}">${s.id}</button>`).join('')}
        </div>
      </div>`;
    classListEl.appendChild(row.firstElementChild);
    if(idx < classes.length - 1){
      const hr = document.createElement('hr');
      hr.className = 'soft-divider grade-divider';
      classListEl.appendChild(hr);
    }
  });

  const allSections = classes.flatMap(g => g.sections);
  classListEl.querySelectorAll('.class-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = allSections.find(s => s.id === btn.dataset.classId);
      if(sec) openClassDetail(sec);
    });
  });

  /* ---------------- CLUB PAGE: 프로필의 '동아리' 항목에서 자동으로 만들어진다 ---------------- */
  // oc의 동아리 칸에는 "밴드부 (부장 / 드럼)"처럼 괄호로 직책이 함께 적혀 있어서, 괄호 앞만 동아리 이름으로 쓰고
  // 괄호 안에 '부장'이 있으면 부장으로 본다. 쉼표로 여러 동아리를 적을 수 있고, 괄호 안의 쉼표는 나누지 않는다.
  function splitOutsideParens(str){
    const out = []; let depth = 0, cur = '';
    for(const ch of String(str)){
      if(ch === '(' || ch === '（') depth++;
      if(ch === ')' || ch === '）') depth = Math.max(0, depth - 1);
      if((ch === ',' || ch === '，') && depth === 0){ out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    return out;
  }
  function parseClub(raw){
    let t = String(raw).trim(), head = false;
    const m = t.match(/^(.*?)\s*[\(（](.*)[\)）]\s*$/);
    if(m){ t = m[1].trim(); head = /부장/.test(m[2]); }
    if(/\s부장$/.test(t)){ t = t.replace(/\s*부장$/, '').trim(); head = true; }
    return { name:t, head };
  }
  function clubNamesOf(info){
    const tpl = templateFor(info);
    const f = tpl && tpl.fields.find(x => x.label === '동아리');
    if(!f) return [];
    const v = valueOf(info, f);
    if(v === undefined) return [];
    const parts = Array.isArray(v) ? v.map(String) : splitOutsideParens(v);
    return parts.map(parseClub).filter(c => c.name && c.name !== '-' && c.name !== '없음').map(c => ({ name:c.name, head:c.head || !!info.clubHead }));
  }
  function clubCard(item){
    const info = item.info;
    const hex = colorMap[info.color] || '#b7b7b7';
    const imgSrc = imgSrcFor(info.name, info.file);
    return `
      <div class="photo-card ratio-3x4" data-name="${esc(info.name)}">
        <div class="p-thumb" style="background:${colorGradient(hex)}">
          ${imgSrc ? `<img src="${esc(imgSrc)}" alt="${esc(info.name)}" onerror="window.__imgErr(this)">` : ''}
        </div>
        <div class="p-overlay">
          <div class="p-cat">${item.head ? '부장' : ''}</div>
          <div class="p-name">${esc(info.name)}</div>
        </div>
      </div>`;
  }
  (function renderClubs(){
    const box = document.getElementById('clubList');
    if(!box) return;
    const map = {};
    Object.values(masterCharacters).forEach(info => clubNamesOf(info).forEach(c => { const arr = (map[c.name] = map[c.name] || []); if(!arr.some(x => x.info === info)) arr.push({ info, head:c.head }); }));
    const names = Object.keys(map).sort((a, b) => a.localeCompare(b, 'ko'));
    if(!names.length){ box.innerHTML = '<p style="color:var(--muted);font-size:13px;">동아리 정보가 아직 준비되지 않았습니다.</p>'; return; }
    box.innerHTML = names.map(n => {
      const list = applyOrder(map[n], i => i.info.name, 'club:' + n);
      list.sort((a, b) => (b.head ? 1 : 0) - (a.head ? 1 : 0));
      return `<div class="club-block" data-club="${esc(n)}"><h3 class="club-title">${esc(n)}</h3><div class="char-gallery cols-8" data-club="${esc(n)}">${list.map(clubCard).join('')}</div><hr class="soft-divider"></div>`;
    }).join('');
    box.querySelectorAll('.char-gallery').forEach(g => makeSortable(g, '.photo-card', (items) => saveOrder('club:' + g.dataset.club, items.map(c => c.dataset.name))));
  })();


  /* ---------------- 메인 화면 디스코그래피 (최신순, 여러 개면 자동으로 넘어간다) ---------------- */
  (function renderHomeDisco(){
    const box = document.getElementById('homeDisco'); if(!box) return;
    const items = [];
    groups.forEach(g => (Array.isArray(g.discography) ? g.discography : []).forEach(d => { if(d && (d.title || d.cover)) items.push({ g, d }); }));
    items.sort((a, b) => String(b.d.date || '').localeCompare(String(a.d.date || '')));
    const list = items.slice(0, 12);
    if(!list.length){ box.style.display = 'none'; return; }
    box.style.display = '';
    box.innerHTML = `<div class="hd-view"><div class="hd-track">${list.map((x, i) => `<div class="hd-item" data-i="${i}">
      <div class="hd-cover">${x.d.cover ? `<img src="${esc(discCoverSrc(x.d))}" alt="" onerror="window.__imgErr(this)">` : ''}
      <div class="hd-over"><div class="hd-meta">${esc(x.g.name)}</div><div class="hd-title">${esc(x.d.title || '')}</div></div></div></div>`).join('')}</div></div>
      ${list.length > 1 ? `<div class="carousel-ticks hd-ticks">${list.map((_, i) => `<span class="tick${i ? '' : ' active'}"></span>`).join('')}</div>` : ''}`;
    const track = box.querySelector('.hd-track');
    const ticks = [...box.querySelectorAll('.tick')];
    let cur = 0, timer = null;
    const go = (i) => { cur = (i + list.length) % list.length; track.style.transform = `translateX(-${cur * 100}%)`; ticks.forEach((t, k) => t.classList.toggle('active', k === cur)); };
    const start = () => { if(list.length > 1 && !timer) timer = setInterval(() => go(cur + 1), 4000); };
    const stop = () => { clearInterval(timer); timer = null; };
    box.addEventListener('mouseenter', stop); box.addEventListener('mouseleave', start);
    ticks.forEach((t, k) => t.addEventListener('click', () => { stop(); go(k); start(); }));
    box.addEventListener('click', (e) => {
      const it = e.target.closest('.hd-item'); if(!it) return;
      const x = list[+it.dataset.i]; if(x) openGroupDetail(x.g);
    });
    start();
  })();

  /* ---------------- 학생회 페이지 ---------------- */
  function councilCard(name, sub){
    const info = masterCharacters[name];
    const hex = info ? (colorMap[info.color] || '#b7b7b7') : '#b7b7b7';
    const imgSrc = info ? imgSrcFor(info.name, info.file) : '';
    return `<div class="council-item${info ? ' linked' : ''}" data-name="${esc(name)}">
      <div class="photo-card ratio-3x4"><div class="p-thumb" style="background:${colorGradient(hex)}">${imgSrc ? `<img src="${esc(imgSrc)}" alt="${esc(name)}" onerror="window.__imgErr(this)">` : ''}</div></div>
      <div class="council-name">${esc(name)}</div>${sub ? `<div class="council-sub">${esc(sub)}</div>` : ''}</div>`;
  }
  function renderCouncil(){
    const box = document.getElementById('councilBody'); if(!box) return;
    const c = site.council || SITE_DEFAULTS.council;
    const solo = (label, name) => name ? `<div class="council-solo"><span class="council-label">${esc(label)}</span>${councilCard(name, '')}</div>` : '';
    const row = (label, items) => items.length ? `<div class="council-row"><span class="council-label${label ? '' : ' ghost'}">${esc(label || '부서')}</span><div class="council-grid">${items.join('')}</div></div>` : '';
    box.innerHTML = `
      <div class="council-top">${solo('학생회장', c.president)}${solo('부학생회장', c.vice)}</div>
      ${row('학급 대표', (c.reps || []).filter(x => x && x.name).map(x => councilCard(x.name, x.label)))}
      <div class="council-dept-block">
      ${row('부서', (c.depts || []).filter(x => x && x.name).map(x => councilCard(x.name, x.label)))}
      ${row('', (c.broadcast || []).filter(x => x && x.name).map(x => councilCard(x.name, '방송부')))}
      </div>`;
  }
  renderCouncil();
  document.getElementById('councilBody').addEventListener('click', (e) => {
    const it = e.target.closest('.council-item.linked'); if(it) openProfile(it.dataset.name);
  });


  /* ---------------- 기숙사 페이지 ---------------- */
  const DORM = [
    { name:'유메관', floors:[
      { f:'3F', rooms:[['301','아키호 모치','시노하라 츄시로'],['302','에나미 타츠로','나카아키 세츠나'],['303','신도 카이','노하라 켄타'],['304','테츠라 유키','미도리카와 토오루'],['305','카자마 미로','나나미 신지'],['306','나미카와 우미']] },
      { f:'1F', rooms:[['101','카미하츠 마모루','하루이 루키하'],['102','오카다 아츠시','하야시 미츠키'],['103','데오다토 아트','원주율'],['104','이토 레이센','후쿠오 로나'],['105','코이즈미 아키라','하쿠노 우즈키'],['106','시토 레미','하야시 미츠루']] } ] },
    { name:'키보관', floors:[
      { f:'2F', rooms:[['201','에모토 루이','하시모토 소우'],['202','하이바라 토마','하기 유우토'],['203','아오키 켄','타카자쿠라 리온'],['204','사쿠라 시류','스즈키 잇세이'],['205','오모 토시미','카게야마 시온'],['206','미요시 아로마','유키무라 카논'],['207','카게노 히라시','신타니 츠토무'],['208','아라키 카이로','코이즈미 아카리']] },
      { f:'1F', rooms:[['101','시이나 이나','하나나시 사나기'],['102','도코 치리','타카나시 유타'],['103','아이사와 키미','하네다 아이리'],['104','아사히나 노조미','사츠키 레이무'],['105','에나미 큐','루리코 사에'],['106','시오자키 아우라','하라 세이카']] } ] }
  ];
  function renderDorm(){
    const box = document.getElementById('dormBody'); if(!box) return;
    box.innerHTML = DORM.map(b => `<section class="dorm-building"><h3 class="dorm-title">${esc(b.name)}</h3>${b.floors.map(fl => `<details class="dorm-floor"><summary>${esc(fl.f)}</summary><div class="dorm-rooms">${fl.rooms.map(r => `<div class="dorm-room"><span class="dorm-no">${esc(r[0])}</span><div class="dorm-people">${r.slice(1).map(n => councilCard(n, '')).join('')}</div></div>`).join('')}</div></details>`).join('')}</section>`).join('');
  }
  renderDorm();
  document.getElementById('dormBody').addEventListener('click', (e) => {
    const it = e.target.closest('.council-item.linked'); if(it) openProfile(it.dataset.name);
  });

  /* ---------------- ROSTER CARD (class gallery, shares style with charCard) ---------------- */
  function rosterCard(r){
    const info = masterCharacters[r.name] || {};
    const hex = colorMap[info.color] || '#b7b7b7';
    const sub = (info.classFlags || []).join(', ');
    const imgSrc = imgSrcFor(r.name, info.file);
    return `
      <div class="photo-card ratio-3x4" data-name="${r.name}">
        <div class="p-thumb" style="background:${colorGradient(hex)}">
          ${imgSrc ? `<img src="${imgSrc}" alt="${r.name}" onerror="window.__imgErr(this)">` : ''}
        </div>
        <div class="p-overlay">
          <div class="p-cat">${sub}</div>
          <div class="p-name">${r.name}</div>
        </div>
      </div>`;
  }

  /* ---------------- CLASS DETAIL MODAL ---------------- */
  const classModal = document.getElementById('classModal');

  let currentSection = null;
  async function openClassDetail(sec){
    currentSection = sec;
    await ocReadyPromise;
    document.getElementById('clTitle').textContent = sec.id;
    document.getElementById('clTeacherTag').innerHTML = infoRow('담당 교사', sec.teacher);
    const gal = document.getElementById('clGallery');
    sec.roster = applyOrder(sec.roster, r => r.name, 'class:' + sec.id);
    gal.innerHTML = sec.roster.length
      ? sec.roster.map(rosterCard).join('')
      : `<p style="color:var(--muted);font-size:12px;">학급 정보가 아직 준비되지 않았습니다.</p>`;
    classModal.classList.add('active');
  }
  makeSortable(document.getElementById('clGallery'), '.photo-card', (items) => { if(currentSection) saveOrder('class:' + currentSection.id, items.map(c => c.dataset.name)); });
  document.getElementById('classModalClose').addEventListener('click', () => classModal.classList.remove('active'));
  classModal.addEventListener('click', (e) => { if(e.target === classModal) classModal.classList.remove('active'); });

  /* ---------------- CHARACTER PROFILE MODAL (opens above GROUP/CLASS modal) ---------------- */
  const profileModal = document.getElementById('profileModal');

  function starRating(n){
    n = Math.max(0, Math.min(5, Number(n) || 0));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }
  function infoRow(label, value){
    const v = (value === undefined || value === null || value === '') ? '-' : value;
    return `<div class="spec-row"><span class="spec-label">${label}</span><span class="spec-sep">|</span><span class="spec-value">${v}</span></div>`;
  }
  function abilityRow(label, n){
    return `<div class="spec-row" style="gap:6px; width:max-content;"><span class="spec-label" style="min-width:46px;">${label}</span><span class="stars">${starRating(n)}</span></div>`;
  }
  /* ---------------- 갤러리 (템플릿 항목 종류 '갤러리') ---------------- */
  function galThumbSrc(it){
    const path = it.thumb || it.orig; if(!path) return '';
    const f = freshImg(path); if(f) return f;
    return `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${assetPath(path)}?v=${(it.thumb ? it.thumbV : it.origV) || ''}`;
  }
  function galOrigSrc(it){
    const path = it.orig || it.thumb; if(!path) return '';
    const f = freshImg(path); if(f) return f;
    return `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${assetPath(path)}?v=${(it.orig ? it.origV : it.thumbV) || ''}`;
  }
  const lb = { items:[], i:0 };
  function lbShow(){
    const it = lb.items[lb.i]; if(!it) return;
    document.getElementById('lbImg').src = it.src || galOrigSrc(it);
    document.getElementById('lbCount').textContent = lb.items.length > 1 ? `${lb.i + 1} / ${lb.items.length}` : '';
    document.getElementById('lbPrev').style.display = document.getElementById('lbNext').style.display = lb.items.length > 1 ? '' : 'none';
  }
  function lbOpen(items, i){ lb.items = items; lb.i = i; lbShow(); document.getElementById('lightbox').classList.add('active'); }
  function lbClose(){ document.getElementById('lightbox').classList.remove('active'); document.getElementById('lbImg').removeAttribute('src'); }
  function lbMove(d){ if(lb.items.length < 2) return; lb.i = (lb.i + d + lb.items.length) % lb.items.length; lbShow(); }
  document.getElementById('lbClose').addEventListener('click', lbClose);
  document.getElementById('lbPrev').addEventListener('click', (e) => { e.stopPropagation(); lbMove(-1); });
  document.getElementById('lbNext').addEventListener('click', (e) => { e.stopPropagation(); lbMove(1); });
  document.getElementById('lightbox').addEventListener('click', (e) => { if(e.target.id === 'lightbox' || e.target.id === 'lbStage') lbClose(); });
  document.addEventListener('keydown', (e) => {
    if(!document.getElementById('lightbox').classList.contains('active')) return;
    if(e.key === 'Escape'){ e.stopImmediatePropagation(); lbClose(); } else if(e.key === 'ArrowLeft') lbMove(-1); else if(e.key === 'ArrowRight') lbMove(1);
  }, true);
  (function(){
    let sx = null;
    const box = document.getElementById('lightbox');
    box.addEventListener('touchstart', (e) => { sx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive:true });
    box.addEventListener('touchend', (e) => { if(sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if(Math.abs(dx) > 50) lbMove(dx < 0 ? 1 : -1); }, { passive:true });
  })();
  document.addEventListener('click', (e) => {
    const c = e.target.closest('.gal-cell'); if(!c) return;
    const grid = c.closest('.gallery-grid'); const info = grid && masterCharacters[grid.dataset.galName]; if(!info) return;
    const f = templateFor(info).fields.find(x => x.key === grid.dataset.galKey); if(!f) return;
    const v = valueOf(info, f);
    const items = Array.isArray(v) ? v.filter(x => x && (x.thumb || x.orig)) : [];
    lbOpen(items, Number(c.dataset.gi) || 0);
  });
  document.addEventListener('click', (e) => {
    const im = e.target.closest('.profile-photo-wrap .p-thumb img'); if(!im || !im.getAttribute('src')) return;
    lbOpen([{ src: im.currentSrc || im.src }], 0);
  });
  function photoBlock(info){
    const hex = colorMap[info.color] || '#b7b7b7';
    const imgSrc = imgSrcFor(info.name, info.file);
    return `
      <div class="profile-photo-wrap">
        <div class="photo-card ratio-3x4">
          <div class="p-thumb" style="background:${colorGradient(hex)}">
            ${imgSrc ? `<img src="${imgSrc}" alt="${info.name}" onerror="window.__imgErr(this)">` : ''}
          </div>
        </div>
      </div>`;
  }

  /* ---- 템플릿 항목의 값 결정: ymkb에서 직접 입력한 값 > oc 값 > 예전 프로필(profiles.json) ---- */
  function legacyValue(info, f){
    if(ocOverrides[info.name]) return undefined; // oc와 연동된 캐릭터는 예전 프로필 값을 쓰지 않는다
    const p = info.rawProfile || emptyProfile();
    const L = {
      '영어 / 한자 이름': () => [p.nameEn, p.nameKanji].filter(Boolean).join(' / '),
      '나이': () => p.age, '생일': () => p.birth, '신체': () => p.height, '키': () => p.height,
      '학과': () => p.school.학과, '학급': () => p.school.학급, '동아리': () => p.school.동아리,
      '학생회': () => p.school.학생회, '기숙사': () => p.school.기숙사,
      '소개': () => p.info, '성격': () => p.personality, '여담': () => p.specialNote,
      '좋아하는 음식': () => p.like.음식, '좋아하는 사람': () => p.like.사람,
      '싫어하는 음식': () => p.hate.음식, '싫어하는 사람': () => p.hate.사람,
      '취미': () => p.hobby, '특기': () => p.specialty,
      '반려동물': () => p.etc.반려동물, '최근 관심사': () => p.etc.최근관심사, '가족 구성': () => p.etc.가족구성
    };
    let v;
    if(L[f.label]) v = L[f.label]();
    else if(f.type === 'rating' && p.ability && p.ability[f.label] !== undefined) v = p.ability[f.label];
    if(f.type === 'rating' && !Number(v)) return undefined;
    return isEmptyVal(v) ? undefined : v;
  }
  function ownValue(info, f){
    const v = (info.fieldsOwn || {})[f.key];
    return isEmptyVal(v) || (f.type === 'rating' && !Number(v)) ? undefined : v;
  }
  function ocValue(info, f){
    const oc = ocOverrides[info.name];
    if(!oc || !oc.fields) return undefined;
    let v = oc.fields[f.key];
    if(v === undefined){
      const of = ocFields.find(x => x.label === f.label);
      if(of) v = oc.fields[of.key];
    }
    if(v === '-') return undefined;
    return isEmptyVal(v) || (f.type === 'rating' && !Number(v)) ? undefined : v;
  }
  function valueOf(info, f){
    if((info.fieldsOwn || {})[f.key] === null && !ocOverrides[info.name]) return undefined; // 직접 비운 항목은 oc/예전 값으로 되돌아가지 않고 빈 칸으로 둔다
    for(const fn of [ownValue, ocValue, legacyValue]){
      const v = fn(info, f);
      if(v !== undefined) return v;
    }
    return undefined;
  }
  // (수정 폼 전용) 오너가 호원인 템플릿은 oc에서 연동하는 '프로필 항목'(짧은 글, 태그, 별점)만 보여준다. 소개·성격·여담 같은 긴 본문 칸은 쓰지 않는다.
  function profileOnly(tpl){
    return Object.assign({}, tpl, { fields: tpl.fields.filter(f => f.core || !['textarea', 'collapse'].includes(f.type)) });
  }
  function ownerShown(owner){ const t = templates.find(x => x.name === owner); return (t && t.ownerLabel) || owner; }
  function templateFor(info){
    if(ocOverrides[info.name] && ocFields.length){
      const ot = templates.find(t => t.name === info.owner) || templates.find(t => t.id === info.template) || templates[0];
      const gal = ot ? ot.fields.filter(f => !f.core) : [];
      return ({ id:'__oc', name:'oc', fields: ocFields.map(f => ({ key:f.key, label:f.label, type:['text','tags','textarea','collapse','rating'].includes(f.type) ? f.type : 'text', core:!!f.core })).concat(gal) });
    }
    const t = templates.find(t => t.name === info.owner) || templates.find(t => t.id === info.template) || templates[0];
    return t;
  }

  function renderTemplateBody(info){
    const tpl = templateFor(info);
    if(!tpl) return '';
    const fields = tpl.fields.filter(f => !f.core);
    const out = [];
    let rows = [], stars = [];
    const flush = () => {
      if(rows.length){
        out.push(`<div class="profile-rows cols2">${rows.join('')}</div>`);
        rows = [];
      }
      if(stars.length){
        out.push(`<div class="profile-rows cols2 profile-stars">${stars.join('')}</div>`);
        stars = [];
      }
    };
    fields.forEach(f => {
      const v = valueOf(info, f);
      if(f.type === 'text' || f.type === 'tags'){
        if(stars.length) flush();
        const plain = (x) => String(x).replace(/<br\s*\/?>/gi, ' ').replace(/<\/?[a-z][^>]*>/gi, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
        const txt = v === undefined ? '' : (Array.isArray(v) ? v.map(x => esc(plain(typeof x === 'object' ? JSON.stringify(x) : x))).join(', ') : esc(plain(typeof v === 'object' ? JSON.stringify(v) : v)));
        rows.push(infoRow(esc(f.label), txt));
      } else if(f.type === 'rating'){
        if(rows.length) flush();
        stars.push(abilityRow(esc(f.label), v));
      } else if(f.type === 'textarea'){
        flush();
        out.push(`<div class="profile-section-head">${esc(f.label)}</div><div class="profile-text rich">${v === undefined ? '-' : toRich(v)}</div>`);
      } else if(f.type === 'gallery'){
        flush();
        const gitems = Array.isArray(v) ? v.filter(x => x && (x.thumb || x.orig)) : [];
        if(gitems.length) out.push(`<div class="profile-section-head">${esc(f.label)}</div><div class="gallery-grid" data-gal-name="${esc(info.name)}" data-gal-key="${esc(f.key)}">${gitems.map((it, gi) => `<button type="button" class="gal-cell" data-gi="${gi}"><img src="${esc(galThumbSrc(it))}" alt="" loading="lazy" onerror="window.__imgErr(this)"></button>`).join('')}</div>`);
      } else if(f.type === 'collapse'){
        flush();
        if(v !== undefined) out.push(`<details class="profile-collapse"><summary>${esc(f.label)}</summary><div class="profile-text rich">${toRich(v)}</div></details>`);
      }
    });
    flush();
    return out.join('');
  }

  function renderProfile(info){
    return `
      ${photoBlock(info)}
      <div class="profile-top-info">
        ${infoRow('NAME', esc(info.name))}
      </div>

      ${renderTemplateBody(info)}

      <div class="profile-actions">
        ${info.owner ? `<span class="profile-owner">OWNER · ${esc(ownerShown(info.owner))}</span>` : '<span></span>'}
        <span class="edit-only">
          <button type="button" class="btn-sm" data-act="edit" data-name="${esc(info.name)}">수정</button>
          <button type="button" class="btn-sm danger" data-act="delete" data-name="${esc(info.name)}">삭제</button>
        </span>
      </div>
    `;
  }

  // 저장한 뒤에는 보고 있던 화면(페이지, 열려 있던 그룹/학급/프로필)을 그대로 다시 열어 준다.
  function reloadKeepingView(opts){
    opts = opts || {};
    try {
      const page = document.querySelector('.page.active');
      const v = { page: page ? page.id.replace(/^page-/, '') : 'main', y: window.scrollY, t: Date.now() };
      if(groupModal.classList.contains('active') && currentGroup) v.group = currentGroup.id;
      if(classModal.classList.contains('active') && currentSection) v.cls = currentSection.id;
      if(opts.profile) v.profile = opts.profile;
      else if(profileModal.classList.contains('active') && lastProfile) v.profile = lastProfile;
      sessionStorage.setItem('ymkb_view', JSON.stringify(v));
    } catch(e){}
    window.location.reload();
  }
  let lastProfile = null;
  async function openProfile(name){
    const info = masterCharacters[name];
    if(!info) return;
    lastProfile = name;
    await ocReadyPromise;
    document.getElementById('profileBody').innerHTML = renderProfile(info);
    profileModal.classList.add('active');
  }
  document.getElementById('profileModalClose').addEventListener('click', () => profileModal.classList.remove('active'));
  profileModal.addEventListener('click', (e) => { if(e.target === profileModal) profileModal.classList.remove('active'); });

  // GROUP 모달과 CLASS 모달 어디에서든, 사진 카드를 누르면 같은 프로필 모달로 이동
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.photo-card[data-name]');
    if(card) openProfile(card.dataset.name);
  });

  // ESC는 가장 위에 열려 있는 모달 하나만 닫습니다.
  document.addEventListener('keydown', (e) => {
    if(e.key !== 'Escape') return;
    if(cropModal.classList.contains('active')) { closeCrop(); return; }
    if(menuModal.classList.contains('active')) { menuModal.classList.remove('active'); return; }
    if(tplModal.classList.contains('active')) { closeTplMgr(); return; }
    if(formModal.classList.contains('active')) { formModal.classList.remove('active'); return; }
    if(settingsModal.classList.contains('active')) { settingsModal.classList.remove('active'); return; }
    if(profileModal.classList.contains('active')) profileModal.classList.remove('active');
    else if(classModal.classList.contains('active')) classModal.classList.remove('active');
    else if(groupModal.classList.contains('active')) groupModal.classList.remove('active');
  });

  /* ================= 캐릭터 추가 / 수정 / 삭제 (깃허브 직접 저장) ================= */
  const formModal = document.getElementById('formModal');
  const settingsModal = document.getElementById('settingsModal');
  const cropModal = document.getElementById('cropModal');
  let pendingImage = null; // { blob }
  let removeImage = false; // 이미지 삭제 버튼을 눌렀는지
  let activeCropper = null;

  function toBase64Text(str){ return btoa(unescape(encodeURIComponent(str))); }
  function blobToBase64(blob){
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.substring(r.result.indexOf(',') + 1));
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }
  const apiBase = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/`;

  // 여러 명이 동시에 저장해도 오류가 보이지 않도록: 이 브라우저의 저장은 한 줄로 세우고, 충돌이 나면 조용히 다시 시도한다.
  function httpError(res, body, fallback){ const e = new Error((body && body.message) || `${fallback} (${res.status})`); e.status = res.status; return e; }
  function isConflict(err){ return !!err && (err.status === 409 || err.status === 422 || /sha|does not match|expected|fast.?forward|conflict|reference/i.test(err.message || '')); }
  const backoff = (n) => new Promise(r => setTimeout(r, 200 + n * 350 + Math.random() * 500));
  let writeChain = Promise.resolve();
  function queued(fn){
    const run = writeChain.then(fn, fn);
    writeChain = run.catch(() => {});
    return run;
  }
  // 깃허브 API가 막혀 있어도(요청 횟수 제한 등) 저장할 수 있도록, 실패하면 파일 내용을 직접 읽어 sha를 계산한다.
  async function shaFromRaw(path){
    const r = await fetch(`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${path}?t=${Date.now()}`, { cache:'no-store' });
    if(r.status === 404) return undefined;
    if(!r.ok) throw new Error(`기존 파일 정보를 불러오지 못했어요 (${r.status})`);
    const body = new Uint8Array(await r.arrayBuffer());
    const head = new TextEncoder().encode(`blob ${body.length}\0`);
    const all = new Uint8Array(head.length + body.length); all.set(head); all.set(body, head.length);
    const dig = new Uint8Array(await crypto.subtle.digest('SHA-1', all));
    return Array.from(dig).map(x => x.toString(16).padStart(2, '0')).join('');
  }
  async function getFileSha(path){
    const url = `${apiBase}${path}?ref=${GH_BRANCH}&t=${Date.now()}`;
    const h = apiHeaders();
    try {
      let res = await fetch(url, { headers:h, cache:'no-store' });
      if((res.status === 401 || res.status === 403) && h.Authorization) res = await fetch(url, { headers:{ Accept:h.Accept }, cache:'no-store' });
      if(res.status === 404) return undefined;
      if(res.ok){ const j = await res.json(); if(j && j.sha) return j.sha; }
    } catch(e){}
    return shaFromRaw(path);
  }
  function ghPut(path, base64, message){
    return queued(async () => {
      const token = getToken();
      if(!token) throw new Error('NO_TOKEN');
      let lastErr;
      for(let attempt = 0; attempt < 8; attempt++){
        try {
          const sha = await getFileSha(path);
          const res = await fetch(apiBase + path, {
            method:'PUT',
            headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json' },
            body: JSON.stringify({ message, content:base64, branch:GH_BRANCH, ...(sha ? { sha } : {}) })
          });
          if(!res.ok) throw httpError(res, await res.json().catch(() => ({})), '저장 실패');
          if(!path.endsWith('.json')) rememberImg(path, base64);
          if(path.endsWith('.json')){ try { cacheTouch(path, JSON.parse(b64DecodeUnicode(base64))); } catch(e){} }
          return res.json();
        } catch(err){
          lastErr = err;
          if(!isConflict(err)) throw err;
          await backoff(attempt);
        }
      }
      throw lastErr;
    });
  }
  // 지운 파일은 이 브라우저가 기억하던 사본(저장 내용, 방금 올린 이미지)도 함께 지운다.
  function forgetLocal(path){
    if(path.endsWith('.json')) cacheTouch(path, null);
    else { try { sessionStorage.removeItem('ymkb_img_' + assetPath(path)); sessionStorage.removeItem('ymkb_img_' + path); } catch(e){} }
  }
  function ghDelete(path, message){
    return queued(async () => {
      const token = getToken();
      if(!token) throw new Error('NO_TOKEN');
      let lastErr;
      for(let attempt = 0; attempt < 8; attempt++){
        try {
          const sha = await getFileSha(path);
          if(!sha){ forgetLocal(path); return; }
          const res = await fetch(apiBase + path, {
            method:'DELETE',
            headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json' },
            body: JSON.stringify({ message, sha, branch:GH_BRANCH })
          });
          if(!res.ok) throw httpError(res, await res.json().catch(() => ({})), '삭제 실패');
          forgetLocal(path);
          return;
        } catch(err){
          lastErr = err;
          if(!isConflict(err)) throw err;
          await backoff(attempt);
        }
      }
      throw lastErr;
    });
  }

  /* ----- 저장 설정 (토큰) ----- */
  function openSettings(){
    const has = !!getToken();
    document.getElementById('settingsBody').innerHTML = `
      <h2 class="form-title">토큰 설정</h2>
      <p class="form-hint">토큰은 사이트에서 저장할 때 쓰는 열쇠예요. 이 기기에서 한 번만 등록하면 돼요.<br>이 브라우저에만 보관되고 깃허브에는 올라가지 않아요.</p>
      <ol class="form-hint steps">
        <li>먼저 저장소 주인(호원)에게 ${GH_OWNER}/${GH_REPO} 저장소 초대를 받아 주세요. 메일의 Accept invitation을 눌러 수락하면 돼요.</li>
        <li><a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener">여기</a>를 눌러 새 토큰(classic)을 만들어 주세요.</li>
        <li>Note에는 ymkb라고 적고, Expiration은 No expiration(또는 90 days)을 골라 주세요.</li>
        <li>아래 목록에서 public_repo 칸 하나만 체크해 주세요. 저장소가 비공개라면 repo를 체크해 주세요.</li>
        <li>맨 아래 Generate token을 누르고, 나온 ghp_로 시작하는 글자를 복사해 주세요. 이 화면을 벗어나면 다시 볼 수 없어요.</li>
        <li>아래 칸에 붙여넣고 저장을 눌러 주세요.</li>
      </ol>
      <input class="f-input" id="tokenInput" type="password" placeholder="${has ? '등록된 토큰이 있어요 (새로 바꾸려면 입력)' : '토큰 붙여넣기'}" autocomplete="off">
      <div class="form-actions">
        ${has ? '<button type="button" class="text-btn danger" id="tokenClear">토큰 지우기</button>' : '<span></span>'}
        <button type="button" class="form-submit" id="tokenSave">저장</button>
      </div>`;
    settingsModal.classList.add('active');
    document.getElementById('tokenSave').addEventListener('click', () => {
      const v = document.getElementById('tokenInput').value.trim();
      if(v) setToken(v);
      settingsModal.classList.remove('active');
    });
    const clr = document.getElementById('tokenClear');
    if(clr) clr.addEventListener('click', () => { setToken(''); settingsModal.classList.remove('active'); });
  }
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('settingsClose').addEventListener('click', () => settingsModal.classList.remove('active'));

  /* ----- 이미지 확대/자르기 (비율 자유, 원본 그대로도 가능) ----- */
  function extOf(file){
    const t = (file.type || '').toLowerCase();
    if(t.includes('png')) return 'png';
    if(t.includes('webp')) return 'webp';
    if(t.includes('gif')) return 'gif';
    return 'jpg';
  }
  function openCrop(file, onApply, opts){
    opts = opts || {};
    if(typeof Cropper === 'undefined'){
      // 자르기 도구를 못 불러오면 원본 그대로 쓴다.
      onApply(file, extOf(file));
      return;
    }
    const img = document.getElementById('cropImage');
    const reader = new FileReader();
    reader.onload = () => {
      cropModal.classList.add('active');
      img.onload = () => {
        if(activeCropper) activeCropper.destroy();
        activeCropper = new Cropper(img, { viewMode:1, autoCropArea:1, background:false, responsive:true, aspectRatio: opts.aspect || NaN });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    const fresh = (id) => { const o = document.getElementById(id); const n = o.cloneNode(true); o.parentNode.replaceChild(n, o); return n; };
    fresh('cropZoomIn').addEventListener('click', () => activeCropper && activeCropper.zoom(0.1));
    fresh('cropZoomOut').addEventListener('click', () => activeCropper && activeCropper.zoom(-0.1));
    fresh('cropRotate').addEventListener('click', () => activeCropper && activeCropper.rotate(90));
    fresh('cropReset').addEventListener('click', () => activeCropper && activeCropper.reset());
    fresh('cropApply').addEventListener('click', () => {
      if(!activeCropper) return;
      activeCropper.getCroppedCanvas({ maxWidth:opts.aspect ? 1000 : 4000, maxHeight:opts.aspect ? 1000 : 4000, imageSmoothingQuality:'high' }).toBlob(b => { onApply(b, 'png'); closeCrop(); }, 'image/png');
    });
    const origBtn = fresh('cropOriginal');
    origBtn.style.display = opts.noOriginal ? 'none' : '';
    origBtn.addEventListener('click', () => { onApply(file, extOf(file)); closeCrop(); });
    fresh('cropCancel').addEventListener('click', () => { closeCrop(); if(opts.onCancel) opts.onCancel(); });
  }
  function closeCrop(){
    cropModal.classList.remove('active');
    if(activeCropper){ activeCropper.destroy(); activeCropper = null; }
  }
  document.getElementById('cropClose').addEventListener('click', closeCrop);

  /* ----- 템플릿 저장 (깃허브의 최신 내용을 다시 받아 이번 변경만 적용 → 동시 작업해도 서로 덮어쓰지 않음) ----- */
  function b64DecodeUnicode(str){ return decodeURIComponent(escape(atob(String(str).replace(/\n/g, '')))); }

  async function fetchLiveTemplates(){
    const token = getToken();
    const headers = { Accept:'application/vnd.github+json' };
    if(token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${apiBase}${TEMPLATE_PATH}?ref=${GH_BRANCH}`, { headers, cache:'no-store' });
    if(res.status === 404) return { data:defaultTemplates(), sha:undefined };
    if(!res.ok) throw new Error(`템플릿 파일을 불러오지 못했어요 (${res.status})`);
    const d = await res.json();
    return { data:JSON.parse(b64DecodeUnicode(d.content)), sha:d.sha };
  }
  async function applyTemplatesChange(mutate){
    const token = getToken();
    if(!token){ alert('먼저 토큰 설정에서 토큰을 등록해 주세요.'); return false; }
    for(let attempt = 0; attempt < 8; attempt++){
      try {
        const { data, sha } = await fetchLiveTemplates();
        normalizeTemplates(data);
        mutate(data);
        const res = await fetch(apiBase + TEMPLATE_PATH, {
          method:'PUT',
          headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json' },
          body: JSON.stringify({ message:'Update templates.json', content:toBase64Text(JSON.stringify(data, null, 2) + '\n'), branch:GH_BRANCH, ...(sha ? { sha } : {}) })
        });
        if(!res.ok) throw httpError(res, await res.json().catch(() => ({})), '저장 실패');
        templates = data;
        cacheTouch(TEMPLATE_PATH, data);
        return true;
      } catch(err){
        if(!isConflict(err) || attempt === 7){ alert('템플릿 저장에 실패했어요: ' + err.message); return false; }
        await backoff(attempt);
      }
    }
    return false;
  }
  let tplQueue = Promise.resolve(true);
  function saveTemplates(mutate){
    const run = tplQueue.then(() => applyTemplatesChange(mutate));
    tplQueue = run.catch(() => false);
    return run;
  }

  /* ----- 템플릿 관리 창 ----- */
  const tplModal = document.getElementById('tplModal');
  let mgrSel = null;
  let tplOnClose = null;

  function renderTplMgr(){
    if(!templates.find(t => t.id === mgrSel)) mgrSel = templates[0].id;
    const t = templates.find(x => x.id === mgrSel);
    const isHowon = t.name === '호원';
    const typeOpts = Object.keys(FIELD_TYPES).map(k => `<option value="${k}">${FIELD_TYPES[k]}</option>`).join('');
    document.getElementById('tplBody').innerHTML = `
      <h2 class="form-title">프로필 템플릿 관리</h2>
      <p class="form-hint">프로필 템플릿을 자유롭게 수정하세요.</p>
      <div class="tpl-tabs">
        ${templates.map(x => `<button type="button" class="tpl-tab${x.id === mgrSel ? ' active' : ''}" data-tact="sel" data-tid="${esc(x.id)}">${esc(x.name)}</button>`).join('')}
      </div>
      <label class="f-row tpl-owner"><span>오너명 표기</span><input class="f-input" id="tplOwnerLabel" value="${esc(t.ownerLabel || '')}" placeholder="${esc(t.name)}"></label>
      <hr class="soft-divider tpl-hr">
      ${isHowon ? `<div class="tpl-fields-core">${t.fields.filter(f => f.core).map(f => `<div class="tpl-row"><span class="tpl-grip off"></span><input class="f-input tpl-label" value="${esc(f.label)}" readonly><span class="tpl-type">필수</span><span class="tpl-btns"></span></div>`).join('')}</div>
      <p class="tpl-origin">다른 저장소에 있는 프로필 템플릿을 사용하고 있습니다.</p>
      <hr class="soft-divider tpl-hr">
      <div class="f-group">추가 템플릿</div>` : ''}
      <div class="tpl-fields">
        ${t.fields.filter(f => !isHowon || !f.core).map(f => `
          <div class="tpl-row" data-rkey="${esc(f.key)}">
            ${f.core ? '<span class="tpl-grip off"></span>' : '<span class="tpl-grip" title="끌어서 순서 변경">&#8942;&#8942;</span>'}
            <input class="f-input tpl-label" data-key="${esc(f.key)}" value="${esc(f.label)}" ${f.core ? 'readonly' : ''}>
            <span class="tpl-type">${f.core ? '필수' : FIELD_TYPES[f.type] || f.type}</span>
            <span class="tpl-btns">
              ${f.core ? '' : `<button type="button" class="text-btn danger" data-tact="delField" data-key="${esc(f.key)}" aria-label="삭제">&times;</button>`}
            </span>
          </div>`).join('')}
      </div>
      <div class="tpl-add">
        <input class="f-input" id="tplNewLabel" placeholder="새 항목 이름">
        <select class="f-input" id="tplNewType">${typeOpts}</select>
        <button type="button" class="form-submit" data-tact="addField">항목 추가</button>
      </div>
      <p class="form-error" id="tplStatus"></p>`;
    const fieldsBox = document.querySelector('#tplBody .tpl-fields');
    if(fieldsBox) makeSortable(fieldsBox, '.tpl-row', (rows) => {
      const keys = rows.map(r => r.dataset.rkey);
      tplDo(d => { const tt = withTpl(d); if(!tt) return; const core = tt.fields.filter(f => f.core); const rest = keys.map(k => tt.fields.find(f => f.key === k)).filter(f => f && !f.core); const left = tt.fields.filter(f => !f.core && !keys.includes(f.key)); tt.fields = core.concat(rest, left); });
    }, { always:true, handle:'.tpl-grip:not(.off)' });
  }
  function openTplMgr(onClose, startId){
    mgrSel = startId || (templates[0] && templates[0].id);
    tplOnClose = onClose || null;
    renderTplMgr();
    tplModal.classList.add('active');
  }
  function closeTplMgr(){
    tplModal.classList.remove('active');
    if(tplOnClose){ const f = tplOnClose; tplOnClose = null; f(); }
  }
  document.getElementById('tplClose').addEventListener('click', closeTplMgr);

  async function tplDo(mutate){
    const st = document.getElementById('tplStatus');
    if(st) st.textContent = '저장 중...';
    const ok = await saveTemplates(mutate);
    renderTplMgr();
    return ok;
  }
  const withTpl = (data) => data.find(x => x.id === mgrSel);

  document.getElementById('tplBody').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-tact]');
    if(!b) return;
    const act = b.dataset.tact, key = b.dataset.key;
    if(act === 'sel'){ mgrSel = b.dataset.tid; renderTplMgr(); return; }
    if(act === 'addTpl'){
      const name = prompt('새 템플릿 이름을 입력해 주세요.');
      if(!name || !name.trim()) return;
      const copy = confirm('현재 선택한 템플릿의 항목을 그대로 복사할까요?\n(취소를 누르면 이름 항목만 있는 빈 템플릿이 만들어져요)');
      const cur = templates.find(x => x.id === mgrSel);
      const id = 't_' + Date.now();
      const fields = copy && cur ? JSON.parse(JSON.stringify(cur.fields)) : [{ key:'name', label:'이름', type:'text', core:true }];
      if(await tplDo(d => d.push({ id, name:name.trim(), fields }))) mgrSel = id, renderTplMgr();
      return;
    }
    if(act === 'renameTpl'){
      const cur = templates.find(x => x.id === mgrSel);
      const name = prompt('템플릿 이름을 바꿔 주세요.', cur.name);
      if(!name || !name.trim() || name.trim() === cur.name) return;
      await tplDo(d => { const t = withTpl(d); if(t) t.name = name.trim(); });
      return;
    }
    if(act === 'tplLeft' || act === 'tplRight'){
      const dir = act === 'tplLeft' ? -1 : 1;
      await tplDo(d => { const i = d.findIndex(x => x.id === mgrSel), j = i + dir; if(i < 0 || j < 0 || j >= d.length) return; const [it] = d.splice(i, 1); d.splice(j, 0, it); });
      return;
    }
    if(act === 'delTpl'){
      if(templates.length <= 1){ alert('템플릿이 하나뿐이라 삭제할 수 없어요.'); return; }
      const cur = templates.find(x => x.id === mgrSel);
      if(!confirm(`"${cur.name}" 템플릿을 삭제할까요?\n이 템플릿을 쓰던 캐릭터는 첫 번째 템플릿으로 보여요. 캐릭터의 값은 지워지지 않아요.`)) return;
      await tplDo(d => { const i = d.findIndex(x => x.id === mgrSel); if(i >= 0) d.splice(i, 1); });
      return;
    }
    if(act === 'addField'){
      const label = document.getElementById('tplNewLabel').value.trim();
      const type = document.getElementById('tplNewType').value;
      if(!label){ document.getElementById('tplStatus').textContent = '항목 이름을 입력해 주세요.'; return; }
      const nk = 'f_' + Date.now();
      await tplDo(d => { const t = withTpl(d); if(t) t.fields.push({ key:nk, label, type }); });
      return;
    }
    if(act === 'delField'){
      if(!confirm('이 항목을 삭제할까요?\n(캐릭터에 저장된 값은 남아 있고 화면에서만 사라져요)')) return;
      await tplDo(d => { const t = withTpl(d); if(t) t.fields = t.fields.filter(f => f.key !== key); });
      return;
    }
  });
  document.getElementById('tplBody').addEventListener('change', async (e) => {
    if(e.target.id === 'tplOwnerLabel'){
      const v = e.target.value.trim();
      await tplDo(d => { const t = withTpl(d); if(t){ if(v) t.ownerLabel = v; else delete t.ownerLabel; } });
      return;
    }
    const inp = e.target.closest('.tpl-label');
    if(!inp || inp.readOnly) return;
    const label = inp.value.trim(), key = inp.dataset.key;
    if(!label){ renderTplMgr(); return; }
    await tplDo(d => { const t = withTpl(d); const f = t && t.fields.find(x => x.key === key); if(f) f.label = label; });
  });

  /* ----- 생성 / 수정 폼 ----- */
  let formTpl = null;      // 폼에서 현재 고른 템플릿
  let formInfo = null;     // 수정 중인 캐릭터 (새 캐릭터면 null)

  function fInput(label, id, val, ph){
    return `<label class="f-row"><span>${label}</span><input class="f-input" id="${id}" value="${esc(val)}" ${ph ? `placeholder="${ph}"` : ''}></label>`;
  }

  function widgetHtml(f, val){
    const k = esc(f.key);
    if(f.type === 'text') return `<input class="f-input" data-fkey="${k}" data-ftype="text" value="${esc(val == null ? '' : val)}">`;
    if(f.type === 'tags') return `<div class="f-tags" data-fkey="${k}" data-ftype="tags"><span class="chips"></span><input class="f-tag-input" placeholder="입력하고 Enter"></div>`;
    if(f.type === 'rating') return `<div class="f-rating" data-fkey="${k}" data-ftype="rating" data-val="${Number(val) || 0}"></div>`;
    if(f.type === 'gallery') return `<div class="f-gallery" data-fkey="${k}" data-ftype="gallery"></div>`;
    // textarea / collapse
    return `<div class="rt-wrap">${rtToolbarHtml()}<div class="rt-edit f-input" contenteditable="true" data-fkey="${k}" data-ftype="rich">${val ? toRich(val) : ''}</div></div>`;
  }

  function wireWidgets(root, tpl, values){
    tpl.fields.forEach(f => {
      if(f.core) return;
      const el = root.querySelector(`[data-fkey="${f.key}"]`);
      if(!el) return;
      const val = values[f.key];
      if(f.type === 'tags'){
        el._vals = Array.isArray(val) ? val.slice() : (val ? [String(val)] : []);
        const chips = el.querySelector('.chips'), inp = el.querySelector('input');
        const draw = () => { chips.innerHTML = el._vals.map((v, i) => `<span class="chip">${esc(v)}<button type="button" data-i="${i}">&times;</button></span>`).join(''); };
        const add = () => { const v = inp.value.trim().replace(/,$/, ''); if(v){ el._vals.push(v); inp.value = ''; draw(); } };
        inp.addEventListener('keydown', ev => { if(ev.key === 'Enter' || ev.key === ','){ ev.preventDefault(); add(); } });
        inp.addEventListener('blur', add);
        chips.addEventListener('click', ev => { const b = ev.target.closest('button'); if(b){ el._vals.splice(Number(b.dataset.i), 1); draw(); } });
        draw();
      } else if(f.type === 'gallery'){
        el._items = Array.isArray(val) ? val.map(x => Object.assign({}, x)) : [];
        const draw = () => {
          el.innerHTML = `<div class="gal-edit-grid">${el._items.map((it, i) => `<div class="gal-edit-tile" data-i="${i}"><div class="gal-edit-thumb">${it.pendingThumbUrl ? `<img src="${it.pendingThumbUrl}" alt="">` : (it.thumb || it.orig ? `<img src="${esc(galThumbSrc(it))}" alt="" onerror="window.__imgErr(this)">` : '')}</div><div class="gal-edit-actions"><button type="button" class="btn-sm" data-gthumb>썸네일 변경</button><button type="button" class="btn-sm danger" data-gdel>삭제</button></div></div>`).join('')}</div><div class="f-inline"><input type="file" accept="image/*" multiple data-gadd></div>`;
        };
        draw();
        el.addEventListener('change', (ev) => {
          const inp = ev.target.closest('[data-gadd]'); if(!inp) return;
          const files = [...inp.files]; inp.value = '';
          const next = () => {
            const file = files.shift(); if(!file) return;
            openCrop(file, (blob, ext) => {
              el._items.push({ id:'g' + Date.now().toString(36) + el._items.length, pendingOrig:{ blob:file, ext:extOf(file) }, pendingThumb:{ blob, ext }, pendingThumbUrl:URL.createObjectURL(blob) });
              draw(); setTimeout(next, 80); // 자르기 창이 닫힌 뒤에 다음 이미지를 연다
            }, { aspect:1, noOriginal:true, onCancel:() => setTimeout(next, 80) });
          };
          next();
        });
        el.addEventListener('click', async (ev) => {
          const tile = ev.target.closest('.gal-edit-tile'); if(!tile) return;
          const i = Number(tile.dataset.i), it = el._items[i]; if(!it) return;
          if(ev.target.closest('[data-gdel]')){ el._items.splice(i, 1); draw(); return; }
          if(ev.target.closest('[data-gthumb]')){
            let blob;
            try { blob = it.pendingOrig ? it.pendingOrig.blob : await (await fetch(galOrigSrc(it))).blob(); } catch(e){ blob = null; }
            if(!blob){ alert('원본 이미지를 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요.'); return; }
            openCrop(blob, (b, ext) => { it.pendingThumb = { blob:b, ext }; it.pendingThumbUrl = URL.createObjectURL(b); draw(); }, { aspect:1, noOriginal:true });
          }
        });
      } else if(f.type === 'rating'){
        const draw = () => {
          const n = Number(el.dataset.val) || 0;
          el.innerHTML = [1,2,3,4,5].map(i => `<button type="button" data-n="${i}">${i <= n ? '★' : '☆'}</button>`).join('') + `<button type="button" class="rate-clear" data-n="0">지우기</button>`;
        };
        el.addEventListener('click', ev => { const b = ev.target.closest('button'); if(b){ el.dataset.val = b.dataset.n; draw(); } });
        draw();
      }
    });
    root.querySelectorAll('.rt-toolbar button').forEach(b => {
      b.addEventListener('mousedown', ev => { ev.preventDefault(); rtExec(b.dataset.rt); });
    });
  }

  function collectFields(tpl){
    const out = {};
    tpl.fields.forEach(f => {
      if(f.core) return;
      const el = document.querySelector(`#fDynamic [data-fkey="${f.key}"]`);
      if(!el) return;
      if(f.type === 'tags'){
        const inp = el.querySelector('input'); const pend = inp && inp.value.trim();
        out[f.key] = el._vals.concat(pend ? [pend] : []);
      } else if(f.type === 'gallery') out[f.key] = el._items || [];
      else if(f.type === 'rating') out[f.key] = Number(el.dataset.val) || 0;
      else if(f.type === 'textarea' || f.type === 'collapse') out[f.key] = cleanHtml(el.innerHTML);
      else out[f.key] = el.value.trim();
    });
    return out;
  }

  // 폼에 미리 채울 값: 직접 입력한 값 > 예전 프로필 값 (oc 값은 보기 전용이라 여기에 넣지 않는다)
  function initialValues(info, tpl){
    const vals = {};
    tpl.fields.forEach(f => {
      if(f.core) return;
      if(!info) return;
      const linked = !!ocOverrides[info.name];
      if(!linked && (info.fieldsOwn || {})[f.key] === null) return;
      const v = ownValue(info, f);
      const o = v !== undefined ? v : (linked ? undefined : ocValue(info, f));
      const w = o !== undefined ? o : legacyValue(info, f);
      if(w !== undefined) vals[f.key] = w;
    });
    return vals;
  }

  const CLASS_FLAGS = ['회장', '부회장', '복학생', '편입생'];
  function renderDynamic(tpl, values){
    const box = document.getElementById('fDynamic');
    const prev = document.getElementById('fClubHead');
    const head = prev ? prev.checked : !!(formInfo && formInfo.clubHead);
    box.innerHTML = tpl.fields.filter(f => !f.core).map(f => {
      let extra = '';
      if(f.label === '동아리') extra = `<div class="f-checks"><label class="f-check"><input type="checkbox" id="fClubHead" ${head ? 'checked' : ''}><span>부장</span></label></div>`;
      return `<div class="f-row"><span>${esc(f.label)}</span>${widgetHtml(f, values[f.key])}${extra}</div>`;
    }).join('');
    wireWidgets(box, tpl, values);
  }

  function tplOptionsHtml(selectedId){
    return templates.map(t => `<option value="${esc(t.id)}" ${t.id === selectedId ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  }

  function tplByOwner(owner){ return templates.find(t => t.name === owner) || templates[0]; }

  function openForm(name){
    const info = name ? masterCharacters[name] : null;
    formInfo = info;
    pendingImage = null; removeImage = false;
    const owner0 = info ? info.owner : '호원';
    formTpl = tplByOwner(owner0);

    const colorNames = pickableColors(info && info.color ? [info.color] : []);
    const ownerOpts = (info && !info.owner ? ['<option value="">(미정)</option>'] : []).concat(OWNERS.map(o => `<option value="${o}" ${owner0 === o ? 'selected' : ''}>${o}</option>`)).join('');
    const curImg = info ? imgSrcFor(info.name, info.file) : '';
    const linked = info && ocOverrides[info.name];
    const role0 = info ? info.role : '';

    document.getElementById('formBody').innerHTML = `
      <h2 class="form-title">${info ? '캐릭터 수정' : '캐릭터 추가'}</h2>

      <label class="f-row"><span>오너</span><select class="f-input" id="fOwner">${ownerOpts}</select></label>
      

      <div class="f-group">이미지</div>
      <div class="f-image">
        <div class="f-thumb" id="fThumb">${curImg ? `<img src="${esc(curImg)}" alt="" onerror="window.__imgErr(this)">` : ''}</div>
        <div>
          <div class="f-inline"><input type="file" id="fImage" accept="image/*"><button type="button" class="btn-sm danger" id="fImageDel">삭제</button></div>
          <p class="form-hint" id="fImageNote"></p>
        </div>
      </div>

      <div class="f-group">NAME</div>
      ${fInput('이름', 'fName', info ? info.name : '')}

      <div class="f-group">GROUP · 카테고리 설정용 <span class="f-group-note">(프로필에 안 떠요!!)</span></div>
      <label class="f-row"><span>그룹명</span><input class="f-input" id="fGroup" list="fGroupNames" value="${esc(info ? info.group : '')}" autocomplete="off"></label>
      <datalist id="fGroupNames">${groups.map(g => g.name).sort((a, b) => a.localeCompare(b, 'ko')).map(n => `<option value="${esc(n)}">`).join('')}</datalist>
      <div class="f-row"><span>역할</span><div class="f-checks">
        <label class="f-check"><input type="checkbox" id="fRoleLeader" ${role0 === '리더' ? 'checked' : ''}><span>리더</span></label>
        <label class="f-check"><input type="checkbox" id="fRoleManager" ${role0 === '매니저' ? 'checked' : ''}><span>매니저</span></label>
      </div></div>
      <div class="f-row"><span>그룹 내 담당 컬러 (선택)</span>
        <div class="f-inline"><span class="gd-color-dot" id="fColorDot" style="background:${info && colorMap[info.color] ? colorMap[info.color] : 'transparent'}"></span><input class="f-input" id="fColor" list="fColorNames" value="${esc(info && info.color ? info.color : '')}" autocomplete="off"></div></div>
      <datalist id="fColorNames">${colorNames.map(c => `<option value="${esc(c)}">`).join('')}</datalist>

      <div class="f-group">CLASS · 카테고리 설정용 <span class="f-group-note">(프로필에 안 떠요!!)</span></div>
      <label class="f-row"><span>학급</span><input class="f-input" value="${esc(info && info.classId ? info.classId : '미지정')}" readonly></label>
      <div class="f-checks" id="fClassFlags">${CLASS_FLAGS.map(fl => `<label class="f-check"><input type="checkbox" data-cflag="${fl}" ${((info && info.classFlags) || []).includes(fl) ? 'checked' : ''}><span>${fl}</span></label>`).join('')}</div>

      <div class="f-group">PROFILE</div>
      <div id="fDynamic"></div>

      <p class="form-error" id="formError"></p>
      <div class="form-actions">
        ${info && charFiles[info.name] ? '<button type="button" class="btn-sm danger" id="formReset">내용 초기화</button>' : '<span></span>'}
        <button type="button" class="form-submit" id="formSave">저장</button>
      </div>`;
    formModal.classList.add('active');
    renderDynamic(formTpl, initialValues(info, formTpl));
    const rs = document.getElementById('formReset');
    if(rs) rs.addEventListener('click', () => resetCharacter(info));

    document.getElementById('fOwner').addEventListener('change', (e) => changeFormTemplate(e.target.value));
    document.querySelectorAll('#fClassFlags [data-cflag]').forEach(c => c.addEventListener('change', () => {
      if(!c.checked) return;
      const pairs = { '회장':'부회장', '부회장':'회장', '복학생':'편입생', '편입생':'복학생' };
      const o = document.querySelector(`#fClassFlags [data-cflag="${pairs[c.dataset.cflag]}"]`); if(o) o.checked = false;
    }));
    const leader = document.getElementById('fRoleLeader'), mgr = document.getElementById('fRoleManager');
    leader.addEventListener('change', () => { if(leader.checked) mgr.checked = false; });
    mgr.addEventListener('change', () => { if(mgr.checked) leader.checked = false; });
    document.getElementById('fColor').addEventListener('input', (e) => {
      const hex = colorMap[e.target.value.trim()];
      document.getElementById('fColorDot').style.background = hex || 'transparent';
    });
    document.getElementById('fImageDel').addEventListener('click', () => {
      pendingImage = null; removeImage = true;
      document.getElementById('fImage').value = '';
      document.getElementById('fThumb').innerHTML = '';
      document.getElementById('fImageNote').textContent = '';
    });
    document.getElementById('fImage').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if(!f) return;
      openCrop(f, (blob, ext) => {
        pendingImage = { blob, ext }; removeImage = false;
        document.getElementById('fThumb').innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="">`;
        document.getElementById('fImageNote').textContent = '';
      });
    });
    document.getElementById('formSave').addEventListener('click', () => submitForm(info));
  }

  function changeFormTemplate(owner){
    const snap = collectFields(formTpl);
    formTpl = tplByOwner(owner);
    renderDynamic(formTpl, Object.assign(initialValues(formInfo, formTpl), snap));
  }

  async function submitForm(info){
    const err = document.getElementById('formError');
    err.textContent = '';
    const name = document.getElementById('fName').value.trim();
    if(!name){ err.textContent = '이름을 입력해 주세요.'; return; }
    const same = masterCharacters[name];
    if(same && (!info || same.name !== info.name)){ err.textContent = '같은 이름의 캐릭터가 이미 있어요.'; return; }
    if(!getToken()){ err.textContent = '먼저 토큰 설정에서 토큰을 등록해 주세요.'; return; }

    const fields = Object.assign({}, (charFiles[info && info.name] || {}).fields || {}, collectFields(formTpl));
    // oc에서 불러온 값을 그대로 둔 항목은 저장하지 않아서, oc 쪽에서 나중에 바뀌어도 계속 따라간다.
    // 비워 둔 항목: oc나 예전 값이 있으면 '직접 비움'(null)으로 저장해서 그 값이 다시 나오지 않게 하고, 없으면 저장하지 않는다.
    const hadFields = (charFiles[info && info.name] || {}).fields || {};
    const shown = info ? initialValues(info, formTpl) : {};
    formTpl.fields.forEach(f => {
      if(f.core || !(f.key in fields)) return;
      const val = fields[f.key];
      if(info && ocOverrides[info.name]){
        const ov = ocValue(info, f);
        if(ov !== undefined && JSON.stringify(ov) === JSON.stringify(val)){ delete fields[f.key]; return; }
      }
      const empty = isEmptyVal(val) || (f.type === 'rating' && !Number(val));
      if(!empty) return;
      // 폼을 열었을 때 값이 있었거나 저장된 값이 있었다면, 지운 것은 '직접 비움'으로 꼭 남긴다. (다른 출처의 값이 다시 나오지 않도록)
      const wasSet = !isEmptyVal(shown[f.key]) || (!isEmptyVal(hadFields[f.key]) && !(f.type === 'rating' && !Number(hadFields[f.key])));
      const linked = !!(info && ocOverrides[info.name]);
      const fallback = linked ? false : info ? (wasSet || ocValue(info, f) !== undefined || legacyValue(info, f) !== undefined) : false;
      if(fallback) fields[f.key] = null; else delete fields[f.key];
    });

    // 파일 식별자: 기존 캐릭터는 그대로, 새 캐릭터는 이름 옆의 영어 이름 칸이 있으면 거기서, 없으면 자동 번호.
    let id = info && info.id ? info.id : '';
    if(!id){
      const enField = formTpl.fields.find(f => /영어/.test(f.label) && !f.core);
      const en = enField ? String(fields[enField.key] || '').split('/')[0] : '';
      id = en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const used = new Set(Object.values(masterCharacters).map(m => m.id).concat(Object.values(charFiles).map(c => c.id)));
      if(!id) id = 'char-' + Date.now();
      else if(used.has(id)) id += '-' + Date.now().toString(36);
    }

    const prev = (info && charFiles[info.name]) || {};
    const data = {
      id, name, file:id,
      group: document.getElementById('fGroup').value.trim(),
      role: document.getElementById('fRoleLeader').checked ? '리더' : (document.getElementById('fRoleManager').checked ? '매니저' : ''),
      color: document.getElementById('fColor').value.trim() || null,
      owner: document.getElementById('fOwner').value,
      template: formTpl.id,
      clubHead: !!(document.getElementById('fClubHead') && document.getElementById('fClubHead').checked),
      classFlags: [...document.querySelectorAll('#fClassFlags [data-cflag]:checked')].map(x => x.dataset.cflag),
      image: removeImage ? null : (prev.image || null),
      imageV: removeImage ? null : (prev.imageV || null),
      noImage: removeImage ? true : (pendingImage ? false : !!prev.noImage),
      fields
    };
    if(prev.profile) data.profile = prev.profile; // 예전 형식 값은 그대로 보존

    const btn = document.getElementById('formSave');
    btn.disabled = true; btn.textContent = '저장 중...';
    try {
      if(pendingImage){
        const imgPath = `assets/ymkb_icon_${id}.${pendingImage.ext}`;
        await ghPut(imgPath, await blobToBase64(pendingImage.blob), `Update image: ${name}`);
        data.image = imgPath;
        data.imageV = Date.now();
      }
      // 갤러리: 새로 고른 원본/썸네일을 올리고, 지운 이미지 파일은 저장이 끝난 뒤에 지운다.
      const galDel = [], galKeep = new Set();
      for(const f of formTpl.fields){
        if(f.type !== 'gallery') continue;
        const old = Array.isArray(hadFields[f.key]) ? hadFields[f.key] : [];
        const items = Array.isArray(fields[f.key]) ? fields[f.key] : [];
        const clean = [];
        for(const it of items){
          const c = { id:it.id, orig:it.orig || null, origV:it.origV || null, thumb:it.thumb || null, thumbV:it.thumbV || null };
          if(it.pendingOrig){
            const gp = `assets/ymkb_gal_${id}_${it.id}.${it.pendingOrig.ext}`;
            await ghPut(gp, await blobToBase64(it.pendingOrig.blob), `Add gallery image: ${name}`);
            if(c.orig && c.orig !== gp) galDel.push(c.orig);
            c.orig = gp; c.origV = Date.now();
          }
          if(it.pendingThumb){
            const tp = `assets/ymkb_galt_${id}_${it.id}.${it.pendingThumb.ext}`;
            await ghPut(tp, await blobToBase64(it.pendingThumb.blob), `Add gallery thumbnail: ${name}`);
            if(c.thumb && c.thumb !== tp) galDel.push(c.thumb);
            c.thumb = tp; c.thumbV = Date.now();
          }
          if(c.orig || c.thumb){ clean.push(c); if(c.orig) galKeep.add(c.orig); if(c.thumb) galKeep.add(c.thumb); }
        }
        const keepIds = new Set(clean.map(c => c.id));
        old.forEach(o => { if(o && !keepIds.has(o.id)){ if(o.orig) galDel.push(o.orig); if(o.thumb) galDel.push(o.thumb); } });
        if(clean.length) fields[f.key] = clean; else delete fields[f.key];
      }
      await ghPut(`${CHAR_DIR}/${id}.json`, toBase64Text(JSON.stringify(data, null, 2) + '\n'), `${info ? 'Update' : 'Add'} character: ${name}`);
      for(const gp of galDel){ if(!galKeep.has(gp)){ try { await ghDelete(gp, `Remove gallery image: ${name}`); } catch(e){} } }
      if(prev.image && prev.image !== data.image){ try { await ghDelete(prev.image, `Replace image: ${name}`); } catch(e){} }
      reloadKeepingView({ profile:name });
    } catch(e){
      btn.disabled = false; btn.textContent = '저장';
      err.textContent = e.message === 'NO_TOKEN' ? '먼저 토큰 설정에서 토큰을 등록해 주세요.' : '저장에 실패했어요: ' + e.message;
    }
  }

  // 이 캐릭터의 ymkb 쪽 프로필 내용만 비운다. 이름, 그룹, 오너, 사진은 그대로 두고, oc 연동 캐릭터는 oc 값이 다시 그대로 보인다.
  async function resetCharacter(info){
    const cf = charFiles[info.name];
    if(!cf) return;
    if(!getToken()){ alert('먼저 토큰 설정에서 토큰을 등록해 주세요.'); return; }
    if(!confirm(`"${info.name}"의 ymkb 프로필 내용을 모두 비울까요?\n이름, 그룹, 오너, 사진은 그대로 남아요.`)) return;
    const data = { id:cf.id, name:cf.name, file:cf.file || cf.id, group:cf.group || '', role:cf.role || '', color:cf.color || null, owner:cf.owner || '', template:cf.template || '', image:cf.image || null, imageV:cf.imageV || null, noImage:!!cf.noImage, fields:{} };
    try {
      await ghPut(`${CHAR_DIR}/${cf.id}.json`, toBase64Text(JSON.stringify(data, null, 2) + '\n'), `Reset profile: ${info.name}`);
      reloadKeepingView({ profile:info.name });
    } catch(e){
      document.getElementById('formError').textContent = '초기화에 실패했어요: ' + e.message;
    }
  }

  async function deleteCharacter(name){
    const info = masterCharacters[name];
    if(!info) return;
    const cf = charFiles[name];
    if(!getToken()){ alert('먼저 토큰 설정에서 토큰을 등록해 주세요.'); return; }
    if(!confirm(`"${name}" 캐릭터를 삭제할까요?\n사이트에서 보이지 않게 돼요.`)) return;
    try {
      const id = info.id || info.file;
      if(info.base){
        if(!id){ alert('이 캐릭터는 파일 이름이 없어서 지울 수 없어요.'); return; }
        await ghPut(`${CHAR_DIR}/${id}.json`, toBase64Text(JSON.stringify({ id, name, file:id, deleted:true }, null, 2) + '\n'), `Delete character: ${name}`);
      } else if(cf){
        await ghDelete(cf._path, `Delete character: ${name}`);
        if(cf.image){ try { await ghDelete(cf.image, `Delete image: ${name}`); } catch(e){} }
      } else { alert('지울 데이터를 찾지 못했어요.'); return; }
      reloadKeepingView();
    } catch(e){
      alert('삭제에 실패했어요: ' + e.message);
    }
  }


  /* ----- 그룹 추가 / 수정 / 삭제 ----- */
  /* 색 이름 -> 색깔 자동 찾기 (한국어/영어 이름, '연한', '진한' 같은 꾸밈말 지원) */
  const KO_COLORS = {
    '빨강':'#E53935','빨간':'#E53935','레드':'#E53935','적':'#D32F2F','주황':'#FB8C00','주황색':'#FB8C00','오렌지':'#FB8C00','노랑':'#FDD835','노란':'#FDD835','옐로우':'#FDD835','옐로':'#FDD835','황':'#F9A825','초록':'#43A047','초록색':'#43A047','그린':'#43A047','녹':'#2E7D32','녹색':'#43A047',
    '파랑':'#1E88E5','파란':'#1E88E5','블루':'#1E88E5','청':'#2196F3','남색':'#1A237E','네이비':'#1A237E','군청':'#283593','보라':'#8E24AA','보라색':'#8E24AA','퍼플':'#8E24AA','바이올렛':'#7E57C2','분홍':'#F06292','분홍색':'#F06292','핑크':'#F06292','하늘':'#4FC3F7','하늘색':'#4FC3F7','스카이':'#4FC3F7','스카이블루':'#4FC3F7','민트':'#3EB489','청록':'#00897B','터콰이즈':'#30D5C8','터쿼이즈':'#30D5C8','티얼':'#00897B','시안':'#00BCD4','사이언':'#00BCD4','아쿠아':'#4DD0E1','연두':'#9CCC65','연두색':'#9CCC65','라임':'#C0CA33','올리브':'#808000','카키':'#8A9A5B','에메랄드':'#50C878',
    '갈색':'#795548','브라운':'#795548','밤색':'#6D4C41','카멜':'#C19A6B','초콜릿':'#5D4037','초코':'#5D4037','베이지':'#D9C3A0','샌드':'#E2CA76','크림':'#FFF3C4','아이보리':'#FFFFF0','살구':'#FFAB91','살구색':'#FFAB91','피치':'#FFAB91','코랄':'#FF6F61','연어':'#FA8072','살몬':'#FA8072','로즈':'#E91E63','체리':'#D2042D','크림슨':'#DC143C','스칼렛':'#FF2400','루비':'#E0115F','자주':'#8E244C','자주색':'#8E244C','마젠타':'#D81B60','와인':'#722F37','버건디':'#800020','적갈색':'#8D3B2E','라벤더':'#B39DDB','라일락':'#C8A2C8','연보라':'#C3B1E1','인디고':'#3F51B5','사파이어':'#0F52BA','앰버':'#FFC107','호박색':'#FFB300','골드':'#D4AF37','금':'#D4AF37','금색':'#D4AF37','실버':'#C0C0C0','은':'#C0C0C0','은색':'#C0C0C0',
    '검정':'#212121','검정색':'#212121','검은':'#212121','블랙':'#212121','흑':'#212121','흑색':'#212121','차콜':'#36454F','회색':'#9E9E9E','회':'#9E9E9E','그레이':'#9E9E9E','그레이색':'#9E9E9E','하양':'#FFFFFF','하얀':'#FFFFFF','흰':'#FFFFFF','흰색':'#FFFFFF','화이트':'#FFFFFF','백':'#FFFFFF','백색':'#FFFFFF','투명':'#FFFFFF'
  };
  const LIGHT_WORDS = ['연한','옅은','연','밝은','라이트','파스텔','pale','light'];
  const DARK_WORDS = ['진한','짙은','진','어두운','다크','딥','dark','deep'];
  function mixHex(hex, to, amt){
    const n = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
    const c = [0, 1, 2].map(i => Math.round(n(hex, i) * (1 - amt) + n(to, i) * amt).toString(16).padStart(2, '0'));
    return '#' + c.join('').toUpperCase();
  }
  function cssColor(name){
    try {
      const cx = document.createElement('canvas').getContext('2d');
      cx.fillStyle = '#010203'; cx.fillStyle = name; const a = cx.fillStyle;
      cx.fillStyle = '#fefdfc'; cx.fillStyle = name; const b = cx.fillStyle;
      if(a !== b) return null; // 이름을 못 알아봤다
      if(/^#/.test(a)) return a.toUpperCase();
      const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(a);
      if(m) return '#' + [m[1], m[2], m[3]].map(x => Number(x).toString(16).padStart(2, '0')).join('').toUpperCase();
    } catch(e){}
    return null;
  }
  function resolveColor(raw){
    let name = String(raw || '').trim();
    if(!name) return null;
    if(colorMap[name]) return colorMap[name];
    let key = name.replace(/\s+/g, '').toLowerCase().replace(/[(){}]/g, '');
    if(KO_COLORS[key]) return KO_COLORS[key];
    const hexm = /^#?([0-9a-f]{6})$/i.exec(key); if(hexm) return '#' + hexm[1].toUpperCase();
    const css = cssColor(key); if(css && !/^(inherit|initial|unset|currentcolor)$/.test(key)) return css;
    for(const [words, to, amt] of [[LIGHT_WORDS, '#FFFFFF', 0.5], [DARK_WORDS, '#000000', 0.35]]){
      for(const w of words){
        if(key.startsWith(w) && key.length > w.length){
          const rest = key.slice(w.length);
          const base = KO_COLORS[rest] || cssColor(rest);
          if(base) return mixHex(base, to, amt);
        }
      }
    }
    // 끝의 '색'을 떼고 한 번 더 찾는다
    const t = key.replace(/(색|빛)$/, '');
    if(t !== key && t){ const r = resolveColor(t); if(r) return r; }
    return null;
  }

  function openGroupForm(g){
    pendingImage = null; removeImage = false;
    const isEdit = !!g;
    let sel = g ? g.colors.slice() : [];
    const newColors = {};
    const removed = new Set();
    const chipHtml = () => pickableColors(sel).filter(c => !removed.has(c)).map(c => {
      const on = sel.includes(c);
      return `<span class="color-pick${on ? ' on' : ''}" data-c="${esc(c)}"><span class="gd-color-dot" style="background:${colorMap[c]}"></span>${esc(c)}<span class="color-del" data-del="${esc(c)}" title="이 색 삭제">&times;</span></span>`;
    }).join('');
    document.getElementById('formBody').innerHTML = `
      <h2 class="form-title">${isEdit ? '그룹 수정' : '그룹 추가'}</h2>
      ${fInput('이름', 'gName', g ? g.name : '')}
      ${fInput('컨셉', 'gConcept', g ? g.concept : '')}
      ${fInput('주력 장르', 'gGenre', g ? g.genre : '')}
      ${fInput('팬덤명', 'gFandom', g ? g.fandom : '')}
      <div class="f-row"><span>대표 컬러</span><div class="color-picks" id="gColors">${chipHtml()}</div>
        <div class="color-name-row"><input class="f-input" id="gNewColorName" placeholder="색 이름"><span class="gd-color-dot" id="gNewColorDot" style="background:transparent"></span><button type="button" class="text-btn" id="gAddColor">색 추가</button></div></div>
      <div class="f-row"><span>소개</span><textarea class="f-input" rows="3" id="gIntro">${esc(g ? g.intro : '')}</textarea></div>
      <div class="f-group">이미지</div>
      <div class="f-image">
        <div class="f-thumb square" id="fThumb">${g && g.image ? `<img src="${esc(groupImgSrc(g))}" alt="" onerror="window.__imgErr(this)">` : ''}</div>
        <div>
          <div class="f-inline"><input type="file" id="fImage" accept="image/*"><button type="button" class="btn-sm danger" id="fImageDel">삭제</button></div>
          <p class="form-hint" id="fImageNote"></p>
        </div>
      </div>
      <div class="f-group">DISCOGRAPHY</div>
      <div id="gDisco"></div>
      <button type="button" class="text-btn" id="gAddDisco">+ 음원 추가</button>
      <p class="form-error" id="formError"></p>
      <div class="form-actions"><span></span><button type="button" class="form-submit" id="formSave">저장</button></div>`;
    formModal.classList.add('active');
    const disco = (g && Array.isArray(g.discography) ? g.discography : []).map(d => Object.assign({}, d));
    const syncDisco = () => {
      document.querySelectorAll('#gDisco .disco-edit-row').forEach(row => {
        const d = disco[Number(row.dataset.i)]; if(!d) return;
        d.title = row.querySelector('[data-d=title]').value.trim();
        d.date = row.querySelector('[data-d=date]').value;
        d.link = row.querySelector('[data-d=link]').value.trim();
      });
    };
    const drawDisco = () => {
      const box = document.getElementById('gDisco');
      box.innerHTML = disco.map((d, i) => `<div class="disco-edit-row" data-i="${i}">
        <div class="f-thumb square">${d.pendingUrl ? `<img src="${d.pendingUrl}" alt="">` : (d.cover ? `<img src="${esc(discCoverSrc(d))}" alt="" onerror="window.__imgErr(this)">` : '')}</div>
        <div class="disco-edit-fields">
          <div class="f-inline"><input type="file" data-d="file" accept="image/*"><button type="button" class="btn-sm danger" data-dimgdel>이미지 삭제</button></div>
          <input class="f-input" data-d="title" placeholder="음원명" value="${esc(d.title || '')}">
          <input class="f-input" data-d="date" type="date" value="${esc(d.date || '')}">
          <input class="f-input" data-d="link" placeholder="바로가기 링크" value="${esc(d.link || '')}">
        </div>
        <button type="button" class="x-btn" data-ddel title="삭제" aria-label="삭제">&times;</button>
      </div>`).join('');
      box.querySelectorAll('.disco-edit-row').forEach(row => {
        const i = Number(row.dataset.i);
        row.querySelector('[data-d=file]').addEventListener('change', (e) => {
          const f = e.target.files[0]; if(!f) return;
          openCrop(f, (blob, ext) => { syncDisco(); disco[i].pending = { blob, ext }; disco[i].pendingUrl = URL.createObjectURL(blob); drawDisco(); }, { aspect:1, noOriginal:true });
        });
      });
    };
    drawDisco();
    document.getElementById('gAddDisco').addEventListener('click', () => { syncDisco(); disco.push({ id:'d' + Date.now().toString(36) + disco.length, title:'', date:'', link:'', cover:null, coverV:null }); drawDisco(); });
    document.getElementById('gDisco').addEventListener('click', (e) => {
      const row = e.target.closest('.disco-edit-row'); if(!row) return;
      const i = Number(row.dataset.i);
      if(e.target.closest('[data-ddel]')){ syncDisco(); disco.splice(i, 1); drawDisco(); }
      else if(e.target.closest('[data-dimgdel]')){ syncDisco(); disco[i].cover = null; disco[i].coverV = null; disco[i].pending = null; disco[i].pendingUrl = null; drawDisco(); }
    });
    document.getElementById('gColors').addEventListener('click', (e) => {
      const del = e.target.closest('[data-del]');
      if(del){
        const dc = del.dataset.del;
        sel = sel.filter(x => x !== dc);
        removed.add(dc); delete newColors[dc];
        document.getElementById('gColors').innerHTML = chipHtml();
        return;
      }
      const b = e.target.closest('.color-pick'); if(!b) return;
      const c = b.dataset.c;
      sel = sel.includes(c) ? sel.filter(x => x !== c) : sel.concat([c]);
      document.getElementById('gColors').innerHTML = chipHtml();
    });
    document.getElementById('gAddColor').addEventListener('click', () => {
      const nm = document.getElementById('gNewColorName').value.trim();
      if(!nm) return;
      const hx = resolveColor(nm) || '#CCCCCC';
      if(!colorMap[nm]){ colorMap[nm] = hx; newColors[nm] = hx; }
      removed.delete(nm);
      if(!sel.includes(nm)) sel.push(nm);
      document.getElementById('gColors').innerHTML = chipHtml();
      document.getElementById('gNewColorName').value = '';
      document.getElementById('gNewColorDot').style.background = 'transparent';
    });
    document.getElementById('gNewColorName').addEventListener('input', (e) => {
      document.getElementById('gNewColorDot').style.background = resolveColor(e.target.value) || 'transparent';
    });
    document.getElementById('gNewColorName').addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); document.getElementById('gAddColor').click(); } });
    document.getElementById('fImageDel').addEventListener('click', () => {
      pendingImage = null; removeImage = true;
      document.getElementById('fImage').value = '';
      document.getElementById('fThumb').innerHTML = '';
      document.getElementById('fImageNote').textContent = '';
    });
    document.getElementById('fImage').addEventListener('change', (e) => {
      const f = e.target.files[0]; if(!f) return;
      openCrop(f, (blob, ext) => {
        pendingImage = { blob, ext }; removeImage = false;
        document.getElementById('fThumb').innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="">`;
        document.getElementById('fImageNote').textContent = '';
      }, { aspect:1, noOriginal:true });
    });
    document.getElementById('formSave').addEventListener('click', () => submitGroupForm(g, () => sel, newColors, removed, () => { syncDisco(); return disco; }));
  }

  async function submitGroupForm(g, getSel, newColors, removed, getDisco){
    const err = document.getElementById('formError');
    err.textContent = '';
    const name = document.getElementById('gName').value.trim();
    if(!name){ err.textContent = '이름을 입력해 주세요.'; return; }
    if(groups.some(x => x.name === name && (!g || x.id !== g.id))){ err.textContent = '같은 이름의 그룹이 이미 있어요.'; return; }
    if(!getToken()){ err.textContent = '먼저 토큰 설정에서 토큰을 등록해 주세요.'; return; }
    const colors = getSel();
    const id = g ? g.id : (slugOf(name) && !groups.some(x => x.id === slugOf(name)) ? slugOf(name) : 'group-' + Date.now());
    const data = {
      id, name,
      concept: document.getElementById('gConcept').value.trim(),
      genre: document.getElementById('gGenre').value.trim(),
      fandom: document.getElementById('gFandom').value.trim(),
      colors,
      intro: document.getElementById('gIntro').value.trim(),
      image: g && !removeImage ? g.image || null : null,
      imageV: g && !removeImage ? g.imageV || null : null
    };
    const discoList = getDisco ? getDisco() : [];
    const oldCovers = (g && Array.isArray(g.discography) ? g.discography : []).map(d => d.cover).filter(Boolean);
    const btn = document.getElementById('formSave');
    btn.disabled = true; btn.textContent = '저장 중...';
    let oldImage = null;
    try {
      if((newColors && Object.keys(newColors).length) || (removed && removed.size)){
        const okc = await jsonChange(SITE_PATH, () => ({}), (d) => {
          d.colors = Object.assign(d.colors || {}, newColors || {});
          const hid = new Set(Array.isArray(d.hiddenColors) ? d.hiddenColors : []);
          (removed ? [...removed] : []).forEach(c => hid.add(c));
          Object.keys(newColors || {}).forEach(c => hid.delete(c));
          colors.forEach(c => hid.delete(c));
          d.hiddenColors = [...hid];
        }, 'Update colors');
        if(!okc) throw new Error('색 저장에 실패했어요');
      }
      if(pendingImage){
        const imgPath = `assets/ymkb_group_${id}.${pendingImage.ext}`;
        await ghPut(imgPath, await blobToBase64(pendingImage.blob), `Update group image: ${name}`);
        oldImage = data.image;
        data.image = imgPath; data.imageV = Date.now();
      }
      if(removeImage && g && g.file && g.file.image && g.file.image === g.image) oldImage = g.image;
      const outDisco = [];
      for(const d of discoList){
        const item = { id:d.id, title:d.title || '', date:d.date || '', link:d.link || '', cover:d.cover || null, coverV:d.coverV || null };
        if(d.pending){
          const cp = `assets/ymkb_disc_${id}_${d.id}.${d.pending.ext}`;
          await ghPut(cp, await blobToBase64(d.pending.blob), `Update cover: ${item.title}`);
          item.cover = cp; item.coverV = Date.now();
        }
        if(item.title || item.cover || item.link) outDisco.push(item);
      }
      data.discography = outDisco;
      await ghPut(`${GROUP_DIR}/${id}.json`, toBase64Text(JSON.stringify(data, null, 2) + '\n'), `${g ? 'Update' : 'Add'} group: ${name}`);
      if(oldImage && oldImage !== data.image){ try { await ghDelete(oldImage, `Replace group image: ${name}`); } catch(e){} }
      const keep = new Set(outDisco.map(d => d.cover).filter(Boolean));
      for(const c of oldCovers){ if(!keep.has(c)){ try { await ghDelete(c, 'Remove cover'); } catch(e){} } }
      reloadKeepingView();
    } catch(e){
      btn.disabled = false; btn.textContent = '저장';
      err.textContent = e.message === 'NO_TOKEN' ? '먼저 토큰 설정에서 토큰을 등록해 주세요.' : '저장에 실패했어요: ' + e.message;
    }
  }

  async function deleteGroup(g){
    if(!getToken()){ alert('먼저 토큰 설정에서 토큰을 등록해 주세요.'); return; }
    const n = g.members.length;
    if(!confirm(`"${g.name}" 그룹을 삭제할까요?${n ? `\n소속된 캐릭터 ${n}명도 이 그룹과 함께 보이지 않게 돼요.` : ''}`)) return;
    try {
      if(g.base){
        await ghPut(`${GROUP_DIR}/${g.id}.json`, toBase64Text(JSON.stringify({ id:g.id, name:g.name, deleted:true }, null, 2) + '\n'), `Delete group: ${g.name}`);
      } else if(g.file){
        await ghDelete(g.file._path, `Delete group: ${g.name}`);
        if(g.file.image){ try { await ghDelete(g.file.image, `Delete group image: ${g.name}`); } catch(e){} }
      }
      reloadKeepingView();
    } catch(e){ alert('삭제에 실패했어요: ' + e.message); }
  }

  document.getElementById('addGroupBtn').addEventListener('click', () => openGroupForm(null));
  document.getElementById('gdEdit').addEventListener('click', () => { if(currentGroup) openGroupForm(currentGroup); });
  document.getElementById('gdDelete').addEventListener('click', () => { if(currentGroup) deleteGroup(currentGroup); });


  /* ----- JSON 파일 한 개를 안전하게 고치기 (최신 내용을 다시 받아 이번 변경만 적용, 충돌이면 재시도) ----- */
  async function jsonChange(path, fallbackFn, mutate, message){
    const token = getToken();
    if(!token){ alert('먼저 토큰 설정에서 토큰을 등록해 주세요.'); return false; }
    return queued(async () => {
    for(let attempt = 0; attempt < 8; attempt++){
      try {
        const res = await fetch(`${apiBase}${path}?ref=${GH_BRANCH}&t=${Date.now()}`, { headers:{ Accept:'application/vnd.github+json', Authorization:`Bearer ${token}` }, cache:'no-store' });
        let data, sha;
        if(res.status === 404){ data = fallbackFn(); }
        else if(!res.ok){
          const rr = await fetch(`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${path}?t=${Date.now()}`, { cache:'no-store' });
          if(rr.status === 404){ data = fallbackFn(); }
          else if(!rr.ok) throw new Error(`파일을 불러오지 못했어요 (${res.status})`);
          else { data = await rr.json(); sha = await shaFromRaw(path); }
        }
        else { const d = await res.json(); data = JSON.parse(b64DecodeUnicode(d.content)); sha = d.sha; }
        mutate(data);
        const put = await fetch(apiBase + path, {
          method:'PUT',
          headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json' },
          body: JSON.stringify({ message, content:toBase64Text(JSON.stringify(data, null, 2) + '\n'), branch:GH_BRANCH, ...(sha ? { sha } : {}) })
        });
        if(!put.ok) throw httpError(put, await put.json().catch(() => ({})), '저장 실패');
        cacheTouch(path, data);
        return true;
      } catch(err){
        if(!isConflict(err) || attempt === 7){ alert('저장에 실패했어요: ' + err.message); return false; }
        await backoff(attempt);
      }
    }
    return false;
    });
  }

  /* ----- 학급 추가 / 수정 / 삭제 (data/classes.json) ----- */
  function rosterRowHtml(r){
    return `<div class="tpl-row roster-row"><input class="f-input" data-r="name" autocomplete="off" placeholder="학생 이름" value="${esc(r.name || '')}"><button type="button" class="x-btn" data-rdel title="삭제" aria-label="삭제">&times;</button></div>`;
  }
  function openClassForm(sec){
    const grade = sec ? classes.find(g => g.sections.includes(sec)).grade : (classes[0] ? classes[0].grade : '');
    document.getElementById('formBody').innerHTML = `
      <h2 class="form-title">${sec ? '학급 수정' : '학급 추가'}</h2>
      <label class="f-row"><span>학년</span><input class="f-input" id="cGrade" list="gradeNames" value="${esc(grade)}" placeholder="예: 3학년"></label>
      <datalist id="gradeNames">${classes.map(g => `<option value="${esc(g.grade)}">`).join('')}</datalist>
      ${fInput('학급 이름', 'cId', sec ? sec.id : '', '예: 3-A')}
      ${fInput('담당 교사', 'cTeacher', sec ? sec.teacher : '')}
      <div class="f-group">학생 명단</div>
      <div id="cRoster">${(sec ? sec.roster : []).map(rosterRowHtml).join('')}</div>
      <button type="button" class="text-btn" id="cAddRow">+ 학생 추가</button>
      <p class="form-error" id="formError"></p>
      <div class="form-actions"><span></span><button type="button" class="form-submit" id="formSave">저장</button></div>`;
    formModal.classList.add('active');
    document.getElementById('cAddRow').addEventListener('click', () => document.getElementById('cRoster').insertAdjacentHTML('beforeend', rosterRowHtml({})));
    document.getElementById('cRoster').addEventListener('click', (e) => { const b = e.target.closest('[data-rdel]'); if(b) b.closest('.tpl-row').remove(); });
    document.getElementById('formSave').addEventListener('click', async () => {
      const err = document.getElementById('formError'); err.textContent = '';
      const g = document.getElementById('cGrade').value.trim();
      const id = document.getElementById('cId').value.trim();
      const teacher = document.getElementById('cTeacher').value.trim();
      if(!g || !id){ err.textContent = '학년과 학급 이름을 입력해 주세요.'; return; }
      if(classes.some(x => x.sections.some(s => s.id === id && s !== sec))){ err.textContent = '같은 이름의 학급이 이미 있어요.'; return; }
      const roster = [...document.querySelectorAll('#cRoster .roster-row')].map(row => {
        const n = row.querySelector('[data-r=name]').value.trim();
        return n ? { name:n } : null;
      }).filter(Boolean);
      const btn = document.getElementById('formSave'); btn.disabled = true; btn.textContent = '저장 중...';
      const origId = sec ? sec.id : null;
      // 명단에 처음 보는 이름이 있으면, 그 캐릭터의 프로필도 함께 만든다. (학급 칸에는 이 학급 이름을 넣어 둔다)
      try {
        const clsField = (templates.find(t => t.fields.some(f => f.label === '학급')) || { fields:[] }).fields.find(f => f.label === '학급');
        const made = new Set();
        for(const r of roster){
          if(masterCharacters[r.name] || made.has(r.name)) continue;
          made.add(r.name);
          const cid = 'char-' + Date.now().toString(36) + '-' + made.size;
          const cdata = { id:cid, name:r.name, file:cid, group:'', role:'', color:null, owner:'', template:'', clubHead:false, classFlags:[], image:null, imageV:null, fields: clsField ? { [clsField.key]: id } : {} };
          await ghPut(`${CHAR_DIR}/${cid}.json`, toBase64Text(JSON.stringify(cdata, null, 2) + '\n'), `Add character: ${r.name}`);
        }
      } catch(e){
        btn.disabled = false; btn.textContent = '저장';
        err.textContent = e.message === 'NO_TOKEN' ? '먼저 토큰 설정에서 토큰을 등록해 주세요.' : '캐릭터 프로필을 만들지 못했어요: ' + e.message;
        return;
      }
      const ok = await jsonChange('data/classes.json', () => JSON.parse(JSON.stringify(classesBase)), (data) => {
        let found = null, fg = null;
        data.forEach(gr => gr.sections.forEach(s => { if(origId && s.id === origId){ found = s; fg = gr; } }));
        let tg = data.find(gr => gr.grade === g);
        if(!tg){ tg = { grade:g, sections:[] }; data.push(tg); }
        const entry = { id, teacher, roster };
        if(found){
          if(fg !== tg){ fg.sections = fg.sections.filter(s => s !== found); tg.sections.push(found); }
          Object.assign(found, entry);
          for(let i = data.length - 1; i >= 0; i--) if(!data[i].sections.length && data[i] !== tg) data.splice(i, 1);
        } else tg.sections.push(entry);
      }, `${sec ? 'Update' : 'Add'} class: ${id}`);
      if(ok) reloadKeepingView(); else { btn.disabled = false; btn.textContent = '저장'; }
    });
  }
  async function deleteClass(sec){
    if(!getToken()){ alert('먼저 토큰 설정에서 토큰을 등록해 주세요.'); return; }
    if(!confirm(`"${sec.id}" 학급을 삭제할까요?\n캐릭터는 지워지지 않고, 학급 명단만 사라져요.`)) return;
    const ok = await jsonChange('data/classes.json', () => JSON.parse(JSON.stringify(classesBase)), (data) => {
      data.forEach(gr => { gr.sections = gr.sections.filter(s => s.id !== sec.id); });
      for(let i = data.length - 1; i >= 0; i--) if(!data[i].sections.length) data.splice(i, 1);
    }, `Delete class: ${sec.id}`);
    if(ok) reloadKeepingView();
  }
  document.getElementById('clEdit').addEventListener('click', () => { if(currentSection) openClassForm(currentSection); });
  document.getElementById('clDelete').addEventListener('click', () => { if(currentSection) deleteClass(currentSection); });

  /* ----- 사이트 설정: 제목, 링크, 푸터, 로고, 캐러셀, 빈 페이지 본문 ----- */

  /* ---------------- 본문 에디터 (전체 화면, 이미지 삽입) ---------------- */
  const editorModal = document.getElementById('editorModal');
  const edBody = document.getElementById('edBody');
  let edDone = null, edStart = '', edRange = null;
  document.getElementById('edTools').innerHTML = rtToolbarHtml() + '<button type="button" class="btn-sm" id="edImgBtn">이미지 삽입</button><button type="button" class="btn-sm danger" id="edImgDel" style="display:none">선택한 이미지 삭제</button>';
  const edTools = document.getElementById('edTools');
  edTools.querySelectorAll('.rt-toolbar button').forEach(b => b.addEventListener('mousedown', (ev) => { ev.preventDefault(); edBody.focus(); rtExec(b.dataset.rt); }));
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if(sel && sel.rangeCount && edBody.contains(sel.anchorNode)) edRange = sel.getRangeAt(0).cloneRange();
  });
  function openBodyEditor(sl, done){
    edDone = done;
    document.getElementById('edTitle').textContent = sl.title || '(제목 없음)';
    edBody.innerHTML = sl.body ? toRich(sl.body) : '';
    edStart = cleanHtml(edBody.innerHTML);
    edRange = null;
    document.getElementById('edImgDel').style.display = 'none';
    editorModal.classList.add('active');
    document.querySelector('.editor-scroll').scrollTop = 0;
  }
  function closeBodyEditor(){ editorModal.classList.remove('active'); edDone = null; }
  document.getElementById('edClose').addEventListener('click', () => {
    if(cleanHtml(edBody.innerHTML) !== edStart && !confirm('바꾼 내용이 적용되지 않아요. 그래도 닫을까요?')) return;
    closeBodyEditor();
  });
  document.getElementById('edApply').addEventListener('click', () => {
    const html = cleanHtml(edBody.innerHTML);
    const cb = edDone; closeBodyEditor();
    if(cb) cb(isEmptyVal(html) && !/<img /.test(html) ? '' : html);
  });
  edBody.addEventListener('click', (e) => {
    edBody.querySelectorAll('img.sel').forEach(i => i.classList.remove('sel'));
    const img = e.target.closest('img');
    if(img) img.classList.add('sel');
    document.getElementById('edImgDel').style.display = img ? '' : 'none';
  });
  document.getElementById('edImgDel').addEventListener('click', () => {
    edBody.querySelectorAll('img.sel').forEach(i => i.remove());
    document.getElementById('edImgDel').style.display = 'none';
  });
  document.getElementById('edImgBtn').addEventListener('mousedown', (ev) => ev.preventDefault());
  document.getElementById('edImgBtn').addEventListener('click', () => { document.getElementById('edFile').click(); });
  // 큰 사진은 가로 1600px 이하로 줄여서 올린다.
  function shrinkImage(file){
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file); const im = new Image();
      im.onload = () => {
        const max = 1600, sc = Math.min(1, max / im.naturalWidth);
        const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        const png = /png|gif|webp/i.test(file.type);
        c.toBlob(b => { URL.revokeObjectURL(url); b ? resolve({ blob:b, ext:png ? 'png' : 'jpg' }) : reject(new Error('이미지를 처리하지 못했어요.')); }, png ? 'image/png' : 'image/jpeg', 0.88);
      };
      im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 열지 못했어요.')); };
      im.src = url;
    });
  }
  document.getElementById('edFile').addEventListener('change', async (e) => {
    const f = e.target.files[0]; e.target.value = ''; if(!f) return;
    try {
      const { blob, ext } = await shrinkImage(f);
      const pid = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const url = URL.createObjectURL(blob);
      pendImgs[pid] = { blob, ext, url };
      const html = `<div><img src="${url}" data-pend="${pid}"></div><div><br></div>`;
      edBody.focus();
      if(edRange){ const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(edRange); }
      else { const r = document.createRange(); r.selectNodeContents(edBody); r.collapse(false); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); }
      document.execCommand('insertHTML', false, html);
    } catch(err){ showToast('이미지를 넣지 못했어요: ' + err.message, 4000); }
  });
  document.addEventListener('keydown', (ev) => { if(ev.key === 'Escape' && editorModal.classList.contains('active')){ ev.stopImmediatePropagation(); document.getElementById('edClose').click(); } }, true);

  function openSiteForm(){
    pendingImage = null; removeImage = false;
    Object.keys(pendImgs).forEach(k => delete pendImgs[k]);
    let pendingLogo = null, removeLogo = false;
    let slides = site.slides.map(x => Object.assign({}, x));
    const slideHtml = (sl, i) => `<div class="slide-row" data-i="${i}">
      <div class="slide-head"><span class="slide-grip" title="끌어서 순서 변경">&#8801;</span><span class="slide-name">${esc(sl.title || '(제목 없음)')}</span></div>
      <div class="slide-main"><div class="f-thumb wide">${sl.pendingUrl ? `<img src="${sl.pendingUrl}" alt="">` : (sl.image ? `<img src="${esc(rawUrl(sl.image, sl.imageV))}" alt="" onerror="window.__imgErr(this)">` : '')}</div>
      <div class="slide-fields">
        <input class="f-input" data-s="title" placeholder="슬라이드 제목" value="${esc(sl.title || '')}">
        <input class="f-input" data-s="date" placeholder="날짜 (선택)" value="${esc(sl.date || '')}">
        <div class="sns-row"><input class="f-input" data-s="linkText" placeholder="링크 표시 글자 (선택)" value="${esc(sl.linkText || '')}"><input class="f-input" data-s="link" placeholder="링크 주소 (선택)" value="${esc(sl.link || '')}"></div>
        <div class="body-line"><button type="button" class="body-fold${sl._open ? '' : ' folded'}" data-sfold>본문</button><button type="button" class="btn-sm" data-sed>에디터로 열기</button></div><div class="rt-wrap">${rtToolbarHtml()}<div class="rt-edit f-input" contenteditable="true" data-s="body" data-ph="본문 (선택)">${sl.body ? toRich(sl.body) : ''}</div></div>
        <input type="file" data-s="file" accept="image/*"><div class="slide-btns"><button type="button" class="btn-sm" data-simgdel>이미지 삭제</button><button type="button" class="btn-sm danger" data-sdel>슬라이드 삭제</button></div>
      </div></div></div>`;
    const syncSlides = () => {
      document.querySelectorAll('#sSlides .slide-row').forEach(row => {
        const sl = slides[Number(row.dataset.i)]; if(!sl) return;
        sl.title = row.querySelector('[data-s=title]').value.trim();
        sl.date = row.querySelector('[data-s=date]').value.trim();
        sl.link = row.querySelector('[data-s=link]').value.trim();
        sl.linkText = row.querySelector('[data-s=linkText]').value.trim();
        sl.body = cleanHtml(row.querySelector('[data-s=body]').innerHTML);
      });
    };
    const drawSlides = () => {
      const box = document.getElementById('sSlides');
      box.innerHTML = slides.map(slideHtml).join('');
      makeSortable(box, '.slide-row', (items) => { syncSlides(); slides = items.map(r => slides[Number(r.dataset.i)]).filter(Boolean); drawSlides(); }, { handle:'.slide-grip', always:true });
      box.querySelectorAll('.slide-row').forEach(row => {
        const i = Number(row.dataset.i);
        row.querySelectorAll('.rt-toolbar button').forEach(b => b.addEventListener('mousedown', ev => { ev.preventDefault(); rtExec(b.dataset.rt); }));
        row.querySelector('[data-s=file]').addEventListener('change', (e) => {
          const f = e.target.files[0]; if(!f) return;
          openCrop(f, (blob, ext) => { syncSlides(); slides[i].pending = { blob, ext }; slides[i].pendingUrl = URL.createObjectURL(blob); drawSlides(); });
        });
      });
    };
    document.getElementById('formBody').innerHTML = `
      <h2 class="form-title">메인 화면 관리</h2>
      <div class="f-group">기본</div>
      ${fInput('제목', 'sTitle', site.title)}
      ${fInput('부제', 'sSub', site.subtitle)}
      ${fInput('바닥글 문구', 'sFoot', site.footer)}
      <div class="f-group">SNS</div>
      <div id="sSns"></div>
      <button type="button" class="text-btn" id="sAddSns">+ SNS 추가</button>
      <div class="f-group">이미지</div>
      <div class="f-row"><span>로고 이미지</span>
        <div class="f-image"><div class="f-thumb square" id="sLogoThumb">${site.logo ? `<img src="${esc(rawUrl(site.logo, site.logoV))}" alt="" onerror="window.__imgErr(this)">` : ''}</div><div class="f-inline"><input type="file" id="sLogo" accept="image/*"><button type="button" class="btn-sm danger" id="sLogoDel">삭제</button></div></div>
      </div>
      <div class="f-row"><span>파비콘</span>
        <div class="f-image"><div class="f-thumb square" id="sFavThumb">${site.favicon ? `<img src="${esc(rawUrl(site.favicon, site.faviconV))}" alt="" onerror="window.__imgErr(this)">` : ''}</div><div class="f-inline"><input type="file" id="sFav" accept="image/*"><button type="button" class="btn-sm danger" id="sFavDel">삭제</button></div></div>
      </div>
      <div class="f-group">메인 슬라이드</div>
      <div id="sSlides"></div>
      <button type="button" class="text-btn" id="sAddSlide">+ 슬라이드 추가</button>
      <p class="form-error" id="formError"></p>
      <div class="form-actions"><span></span><button type="button" class="form-submit" id="formSave">저장</button></div>`;
    formModal.classList.add('active');
    drawSlides();
    let sns = snsOf(site).map(x => Object.assign({}, x));
    const syncSns = () => { document.querySelectorAll('#sSns .sns-row').forEach(row => { const x = sns[Number(row.dataset.i)]; if(!x) return; x.name = row.querySelector('[data-n=name]').value.trim(); x.url = row.querySelector('[data-n=url]').value.trim(); }); };
    const drawSns = () => {
      document.getElementById('sSns').innerHTML = sns.map((x, i) => `<div class="tpl-row sns-row" data-i="${i}"><input class="f-input sns-name" data-n="name" placeholder="이름" value="${esc(x.name || '')}"><input class="f-input" data-n="url" placeholder="링크 주소" value="${esc(x.url || '')}"><button type="button" class="x-btn" data-sndel title="삭제" aria-label="삭제">&times;</button></div>`).join('');
    };
    drawSns();
    document.getElementById('sAddSns').addEventListener('click', () => { syncSns(); sns.push({ name:'', url:'' }); drawSns(); });
    document.getElementById('sSns').addEventListener('click', (e) => { const b = e.target.closest('[data-sndel]'); if(!b) return; syncSns(); sns.splice(Number(b.closest('.sns-row').dataset.i), 1); drawSns(); });
    let pendingFav = null, removeFav = false;
    document.getElementById('sFavDel').addEventListener('click', () => { pendingFav = null; removeFav = true; document.getElementById('sFav').value = ''; document.getElementById('sFavThumb').innerHTML = ''; });
    document.getElementById('sFav').addEventListener('change', (e) => {
      const f = e.target.files[0]; if(!f) return;
      openCrop(f, (blob, ext) => { pendingFav = { blob, ext }; removeFav = false; document.getElementById('sFavThumb').innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="">`; }, { aspect:1, noOriginal:true });
    });
    document.getElementById('sAddSlide').addEventListener('click', () => { syncSlides(); slides.push({ _open:true, id:'s' + Date.now(), title:'', date:'', link:'', linkText:'', body:'', image:null }); drawSlides(); });
    document.getElementById('sSlides').addEventListener('click', (e) => {
      const edb = e.target.closest('[data-sed]');
      if(edb){ syncSlides(); const idx = Number(edb.closest('.slide-row').dataset.i); const sl = slides[idx]; if(sl) openBodyEditor(sl, (html) => { sl.body = html; sl._open = true; drawSlides(); }); return; }
      const fb = e.target.closest('[data-sfold]');
      if(fb){ const sl = slides[Number(fb.closest('.slide-row').dataset.i)]; const folded = fb.classList.toggle('folded'); if(sl) sl._open = !folded; return; }
      const ib = e.target.closest('[data-simgdel]');
      if(ib){ syncSlides(); const sl = slides[Number(ib.closest('.slide-row').dataset.i)]; if(sl){ sl.image = null; sl.imageV = null; sl.pending = null; sl.pendingUrl = null; } drawSlides(); return; }
      const b = e.target.closest('[data-sdel]'); if(!b) return;
      syncSlides(); slides.splice(Number(b.closest('.slide-row').dataset.i), 1); drawSlides();
    });
    document.getElementById('sLogoDel').addEventListener('click', () => {
      pendingLogo = null; removeLogo = true;
      document.getElementById('sLogo').value = ''; document.getElementById('sLogoThumb').innerHTML = '';
    });
    document.getElementById('sLogo').addEventListener('change', (e) => {
      const f = e.target.files[0]; if(!f) return;
      openCrop(f, (blob, ext) => { pendingLogo = { blob, ext }; removeLogo = false; document.getElementById('sLogoThumb').innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="">`; });
    });
    document.getElementById('formSave').addEventListener('click', async () => {
      const err = document.getElementById('formError'); err.textContent = '';
      if(!getToken()){ err.textContent = '먼저 토큰 설정에서 토큰을 등록해 주세요.'; return; }
      syncSlides(); syncSns();
      const btn = document.getElementById('formSave'); btn.disabled = true; btn.textContent = '저장 중...';
      try {
        const next = {
          title: document.getElementById('sTitle').value.trim() || SITE_DEFAULTS.title,
          subtitle: document.getElementById('sSub').value.trim(),
          sns: sns.filter(x => x.name || x.url).map(x => ({ name:x.name, url:x.url })),
          footer: document.getElementById('sFoot').value.trim(),
          favicon: removeFav ? null : (site.favicon || null), faviconV: removeFav ? null : (site.faviconV || null),
          logo: removeLogo ? null : (site.logo || null), logoV: removeLogo ? null : (site.logoV || null),
          colors: site.colors || {},
          hiddenColors: [...hiddenColors],
          slides: []
        };
        if(pendingLogo){
          const lp = `assets/ymkb_logo.${pendingLogo.ext}`;
          await ghPut(lp, await blobToBase64(pendingLogo.blob), 'Update logo');
          next.logo = lp; next.logoV = Date.now();
        }
        if(pendingFav){
          const fp = `assets/ymkb_favicon.${pendingFav.ext}`;
          await ghPut(fp, await blobToBase64(pendingFav.blob), 'Update favicon');
          next.favicon = fp; next.faviconV = Date.now();
        }
        for(let i = 0; i < slides.length; i++){
          const sl = slides[i];
          const out = { id:sl.id || ('s' + Date.now() + i), title:sl.title || '', date:sl.date || '', link:sl.link || '', linkText:sl.linkText || '', body:isEmptyVal(sl.body) ? '' : String(sl.body).trim(), image:sl.image || null, imageV:sl.imageV || null };
          if(sl.pending){
            const ip = `assets/ymkb_slide_${out.id}.${sl.pending.ext}`;
            await ghPut(ip, await blobToBase64(sl.pending.blob), `Update slide image: ${out.title}`);
            out.image = ip; out.imageV = Date.now();
          }
          if(out.body){
            const ids = [...new Set([...out.body.matchAll(/pending:(\w+)/g)].map(m => m[1]))];
            for(const id of ids){
              const pi = pendImgs[id];
              if(!pi){ out.body = out.body.split(`<img src="pending:${id}">`).join(''); continue; }
              const bp = `assets/ymkb_post_${id}.${pi.ext}`;
              await ghPut(bp, await blobToBase64(pi.blob), 'Add post image');
              out.body = out.body.split(`pending:${id}`).join(bp);
            }
          }
          next.slides.push(out);
        }
        next.pages = site.pages || {}; // 학생회/기숙사/ETC 페이지 내용은 지금 만지지 않고 그대로 보존한다.
        const ok = await jsonChange(SITE_PATH, () => ({}), (d) => { const keepOrder = d.order, keepCouncil = d.council; Object.keys(d).forEach(key => delete d[key]); Object.assign(d, next); if(keepOrder) d.order = keepOrder; if(keepCouncil) d.council = keepCouncil; }, 'Update site settings');
        if(ok) reloadKeepingView(); else { btn.disabled = false; btn.textContent = '저장'; }
      } catch(e){
        btn.disabled = false; btn.textContent = '저장';
        err.textContent = '저장에 실패했어요: ' + e.message;
      }
    });
  }
  document.getElementById('siteBtn').addEventListener('click', openSiteForm);


  /* ----- 설정 메뉴 (모든 관리 기능을 여기에 모아 둠) / 편집 모드 ----- */
  const menuModal = document.getElementById('menuModal');
  function editModeOn(){ try { return localStorage.getItem('ymkb_edit') === '1'; } catch(e){ return false; } }
  function applyEditMode(){
    document.body.classList.toggle('edit-mode', editModeOn());
    const st = document.getElementById('editModeState');
    if(st){ st.textContent = editModeOn() ? 'ON' : 'OFF'; st.classList.toggle('on', editModeOn()); }
  }
  function toggleEditMode(){
    try { localStorage.setItem('ymkb_edit', editModeOn() ? '0' : '1'); } catch(err){}
    applyEditMode();
  }
  document.getElementById('editPill').addEventListener('click', toggleEditMode);
  document.getElementById('editBannerOff').addEventListener('click', toggleEditMode);
  applyEditMode();
  // 토큰이 없으면 저장 설정만, 토큰이 있으면 편집 모드가 꺼져 있을 때 일부만, 켜져 있을 때 전부 보여 준다.
  function applyMenuLevel(){
    const lvl = getToken() ? (editModeOn() ? 2 : 1) : 0;
    menuModal.querySelectorAll('[data-need]').forEach(el => { el.style.display = lvl >= Number(el.dataset.need) ? '' : 'none'; });
  }
  document.getElementById('menuBtn').addEventListener('click', () => { applyEditMode(); applyMenuLevel(); menuModal.classList.add('active'); });
  document.getElementById('menuClose').addEventListener('click', () => menuModal.classList.remove('active'));
  menuModal.addEventListener('click', (e) => {
    if(e.target === menuModal){ menuModal.classList.remove('active'); return; }
    const b = e.target.closest('.menu-item');
    if(!b) return;
    if(b.id === 'editModeBtn'){
      toggleEditMode(); applyMenuLevel();
      return;
    }
    menuModal.classList.remove('active');
  });

  function showOcStatus(){
    const matched = Object.keys(ocOverrides).filter(n => masterCharacters[n]).sort((a, b) => a.localeCompare(b, 'ko'));
    const unmatched = Object.keys(ocOverrides).filter(n => !masterCharacters[n]).sort((a, b) => a.localeCompare(b, 'ko'));
    const pad2 = (n) => String(n).padStart(2, '0');
    const fmtDate = (d) => `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
    const fmtDateTime = (d) => `${fmtDate(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    const rows = matched.map(n => {
      const info = masterCharacters[n];
      const tpl = templateFor(info);
      const filled = tpl.fields.filter(f => !f.core && ocValue(info, f) !== undefined).length;
      return `<div class="spec-row oc-row" data-ocname="${esc(n)}"><span class="spec-label" style="min-width:110px">${esc(n)}</span><span class="spec-sep">|</span><span class="spec-value">연동된 항목 ${filled}개 / 전체 항목 ${tpl.fields.filter(f => !f.core).length}개</span><span class="oc-date">-</span></div>`;
    }).join('') || '<p class="form-hint">연결된 캐릭터가 없어요.</p>';
    document.getElementById('formBody').innerHTML = `
      <h2 class="form-title">only for xowon..</h2>
      <div class="spec-row"><span class="spec-label" style="min-width:110px">YMKB 캐릭터</span><span class="spec-sep">|</span><span class="spec-value">${ocStatus.error ? '불러오지 못했어요 (' + esc(ocStatus.error) + ')' : Object.keys(ocOverrides).length + '명'}</span></div>
      <div class="spec-row"><span class="spec-label" style="min-width:110px">마지막 업데이트</span><span class="spec-sep">|</span><span class="spec-value" id="ocLastUpdate">불러오는 중...</span></div>
      <hr class="soft-divider oc-hr">
      <div class="f-group oc-group">연결된 캐릭터</div>
      ${rows}
      ${ocSkipped.length ? `<div class="f-group">오너가 호원이 아니라 연동하지 않은 캐릭터</div><p class="form-hint">${ocSkipped.map(esc).join(', ')}</p>` : ''}
      ${unmatched.length ? `<div class="f-group">oc에는 있지만 ymkb에서 이름이 맞지 않는 캐릭터</div><p class="form-hint">${unmatched.map(esc).join(', ')}<br>ymkb의 이름을 oc와 똑같이 맞춰 주세요.</p>` : ''}`;
    formModal.classList.add('active');
    // 캐릭터 파일별 마지막 저장 시각은 oc 저장소의 커밋 기록에서 가져온다.
    const dates = [];
    const lastEl = document.getElementById('ocLastUpdate');
    Promise.all(Object.keys(ocOverrides).map(async (n) => {
      const path = ocOverrides[n] && ocOverrides[n]._path;
      if(!path) return;
      try {
        const res = await ghGet(`https://api.github.com/repos/${OC_OWNER}/${OC_REPO}/commits?path=${encodeURIComponent(path)}&sha=${OC_BRANCH}&per_page=1`);
        if(!res.ok) return;
        const arr = await res.json();
        const dt = arr && arr[0] && arr[0].commit && (arr[0].commit.committer || arr[0].commit.author);
        if(!dt || !dt.date) return;
        const d = new Date(dt.date); dates.push(d);
        const row = document.querySelector(`#formBody .oc-row[data-ocname="${CSS.escape(n)}"] .oc-date`);
        if(row) row.textContent = `last updated : ${fmtDate(d)}`;
      } catch(e){}
    })).then(() => {
      if(!lastEl) return;
      lastEl.textContent = dates.length ? fmtDateTime(new Date(Math.max(...dates.map(d => d.getTime())))) : '-';
    });
  }
  document.getElementById('ocStatusBtn').addEventListener('click', showOcStatus);

  document.getElementById('addCharBtn').addEventListener('click', () => openForm(null));
  document.getElementById('tplBtn').addEventListener('click', () => openTplMgr(null));
  document.getElementById('formClose').addEventListener('click', () => formModal.classList.remove('active'));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if(!b) return;
    if(b.dataset.act === 'edit') openForm(b.dataset.name);
    if(b.dataset.act === 'delete') deleteCharacter(b.dataset.name);
  });

  // 저장 직후 다시 불러왔다면, 보고 있던 화면으로 돌아간다.
  try {
    const raw = sessionStorage.getItem('ymkb_view');
    if(raw){
      sessionStorage.removeItem('ymkb_view');
      const v = JSON.parse(raw);
      if(v && Date.now() - v.t < 60000){
        if(v.page && v.page !== 'main') goPage(v.page);
        const g = v.group && groups.find(x => x.id === v.group);
        const sec = v.cls && allSections.find(x => x.id === v.cls);
        if(g) await openGroupDetail(g);
        else if(sec) await openClassDetail(sec);
        if(v.profile && masterCharacters[v.profile]) await openProfile(v.profile);
        setTimeout(() => window.scrollTo({ top:v.y || 0, behavior:'auto' }), 0);
      }
    }
  } catch(e){ console.warn(e); }
})();
