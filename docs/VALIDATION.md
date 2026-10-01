# 検証結果 — 0.2.18 development / 2026-10-01

## 0.2.18 GPU projection, chat shade and scroll blur

- WebGL2 projection runs inside the existing packaged Worker. Analysis uses the
  same 160x90 canvas and 320x180 detector. Shared projection geometry preserves
  crop, inset and scroll blend. GPU output has no pixel readback or CPU output
  pixel loop. Startup, shader/texture failures, context loss and upload exceptions
  fall back permanently to a separate 2D output canvas without inspecting twice
  or resetting the detector. Transport still owns at most one frame.
- In the actual in-app browser, 13 static image cases passed GPU/2D comparisons
  for orientation, radial/flat/blended projection, fractional inset/offscreen
  positions, resize, extreme aspect ratio and confirmed letter/pillarboxes.
  Average channel error was 0 except the 35% blend case (0.2412/255); no pixel
  exceeded 8 channel levels. A packaged Worker rendered a real transferred
  bitmap with WebGL2 and returned matching crop/pixels. Forced context loss
  preserved detector state and returned matching 2D output.
- One warmed static batch of 80 inspection/projection jobs took 52.5ms with 2D
  and 2.6ms with WebGL2, including GPU completion. It excluded video capture,
  transfer, bar/flash readback, CSS blur and YouTube. This does not establish an
  installed-extension or end-to-end YouTube speedup.
- Chat paints one shared selected-control shade on the actual iframe box, with
  transparent document wrappers. Its header and menus use the same palette.
  Actual browser fixture checks preserve native SVG icons and member/paid/card
  colors and verify OFF restoration and theater interaction.
- Full-frame scroll blur is `max(25px, configuredBlur / 2)`, smoothly interpolated
  with scroll blend. Main and Worker controller tests cover 0/40/90/160 settings,
  the floor, transition, saved-value preservation and scrolling back.
- The YouTube URL remained blocked by a saved browser permission setting.
  Current installed Chrome/Firefox appearance, chat-icon root cause and actual
  comment-loading/CPU/GPU cost remain unverified. No access workaround was used.

API references: [Offscreen WebGL contexts](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/getContext),
[WebGL readback and allocation guidance](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).

## 0.2.17 store submission compatibility

- Removed `gecko_android` before AMO submission. AMO's upload UI locked Android
  compatibility ON when this metadata was present, despite the desktop-only
  scope. No Android playback/UX verification has been performed. Desktop Firefox
  minimum 140 and the no-data-collection declaration are unchanged.
