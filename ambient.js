(() => {
  'use strict';
  if (document.getElementById('yac-settings-button')) return;
  // Dispose the previous revision when previewing an update in this document.
  document.dispatchEvent(new Event('yac-dispose'));
  document.getElementById('yac-controls')?.remove();
  document.getElementById('yac-background')?.remove();
  const extension = typeof browser !== 'undefined' ? browser : globalThis.chrome;
  const settings = { enabled: true, radial: true, avoidBars: true, fillBars: true, flashWarning: true, strength: 65, blur: 90, saturation: 145, inset: 0, fps: 30, surfaceMultiplier: 1, controlDensity: 100, readingDensity: 100, navigationDensity: 100, language: 'ja' };
  const paletteStyle = document.createElement('style');
  paletteStyle.id = 'yac-surface-palette';
  document.head.append(paletteStyle);
  const booleanKeys = ['enabled', 'radial', 'avoidBars', 'fillBars', 'flashWarning'];
  const uiOnlySettings = new Set(['surfaceMultiplier', 'controlDensity', 'readingDensity', 'navigationDensity', 'language']);
  const translations = {
    ja: {
      title: '設定', close: '設定を閉じる', back: '設定一覧に戻る', language: '言語 / Language',
      openSettings: '設定を開く', on: 'オン', offState: 'オフ', info: '説明', applied: '適用',
      enabled: 'アンビエント背景', radial: '放射状モード', avoidBars: '黒帯を自動で除外', fillBars: '黒帯を背景に置き換える',
      strength: '背景映像の濃さ', blur: 'ぼかし', saturation: '彩度', inset: '採色範囲（内側）', fps: '背景のFPS',
      surfaceMultiplier: '全体の濃さ', surfaceMultiplierDescription: '各種類の濃さに0〜1を掛けます。0は完全な透明です。文字とアイコンの色は保ちます。',
      controlDensity: 'ボタンと検索', controlDensityDescription: '検索欄・タグ・Enhancerのツールバーの濃さを0〜100%で設定します。',
      readingDensity: 'カードとチャット', readingDensityDescription: 'タイトル・チャンネル・説明欄・コメント・関連動画、文字起こし・リプレイ・プレイリスト・チャットの濃さを0〜100%で設定します。',
      navigationDensity: 'メニューとサイドバー', navigationDensityDescription: '検索候補・音声検索・通知・メニュー・ホバーカード・説明ラベル・サイドバー・この設定画面の濃さを0〜100%で設定します。',
      appearance: '背景の見た目', appearanceDescription: '濃さ・ぼかし・彩度',
      surfaces: '操作画面の濃さ', surfacesDescription: '全体の倍率と種類別の濃さ',
      rendering: '黒帯と描画', renderingDescription: '黒帯・採色範囲・フレームレート',
      safety: '安全と言語', safetyDescription: '高速点滅の警告・表示言語',
      strengthDescription: '映像から作るアンビエント背景の濃さを調整します。',
      blurDescription: 'スクロール後は設定値の半分でぼかします。下限は25 pxです。',
      saturationDescription: '100%が元の彩度です。値を上げると背景の色が鮮やかになります。',
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
      title: 'Settings', close: 'Close settings', back: 'Back to settings', language: '言語 / Language',
      openSettings: 'Open settings', on: 'On', offState: 'Off', info: 'Information', applied: 'Applied',
      enabled: 'Ambient background', radial: 'Radial mode', avoidBars: 'Detect and exclude black bars', fillBars: 'Replace black bars with ambient',
      strength: 'Ambient strength', blur: 'Blur', saturation: 'Saturation', inset: 'Sample inset', fps: 'Background FPS',
      surfaceMultiplier: 'Overall shade', surfaceMultiplierDescription: 'Multiplies each category by 0–1. Zero is fully transparent. Text and icon colors stay unchanged.',
      controlDensity: 'Buttons and search', controlDensityDescription: 'Sets search, filter chips and the Enhancer toolbar from 0–100%.',
      readingDensity: 'Cards and chat', readingDensityDescription: 'Sets titles, channels, descriptions, comments, related results, transcripts, replay cards, playlists and chat from 0–100%.',
      navigationDensity: 'Menus and sidebar', navigationDensityDescription: 'Sets search suggestions, voice search, notifications, menus, hover cards, tooltips, the sidebar and this settings panel from 0–100%.',
      appearance: 'Background appearance', appearanceDescription: 'Strength, blur and saturation',
      surfaces: 'Interface shade', surfacesDescription: 'Overall multiplier and individual categories',
      rendering: 'Black bars and rendering', renderingDescription: 'Bars, sample inset and frame rate',
      safety: 'Safety and language', safetyDescription: 'Rapid-flash warning and display language',
      strengthDescription: 'Adjusts the strength of the ambient background sampled from the video.',
      blurDescription: 'After scrolling, blur uses half this value, with a minimum of 25 px.',
      saturationDescription: '100% is the original saturation. Higher values make the background more vivid.',
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
    ':is(ytd-watch-flexy,ytd-watch-grid) :is(ytd-watch-metadata,ytd-video-primary-info-renderer,ytd-video-secondary-info-renderer) :is(#above-the-fold,#title,#top-row,#owner,#bottom-row,#info-contents)',
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
      // Keep one reading face on the panel. Its content/header wrappers stay
      // clear; the transcript field uses the same control paint as search.
      if (element.localName === 'ytd-engagement-panel-section-list-renderer') {
        overrides['background-color'] = 'var(--yac-card-surface)';
      } else if (element.matches('ytd-transcript-search-box-renderer .input-container')) {
        overrides['background-color'] = 'var(--yac-control-surface)';
      } else if (['ytd-watch-metadata', 'ytd-video-primary-info-renderer', 'ytd-video-secondary-info-renderer'].includes(element.localName)) {
        overrides['background-color'] = 'var(--yac-metadata-reading-face)';
      } else if (element.localName === 'ytd-comments' ||
        (element.id === 'description' && element.closest('ytd-watch-metadata,ytd-video-secondary-info-renderer'))) {
        overrides['background-color'] = 'var(--yac-reading-pane-face)';
      } else if (element.id === 'related' || element.localName === 'ytd-watch-next-secondary-results-renderer') {
        // CSS clears this face synchronously when a playlist appears and
        // prevents a nested related renderer from painting a second layer.
        overrides['background-color'] = 'var(--yac-related-reading-face)';
      } else if (['ytd-item-section-renderer', 'ytd-rich-grid-renderer'].includes(element.localName) &&
        element.closest('#related,ytd-watch-next-secondary-results-renderer')) {
        overrides['background-color'] = 'var(--yac-related-section-face)';
      }
      if (element.localName === 'ytd-app') {
        overrides['background-color'] = 'var(--yac-page-base)';
        overrides.isolation = 'isolate';
      }
      const properties = savedSurfaces.get(element) || new Map();
      savedSurfaces.set(element, properties);
      for (const [name, value] of Object.entries(overrides)) {
        const current = element.style.getPropertyValue(name), priority = element.style.getPropertyPriority(name);
        const previous = properties.get(name);
        const owned = previous && current === previous.applied && priority === 'important';
        if (owned && previous.applied === value) continue;
        element.style.setProperty(name, value, 'important');
        properties.set(name, { value: owned ? previous.value : current,
          priority: owned ? previous.priority : priority, applied: element.style.getPropertyValue(name) });
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
  const readingOwners = 'ytd-watch-metadata,ytd-video-primary-info-renderer,ytd-video-secondary-info-renderer';
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
    // Activation and visibility resume perform one complete synchronization.
    // Avoid walking every added subtree while native UI paint is retained or
    // the tab is hidden; keep the pending change for that synchronization.
    if (document.hidden || !document.documentElement.classList.contains('yac-active')) {
      surfacesDirty = true;
      return;
    }
    const relevant = records.filter(relevantSurfaceMutation);
    if (!relevant.length) return;
    surfacesDirty = true;
    // Theater/fullscreen container changes must not expose an opaque surround
    // while waiting for the normal coalesced refresh.
    const modeChange = relevant.some(record => record.type === 'attributes' &&
      (record.attributeName === 'theater' || record.attributeName === 'class' && record.target.id === 'movie_player'));
    // A native metadata shell can be replaced in a single navigation/layout
    // update. Apply its face in the observer microtask, before the next paint,
    // instead of leaving an inline theme background for the coalescing window.
    const readingOwnerChange = relevant.some(record => record.type === 'attributes' ?
      record.attributeName === 'style' && record.target.matches(readingOwners) :
      [...record.addedNodes].some(node => node.nodeType === 1 &&
        (node.matches(readingOwners) || node.querySelector(readingOwners))));
    refreshPageSurfaces(modeChange || readingOwnerChange);
  });
  surfaceObserver.observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeOldValue: true,
    attributeFilter: ['style', 'class', 'id', 'theater']
  });
  // Chat is a separate document. Match only native monochrome shapes so
  // paid messages, rank badges and other semantic colors keep their paint.
  const chatNeutralControl = ':is(.ytSpecButtonShapeNextHost.ytSpecButtonShapeNextMono,.yt-spec-button-shape-next.yt-spec-button-shape-next--mono):is(.ytSpecButtonShapeNextTonal,.ytSpecButtonShapeNextOutline,.ytSpecButtonShapeNextText,.ytSpecButtonShapeNextFilled,.yt-spec-button-shape-next--tonal,.yt-spec-button-shape-next--outline,.yt-spec-button-shape-next--text,.yt-spec-button-shape-next--filled)';
  const chatCss = [
    `html.yac-chat-active{
      --yt-live-chat-background-color:transparent;--yt-live-chat-action-panel-background-color:transparent;
      --yac-reading-rgb:255,255,255;
      --yac-chat-surface:rgba(var(--yac-reading-rgb),var(--yac-reading-opacity));
      --yac-chat-header-surface:rgba(var(--yac-reading-rgb),var(--yac-chat-header-opacity));
      --yac-chat-overlay-surface:rgba(var(--yac-reading-rgb),var(--yac-chat-overlay-opacity));
      --yac-chat-menu-feedback:rgba(0,0,0,calc(.10 * var(--yac-navigation-level,1)));
      --yac-control-text:var(--yt-spec-text-primary,#0f0f0f);
      --yac-control-backdrop:blur(var(--yac-control-blur)) contrast(var(--yac-control-light-contrast)) brightness(var(--yac-control-light-brightness));
      --yac-control-hover-backdrop:var(--yac-control-backdrop);
      background-color:var(--yac-chat-surface)!important;background-image:none!important;
    }
    html.yac-chat-active[dark]{
      --yac-reading-rgb:var(--yac-control-rgb);--yac-chat-menu-feedback:rgba(255,255,255,calc(.10 * var(--yac-navigation-level,1)));
      --yac-control-text:var(--main-text,var(--yt-spec-text-primary,#f1f1f1));
      --yac-control-backdrop:blur(var(--yac-control-blur)) brightness(var(--yac-control-dark-brightness));
      --yac-control-hover-backdrop:blur(var(--yac-control-blur)) brightness(var(--yac-control-dark-hover-brightness));
    }`,
    'html.yac-chat-active body,html.yac-chat-active yt-live-chat-app,html.yac-chat-active yt-live-chat-renderer,html.yac-chat-active yt-live-chat-item-list-renderer,html.yac-chat-active yt-live-chat-ticker-renderer,html.yac-chat-active yt-live-chat-renderer #chat,html.yac-chat-active yt-live-chat-renderer #contents,html.yac-chat-active yt-live-chat-renderer #items,html.yac-chat-active yt-live-chat-renderer #item-scroller,html.yac-chat-active yt-live-chat-renderer #panel-pages{background-color:transparent!important;background-image:none!important}',
    'html.yac-chat-active yt-live-chat-message-input-renderer,html.yac-chat-active yt-live-chat-message-input-renderer #input-container{background:transparent!important;box-shadow:none!important}',
    'html.yac-chat-active yt-live-chat-text-message-renderer{text-shadow:0 1px 3px #fff9}',
    'html.yac-chat-active[dark] yt-live-chat-text-message-renderer{text-shadow:0 1px 3px #000b}',
    `html.yac-chat-active yt-live-chat-header-renderer{
      background-color:var(--yac-chat-header-surface)!important;background-image:none!important;
      -webkit-backdrop-filter:blur(var(--yac-reading-blur))!important;backdrop-filter:blur(var(--yac-reading-blur))!important;
    }
    html.yac-chat-active :is(ytd-menu-popup-renderer,ytd-engagement-panel-section-list-renderer),
    html.yac-chat-active yt-live-chat-header-renderer yt-dropdown-menu :is(tp-yt-paper-listbox,paper-listbox){
      background-color:var(--yac-chat-overlay-surface)!important;background-image:none!important;
      -webkit-backdrop-filter:blur(var(--yac-navigation-blur))!important;backdrop-filter:blur(var(--yac-navigation-blur))!important;
    }
    html.yac-chat-active ytd-menu-popup-renderer :is(tp-yt-paper-listbox,paper-listbox),
    html.yac-chat-active ytd-engagement-panel-section-list-renderer :is(#content,#header,ytd-engagement-panel-title-header-renderer){
      background-color:transparent!important;background-image:none!important;
    }
    html.yac-chat-active yt-live-chat-header-renderer yt-dropdown-menu :is(tp-yt-paper-listbox,paper-listbox) > a.yt-simple-endpoint{
      background-color:transparent!important;background-image:none!important;
    }
    html.yac-chat-active yt-live-chat-header-renderer yt-dropdown-menu :is(tp-yt-paper-listbox,paper-listbox) > a.yt-simple-endpoint:is(:hover,:focus-visible,.iron-selected,[aria-selected="true"]){
      background-color:var(--yac-chat-menu-feedback)!important;
    }`,
    `html.yac-chat-active :is(ytd-menu-popup-renderer,ytd-engagement-panel-section-list-renderer){
      --yac-control-surface:transparent;
      --yac-control-hover-surface:rgba(var(--yac-reading-rgb),calc(.12 * var(--yac-navigation-level)));
      --yac-control-selected-surface:rgba(var(--yac-reading-rgb),calc(.20 * var(--yac-navigation-level)));
      --yac-control-feedback:var(--yac-navigation-level);
      --yac-control-backdrop:none;--yac-control-hover-backdrop:none;
    }
    html.yac-chat-active ${chatNeutralControl}{
      background-color:var(--yac-control-surface)!important;background-image:none!important;
      -webkit-backdrop-filter:var(--yac-control-backdrop)!important;backdrop-filter:var(--yac-control-backdrop)!important;
    }
    html.yac-chat-active ${chatNeutralControl}:is(:hover,:focus-visible){
      background-color:var(--yac-control-hover-surface)!important;
      -webkit-backdrop-filter:var(--yac-control-hover-backdrop)!important;backdrop-filter:var(--yac-control-hover-backdrop)!important;
    }
    html.yac-chat-active ${chatNeutralControl}:is([aria-pressed="true"],[aria-selected="true"]){
      background-color:var(--yac-control-selected-surface)!important;
    }
    html.yac-chat-active ${chatNeutralControl}:is(.ytSpecButtonShapeNextFilled,.yt-spec-button-shape-next--filled){
      color:var(--yac-control-text);
    }
    html.yac-chat-active ${chatNeutralControl} :is(.ytSpecTouchFeedbackShapeFill,.yt-spec-touch-feedback-shape__fill){
      filter:opacity(var(--yac-control-feedback))!important;
    }`
  ].join('\n');
  const removers = new Set();
  function listen(target, type, callback, options) {
    target.addEventListener(type, callback, options);
    const remove = () => { target.removeEventListener(type, callback, options); removers.delete(remove); };
    removers.add(remove);
    return remove;
  }
  const fields = {}, outputs = {}, fieldLabels = {}, descriptions = {}, infoButtons = {};
  function makeIcon(path) {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', width: '20', height: '20', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) icon.setAttribute(key, value);
    const shape = document.createElementNS(icon.namespaceURI, 'path');shape.setAttribute('d', path);icon.append(shape);
    return icon;
  }
  const launcher = document.createElement('div');launcher.id = 'yac-launcher';
  const ambientToggle = document.createElement('label');ambientToggle.className = 'yac-ambient-toggle';
  fields.enabled = document.createElement('input');fields.enabled.id = 'yac-enabled';fields.enabled.type = 'checkbox';fields.enabled.setAttribute('role', 'switch');
  const toggleTooltip = document.createElement('span');toggleTooltip.className = 'yac-tooltip';toggleTooltip.setAttribute('aria-hidden', 'true');
  ambientToggle.append(fields.enabled, toggleTooltip);
  const button = document.createElement('button');
  button.id = 'yac-settings-button';
  button.className = 'ytp-button';
  button.type = 'button';
  for (const [key, value] of Object.entries({
    'aria-label': '設定を開く', 'aria-haspopup': 'dialog',
    'aria-expanded': 'false', 'aria-controls': 'yac-controls'
  })) button.setAttribute(key, value);
  button.append(makeIcon('M9.5 3h5l.6 2.4 2 .9 2.2-.7 2.5 4.3-1.6 1.7v2.4l1.6 1.7-2.5 4.3-2.2-.7-2 .9-.6 2.4h-5l-.6-2.4-2-.9-2.2.7-2.5-4.3 1.6-1.7v-2.4L2.2 9.9l2.5-4.3 2.2.7 2-.9L9.5 3ZM15.5 12a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0Z'));
  const tooltip = document.createElement('span');
  tooltip.className = 'yac-tooltip';
  tooltip.textContent = 'アンビエント設定';
  tooltip.setAttribute('aria-hidden', 'true');
  button.append(tooltip);
  launcher.append(ambientToggle, button);

  const panel = document.createElement('div');
  panel.id = 'yac-controls';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'アンビエント設定');
  panel.style.setProperty('background-color', 'rgba(28, 28, 30, var(--yac-settings-opacity, .90))', 'important');
  // Direct DOM construction also works on pages requiring TrustedHTML.
  const root = panel.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = [
    ':host{position:absolute;right:12px;bottom:60px;z-index:2200;display:flex;flex-direction:column;box-sizing:border-box;width:340px;max-width:calc(100% - 24px);overflow:hidden;color:#f5f5f7;font:14px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;text-align:left;text-shadow:none;background:rgba(28,28,30,var(--yac-settings-opacity,.90))!important;border:1px solid rgba(255,255,255,calc(.18 * var(--yac-settings-level,1)))!important;border-radius:24px!important;box-shadow:0 8px 32px rgba(0,0,0,calc(.2 * var(--yac-settings-level,1)))!important;backdrop-filter:blur(calc(18px * var(--yac-settings-level,1)));-webkit-backdrop-filter:blur(calc(18px * var(--yac-settings-level,1)));color-scheme:dark}',
    ':host([hidden]),[hidden]{display:none!important}*{box-sizing:border-box}.body{padding:0 12px 8px;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin}',
    ':host{--yac-detail-height:460px}:host([data-page=appearance]){--yac-detail-height:360px}:host([data-page=rendering]){--yac-detail-height:340px}:host([data-page=safety]){--yac-detail-height:210px}',
    'header{display:flex;flex-shrink:0;align-items:center;gap:8px;min-height:52px;padding:8px 12px}h2{flex:1;min-width:0;margin:0;font-size:15px;font-weight:600}',
    'button{display:inline-flex;align-items:center;justify-content:center;min-width:32px;min-height:32px;padding:0;color:inherit;background:transparent;border:0;border-radius:50%;font:inherit;cursor:pointer}button:hover{background:rgba(255,255,255,calc(.10 * var(--yac-settings-level,1)))}.close{background:rgba(255,255,255,calc(.08 * var(--yac-settings-level,1)))}svg{flex-shrink:0}',
    '.menu-item{display:flex;width:100%;gap:12px;min-height:58px;padding:8px;border-radius:14px;text-align:left}.menu-item+.menu-item{border-top:1px solid rgba(255,255,255,calc(.06 * var(--yac-settings-level,1)))}.menu-copy{flex:1;min-width:0}.menu-title{display:block;font-weight:500}.menu-description{display:block;margin-top:2px;color:#c3c3ca;font-size:11px}.menu-icon{display:flex;color:#c4d0f7}',
    'select{min-width:0;max-width:48%;padding:6px 8px;border:1px solid rgba(255,255,255,calc(.18 * var(--yac-settings-level,1)));border-radius:10px;background:rgba(255,255,255,calc(.06 * var(--yac-settings-level,1)));color:inherit;font:inherit;cursor:pointer}option{background:rgba(28,28,30,var(--yac-settings-level,1));color:#f5f5f7}',
    '.setting-row{position:relative;padding:10px 4px;border-top:1px solid rgba(255,255,255,calc(.08 * var(--yac-settings-level,1)))}.setting-row:first-child{border-top:0}.toggle,.language{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px}.toggle{flex-wrap:wrap}.setting-heading{display:flex;align-items:center;gap:6px;min-width:0}.toggle .setting-heading{flex:1}.setting-heading label{min-width:0;cursor:pointer}.slider-heading{display:flex;flex-wrap:wrap;align-items:center;gap:4px}.slider-heading output{margin-left:auto}',
    '.info{flex:0 0 28px;min-width:28px;min-height:28px;color:#c3c3ca;font-size:16px}.hint{display:none;flex-basis:100%;margin:8px 0 0;padding:8px 10px;background:rgba(255,255,255,calc(.06 * var(--yac-settings-level,1)));border-radius:10px;color:#f5f5f7;font-size:12px;line-height:1.5}.setting-row[data-help-open=true] .hint{display:block}.applied{display:block;font-size:11px;color:#c3c3ca;font-weight:400}',
    'input{accent-color:#fff}input[type=range]{appearance:none;display:block;width:100%;height:28px;margin:4px 0 0;padding:0;cursor:pointer;background:transparent}',
    'input[type=range]::-webkit-slider-runnable-track{height:5px;border-radius:4px;background:linear-gradient(to right,#fff 0%,#fff var(--progress),#ffffff38 var(--progress),#ffffff38 100%)}input[type=range]::-webkit-slider-thumb{appearance:none;width:20px;height:20px;margin-top:-7.5px;border:0;border-radius:50%;background:white;box-shadow:0 1px 4px #0003}',
    'input[type=range]::-moz-range-track{height:5px;background:#ffffff38;border-radius:4px}input[type=range]::-moz-range-progress{height:5px;background:white;border-radius:4px}input[type=range]::-moz-range-thumb{width:20px;height:20px;border:0;border-radius:50%;background:white}',
    'input[type=checkbox]{appearance:none;position:relative;margin:0;flex:0 0 36px;width:36px;height:22px;border-radius:14px;background:#66666b;cursor:pointer}',
    'input[type=checkbox]::before{content:"";position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:white;transition:transform .12s}',
    'input[type=checkbox]:checked{background:#30d158}input[type=checkbox]:checked::before{transform:translateX(14px)}',
    'output{flex-shrink:0;color:inherit;text-align:right;font-variant-numeric:tabular-nums}p.status{margin:4px 4px 0;padding:8px 0 4px;border-top:1px solid rgba(255,255,255,calc(.08 * var(--yac-settings-level,1)));font-size:11px;color:#c3c3ca}',
    '.save-error{margin:8px;padding:12px;border:1px solid #ffffff38;border-radius:8px;font-size:12px;color:#eee}.save-error[hidden]{display:none}.save-error button{display:block;width:auto;height:auto;min-height:36px;margin-top:8px;padding:6px 12px;border:1px solid #ffffff38;font:inherit}.save-error button[aria-disabled=true]{opacity:.6;cursor:wait}',
    ':focus-visible{outline:2px solid white;outline-offset:2px}@media(pointer:coarse){:host{--yac-detail-height:540px}:host([data-page=appearance]){--yac-detail-height:440px}:host([data-page=rendering]){--yac-detail-height:400px}:host([data-page=safety]){--yac-detail-height:250px}button{min-height:44px;min-width:44px}.info{flex-basis:44px}.setting-row{padding-block:12px}input[type=range]{height:40px}}@media(prefers-reduced-motion:reduce){input[type=checkbox]::before{transition:none}}'
  ].join('\n');
  root.append(style);
  const body = document.createElement('div');
  body.className = 'body';
  root.append(body);
  const header = document.createElement('header');
  const heading = document.createElement('h2');
  heading.textContent = '設定';
  const back = document.createElement('button');back.id = 'yac-settings-back';back.type = 'button';back.hidden = true;back.append(makeIcon('M15 5l-7 7 7 7'));
  const close = document.createElement('button');
  close.type = 'button';
  close.id = 'yac-settings-close';close.className = 'close';close.append(makeIcon('M6 6l12 12M18 6 6 18'));
  close.setAttribute('aria-label', '設定を閉じる');
  header.append(back, heading, close);
  root.append(header, body);
  const menu = document.createElement('nav');menu.id = 'yac-settings-menu';
  const pages = {}, menuLabels = {}, menuDescriptions = {}, menuButtons = {};
  const groups = {
    appearance: ['radial', 'strength', 'blur', 'saturation'],
    surfaces: ['surfaceMultiplier', 'controlDensity', 'readingDensity', 'navigationDensity'],
    rendering: ['avoidBars', 'fillBars', 'inset', 'fps'],
    safety: ['flashWarning', 'language']
  };
  const categoryIcons = { appearance: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z', surfaces: 'M4 7h6M14 7h6M4 17h10M18 17h2M10 4v6M14 14v6', rendering: 'M7 3v14h14M3 7h14v14', safety: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4ZM8 12l3 3 5-6' };
  let currentPage = '', helpRow = null, helpPinned = false, hoveredHelpRow = null, focusedHelpRow = null;
  const dismissedHelpRows = new Set();
  function hideHelp(dismiss = false) {
    if (!helpRow) return;
    const previous = helpRow;
    previous.removeAttribute('data-help-open');
    previous.querySelector('.hint').hidden = true;
    previous.querySelector('.info').setAttribute('aria-expanded', 'false');
    if (dismiss) dismissedHelpRows.add(previous);
    helpRow = null;helpPinned = false;
  }
  function showHelp(row, pin = false) {
    if (!pin && dismissedHelpRows.has(row)) return;
    if (helpRow === row) { if (pin) helpPinned = true;return; }
    hideHelp();helpRow = row;helpPinned = pin;
    row.setAttribute('data-help-open', 'true');
    row.querySelector('.hint').hidden = false;
    row.querySelector('.info').setAttribute('aria-expanded', 'true');
  }
  function resetHelp() {
    hideHelp();hoveredHelpRow = null;focusedHelpRow = null;dismissedHelpRows.clear();
  }
  for (const key of Object.keys(groups)) {
    const item = document.createElement('button');item.type = 'button';item.className = 'menu-item';item.id = 'yac-menu-' + key;
    item.setAttribute('aria-controls', 'yac-page-' + key);
    const icon = document.createElement('span');icon.className = 'menu-icon';icon.append(makeIcon(categoryIcons[key]));
    const copy = document.createElement('span');copy.className = 'menu-copy';
    menuLabels[key] = document.createElement('span');menuLabels[key].className = 'menu-title';
    menuDescriptions[key] = document.createElement('span');menuDescriptions[key].className = 'menu-description';
    copy.append(menuLabels[key], menuDescriptions[key]);item.append(icon, copy, makeIcon('M9 6l6 6-6 6'));menu.append(item);menuButtons[key] = item;
    const page = document.createElement('section');page.id = 'yac-page-' + key;page.hidden = true;pages[key] = page;
    listen(item, 'click', () => showPage(key, true));
  }
  function showPage(key = '', focus = false) {
    resetHelp();
    currentPage = key;panel.setAttribute('data-page', key);menu.hidden = !!key;back.hidden = !key;
    for (const [name, page] of Object.entries(pages)) page.hidden = name !== key;
    heading.textContent = translations[settings.language][key || 'title'];body.scrollTop = 0;
    positionPanel();
    if (focus) (key ? back : menuButtons.appearance).focus({ preventScroll: true });
  }
  function fieldRow(key, type) {
    const row = document.createElement('div');row.className = 'setting-row ' + type;
    const copy = document.createElement('span');copy.className = 'setting-heading';
    const label = document.createElement('label');label.htmlFor = 'yac-' + key;fieldLabels[key] = document.createTextNode('');label.append(fieldLabels[key]);copy.append(label);
    let hint;
    if (key !== 'language') {
      const info = document.createElement('button');info.type = 'button';info.className = 'info';info.textContent = 'ⓘ';info.setAttribute('aria-expanded', 'false');info.setAttribute('aria-controls', 'yac-' + key + '-hint');infoButtons[key] = info;
      hint = document.createElement('span');hint.id = 'yac-' + key + '-hint';hint.className = 'hint';hint.hidden = true;hint.setAttribute('role', 'tooltip');descriptions[key + 'Description'] = hint;
      info.setAttribute('aria-describedby', hint.id);
      copy.append(info);row.append(hint);fields[key].setAttribute('aria-describedby', hint.id);
      listen(info, 'pointerenter', event => {
        if (event.pointerType === 'touch') return;
        hoveredHelpRow = row;dismissedHelpRows.delete(row);showHelp(row);
      });
      listen(row, 'pointerleave', () => {
        if (hoveredHelpRow === row) hoveredHelpRow = null;
        if (helpRow === row && !helpPinned && focusedHelpRow !== row) hideHelp();
      });
      listen(info, 'focus', () => {
        focusedHelpRow = row;dismissedHelpRows.delete(row);showHelp(row);
      });
      listen(info, 'blur', () => {
        if (focusedHelpRow === row) focusedHelpRow = null;
        if (helpRow === row && !helpPinned && hoveredHelpRow !== row) hideHelp();
      });
      listen(info, 'click', () => {
        if (helpRow === row && helpPinned) hideHelp(true);
        else { dismissedHelpRows.delete(row);showHelp(row, true); }
      });
    }
    row.append(copy);
    return { row, copy, hint };
  }
  fields.language = document.createElement('select');
  fields.language.id = 'yac-language';
  fields.language.setAttribute('aria-label', translations.ja.language);
  for (const [value, name] of [['ja', '日本語'], ['en', 'English']]) {
    const option = document.createElement('option');
    option.value = value; option.textContent = name;
    fields.language.append(option);
  }
  const languageRow = fieldRow('language', 'language');languageRow.row.append(fields.language);pages.safety.append(languageRow.row);
  for (const key of booleanKeys.filter(key => key !== 'enabled')) {
    fields[key] = document.createElement('input');
    fields[key].type = 'checkbox';
    fields[key].id = 'yac-' + key;
    fields[key].setAttribute('role', 'switch');
    const { row, hint } = fieldRow(key, 'toggle');row.append(fields[key], hint);
    pages[Object.keys(groups).find(name => groups[name].includes(key))].append(row);
  }
  for (const [key, min, max] of [
    ['surfaceMultiplier', 0, 1], ['controlDensity', 0, 100], ['readingDensity', 0, 100], ['navigationDensity', 0, 100],
    ['strength', 15, 100], ['blur', 0, 160], ['saturation', 0, 250], ['inset', 0, 40], ['fps', 24, 60]
  ]) {
    fields[key] = document.createElement('input');
    fields[key].id = 'yac-' + key;
    fields[key].type = 'range';
    fields[key].min = min;
    fields[key].max = max;
    fields[key].step = key === 'surfaceMultiplier' || key.endsWith('Density') ? 'any' : '1';
    outputs[key] = document.createElement('output');
    const { row, copy, hint } = fieldRow(key, 'slider-label');
    const sliderHeading = document.createElement('div');sliderHeading.className = 'slider-heading';sliderHeading.append(copy, outputs[key]);row.append(sliderHeading, fields[key], hint);
    pages[Object.keys(groups).find(name => groups[name].includes(key))].append(row);
  }
  pages.safety.append(languageRow.row);
  const status = document.createElement('p');
  status.className = 'status';
  function createSaveNotice() {
    const container = document.createElement('div');container.className = 'save-error';container.hidden = true;
    container.setAttribute('role', 'alert');
    const message = document.createElement('span');
    const retry = document.createElement('button');retry.type = 'button';
    container.append(message, retry);
    return { container, message, retry };
  }
  const panelSaveNotice = createSaveNotice();
  body.append(menu, ...Object.values(pages), panelSaveNotice.container, status);
  let statusKey = 'waiting';
  function setStatus(key) {
    statusKey = key;
    const text = translations[settings.language][key];
    if (status.textContent !== text) status.textContent = text;
  }
  function localize() {
    const text = translations[settings.language];
    heading.textContent = text[currentPage || 'title'];
    tooltip.textContent = open ? text.close : text.openSettings;
    button.setAttribute('aria-label', tooltip.textContent);
    fields.enabled.setAttribute('aria-label', text.enabled);
    toggleTooltip.textContent = text.enabled + ' · ' + (settings.enabled ? text.on : text.offState);
    panel.setAttribute('aria-label', text.title);
    panel.lang = settings.language;
    close.setAttribute('aria-label', text.close);
    back.setAttribute('aria-label', text.back);
    fields.language.value = settings.language;
    menu.setAttribute('aria-label', text.title);
    for (const key of Object.keys(groups)) {
      menuLabels[key].textContent = text[key];menuDescriptions[key].textContent = text[key + 'Description'];pages[key].setAttribute('aria-label', text[key]);
    }
    for (const [key, info] of Object.entries(infoButtons)) info.setAttribute('aria-label', text[key] + ' · ' + text.info);
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
    if (open) showPage();
    else resetHelp();
    localize();
    button.setAttribute('aria-expanded', String(open));
    player?.classList.toggle('yac-settings-open', open);
    positionPanel();
    if (open) {
      menuButtons.appearance.focus({ preventScroll: true });
    } else if (returnFocus && button.isConnected) button.focus();
  }
  listen(button, 'click', event => { event.stopPropagation(); setOpen(!open); });
  listen(launcher, 'click', event => event.stopPropagation());
  listen(launcher, 'dblclick', event => { event.preventDefault();event.stopPropagation(); });
  listen(launcher, 'keydown', event => {
    event.stopPropagation();
  });
  listen(launcher, 'keyup', event => event.stopPropagation());
  listen(close, 'click', () => setOpen(false, true));
  listen(back, 'click', () => { const previous = currentPage;showPage();menuButtons[previous]?.focus({ preventScroll: true }); });
  listen(panel, 'click', event => event.stopPropagation());
  listen(panel, 'dblclick', event => { event.preventDefault(); event.stopPropagation(); });
  listen(panel, 'keydown', event => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      // Help is dismissed first, including hover/focus-only help. Do not move
      // focus or reopen it while the same trigger remains hovered/focused.
      if (helpRow) hideHelp(true);
      else if (currentPage) { const previous = currentPage;showPage();menuButtons[previous]?.focus({ preventScroll: true }); }
      else setOpen(false, true);
    }
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
  function focusedElement() {
    let element = document.activeElement;
    while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
    return element;
  }
  function closeFlashWarning(returnFocus = true) {
    if (!flashWarningOpen) return;
    flashWarningOpen = false;warningPresentation++;reductionPresentation = null;
    reducingWarning = retryingWarning = false;
    warningReduce.removeAttribute('aria-busy');warningSaveNotice.retry.removeAttribute('aria-disabled');
    warningDialog.close();flashMonitor.reset();
    if (returnFocus) {
      const target = warningFocus?.isConnected ? warningFocus : button;
      target.focus({ preventScroll: true });
      // A connected opener can have become hidden or disabled during the modal.
      // Verify the browser accepted focus instead of leaving it on the page body.
      if (focusedElement() !== target && button.isConnected) button.focus({ preventScroll: true });
    }
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
    warningFocus = focusedElement();
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
  function apply(renderChanged = true) {
    localize();
    localizeWarning();
    // One saved preference derives the palette for every supported face. This
    // runs on settings changes only, never in the video/frame/message loop.
    const palette = YacSettingsStore.surfacePalette(settings);
    const declarations = Object.entries(palette).map(([key, value]) => key + ':' + value).join(';');
    const paletteText = `html.yac-active{${declarations}}:root{--yac-settings-opacity:${palette['--yac-settings-opacity']};--yac-settings-level:${palette['--yac-navigation-level']};--yac-launcher-opacity:${palette['--yac-control-opacity']};--yac-launcher-level:${palette['--yac-control-feedback']}}`;
    if (paletteStyle.textContent !== paletteText) { paletteStyle.textContent = paletteText;syncChat(); }
    updateAppearance();
    button.classList.toggle('yac-enabled', settings.enabled);
    for (const key of booleanKeys) {
      fields[key].checked = settings[key];
      fields[key].setAttribute('aria-checked', String(settings[key]));
    }
    for (const key of ['strength', 'blur', 'saturation', 'inset', 'fps', 'surfaceMultiplier', 'controlDensity', 'readingDensity', 'navigationDensity']) {
      fields[key].value = settings[key];
      fields[key].style.setProperty('--progress', (settings[key] - Number(fields[key].min)) / (Number(fields[key].max) - Number(fields[key].min)) * 100 + '%');
      const text = translations[settings.language];
      const number = Math.round(settings[key] * 1000) / 1000;
      const valueText = key === 'surfaceMultiplier' ? '× ' + number : number + (key === 'blur' ? ' px' : key === 'fps' ? ' FPS' : '%');
      outputs[key].textContent = valueText;
      let appliedText = '';
      if (key.endsWith('Density')) {
        appliedText = text.applied + ' ' + Math.round(settings[key] * settings.surfaceMultiplier * 10) / 10 + '%';
        const applied = document.createElement('span');applied.className = 'applied';applied.textContent = appliedText;outputs[key].append(applied);
      }
      fields[key].setAttribute('aria-valuetext', valueText + (appliedText ? ' · ' + appliedText : ''));
    }
    if (renderChanged) {
      lastDrawFrame = 0;
      invalidateFrame(false);
    }
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
    panel.style.width = Math.min(340, Math.max(1, player.clientWidth - 24)) + 'px';
    panel.style.bottom = bottom + 'px';
    const availableHeight = Math.max(1, player.clientHeight - bottom - 8);
    panel.style.maxHeight = availableHeight + 'px';
    // Help expands inside a stable detail page. A bottom-anchored auto-height
    // panel would move the hovered info button and repeatedly hide/show it.
    panel.style.height = currentPage ? 'min(var(--yac-detail-height, 460px), ' + availableHeight + 'px)' : 'auto';
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
    const scalar = (property, fallback, maximum = 1) => {
      const value = palette.getPropertyValue(property).trim(), number = Number(value);
      return value && Number.isFinite(number) && number >= 0 && number <= maximum ? number : fallback;
    };
    const safeBlur = (property, fallback) => {
      const value = palette.getPropertyValue(property).trim();
      return /^\d+(?:\.\d+)?px$/.test(value) && parseFloat(value) <= 64 ? value : fallback;
    };
    const text = `html.yac-chat-active{--yac-control-rgb:${safeRgb};
      --yac-control-opacity:${scalar('--yac-control-opacity', .22)};
      --yac-control-hover-opacity:${scalar('--yac-control-hover-opacity', .34)};
      --yac-control-selected-opacity:${scalar('--yac-control-selected-opacity', .44)};
      --yac-reading-opacity:${scalar('--yac-reading-opacity', .64)};
      --yac-chat-header-opacity:${scalar('--yac-chat-header-opacity', .12)};
      --yac-chat-overlay-opacity:${scalar('--yac-chat-overlay-opacity', .13)};
      --yac-control-blur:${safeBlur('--yac-control-blur', '12px')};
      --yac-reading-blur:${safeBlur('--yac-reading-blur', '12px')};
      --yac-control-feedback:${scalar('--yac-control-feedback', 1)};
      --yac-control-dark-brightness:${scalar('--yac-control-dark-brightness', .50)};
      --yac-control-dark-hover-brightness:${scalar('--yac-control-dark-hover-brightness', .40)};
      --yac-control-light-contrast:${scalar('--yac-control-light-contrast', .10)};
      --yac-control-light-brightness:${scalar('--yac-control-light-brightness', 1.8, 2)};
      --yac-navigation-level:${scalar('--yac-navigation-level', 1)};
      --yac-navigation-blur:${safeBlur('--yac-navigation-blur', '16px')};
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
    const videoChanged = video !== nextVideo;
    if (videoChanged) {
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
    if (toolbar && launcher.parentElement !== toolbar) toolbar.insertBefore(launcher, gear || toolbar.firstChild);
    if (player && panel.parentElement !== player) player.append(panel);
    if (player && barLayer.parentElement !== player) player.prepend(barLayer);
    launcher.hidden = location.pathname !== '/watch';
    button.hidden = launcher.hidden;
    if (launcher.hidden || !toolbar || !player) setOpen(false);
    positionPanel();
    syncChat();
    refreshPageSurfaces();
    // Discovery can remove a video while playback is already unavailable.
    // Apply that transition once even when the animation loop is waiting.
    if (videoChanged) draw();
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
  let frameRunnable = false;
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
    const active = settings.enabled && !document.fullscreenElement;
    const monitoring = wantsMonitoring();
    const runnable = settingsLoaded && location.pathname === '/watch' && !document.hidden &&
      (active || monitoring) && canvas.isConnected && video && !video.seeking && video.readyState >= 2;
    if (!runnable) {
      // Preserve the existing cleanup when playback becomes unavailable, then
      // leave DOM styling and warning history alone while it stays unavailable.
      if (frameRunnable) draw(false);
      frameRunnable = false;
      return;
    }
    frameRunnable = true;
    const fresh = frameVideo === video ? frameSerial !== submittedSerial :
      video !== lastSampleVideo || video.currentTime !== lastSampleTime;
    // A paint deadline stays latched for the next decoded frame. It should not
    // repeatedly enter DOM work between frames or while waiting for playback.
    if (!fresh && !(active && (forcePaint || geometryCheckDue))) return;
    // Warning sampling follows the display tick, independently of the chosen
    // background FPS. One Worker job at a time still provides backpressure.
    if (paintDue || monitoring) draw(false);
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
    launcher.remove(); panel.remove(); canvas.remove(); barLayer.remove();paletteStyle.remove();
  }, { once: true });
  apply(); discover(); draw();
  frameRequest = requestAnimationFrame(animate);
  const settingsStore = new YacSettingsStore(extension.storage, settings, {
    onChange(snapshot, { loaded, error, saveError: nextSaveError }) {
      if (disposed) return;
      const changedKeys = Object.keys(snapshot).filter(key => snapshot[key] !== settings[key]);
      const loadChanged = loaded !== settingsLoaded;
      const changed = loadChanged || changedKeys.length > 0;
      // Palette/language edits do not invalidate an in-flight Worker frame or
      // force a video capture. Ambient and warning preferences keep that path.
      const renderChanged = loadChanged || changedKeys.some(key => !uiOnlySettings.has(key));
      if (snapshot.flashWarning !== settings.flashWarning) { flashMonitor.reset();warnedVideoKey = ''; }
      settingsLoaded = loaded;Object.assign(settings, snapshot);
      saveError = nextSaveError;
      if (error && !nextSaveError) console.warn(error);
      if (changed) { apply(renderChanged);if (renderChanged) draw(); }
      else renderSaveErrors();
    }
  });
})();
