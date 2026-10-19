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
  function initCarousel(slidesData){
    const stage = document.getElementById('carouselStage');
    const ticksWrap = document.getElementById('carouselTicks');
    let current = 0;

    slidesData.forEach((s, i) => {
      const el = document.createElement('div');
      el.className = 'slide' + (i === 0 ? ' active' : '');
      el.style.background = s.image ? `url("${s.image}") center / cover no-repeat, ${s.gradient}` : s.gradient;
      el.innerHTML = `<div class="slide-overlay">${s.date ? `<div class="date">${esc(s.date)}</div>` : ''}<div class="title">${esc(s.title)}</div></div>`;
      stage.appendChild(el);
      const tick = document.createElement('div');
      tick.className = 'tick' + (i === 0 ? ' active' : '');
      tick.addEventListener('click', () => setSlide(i));
      ticksWrap.appendChild(tick);
    });

    function setSlide(i){
      const slides = stage.querySelectorAll('.slide');
      const ticks = ticksWrap.querySelectorAll('.tick');
      current = (i + slides.length) % slides.length;
      slides.forEach((s, idx) => s.classList.toggle('active', idx === current));
      ticks.forEach((t, idx) => t.classList.toggle('active', idx === current));
    }
    if(slidesData.length < 2){ document.getElementById('bannerPrev').style.visibility = 'hidden'; document.getElementById('bannerNext').style.visibility = 'hidden'; }
    document.getElementById('bannerPrev').addEventListener('click', () => setSlide(current - 1));
    document.getElementById('bannerNext').addEventListener('click', () => setSlide(current + 1));

    let autoTimer = setInterval(() => setSlide(current + 1), 5000);
    stage.addEventListener('mouseenter', () => clearInterval(autoTimer));
    stage.addEventListener('mouseleave', () => { autoTimer = setInterval(() => setSlide(current + 1), 5000); });

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
  const FIELD_TYPES = { text:'텍스트', tags:'태그', textarea:'긴 글', collapse:'접기 글', rating:'별점' };
  // oc의 YMKB 세계관 항목을 그대로 가져온 기본 틀. 오너 네 명이 처음에는 똑같은 템플릿을 가진다.
  const DEFAULT_FIELDS = [{"key": "name", "label": "이름", "type": "text", "core": true}, {"key": "f_1790459852228", "label": "영어 / 한자 이름", "type": "text"}, {"key": "f_1790459909805", "label": "나이", "type": "text"}, {"key": "f_1790485356104", "label": "생일", "type": "text"}, {"key": "f_1790485416027", "label": "신체", "type": "text"}, {"key": "f_1790460026132", "label": "학과", "type": "text"}, {"key": "f_1790460191966", "label": "학년", "type": "text"}, {"key": "f_1790477497994", "label": "학급", "type": "text"}, {"key": "f_1790484073611", "label": "소속", "type": "tags"}, {"key": "f_1790484157581", "label": "동아리", "type": "text"}, {"key": "f_1790484238483", "label": "학생회", "type": "text"}, {"key": "f_1790484328878", "label": "기숙사", "type": "text"}, {"key": "f_1790484388805", "label": "소개", "type": "textarea"}, {"key": "f_1790484546744", "label": "성격", "type": "textarea"}, {"key": "f_1790484621408", "label": "좋아하는 음식", "type": "text"}, {"key": "f_1790484726646", "label": "좋아하는 것", "type": "text"}, {"key": "f_1790484814456", "label": "좋아하는 사람", "type": "text"}, {"key": "f_1790484946547", "label": "싫어하는 음식", "type": "text"}, {"key": "f_1790484951928", "label": "싫어하는 것", "type": "text"}, {"key": "f_1790484957343", "label": "싫어하는 사람", "type": "text"}, {"key": "f_1790484965565", "label": "여담", "type": "textarea"}, {"key": "f_1790490251818", "label": "캐릭터 이야기 1", "type": "collapse"}, {"key": "f_1790490342827", "label": "보컬", "type": "rating"}, {"key": "f_1790492405183", "label": "정신력", "type": "rating"}, {"key": "f_1790492376210", "label": "무용", "type": "rating"}, {"key": "f_1790492415019", "label": "눈치", "type": "rating"}, {"key": "f_1790492385635", "label": "연기", "type": "rating"}, {"key": "f_1790492423525", "label": "성적", "type": "rating"}, {"key": "f_1790492394900", "label": "체력", "type": "rating"}];
  const OWNER_IDS = ['dowon', 'seit', 'haewon', 'howon'];
  const SITE_PATH = 'data/site.json';
  const DEFAULT_SLIDE = { id:'s0', date:'', title:'plz wait a little bit of..♡', image:null };
  const SLIDE_GRADIENT = 'linear-gradient(160deg,#7fa0d4,#3f5f96)';
  const PAGE_KEYS = [['club','CLUB'], ['counsel','학생회'], ['agency','기숙사'], ['etc','ETC']];
  const SITE_DEFAULTS = { title:'유메키보고등학교', subtitle:'YUMEKIBO HIGH SCHOOL', youtube:'https://youtube.com/@ymkbhighschool', soundcloud:'https://soundcloud.com/ymkbofficial', footer:'© ymkb high school', logo:null, logoV:null, slides:[DEFAULT_SLIDE], pages:{} };

  const GROUP_DIR = 'data/groups';
  function apiHeaders(){ const h = { Accept:'application/vnd.github+json' }; const t = getToken(); if(t) h.Authorization = 'Bearer ' + t; return h; }
  async function ghGet(url){
    const h = apiHeaders();
    let res = await fetch(url, { headers:h, cache:'no-store' });
    if((res.status === 401 || res.status === 403) && h.Authorization){
      res = await fetch(url, { headers:{ Accept:h.Accept }, cache:'no-store' });
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
  function canAutoReload(){
    if(document.querySelector('.modal-overlay.active')) return false;
    try {
      const t = +sessionStorage.getItem('ymkb_rl') || 0;
      if(Date.now() - t < 15000) return false;
      sessionStorage.setItem('ymkb_rl', String(Date.now()));
    } catch(e){ return false; }
    return true;
  }
  function swr(key, fetcher){
    const cached = cacheGet(key);
    const before = cached !== null ? stripSha(cached) : null;
    const live = fetcher().then((v) => {
      if(v === undefined || v === null) return cached;
      cacheSet(key, v);
      if(before !== null && stripSha(v) !== before && canAutoReload()) window.location.reload();
      return v;
    }).catch((err) => { console.warn(key + ' 를 불러오지 못했어요.', err); return cached; });
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
            const raw = await fetch(f.download_url);
            return await raw.json();
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
    if(hiddenAt && Date.now() - hiddenAt > 60000 && canAutoReload()) window.location.reload();
  });
  const ocCached = cacheGet('oc');
  const ocLive = fetchOcYmkbCharacters().then((map) => { ocOverrides = map; return map; });
  if(ocCached && ocCached.byName){
    ocOverrides = ocCached.byName; ocFields = ocCached.fields || [];
    ocStatus.cached = true; ocStatus.charCount = Object.keys(ocCached.byName).length;
  }
  const ocBefore = ocCached ? stripSha(ocCached.byName) : null;
  const ocReadyPromise = (ocCached && ocCached.byName ? Promise.resolve() : ocLive.then(() => {}));
  ocLive.then((map) => { if(ocBefore !== null && !ocStatus.error && stripSha(map) !== ocBefore && canAutoReload()) window.location.reload(); });

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
  let templates = await remoteP.templates;

  const RICH_OK = ['b','i','u','strong','em','br','div','p','span'];

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

  (function applySite(){
    document.title = site.title;
    document.querySelector('.title-bar h1').textContent = site.title;
    document.querySelector('.title-bar span').textContent = site.subtitle;
    const links = document.querySelectorAll('.link-row');
    if(links[0]) links[0].href = site.youtube;
    if(links[1]) links[1].href = site.soundcloud;
    document.querySelector('footer').textContent = site.footer;
    if(site.logo) document.querySelector('.logo').innerHTML = `<img src="${esc(rawUrl(site.logo, site.logoV))}" alt="" onerror="window.__imgErr(this)">`;
    PAGE_KEYS.forEach(([k, label]) => {
      const box = document.querySelector(`#page-${k} .placeholder`);
      const pg = site.pages[k];
      if(!box || !pg) return;
      if(pg.title) box.querySelector('h2').textContent = pg.title;
      if(!isEmptyVal(pg.body)) box.innerHTML = `<h2>${esc(pg.title || label)}</h2><div class="profile-text rich page-body">${toRich(pg.body)}</div>`;
    });
    initCarousel(site.slides.map(sl => ({ date:sl.date || '', title:sl.title || '', gradient:SLIDE_GRADIENT, image:sl.image ? rawUrl(sl.image, sl.imageV) : null })));
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
    if(/<\/?[a-z][^>]*>/i.test(str)) return cleanHtml(str);
    return esc(str).replace(/\n/g, '<br>');
  }
  function isEmptyVal(v){
    if(v === undefined || v === null) return true;
    if(Array.isArray(v)) return v.length === 0;
    if(typeof v === 'number') return false;
    return String(v).replace(/<[^>]*>/g, '').trim() === '';
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
      ['name','concept','genre','fandom','intro','image','imageV'].forEach(k => { if(gf[k] !== undefined) g[k] = gf[k]; });
      if(Array.isArray(gf.colors)) g.colors = gf.colors;
      g.file = gf;
    } else {
      groups.push({ id:gf.id, name:gf.name, colors:Array.isArray(gf.colors) ? gf.colors : [], concept:gf.concept || '', genre:gf.genre || '', fandom:gf.fandom || '', intro:gf.intro || '', image:gf.image || null, imageV:gf.imageV || null, members:[], manager:null, base:false, file:gf });
    }
  });

  // 캐릭터 파일의 내용을 그룹 데이터에 반영한다. 기존 캐릭터(groups.json)는 file(영어명) 또는 이름으로 찾아서
  // 이름·그룹·역할·컬러를 덮어쓰고, 처음 보는 캐릭터는 지정한 그룹에 추가한다. 역할이 '매니저'면 매니저 칸으로 간다.
  const renames = {};
  const deletedNames = new Set();
  groups.forEach(g => { g.members.forEach(m => { m.base = true; }); if(g.manager) g.manager.base = true; });
  Object.values(charFiles).forEach(c => {
    let gi = -1, mi = -1, wasMgr = false, old = null;
    groups.forEach((g, i) => {
      g.members.forEach((m, j) => { if((m.file && m.file === c.id) || m.name === c.name){ gi = i; mi = j; wasMgr = false; old = m; } });
      if(g.manager && ((g.manager.file && g.manager.file === c.id) || g.manager.name === c.name)){ gi = i; mi = -1; wasMgr = true; old = g.manager; }
    });
    if(c.deleted){
      if(old){ if(wasMgr) groups[gi].manager = null; else groups[gi].members.splice(mi, 1); deletedNames.add(old.name); }
      return;
    }
    const gname = groupRename[c.group] || c.group;
    const target = groups.find(x => x.name === gname) || (gi >= 0 ? groups[gi] : null);
    if(!target) return;
    const entry = { name:c.name, role:c.role || '', color:c.color || null, file:c.id, base:!!(old && old.base) };
    const isMgr = entry.role === '매니저' && (!target.manager || target.manager === old);
    let keepIndex = -1;
    if(old){
      if(old.name !== c.name) renames[old.name] = c.name;
      if(wasMgr) groups[gi].manager = null;
      else { groups[gi].members.splice(mi, 1); if(groups[gi] === target) keepIndex = mi; }
    }
    if(isMgr) target.manager = entry;
    else if(keepIndex >= 0) target.members.splice(keepIndex, 0, entry);
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
    const oc = ocOverrides[name];
    const ocPath = oc && (oc.image || oc.profileImage);
    if(ocPath) return ocAssetUrl(ocPath);
    const cf = charFiles[name];
    if(cf && cf.image){ const f = freshImg(cf.image); if(f) return f; }
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

  /* ---------------- GROUP LIST ---------------- */
  const gallery = document.getElementById('groupGallery');
  document.getElementById('groupCountLabel').textContent = '';

  groups.forEach((g) => {
    const card = document.createElement('div');
    card.className = 'photo-card ratio-1x1';
    const meta = [g.concept, g.genre].filter(Boolean).join(' · ');
    card.innerHTML = `
      <div class="p-thumb" style="background:${groupThumbGradient(g)}">${g.image ? `<img src="${esc(groupImgSrc(g))}" alt="" onerror="window.__imgErr(this)">` : ''}</div>
      <div class="p-overlay">
        <div class="p-cat">${esc(meta)}</div>
        <div class="p-name">${esc(g.name)}</div>
      </div>`;
    card.addEventListener('click', () => openGroupDetail(g));
    gallery.appendChild(card);
  });

  /* ---------------- CHARACTER CARD (shared style with group cards) ---------------- */
  function charCard(member){
    const hex = colorMap[member.color] || '#b7b7b7';
    const roleTxt = [member.role, member.color].filter(Boolean).join(' · ');
    const imgSrc = imgSrcFor(member.name, member.file);
    return `
      <div class="photo-card ratio-3x4" data-name="${member.name}">
        <div class="p-thumb" style="background:${colorGradient(hex)}">
          <img src="${imgSrc}" alt="${member.name}" onerror="window.__imgErr(this)">
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
    if(g.concept) tagRows.push(infoRow('컨셉', esc(g.concept)));
    if(g.genre) tagRows.push(infoRow('장르', esc(g.genre)));
    if(g.fandom) tagRows.push(infoRow('팬덤명', esc(g.fandom)));
    if(colorsValue) tagRows.push(infoRow('대표 컬러', colorsValue));
    const tagsEl = document.getElementById('gdTags');
    tagsEl.innerHTML = tagRows.join('');
    tagsEl.style.display = tagRows.length ? '' : 'none';
    const introEl = document.getElementById('gdIntro');
    introEl.textContent = g.intro || '';
    introEl.style.display = g.intro ? '' : 'none';
    document.getElementById('gdCharGallery').innerHTML = g.members.map(charCard).join('');
    document.getElementById('gdMembersSec').style.display = g.members.length ? '' : 'none';
    document.getElementById('gdManagerGallery').innerHTML = g.manager ? charCard(g.manager) : '';
    document.getElementById('gdManagerSec').style.display = g.manager ? '' : 'none';
    groupModal.classList.add('active');
  }
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
    if(g.manager){
      masterCharacters[g.manager.name] = { name:g.manager.name, color:g.manager.color, file:g.manager.file, group:g.name, role:g.manager.role, base:!!g.manager.base };
    }
  });

  // 학급/직책 정보를 마스터 캐릭터 정보에도 합쳐서, 프로필에서 함께 보여줄 수 있게 합니다.
  classes.forEach(g => g.sections.forEach(sec => sec.roster.forEach(r => {
    if(masterCharacters[r.name]){
      masterCharacters[r.name].classId = sec.id;
      masterCharacters[r.name].officer = r.officer || null;
    }
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
  });

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

  /* ---------------- ROSTER CARD (class gallery, shares style with charCard) ---------------- */
  function rosterCard(r){
    const info = masterCharacters[r.name] || {};
    const hex = colorMap[info.color] || '#b7b7b7';
    const sub = r.officer || '';
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
    gal.innerHTML = sec.roster.length
      ? sec.roster.map(rosterCard).join('')
      : `<p style="color:var(--muted);font-size:12px;">학급 정보가 아직 준비되지 않았습니다.</p>`;
    classModal.classList.add('active');
  }
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

  /* ---- 템플릿 항목의 값 결정: oc 값 > ymkb에서 직접 입력한 값 > 예전 프로필(profiles.json) ---- */
  function legacyValue(info, f){
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
    for(const fn of [ocValue, ownValue, legacyValue]){
      const v = fn(info, f);
      if(v !== undefined) return v;
    }
    return undefined;
  }
  function templateFor(info){
    if(ocOverrides[info.name] && ocFields.length){
      return { id:'__oc', name:'oc', fields: ocFields.map(f => ({ key:f.key, label:f.label, type:['text','tags','textarea','collapse','rating'].includes(f.type) ? f.type : 'text', core:!!f.core })) };
    }
    return templates.find(t => t.id === info.template) || templates.find(t => t.name === info.owner) || templates[0];
  }

  function renderTemplateBody(info){
    const tpl = templateFor(info);
    if(!tpl) return '';
    const fields = tpl.fields.filter(f => !f.core);
    const out = [];
    let rows = [], stars = [];
    const flush = () => {
      if(rows.length){
        out.push(`<div class="profile-rows${rows.length >= 6 ? ' cols2' : ''}">${rows.join('')}</div>`);
        rows = [];
      }
      if(stars.length){
        const half = Math.ceil(stars.length / 2);
        out.push(`<div class="profile-two-col profile-stars"><div>${stars.slice(0, half).join('')}</div><div>${stars.slice(half).join('')}</div></div>`);
        stars = [];
      }
    };
    fields.forEach(f => {
      const v = valueOf(info, f);
      if(f.type === 'text' || f.type === 'tags'){
        if(stars.length) flush();
        const txt = v === undefined ? '' : (Array.isArray(v) ? v.map(x => esc(typeof x === 'object' ? JSON.stringify(x) : x)).join(', ') : esc(typeof v === 'object' ? JSON.stringify(v) : v));
        rows.push(infoRow(esc(f.label), txt));
      } else if(f.type === 'rating'){
        if(rows.length) flush();
        stars.push(abilityRow(esc(f.label), v));
      } else if(f.type === 'textarea'){
        flush();
        out.push(`<div class="profile-section-head">${esc(f.label)}</div><div class="profile-text rich">${v === undefined ? '-' : toRich(v)}</div>`);
      } else if(f.type === 'collapse'){
        flush();
        if(v !== undefined) out.push(`<details class="profile-collapse"><summary>${esc(f.label)}</summary><div class="profile-text rich">${toRich(v)}</div></details>`);
      }
    });
    flush();
    return out.join('');
  }

  function renderProfile(info){
    const groupTxt = info.group ? `${info.group}${info.role ? ' (' + info.role + ')' : ''}` : '-';
    const classTxt = info.classId ? `${info.classId}${info.officer ? ' (' + info.officer + ')' : ''}` : '-';
    return `
      ${photoBlock(info)}
      <div class="profile-top-info">
        ${infoRow('NAME', esc(info.name))}
        ${infoRow('GROUP', esc(groupTxt))}
        ${infoRow('CLASS', esc(classTxt))}
      </div>

      ${renderTemplateBody(info)}

      <div class="profile-actions">
        ${info.owner ? `<span class="profile-owner">오너 ${esc(info.owner)}</span>` : '<span></span>'}
        <span class="edit-only">
          <button type="button" class="text-btn" data-act="edit" data-name="${esc(info.name)}">수정</button>
          <button type="button" class="text-btn danger" data-act="delete" data-name="${esc(info.name)}">삭제</button>
        </span>
      </div>
    `;
  }

  async function openProfile(name){
    const info = masterCharacters[name];
    if(!info) return;
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
  function ghDelete(path, message){
    return queued(async () => {
      const token = getToken();
      if(!token) throw new Error('NO_TOKEN');
      let lastErr;
      for(let attempt = 0; attempt < 8; attempt++){
        try {
          const sha = await getFileSha(path);
          if(!sha) return;
          const res = await fetch(apiBase + path, {
            method:'DELETE',
            headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json' },
            body: JSON.stringify({ message, sha, branch:GH_BRANCH })
          });
          if(!res.ok) throw httpError(res, await res.json().catch(() => ({})), '삭제 실패');
          if(path.endsWith('.json')) cacheTouch(path, null);
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
      <h2 class="form-title">저장 설정</h2>
      <p class="form-hint">토큰은 사이트에서 저장할 때 쓰는 열쇠예요. 이 기기에서 한 번만 등록하면 돼요. 이 브라우저에만 보관되고 깃허브에는 올라가지 않아요.</p>
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
      activeCropper.getCroppedCanvas({ maxWidth:opts.aspect ? 1000 : 1600, maxHeight:opts.aspect ? 1000 : 1600, imageSmoothingQuality:'high' }).toBlob(b => { onApply(b, 'png'); closeCrop(); }, 'image/png');
    });
    const origBtn = fresh('cropOriginal');
    origBtn.style.display = opts.noOriginal ? 'none' : '';
    origBtn.addEventListener('click', () => { onApply(file, extOf(file)); closeCrop(); });
    fresh('cropCancel').addEventListener('click', closeCrop);
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
    if(!token){ alert('먼저 저장 설정에서 토큰을 등록해 주세요.'); return false; }
    for(let attempt = 0; attempt < 8; attempt++){
      try {
        const { data, sha } = await fetchLiveTemplates();
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
    const typeOpts = Object.keys(FIELD_TYPES).map(k => `<option value="${k}">${FIELD_TYPES[k]}</option>`).join('');
    document.getElementById('tplBody').innerHTML = `
      <h2 class="form-title">템플릿 관리</h2>
      <p class="form-hint">템플릿을 추가·삭제하고 이름을 바꿀 수 있어요. 템플릿마다 항목을 추가·삭제하고, 항목 이름과 순서를 바꿀 수 있어요. 바꾸는 즉시 깃허브에 저장돼요.</p>
      <div class="tpl-tabs">
        ${templates.map(x => `<button type="button" class="tpl-tab${x.id === mgrSel ? ' active' : ''}" data-tact="sel" data-tid="${esc(x.id)}">${esc(x.name)}</button>`).join('')}
        <button type="button" class="text-btn" data-tact="addTpl">+ 템플릿 추가</button>
      </div>
      <div class="tpl-tools">
        <button type="button" class="text-btn" data-tact="renameTpl">이름 변경</button>
        <button type="button" class="text-btn" data-tact="tplLeft">앞으로</button>
        <button type="button" class="text-btn" data-tact="tplRight">뒤로</button>
        <button type="button" class="text-btn danger" data-tact="delTpl">템플릿 삭제</button>
      </div>
      <div class="tpl-fields">
        ${t.fields.map(f => `
          <div class="tpl-row">
            <input class="f-input tpl-label" data-key="${esc(f.key)}" value="${esc(f.label)}" ${f.core ? 'readonly' : ''}>
            <span class="tpl-type">${f.core ? '필수' : FIELD_TYPES[f.type] || f.type}</span>
            <span class="tpl-btns">
              ${f.core ? '' : `<button type="button" class="text-btn" data-tact="up" data-key="${esc(f.key)}">위로</button>
              <button type="button" class="text-btn" data-tact="down" data-key="${esc(f.key)}">아래로</button>
              <button type="button" class="text-btn danger" data-tact="delField" data-key="${esc(f.key)}">삭제</button>`}
            </span>
          </div>`).join('')}
      </div>
      <div class="tpl-add">
        <input class="f-input" id="tplNewLabel" placeholder="새 항목 이름">
        <select class="f-input" id="tplNewType">${typeOpts}</select>
        <button type="button" class="form-submit" data-tact="addField">항목 추가</button>
      </div>
      <p class="form-error" id="tplStatus"></p>`;
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
    if(act === 'up' || act === 'down'){
      const dir = act === 'up' ? -1 : 1;
      await tplDo(d => { const t = withTpl(d); if(!t) return; const i = t.fields.findIndex(f => f.key === key), j = i + dir; if(i < 0 || j < 1 || j >= t.fields.length) return; [t.fields[i], t.fields[j]] = [t.fields[j], t.fields[i]]; });
      return;
    }
  });
  document.getElementById('tplBody').addEventListener('change', async (e) => {
    const inp = e.target.closest('.tpl-label');
    if(!inp || inp.readOnly) return;
    const label = inp.value.trim(), key = inp.dataset.key;
    if(!label){ renderTplMgr(); return; }
    await tplDo(d => { const t = withTpl(d); const f = t && t.fields.find(x => x.key === key); if(f) f.label = label; });
  });

  /* ----- 생성 / 수정 폼 ----- */
  let formTpl = null;      // 폼에서 현재 고른 템플릿
  let formInfo = null;     // 수정 중인 캐릭터 (새 캐릭터면 null)
  let tplTouched = false;  // 템플릿을 직접 고른 적이 있는지

  function fInput(label, id, val, ph){
    return `<label class="f-row"><span>${label}</span><input class="f-input" id="${id}" value="${esc(val)}" ${ph ? `placeholder="${ph}"` : ''}></label>`;
  }

  function widgetHtml(f, val){
    const k = esc(f.key);
    if(f.type === 'text') return `<input class="f-input" data-fkey="${k}" data-ftype="text" value="${esc(val == null ? '' : val)}">`;
    if(f.type === 'tags') return `<div class="f-tags" data-fkey="${k}" data-ftype="tags"><span class="chips"></span><input class="f-tag-input" placeholder="입력하고 Enter"></div>`;
    if(f.type === 'rating') return `<div class="f-rating" data-fkey="${k}" data-ftype="rating" data-val="${Number(val) || 0}"></div>`;
    // textarea / collapse
    return `<div class="rt-wrap"><div class="rt-toolbar"><button type="button" data-rt="bold"><b>B</b></button><button type="button" data-rt="italic"><i>I</i></button><button type="button" data-rt="underline"><u>U</u></button><button type="button" data-rt="removeFormat">서식 지우기</button></div><div class="rt-edit f-input" contenteditable="true" data-fkey="${k}" data-ftype="rich">${val ? toRich(val) : ''}</div></div>`;
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
      b.addEventListener('mousedown', ev => { ev.preventDefault(); document.execCommand(b.dataset.rt, false, null); });
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
      } else if(f.type === 'rating') out[f.key] = Number(el.dataset.val) || 0;
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
      const v = ownValue(info, f);
      const w = v !== undefined ? v : legacyValue(info, f);
      if(w !== undefined) vals[f.key] = w;
    });
    return vals;
  }

  function renderDynamic(tpl, values){
    const box = document.getElementById('fDynamic');
    box.innerHTML = tpl.fields.filter(f => !f.core).map(f => `<div class="f-row"><span>${esc(f.label)}</span>${widgetHtml(f, values[f.key])}</div>`).join('');
    wireWidgets(box, tpl, values);
  }

  function tplOptionsHtml(selectedId){
    return templates.map(t => `<option value="${esc(t.id)}" ${t.id === selectedId ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  }

  function openForm(name){
    const info = name ? masterCharacters[name] : null;
    formInfo = info;
    const cf = (info && charFiles[info.name]) || {};
    pendingImage = null;
    tplTouched = !!cf.template;
    formTpl = info ? (templates.find(t => t.id === cf.template) || templates.find(t => t.name === info.owner) || templateFor(info)) : templates[0];

    const groupOpts = groups.map(g => `<option value="${esc(g.name)}" ${info && info.group === g.name ? 'selected' : ''}>${esc(g.name)}</option>`).join('');
    const colorOpts = ['<option value="">없음</option>'].concat(pickableColors(info && info.color ? [info.color] : []).map(c => `<option value="${esc(c)}" ${info && info.color === c ? 'selected' : ''}>${esc(c)}</option>`)).join('');
    const ownerOpts = ['<option value="">선택 안 함</option>'].concat(OWNERS.map(o => `<option value="${o}" ${(info && info.owner) === o ? 'selected' : ''}>${o}</option>`)).join('');
    const curImg = info ? imgSrcFor(info.name, info.file) : '';
    const linked = info && ocOverrides[info.name];

    document.getElementById('formBody').innerHTML = `
      <h2 class="form-title">${info ? '캐릭터 수정' : '캐릭터 추가'}</h2>

      <label class="f-row"><span>오너</span><select class="f-input" id="fOwner">${ownerOpts}</select></label>
      <div class="f-row"><span>템플릿</span>
        <div class="f-inline"><select class="f-input" id="fTpl">${tplOptionsHtml(formTpl && formTpl.id)}</select><button type="button" class="text-btn" id="fTplMgr">템플릿 관리</button></div>
      </div>
      ${linked ? '<p class="form-hint">oc 저장소에 같은 이름의 캐릭터가 있어서, 사진과 프로필 내용은 oc 값이 우선 보여요. 수정은 oc에서 해 주세요.</p>' : ''}

      <div class="f-group">이미지</div>
      <div class="f-image">
        <div class="f-thumb" id="fThumb">${curImg ? `<img src="${esc(curImg)}" alt="" onerror="window.__imgErr(this)">` : ''}</div>
        <div>
          <input type="file" id="fImage" accept="image/*">
          <p class="form-hint" id="fImageNote"></p>
        </div>
      </div>

      <div class="f-group">NAME</div>
      ${fInput('이름', 'fName', info ? info.name : '')}

      <div class="f-group">GROUP</div>
      <label class="f-row"><span>그룹</span><select class="f-input" id="fGroup">${groupOpts}</select></label>
      ${fInput('역할', 'fRole', info ? info.role : '', "예: 리더, 보컬 (매니저는 '매니저'로 입력)")}
      <label class="f-row"><span>그룹 내 담당 컬러 (선택)</span><select class="f-input" id="fColor">${colorOpts}</select></label>

      <div class="f-group">PROFILE</div>
      <div id="fDynamic"></div>

      <p class="form-error" id="formError"></p>
      <div class="form-actions">
        <span></span>
        <button type="button" class="form-submit" id="formSave">저장</button>
      </div>`;
    formModal.classList.add('active');
    renderDynamic(formTpl, initialValues(info, formTpl));

    document.getElementById('fOwner').addEventListener('change', (e) => {
      if(tplTouched) return;
      const t = templates.find(x => x.name === e.target.value);
      if(t) changeFormTemplate(t.id);
    });
    document.getElementById('fTpl').addEventListener('change', (e) => { tplTouched = true; changeFormTemplate(e.target.value); });
    document.getElementById('fTplMgr').addEventListener('click', () => {
      const snap = collectFields(formTpl);
      openTplMgr(() => {
        formTpl = templates.find(t => t.id === formTpl.id) || templates[0];
        document.getElementById('fTpl').innerHTML = tplOptionsHtml(formTpl.id);
        renderDynamic(formTpl, Object.assign(initialValues(formInfo, formTpl), snap));
      }, formTpl.id);
    });
    document.getElementById('fImage').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if(!f) return;
      openCrop(f, (blob, ext) => {
        pendingImage = { blob, ext };
        document.getElementById('fThumb').innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="">`;
        document.getElementById('fImageNote').textContent = '';
      });
    });
    document.getElementById('formSave').addEventListener('click', () => submitForm(info));
  }

  function changeFormTemplate(id){
    const snap = collectFields(formTpl);
    formTpl = templates.find(t => t.id === id) || templates[0];
    document.getElementById('fTpl').value = formTpl.id;
    renderDynamic(formTpl, Object.assign(initialValues(formInfo, formTpl), snap));
  }

  async function submitForm(info){
    const err = document.getElementById('formError');
    err.textContent = '';
    const name = document.getElementById('fName').value.trim();
    if(!name){ err.textContent = '이름을 입력해 주세요.'; return; }
    const same = masterCharacters[name];
    if(same && (!info || same.name !== info.name)){ err.textContent = '같은 이름의 캐릭터가 이미 있어요.'; return; }
    if(!getToken()){ err.textContent = '먼저 저장 설정에서 토큰을 등록해 주세요.'; return; }

    const fields = Object.assign({}, (charFiles[info && info.name] || {}).fields || {}, collectFields(formTpl));

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
      group: document.getElementById('fGroup').value,
      role: document.getElementById('fRole').value.trim(),
      color: document.getElementById('fColor').value || null,
      owner: document.getElementById('fOwner').value,
      template: formTpl.id,
      image: prev.image || null,
      imageV: prev.imageV || null,
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
      await ghPut(`${CHAR_DIR}/${id}.json`, toBase64Text(JSON.stringify(data, null, 2) + '\n'), `${info ? 'Update' : 'Add'} character: ${name}`);
      if(pendingImage && prev.image && prev.image !== data.image){ try { await ghDelete(prev.image, `Replace image: ${name}`); } catch(e){} }
      window.location.reload();
    } catch(e){
      btn.disabled = false; btn.textContent = '저장';
      err.textContent = e.message === 'NO_TOKEN' ? '먼저 저장 설정에서 토큰을 등록해 주세요.' : '저장에 실패했어요: ' + e.message;
    }
  }

  async function deleteCharacter(name){
    const info = masterCharacters[name];
    if(!info) return;
    const cf = charFiles[name];
    if(!getToken()){ alert('먼저 저장 설정에서 토큰을 등록해 주세요.'); return; }
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
      window.location.reload();
    } catch(e){
      alert('삭제에 실패했어요: ' + e.message);
    }
  }


  /* ----- 그룹 추가 / 수정 / 삭제 ----- */
  function openGroupForm(g){
    pendingImage = null;
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
      ${fInput('장르', 'gGenre', g ? g.genre : '')}
      ${fInput('팬덤명', 'gFandom', g ? g.fandom : '')}
      <div class="f-row"><span>대표 컬러</span><div class="color-picks" id="gColors">${chipHtml()}</div>
        <div class="f-inline color-add"><input class="f-input" id="gNewColorName" placeholder="새 색 이름"><input type="color" id="gNewColorHex" value="#8899aa"><button type="button" class="text-btn" id="gAddColor">색 추가</button></div></div>
      <div class="f-row"><span>소개</span><textarea class="f-input" rows="3" id="gIntro">${esc(g ? g.intro : '')}</textarea></div>
      <div class="f-group">이미지</div>
      <div class="f-image">
        <div class="f-thumb square" id="fThumb">${g && g.image ? `<img src="${esc(groupImgSrc(g))}" alt="" onerror="window.__imgErr(this)">` : ''}</div>
        <div>
          <input type="file" id="fImage" accept="image/*">
          <p class="form-hint" id="fImageNote"></p>
        </div>
      </div>
      <p class="form-error" id="formError"></p>
      <div class="form-actions"><span></span><button type="button" class="form-submit" id="formSave">저장</button></div>`;
    formModal.classList.add('active');
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
      const hx = document.getElementById('gNewColorHex').value;
      if(!nm) return;
      if(!colorMap[nm]){ colorMap[nm] = hx; newColors[nm] = hx; }
      removed.delete(nm);
      if(!sel.includes(nm)) sel.push(nm);
      document.getElementById('gColors').innerHTML = chipHtml();
      document.getElementById('gNewColorName').value = '';
    });
    document.getElementById('fImage').addEventListener('change', (e) => {
      const f = e.target.files[0]; if(!f) return;
      openCrop(f, (blob, ext) => {
        pendingImage = { blob, ext };
        document.getElementById('fThumb').innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="">`;
        document.getElementById('fImageNote').textContent = '';
      }, { aspect:1, noOriginal:true });
    });
    document.getElementById('formSave').addEventListener('click', () => submitGroupForm(g, () => sel, newColors, removed));
  }

  async function submitGroupForm(g, getSel, newColors, removed){
    const err = document.getElementById('formError');
    err.textContent = '';
    const name = document.getElementById('gName').value.trim();
    if(!name){ err.textContent = '이름을 입력해 주세요.'; return; }
    if(groups.some(x => x.name === name && (!g || x.id !== g.id))){ err.textContent = '같은 이름의 그룹이 이미 있어요.'; return; }
    if(!getToken()){ err.textContent = '먼저 저장 설정에서 토큰을 등록해 주세요.'; return; }
    const colors = getSel();
    const id = g ? g.id : (slugOf(name) && !groups.some(x => x.id === slugOf(name)) ? slugOf(name) : 'group-' + Date.now());
    const data = {
      id, name,
      concept: document.getElementById('gConcept').value.trim(),
      genre: document.getElementById('gGenre').value.trim(),
      fandom: document.getElementById('gFandom').value.trim(),
      colors,
      intro: document.getElementById('gIntro').value.trim(),
      image: g ? g.image || null : null,
      imageV: g ? g.imageV || null : null
    };
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
      await ghPut(`${GROUP_DIR}/${id}.json`, toBase64Text(JSON.stringify(data, null, 2) + '\n'), `${g ? 'Update' : 'Add'} group: ${name}`);
      if(oldImage && oldImage !== data.image){ try { await ghDelete(oldImage, `Replace group image: ${name}`); } catch(e){} }
      window.location.reload();
    } catch(e){
      btn.disabled = false; btn.textContent = '저장';
      err.textContent = e.message === 'NO_TOKEN' ? '먼저 저장 설정에서 토큰을 등록해 주세요.' : '저장에 실패했어요: ' + e.message;
    }
  }

  async function deleteGroup(g){
    if(!getToken()){ alert('먼저 저장 설정에서 토큰을 등록해 주세요.'); return; }
    const n = g.members.length + (g.manager ? 1 : 0);
    if(!confirm(`"${g.name}" 그룹을 삭제할까요?${n ? `\n소속된 캐릭터 ${n}명도 이 그룹과 함께 보이지 않게 돼요.` : ''}`)) return;
    try {
      if(g.base){
        await ghPut(`${GROUP_DIR}/${g.id}.json`, toBase64Text(JSON.stringify({ id:g.id, name:g.name, deleted:true }, null, 2) + '\n'), `Delete group: ${g.name}`);
      } else if(g.file){
        await ghDelete(g.file._path, `Delete group: ${g.name}`);
        if(g.file.image){ try { await ghDelete(g.file.image, `Delete group image: ${g.name}`); } catch(e){} }
      }
      window.location.reload();
    } catch(e){ alert('삭제에 실패했어요: ' + e.message); }
  }

  document.getElementById('addGroupBtn').addEventListener('click', () => openGroupForm(null));
  document.getElementById('gdEdit').addEventListener('click', () => { if(currentGroup) openGroupForm(currentGroup); });
  document.getElementById('gdDelete').addEventListener('click', () => { if(currentGroup) deleteGroup(currentGroup); });


  /* ----- JSON 파일 한 개를 안전하게 고치기 (최신 내용을 다시 받아 이번 변경만 적용, 충돌이면 재시도) ----- */
  async function jsonChange(path, fallbackFn, mutate, message){
    const token = getToken();
    if(!token){ alert('먼저 저장 설정에서 토큰을 등록해 주세요.'); return false; }
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
    return `<div class="tpl-row"><input class="f-input" list="charNames" data-r="name" placeholder="학생 이름" value="${esc(r.name || '')}"><input class="f-input roster-officer" data-r="officer" placeholder="직책 (선택)" value="${esc(r.officer || '')}"><button type="button" class="text-btn danger" data-rdel>삭제</button></div>`;
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
      <datalist id="charNames">${Object.keys(masterCharacters).map(n => `<option value="${esc(n)}">`).join('')}</datalist>
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
      const roster = [...document.querySelectorAll('#cRoster .tpl-row')].map(row => {
        const n = row.querySelector('[data-r=name]').value.trim(), o = row.querySelector('[data-r=officer]').value.trim();
        return n ? (o ? { name:n, officer:o } : { name:n }) : null;
      }).filter(Boolean);
      const btn = document.getElementById('formSave'); btn.disabled = true; btn.textContent = '저장 중...';
      const origId = sec ? sec.id : null;
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
      if(ok) window.location.reload(); else { btn.disabled = false; btn.textContent = '저장'; }
    });
  }
  async function deleteClass(sec){
    if(!getToken()){ alert('먼저 저장 설정에서 토큰을 등록해 주세요.'); return; }
    if(!confirm(`"${sec.id}" 학급을 삭제할까요?\n캐릭터는 지워지지 않고, 학급 명단만 사라져요.`)) return;
    const ok = await jsonChange('data/classes.json', () => JSON.parse(JSON.stringify(classesBase)), (data) => {
      data.forEach(gr => { gr.sections = gr.sections.filter(s => s.id !== sec.id); });
      for(let i = data.length - 1; i >= 0; i--) if(!data[i].sections.length) data.splice(i, 1);
    }, `Delete class: ${sec.id}`);
    if(ok) window.location.reload();
  }
  document.getElementById('addClassBtn').addEventListener('click', () => openClassForm(null));
  document.getElementById('clEdit').addEventListener('click', () => { if(currentSection) openClassForm(currentSection); });
  document.getElementById('clDelete').addEventListener('click', () => { if(currentSection) deleteClass(currentSection); });

  /* ----- 사이트 설정: 제목, 링크, 푸터, 로고, 캐러셀, 빈 페이지 본문 ----- */
  function openSiteForm(){
    pendingImage = null;
    let pendingLogo = null;
    let slides = site.slides.map(x => Object.assign({}, x));
    const slideHtml = (sl, i) => `<div class="slide-row" data-i="${i}">
      <div class="f-thumb wide">${sl.pendingUrl ? `<img src="${sl.pendingUrl}" alt="">` : (sl.image ? `<img src="${esc(rawUrl(sl.image, sl.imageV))}" alt="" onerror="window.__imgErr(this)">` : '')}</div>
      <div class="slide-fields">
        <input class="f-input" data-s="title" placeholder="슬라이드 제목" value="${esc(sl.title || '')}">
        <input class="f-input" data-s="date" placeholder="날짜 (선택)" value="${esc(sl.date || '')}">
        <div class="f-inline"><input type="file" data-s="file" accept="image/*"><button type="button" class="text-btn danger" data-sdel>슬라이드 삭제</button></div>
      </div></div>`;
    const syncSlides = () => {
      document.querySelectorAll('#sSlides .slide-row').forEach(row => {
        const sl = slides[Number(row.dataset.i)]; if(!sl) return;
        sl.title = row.querySelector('[data-s=title]').value.trim();
        sl.date = row.querySelector('[data-s=date]').value.trim();
      });
    };
    const drawSlides = () => {
      const box = document.getElementById('sSlides');
      box.innerHTML = slides.map(slideHtml).join('');
      box.querySelectorAll('.slide-row').forEach(row => {
        const i = Number(row.dataset.i);
        row.querySelector('[data-s=file]').addEventListener('change', (e) => {
          const f = e.target.files[0]; if(!f) return;
          openCrop(f, (blob, ext) => { syncSlides(); slides[i].pending = { blob, ext }; slides[i].pendingUrl = URL.createObjectURL(blob); drawSlides(); });
        });
      });
    };
    document.getElementById('formBody').innerHTML = `
      <h2 class="form-title">사이트 설정</h2>
      <div class="f-group">기본</div>
      ${fInput('제목', 'sTitle', site.title)}
      ${fInput('부제', 'sSub', site.subtitle)}
      ${fInput('YouTube 링크', 'sYt', site.youtube)}
      ${fInput('Soundcloud 링크', 'sSc', site.soundcloud)}
      ${fInput('맨 아래 문구', 'sFoot', site.footer)}
      <div class="f-row"><span>로고 이미지</span>
        <div class="f-image"><div class="f-thumb square" id="sLogoThumb">${site.logo ? `<img src="${esc(rawUrl(site.logo, site.logoV))}" alt="" onerror="window.__imgErr(this)">` : ''}</div><input type="file" id="sLogo" accept="image/*"></div>
      </div>
      <div class="f-group">메인 슬라이드</div>
      <div id="sSlides"></div>
      <button type="button" class="text-btn" id="sAddSlide">+ 슬라이드 추가</button>
      <div class="f-group">빈 페이지 내용</div>
      ${PAGE_KEYS.map(([k, label]) => {
        const pg = site.pages[k] || {};
        return `<div class="f-row"><span>${label} 페이지 제목</span><input class="f-input" id="pt_${k}" value="${esc(pg.title || '')}" placeholder="${label}"></div>
        <div class="f-row"><span>${label} 페이지 본문</span>${widgetHtml({ key:'page_' + k, type:'textarea' }, pg.body || '')}</div>`;
      }).join('')}
      <p class="form-error" id="formError"></p>
      <div class="form-actions"><span></span><button type="button" class="form-submit" id="formSave">저장</button></div>`;
    formModal.classList.add('active');
    wireWidgets(document.getElementById('formBody'), { fields:[] }, {});
    drawSlides();
    document.getElementById('sAddSlide').addEventListener('click', () => { syncSlides(); slides.push({ id:'s' + Date.now(), title:'', date:'', image:null }); drawSlides(); });
    document.getElementById('sSlides').addEventListener('click', (e) => {
      const b = e.target.closest('[data-sdel]'); if(!b) return;
      syncSlides(); slides.splice(Number(b.closest('.slide-row').dataset.i), 1); drawSlides();
    });
    document.getElementById('sLogo').addEventListener('change', (e) => {
      const f = e.target.files[0]; if(!f) return;
      openCrop(f, (blob, ext) => { pendingLogo = { blob, ext }; document.getElementById('sLogoThumb').innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="">`; });
    });
    document.getElementById('formSave').addEventListener('click', async () => {
      const err = document.getElementById('formError'); err.textContent = '';
      if(!getToken()){ err.textContent = '먼저 저장 설정에서 토큰을 등록해 주세요.'; return; }
      syncSlides();
      const btn = document.getElementById('formSave'); btn.disabled = true; btn.textContent = '저장 중...';
      try {
        const next = {
          title: document.getElementById('sTitle').value.trim() || SITE_DEFAULTS.title,
          subtitle: document.getElementById('sSub').value.trim(),
          youtube: document.getElementById('sYt').value.trim(),
          soundcloud: document.getElementById('sSc').value.trim(),
          footer: document.getElementById('sFoot').value.trim(),
          logo: site.logo || null, logoV: site.logoV || null,
          colors: site.colors || {},
          hiddenColors: [...hiddenColors],
          slides: [], pages: {}
        };
        if(pendingLogo){
          const lp = `assets/ymkb_logo.${pendingLogo.ext}`;
          await ghPut(lp, await blobToBase64(pendingLogo.blob), 'Update logo');
          next.logo = lp; next.logoV = Date.now();
        }
        for(let i = 0; i < slides.length; i++){
          const sl = slides[i];
          const out = { id:sl.id || ('s' + Date.now() + i), title:sl.title || '', date:sl.date || '', image:sl.image || null, imageV:sl.imageV || null };
          if(sl.pending){
            const ip = `assets/ymkb_slide_${out.id}.${sl.pending.ext}`;
            await ghPut(ip, await blobToBase64(sl.pending.blob), `Update slide image: ${out.title}`);
            out.image = ip; out.imageV = Date.now();
          }
          next.slides.push(out);
        }
        PAGE_KEYS.forEach(([k]) => {
          const t = document.getElementById('pt_' + k).value.trim();
          const body = cleanHtml(document.querySelector(`[data-fkey="page_${k}"]`).innerHTML);
          if(t || !isEmptyVal(body)) next.pages[k] = { title:t, body:isEmptyVal(body) ? '' : body };
        });
        const ok = await jsonChange(SITE_PATH, () => ({}), (d) => { Object.keys(d).forEach(key => delete d[key]); Object.assign(d, next); }, 'Update site settings');
        if(ok) window.location.reload(); else { btn.disabled = false; btn.textContent = '저장'; }
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
    if(st) st.textContent = editModeOn() ? '켜짐' : '꺼짐';
  }
  applyEditMode();
  document.getElementById('menuBtn').addEventListener('click', () => { applyEditMode(); menuModal.classList.add('active'); });
  document.getElementById('menuClose').addEventListener('click', () => menuModal.classList.remove('active'));
  menuModal.addEventListener('click', (e) => {
    if(e.target === menuModal){ menuModal.classList.remove('active'); return; }
    const b = e.target.closest('.menu-item');
    if(!b) return;
    if(b.id === 'editModeBtn'){
      try { localStorage.setItem('ymkb_edit', editModeOn() ? '0' : '1'); } catch(err){}
      applyEditMode();
      return;
    }
    menuModal.classList.remove('active');
  });

  function showOcStatus(){
    const matched = Object.keys(ocOverrides).filter(n => masterCharacters[n]);
    const unmatched = Object.keys(ocOverrides).filter(n => !masterCharacters[n]);
    const rows = matched.map(n => {
      const info = masterCharacters[n];
      const tpl = templateFor(info);
      const filled = tpl.fields.filter(f => !f.core && ocValue(info, f) !== undefined).length;
      return `<div class="spec-row"><span class="spec-label" style="min-width:110px">${esc(n)}</span><span class="spec-sep">|</span><span class="spec-value">oc 값이 있는 항목 ${filled}개 / 전체 ${tpl.fields.filter(f => !f.core).length}개</span></div>`;
    }).join('') || '<p class="form-hint">연결된 캐릭터가 없어요.</p>';
    document.getElementById('formBody').innerHTML = `
      <h2 class="form-title">oc 연동 상태</h2>
      <div class="spec-row"><span class="spec-label" style="min-width:110px">oc 캐릭터 목록</span><span class="spec-sep">|</span><span class="spec-value">${ocStatus.error ? '불러오지 못했어요 (' + esc(ocStatus.error) + ')' : ocStatus.listCount + '개 파일'}</span></div>
      <div class="spec-row"><span class="spec-label" style="min-width:110px">YMKB 세계관</span><span class="spec-sep">|</span><span class="spec-value">${ocStatus.worldFound ? '찾았어요 (항목 ' + ocFields.length + '개)' : '찾지 못했어요'}</span></div>
      <div class="spec-row"><span class="spec-label" style="min-width:110px">YMKB 캐릭터</span><span class="spec-sep">|</span><span class="spec-value">${Object.keys(ocOverrides).length}명</span></div>
      <div class="f-group">ymkb와 이름이 같아 연결된 캐릭터</div>
      ${rows}
      ${unmatched.length ? `<div class="f-group">oc에는 있지만 ymkb에서 이름이 맞지 않는 캐릭터</div><p class="form-hint">${unmatched.map(esc).join(', ')}<br>ymkb의 이름을 oc와 똑같이 맞춰 주세요.</p>` : ''}`;
    formModal.classList.add('active');
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
})();
