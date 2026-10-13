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
  const slidesData = [
    { date:'', title:'plz wait a little bit of..♡', gradient:'linear-gradient(160deg,#7fa0d4,#3f5f96)' }
  ];
  const stage = document.getElementById('carouselStage');
  const ticksWrap = document.getElementById('carouselTicks');
  let current = 0;

  slidesData.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'slide' + (i === 0 ? ' active' : '');
    el.style.background = s.gradient;
    el.innerHTML = `<div class="slide-overlay">${s.date ? `<div class="date">${s.date}</div>` : ''}<div class="title">${s.title}</div></div>`;
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
  document.getElementById('bannerPrev').addEventListener('click', () => setSlide(current - 1));
  document.getElementById('bannerNext').addEventListener('click', () => setSlide(current + 1));

  let autoTimer = setInterval(() => setSlide(current + 1), 5000);
  stage.addEventListener('mouseenter', () => clearInterval(autoTimer));
  stage.addEventListener('mouseleave', () => { autoTimer = setInterval(() => setSlide(current + 1), 5000); });

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

  /* ---------------- OC 연동 (호원 담당 캐릭터의 사진·기본 정보를 oc 저장소에서 가져오기) ----------------
     oc 쪽 "YMKB" 카테고리에 등록된 캐릭터와 이름이 똑같으면, 그 캐릭터의 사진과 나이 정보를
     oc 쪽 것으로 덮어써서 보여준다. oc 파일은 전혀 건드리지 않고 읽기만 한다. */
  const OC_OWNER = 'xowonim';
  const OC_REPO = 'oc';
  const OC_BRANCH = 'main';
  let ocOverrides = {};

  function ocAssetUrl(path) {
    if (!path) return path;
    return `https://raw.githubusercontent.com/${OC_OWNER}/${OC_REPO}/${OC_BRANCH}/${path}`;
  }

  async function fetchOcYmkbCharacters() {
    try {
      const listUrl = `https://api.github.com/repos/${OC_OWNER}/${OC_REPO}/contents/data/characters?ref=${OC_BRANCH}`;
      const listRes = await fetch(listUrl, { headers: { Accept: 'application/vnd.github+json' } });
      if (!listRes.ok) throw new Error('oc 캐릭터 목록을 불러오지 못했습니다 (' + listRes.status + ')');
      const entries = await listRes.json();
      if (!Array.isArray(entries)) throw new Error('oc 캐릭터 목록 형식 오류');
      const jsonFiles = entries.filter((e) => e.type === 'file' && e.name.endsWith('.json') && !e.name.startsWith('_'));
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
      const byName = {};
      all.filter(Boolean)
        .filter((c) => c.world === 'ymkb')
        .forEach((c) => { byName[c.name] = c; });
      return byName;
    } catch (err) {
      console.warn('oc 연동에 실패해서, ymkb 자체 데이터만 사용합니다.', err);
      return {};
    }
  }

  // 그룹/학급 상세나 프로필을 열 때, oc 데이터를 다 가져올 때까지만 살짝 기다린다.
  // (보통 클릭하기 전에 이미 끝나있어서 체감되는 지연은 없다.)
  const ocReadyPromise = fetchOcYmkbCharacters().then((map) => { ocOverrides = map; });

  /* ---------------- 데이터 불러오기 (groups / classes / profiles) ----------------
     예전에는 이 셋이 코드 안에 통째로 박혀있었는데, 이제 data 폴더의 JSON 파일로 분리했다.
     깃허브 페이지가 같은 저장소에서 서빙하는 파일이라 그냥 상대경로로 fetch하면 된다. */
  const [groups, classes, characterProfiles] = await Promise.all([
    fetch('data/groups.json').then((r) => r.json()),
    fetch('data/classes.json').then((r) => r.json()),
    fetch('data/profiles.json').then((r) => r.json())
  ]);

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

  /* ---------------- ymkb 자체 캐릭터 파일 (data/characters/*.json, 파일 하나 = 캐릭터 한 명) ---------------- */
  async function fetchOwnCharacters(){
    try {
      const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${CHAR_DIR}?ref=${GH_BRANCH}`, { headers:{ Accept:'application/vnd.github+json' }, cache:'no-store' });
      if(!res.ok) return {};
      const entries = await res.json();
      if(!Array.isArray(entries)) return {};
      const files = entries.filter(e => e.type === 'file' && e.name.endsWith('.json') && !e.name.startsWith('_'));
      const list = await Promise.all(files.map(async f => {
        try {
          const r = await fetch(`${f.download_url}?v=${f.sha}`);
          const d = await r.json();
          d._path = f.path; d._sha = f.sha;
          return d;
        } catch(e){ console.warn('캐릭터 파일을 불러오지 못했어요:', f.name, e); return null; }
      }));
      const map = {};
      list.filter(c => c && c.name).forEach(c => { map[c.name] = c; });
      return map;
    } catch(err){
      console.warn('자체 캐릭터 파일을 불러오지 못했어요.', err);
      return {};
    }
  }
  const charFiles = await fetchOwnCharacters();

  // 기존 그룹에 없는 캐릭터는 파일의 group 값을 보고 해당 그룹에 추가한다. 이미 있으면 역할/컬러만 덮어쓴다.
  Object.values(charFiles).forEach(c => {
    let found = null;
    groups.forEach(g => {
      g.members.forEach(m => { if(m.name === c.name) found = m; });
      if(g.manager && g.manager.name === c.name) found = g.manager;
    });
    if(found){
      if(c.role) found.role = c.role;
      if(c.color) found.color = c.color;
      return;
    }
    const g = groups.find(x => x.name === c.group);
    if(!g) return;
    const entry = { name:c.name, role:c.role || '', color:c.color || '', file:c.file || '' };
    if(c.isManager) g.manager = entry; else g.members.push(entry);
  });

  function imgSrcFor(name, file){
    const oc = ocOverrides[name];
    const ocPath = oc && (oc.image || oc.profileImage);
    if(ocPath) return ocAssetUrl(ocPath);
    const cf = charFiles[name];
    if(cf && cf.image) return `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${cf.image}?v=${cf.imageV || ''}`;
    return file ? `ymkb_icon_${file}.png` : '';
  }

  function groupThumbGradient(g){
    const hexes = g.colors.map(c => colorMap[c] || '#cccccc');
    return hexes.length > 1 ? `linear-gradient(135deg, ${hexes.join(', ')})` : hexes[0];
  }

  /* ---------------- GROUP LIST ---------------- */
  const gallery = document.getElementById('groupGallery');
  document.getElementById('groupCountLabel').textContent = `전체 ${groups.length}팀 · 카드를 누르면 상세 정보를 볼 수 있어요`;

  groups.forEach((g) => {
    const card = document.createElement('div');
    card.className = 'photo-card ratio-1x1';
    const meta = [g.concept, g.genre].filter(Boolean).join(' · ');
    card.innerHTML = `
      <div class="p-thumb" style="background:${groupThumbGradient(g)}"></div>
      <div class="p-overlay">
        <div class="p-cat">${meta}</div>
        <div class="p-name">${g.name}</div>
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
          <img src="${imgSrc}" alt="${member.name}" onerror="this.style.display='none'">
        </div>
        <div class="p-overlay">
          <div class="p-cat">${roleTxt}</div>
          <div class="p-name">${member.name}</div>
        </div>
      </div>`;
  }

  /* ---------------- GROUP DETAIL MODAL ---------------- */
  const groupModal = document.getElementById('groupModal');

  async function openGroupDetail(g){
    await ocReadyPromise;
    document.getElementById('gdTitle').textContent = g.name;
    const colorsValue = g.colors.map(c => {
      const hex = colorMap[c] || '#cccccc';
      const textColor = hex.toLowerCase() === '#ffffff' ? '#a8a69f' : hex;
      return `<span class="gd-color-chip" style="color:${textColor}"><span class="gd-color-dot" style="background:${hex}"></span>${c}</span>`;
    }).join('');
    document.getElementById('gdTags').innerHTML = `
      ${infoRow('컨셉', g.concept)}
      ${infoRow('장르', g.genre)}
      ${infoRow('팬덤명', g.fandom)}
      ${infoRow('대표 컬러', colorsValue)}
    `;
    const introParts = [];
    introParts.push(`${g.name}는` + (g.concept ? ` ${g.concept}을(를) 컨셉으로 하는` : '') + (g.genre ? ` ${g.genre} 기반` : '') + ` 그룹입니다.`);
    introParts.push(`대표 컬러는 ${g.colors.join(', ')}입니다.`);
    if(g.fandom) introParts.push(`팬덤명은 '${g.fandom}'입니다.`);
    document.getElementById('gdIntro').textContent = introParts.join(' ');
    document.getElementById('gdCharGallery').innerHTML = g.members.map(charCard).join('');
    document.getElementById('gdManagerGallery').innerHTML = g.manager
      ? charCard(g.manager)
      : `<p style="color:var(--muted);font-size:12px;">등록된 매니저가 없습니다.</p>`;
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
      masterCharacters[m.name] = { name:m.name, color:m.color, file:m.file, group:g.name, role:m.role };
    });
    if(g.manager){
      masterCharacters[g.manager.name] = { name:g.manager.name, color:g.manager.color, file:g.manager.file, group:g.name, role:g.manager.role };
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
    masterCharacters[name].owner = cf.owner || '';
    masterCharacters[name].hasFile = !!charFiles[name];
    masterCharacters[name].profile = escDeep(raw);
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
          ${imgSrc ? `<img src="${imgSrc}" alt="${r.name}" onerror="this.style.display='none'">` : ''}
        </div>
        <div class="p-overlay">
          <div class="p-cat">${sub}</div>
          <div class="p-name">${r.name}</div>
        </div>
      </div>`;
  }

  /* ---------------- CLASS DETAIL MODAL ---------------- */
  const classModal = document.getElementById('classModal');

  async function openClassDetail(sec){
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
            ${imgSrc ? `<img src="${imgSrc}" alt="${info.name}" onerror="this.style.display='none'">` : ''}
          </div>
        </div>
      </div>`;
  }

  function renderProfile(info){
    const p = info.profile;
    const oc = ocOverrides[info.name];
    const ocAge = oc && oc.fields && oc.fields.age;
    const groupTxt = info.group ? `${info.group}${info.role ? ' (' + info.role + ')' : ''}` : '-';
    const classTxt = info.classId ? `${info.classId}${info.officer ? ' (' + info.officer + ')' : ''}` : '-';
    return `
      ${photoBlock(info)}
      <div class="profile-top-info">
        ${infoRow('NAME', `${info.name} ${[p.nameEn, p.nameKanji].filter(Boolean).join(' / ')}`)}
        ${infoRow('GROUP', groupTxt)}
        ${infoRow('CLASS', classTxt)}
        ${infoRow('BIRTH', p.birth)}
        ${infoRow('AGE', ocAge || p.age)}
        ${infoRow('HEIGHT', p.height)}
      </div>

      <div class="profile-section-head first">PERSONALITY</div>
      <p class="profile-text">${p.personality || '-'}</p>

      <div class="profile-section-head">INFO</div>
      <p class="profile-text">${p.info || '-'}</p>

      <div class="profile-section-head">SCHOOL</div>
      <div class="profile-two-col">
        <div>
          ${infoRow('학급', p.school.학급)}
          ${infoRow('학과', p.school.학과)}
          ${infoRow('동아리', p.school.동아리)}
        </div>
        <div>
          ${infoRow('학생회', p.school.학생회)}
          ${infoRow('기숙사', p.school.기숙사)}
        </div>
      </div>

      <div class="profile-two-col" style="margin-top:24px; padding-top:16px; border-top:1px solid var(--line);">
        <div>
          <div class="profile-section-head small">LIKE</div>
          ${infoRow('좋아하는 음식', p.like.음식)}
          ${infoRow('좋아하는 사람', p.like.사람)}
          <div class="profile-gap">${infoRow('취미', p.hobby)}</div>
        </div>
        <div>
          <div class="profile-section-head small">HATE</div>
          ${infoRow('싫어하는 음식', p.hate.음식)}
          ${infoRow('싫어하는 사람', p.hate.사람)}
          <div class="profile-gap">${infoRow('특기', p.specialty)}</div>
        </div>
      </div>

      <div class="profile-two-col" style="margin-top:24px; padding-top:16px; border-top:1px solid var(--line);">
        <div>
          <div class="profile-section-head small">ETC.</div>
          ${infoRow('반려동물', p.etc.반려동물)}
          ${infoRow('최근 관심사', p.etc.최근관심사)}
          ${infoRow('가족 구성', p.etc.가족구성)}
        </div>
        <div>
          <div class="profile-section-head small">ABILITY</div>
          <div class="profile-two-col" style="gap:2px 16px;">
            <div>
              ${abilityRow('음악', p.ability.음악)}
              ${abilityRow('보컬', p.ability.보컬)}
              ${abilityRow('무용', p.ability.무용)}
              ${abilityRow('연기', p.ability.연기)}
            </div>
            <div>
              ${abilityRow('체력', p.ability.체력)}
              ${abilityRow('정신력', p.ability.정신력)}
              ${abilityRow('열정', p.ability.열정)}
              ${abilityRow('눈치', p.ability.눈치)}
            </div>
          </div>
        </div>
      </div>

      <div class="profile-section-head">SPECIAL NOTE</div>
      <p class="profile-text">${p.specialNote || '-'}</p>

      <div class="profile-actions">
        ${info.owner ? `<span class="profile-owner">담당 ${esc(info.owner)}</span>` : '<span></span>'}
        <span>
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

  async function getFileSha(path){
    try {
      const res = await fetch(`${apiBase}${path}?ref=${GH_BRANCH}`, { headers:{ Accept:'application/vnd.github+json' }, cache:'no-store' });
      if(res.ok) return (await res.json()).sha;
    } catch(e){}
    return undefined;
  }
  async function ghPut(path, base64, message){
    const token = getToken();
    if(!token) throw new Error('NO_TOKEN');
    const sha = await getFileSha(path);
    const res = await fetch(apiBase + path, {
      method:'PUT',
      headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json' },
      body: JSON.stringify({ message, content:base64, branch:GH_BRANCH, ...(sha ? { sha } : {}) })
    });
    if(!res.ok){ const b = await res.json().catch(() => ({})); throw new Error(b.message || `저장 실패 (${res.status})`); }
    return res.json();
  }
  async function ghDelete(path, message){
    const token = getToken();
    if(!token) throw new Error('NO_TOKEN');
    const sha = await getFileSha(path);
    if(!sha) return;
    const res = await fetch(apiBase + path, {
      method:'DELETE',
      headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json' },
      body: JSON.stringify({ message, sha, branch:GH_BRANCH })
    });
    if(!res.ok){ const b = await res.json().catch(() => ({})); throw new Error(b.message || `삭제 실패 (${res.status})`); }
  }

  /* ----- 저장 설정 (토큰) ----- */
  function openSettings(){
    const has = !!getToken();
    document.getElementById('settingsBody').innerHTML = `
      <h2 class="form-title">저장 설정</h2>
      <p class="form-hint">깃허브 토큰을 한 번만 등록하면, 사이트 안에서 바로 캐릭터를 저장할 수 있어요. 토큰은 이 기기의 브라우저에만 보관되고 깃허브에는 올라가지 않아요.</p>
      <ol class="form-hint steps">
        <li><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">여기</a>에서 새 토큰(fine-grained)을 만들어 주세요.</li>
        <li>Repository access는 ${GH_OWNER}/${GH_REPO} 하나만 선택해 주세요.</li>
        <li>Permissions의 Contents를 Read and write로 해 주세요.</li>
        <li>만든 토큰을 아래에 붙여넣고 저장해 주세요.</li>
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

  /* ----- 이미지 자르기 (3:4) ----- */
  function openCrop(file, onApply){
    if(typeof Cropper === 'undefined'){ alert('이미지 자르기 도구를 불러오지 못했어요. 네트워크를 확인해 주세요.'); return; }
    const img = document.getElementById('cropImage');
    const reader = new FileReader();
    reader.onload = () => {
      cropModal.classList.add('active');
      img.onload = () => {
        if(activeCropper) activeCropper.destroy();
        activeCropper = new Cropper(img, { aspectRatio:3/4, viewMode:1, autoCropArea:1, background:false, responsive:true });
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
      activeCropper.getCroppedCanvas({ width:600, height:800, imageSmoothingQuality:'high' }).toBlob(b => { onApply(b); closeCrop(); }, 'image/png');
    });
    fresh('cropCancel').addEventListener('click', closeCrop);
  }
  function closeCrop(){
    cropModal.classList.remove('active');
    if(activeCropper){ activeCropper.destroy(); activeCropper = null; }
  }
  document.getElementById('cropClose').addEventListener('click', closeCrop);

  /* ----- 생성 / 수정 폼 ----- */
  const TEXT_FIELDS = [
    ['영어 표기','nameEn'], ['한자 표기','nameKanji'], ['생일','birth'], ['나이','age'], ['키','height']
  ];
  const SCHOOL_KEYS = ['학급','학과','동아리','학생회','기숙사'];

  function fInput(label, path, val, ph){
    return `<label class="f-row"><span>${label}</span><input class="f-input" data-path="${path}" value="${esc(val)}" ${ph ? `placeholder="${ph}"` : ''}></label>`;
  }
  function fArea(label, path, val){
    return `<label class="f-row"><span>${label}</span><textarea class="f-input" rows="3" data-path="${path}">${esc(val)}</textarea></label>`;
  }

  function openForm(name){
    const info = name ? masterCharacters[name] : null;
    const isEdit = !!info;
    const p = info ? info.rawProfile : emptyProfile();
    const cf = (info && charFiles[info.name]) || {};
    pendingImage = null;

    const groupOpts = groups.map(g => `<option value="${esc(g.name)}" ${info && info.group === g.name ? 'selected' : ''}>${esc(g.name)}</option>`).join('');
    const colorOpts = ['<option value="">선택 안 함</option>'].concat(Object.keys(colorMap).map(c => `<option value="${esc(c)}" ${info && info.color === c ? 'selected' : ''}>${esc(c)}</option>`)).join('');
    const ownerOpts = ['<option value="">선택 안 함</option>'].concat(OWNERS.map(o => `<option value="${o}" ${(info && info.owner) === o ? 'selected' : ''}>${o}</option>`)).join('');
    const isMgr = info ? !!(groups.find(g => g.name === info.group && g.manager && g.manager.name === info.name)) : false;

    document.getElementById('formBody').innerHTML = `
      <h2 class="form-title">${isEdit ? '캐릭터 수정' : '캐릭터 추가'}</h2>
      <p class="form-hint">저장하면 깃허브에 바로 올라가요. 처음이라면 먼저 메인 화면의 저장 설정에서 토큰을 등록해 주세요.</p>

      <div class="f-group">기본</div>
      <label class="f-row"><span>이름</span><input class="f-input" id="fName" value="${esc(info ? info.name : '')}" ${isEdit ? 'readonly' : ''}></label>
      <label class="f-row"><span>파일명용 영어명</span><input class="f-input" id="fFile" value="${esc(info ? info.file : '')}" placeholder="예: keishyou (소문자, 숫자, 하이픈)" ${isEdit && info.file ? 'readonly' : ''}></label>
      <label class="f-row"><span>그룹</span><select class="f-input" id="fGroup" ${isEdit ? 'disabled' : ''}>${groupOpts}</select></label>
      <label class="f-row"><span>역할</span><input class="f-input" id="fRole" value="${esc(info ? info.role : '')}" placeholder="예: 리더, 보컬"></label>
      <label class="f-row"><span>대표 컬러</span><select class="f-input" id="fColor">${colorOpts}</select></label>
      <label class="f-row"><span>담당자</span><select class="f-input" id="fOwner">${ownerOpts}</select></label>
      <label class="f-check"><input type="checkbox" id="fMgr" ${isMgr ? 'checked' : ''} ${isEdit ? 'disabled' : ''}> 매니저로 등록</label>

      <div class="f-group">이미지 (3:4로 잘라서 저장돼요)</div>
      <div class="f-row"><input type="file" id="fImage" accept="image/*"><span class="f-note" id="fImageNote">${cf.image ? '등록된 이미지가 있어요. 새로 고르면 교체돼요.' : ''}</span></div>
      <p class="form-hint" id="fOcNote" ${ocOverrides[name || ''] ? '' : 'style="display:none"'}>oc 저장소에 같은 이름의 캐릭터가 있어서, 사이트에서는 oc의 사진이 우선 보여요.</p>

      <div class="f-group">프로필</div>
      ${TEXT_FIELDS.map(([l,k]) => fInput(l, k, p[k])).join('')}
      ${fArea('성격','personality',p.personality)}
      ${fArea('소개','info',p.info)}
      ${SCHOOL_KEYS.map(k => fInput(k, 'school.' + k, p.school[k])).join('')}
      ${fInput('좋아하는 음식','like.음식',p.like.음식)}
      ${fInput('좋아하는 사람','like.사람',p.like.사람)}
      ${fInput('싫어하는 음식','hate.음식',p.hate.음식)}
      ${fInput('싫어하는 사람','hate.사람',p.hate.사람)}
      ${fInput('취미','hobby',p.hobby)}
      ${fInput('특기','specialty',p.specialty)}
      ${fInput('반려동물','etc.반려동물',p.etc.반려동물)}
      ${fInput('최근 관심사','etc.최근관심사',p.etc.최근관심사)}
      ${fInput('가족 구성','etc.가족구성',p.etc.가족구성)}

      <div class="f-group">ABILITY (0~5)</div>
      <div class="f-ability">
        ${Object.keys(p.ability).map(k => `<label><span>${k}</span><input class="f-input" type="number" min="0" max="5" data-path="ability.${k}" value="${Number(p.ability[k]) || 0}"></label>`).join('')}
      </div>

      ${fArea('SPECIAL NOTE','specialNote',p.specialNote)}

      <p class="form-error" id="formError"></p>
      <div class="form-actions">
        <span></span>
        <button type="button" class="form-submit" id="formSave">저장</button>
      </div>`;
    formModal.classList.add('active');

    document.getElementById('fImage').addEventListener('change', (e) => {
      const f = e.target.files[0];
      pendingImage = null;
      if(!f) return;
      openCrop(f, (blob) => {
        pendingImage = { blob };
        document.getElementById('fImageNote').textContent = '새 이미지가 준비됐어요. 저장하면 올라가요.';
      });
    });
    document.getElementById('formSave').addEventListener('click', () => submitForm(info));
  }

  function setByPath(obj, path, val){
    const parts = path.split('.');
    let o = obj;
    for(let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = val;
  }

  async function submitForm(info){
    const err = document.getElementById('formError');
    err.textContent = '';
    const name = document.getElementById('fName').value.trim();
    const file = document.getElementById('fFile').value.trim().toLowerCase();
    if(!name){ err.textContent = '이름을 입력해 주세요.'; return; }
    if(!/^[a-z0-9-]+$/.test(file)){ err.textContent = '영어명은 소문자, 숫자, 하이픈만 쓸 수 있어요.'; return; }
    if(!info && masterCharacters[name]){ err.textContent = '같은 이름의 캐릭터가 이미 있어요.'; return; }
    if(!getToken()){ err.textContent = '먼저 저장 설정에서 토큰을 등록해 주세요.'; return; }

    const profile = emptyProfile();
    formModal.querySelectorAll('[data-path]').forEach(el => {
      const path = el.dataset.path;
      const v = el.type === 'number' ? Math.max(0, Math.min(5, Number(el.value) || 0)) : el.value.trim();
      setByPath(profile, path, v);
    });

    const prev = (info && charFiles[info.name]) || {};
    const data = {
      name, file,
      group: info ? info.group : document.getElementById('fGroup').value,
      role: document.getElementById('fRole').value.trim(),
      color: document.getElementById('fColor').value,
      owner: document.getElementById('fOwner').value,
      isManager: info ? !!prev.isManager || !!(groups.find(g => g.name === info.group && g.manager && g.manager.name === info.name)) : document.getElementById('fMgr').checked,
      image: prev.image || null,
      imageV: prev.imageV || null,
      profile
    };

    const btn = document.getElementById('formSave');
    btn.disabled = true; btn.textContent = '저장 중...';
    try {
      if(pendingImage){
        const imgPath = `ymkb_icon_${file}.png`;
        await ghPut(imgPath, await blobToBase64(pendingImage.blob), `Update image: ${name}`);
        data.image = imgPath;
        data.imageV = Date.now();
      }
      await ghPut(`${CHAR_DIR}/${file}.json`, toBase64Text(JSON.stringify(data, null, 2) + '\n'), `${info ? 'Update' : 'Add'} character: ${name}`);
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
    if(!cf){
      alert('이 캐릭터는 기본 데이터(groups.json)에 들어 있어서 사이트에서 바로 지울 수 없어요. 수정으로 내용은 바꿀 수 있어요.');
      return;
    }
    if(!getToken()){ alert('먼저 저장 설정에서 토큰을 등록해 주세요.'); return; }
    if(!confirm(`"${name}" 캐릭터의 저장된 데이터를 삭제할까요?\n되돌릴 수 없어요.`)) return;
    try {
      await ghDelete(cf._path, `Delete character: ${name}`);
      if(cf.image) { try { await ghDelete(cf.image, `Delete image: ${name}`); } catch(e){} }
      window.location.reload();
    } catch(e){
      alert('삭제에 실패했어요: ' + e.message);
    }
  }

  document.getElementById('addCharBtn').addEventListener('click', () => openForm(null));
  document.getElementById('formClose').addEventListener('click', () => formModal.classList.remove('active'));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if(!b) return;
    if(b.dataset.act === 'edit') openForm(b.dataset.name);
    if(b.dataset.act === 'delete') deleteCharacter(b.dataset.name);
  });
})();
