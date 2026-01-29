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

  // Gold price tracker
  const $ = (id) => document.getElementById(id);

  const currencyEl = $('currency');
  const intervalEl = $('interval');
  const refreshBtn = $('refresh');
  const clearBtn = $('clear');

  const priceOzEl = $('priceOz');
  const priceGEl = $('priceG');
  const chgOzEl = $('chgOz');
  const chgGEl = $('chgG');
  const asofEl = $('asof');
  const statusEl = $('status');

  const badgeCurr = $('badgeCurr');
  const badgeCurr2 = $('badgeCurr2');
  const trendCurr = $('trendCurr');

  const chart = $('chart');
  const trendMeta = $('trendMeta');

  const OZ_TO_G = 31.1034768;

  const fmtMoney = (value, currency) => {
    try {
      return new Intl.NumberFormat('ja-JP', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
    } catch {
      return `${Math.round(value).toLocaleString()} ${currency}`;
    }
  };

  const fmtPct = (v) => {
    const sign = v > 0 ? '+' : '';
    return `${sign}${Number(v).toFixed(2)}%`;
  };

  const storageKey = (currency) => `gold-xau-history:${currency}`;
  const loadHistory = (currency) => {
    try {
      const raw = localStorage.getItem(storageKey(currency));
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };
  const saveHistory = (currency, history) => {
    try {
      localStorage.setItem(storageKey(currency), JSON.stringify(history.slice(-120)));
    } catch {
      // ignore
    }
  };

  const pushPoint = (currency, point) => {
    const history = loadHistory(currency);
    history.push(point);
    // keep last 120 points
    saveHistory(currency, history.slice(-120));
    return history.slice(-120);
  };

  const drawChart = (history, currency) => {
    if (!chart) return;
    const ctx = chart.getContext('2d');
    if (!ctx) return;

    const w = chart.width;
    const h = chart.height;

    ctx.clearRect(0, 0, w, h);

    // background
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg2') || '#0f1a30';
    ctx.fillRect(0, 0, w, h);

    if (!history.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '16px system-ui';
      ctx.fillText('기록이 없습니다. 새로고침을 눌러 데이터를 쌓아보세요.', 20, 40);
      return;
    }

    const values = history.map((p) => p.oz);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.08 || 1;
    const lo = min - pad;
    const hi = max + pad;

    const left = 40;
    const right = 16;
    const top = 16;
    const bottom = 30;

    const plotW = w - left - right;
    const plotH = h - top - bottom;

    // axes
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, top + plotH);
    ctx.lineTo(left + plotW, top + plotH);
    ctx.stroke();

    // line
    const x = (i) => left + (i / Math.max(1, history.length - 1)) * plotW;
    const y = (v) => top + (1 - (v - lo) / (hi - lo)) * plotH;

    ctx.strokeStyle = 'rgba(124,92,255,0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((p, i) => {
      const xx = x(i);
      const yy = y(p.oz);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    });
    ctx.stroke();

    // last point
    const last = history[history.length - 1];
    ctx.fillStyle = 'rgba(34,197,94,0.95)';
    ctx.beginPath();
    ctx.arc(x(history.length - 1), y(last.oz), 4, 0, Math.PI * 2);
    ctx.fill();

    // labels
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '12px system-ui';
    ctx.fillText(fmtMoney(hi, currency), 6, top + 10);
    ctx.fillText(fmtMoney(lo, currency), 6, top + plotH);
  };

  const setBadges = (currency) => {
    if (badgeCurr) badgeCurr.textContent = currency;
    if (badgeCurr2) badgeCurr2.textContent = currency;
    if (trendCurr) trendCurr.textContent = currency;
  };

  const fetchXau = async (currency) => {
    const url = `https://data-asg.goldprice.org/dbXRates/${encodeURIComponent(currency)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const item = json?.items?.[0];
    if (!item || typeof item.xauPrice !== 'number') throw new Error('Bad payload');
    return {
      ts: Number(json.ts || Date.now()),
      date: String(json.date || ''),
      curr: String(item.curr || currency),
      oz: Number(item.xauPrice),
      chgOz: Number(item.chgXau || 0),
      pcOz: Number(item.pcXau || 0),
    };
  };

  const render = (snap) => {
    const currency = snap.curr;
    setBadges(currency);

    const g = snap.oz / OZ_TO_G;
    const chgG = snap.chgOz / OZ_TO_G;

    if (priceOzEl) priceOzEl.textContent = fmtMoney(snap.oz, currency);
    if (priceGEl) priceGEl.textContent = fmtMoney(g, currency);

    if (chgOzEl) chgOzEl.textContent = `변동(전일 대비): ${fmtMoney(snap.chgOz, currency)} · ${fmtPct(snap.pcOz)}`;
    if (chgGEl) chgGEl.textContent = `변동(전일 대비): ${fmtMoney(chgG, currency)} · ${fmtPct(snap.pcOz)}`;

    if (asofEl) asofEl.textContent = `업데이트: ${new Date(snap.ts).toLocaleString()} · 데이터 표기: ${snap.date}`;
  };

  const update = async () => {
    const currency = currencyEl?.value || 'JPY';
    if (statusEl) statusEl.textContent = '불러오는 중…';

    try {
      const snap = await fetchXau(currency);
      render(snap);

      const history = pushPoint(currency, { t: snap.ts, oz: snap.oz });
      drawChart(history, currency);

      if (trendMeta) {
        const first = history[0];
        const last = history[history.length - 1];
        const diff = last.oz - first.oz;
        const pct = first.oz ? (diff / first.oz) * 100 : 0;
        trendMeta.textContent = `기록 ${history.length}개 · 시작→현재: ${fmtMoney(first.oz, currency)} → ${fmtMoney(last.oz, currency)} (${fmtPct(pct)})`;
      }

      if (statusEl) statusEl.textContent = 'OK';
    } catch (e) {
      if (statusEl) statusEl.textContent = `오류: ${e?.message || e}`;
    }
  };

  let timer = null;
  const applyInterval = () => {
    const seconds = Number(intervalEl?.value || 0);
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (seconds > 0) {
      timer = setInterval(update, seconds * 1000);
    }
  };

  currencyEl?.addEventListener('change', () => {
    update();
  });

  intervalEl?.addEventListener('change', () => {
    applyInterval();
  });

  refreshBtn?.addEventListener('click', () => {
    update();
  });

  clearBtn?.addEventListener('click', () => {
    const currency = currencyEl?.value || 'JPY';
    localStorage.removeItem(storageKey(currency));
    if (trendMeta) trendMeta.textContent = '기록을 삭제했습니다.';
    drawChart([], currency);
  });

  // initial
  setBadges(currencyEl?.value || 'JPY');
  applyInterval();
  update();
})();
