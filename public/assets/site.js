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
  const liveSvg = document.getElementById('live-chart-svg');
  const liveYPeak = document.getElementById('live-y-peak');
  const liveAvg = document.getElementById('live-avg');
  const liveActive = document.getElementById('live-active');
  const liveUpdated = document.getElementById('live-updated');
  const liveAxis = document.getElementById('live-chart-axis');
  const liveTooltip = document.getElementById('live-chart-tooltip');

  if (
    liveOnline &&
    liveUnit &&
    liveNote &&
    livePeak &&
    liveSeries &&
    liveSvg &&
    liveYPeak &&
    liveAvg &&
    liveActive &&
    liveUpdated &&
    liveAxis &&
    liveTooltip
  ) {
    const STATS_URL = 'https://egerlabs.ru/apps/griazemes/api/stats.php';
    const REFRESH_MS = 30000;
    const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    let liveTimer;
    let liveAlive = true;
    let liveSeriesData = [];
    let liveScale = 1;

    const formatTime = (timestamp) =>
      timestamp ? timeFormatter.format(new Date(Number(timestamp) * 1000)) : '—';

    const formatAverage = (value) =>
      value < 10 ? value.toFixed(1).replace('.', ',') : String(Math.round(value));

    const setActiveBar = (index) => {
      liveSeries.querySelectorAll('.live-chart__bar').forEach((bar) => {
        bar.classList.toggle('is-active', Number(bar.dataset.index) === index);
      });
    };

    const hideTooltip = () => {
      liveTooltip.hidden = true;
      setActiveBar(-1);
    };

    const showTooltip = (event) => {
      if (!liveSeriesData.length) return;
      const rect = liveSvg.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = Math.max(0, Math.min(0.9999, (event.clientX - rect.left) / rect.width));
      const index = Math.floor(ratio * liveSeriesData.length);
      const point = liveSeriesData[index];
      if (!point) return;
      const value = Number(point.n) || 0;
      const y = 33 - (value / liveScale) * 29;
      liveTooltip.hidden = false;
      liveTooltip.textContent = `${formatTime(point.t)}–${formatTime(Number(point.t) + 1800)} · ${value} в грязи`;
      liveTooltip.style.left = `${Math.min(92, Math.max(8, ((index + 0.5) / liveSeriesData.length) * 100))}%`;
      liveTooltip.style.top = `${Math.min(92, Math.max(8, (y / 36) * 100))}%`;
      setActiveBar(index);
    };

    const renderLiveChart = (data) => {
      const series = Array.isArray(data.series) ? data.series : [];
      liveSeriesData = series;
      const values = series.map((point) => Number(point.n) || 0);
      const peak = values.reduce((max, value) => Math.max(max, value), 0);
      const total = values.reduce((sum, value) => sum + value, 0);
      const average = series.length ? total / series.length : 0;
      const active = values.filter((value) => value > 0).length;
      const peakIndex = peak > 0 ? values.indexOf(peak) : -1;
      liveScale = Math.max(1, peak);

      livePeak.textContent = peak > 0 ? `пик ${peak} за 30 мин` : 'пока тихо';
      liveYPeak.textContent = peak > 0 ? String(peak) : '—';
      liveAvg.textContent = formatAverage(average);
      liveActive.textContent = `${active} / ${series.length}`;
      liveUpdated.textContent = formatTime(data.updatedAt || series[series.length - 1]?.t);

      if (series.length) {
        const labels = [...liveAxis.children];
        const positions = [0, 0.25, 0.5, 0.75, 1];
        labels.forEach((label, index) => {
          const pointIndex = Math.round((series.length - 1) * positions[index]);
          label.textContent = formatTime(series[pointIndex].t);
        });
      }

      hideTooltip();
      liveSvg.setAttribute(
        'aria-label',
        `Онлайн за 24 часа. Пик ${peak}, среднее ${formatAverage(average)}, активных получасовых окон ${active}.`,
      );

      if (!series.length) {
        liveSeries.innerHTML = '';
        return;
      }

      const slot = 100 / series.length;
      const barWidth = Math.max(0.42, slot * 0.58);
      const points = values.map((value, index) => {
        const x = slot * (index + 0.5);
        const y = 33 - (value / liveScale) * 29;
        return [x, y];
      });
      const line = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
      const last = points[points.length - 1];
      const bars = points
        .map(([x, y], index) => {
          const height = 33 - y;
          if (height <= 0) return '';
          return (
            `<rect class="live-chart__bar${index === peakIndex ? ' is-peak' : ''}" data-index="${index}" ` +
            `x="${(x - barWidth / 2).toFixed(2)}" y="${y.toFixed(2)}" ` +
            `width="${barWidth.toFixed(2)}" height="${height.toFixed(2)}" rx="0.25"/>`
          );
        })
        .join('');
      const peakMarker =
        peakIndex >= 0
          ? `<line class="live-chart__peak-line" x1="${points[peakIndex][0].toFixed(2)}" y1="${points[peakIndex][1].toFixed(2)}" x2="${points[peakIndex][0].toFixed(2)}" y2="33"/>` +
            `<circle class="live-chart__peak-dot" cx="${points[peakIndex][0].toFixed(2)}" cy="${points[peakIndex][1].toFixed(2)}" r="1.1"/>`
          : '';
      const hits = points
        .map(
          ([x], index) =>
            `<rect class="live-chart__hit" x="${(x - slot / 2).toFixed(2)}" y="0" width="${slot.toFixed(2)}" height="36"/>`,
        )
        .join('');

      liveSeries.innerHTML =
        `<polygon points="0,36 ${line} 100,36" fill="url(#live-fill)"/>` +
        bars +
        `<polyline class="live-chart__line" points="${line}"/>` +
        peakMarker +
        `<circle class="live-chart__current" cx="${last[0].toFixed(2)}" cy="${last[1].toFixed(2)}" r="1.5"/>` +
        hits;

      liveSvg.onpointermove = showTooltip;
      liveSvg.onpointerdown = showTooltip;
      liveSvg.onpointerleave = hideTooltip;
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
        liveUnit.textContent = 'в грязи';
        liveNote.textContent =
          'Считаем анонимно: без координат, имён и рекламы. Обновляется каждые 30 секунд.';
        renderLiveChart(data);
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