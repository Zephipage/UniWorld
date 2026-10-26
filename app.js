/* UniWorld project page. Static assets, no framework or network dependencies. */
(() => {
  'use strict';
  const media = window.UNIWORLD_MEDIA;
  if (!media) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const categoryNames = {city: 'City scenes', landscapes: 'Landscapes & interiors', fantasy: 'Imagined worlds', life: 'Everyday life'};
  const sceneIds = Object.keys(media).filter(id => media[id].collection === 'gallery');
  const groups = new Map();
  let visibleScenes = [...sceneIds];
  let selectedScene = sceneIds[0];
  let currentPreview = null;

  const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const time = (seconds) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, '0')}`;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

  function register(video, group) {
    groups.set(video, group);
    video.addEventListener('play', () => {
      // A hover preview may queue a play event just before the click pauses it.
      if (video.paused) return;
      for (const [other, otherGroup] of groups) {
        if (other !== video && group !== otherGroup && !other.paused) other.pause();
      }
    });
  }

  $$('video[data-media]').forEach(video => {
    const item = media[video.dataset.media];
    if (item) {
      video.src = item.src;
      if (!video.poster) video.poster = item.poster;
    }
    register(video, video.closest('#depth-comparison') ? 'depth' : video.closest('#engine-grid') ? 'engine' : video.dataset.media);
  });

  // Mobile navigation and section highlighting.
  const header = $('#site-header');
  const menuToggle = $('#menu-toggle');
  const navigation = $('#navigation');
  function closeMenu() {
    navigation.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
  }
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    navigation.classList.toggle('is-open', open);
  });
  $$('a', navigation).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', e => { if (!header.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  const navLinks = $$('a', navigation);
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        const active = link.hash === '#' + entry.target.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin: '-20% 0px -65% 0px', threshold: 0});
  navLinks.forEach(link => { const section = $(link.hash); if (section) sectionObserver.observe(section); });
  let ticking = false;
  function headerTheme() {
    header.classList.toggle('is-dark', window.scrollY < $('.hero').offsetHeight - 72);
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(headerTheme); } }, {passive: true});
  headerTheme();

  // Cover mosaic. Only three short, low-resolution clips animate, and only on screen.
  const mosaicRows = [
    ['winter', 'forest', 'city', 'saloon', 'river'],
    ['saloon', 'heaven', 'oldtown', 'winter', 'bamboo'],
    ['forest', 'winter', 'meadow', 'city', 'saloon'],
  ];
  const heroClips = ['forest', 'heaven', 'city'];
  const mosaic = $('#hero-mosaic');
  mosaicRows.forEach((ids, rowIndex) => {
    const row = document.createElement('div');
    row.className = 'mosaic-row';
    [...ids, ...ids].forEach((id, i) => {
      const tile = document.createElement('div');
      tile.className = 'mosaic-tile';
      const img = new Image();
      img.src = media[id].poster;
      img.alt = '';
      img.decoding = 'async';
      tile.append(img);
      if (i < ids.length && id === heroClips[rowIndex]) {
        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'none';
        video.dataset.src = `assets/media/hero-${id}.mp4`;
        video.setAttribute('tabindex', '-1');
        video.addEventListener('playing', () => video.classList.add('is-playing'));
        tile.append(video);
      }
      row.append(tile);
    });
    mosaic.append(row);
  });
  let heroOnscreen = true;
  let motionPaused = reducedMotion.matches || Boolean(navigator.connection?.saveData);
  const motionToggle = $('#motion-toggle');
  function updateHeroMotion() {
    const shouldPlay = heroOnscreen && !motionPaused && !document.hidden;
    $('.hero').classList.toggle('motion-paused', !shouldPlay);
    motionToggle.setAttribute('aria-pressed', String(motionPaused));
    motionToggle.setAttribute('aria-label', motionPaused ? 'Play background motion' : 'Pause background motion');
    motionToggle.innerHTML = icon(motionPaused ? 'play' : 'pause');
    $$('video', mosaic).forEach(video => {
      if (shouldPlay) {
        if (!video.hasAttribute('src')) video.src = video.dataset.src;
        video.play().catch(() => {});
      } else video.pause();
    });
  }
  motionToggle.addEventListener('click', () => { motionPaused = !motionPaused; updateHeroMotion(); });
  reducedMotion.addEventListener('change', () => { motionPaused = reducedMotion.matches; updateHeroMotion(); });
  new IntersectionObserver(entries => {
    heroOnscreen = entries[0].isIntersecting;
    updateHeroMotion();
  }, {threshold: 0.05}).observe($('.hero'));

  // Filterable gallery; no video is requested until a hover or selection.
  const gallery = $('#gallery-grid');
  sceneIds.forEach(id => {
    const item = media[id];
    const card = document.createElement('article');
    card.className = 'demo-card';
    card.dataset.category = item.category;
    card.dataset.scene = id;
    card.innerHTML = `<button class="demo-button" aria-label="Watch ${escapeHTML(item.title)}, ${Math.round(item.duration)} second generated video">
      <div class="demo-thumbnail"><img src="${escapeHTML(item.poster)}" alt="${escapeHTML(item.title)} — video still" loading="lazy" width="960" height="544"><video muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video><div class="demo-play"><span>${icon('play')}</span></div><span class="demo-duration">${time(item.duration)}</span></div>
      <div class="demo-card-info"><div><span class="tiny-label">${escapeHTML(categoryNames[item.category])}</span>${icon('arrow')}</div><h3>${escapeHTML(item.title)}</h3></div></button>`;
    const button = $('button', card);
    const video = $('video', card);
    video.muted = true;
    register(video, 'preview');
    video.addEventListener('playing', () => video.classList.add('is-playing'));
    const stopPreview = () => {
      video.pause();
      video.classList.remove('is-playing');
      if (currentPreview === video) currentPreview = null;
    };
    button.addEventListener('pointerenter', () => {
      if (!canHover.matches || reducedMotion.matches || navigator.connection?.saveData) return;
      if ([...groups].some(([v, g]) => g !== 'preview' && !v.paused)) return;
      if (currentPreview && currentPreview !== video) {
        currentPreview.pause();
        currentPreview.classList.remove('is-playing');
      }
      if (!video.hasAttribute('src')) video.src = item.src;
      currentPreview = video;
      video.play().catch(stopPreview);
    });
    button.addEventListener('pointerleave', stopPreview);
    button.addEventListener('click', () => { stopPreview(); openDemo(id); });
    gallery.append(card);
  });
  $$('.filter').forEach(button => {
    const count = sceneIds.filter(id => button.dataset.filter === 'all' || media[id].category === button.dataset.filter).length;
    $('span', button).textContent = count;
  });
  $('#gallery-count').textContent = `${sceneIds.length} scenes`;
  $$('.filter').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    $$('.filter').forEach(b => {
      const active = b === button;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    $$('.demo-card').forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
      if (card.hidden) {
        const video = $('video', card);
        video.pause();
        video.classList.remove('is-playing');
      }
    });
    visibleScenes = sceneIds.filter(id => filter === 'all' || media[id].category === filter);
    $('#gallery-count').textContent = `${visibleScenes.length} scenes`;
  }));

  // Accessible native dialog, full clips, downloads, and filtered previous/next.
  const dialog = $('#demo-dialog');
  const dialogVideo = $('#dialog-video');
  let returnFocus = null;
  register(dialogVideo, 'dialog');
  function openDemo(id) {
    const item = media[id];
    selectedScene = id;
    $('#dialog-title').textContent = item.title;
    $('#dialog-category').textContent = categoryNames[item.category];
    $('#dialog-metadata').textContent = `${item.width} × ${item.height} · ${time(item.duration)}`;
    $('#dialog-download').href = item.src;
    $('#dialog-download').download = `UniWorld-${id}.mp4`;
    dialogVideo.poster = item.poster;
    dialogVideo.src = item.src;
    if (!dialog.open) {
      returnFocus = document.activeElement;
      dialog.showModal();
      document.body.classList.add('dialog-open');
    }
    dialogVideo.play().catch(() => {});
  }
  function changeDemo(direction) {
    const index = visibleScenes.indexOf(selectedScene);
    openDemo(visibleScenes[(index + direction + visibleScenes.length) % visibleScenes.length]);
  }
  $('#dialog-close').addEventListener('click', () => dialog.close());
  $('#dialog-prev').addEventListener('click', () => changeDemo(-1));
  $('#dialog-next').addEventListener('click', () => changeDemo(1));
  dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialogVideo.pause();
    dialogVideo.removeAttribute('src');
    dialogVideo.load();
    document.body.classList.remove('dialog-open');
    returnFocus?.focus({preventScroll: true});
  });
  dialog.addEventListener('keydown', e => {
    if (e.target === dialogVideo || e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); changeDemo(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); changeDemo(-1); }
  });

  // Synchronized players: the first video is the clock; drift is corrected.
  function synchronizedPlayer(videos, playButton, resetButton, onTime) {
    const master = videos[0];
    let requestedPlaying = false;
    let rafId = null;
    let playRequest = 0;
    function label(playing) {
      const text = playButton.id === 'engine-play' ? (playing ? 'Pause together' : 'Play together') : (playing ? 'Pause comparison' : 'Play comparison');
      playButton.innerHTML = icon(playing ? 'pause' : 'play') + `<span>${text}</span>`;
      playButton.setAttribute('aria-label', text);
      playButton.setAttribute('aria-pressed', String(playing));
    }
    function seek(seconds) {
      videos.forEach(video => {
        const assign = () => { video.currentTime = Math.max(0, Math.min(seconds, Number.isFinite(video.duration) ? video.duration - 0.001 : seconds)); };
        if (video.readyState >= 1) assign();
        else { video.addEventListener('loadedmetadata', assign, {once:true}); video.load(); }
      });
      onTime(seconds);
    }
    function tick() {
      if (!requestedPlaying) return;
      onTime(master.currentTime);
      videos.slice(1).forEach(video => {
        if (video.readyState >= 2 && Math.abs(video.currentTime - master.currentTime) > 0.12) video.currentTime = master.currentTime;
      });
      rafId = requestAnimationFrame(tick);
    }
    function pause() {
      requestedPlaying = false;
      playRequest++;
      videos.forEach(video => video.pause());
      label(false);
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    }
    async function play() {
      if (master.ended || master.currentTime >= (master.duration || Infinity) - 0.05) seek(0);
      requestedPlaying = true;
      const request = ++playRequest;
      label(true);
      const results = await Promise.allSettled(videos.map(video => video.play()));
      if (request !== playRequest) return;
      if (results.some(result => result.status === 'rejected')) { pause(); return; }
      if (rafId !== null) cancelAnimationFrame(rafId);
      tick();
    }
    playButton.addEventListener('click', () => { if (requestedPlaying) pause(); else play(); });
    resetButton.addEventListener('click', () => { pause(); seek(0); });
    master.addEventListener('pause', () => { if (master.paused && requestedPlaying && !master.ended) pause(); });
    master.addEventListener('ended', () => { onTime(master.duration); pause(); });
    master.addEventListener('timeupdate', () => onTime(master.currentTime));
    label(false);
    return {play, pause, seek};
  }
  const compareVideos = $$('video', $('#depth-comparison'));
  synchronizedPlayer(compareVideos, $('#comparison-play'), $('#comparison-reset'), seconds => {
    $('#comparison-time').textContent = `${time(seconds)} / 0:14`;
  });
  const range = $('#comparison-range');
  range.addEventListener('input', () => {
    $('.comparison-stage').style.setProperty('--split', range.value + '%');
    range.setAttribute('aria-valuetext', `${range.value}% depth control, ${100 - range.value}% generated video`);
  });
  range.dispatchEvent(new Event('input'));
  const engine = synchronizedPlayer($$('video', $('#engine-grid')), $('#engine-play'), $('#engine-reset'), seconds => {
    $('#engine-time').textContent = `${time(seconds)} / 0:30`;
    $('#engine-seek').value = seconds;
    $('#engine-phase').textContent = seconds >= 14.875 ? 'Branch control is active' : 'Shared first-window history';
  });
  $('#engine-seek').addEventListener('input', e => engine.seek(Number(e.target.value)));
  $('#engine-jump').addEventListener('click', () => { engine.seek(14.875); engine.play(); });

  // Results tabs: keyboard controls follow the WAI-ARIA tabs pattern.
  const tabs = $$('[role="tab"]');
  function activateTab(tab) {
    tabs.forEach(button => {
      const active = button === tab;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      $('#' + button.getAttribute('aria-controls')).hidden = !active;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); activateTab(next); next.focus(); }
    });
  });

  $('#copy-citation').addEventListener('click', async () => {
    const value = $('#bibtex').textContent;
    let copied = false;
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
    } catch (_) {
      const input = document.createElement('textarea');
      input.value = value;
      input.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.append(input);
      input.select();
      copied = document.execCommand('copy');
      input.remove();
      $('#copy-citation').focus({preventScroll:true});
    }
    $('#copy-citation span').textContent = copied ? 'Copied' : 'Select text';
    $('#copy-status').textContent = copied ? 'BibTeX copied to clipboard.' : 'Select and copy the BibTeX text below.';
    if (!copied) {
      const selection = window.getSelection();
      const selectedRange = document.createRange();
      selectedRange.selectNodeContents($('#bibtex'));
      selection.removeAllRanges();
      selection.addRange(selectedRange);
    }
    setTimeout(() => { $('#copy-citation span').textContent = 'Copy'; }, 2400);
  });

  document.addEventListener('visibilitychange', () => {
    updateHeroMotion();
    if (document.hidden) {
      for (const video of groups.keys()) video.pause();
    }
  });
})();
