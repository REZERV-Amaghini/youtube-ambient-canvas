(() => {
  'use strict';
  if (document.getElementById('yac-settings-button')) return;
  // Dispose the previous revision when previewing an update in this document.
  document.dispatchEvent(new Event('yac-dispose'));
  document.getElementById('yac-controls')?.remove();
  document.getElementById('yac-background')?.remove();
  const extension = typeof browser !== 'undefined' ? browser : globalThis.chrome;
  const settings = { enabled: true, radial: true, avoidBars: true, fillBars: true, flashWarning: true, strength: 65, blur: 90, saturation: 145, inset: 0, fps: 30, language: 'ja' };
  const booleanKeys = ['enabled', 'radial', 'avoidBars', 'fillBars', 'flashWarning'];
  const translations = {
    ja: {
      title: 'アンビエント設定', close: 'アンビエント設定を閉じる', language: '言語 / Language',
      enabled: 'アンビエント背景', radial: '放射状モード', avoidBars: '黒帯を自動で除外', fillBars: '黒帯を背景に置き換える',
      strength: '濃さ', blur: 'ぼかし', saturation: '彩度', inset: '採色範囲（内側）', fps: '背景のFPS',
      appearance: '見た目', advanced: '詳細設定',
      flashWarning: '高速点滅の警告', flashWarningDescription: '高速点滅が約3秒続くと警告します。背景オフ・全画面でも監視し、「二度と表示しない」の設定もここで戻せます。',
      flashTitle: '高速点滅を繰り返しているようです。',
      flashBody: '光の点滅は、光に敏感な方の体調に影響することがあります。必要に応じて、アンビエントの濃さを下げてください。',
      flashNote: '検出は完全ではありません。3秒未満の点滅や、濃さ15%でも安全を保証するものではありません。',
      flashNever: '二度と表示しない', flashReduce: '濃さを下げる（15%）', flashClose: '閉じる',
      saveFailure: 'このページには反映しましたが、「{setting}」を保存できませんでした。再試行してください。', saveRetry: '再試行',
      radialDescription: '映像の縁から色を広げ、スクロールすると背景全体へ切り替わります。',
      avoidBarsDescription: '黒帯を避けて、映像の色を拾います。', fillBarsDescription: '動画の表示サイズを保ち、黒帯の領域にも背景を表示します。',
      insetDescription: '値を上げると、映像の内側から色を拾います。', fpsDescription: '24〜60 FPS。高いほど滑らかになりますが、負荷も増えます。',
      off: 'アンビエント背景はオフです。', fullscreen: '全画面ではページ背景を停止します。', waiting: '動画を待っています。',
      noBars: '黒帯を自動検出できません。「採色範囲（内側）」で調整できます。', cropped: '黒帯の内側から色を拾っています。',
      radialHint: '動画が隠れると背景全体へゆっくり切り替わります。', fullFrameHint: '動画全体の色を背景に広げます。', failed: 'この動画では背景を描画できません。'
    },
    en: {
      title: 'Ambient settings', close: 'Close ambient settings', language: '言語 / Language',
      enabled: 'Ambient background', radial: 'Radial mode', avoidBars: 'Detect and exclude black bars', fillBars: 'Replace black bars with ambient',
      strength: 'Strength', blur: 'Blur', saturation: 'Saturation', inset: 'Sample inset', fps: 'Background FPS',
      appearance: 'Appearance', advanced: 'Advanced settings',
      flashWarning: 'Rapid-flash warning', flashWarningDescription: 'Warns after about 3 seconds of rapid flashing, including with ambient off or in fullscreen. You can turn this back on here.',
      flashTitle: 'Rapid flashing appears to be repeating.',
      flashBody: 'Flashing light can affect people who are sensitive to it. Consider reducing the ambient strength.',
      flashNote: 'Detection is incomplete. Flashes shorter than 3 seconds and 15% strength are not guaranteed to be safe.',
      flashNever: "Don't show again", flashReduce: 'Reduce strength to 15%', flashClose: 'Close',
      saveFailure: 'Applied on this page, but could not save “{setting}”. Please retry.', saveRetry: 'Retry',
      radialDescription: 'Extends the video edges, then blends into a full-frame background as you scroll.',
      avoidBarsDescription: 'Samples video colors instead of black bars.', fillBarsDescription: 'Shows ambient in the black-bar area without resizing the picture.',
      insetDescription: 'Higher values sample further inside the picture.', fpsDescription: '24–60 FPS. Higher values look smoother and use more resources.',
      off: 'Ambient background is off.', fullscreen: 'The page background pauses in fullscreen.', waiting: 'Waiting for a video.',
      noBars: 'Black-bar detection is unavailable. Adjust Sample inset manually.', cropped: 'Sampling colors inside the black bars.',
      radialHint: 'Blends into a full-frame background as the video scrolls out of view.', fullFrameHint: 'Spreads the full video frame across the background.', failed: 'Unable to render a background for this video.'
    }
  };
  const canvas = document.createElement('canvas');
  canvas.id = 'yac-background';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  let inputRevision = 0;
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
  let frameRequest = 0, lastDrawFrame = 0, disposed = false, paintDue = true, forcePaint = true;
  let geometryCheckDue = true;
  let frameVideo = null, videoFrameRequest = null, frameEpoch = 0, frameSerial = 0, submittedSerial = -1;
  let chatDocument = null, chatFrame = null;
  const flashMonitor = new YacFlashMonitor();
  let settingsLoaded = false, flashWarningOpen = false, warnedVideoKey = '', warningFocus = null;
  let saveError = null, warningPresentation = 0, reductionPresentation = null;
  let reducingWarning = false, retryingWarning = false, retryingPanel = false;
  const warningSaves = new Set();
  let lastSampleVideo = null, lastSampleTime = -1;
  const chatStyleId = 'yac-chat-style';
  // Theme extensions can give page surfaces more specific !important backgrounds.
  // Override only the surrounding surfaces while active, then restore their styles.
  const pageSurfaces = [
    'body', 'ytd-app', 'ytd-app > #content', '#page-manager', 'ytd-page-manager',
    'ytd-watch-flexy', 'ytd-watch-grid', 'ytd-masthead', 'ytd-masthead #background',
    ':is(ytd-watch-flexy,ytd-watch-grid) :is(#columns,#primary,#primary-inner,#secondary,#secondary-inner,#below,#panels,#full-bleed-container,#related,#comments,#description,#description-inner,ytd-comments,ytd-watch-metadata,ytd-playlist-panel-renderer,ytd-item-section-renderer,ytd-rich-grid-renderer,yt-chip-cloud-renderer)',
    ':is(ytd-watch-flexy,ytd-watch-grid) :is(.box.ytd-watch-flexy,.box.ytd-watch-grid,ytd-watch-next-secondary-results-renderer)',
    ':is(ytd-watch-flexy,ytd-watch-grid) :is(#below,#secondary,#panels) :is(div.ytd-watch-flexy,div.ytd-watch-grid,ytd-video-primary-info-renderer,ytd-video-secondary-info-renderer,ytd-ticket-shelf-renderer)',
    ':is(ytd-watch-flexy,ytd-watch-grid) :is(ytd-watch-metadata,ytd-video-primary-info-renderer,ytd-video-secondary-info-renderer) ytd-menu-renderer',
    ':is(ytd-watch-flexy,ytd-watch-grid) :is(ytd-engagement-panel-section-list-renderer,ytd-engagement-panel-title-header-renderer,ytd-transcript-renderer,ytd-transcript-search-panel-renderer,ytd-transcript-search-box-renderer,ytd-transcript-segment-list-renderer,ytd-transcript-body-renderer,.input-container.ytd-transcript-search-box-renderer)',
    ':is(ytd-watch-flexy,ytd-watch-grid) ytd-engagement-panel-section-list-renderer :is(#content,#header,#subheader,#panel-content)',
    ':is(ytd-watch-flexy,ytd-watch-grid)[theater] :is(#player,#player-full-bleed-container,#player-container,#player-container-outer,#player-container-inner,#ytd-player,.player-container-background)',
    ':is(ytd-watch-flexy,ytd-watch-grid)[theater] #movie_player:not(.ytp-fullscreen):not(.ytp-miniplayer-ui)',
    ':is(ytd-watch-flexy,ytd-watch-grid)[theater] #movie_player:not(.ytp-fullscreen):not(.ytp-miniplayer-ui) :is(.html5-video-container,video.html5-main-video)',
    ':is(ytd-watch-flexy,ytd-watch-grid) ytd-playlist-panel-renderer :is(#container,#items)'
  ].join(',');
  const savedSurfaces = new Map();
  let surfacesDirty = true, surfaceJob = null, nextSurfaceRefresh = 0;
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
        overrides['background-color'] = 'var(--yac-page-base)';
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
  function cancelSurfaceRefresh() {
    if (!surfaceJob) return;
    if (surfaceJob.idle) cancelIdleCallback(surfaceJob.id);
    else clearTimeout(surfaceJob.id);
    surfaceJob = null;
  }
  function refreshPageSurfaces(immediate = false) {
    const active = document.documentElement.classList.contains('yac-active');
    if (disposed || !active || document.hidden || !surfacesDirty) return;
    if (immediate) {
      cancelSurfaceRefresh();
      surfacesDirty = false;
      syncPageSurfaces(true);
      nextSurfaceRefresh = performance.now() + 1000;
      return;
    }
    if (surfaceJob) return;
    const delay = Math.max(0, nextSurfaceRefresh - performance.now());
    if (delay) {
      surfaceJob = { idle: false, id: setTimeout(() => {
        surfaceJob = null; refreshPageSurfaces();
      }, delay) };
      return;
    }
    const run = () => { surfaceJob = null; refreshPageSurfaces(true); };
    surfaceJob = typeof requestIdleCallback === 'function' && typeof cancelIdleCallback === 'function' ?
      { idle: true, id: requestIdleCallback(run, { timeout: 1000 }) } :
      { idle: false, id: setTimeout(run, 0) };
  }
  function markSurfacesDirty() { surfacesDirty = true; refreshPageSurfaces(); }
  const commentContent = 'ytd-comment-thread-renderer,ytd-comment-renderer,ytd-comment-view-model,ytd-comment-replies-renderer';
  const surfaceClasses = new Set(['box', 'ytd-watch-flexy', 'ytd-watch-grid', 'player-container-background',
    'input-container', 'ytd-transcript-search-box-renderer', 'ytp-fullscreen', 'ytp-miniplayer-ui',
    'html5-video-container', 'html5-main-video']);
  const ownElement = element => element?.nodeType === 1 && !!element.closest('[id^="yac-"]');
  function relevantSurfaceMutation(record) {
    const element = record.target;
    if (ownElement(element) || element.nodeType === 1 && element.closest(commentContent)) return false;
    if (record.type === 'attributes') {
      if (record.attributeName === 'style') {
        // Ignore our applied styles and unrelated clip-path/opacity changes.
        const properties = savedSurfaces.get(element);
        return properties && [...properties].some(([name, original]) =>
          element.style.getPropertyValue(name) !== original.applied || element.style.getPropertyPriority(name) !== 'important');
      }
      if (record.attributeName === 'theater') return element.matches('ytd-watch-flexy,ytd-watch-grid');
      if (record.attributeName === 'class') {
        const structuralClasses = value => (value || '').split(/\s+/).filter(name => surfaceClasses.has(name)).sort().join(' ');
        if (structuralClasses(record.oldValue) === structuralClasses(element.getAttribute('class'))) return false;
      }
      return savedSurfaces.has(element) || element.matches(pageSurfaces);
    }
    // Comment bodies/threads do not contain the structural page surfaces we guard.
    // Do not turn a batch of loaded comments into repeated whole-page scans.
    for (const node of record.addedNodes) {
      if (node.nodeType !== 1 || ownElement(node) || node.matches(commentContent)) continue;
      if (node.matches(pageSurfaces) || node.querySelector(pageSurfaces)) return true;
    }
    for (const node of record.removedNodes) {
      if (node.nodeType !== 1 || ownElement(node) || node.matches(commentContent)) continue;
      for (const surface of savedSurfaces.keys()) if (node.contains(surface)) return true;
    }
    return false;
  }
  const surfaceObserver = new MutationObserver(records => {
    if (disposed) return;
    const relevant = records.filter(relevantSurfaceMutation);
    if (!relevant.length) return;
    surfacesDirty = true;
    // Theater/fullscreen container changes must not expose an opaque surround
    // while waiting for the normal coalesced refresh.
    const modeChange = relevant.some(record => record.type === 'attributes' &&
      (record.attributeName === 'theater' || record.attributeName === 'class' && record.target.id === 'movie_player'));
    refreshPageSurfaces(modeChange);
  });
  surfaceObserver.observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeOldValue: true,
    attributeFilter: ['style', 'class', 'id', 'theater']
  });
  const chatCss = [
    `html.yac-chat-active{
      --yt-live-chat-background-color:transparent;--yt-live-chat-action-panel-background-color:transparent;
      --yac-reading-rgb:255,255,255;
      --yac-chat-surface:rgba(var(--yac-reading-rgb),var(--yac-reading-opacity));
      --yac-chat-header-surface:rgba(var(--yac-reading-rgb),var(--yac-control-opacity));
      background-color:var(--yac-chat-surface)!important;background-image:none!important;
    }
    html.yac-chat-active[dark]{--yac-reading-rgb:var(--yac-control-rgb)}`,
    'html.yac-chat-active body,html.yac-chat-active yt-live-chat-app,html.yac-chat-active yt-live-chat-renderer,html.yac-chat-active yt-live-chat-item-list-renderer,html.yac-chat-active yt-live-chat-ticker-renderer,html.yac-chat-active yt-live-chat-renderer #chat,html.yac-chat-active yt-live-chat-renderer #contents,html.yac-chat-active yt-live-chat-renderer #items,html.yac-chat-active yt-live-chat-renderer #item-scroller,html.yac-chat-active yt-live-chat-renderer #panel-pages{background-color:transparent!important;background-image:none!important}',
    'html.yac-chat-active yt-live-chat-message-input-renderer,html.yac-chat-active yt-live-chat-message-input-renderer #input-container{background:transparent!important;box-shadow:none!important}',
    'html.yac-chat-active yt-live-chat-text-message-renderer{text-shadow:0 1px 3px #fff9}',
    'html.yac-chat-active[dark] yt-live-chat-text-message-renderer{text-shadow:0 1px 3px #000b}',
    `html.yac-chat-active yt-live-chat-header-renderer{
      background-color:var(--yac-chat-header-surface)!important;background-image:none!important;
      -webkit-backdrop-filter:blur(var(--yac-control-blur))!important;backdrop-filter:blur(var(--yac-control-blur))!important;
    }
    html.yac-chat-active :is(ytd-menu-popup-renderer,ytd-engagement-panel-section-list-renderer){
      background-color:var(--yac-chat-surface)!important;background-image:none!important;
      -webkit-backdrop-filter:blur(var(--yac-control-blur))!important;backdrop-filter:blur(var(--yac-control-blur))!important;
    }
    html.yac-chat-active ytd-menu-popup-renderer :is(tp-yt-paper-listbox,paper-listbox),
    html.yac-chat-active ytd-engagement-panel-section-list-renderer :is(#content,#header,ytd-engagement-panel-title-header-renderer){
      background-color:transparent!important;background-image:none!important;
    }`
  ].join('\n');
  const removers = new Set();
  function listen(target, type, callback, options) {
    target.addEventListener(type, callback, options);
    const remove = () => { target.removeEventListener(type, callback, options); removers.delete(remove); };
    removers.add(remove);
    return remove;
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
  panel.style.setProperty('background-color', 'rgba(28, 28, 28, .9)', 'important');
  // Direct DOM construction also works on pages requiring TrustedHTML.
  const root = panel.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = [
    ':host{position:absolute;right:12px;bottom:60px;z-index:2200;display:flex;flex-direction:column;box-sizing:border-box;width:320px;max-width:calc(100% - 24px);overflow:hidden;color:#eee;font:14px/1.4 "YouTube Noto",Roboto,Arial,Helvetica,sans-serif;text-align:left;text-shadow:none;background:rgba(28,28,28,.9)!important;border:0!important;border-radius:12px!important;box-shadow:0 4px 20px #0003!important;color-scheme:dark}',
    ':host([hidden]){display:none!important}*{box-sizing:border-box}.body{padding:0 8px 8px;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin}',
    'header{display:flex;flex-shrink:0;align-items:center;justify-content:space-between;gap:8px;min-height:48px;padding:8px 12px;border-bottom:1px solid #ffffff14}h2{margin:0;font-size:14px;font-weight:500}',
    'button{width:32px;height:32px;padding:0;color:#eee;background:transparent;border:0;border-radius:8px;font-size:22px;cursor:pointer}button:hover{background:#ffffff1a}',
    'select{max-width:136px;padding:6px 8px;border:1px solid #ffffff24;border-radius:6px;background:#ffffff0f;color:#eee;font:inherit;cursor:pointer}option{background:#1c1c1c}',
    'label{display:block;margin:0;padding:8px}.toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;cursor:pointer;border-radius:8px}.toggle:hover,summary:hover{background:#ffffff1a}',
    '.copy{min-width:0}.hint{display:block;margin:4px 0 0;color:#bdbdbd;font-size:12px;line-height:1.4}.section-title{margin:8px 8px 0;color:#bdbdbd;font-size:12px;font-weight:500}.slider-label{padding:8px}.slider-heading{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    'details{margin-top:4px;border-top:1px solid #ffffff14}summary{display:flex;align-items:center;justify-content:space-between;min-height:44px;padding:8px;border-radius:8px;cursor:pointer;list-style:none}summary::-webkit-details-marker{display:none}summary::after{content:"›";font-size:22px;transform:rotate(90deg)}details[open]>summary::after{transform:rotate(-90deg)}.advanced-body{padding-bottom:4px}.language{margin-top:4px;border-top:1px solid #ffffff14;cursor:default}',
    'input{accent-color:white}input[type=range]{appearance:none;display:block;width:100%;height:24px;margin:4px 0 0;padding:0;cursor:pointer;background:transparent}',
    'input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:3px;background:linear-gradient(to right,#fff 0%,#fff var(--progress),#ffffff38 var(--progress),#ffffff38 100%)}input[type=range]::-webkit-slider-thumb{appearance:none;width:14px;height:14px;margin-top:-5px;border:0;border-radius:50%;background:white}',
    'input[type=range]::-moz-range-track{height:4px;background:#ffffff38;border-radius:3px}input[type=range]::-moz-range-progress{height:4px;background:white;border-radius:3px}input[type=range]::-moz-range-thumb{width:14px;height:14px;border:0;border-radius:50%;background:white}',
    'input[type=checkbox]{appearance:none;position:relative;margin:0;flex:0 0 34px;width:34px;height:20px;border-radius:12px;background:#444449;cursor:pointer}',
    'input[type=checkbox]::before{content:"";position:absolute;left:3px;top:3px;width:14px;height:14px;border-radius:50%;background:#ddd;transition:transform .12s}',
    'input[type=checkbox]:checked{background:#f5f5f5}input[type=checkbox]:checked::before{transform:translateX(14px);background:#171719}',
    'output{flex-shrink:0;color:#eee;font-variant-numeric:tabular-nums}p{margin:4px 8px 8px;padding-top:8px;border-top:1px solid #ffffff14;font-size:12px;color:#bdbdbd}',
    '.save-error{margin:8px;padding:12px;border:1px solid #ffffff38;border-radius:8px;font-size:12px;color:#eee}.save-error[hidden]{display:none}.save-error button{display:block;width:auto;height:auto;min-height:36px;margin-top:8px;padding:6px 12px;border:1px solid #ffffff38;font:inherit}.save-error button[aria-disabled=true]{opacity:.6;cursor:wait}',
    ':focus-visible{outline:2px solid white;outline-offset:1px}@media(prefers-reduced-motion:reduce){input[type=checkbox]::before{transition:none}}'
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
  root.append(header, body);
  const fields = {}, outputs = {}, fieldLabels = {}, descriptions = {};
  const appearance = document.createElement('section');
  const appearanceHeading = document.createElement('h3');
  appearanceHeading.className = 'section-title';
  appearanceHeading.id = 'yac-appearance-title';
  appearance.setAttribute('aria-labelledby', appearanceHeading.id);
  appearance.append(appearanceHeading);
  const advanced = document.createElement('details');
  const advancedHeading = document.createElement('summary');
  const advancedBody = document.createElement('div');
  advancedBody.className = 'advanced-body';
  advanced.append(advancedHeading, advancedBody);
  const languageLabel = document.createElement('label');
  languageLabel.className = 'toggle language';
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
  for (const [key, title] of [['enabled', 'アンビエント背景'], ['radial', '放射状モード'], ['avoidBars', '黒帯を自動で除外'], ['fillBars', '黒帯を背景に置き換える'], ['flashWarning', '高速点滅の警告']]) {
    const label = document.createElement('label');
    label.className = 'toggle';
    fields[key] = document.createElement('input');
    fields[key].type = 'checkbox';
    fields[key].setAttribute('role', 'switch');
    const copy = document.createElement('span');
    copy.className = 'copy';
    fieldLabels[key] = document.createTextNode(title);
    copy.append(fieldLabels[key]);
    if (key !== 'enabled') {
      const hint = document.createElement('span');
      hint.id = 'yac-' + key + '-hint';
      hint.className = 'hint';
      descriptions[key + 'Description'] = hint;
      fields[key].setAttribute('aria-describedby', hint.id);
      copy.append(hint);
    }
    label.append(copy, fields[key]);
    (key === 'enabled' ? body : advancedBody).append(label);
  }
  for (const [key, title, min, max] of [
    ['strength', '濃さ', 15, 100], ['blur', 'ぼかし', 0, 160], ['saturation', '彩度', 0, 250], ['inset', '縁の内側', 0, 40], ['fps', '背景のFPS', 24, 60]
  ]) {
    const label = document.createElement('label');
    label.className = 'slider-label';
    label.htmlFor = 'yac-' + key;
    fields[key] = document.createElement('input');
    fields[key].id = 'yac-' + key;
    fields[key].type = 'range';
    fields[key].min = min;
    fields[key].max = max;
    fields[key].setAttribute('aria-label', title);
    outputs[key] = document.createElement('output');
    fieldLabels[key] = document.createTextNode(title);
    const row = document.createElement('span');
    row.className = 'slider-heading';
    row.append(fieldLabels[key], outputs[key]);
    label.append(row, fields[key]);
    if (key === 'inset' || key === 'fps') {
      const hint = document.createElement('span');
      hint.id = 'yac-' + key + '-hint';
      hint.className = 'hint';
      descriptions[key + 'Description'] = hint;
      fields[key].setAttribute('aria-describedby', hint.id);
      label.append(hint);
    }
    (key === 'inset' || key === 'fps' ? advancedBody : appearance).append(label);
  }
  const status = document.createElement('p');
  function createSaveNotice() {
    const container = document.createElement('div');container.className = 'save-error';container.hidden = true;
    container.setAttribute('role', 'alert');
    const message = document.createElement('span');
    const retry = document.createElement('button');retry.type = 'button';
    container.append(message, retry);
    return { container, message, retry };
  }
  const panelSaveNotice = createSaveNotice();
  body.append(appearance, advanced, panelSaveNotice.container, status, languageLabel);
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
    appearanceHeading.textContent = text.appearance;
    advancedHeading.textContent = text.advanced;
    advancedHeading.setAttribute('aria-label', text.advanced);
    for (const [key, element] of Object.entries(descriptions)) element.textContent = text[key];
    for (const [key, label] of Object.entries(fieldLabels)) {
      label.textContent = text[key];
      fields[key].setAttribute('aria-label', text[key]);
    }
    setStatus(statusKey);
  }
  function setOpen(value, returnFocus = false) {
    const nextOpen = Boolean(value && player && location.pathname === '/watch');
    const nativeGear = player?.querySelector('.ytp-settings-button');
    const nativeMenu = player?.querySelector('.ytp-settings-menu');
    if (nextOpen && (nativeGear?.getAttribute('aria-expanded') === 'true' ||
        nativeMenu && getComputedStyle(nativeMenu).display !== 'none')) nativeGear?.click();
    open = nextOpen;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    player?.classList.toggle('yac-settings-open', open);
    positionPanel();
    if (open) {
      fields.enabled.focus({ preventScroll: true });
    } else if (returnFocus && button.isConnected) button.focus();
  }
  listen(button, 'click', event => { event.stopPropagation(); setOpen(!open); });
  listen(button, 'keydown', event => {
    event.stopPropagation();
  });
  listen(button, 'keyup', event => event.stopPropagation());
  listen(close, 'click', () => setOpen(false, true));
  listen(panel, 'click', event => event.stopPropagation());
  listen(panel, 'dblclick', event => { event.preventDefault(); event.stopPropagation(); });
  listen(panel, 'keydown', event => {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false, true); }
  });
  listen(panel, 'keyup', event => event.stopPropagation());
  let videoListeners = [], gearListener = null, gearElement = null;
  const warningHost = document.createElement('div');
  warningHost.id = 'yac-flash-warning';
  const warningRoot = warningHost.attachShadow({ mode: 'open' });
  const warningStyle = document.createElement('style');
  warningStyle.textContent = [
    ':host{all:initial}*{box-sizing:border-box}dialog{position:fixed;inset:0;margin:auto;width:480px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);overflow:auto;padding:24px;background:#1c1c1c;color:#f1f1f1;border:1px solid #ffffff24;border-radius:16px;box-shadow:0 12px 48px #0008;font:14px/1.6 "YouTube Noto",Roboto,Arial,Helvetica,sans-serif;color-scheme:dark}',
    'dialog::backdrop{background:rgba(0,0,0,.48)}h2{margin:0 0 12px;font-size:18px;line-height:1.5;font-weight:500}p{margin:0 0 12px}.note{font-size:12px;color:#bdbdbd}',
    'label{display:flex;align-items:center;gap:10px;padding:16px 0;border-top:1px solid #ffffff1a;cursor:pointer}input{margin:0;width:18px;height:18px;accent-color:white;flex-shrink:0}.actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}',
    'button{min-height:40px;padding:8px 16px;border:1px solid #ffffff24;border-radius:8px;background:#ffffff0f;color:#eee;font:inherit;cursor:pointer}button:hover{background:#ffffff24}.primary{background:#f1f1f1;color:#0f0f0f;border-color:transparent}.primary:hover{background:white}:focus-visible{outline:2px solid white;outline-offset:3px}',
    '.save-error{margin:0 0 16px;padding:12px;border:1px solid #ffffff38;border-radius:8px;font-size:12px}.save-error[hidden]{display:none}.save-error button{display:block;margin-top:8px}button[aria-disabled=true],button[aria-busy=true]{opacity:.6;cursor:wait}'
  ].join('\n');
  const warningDialog = document.createElement('dialog');
  warningDialog.setAttribute('role', 'alertdialog');
  warningDialog.setAttribute('aria-labelledby', 'yac-flash-title');
  warningDialog.setAttribute('aria-describedby', 'yac-flash-body yac-flash-note');
  const warningTitle = document.createElement('h2');warningTitle.id = 'yac-flash-title';
  const warningBody = document.createElement('p');warningBody.id = 'yac-flash-body';
  const warningNote = document.createElement('p');warningNote.id = 'yac-flash-note';warningNote.className = 'note';
  const neverLabel = document.createElement('label');
  const neverCheckbox = document.createElement('input');neverCheckbox.type = 'checkbox';
  const neverText = document.createTextNode('');neverLabel.append(neverCheckbox, neverText);
  const warningActions = document.createElement('div');warningActions.className = 'actions';
  const warningClose = document.createElement('button');warningClose.type = 'button';
  const warningReduce = document.createElement('button');warningReduce.type = 'button';warningReduce.className = 'primary';warningReduce.autofocus = true;
  warningActions.append(warningClose, warningReduce);
  const warningSaveNotice = createSaveNotice();
  warningDialog.append(warningTitle, warningBody, warningNote, neverLabel, warningSaveNotice.container, warningActions);
  warningRoot.append(warningStyle, warningDialog);
  document.documentElement.append(warningHost);
  function renderSaveErrors() {
    const text = translations[settings.language];
    const message = saveError ? text.saveFailure.replace('{setting}', text[saveError.key] || text.title) : '';
    for (const notice of [panelSaveNotice, warningSaveNotice]) {
      const retryFocused = (notice === panelSaveNotice ? root : warningRoot).activeElement === notice.retry;
      if (saveError) notice.key = saveError.key;
      notice.container.hidden = !saveError;
      if (notice.message.textContent !== message) notice.message.textContent = message;
      notice.retry.textContent = text.saveRetry;
      if (!saveError && retryFocused) {
        if (notice === warningSaveNotice && flashWarningOpen) warningClose.focus({ preventScroll: true });
        else if (notice === panelSaveNotice && open) fields[notice.key]?.focus({ preventScroll: true });
      }
    }
  }
  function localizeWarning() {
    const text = translations[settings.language];
    warningDialog.lang = settings.language;
    warningTitle.textContent = text.flashTitle;warningBody.textContent = text.flashBody;warningNote.textContent = text.flashNote;
    neverText.textContent = text.flashNever;warningClose.textContent = text.flashClose;warningReduce.textContent = text.flashReduce;
    neverCheckbox.checked = !settings.flashWarning;
    renderSaveErrors();
  }
  function closeFlashWarning(returnFocus = true) {
    if (!flashWarningOpen) return;
    flashWarningOpen = false;warningPresentation++;reductionPresentation = null;
    reducingWarning = retryingWarning = false;
    warningReduce.removeAttribute('aria-busy');warningSaveNotice.retry.removeAttribute('aria-disabled');
    warningDialog.close();flashMonitor.reset();
    if (returnFocus) (warningFocus?.isConnected ? warningFocus : button).focus({ preventScroll: true });
    warningFocus = null;
    if (warningHost.parentElement !== document.documentElement) document.documentElement.append(warningHost);
  }
  function positionWarning() {
    const container = document.fullscreenElement || document.documentElement;
    if (warningHost.parentElement === container) return;
    if (flashWarningOpen) warningDialog.close();
    container.append(warningHost);
    if (flashWarningOpen) warningDialog.showModal();
  }
  function showFlashWarning(key) {
    if (!settings.flashWarning || flashWarningOpen || warnedVideoKey === key) return;
    warnedVideoKey = key;
    warningPresentation++;
    warningFocus = document.activeElement;
    while (warningFocus?.shadowRoot?.activeElement) warningFocus = warningFocus.shadowRoot.activeElement;
    localizeWarning();positionWarning();warningDialog.showModal();flashWarningOpen = true;warningReduce.focus();
    // Notification only: do not pause video, disable ambient, or change strength.
  }
  listen(neverCheckbox, 'change', () => {
    saveWarningSetting('flashWarning', !neverCheckbox.checked).catch(console.warn);
  });
  function saveWarningSetting(key, value) {
    const task = settingsStore.set(key, value, true);
    warningSaves.add(task);
    task.then(() => warningSaves.delete(task), () => warningSaves.delete(task));
    return task;
  }
  async function finishWarningReduction(presentation) {
    // Never-show may still be saving. Keep its failure visible instead of
    // dismissing the dialog just because the strength write succeeded.
    while (warningSaves.size && presentation === warningPresentation) {
      await Promise.allSettled([...warningSaves]);
    }
    if (flashWarningOpen && presentation === warningPresentation && reductionPresentation === presentation && !saveError) closeFlashWarning();
  }
  listen(warningReduce, 'click', async () => {
    if (reducingWarning) return;
    const presentation = warningPresentation;reductionPresentation = presentation;reducingWarning = true;
    warningReduce.setAttribute('aria-busy', 'true');
    try {
      await saveWarningSetting('strength', 15);
      await finishWarningReduction(presentation);
    } catch (error) { console.warn(error); }
    finally {
      if (presentation === warningPresentation) { reducingWarning = false;warningReduce.removeAttribute('aria-busy'); }
    }
  });
  listen(warningSaveNotice.retry, 'click', async () => {
    if (!saveError || retryingWarning) return;
    const key = saveError.key, presentation = warningPresentation;retryingWarning = true;
    warningSaveNotice.retry.setAttribute('aria-disabled', 'true');
    try {
      await saveWarningSetting(key, settings[key]);
      await finishWarningReduction(presentation);
    } catch (error) { console.warn(error); }
    finally {
      if (presentation === warningPresentation) { retryingWarning = false;warningSaveNotice.retry.removeAttribute('aria-disabled'); }
    }
  });
  listen(panelSaveNotice.retry, 'click', async () => {
    if (!saveError || retryingPanel) return;
    const key = saveError.key;retryingPanel = true;panelSaveNotice.retry.setAttribute('aria-disabled', 'true');
    try { await settingsStore.set(key, settings[key], true); }
    catch (error) { console.warn(error); }
    finally { retryingPanel = false;panelSaveNotice.retry.removeAttribute('aria-disabled'); }
  });
  listen(warningClose, 'click', () => closeFlashWarning());
  listen(warningDialog, 'cancel', event => { event.preventDefault();closeFlashWarning(); });
  listen(warningDialog, 'keydown', event => event.stopPropagation());
  listen(warningDialog, 'keyup', event => event.stopPropagation());
  listen(warningDialog, 'click', event => event.stopPropagation());
  listen(warningDialog, 'dblclick', event => { event.preventDefault();event.stopPropagation(); });
  function updateAppearance() {
    const attenuation = 1 - .55 * blend;
    const opacity = (settings.strength / 100 * attenuation).toFixed(4);
    if (canvas.style.opacity !== opacity) canvas.style.opacity = opacity;
    if (barCanvas.style.opacity !== opacity) barCanvas.style.opacity = opacity;
    // Scrolled full-frame backgrounds retain finer shapes than edge projection.
    const fullFrameBlur = Math.max(25, settings.blur / 2);
    const blur = (settings.blur + (fullFrameBlur - settings.blur) * blend).toFixed(2);
    const filter = 'blur(' + blur + 'px) saturate(' + settings.saturation / 100 + ')';
    if (canvas.style.filter !== filter) canvas.style.filter = filter;
    if (barCanvas.style.filter !== filter) barCanvas.style.filter = filter;
  }
  function apply() {
    localize();
    localizeWarning();
    updateAppearance();
    button.classList.toggle('yac-enabled', settings.enabled);
    for (const key of booleanKeys) {
      fields[key].checked = settings[key];
      fields[key].setAttribute('aria-checked', String(settings[key]));
    }
    for (const key of ['strength', 'blur', 'saturation', 'inset', 'fps']) {
      fields[key].value = settings[key];
      fields[key].style.setProperty('--progress', (settings[key] - Number(fields[key].min)) / (Number(fields[key].max) - Number(fields[key].min)) * 100 + '%');
      const valueText = settings[key] + (key === 'blur' ? ' px' : key === 'fps' ? ' FPS' : '%');
      outputs[key].textContent = valueText;
      fields[key].setAttribute('aria-valuetext', valueText);
    }
    lastTime = -1;
    lastDrawFrame = 0;
    invalidateFrame(false);
    if (!settings.fillBars || !settings.enabled) restoreBars();
  }
  for (const key of Object.keys(fields)) {
    listen(fields[key], 'input', () => {
      const value = key === 'language' ? fields[key].value :
        booleanKeys.includes(key) ? fields[key].checked : Number(fields[key].value);
      settingsStore.set(key, value);
    });
    listen(fields[key], 'change', () => settingsStore.set(key, settings[key], true).catch(console.warn));
  }
  function positionPanel() {
    if (!open || !player || document.hidden) return;
    const controls = player.querySelector('.ytp-chrome-bottom');
    const preferredBottom = controls ? Math.max(48, player.clientHeight - controls.offsetTop + 8) : 60;
    // Keep the header and close action reachable in a short player.
    const bottom = Math.min(preferredBottom, Math.max(0, player.clientHeight - 64));
    panel.style.width = Math.min(320, Math.max(1, player.clientWidth - 24)) + 'px';
    panel.style.bottom = bottom + 'px';
    panel.style.maxHeight = Math.max(1, player.clientHeight - bottom - 8) + 'px';
  }
  const panelResizeObserver = new ResizeObserver(() => {
    restoreBars();
    invalidateFrame(false);
    positionPanel();
    markSurfacesDirty();
  });
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
    let chatStyle = chatDocument.getElementById(chatStyleId);
    if (!chatStyle) {
      chatStyle = chatDocument.createElement('style');
      chatStyle.id = chatStyleId;
      chatDocument.head.append(chatStyle);
    }
    const active = document.documentElement.classList.contains('yac-active');
    chatDocument.documentElement.classList.toggle('yac-chat-active', active);
    if (!active) return;
    // CSS variables do not cross iframe documents. Copy this palette only at
    // discovery/load/activation, never per rendered frame or per chat message.
    const palette = getComputedStyle(document.documentElement);
    const rgb = palette.getPropertyValue('--yac-control-rgb').trim();
    const channels = rgb.split(',').map(Number);
    const safeRgb = channels.length === 3 && channels.every(v => Number.isFinite(v) && v >= 0 && v <= 255) ? channels.join(',') : '18,20,25';
    const alpha = (property, fallback) => {
      const value = palette.getPropertyValue(property).trim(), number = Number(value);
      return value && Number.isFinite(number) && number >= 0 && number <= 1 ? number : fallback;
    };
    const blur = palette.getPropertyValue('--yac-control-blur').trim();
    const safeBlur = /^\d+(?:\.\d+)?px$/.test(blur) && parseFloat(blur) <= 64 ? blur : '12px';
    const text = `html.yac-chat-active{--yac-control-rgb:${safeRgb};
      --yac-control-opacity:${alpha('--yac-control-opacity', .22)};
      --yac-control-hover-opacity:${alpha('--yac-control-hover-opacity', .34)};
      --yac-control-selected-opacity:${alpha('--yac-control-selected-opacity', .44)};
      --yac-reading-opacity:${alpha('--yac-reading-opacity', .64)};
      --yac-control-blur:${safeBlur};
      --yac-control-surface:rgba(var(--yac-control-rgb),var(--yac-control-opacity));
      --yac-control-hover-surface:rgba(var(--yac-control-rgb),var(--yac-control-hover-opacity));
      --yac-control-selected-surface:rgba(var(--yac-control-rgb),var(--yac-control-selected-opacity))}
      ${chatCss}`;
    if (chatStyle.textContent !== text) chatStyle.textContent = text;
  }
  function setAmbientActive(active) {
    const changed = document.documentElement.classList.contains('yac-active') !== active;
    if (changed) document.documentElement.classList.toggle('yac-active', active);
    if (chatDocument?.documentElement?.classList.contains('yac-chat-active') !== active) {
      chatDocument?.documentElement?.classList.toggle('yac-chat-active', active);
    }
    if (changed) {
      cancelSurfaceRefresh();
      surfacesDirty = true;
      if (active) refreshPageSurfaces(true);
      else syncPageSurfaces(false);
      if (active) syncChat();
    }
  }
  function discover() {
    if (disposed || document.hidden) return;
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
    if (video !== nextVideo) {
      stopVideoFrames();
      for (const remove of videoListeners) remove();
      videoListeners = [];
      restoreBars();
      invalidateFrame();
      if (nextVideo) {
        videoListeners.push(listen(nextVideo, 'seeking', () => { stopVideoFrames();invalidateFrame();restoreBars();flashMonitor.reset(); }));
        videoListeners.push(listen(nextVideo, 'seeked', () => { startVideoFrames();invalidateFrame();draw(); }));
        videoListeners.push(listen(nextVideo, 'emptied', () => { stopVideoFrames();invalidateFrame();restoreBars();flashMonitor.reset(); }));
        videoListeners.push(listen(nextVideo, 'loadeddata', () => { startVideoFrames();invalidateFrame();draw(); }));
      }
    }
    video = nextVideo;
    if (frameVideo !== video && video && !video.seeking) startVideoFrames();
    const gear = player?.querySelector('.ytp-right-controls .ytp-settings-button');
    if (gear !== gearElement) {
      gearListener?.(); gearElement = gear;
      gearListener = gear ? listen(gear, 'click', () => { if (open) setOpen(false); }, true) : null;
    }
    const toolbar = gear?.parentElement || player?.querySelector('.ytp-right-controls');
    if (toolbar && button.parentElement !== toolbar) toolbar.insertBefore(button, gear || toolbar.firstChild);
    if (player && panel.parentElement !== player) player.append(panel);
    if (player && barLayer.parentElement !== player) player.prepend(barLayer);
    button.hidden = location.pathname !== '/watch';
    if (button.hidden || !toolbar || !player) setOpen(false);
    positionPanel();
    syncChat();
    refreshPageSurfaces();
  }
  function restoreBars() {
    if (originalClip) {
      const { element, value, priority, applied } = originalClip;
      if (element.style.getPropertyValue('clip-path') === applied && element.style.getPropertyPriority('clip-path') === 'important') {
        if (value) element.style.setProperty('clip-path', value, priority);
        else element.style.removeProperty('clip-path');
      }
      originalClip = null;
    }
    if (player?.classList.contains('yac-fill-bars')) player.classList.remove('yac-fill-bars');
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
    const current = video.style.getPropertyValue('clip-path'), priority = video.style.getPropertyPriority('clip-path');
    if (!originalClip || current !== originalClip.applied || priority !== 'important') {
      originalClip = { element: video, value: current, priority };
    }
    const clip = 'inset(' + [top, right, bottom, left].map(v => v.toFixed(2) + 'px').join(' ') + ')';
    if (current !== clip || priority !== 'important') video.style.setProperty('clip-path', clip, 'important');
    originalClip.applied = video.style.getPropertyValue('clip-path');
    if (!player.classList.contains('yac-fill-bars')) player.classList.add('yac-fill-bars');
    const p = player.getBoundingClientRect(), pad = renderer.padding;
    const width = 400, height = Math.min(2048, Math.max(80, Math.round(width * (p.height + pad * 2) / (p.width + pad * 2))));
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
  function invalidateFrame(resetBars = true) {
    inputRevision++;
    if (resetBars) renderer?.reset?.();
    else renderer?.invalidate?.();
    lastTime = -1;
    paintDue = true; forcePaint = true; geometryCheckDue = true;
    if (resetBars) { lastSampleVideo = null; lastSampleTime = -1; submittedSerial = -1; }
  }
  function stopVideoFrames() {
    frameEpoch++;
    if (frameVideo && videoFrameRequest !== null) frameVideo.cancelVideoFrameCallback?.(videoFrameRequest);
    videoFrameRequest = null; frameVideo = null;
  }
  function startVideoFrames() {
    stopVideoFrames();
    if (disposed || document.hidden || !video || typeof video.requestVideoFrameCallback !== 'function' ||
        typeof video.cancelVideoFrameCallback !== 'function') return;
    const source = video, epoch = frameEpoch;
    frameVideo = source; frameSerial = 0; submittedSerial = -1;
    const next = () => {
      try { videoFrameRequest = source.requestVideoFrameCallback(() => {
        if (disposed || document.hidden || epoch !== frameEpoch || source !== video) return;
        videoFrameRequest = null; frameSerial++; next();
      }); } catch { stopVideoFrames(); }
    };
    next();
  }
  function sourceKey() {
    return (new URLSearchParams(location.search).get('v') || '') + '|' + (video?.currentSrc || '');
  }
  function warningKey() { return new URLSearchParams(location.search).get('v') || video?.currentSrc || 'current-video'; }
  function wantsMonitoring() {
    return settingsLoaded && settings.flashWarning && !flashWarningOpen && !!video && !video.paused && warnedVideoKey !== warningKey();
  }
  function validGeometry(rect) {
    return [rect.left, rect.top, rect.width, rect.height, innerWidth, innerHeight].every(Number.isFinite) &&
      rect.width > 0 && rect.height > 0 && innerWidth > 0 && innerHeight > 0;
  }
  function acceptFrame(meta) {
    if (disposed || !settingsLoaded || location.pathname !== '/watch' || document.hidden ||
        video !== meta.source || video.seeking || sourceKey() !== meta.sourceKey || inputRevision !== meta.options.revision ||
        !validGeometry(getRectangle())) return false;
    return meta.options.sampleOnly ? wantsMonitoring() : settings.enabled && !document.fullscreenElement;
  }
  function presentFrame(result, meta) {
    lastSampleVideo = meta.source; lastSampleTime = meta.mediaTime;
    if (wantsMonitoring()) {
      if (flashMonitor.sample(renderer.readPixels(), meta.options.sampleTime, meta.mediaTime, meta.sourceKey, result.samplingCrop, video.playbackRate)) showFlashWarning(warningKey());
    } else flashMonitor.reset();
    // Monitoring remains available with ambient OFF and in fullscreen. These
    // jobs only inspect pixels and must never present a background or clip video.
    if (result.sampleOnly || meta.options.sampleOnly) return;
    canvas.dataset.blend = meta.options.blend.toFixed(3);
    // The Worker captured this frame before scrolling or a layout change.
    // Clip the current video box, never combine an old rectangle with new bounds.
    replaceBars(result, getRectangle());
    lastVideo = meta.source; lastTime = meta.mediaTime; lastGeometry = meta.options.geometry;
    setStatus(settings.avoidBars && !result.readable ? 'noBars' :
      result.cropped ? 'cropped' : settings.radial ? 'radialHint' : 'fullFrameHint');
  }
  function useMainRenderer(reason) {
    renderer?.dispose?.();
    if (disposed) return;
    renderer = new YacRenderer(canvas);
    canvas.dataset.renderMode = 'main';
    if (reason) console.warn('Ambient worker unavailable; using canvas renderer:', reason);
    invalidateFrame();
  }
  const hostUrl = extension?.runtime?.getURL?.('worker-host.html');
  if (hostUrl && typeof YacWorkerRenderer === 'function') {
    renderer = new YacWorkerRenderer(canvas, { hostUrl, acceptFrame, onFrame: presentFrame, onFailure: useMainRenderer });
    renderer.setSuspended?.(document.hidden);
    canvas.dataset.renderMode = 'worker';
  } else useMainRenderer();
  function draw(requestPaint = true) {
    if (requestPaint) { paintDue = true; forcePaint = true; }
    const active = settingsLoaded && settings.enabled && location.pathname === '/watch' && !document.fullscreenElement && !!video;
    // Native UI styling stays independent of Worker startup, busy jobs and fallback.
    setAmbientActive(active);
    if (!active) {
      restoreBars();
      setStatus(!settings.enabled ? 'off' : document.fullscreenElement ? 'fullscreen' : 'waiting');
    }
    const monitoring = wantsMonitoring();
    const ready = settingsLoaded && location.pathname === '/watch' && !document.hidden &&
      (active || monitoring) && canvas.isConnected && video && !video.seeking && video.readyState >= 2;
    if (!ready) {
      flashMonitor.reset();
      restoreBars();
      setStatus(!settings.enabled ? 'off' : document.fullscreenElement ? 'fullscreen' : 'waiting');
      return;
    }
    // Do not force layout or update styles for frames the Worker cannot accept.
    if (renderer.canAcceptFrame && !renderer.canAcceptFrame()) return;
    const paced = frameVideo === video;
    const fresh = paced ? frameSerial !== submittedSerial : video !== lastSampleVideo || video.currentTime !== lastSampleTime;
    // Keep layout/scroll tracking at background FPS without measuring the same
    // paused/decoded frame at every display tick. paintDue may stay latched while
    // waiting for a fresh frame, so it cannot also be the geometry deadline.
    if (paced && !fresh && !(active && (forcePaint || geometryCheckDue))) return;
    geometryCheckDue = false;
    const rect = getRectangle();
    if (!validGeometry(rect)) { flashMonitor.reset();restoreBars();setStatus('waiting');return; }
    const headerBottom = Math.max(0, document.querySelector('ytd-masthead')?.getBoundingClientRect().bottom || 0);
    const targetBlend = YacRenderer.scrollBlend(rect, { top: headerBottom, height: innerHeight });
    const now = performance.now();
    blend += (targetBlend - blend) * (1 - Math.exp(-(now - lastBlendTime) / 140));
    if (Math.abs(targetBlend - blend) < .005) blend = targetBlend;
    lastBlendTime = now;
    updateAppearance();
    const geometry = [rect.left, rect.top, rect.width, rect.height, innerWidth, innerHeight, blend.toFixed(3)].join(',');
    const unchanged = video === lastVideo && video.currentTime === lastTime && geometry === lastGeometry &&
      (!(settings.avoidBars || settings.fillBars) || !renderer.readable || renderer.stableFrames >= 4);
    const settling = video.paused && (settings.avoidBars || settings.fillBars) && renderer.readable && renderer.stableFrames < 4;
    const paint = active && (forcePaint || paintDue && (fresh || geometry !== lastGeometry || settling)) && (!unchanged || forcePaint);
    const sample = monitoring && fresh;
    if (!paint && !sample) return;
    try {
      const options = { ...settings, blend, sourceKey: sourceKey(), sampleTime: now, mediaTime: video.currentTime, geometry, revision: inputRevision,
        sampleOnly: !paint, readPixels: monitoring };
      const mediaTime = video.currentTime;
      const serial = frameSerial;
      const result = !paint && canvas.dataset.renderMode === 'main' ?
        renderer.inspect(video, rect, { width: innerWidth, height: innerHeight }, options) :
        renderer.draw(video, rect, { width: innerWidth, height: innerHeight }, settings.radial, options);
      const accepted = () => { if (paced) submittedSerial = serial;if (paint) { paintDue = false;forcePaint = false; } };
      if (typeof result === 'boolean') { if (result) accepted();return; }
      const meta = { source: video, rectangle: rect, options, sourceKey: options.sourceKey, mediaTime };
      if (acceptFrame(meta)) { accepted();presentFrame(result, meta); }
    } catch (error) {
      restoreBars();
      setStatus('failed');
    }
  }
  listen(document, 'yt-navigate-finish', () => { closeFlashWarning(false);flashMonitor.reset();invalidateFrame();discover(); draw(); });
  listen(document, 'visibilitychange', () => {
    if (document.hidden) stopVideoFrames(); else startVideoFrames();
    renderer?.setSuspended?.(document.hidden);invalidateFrame();
    cancelSurfaceRefresh();surfacesDirty = true;
    if (!document.hidden) discover();
    draw();refreshPageSurfaces(true);
  });
  listen(document, 'fullscreenchange', () => { invalidateFrame();positionWarning();discover(); draw(); });
  listen(window, 'resize', () => { restoreBars();invalidateFrame(false);positionPanel(); draw(); });
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
      paintDue = true; geometryCheckDue = true;
    }
    // Warning sampling follows the display tick, independently of the chosen
    // background FPS. One Worker job at a time still provides backpressure.
    if (paintDue || wantsMonitoring()) draw(false);
  }
  listen(document, 'yac-dispose', () => {
    disposed = true;
    stopVideoFrames();
    settingsStore.dispose();
    renderer?.dispose?.();
    closeFlashWarning(false);warningHost.remove();
    clearInterval(discoverTimer); cancelAnimationFrame(frameRequest);
    surfaceObserver.disconnect();cancelSurfaceRefresh();
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
  const settingsStore = new YacSettingsStore(extension.storage, settings, {
    onChange(snapshot, { loaded, error, saveError: nextSaveError }) {
      if (disposed) return;
      const changed = loaded !== settingsLoaded || Object.keys(snapshot).some(key => snapshot[key] !== settings[key]);
      if (snapshot.flashWarning !== settings.flashWarning) { flashMonitor.reset();warnedVideoKey = ''; }
      settingsLoaded = loaded;Object.assign(settings, snapshot);
      saveError = nextSaveError;
      if (error && !nextSaveError) console.warn(error);
      if (changed) { apply();draw(); }
      else renderSaveErrors();
    }
  });
})();
