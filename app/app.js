// Leonida Trophy Guide — tracker and guide in one page. Loads app/data/trophies.json,
// renders the roadmap and the checklist, saves earned trophies in localStorage,
// and lets a reader export, import or share the checklist through a link.
const STORE_KEY = 'leonida-trophy-tracker-v1';
const DATA_URL = 'data/trophies.json';

const KIND_LABELS = {
  story: 'Story', missable: 'Missable', collectibles: 'Collectibles',
  activities: 'Activities', robbery: 'Robberies', side: 'Side quests',
  money: 'Money', misc: 'Miscellaneous', completion: '100% completion', platinum: 'Platinum',
};

const STAGES = [
  {
    n: 1, title: 'Stage 1 — Play the story', hours: '60–80 hours',
    text: 'Play chapters 1 to 5 with Jason and Lucia. No gold medals are needed in story missions, so enjoy the campaign — but do the first meditation in Chapter 1, start scanning with WAiNK from the beginning, and take the stranger strands as they appear. Keep a manual save at the start and end of each chapter: there is no mission replay.',
  },
  {
    n: 2, title: 'Stage 2 — Reach 100% completion', hours: 'Around 100 hours',
    text: 'After the story, open Progress, then Stats, then 100% Completion and work down the in-game checklist. Do the robberies first (they fund the garages), then the collectibles and activities. Only the listed portion of each activity counts — stop each one the moment its line is done.',
  },
  {
    n: 3, title: 'Stage 3 — Strangers & cleanup', hours: '10–20 hours',
    text: 'Finish the five character strands (Andy, Kenton, Billy, Randy, Tyrone), eight stranger strands, Bret\u2019s hunting, and whatever miscellaneous trophies are left. When the last one lands, the platinum pops.',
  },
];

const params = new URLSearchParams(location.search);
const doc = await (await fetch(DATA_URL)).json();
const trophies = doc.trophies;

let earned = new Set();
try { earned = new Set(JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]')); } catch { earned = new Set(); }
if (params.has('earned')) {
  earned = new Set(params.get('earned').split(',').map((s) => Number(s)).filter((n) => trophies.some((t) => t.id === n)));
}
let spoiler = params.get('spoiler') === 'on';
let openId = params.has('open') ? Number(params.get('open')) : null;
let kindFilter = params.get('kind') ?? 'all';
let gradeFilter = params.get('grade') ?? 'all';

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned]));
}

function formatCount(t) {
  if (t.count == null) return null;
  if (t.kind === 'money') return '$' + t.count.toLocaleString('en-US');
  return String(t.count);
}

function isHiddenFromSpoilers(t) {
  return spoiler && t.kind === 'story' && !earned.has(t.id);
}

function renderFacts() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) counts[t.grade] += 1;
  const hidden = trophies.filter((t) => t.hidden).length;
  $('facts').innerHTML = [
    `<li><b>55</b> trophies</li>`,
    `<li><b>${counts.platinum}</b> platinum · <b>${counts.gold}</b> gold · <b>${counts.silver}</b> silver · <b>${counts.bronze}</b> bronze</li>`,
    `<li><b>${hidden}</b> hidden</li>`,
    `<li>~<b>200 hours</b> to platinum</li>`,
    `<li>Difficulty <b>4/10</b></li>`,
    `<li><b>0</b> online trophies</li>`,
    `<li><b>1</b> playthrough</li>`,
  ].join('');
}

function renderStages() {
  $('stages').replaceChildren();
  for (const stage of STAGES) {
    const mine = trophies.filter((t) => t.stage === stage.n);
    const done = mine.filter((t) => earned.has(t.id)).length;
    const article = document.createElement('article');
    article.className = 'stage';
    const h3 = document.createElement('h3');
    h3.textContent = stage.title;
    const hours = document.createElement('p');
    hours.className = 'hours';
    hours.textContent = `${stage.hours} · ${done} of ${mine.length} earned`;
    const text = document.createElement('p');
    text.textContent = stage.text;
    const ul = document.createElement('ul');
    for (const t of mine) {
      const li = document.createElement('li');
      li.textContent = (earned.has(t.id) ? '✓ ' : '') + t.name;
      if (earned.has(t.id)) li.className = 'done-mark';
      ul.append(li);
    }
    article.append(h3, hours, text, ul);
    $('stages').append(article);
  }
}

function renderProgress() {
  const n = earned.size;
  $('progressFill').style.width = `${(n / trophies.length) * 100}%`;
  $('progressText').textContent = `${n} of ${trophies.length} earned — ${Math.round((n / trophies.length) * 100)}% to the platinum`;
  $('miniProgress').textContent = `${n} of ${trophies.length} earned`;
}

function badge(text, cls) {
  const s = document.createElement('span');
  s.className = `badge ${cls}`;
  s.textContent = text;
  return s;
}

