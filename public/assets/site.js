(() => {
  const header = document.getElementById('site-header');
  const progress = document.getElementById('scroll-progress');
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');
  const floatCta = document.getElementById('float-cta');

  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-scrolled', y > 24);
    const height = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${height > 0 ? Math.min(100, (y / height) * 100) : 0}%`;
    if (floatCta) {
      const show = y > 640 && window.matchMedia('(max-width: 700px)').matches;
      floatCta.classList.toggle('is-visible', show);
    }
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  const closeMenu = () => {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Открыть меню');
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      toggle.setAttribute('aria-label', open ? 'Открыть меню' : 'Закрыть меню');
      nav.classList.toggle('is-open', !open);
      document.body.classList.toggle('menu-open', !open);
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const liveOnline = document.getElementById('live-online');
  const liveUnit = document.getElementById('live-unit');
  const liveNote = document.getElementById('live-note');
  const livePeak = document.getElementById('live-peak');
  const liveSeries = document.getElementById('live-chart-series');

  if (liveOnline && liveUnit && liveNote && livePeak && liveSeries) {
    const STATS_URL = 'https://egerlabs.ru/apps/griazemes/api/stats.php';
    const REFRESH_MS = 30000;
    let liveTimer;
    let liveAlive = true;

    const plural = (value) => {
      const n = Math.abs(Number(value));
      if (!Number.isFinite(n)) return 'единиц техники онлайн';
      if (n % 100 >= 11 && n % 100 <= 14) return 'единиц техники онлайн';
      if (n % 10 === 1) return 'единица техники онлайн';
      if (n % 10 >= 2 && n % 10 <= 4) return 'единицы техники онлайн';
      return 'единиц техники онлайн';
    };

    const renderLiveChart = (series) => {
      const peak = series.reduce((max, point) => Math.max(max, Number(point.n) || 0), 0);
      livePeak.textContent = peak > 0 ? `пик ${peak}` : 'пока тихо';
      if (!series.length) {
        liveSeries.innerHTML =
          '<line x1="0" y1="33" x2="100" y2="33" stroke="rgba(242,241,231,.18)" stroke-width="1" vector-effect="non-scaling-stroke"/>';
        return;
      }
      const scale = Math.max(1, peak);
      const points = series.map((point, index) => {
        const x = series.length <= 1 ? 0 : (index / (series.length - 1)) * 100;
        const y = 33 - ((Number(point.n) || 0) / scale) * 29;
        return [x, y];
      });
      const line = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
      const last = points[points.length - 1];
      liveSeries.innerHTML =
        `<polygon points="0,36 ${line} 100,36" fill="url(#live-fill)"/>` +
        `<polyline points="${line}" fill="none" stroke="#c8ff3d" stroke-width="1.4" ` +
        'stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
        `<circle cx="${last[0].toFixed(2)}" cy="${last[1].toFixed(2)}" r="1.5" fill="#c8ff3d"/>`;
    };

    const loadLiveStats = async () => {
      try {
        const response = await fetch(STATS_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data || !data.ok || !Array.isArray(data.series)) throw new Error('bad stats');
        if (!liveAlive) return;
        const online = Number(data.online);
        liveOnline.textContent = Number.isFinite(online) ? String(online) : '—';
        liveUnit.textContent = plural(online);
        liveNote.textContent =
          'Считаем анонимно: без координат, имён и рекламы. Обновляется каждые 30 секунд.';
        renderLiveChart(data.series);
      } catch {
        if (liveAlive) {
          liveNote.textContent = 'Счётчик временно недоступен. Попробуй обновить страницу.';
        }
      }
      if (liveAlive) liveTimer = window.setTimeout(loadLiveStats, REFRESH_MS);
    };

    loadLiveStats();
  }
})();