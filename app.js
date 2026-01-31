// 일본 주식 우대권 매니저 (Demo)
// - localStorage 기반 (서버/로그인 없음)
// - 목적: 데이터 모델/UX/필터링/만료 계산 데모

const STORAGE_KEY = 'jp_perks_v1';

/** @typedef {{
 * id: string,
 * company: string,
 * ticker?: string,
 * category: 'coupon'|'voucher'|'food'|'transport'|'other',
 * receivedAt?: string, // YYYY-MM-DD
 * expiresAt?: string,  // YYYY-MM-DD
 * quantity: number,
 * memo?: string,
 * isDigital: boolean,
 * link?: string,
 * usedAt?: string, // ISO
 * createdAt: string, // ISO
 * updatedAt: string  // ISO
 * }} Perk
 */

function uid(){
  return 'p_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16);
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return seed();
    const data = JSON.parse(raw);
    if(!Array.isArray(data)) return seed();
    return data;
  }catch{
    return seed();
  }
}

function save(perks){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(perks));
}

function seed(){
  const now = new Date().toISOString();
  const demo = [
    {
      id: uid(),
      company: 'AEON',
      ticker: '8267',
      category: 'coupon',
      receivedAt: toYMD(addDays(new Date(), -10)),
      expiresAt: toYMD(addDays(new Date(), 40)),
      quantity: 1,
      memo: '예시: 우대권 사용처/조건/가족 공유 여부 등 기록',
      isDigital: false,
      link: '',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uid(),
      company: 'JR Kyushu',
      ticker: '9142',
      category: 'transport',
      receivedAt: toYMD(addDays(new Date(), -30)),
      expiresAt: toYMD(addDays(new Date(), 5)),
      quantity: 2,
      memo: '만료 임박 예시(알림 대상)',
      isDigital: true,
      link: 'https://example.com',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uid(),
      company: 'Some Restaurant',
      ticker: '0000',
      category: 'food',
      receivedAt: toYMD(addDays(new Date(), -120)),
      expiresAt: toYMD(addDays(new Date(), -2)),
      quantity: 1,
      memo: '만료된 예시',
      isDigital: false,
      link: '',
      createdAt: now,
      updatedAt: now,
    }
  ];
  save(demo);
  return demo;
}

function addDays(d, n){
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function toYMD(d){
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}

function daysUntil(ymd){
  if(!ymd) return null;
  const today = new Date();
  const d = new Date(ymd + 'T00:00:00');
  const ms = d.getTime() - new Date(toYMD(today) + 'T00:00:00').getTime();
  return Math.floor(ms / (1000*60*60*24));
}

function statusOf(perk){
  if(perk.usedAt) return 'used';
  const du = daysUntil(perk.expiresAt);
  if(du === null) return 'active';
  if(du < 0) return 'expired';
  return 'active';
}

function urgencyPill(perk){
  const st = statusOf(perk);
  if(st === 'used') return { text: '사용완료', cls: 'used' };

  const du = daysUntil(perk.expiresAt);
  if(du === null) return { text: '사용가능', cls: 'ok' };
  if(du < 0) return { text: `만료 (${Math.abs(du)}일 전)`, cls: 'bad' };
  if(du <= 7) return { text: `만료 임박 (${du}일)`, cls: 'warn' };
  return { text: `만료까지 ${du}일`, cls: 'ok' };
}

function categoryLabel(cat){
  return {
    coupon: '쿠폰/할인권',
    voucher: '상품권/기프트',
    food: '식사권',
    transport: '교통/여행',
    other: '기타'
  }[cat] || cat;
}

// UI
const form = document.getElementById('perkForm');
const listEl = document.getElementById('list');
const statsEl = document.getElementById('stats');
const tpl = document.getElementById('perkCardTpl');
const searchEl = document.getElementById('search');
const filterStatusEl = document.getElementById('filterStatus');
const sortByEl = document.getElementById('sortBy');
const btnExport = document.getElementById('btnExport');
const fileImport = document.getElementById('fileImport');
const btnReset = document.getElementById('btnReset');

let perks = load();
render();

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const now = new Date().toISOString();

  /** @type {Perk} */
  const perk = {
    id: uid(),
    company: String(fd.get('company')||'').trim(),
    ticker: String(fd.get('ticker')||'').trim(),
    category: /** @type any */ (fd.get('category') || 'other'),
    receivedAt: String(fd.get('receivedAt')||'').trim() || undefined,
    expiresAt: String(fd.get('expiresAt')||'').trim() || undefined,
    quantity: Number(fd.get('quantity')||1) || 1,
    memo: String(fd.get('memo')||'').trim() || undefined,
    isDigital: fd.get('isDigital') === 'on',
    link: String(fd.get('link')||'').trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  perks.unshift(perk);
  save(perks);
  form.reset();
  render();
});

searchEl.addEventListener('input', render);
filterStatusEl.addEventListener('change', render);
sortByEl.addEventListener('change', render);

btnReset.addEventListener('click', () => {
  if(!confirm('정말로 데모 데이터를 초기화할까요?')) return;
  localStorage.removeItem(STORAGE_KEY);
  perks = load();
  render();
});

