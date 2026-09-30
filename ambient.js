(() => {
  'use strict';
  if (document.getElementById('yac-settings-button')) return;
  // Dispose the previous revision when previewing an update in this document.
  document.dispatchEvent(new Event('yac-dispose'));
  document.getElementById('yac-controls')?.remove();
  document.getElementById('yac-background')?.remove();
  const extension = typeof browser !== 'undefined' ? browser : globalThis.chrome;
  const settings = { enabled: true, radial: true, avoidBars: true, fillBars: true, strength: 65, blur: 90, saturation: 145, inset: 0, fps: 30 };
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
  panel.style.setProperty('background-color', '#131315', 'important');
  // Direct DOM construction also works on pages requiring TrustedHTML.
  const root = panel.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = [
    ':host{position:fixed;right:20px;top:76px;z-index:2200;width:300px;max-width:calc(100vw - 32px);max-height:calc(100vh - 96px);overflow:auto;color:#fafafa;font:13px/1.5 system-ui,sans-serif;text-align:left;background:#131315!important;border:1px solid #ffffff24!important;border-radius:16px!important;box-shadow:0 12px 48px #000a!important}',
    ':host([hidden]){display:none!important}*{box-sizing:border-box}.body{padding:14px 16px;background:#131315;border-radius:15px}',
    'header{display:flex;align-items:center;justify-content:space-between}h2{margin:0;font-size:14px;font-weight:600}',
    'button{width:28px;height:28px;padding:0;color:#fff;background:transparent;border:0;border-radius:6px;font-size:22px;cursor:pointer}button:hover{background:#ffffff20}',
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
  const fields = {}, outputs = {};
  for (const [key, title] of [['enabled', 'アンビエント背景'], ['radial', '放射状モード'], ['avoidBars', '黒帯を自動で除外'], ['fillBars', '黒帯を背景に置き換える']]) {
    const label = document.createElement('label');
    label.className = 'toggle';
    fields[key] = document.createElement('input');
    fields[key].type = 'checkbox';
    fields[key].setAttribute('role', 'switch');
    label.append(document.createTextNode(title), fields[key]);
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
    label.append(document.createTextNode(title), outputs[key], fields[key]);
    body.append(label);
  }
  const status = document.createElement('p');
  body.append(status);
  function setStatus(text) { if (status.textContent !== text) status.textContent = text; }
  function setOpen(value, returnFocus = false) {
    open = Boolean(value && player && location.pathname === '/watch');
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    positionPanel();
    if (open) {
      player.querySelector('.ytp-settings-button[aria-expanded="true"]')?.click();
      fields.enabled.focus();
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
      settings[key] = ['enabled', 'radial', 'avoidBars', 'fillBars'].includes(key) ? fields[key].checked : Number(fields[key].value);
      if (key === 'enabled' && !settings.enabled) setOpen(false);
      apply();
      draw();
    });
    listen(fields[key], 'change', () => extension.storage.local.set({ ambient: settings }).catch(console.warn));
  }
  function positionPanel() {
    const sidebar = document.querySelector('ytd-watch-flexy #secondary');
    const bounds = sidebar?.getBoundingClientRect();
    const sidebarVisible = !document.fullscreenElement && bounds && bounds.width >= 240 && bounds.left > innerWidth / 2 && bounds.left < innerWidth;
    const width = sidebarVisible ? Math.min(320, bounds.width - 16) : Math.min(300, innerWidth - 32);
    const headerBottom = document.querySelector('ytd-masthead')?.getBoundingClientRect().bottom || 56;
    const top = document.fullscreenElement ? 16 : Math.max(16, headerBottom + 12, sidebarVisible ? Math.min(bounds.top + 8, 100) : 76);
    panel.style.width = width + 'px';
    panel.style.left = Math.max(16, sidebarVisible ? Math.min(bounds.right - width - 8, innerWidth - width - 16) : innerWidth - width - 20) + 'px';
    panel.style.right = 'auto';
    panel.style.top = top + 'px';
    panel.style.bottom = 'auto';
    panel.style.maxHeight = Math.max(120, innerHeight - top - 20) + 'px';
  }
  function discover() {
    const app = document.querySelector('ytd-app');
    if (app && canvas.parentElement !== app) app.prepend(canvas);
    const next = document.querySelector('#movie_player');
    if (player !== next) {
      player?.classList.remove('yac-settings-open');
      restoreBars();
      player = next;
    }
    const nextVideo = player?.querySelector('video.html5-main-video') || null;
    if (video !== nextVideo) restoreBars();
    video = nextVideo;
    const gear = player?.querySelector('.ytp-right-controls .ytp-settings-button');
    const toolbar = gear?.parentElement || player?.querySelector('.ytp-right-controls');
    if (toolbar && button.parentElement !== toolbar) toolbar.insertBefore(button, gear || toolbar.firstChild);
    const panelParent = document.fullscreenElement || document.body;
    if (panel.parentElement !== panelParent) panelParent.append(panel);
    if (player && barLayer.parentElement !== player) player.prepend(barLayer);
    button.hidden = location.pathname !== '/watch';
    if (button.hidden || !toolbar || !player) setOpen(false);
    positionPanel();
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
      document.documentElement.classList.remove('yac-active');
      setStatus(!settings.enabled ? 'アンビエント背景はオフです。' :
        document.fullscreenElement ? '全画面ではページ背景を停止します。' : '動画を待っています。');
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
      document.documentElement.classList.add('yac-active');
      setStatus(settings.avoidBars && !result.readable ? '黒帯を自動検出できません。「縁の内側」で調整できます。' :
        result.cropped ? '黒帯の内側から色を拾っています。' :
        settings.radial ? '動画が隠れると背景全体へゆっくり切り替わります。' : '動画全体の色を背景に広げます。');
    } catch (error) {
      restoreBars();
      document.documentElement.classList.remove('yac-active');
      setStatus('この動画では背景を描画できません。');
    }
  }
  listen(document, 'yt-navigate-finish', () => { discover(); lastTime = -1; draw(); });
  listen(document, 'visibilitychange', () => { lastTime = -1; draw(); });
  listen(document, 'fullscreenchange', () => { discover(); lastTime = -1; draw(); });
  listen(window, 'resize', () => { positionPanel(); draw(); });
  listen(window, 'scroll', positionPanel, { passive: true });
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
    for (const remove of removers) remove();
    player?.classList.remove('yac-settings-open');
    restoreBars();
    document.documentElement.classList.remove('yac-active');
    button.remove(); panel.remove(); canvas.remove(); barLayer.remove();
  }, { once: true });
  apply(); discover(); draw();
  frameRequest = requestAnimationFrame(animate);
  extension.storage.local.get('ambient').then(({ ambient: saved }) => {
    if (disposed) return;
    if (saved) {
      for (const key of ['enabled', 'radial', 'avoidBars', 'fillBars']) if (typeof saved[key] === 'boolean') settings[key] = saved[key];
      for (const [key, min, max] of [['strength', 15, 100], ['blur', 0, 160], ['saturation', 0, 250], ['inset', 0, 40], ['fps', 24, 60]]) {
        if (Number.isFinite(saved[key])) settings[key] = Math.min(max, Math.max(min, saved[key]));
      }
      settings.fps = Math.round(settings.fps);
    }
    apply(); draw();
  }).catch(console.warn);
})();