- Compatibility follows [Mozilla's version compatibility guidance](https://extensionworkshop.com/documentation/publish/version-compatibility/).
- Rebuilt packages and re-ran Firefox lint: 0 errors, 1 warning, 0 notices.
  The warning concerns Android 140 not supporting the data-consent declaration;
  Android is excluded from this submission. AMO shows Firefox checked and Android
  unchecked and editable after removing the metadata.

## 0.2.17 comment-load competition and frame pacing

- Removed the unconditional whole-page surface scan from every-second discovery
  and player resize. Structural changes schedule one coalesced idle callback,
  with a timer fallback and a one-second refresh rate limit. Theater/player-mode
  changes sync immediately. Background OFF restores tracked styles immediately.
- The real controller with deterministic DOM/clock tests performs no additional
  surface scans during stable discovery, loading 50 comment threads, unrelated
  playback/comment classes, or hidden-tab changes. Late ticket/transcript panels,
  new inline theme values, resize bursts, theater enter/exit, resume, OFF and
  disposal preserve transparency and restore the latest original style.
- Worker `canAcceptFrame()` is checked before geometry/computed-style work.
  Worker startup/ready/failure/disposal state is recorded on the background canvas.
  No capture queue is introduced. Repeated opacity and clip writes are skipped.
- Feature-detected video-frame callbacks supply a new-frame serial; callbacks
  themselves remain on the main thread. Sampling and background paint deadlines
  are separate, so sample-only jobs are not captured again at a later paint tick.
  Unchanged-frame geometry probes follow background FPS; busy frames skip them.
  Unsupported browsers retain the existing display-tick path.
- Main and Worker controller tests capture 90 frames in three seconds for 30 FPS
  video at 120 Hz, with background settings of 24/30/60 FPS. The real flash monitor
  retains its sustained three-second trigger on those numeric timestamp streams.
  Paused bar convergence, forced geometry/preferences, seek, same/new video
  replacement, hidden/resume, stale callbacks, rejection/backpressure, fallback
  and disposal are tested. No visibly flashing video is shown by these tests.
- The browser tool again rejected the current YouTube tab due to a saved access
  setting. Actual comment-load latency and installed-extension CPU/GPU cost remain
  unmeasured; these tests prove control flow, not a measured browser speedup.

API behavior: [video-frame callbacks](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback),
[idle callbacks](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback).

## 0.2.16 lighter shared controls

- Reduced common paint opacity from .28/.40/.50 to .22/.34/.44 for normal,
  hover and selected controls. RGB, blur, borders and state priority are unchanged.
  Actual installed-extension appearance remains unverified.

## 0.2.15 shared dark control palette

- `ambient.css` now defines one control RGB value, normal/hover/selected paint
  opacity and blur. Defaults are RGB 18/20/25, opacity .28/.40/.50 and 12px blur.
  Search input/button, Enhancer toolbar, native modern/legacy Tonal/Outline/
  Filled faces, filter chips and chip-navigation buttons consume this palette.
  Text-only buttons keep transparent resting faces and use the shared hover face.
- Control overrides are scoped to component faces; DeepDark's layout/playlist
  variables keep their existing values. Toolbar and search use the same face. Selected chip
  and pressed faces take precedence over hover; disabled opacity, geometry,
  native focus outlines, SVG fills and feedback layers are left to the components.
- Filled neutral buttons and selected chips use theme-sensitive primary text
  without `!important`, so the theme's accent and hover text colors can win.
  Search borders and input focus from 0.2.13 are retained.
- Syntax checks, all nine fixture inline-script parses, exact package/source
  archive checks and SHA-256 validation pass. Mozilla web-ext 9.4 reports zero
  errors, notices and warnings. Independent source review checked state priority,
  text accents and separation from the currently playing playlist row.
- Combine `?search&controls&enhancer` with `&theme=deepdark` or `&light` for the
  self-authored manual fixture. These source changes do not establish installed
  Chrome/Firefox appearance; actual bright/dark scenes and interaction remain
  unverified because the browser's saved access setting blocks the YouTube tab.

## 0.2.13 search-field surface

- Removed the fully transparent masthead search-face rule. Modern lowercase and
  uppercase class names and the legacy input container now have light/dark
  translucent backgrounds and visible border colors; input focus keeps the
  theme's accent color with YouTube's action color as fallback. Search buttons
  also keep a translucent face, while inner inputs remain transparent to avoid
  stacking fills. Native size, padding, radius and text colors are untouched.
- DeepDark uses `--main-background` for both the search background and border.
  The transparent masthead variable therefore erased both. The new legacy
  selector includes `.ytd-searchbox` to outrank the theme's mode-specific rule.
  The JavaScript surface guard does not select these search controls.
- Added `?search` to the self-authored fixture for current lowercase/uppercase
  and legacy markup. Combine it with `&light` or `&theme=deepdark`, then focus
  each input and switch ambient OFF/ON. Fixture syntax and package checks do
  not prove rendered appearance.
- `npm run check`, all nine fixture inline-script syntax checks and the exact
  Chrome/Firefox/source archive and SHA-256 checks pass. Mozilla web-ext 9.4
  reports zero errors, notices and warnings. Independent source review confirms
  normal/focus selector priority over DeepDark and removal with `yac-active`.
- The browser tool still rejects the actual YouTube tab, citing a saved access
  setting. Installed Chrome/Firefox appearance, focus/clear/suggestions and
  OFF restoration remain unverified. No alternate browser route was used.

## 0.2.12 controller, display boundaries and sampling

- Added a rendering-free inspection mode. Warning sampling now continues with
  ambient OFF and in fullscreen, follows display ticks rather than background
  FPS, and accounts for playback rate. Fullscreen modal host placement and
  unchanged playback/ambient choices are exercised by controller tests.
- Separate sampling and display crops preserve observed bright glyphs inside
  bars while keeping the clean sampling ROI. A 320×180 observation cannot prove
  protection of thin/dark text lost during reduction; actual video checks remain.
- Cached projection indices produce exactly the previous RGBA output in the
  numerical geometry/inset cases. This avoids repeated projection math; it is
  not a measurement of total GPU/compositing or installed-extension cost.
- Per-key local preferences prevent unrelated saves in another tab from
  re-enabling warnings. Initial reads are gated, pending input is preserved,
  storage echoes are deduplicated and subscriptions are disposed.
- Seeking and zero geometry wait without rendering; the Worker keeps one job
  and suspends its watchdogs while the document is hidden. External clip changes
  are preserved when ambient restores the video.
- Fixed the light page base, the double-painted modern contextual menu under the
  observed DeepDark wrapper, and flexy/grid styling scope. Fixture light mode now
  includes normal text/buttons, not just popup surfaces.
- `npm run check` and all six `npm test` suites pass. Numerical tests show no
  flashing imagery. Main and asynchronous Worker callbacks are tested through
  the actual controller using a deterministic DOM; this is not browser rendering.
- Chrome/Firefox 0.2.12 ZIPs and source archives are built and checked against
  the exact workspace sources, explicit file lists and SHA-256 sums. Scope
  remains YouTube-only with the storage permission and one Worker-host resource.
  Mozilla web-ext 9.4 reports zero errors, warnings and notices.
- The normal browser tool still rejects YouTube access with a saved access
  setting after explicit authorization. No workaround was used. Current native
  chat icon failure and Chrome/Firefox visual/performance gates remain open in
  [QUALITY-GATES.md](QUALITY-GATES.md). Historical browser evidence below belongs
  to its stated revision; public/store distribution remains 0.2.2.

## 0.2.11 Worker and black-bar integration

- Background color processing and rendering now run in a dedicated bundled
  Worker, reached through a packaged extension-origin iframe and MessageChannel.
  Video capture/presentation and native UI transparency stay on the page. One
  job is in flight; busy frames are dropped instead of queued. Startup/render
  timeouts and unsupported capture return to the synchronous canvas renderer.
- Detection uses 320×180 pixels; color rendering and flash-warning samples stay
  at 160×90. The detector requires flat dark bands, symmetric pairs, visible
  inner boundaries and broad interior content. Four observations establish
  bands; smaller verified bands protect newly visible picture pixels promptly,
  while expansion/refinement is debounced. Display crop and color sampling crop
  are separate. No video resize is performed.
- `test:bars` passes for noisy/limited-range black, vertical/horizontal/mixed
  bands, small subtitles/logos, dark/gradient/central-logo holdouts, jitter,
  disappearing bands, source changes/seeks, and 160/320 coordinate consistency.
  Numeric Node benchmarking measures the detector alone, excluding capture,
  canvas readback, rendering and GPU composition; it is not an end-to-end FPS claim.
- `test:worker` passes for bridge origin/token checks, single-job backpressure,
  stale result rejection, bitmap closing, settings invalidation without losing
  bar history, source/seek reset, failures/timeouts, teardown and bounded output.
- Review found and corrected old capture coordinates clipping the picture during
  scrolling. Physical crop now uses current video bounds. Resize immediately
  removes old pixel clip values. Visual-setting updates invalidate stale frames
  while keeping confirmed bar history.
- The new playlist header and non-selected rows use a 46% surface with 12px blur;
  the native selected row is unchanged and duplicate parent fills are removed.
- The current integrated version has not been visually verified in a browser.
  The in-app browser's saved access preference blocks the localhost fixture.
  Actual Chrome/Firefox extension iframe/Worker startup, performance, native
  playlist appearance and the earlier chat-header icon issue remain unverified.
  Earlier fixture results below predate this Worker integration. Public/store
  distribution remains 0.2.2.
- Firefox desktop remains at manifest minimum 140; an explicit Android minimum
  142 matches support for the existing no-data-collection declaration. This is
  manifest compatibility metadata, not verified Android playback support.
  [Mozilla reference](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/).

## 0.2.11 rapid-flash warning and chat surfaces

- Added a default-on warning preference in Advanced settings. The coarse detector samples the renderer's existing in-memory pixels for sustained opposing luminance/red transitions over about three seconds. No new permission, network request, recording or third-party code is added.
- Numeric-only tests pass at 24/30/60 FPS for rapid luminance and red changes. Short bursts, slow transitions, static frames, small changes and small flashing areas do not trigger this heuristic. Quiet intervals, source changes, seeks, missing pixels and timing gaps reset detection. Tests display no flashing imagery.
- Verified Japanese and English modal text in Chromium using a self-authored fixture trigger without flashing imagery. Native showModal supplies top-layer placement and a 48% dark backdrop. Video time advances while the warning is open; ambient remains enabled and its strength is unchanged until the user chooses the 15% action.
- Verified close/Escape preserve playback and strength, 15% persists after reload, and Don't show again remains disabled after reload. Advanced settings can re-enable the warning. Detection and reduced opacity do not guarantee safety; small regions/patterns, protected pixels and unsampled flashing can be missed.
- Live inspection identified yt-video-metadata-carousel-view-model for the replay prompt and embedded-chat ytd-menu-popup-renderer / ytd-engagement-panel-section-list-renderer for the menu/top-fans surfaces. Self-authored fixture checks confirm 46% / 12px blur for the carousel and one 86% / 16px blur for chat panels. OFF restores opaque original surfaces and keeps settings open; native fixture SVGs remain intact.
- The user reports persistent missing chat-header icons after theater mode in the right in-app browser. Live inspection also found empty native SVG slots and iframe detach/recreation during mode changes; some later observations show YouTube repopulating the icons. This is unresolved. The attempted substitute-icon workaround was removed at the user's request.
- Actual installed YouTube/Firefox verification of the new warning and chat-surface rules remains pending reload. Public/store distribution remains on 0.2.2.

## Previous 0.2.10 verification

## 0.2.10 lighter Enhancer control bar

- User feedback showed the 72% background still looks like a solid dark strip. Live YouTube inspection confirmed the previous rule is applied: `rgba(28,28,28,.72)`, 12px blur, with no inline override. The visible issue is the chosen opacity, not a missing selector.
- Reduced the bar to 28% neutral dark opacity, increased backdrop blur to 16px and added a subtle 1px inset edge without changing its size or corner radius. Small icon drop shadows support readability; icon fills and interaction colors are unchanged.
- Compared 0.2.9 and 0.2.10 over identical self-authored bright pink/cyan backdrops under DeepDark. Verified the revised surface, unchanged 18px radius and icon fills, clickable active state and tooltip.
- Verified OFF restores the opaque bar, original shadow/filter state and native geometry, preserving the active icon color and keeping ambient settings open. ON re-enables the revised surface.
- Updated installed-extension appearance on actual YouTube/Firefox requires a reload of 0.2.10. Chrome/Firefox development packages use the same source; store publication remains on 0.2.2.

## Previous 0.2.9 verification

## 0.2.9 translucent Enhancer control bar

- Live YouTube inspection with Enhancer 3.0.19 identified `.efyt-control-bar.centered`, an opaque `rgb(24,24,24)` surface with an 18px radius. Its icon buttons are separate transparent children.
- Only the bar surface changes while ambient is active: 72% neutral dark background and 12px backdrop blur. Native geometry, position, icon/button styling and tooltip behavior are untouched. The toolbar remains excluded from the layout-only inline guard.
- Verified the self-authored toolbar fixture under the complete local DeepDark theme: translucent bar, unchanged 18px radius / 36px button targets / 24px icons, clickable state toggle, active icon color and hover tooltip.
- Verified OFF restores the opaque background and removes blur while preserving the button's active state. Ambient settings stay open; ON restores the translucent surface.
- Chrome/Firefox development packages are built from the same source. Updated installed-extension appearance on actual YouTube/Firefox remains pending a reload; store publication remains on 0.2.2.

## Previous 0.2.8 verification

## 0.2.8 portalled menus and dark translucent guide

- Inspected actual YouTube with Enhancer 3.0.19: modern three-dot menus use `yt-sheet-view-model` / `yt-contextual-sheet-layout`; notifications use `ytd-multi-page-menu-renderer` with an opaque simple header. These are children of the popup container outside the watch-page subtree.
- The guide has three stacked opaque surfaces: drawer contentContainer, guide-wrapper and guide-content. Only the drawer now supplies a 78% dark surface with 16px backdrop blur; its two structural inner surfaces are transparent. The drawer scrim, selected entries, hover feedback and native geometry are unchanged.
- Modern contextual menus, legacy report menus and notification panels get one 86% surface with 16px backdrop blur. Legacy listbox and notification header backgrounds are cleared without clearing row feedback or button faces.
- Verified late-opened surfaces in the Chromium fixture with the complete local DeepDark stylesheet, plus standard dark and light fixtures. Light mode uses translucent white surfaces to preserve native dark text; dark mode and the observed Enhancer theme link select dark surfaces.
- Verified DeepDark sidebar hover and selected fills remain, filled native buttons keep their original fill/text colors, and OFF restores all original panel backgrounds and removes the added blur. OFF continues to leave ambient settings open.
- Installed-extension verification on actual YouTube/Firefox requires reloading the development package. Live inspection establishes the selectors, not proof of the updated installed extension. Store publication remains on 0.2.2.

## Previous 0.2.7 verification

## 0.2.7 keep settings open when ambient is disabled

- Removed the enabled-input handler's automatic dialog closure. OFF now changes the background state without dismissing settings or moving focus.
- Verified in the Chromium fixture with DeepDark: OFF keeps the dialog visible, the switch focused and the off-state message visible. Adjusting blur while OFF is saved and retained after reload.
- Verified ON restores ambient in the same open dialog using the adjusted blur value. The close button and Escape still close the dialog and return focus to its player button.
- Installed-extension verification on actual YouTube/Firefox remains pending a reload of 0.2.7.

## Previous 0.2.6 verification

## 0.2.6 control-surface regression correction

- User feedback confirmed fully transparent 0.2.5 buttons lose their visible faces. The control-specific inline overrides, synthetic chip outline and forced light text are removed.
- Compared 0.2.2 from its Git tag with 0.2.6 on the same native-control fixture: button/chip backgrounds, text colors, corner radii, padding, borders and absence of inline face overrides match. Backdrop blur is added behind the existing fills.
- With the complete Enhancer DeepDark stylesheet, verified button/chip faces retain 14% white opacity and 12px backdrop blur. Information/ticket layout surfaces remain transparent.
- Verified clicking still focuses the action button and native hover feedback remains active (opacity 0.16).
- CSS has a separate document_start manifest entry; video runtime remains at document_idle. The layout guard is retained; YouTube/Enhancer JavaScript functions are not replaced.
- Verified the redesigned settings in Chromium with Japanese/English labels, three immediate appearance sliders, native expandable advanced settings, local preference persistence, every switch and slider, 24-60 FPS endpoints, native arrow/Home/End keys, readout units, scrollable small-player content and Escape focus restoration.
- Verified mutual exclusion with native settings in the fixture and requested OFF-close/focus behavior. Black-bar replacement remains available with automatic detection off.
- Verified encoded black-bar replacement, same-origin chat transparency and restoration on OFF. Surrounding information/ticket/transcript layouts remain transparent while button faces retain their fills. All existing renderer checks pass, including radial edge samples, letterbox/pillarbox detection, dark-frame handling, manual inset and scroll blending.
- Live IAB inspection confirmed Enhancer 3.0.19 Material/Pink is installed and identified an overlap between native and old ambient settings. YouTube's underlying popup CSS uses rgba(28,28,28,.9). The revised extension must be reloaded before claiming live verification of the new settings. Browser policy blocks chrome://extensions, so the reload is handed to the user.
- Actual Firefox appearance with 0.2.6 remains unconfirmed. Normal 0.2.2 publication continues.

## Previous 0.2.5 verification

## 0.2.5 screenshot-guided surfaces

- User testing confirmed 0.2.4 still leaves some theme backgrounds opaque. Screenshots identify the event-ticket shelf, action buttons, masthead button faces, filter chips and full-bleed player margins.
- The more faithful fixture reproduces black anonymous information wrappers, ticket-shelf containers/renderers and the player-full-bleed container under the complete Enhancer DeepDark theme.
- Development 0.2.5 expands only these surrounding surfaces and button fills, preserves touch-feedback children, and marks the selected filter with an outline.
- Verified all reproduced information/ticket/button/chip backgrounds become transparent under the complete theme. Filled-button text stays light, selected-chip outline remains visible and thumbnails keep their image gradients.
- Verified mouse hover still activates the native feedback child (opacity 0.16) and clicking still focuses the action button. Turning ambient off restores the original theme fills and removes our inline background overrides.
- Verified the full-bleed theater wrapper and player margins are transparent with black-bar replacement off. Entering fullscreen pauses ambient and restores the original black player; returning to normal mode keeps the surrounding page transparent and restores the normal player background.
- Actual Firefox verification remains pending; normal 0.2.2 publication continues.

## Previous 0.2.4 fixture verification

## 0.2.4 theme surfaces and theater margins

- User testing of 0.2.3 on Firefox still showed black information, related-video and transcript-panel backgrounds.
- Reproduced these missing inner surfaces using YouTube's observed layout boxes and a nested transcript fixture.
- Verified transparent inner surfaces and original-style restoration in Chromium with the complete Material/Pink CSS bundled in Enhancer for YouTube 2.0.136.
- Verified theater margins show ambient even with encoded-black-bar replacement switched off. Picture size, controls, button background and thumbnails are preserved.
- Verified fullscreen restores the player's black background and pauses ambient; leaving theater mode restores the original normal-player background while surrounding surfaces remain transparent.
- The GPL theme is an ignored local test input and is excluded from public source and extension packages.

Actual Firefox testing subsequently confirmed residual opaque surfaces in 0.2.4. Store submissions use the normal 0.2.2 version; 0.2.4 is a development package until that check completes.

## 0.2.3 theme compatibility verification

- Reproduced the header-only ambient problem using self-authored, high-specificity theme backgrounds and inline important styles.
- Confirmed transparent watch-page surfaces while ambient is active; the video, share button and thumbnail styling remain intact.
- Confirmed original inline background color, image and shadow are restored when ambient is switched off.
- Changed the theme color during active rendering, then confirmed the updated color is restored on disable.
- Confirmed fullscreen suspends the overrides and leaving fullscreen restores the ambient page background.
- JavaScript syntax and distribution archives are checked for this revision. Renderer code and permissions are unchanged.

These checks used the local Chromium fixture at `?theme`. Actual Firefox playback with Enhancer enabled still requires confirmation with 0.2.3. Earlier rendering measurements below belong to their stated revisions.

## 0.2.2の変更と確認

Androidの互換性宣言を外し、デスクトップ向けに提出できるよう修正しました。
実行コード・権限・描画処理は0.2.1と同じです。READMEは実際のYouTubeで撮影した
GIFへ差し替え、公開ソースZIPにもその素材を含めます。ストア用の自作画像は保持。

Mozilla web-ext 9.4.0はエラー0、警告1、通知0でした。警告は未対応のAndroidでの
データ同意項目の最低バージョンに関するものです。AMOではAndroidを対象外にします。
以下の描画・UI・保存の検証は0.2.1で実施した結果です。

## 確認済み

- JavaScriptの構文検査。
- ChromiumのCanvasで上下左右・斜めの端ピクセルの放射状投影。
- 50%混合時の色、100%移行時の全体フレーム。
- 上下帯、左右帯、真っ暗なシーンの誤判定抑制、手動の縁の内側。
- スクロールの計算：半分まで0%、4分の3で50%、画面外で100%。
- ローカル動画のスクロール実動作：4分の3で0.499、画面外で1.000。
- 同じ移行に連動する自動減光と、上へ戻した時の元の濃さへの復帰。
- 手動の全体背景モードでも、動画が画面外に出ると65%から29.25%へ減光。
- 黒帯を隠してアンビエントを見せる処理、オフ時のclip-path復元。
- 設定パネルをプレーヤー内の右下へ配置。外側クリックで閉じない動作、背景オフでの閉鎖。
- ローカル映像で通常・シアター・全画面・640px幅の配置がプレーヤー内に収まることを確認。
- 設定保存と再読み込み。白黒のスイッチ・スライダー。ぼかし付きの半透明パネル背景。
- 背景FPSの24〜60範囲・初期値30・再読み込み後の保存復元。
  Chromiumの60FPSテスト映像で、24設定は約23.7FPS、60設定は約60.1FPS。
  旧設定12は24へ補正。破棄後の追加描画は0回。
- 実際のYouTubeで検索欄の透明背景と、プレーヤー内の設定パネルを確認。
- 日本語／英語の切り替えで設定名・説明・アイコンの案内が変わり、再読み込み後も英語を復元。
- 実際のYouTubeライブチャットで、本体・案内カード・入力欄を透過。
  背景オフで元の不透明背景へ復元。チャット本文や色付きカードは変更しない。
- 実際のYouTube（CodexのChromiumブラウザ）で最新版をプレビュー反映し、
  プレイヤー内ボタン、背景、パネル、スクロールによる完全移行を確認。
- Firefox 156.0.1の隔離したheadless環境で、同じCanvas描画検査がすべてPASS。

ローカル動画は自作のCanvas映像です。Firefoxの結果は描画エンジンのテストで、
Firefoxへ拡張をインストールして実際のYouTubeを操作した検査とは別です。

## 性能の扱い

小さな合成フレームを使う描画テストでは、中央値はChromiumで約1.3ms、
Firefoxで約1msでした。この値は色の投影計算の目安だけです。実動画のデコード、
ぼかし・合成、GPU負荷、電力、フレーム落ちを含む性能評価ではありません。

## 未確認

- Firefox上の実際のYouTubeでの長時間再生と他拡張との競合。
- 実際のChrome製品版での長時間再生、全バージョンでの動作。
- 保護動画、HDR、ライブ配信、広告切り替え、全組み合わせの画面サイズ。
- YouTube以外のサイト・ネイティブ再生ソフト。
- Chrome Web Store／AMOの審査・署名・一般公開。

## 提出物

Mozilla web-ext 9.4.0の`lint --warnings-as-errors`はエラー0、警告0、通知0。
Chrome・Firefoxの本体ZIPはマニフェストを直下に置き、テスト用ファイルや
プロファイルを含めません。ZIPのCRCと明示したファイル一覧を確認しています。
128pxアイコン、440×280の画像、1280×800の自作デモ画像を用意しました。