btnExport.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(perks, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jp-perks-export-${toYMD(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

fileImport.addEventListener('change', async () => {
  const f = fileImport.files?.[0];
  if(!f) return;
  try{
    const text = await f.text();
    const data = JSON.parse(text);
    if(!Array.isArray(data)) throw new Error('JSON array가 아닙니다');
    // 최소 필드 검증
    for(const item of data){
      if(!item.id || !item.company) throw new Error('필수 필드(id/company) 누락');
    }
    perks = data;
    save(perks);
    render();
  }catch(err){
    alert('가져오기 실패: ' + (err?.message || String(err)));
  }finally{
    fileImport.value = '';
  }
});

function render(){
  const q = searchEl.value.trim().toLowerCase();
  const f = filterStatusEl.value;
  const s = sortByEl.value;

  let items = [...perks];

  if(q){
    items = items.filter(p => {
      const hay = [p.company, p.ticker, p.memo, categoryLabel(p.category)].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  if(f !== 'all'){
    items = items.filter(p => statusOf(p) === f);
  }

  items.sort((a,b) => {
    if(s === 'expiresAsc'){
      const da = daysUntil(a.expiresAt) ?? 999999;
      const db = daysUntil(b.expiresAt) ?? 999999;
      return da - db;
    }
    if(s === 'receivedDesc'){
      const ra = a.receivedAt ? new Date(a.receivedAt).getTime() : 0;
      const rb = b.receivedAt ? new Date(b.receivedAt).getTime() : 0;
      return rb - ra;
    }
    if(s === 'companyAsc'){
      return String(a.company).localeCompare(String(b.company));
    }
    return 0;
  });

  // stats
  const total = perks.length;
  const active = perks.filter(p => statusOf(p) === 'active').length;
  const used = perks.filter(p => statusOf(p) === 'used').length;
  const expired = perks.filter(p => statusOf(p) === 'expired').length;
  const soon = perks.filter(p => {
    const st = statusOf(p);
    if(st !== 'active') return false;
    const du = daysUntil(p.expiresAt);
    return du !== null && du <= 7;
  }).length;

  statsEl.innerHTML = [
    stat(`전체 ${total}개`),
    stat(`사용가능 ${active}개`),
    stat(`만료임박(≤7일) ${soon}개`),
    stat(`사용완료 ${used}개`),
    stat(`만료 ${expired}개`),
  ].join('');

  // list
  listEl.innerHTML = '';
  if(items.length === 0){
    listEl.innerHTML = `<div class="hint">표시할 우대권이 없습니다. 검색/필터를 바꾸거나 새로 추가해보세요.</div>`;
    return;
  }

  for(const perk of items){
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.title').textContent = `${perk.company}${perk.ticker ? ` (${perk.ticker})` : ''}`;
    node.querySelector('.meta').textContent = `${categoryLabel(perk.category)} · 수량 ${perk.quantity}${perk.isDigital ? ' · 디지털' : ''}`;

    const pill = urgencyPill(perk);
    const pillEl = node.querySelector('.pill');
    pillEl.textContent = pill.text;
    pillEl.classList.add(pill.cls);

    const kvEl = node.querySelector('.kv');
    kvEl.innerHTML = [
      `<div>수령일: <strong>${perk.receivedAt || '-'}</strong></div>`,
      `<div>만료일: <strong>${perk.expiresAt || '-'}</strong></div>`,
      `<div>상태: <strong>${statusLabel(statusOf(perk))}</strong></div>`,
      `<div>링크: ${perk.link ? `<a href="${escapeAttr(perk.link)}" target="_blank" rel="noreferrer">열기</a>` : '-'}</div>`,
    ].join('');

    const memoEl = node.querySelector('.memo');
    memoEl.textContent = perk.memo ? perk.memo : '';

    node.querySelector('.btnToggleUsed').addEventListener('click', () => toggleUsed(perk.id));
    node.querySelector('.btnDelete').addEventListener('click', () => del(perk.id));
    node.querySelector('.btnDuplicate').addEventListener('click', () => duplicate(perk.id));

    listEl.appendChild(node);
  }
}

function stat(text){
  return `<span class="stat">${text}</span>`;
}

function statusLabel(st){
  return {active:'사용가능', used:'사용완료', expired:'만료'}[st] || st;
}

function toggleUsed(id){
  const now = new Date().toISOString();
  perks = perks.map(p => {
    if(p.id !== id) return p;
    const usedAt = p.usedAt ? undefined : now;
    return { ...p, usedAt, updatedAt: now };
  });
  save(perks);
  render();
}

function duplicate(id){
  const src = perks.find(p => p.id === id);
  if(!src) return;
  const now = new Date().toISOString();
  const copy = { ...src, id: uid(), usedAt: undefined, createdAt: now, updatedAt: now };
  perks.unshift(copy);
  save(perks);
  render();
}

function del(id){
  if(!confirm('삭제할까요?')) return;
  perks = perks.filter(p => p.id !== id);
  save(perks);
  render();
}

function escapeAttr(s){
  return String(s).replace(/"/g,'&quot;');
}
