(() => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const clock = document.getElementById('clock');
  const year = document.getElementById('year');

  // Footer year
  if (year) year.textContent = String(new Date().getFullYear());

  // Theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    root.dataset.theme = savedTheme;
  } else {
    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)')?.matches;
    root.dataset.theme = prefersLight ? 'light' : 'dark';
  }

  themeToggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
  });

  // Clock
  const tick = () => {
    if (!clock) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    clock.textContent = `현재 시간: ${hh}:${mm}`;
  };
  tick();
  setInterval(tick, 1000 * 15);

  // Toggle details
  const buttons = document.querySelectorAll('[data-toggle]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-toggle');
      const panel = document.getElementById(`details-${key}`);
      if (!panel) return;
      const isHidden = panel.hasAttribute('hidden');
      if (isHidden) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');

      btn.textContent = panel.hasAttribute('hidden') ? '장단점 보기' : '장단점 접기';
    });
  });

  // Simple recommender
  const pickForm = document.getElementById('pickForm');
  const pickNote = document.getElementById('pickNote');

  const score = (needs) => {
    const s = { github: 0, netlify: 0, vercel: 0 };

    if (needs.has('simple')) s.github += 3;
    if (needs.has('dragdrop')) s.netlify += 3;
    if (needs.has('form')) s.netlify += 2;
    if (needs.has('framework')) s.vercel += 3;

    // secondary weights
    if (needs.has('simple')) s.netlify += 1;
    if (needs.has('framework')) s.netlify += 1;

    return s;
  };

  const topPick = (s) => {
    const entries = Object.entries(s).sort((a, b) => b[1] - a[1]);
    const [first, second] = entries;
    return { first, second };
  };

  const label = (key) => ({ github: 'GitHub Pages', netlify: 'Netlify', vercel: 'Vercel' }[key] || key);

  pickForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(pickForm);
    const needs = new Set(data.getAll('need').map(String));

    const s = score(needs);
    const { first, second } = topPick(s);

    if (!pickNote) return;

    if (first[1] === 0) {
      pickNote.textContent = '체크가 없으면 기본 추천은 Netlify(가장 무난하고 편함)입니다.';
      return;
    }

    const reason = [];
    if (needs.has('dragdrop')) reason.push('드래그&드롭');
    if (needs.has('form')) reason.push('폼/편의기능');
    if (needs.has('framework')) reason.push('프레임워크');
    if (needs.has('simple')) reason.push('단순/무료');

    pickNote.textContent = `추천: ${label(first[0])} (점수 ${first[1]}). 2순위: ${label(second[0])} (점수 ${second[1]}). 선택 기준: ${reason.join(', ') || '기본값'}.`;
  });
})();