function trophyCard(t) {
  const card = document.createElement('article');
  card.className = 'card' + (earned.has(t.id) ? ' earned' : '') + (t.missable ? ' missable-card' : '');
  card.id = `trophy-${t.id}`;

  const head = document.createElement('div');
  head.className = 'card-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id);
    else earned.delete(t.id);
    save();
    renderAll();
  });

  const titleBox = document.createElement('div');
  titleBox.className = 'card-title';
  const h3 = document.createElement('h3');
  if (isHiddenFromSpoilers(t)) {
    h3.innerHTML = '';
    const em = document.createElement('em');
    em.className = 'spoiler-name';
    em.textContent = 'Hidden story trophy — earn it to reveal';
    h3.append(em);
  } else {
    h3.textContent = t.name;
  }
  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = isHiddenFromSpoilers(t) ? 'Its name and description stay hidden until you earn it.' : t.description;
  const badges = document.createElement('div');
  badges.className = 'badges';
  badges.append(badge(t.grade, t.grade));
  badges.append(badge(KIND_LABELS[t.kind] ?? t.kind, 'kind'));
  const count = formatCount(t);
  if (count) badges.append(badge(`× ${count}`, 'count'));
  if (t.hidden) badges.append(badge('Hidden', 'hidden-badge'));
  if (t.missable) badges.append(badge('⚠ Missable', 'missable'));
  if (!t.confirmed) badges.append(badge('Method unconfirmed', 'unconfirmed'));
  titleBox.append(h3, desc, badges);

  const guideBtn = document.createElement('button');
  guideBtn.type = 'button';
  guideBtn.className = 'guide-btn';
  guideBtn.textContent = openId === t.id ? 'Hide guide' : 'Guide';
  guideBtn.addEventListener('click', () => {
    openId = openId === t.id ? null : t.id;
    renderAll();
  });

  head.append(box, titleBox, guideBtn);
  card.append(head);

  if (openId === t.id) {
    const guide = document.createElement('div');
    guide.className = 'guide';
    if (!t.confirmed) {
      const note = document.createElement('p');
      note.className = 'unconfirmed-note';
      note.textContent = 'Method unconfirmed — no guide has pinned down how this one unlocks yet. What follows is what the guides report, not a verified method.';
      guide.append(note);
    }
    const p = document.createElement('p');
    p.textContent = t.guide;
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = `Roadmap: Stage ${t.stage} · ${STAGES[t.stage - 1].title.replace(/^Stage \d — /, '')}`;
    const srcTitle = document.createElement('p');
    srcTitle.className = 'meta';
    srcTitle.textContent = 'Sources:';
    const ul = document.createElement('ul');
    ul.className = 'src-list';
    for (const s of t.sources) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.name;
      li.append(a);
      ul.append(li);
    }
    guide.append(p, meta, srcTitle, ul);
    card.append(guide);
  }
  return card;
}

function visibleTrophies() {
  const q = $('searchInput').value.trim().toLowerCase();
  let list = trophies.filter((t) => {
    if (kindFilter === 'missable') { if (!t.missable) return false; }
    else if (kindFilter !== 'all' && t.kind !== kindFilter) return false;
    if (gradeFilter !== 'all' && t.grade !== gradeFilter) return false;
    const shown = $('earnedFilter').value;
    if (shown === 'todo' && earned.has(t.id)) return false;
    if (shown === 'earned' && !earned.has(t.id)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
  list = [...list].sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  if (openId != null) {
    const pinned = list.find((t) => t.id === openId);
    if (pinned) list = [pinned, ...list.filter((t) => t.id !== openId)];
  }
  return list;
}

function renderList() {
  const list = visibleTrophies();
  listEl.replaceChildren();
  if (list.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'No trophies match these filters.';
    listEl.append(p);
  } else {
    for (const t of list) listEl.append(trophyCard(t));
  }
  $('listCount').textContent = `Showing ${list.length} of ${trophies.length} trophies`;
}

function renderSpoilerButton() {
  const btn = $('spoilerBtn');
  btn.setAttribute('aria-pressed', String(spoiler));
  btn.textContent = spoiler ? 'Spoilers: hidden' : 'Spoilers: off';
  $('spoilerCheck').checked = spoiler;
}

function renderAll() {
  renderFacts();
  renderStages();
  renderProgress();
  renderSpoilerButton();
  renderList();
}

$('spoilerBtn').addEventListener('click', () => { spoiler = !spoiler; renderAll(); });
$('spoilerCheck').addEventListener('change', (e) => { spoiler = e.target.checked; renderAll(); });
$('kindFilter').value = kindFilter;
$('gradeFilter').value = gradeFilter;
$('kindFilter').addEventListener('change', (e) => { kindFilter = e.target.value; renderAll(); });
$('gradeFilter').addEventListener('change', (e) => { gradeFilter = e.target.value; renderAll(); });
$('earnedFilter').addEventListener('change', renderAll);
$('searchInput').addEventListener('input', renderList);

$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: doc.game, platform: doc.platform, earned: [...earned].sort((a, b) => a - b), exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    const valid = new Set(ids.filter((n) => trophies.some((t) => t.id === n)));
    earned = valid;
    save();
    renderAll();
  } catch {
    alert('That file is not a trophy progress export.');
  }
  e.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (confirm('Clear every ticked trophy?')) {
    earned = new Set();
    save();
    renderAll();
  }
});

renderAll();
if (params.get('view') === 'roadmap') $('roadmap').scrollIntoView();
if (params.get('view') === 'list') $('controls').scrollIntoView();
// Lets a screenshot harness know the first render is done.
window.__shotReady = true;
