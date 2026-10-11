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
    const oc = ocOverrides[member.name];
    const ocImagePath = oc && (oc.image || oc.profileImage);
    const imgSrc = ocImagePath ? ocAssetUrl(ocImagePath) : `ymkb_icon_${member.file}.png`;
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
    const custom = characterProfiles[name] || {};
    masterCharacters[name].profile = Object.assign(emptyProfile(), custom);
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
    const oc = ocOverrides[r.name];
    const ocImagePath = oc && (oc.image || oc.profileImage);
    const imgSrc = ocImagePath ? ocAssetUrl(ocImagePath) : (info.file ? `ymkb_icon_${info.file}.png` : '');
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
    const oc = ocOverrides[info.name];
    const ocImagePath = oc && (oc.image || oc.profileImage);
    const imgSrc = ocImagePath ? ocAssetUrl(ocImagePath) : (info.file ? `ymkb_icon_${info.file}.png` : '');
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
    if(profileModal.classList.contains('active')) profileModal.classList.remove('active');
    else if(classModal.classList.contains('active')) classModal.classList.remove('active');
    else if(groupModal.classList.contains('active')) groupModal.classList.remove('active');
  });
})();
