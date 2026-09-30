(() => {
  'use strict';
  if (document.getElementById('yac-settings-button')) return;
  // Dispose the previous revision when previewing an update in this document.
  document.dispatchEvent(new Event('yac-dispose'));
  document.getElementById('yac-controls')?.remove();
  document.getElementById('yac-background')?.remove();
  const extension = typeof browser !== 'undefined' ? browser : globalThis.chrome;
  const settings = { enabled: true, radial: true, avoidBars: true, fillBars: true, strength: 65, blur: 90, saturation: 145, inset: 0, fps: 30, language: 'ja' };
  const translations = {
    ja: {
      title: 'アンビエント設定', close: 'アンビエント設定を閉じる', language: '言語 / Language',
      enabled: 'アンビエント背景', radial: '放射状モード', avoidBars: '黒帯を自動で除外', fillBars: '黒帯を背景に置き換える',
      strength: '濃さ', blur: 'ぼかし', saturation: '彩度', inset: '縁の内側', fps: '背景のFPS',
      off: 'アンビエント背景はオフです。', fullscreen: '全画面ではページ背景を停止します。', waiting: '動画を待っています。',
      noBars: '黒帯を自動検出できません。「縁の内側」で調整できます。', cropped: '黒帯の内側から色を拾っています。',
      radialHint: '動画が隠れると背景全体へゆっくり切り替わります。', fullFrameHint: '動画全体の色を背景に広げます。', failed: 'この動画では背景を描画できません。'
    },
    en: {
      title: 'Ambient settings', close: 'Close ambient settings', language: '言語 / Language',
      enabled: 'Ambient background', radial: 'Radial mode', avoidBars: 'Detect and exclude black bars', fillBars: 'Replace black bars with ambient',
      strength: 'Strength', blur: 'Blur', saturation: 'Saturation', inset: 'Edge inset', fps: 'Background FPS',
      off: 'Ambient background is off.', fullscreen: 'The page background pauses in fullscreen.', waiting: 'Waiting for a video.',
      noBars: 'Black-bar detection is unavailable. Adjust Edge inset manually.', cropped: 'Sampling colors inside the black bars.',
      radialHint: 'Blends into a full-frame background as the video scrolls out of view.', fullFrameHint: 'Spreads the full video frame across the background.', failed: 'Unable to render a background for this video.'
    }
  };
  const canvas = document.createElement('canvas');
  canvas.id = 'yac-background';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new YacRenderer(canvas);
  const barCanvas = document.createElement('canvas');
  barCanvas.id = 'yac-bar-background';
  barCanvas.setAttribute('aria-hidden', 'true');
  const barLayer = document.createElement('div');
  barLayer.id = 'yac-bar-layer';
  barLayer.setAttribute('aria-hidden', 'true');
  barLayer.append(barCanvas);
  const barContext = barCanvas.getContext('2d', { alpha: false });
  let originalClip = null;
  let video = null, player = null, lastVideo = null, lastTime = -1, lastGeometry = '';
  let open = false;
  let blend = 0, lastBlendTime = performance.now();
  let frameRequest = 0, lastDrawFrame = 0, disposed = false;
  let chatDocument = null, chatFrame = null;
  const chatStyleId = 'yac-chat-style';
  // Theme extensions can give page surfaces more specific !important backgrounds.
  // Override only the surrounding surfaces while active, then restore their styles.
  const pageSurfaces = [
    'body', 'ytd-app', 'ytd-app > #content', '#page-manager', 'ytd-page-manager',
    'ytd-watch-flexy', 'ytd-watch-grid', 'ytd-masthead', 'ytd-masthead #background',
    ':is(ytd-watch-flexy,ytd-watch-grid) :is(#columns,#primary,#primary-inner,#secondary,#secondary-inner,#below,#panels,#full-bleed-container,#related,#comments,#description,#description-inner,ytd-comments,ytd-watch-metadata,ytd-playlist-panel-renderer,ytd-item-section-renderer,ytd-rich-grid-renderer,yt-chip-cloud-renderer)',
    ':is(ytd-watch-flexy,ytd-watch-grid) ytd-playlist-panel-renderer :is(#container,#header,#items)'
  ].join(',');
  const savedSurfaces = new Map();
  function restoreSurface(element, properties) {
    for (const [name, original] of properties) {
      // A theme may change while ambient is active; keep changes we did not make.
      if (element.style.getPropertyValue(name) !== original.applied || element.style.getPropertyPriority(name) !== 'important') continue;
      if (original.value) element.style.setProperty(name, original.value, original.priority);
      else element.style.removeProperty(name);
    }
    savedSurfaces.delete(element);
  }
  function syncPageSurfaces(active) {
    const surfaces = active ? new Set(document.querySelectorAll(pageSurfaces)) : new Set();
    for (const [element, properties] of savedSurfaces) {
      if (!surfaces.has(element)) restoreSurface(element, properties);
    }
    for (const element of surfaces) {
      const overrides = { 'background-color': 'transparent', 'background-image': 'none', 'box-shadow': 'none' };
      if (element.localName === 'ytd-app') {
        overrides['background-color'] = '#080b12';
        overrides.isolation = 'isolate';
      }
      const properties = savedSurfaces.get(element) || new Map();
      savedSurfaces.set(element, properties);
      for (const [name, value] of Object.entries(overrides)) {
        const current = element.style.getPropertyValue(name), priority = element.style.getPropertyPriority(name);
        const previous = properties.get(name);
        if (previous && current === previous.applied && priority === 'important') continue;
        element.style.setProperty(name, value, 'important');
        properties.set(name, { value: current, priority, applied: element.style.getPropertyValue(name) });
      }
    }
  }
  const chatCss = [
    'html.yac-chat-active{--yt-live-chat-background-color:transparent;--yt-live-chat-action-panel-background-color:transparent}',
    'html.yac-chat-active,html.yac-chat-active body,html.yac-chat-active yt-live-chat-app,html.yac-chat-active yt-live-chat-renderer,html.yac-chat-active yt-live-chat-header-renderer,html.yac-chat-active yt-live-chat-item-list-renderer,html.yac-chat-active yt-live-chat-ticker-renderer,html.yac-chat-active yt-live-chat-renderer #chat,html.yac-chat-active yt-live-chat-renderer #contents,html.yac-chat-active yt-live-chat-renderer #items,html.yac-chat-active yt-live-chat-renderer #item-scroller,html.yac-chat-active yt-live-chat-renderer #panel-pages{background-color:transparent!important;background-image:none!important}',
    'html.yac-chat-active yt-live-chat-viewer-engagement-message-renderer #card,html.yac-chat-active yt-live-chat-message-input-renderer,html.yac-chat-active yt-live-chat-message-input-renderer #input-container{background:transparent!important;box-shadow:none!important}',
    'html.yac-chat-active yt-live-chat-text-message-renderer{text-shadow:0 1px 3px #000b}'
  ].join('\n');
  const removers = [];
  function listen(target, type, callback, options) {
    target.addEventListener(type, callback, options);
    removers.push(() => target.removeEventListener(type, callback, options));
  }
  const button = document.createElement('button');
  button.id = 'yac-settings-button';
  button.className = 'ytp-button';
  button.type = 'button';
  for (const [key, value] of Object.entries({
    'aria-label': 'アンビエント設定', 'aria-haspopup': 'dialog',
    'aria-expanded': 'false', 'aria-controls': 'yac-controls'
  })) button.setAttribute(key, value);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({
    viewBox: '0 0 24 24', width: '24', height: '24', fill: 'none',
    stroke: 'currentColor', 'stroke-width': '1.6', 'aria-hidden': 'true'
  })) svg.setAttribute(key, value);
  for (const radius of ['7', '2.5']) {
    const circle = document.createElementNS(svg.namespaceURI, 'circle');
    for (const [key, value] of Object.entries({ cx: '12', cy: '12', r: radius })) circle.setAttribute(key, value);
    svg.append(circle);
  }
  const rays = document.createElementNS(svg.namespaceURI, 'path');
  rays.setAttribute('d', 'M12 1v2M12 21v2M1 12h2M21 12h2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4');
  svg.append(rays);
  button.append(svg);
  const tooltip = document.createElement('span');
  tooltip.className = 'yac-tooltip';
  tooltip.textContent = 'アンビエント設定';
  tooltip.setAttribute('aria-hidden', 'true');
  button.append(tooltip);

  const panel = document.createElement('div');
  panel.id = 'yac-controls';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'アンビエント設定');
  panel.style.setProperty('background-color', 'rgba(19, 19, 21, .86)', 'important');
  // Direct DOM construction also works on pages requiring TrustedHTML.
  const root = panel.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = [
    ':host{position:absolute;right:12px;bottom:60px;z-index:2200;box-sizing:border-box;width:300px;max-width:calc(100% - 24px);overflow:auto;overscroll-behavior:contain;color:#fafafa;font:13px/1.5 system-ui,sans-serif;text-align:left;background:rgba(19,19,21,.86)!important;backdrop-filter:blur(16px);border:1px solid #ffffff24!important;border-radius:12px!important;box-shadow:0 8px 32px #0008!important}',
    ':host([hidden]){display:none!important}*{box-sizing:border-box}.body{padding:14px 16px;background:transparent;border-radius:11px}',
    'header{display:flex;align-items:center;justify-content:space-between}h2{margin:0;font-size:14px;font-weight:600}',
    'button{width:28px;height:28px;padding:0;color:#fff;background:transparent;border:0;border-radius:6px;font-size:22px;cursor:pointer}button:hover{background:#ffffff20}',
    'select{max-width:140px;padding:5px 9px;border:1px solid #ffffff30;border-radius:6px;background:#26262b;color:white;font:inherit;cursor:pointer}',
    'label{display:block;margin-top:14px}.toggle{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    'input{accent-color:white}input[type=range]{appearance:none;display:block;width:100%;height:4px;margin:16px 0 12px;border-radius:3px;cursor:pointer;background:linear-gradient(to right,#f5f5f5 0%,#f5f5f5 var(--progress),#3c3c42 var(--progress),#3c3c42 100%)}',
    'input[type=range]::-webkit-slider-runnable-track{height:4px;background:transparent;border-radius:3px}input[type=range]::-webkit-slider-thumb{appearance:none;width:14px;height:14px;margin-top:-5px;border:1px solid #ddd;border-radius:50%;background:white;box-shadow:0 1px 5px #0008}',
    'input[type=range]::-moz-range-track{height:4px;background:#3c3c42;border-radius:3px}input[type=range]::-moz-range-progress{height:4px;background:white;border-radius:3px}input[type=range]::-moz-range-thumb{width:12px;height:12px;border:1px solid #ddd;border-radius:50%;background:white;box-shadow:0 1px 5px #0008}',
    'input[type=checkbox]{appearance:none;position:relative;margin:0;flex:0 0 34px;width:34px;height:20px;border-radius:12px;background:#444449;cursor:pointer}',
    'input[type=checkbox]::before{content:"";position:absolute;left:3px;top:3px;width:14px;height:14px;border-radius:50%;background:#ddd;transition:transform .12s}',
    'input[type=checkbox]:checked{background:#f5f5f5}input[type=checkbox]:checked::before{transform:translateX(14px);background:#171719}',
    'output{float:right;color:#eee;font-variant-numeric:tabular-nums}p{margin:14px 0 0;padding-top:12px;border-top:1px solid #ffffff14;font-size:11px;color:#aaaab2}',
    ':focus-visible{outline:2px solid white;outline-offset:4px}'
  ].join('\n');
  root.append(style);
  const body = document.createElement('div');
  body.className = 'body';
  root.append(body);
  const header = document.createElement('header');
  const heading = document.createElement('h2');
  heading.textContent = 'アンビエント設定';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', 'アンビエント設定を閉じる');
  header.append(heading, close);
  body.append(header);
  const fields = {}, outputs = {}, fieldLabels = {};
  const languageLabel = document.createElement('label');
  languageLabel.className = 'toggle';
  fieldLabels.language = document.createTextNode(translations.ja.language);
  fields.language = document.createElement('select');
  fields.language.id = 'yac-language';
  fields.language.setAttribute('aria-label', translations.ja.language);
  for (const [value, name] of [['ja', '日本語'], ['en', 'English']]) {
    const option = document.createElement('option');
    option.value = value; option.textContent = name;
    fields.language.append(option);
  }
  languageLabel.append(fieldLabels.language, fields.language);
  body.append(languageLabel);
  for (const [key, title] of [['enabled', 'アンビエント背景'], ['radial', '放射状モード'], ['avoidBars', '黒帯を自動で除外'], ['fillBars', '黒帯を背景に置き換える']]) {
    const label = document.createElement('label');
    label.className = 'toggle';
    fields[key] = document.createElement('input');
    fields[key].type = 'checkbox';
    fields[key].setAttribute('role', 'switch');
    fieldLabels[key] = document.createTextNode(title);
    label.append(fieldLabels[key], fields[key]);
    body.append(label);
  }
  for (const [key, title, min, max] of [
    ['strength', '濃さ', 15, 100], ['blur', 'ぼかし', 0, 160], ['saturation', '彩度', 0, 250], ['inset', '縁の内側', 0, 40], ['fps', '背景のFPS', 24, 60]
  ]) {
    const label = document.createElement('label');
    label.htmlFor = 'yac-' + key;
    fields[key] = document.createElement('input');
    fields[key].id = 'yac-' + key;
    fields[key].type = 'range';
    fields[key].min = min;
    fields[key].max = max;
    fields[key].setAttribute('aria-label', title);
    outputs[key] = document.createElement('output');
    fieldLabels[key] = document.createTextNode(title);
    label.append(fieldLabels[key], outputs[key], fields[key]);
    body.append(label);
  }
  const status = document.createElement('p');
  body.append(status);
  let statusKey = 'waiting';
  function setStatus(key) {
    statusKey = key;
    const text = translations[settings.language][key];
    if (status.textContent !== text) status.textContent = text;
  }
  function localize() {
    const text = translations[settings.language];
    heading.textContent = tooltip.textContent = text.title;
    button.setAttribute('aria-label', text.title);
    panel.setAttribute('aria-label', text.title);
    panel.lang = settings.language;
    close.setAttribute('aria-label', text.close);
    fields.language.value = settings.language;
    for (const [key, label] of Object.entries(fieldLabels)) {
      label.textContent = text[key];
      fields[key].setAttribute('aria-label', text[key]);
    }
    setStatus(statusKey);
  }
  function setOpen(value, returnFocus = false) {
    open = Boolean(value && player && location.pathname === '/watch');
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    player?.classList.toggle('yac-settings-open', open);
    positionPanel();
    if (open) {
      player.querySelector('.ytp-settings-button[aria-expanded="true"]')?.click();
      fields.enabled.focus({ preventScroll: true });
    } else if (returnFocus && button.isConnected) button.focus();
  }
  listen(button, 'click', event => { event.stopPropagation(); setOpen(!open); });
  listen(button, 'keydown', event => {
    event.stopPropagation();
  });
  listen(close, 'click', () => setOpen(false, true));
  listen(panel, 'click', event => event.stopPropagation());
  listen(panel, 'dblclick', event => { event.preventDefault(); event.stopPropagation(); });
  listen(panel, 'keydown', event => {
    event.stopPropagation();
  });
  function updateAppearance() {
    const attenuation = 1 - .55 * blend;
    canvas.style.opacity = (settings.strength / 100 * attenuation).toFixed(4);
    barCanvas.style.opacity = canvas.style.opacity;
  }
  function apply() {
    localize();
    updateAppearance();
    canvas.style.filter = 'blur(' + settings.blur + 'px) saturate(' + settings.saturation / 100 + ')';
    barCanvas.style.filter = canvas.style.filter;
    button.classList.toggle('yac-enabled', settings.enabled);
    for (const key of ['enabled', 'radial', 'avoidBars', 'fillBars']) {
      fields[key].checked = settings[key];
      fields[key].setAttribute('aria-checked', String(settings[key]));
    }
    for (const key of ['strength', 'blur', 'saturation', 'inset', 'fps']) {
      fields[key].value = settings[key];
      fields[key].style.setProperty('--progress', (settings[key] - Number(fields[key].min)) / (Number(fields[key].max) - Number(fields[key].min)) * 100 + '%');
      outputs[key].textContent = settings[key] + (key === 'blur' ? 'px' : key === 'fps' ? ' FPS' : '%');
    }
    lastTime = -1;
    lastDrawFrame = 0;
  }
  for (const key of Object.keys(fields)) {
    listen(fields[key], 'input', () => {
      settings[key] = key === 'language' ? fields[key].value :
        ['enabled', 'radial', 'avoidBars', 'fillBars'].includes(key) ? fields[key].checked : Number(fields[key].value);
      if (key === 'enabled' && !settings.enabled) setOpen(false);
      apply();
      draw();
    });
    listen(fields[key], 'change', () => extension.storage.local.set({ ambient: settings }).catch(console.warn));
  }
  function positionPanel() {
    if (!player) return;
    const controls = player.querySelector('.ytp-chrome-bottom');
    const bottom = controls ? Math.max(48, player.clientHeight - controls.offsetTop + 8) : 60;
    panel.style.width = Math.min(320, Math.max(1, player.clientWidth - 24)) + 'px';
    panel.style.bottom = bottom + 'px';
    panel.style.maxHeight = Math.max(1, player.clientHeight - bottom - 8) + 'px';
  }
  const panelResizeObserver = new ResizeObserver(positionPanel);
  function clearChat() {
    chatDocument?.documentElement?.classList.remove('yac-chat-active');
    chatDocument?.getElementById(chatStyleId)?.remove();
    chatDocument = null;
  }
  function syncChat() {
    const frame = document.querySelector('ytd-live-chat-frame #chatframe');
    if (chatFrame !== frame) {
      chatFrame?.removeEventListener('load', syncChat);
      chatFrame = frame;
      chatFrame?.addEventListener('load', syncChat);
    }
    // YouTube's embedded chat is same-origin. Leave unrelated frames untouched.
    let nextDocument = null;
    try {
      const candidate = frame?.contentDocument;
      if (candidate && /^\/live_chat(?:_replay)?$/.test(candidate.location.pathname)) nextDocument = candidate;
    } catch { /* A cross-origin frame cannot be styled by this content script. */ }
    if (chatDocument !== nextDocument) { clearChat(); chatDocument = nextDocument; }
    if (!chatDocument?.head) return;
    if (!chatDocument.getElementById(chatStyleId)) {
      const chatStyle = chatDocument.createElement('style');
      chatStyle.id = chatStyleId;
      chatStyle.textContent = chatCss;
      chatDocument.head.append(chatStyle);
    }
    chatDocument.documentElement.classList.toggle('yac-chat-active', document.documentElement.classList.contains('yac-active'));
  }
  function setAmbientActive(active) {
    const changed = document.documentElement.classList.contains('yac-active') !== active;
    document.documentElement.classList.toggle('yac-active', active);
    chatDocument?.documentElement?.classList.toggle('yac-chat-active', active);
    if (changed) syncPageSurfaces(active);
  }
  function discover() {
    const app = document.querySelector('ytd-app');
    if (app && canvas.parentElement !== app) app.prepend(canvas);
    const next = document.querySelector('#movie_player');
    if (player !== next) {
      player?.classList.remove('yac-settings-open');
      panelResizeObserver.disconnect();
      restoreBars();
      player = next;
      if (player) panelResizeObserver.observe(player);
    }
    const nextVideo = player?.querySelector('video.html5-main-video') || null;
    if (video !== nextVideo) restoreBars();
    video = nextVideo;
    const gear = player?.querySelector('.ytp-right-controls .ytp-settings-button');
    const toolbar = gear?.parentElement || player?.querySelector('.ytp-right-controls');
    if (toolbar && button.parentElement !== toolbar) toolbar.insertBefore(button, gear || toolbar.firstChild);
    if (player && panel.parentElement !== player) player.append(panel);
    if (player && barLayer.parentElement !== player) player.prepend(barLayer);
    button.hidden = location.pathname !== '/watch';
    if (button.hidden || !toolbar || !player) setOpen(false);
    positionPanel();
    syncChat();
    syncPageSurfaces(document.documentElement.classList.contains('yac-active'));
  }
  function restoreBars() {
    if (originalClip) {
      const { element, value, priority } = originalClip;
      if (value) element.style.setProperty('clip-path', value, priority);
      else element.style.removeProperty('clip-path');
      originalClip = null;
    }
    player?.classList.remove('yac-fill-bars');
  }
  function replaceBars(result, rectangle) {
    if (!settings.fillBars) { restoreBars(); return; }
    const bounds = video.getBoundingClientRect();
    const crop = result.videoCrop;
    const left = Math.max(0, rectangle.left - bounds.left + rectangle.width * crop.x / 160);
    const top = Math.max(0, rectangle.top - bounds.top + rectangle.height * crop.y / 90);
    const right = Math.max(0, bounds.right - rectangle.left - rectangle.width * (crop.x + crop.width) / 160);
    const bottom = Math.max(0, bounds.bottom - rectangle.top - rectangle.height * (crop.y + crop.height) / 90);
    if (Math.max(left, top, right, bottom) < 1) { restoreBars(); return; }
    if (!originalClip) originalClip = { element: video, value: video.style.getPropertyValue('clip-path'), priority: video.style.getPropertyPriority('clip-path') };
    video.style.setProperty('clip-path', 'inset(' + [top, right, bottom, left].map(v => v.toFixed(2) + 'px').join(' ') + ')', 'important');
    player.classList.add('yac-fill-bars');
    const p = player.getBoundingClientRect(), pad = renderer.padding;
    const width = 400, height = Math.max(80, Math.round(width * (p.height + pad * 2) / (p.width + pad * 2)));
    if (barCanvas.width !== width || barCanvas.height !== height) { barCanvas.width = width; barCanvas.height = height; }
    const sx = canvas.width / (innerWidth + pad * 2), sy = canvas.height / (innerHeight + pad * 2);
    barContext.drawImage(canvas, p.left * sx, p.top * sy, (p.width + pad * 2) * sx, (p.height + pad * 2) * sy, 0, 0, width, height);
  }
  function getRectangle() {
    const bounds = video.getBoundingClientRect();
    const rect = { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
    const fit = getComputedStyle(video).objectFit;
    if (fit === 'contain' && video.videoWidth && video.videoHeight) {
      const factor = Math.min(rect.width / video.videoWidth, rect.height / video.videoHeight);
      const width = video.videoWidth * factor, height = video.videoHeight * factor;
      rect.left += (rect.width - width) / 2; rect.top += (rect.height - height) / 2;
      rect.width = width; rect.height = height;
    }
    return rect;
  }
  function draw() {
    const ready = settings.enabled && location.pathname === '/watch' && !document.hidden &&
      !document.fullscreenElement && canvas.isConnected && video && video.readyState >= 2;
    if (!ready) {
      restoreBars();
      setAmbientActive(false);
      setStatus(!settings.enabled ? 'off' : document.fullscreenElement ? 'fullscreen' : 'waiting');
      return;
    }
    const rect = getRectangle();
    const headerBottom = Math.max(0, document.querySelector('ytd-masthead')?.getBoundingClientRect().bottom || 0);
    const targetBlend = YacRenderer.scrollBlend(rect, { top: headerBottom, height: innerHeight });
    const now = performance.now();
    blend += (targetBlend - blend) * (1 - Math.exp(-(now - lastBlendTime) / 140));
    if (Math.abs(targetBlend - blend) < .005) blend = targetBlend;
    lastBlendTime = now;
    updateAppearance();
    const geometry = [rect.left, rect.top, rect.width, rect.height, innerWidth, innerHeight, blend.toFixed(3)].join(',');
    if (video === lastVideo && video.currentTime === lastTime && geometry === lastGeometry &&
      (!settings.avoidBars || !renderer.readable || renderer.stableFrames >= 4)) return;
    try {
      const result = renderer.draw(video, rect, { width: innerWidth, height: innerHeight }, settings.radial, { ...settings, blend });
      canvas.dataset.blend = blend.toFixed(3);
      replaceBars(result, rect);
      lastVideo = video; lastTime = video.currentTime; lastGeometry = geometry;
      setAmbientActive(true);
      setStatus(settings.avoidBars && !result.readable ? 'noBars' :
        result.cropped ? 'cropped' : settings.radial ? 'radialHint' : 'fullFrameHint');
    } catch (error) {
      restoreBars();
      setAmbientActive(false);
      setStatus('failed');
    }
  }
  listen(document, 'yt-navigate-finish', () => { discover(); lastTime = -1; draw(); });
  listen(document, 'visibilitychange', () => { lastTime = -1; draw(); });
  listen(document, 'fullscreenchange', () => { discover(); lastTime = -1; draw(); });
  listen(window, 'resize', () => { positionPanel(); draw(); });
  const discoverTimer = setInterval(discover, 1000);
  function animate(now) {
    if (disposed) return;
    frameRequest = requestAnimationFrame(animate);
    const interval = 1000 / settings.fps;
    const elapsed = now - lastDrawFrame;
    // Keep fractional frame intervals without drifting at rates such as 24 FPS.
    if (elapsed + .5 >= interval) {
      const steps = Math.max(1, Math.floor((elapsed + .5) / interval));
      lastDrawFrame = now - Math.max(0, elapsed - steps * interval);
      draw();
    }
  }
  listen(document, 'yac-dispose', () => {
    disposed = true;
    clearInterval(discoverTimer); cancelAnimationFrame(frameRequest);
    panelResizeObserver.disconnect();
    chatFrame?.removeEventListener('load', syncChat);
    clearChat();
    for (const remove of removers) remove();
    player?.classList.remove('yac-settings-open');
    restoreBars();
    document.documentElement.classList.remove('yac-active');
    syncPageSurfaces(false);
    button.remove(); panel.remove(); canvas.remove(); barLayer.remove();
  }, { once: true });
  apply(); discover(); draw();
  frameRequest = requestAnimationFrame(animate);
  extension.storage.local.get('ambient').then(({ ambient: saved }) => {
    if (disposed) return;
    if (saved) {
      if (['ja', 'en'].includes(saved.language)) settings.language = saved.language;
      for (const key of ['enabled', 'radial', 'avoidBars', 'fillBars']) if (typeof saved[key] === 'boolean') settings[key] = saved[key];
      for (const [key, min, max] of [['strength', 15, 100], ['blur', 0, 160], ['saturation', 0, 250], ['inset', 0, 40], ['fps', 24, 60]]) {
        if (Number.isFinite(saved[key])) settings[key] = Math.min(max, Math.max(min, saved[key]));
      }
      settings.fps = Math.round(settings.fps);
    }
    apply(); draw();
  }).catch(console.warn);
})();
