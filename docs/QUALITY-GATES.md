# Development quality status — 0.2.19 / 2026-10-02

Versions 0.2.18 and 0.2.19 have recorded numerical/controller test results and local
in-app browser fixture verification. Version 0.2.19 passes the 32-case primary-text
reading-contrast matrix for light/dark chat and playlist surfaces. Neither is verified as an installed
extension on the current Chrome, Firefox or in-app YouTube page.

Version 0.2.17 was submitted to Chrome Web Store and AMO and was awaiting review
at the last recorded check on 2026-10-01. Versions 0.2.18 and 0.2.19 have not been
submitted. Current public visibility and review outcomes have not been checked
again. The historical AMO submission screen showed the old 0.2.2 version disabled
by Mozilla; this is not evidence that the new version was approved or published.

|Requirement|Recorded evidence|Remaining verification|
|---|---|---|
|Background OFF keeps settings available and restores native surfaces|Actual controller with deterministic DOM, main and asynchronous Worker callback paths; delayed saved-OFF test|Native player controls and reload on both browsers|
|Shared dark button palette with usable states|0.2.19 inherits common control RGB/opacity/blur for native faces, chips, search and Enhancer toolbar; native SVG accents and geometry preserved|The reading-face contrast results do not cover general action buttons; Enhancer presets, light/dark text, hover/selected/disabled states and bright/dark playback extremes still need checks|
|Search-field background and outline remain visible|0.2.13 adds light/dark faces, modern/legacy selectors and focus borders; the legacy selector outranks DeepDark's mode-specific rule; `?search` fixture|Actual Chrome/Firefox focus, suggestions, clear/search actions, OFF restoration and bright/dark backgrounds|
|Dark translucent sidebar, menus, playlist and chat panels|0.2.19 local browser: 32 primary-text contrast cases across both themes over white/black backdrops, chat/replay/options/top-fans, playlist normal/focus, same iframe document theme changes and OFF restoration; original SVG/card colors and playing row remain native|Actual late-opened YouTube surfaces and native theater transitions remain unverified; selected playing rows, accent/badge text and unrelated action-button contrast are outside this matrix|
|Native chat dropdown/menu icons remain visible|The extension adds no replacement icons and does not rewrite their native DOM; the local fixture retains its existing SVG nodes|Persistent empty native icon slots after theater mode remain unresolved; preserving fixture icons does not prove a fix for YouTube's initialization/iframe-recreation root cause|
|Page UI and ambient rendering remain responsive|Single in-flight Worker with layout preflight; no recurring stable/hidden/50-comment surface scans; decoded-frame pacing: 30 FPS video × 120 Hz display gives 90 captures/3s in main/Worker controller tests; unchanged-frame layout probes follow background FPS|Actual comment-load latency, CPU/GPU/transfer cost and long playback on actual devices; capture/presentation and CSS blur/compositing still use the browser renderer|
|GPU projection preserves appearance and falls back safely|0.2.18 local in-app browser: 13 static GPU/2D comparison cases, a packaged Worker bitmap transfer and forced context loss; the detector remains intact during 2D fallback|Installed Chrome/Firefox GPU behavior, video capture/transfer and end-to-end cost remain unverified; the static projection benchmark excludes these costs, CSS blur and YouTube|
|Scrolled full-frame background uses finer blur|0.2.18 main/Worker controller tests cover interpolation to `max(25px, configuredBlur / 2)`, settings 0/40/90/160, saved-value preservation and scrolling back|Actual YouTube scroll/layout transitions and visual quality on Chrome/Firefox|
|Black-band removal preserves the picture|Noisy-band/dark-scene/jitter/reset holdouts at 160/320; separate sampling and display boundaries; bright subtitle/logo cases protected on their first observed frame|Thin/dark glyphs lost in 320×180 reduction, unusual ratios, changing bars and real subtitles; detector is an estimate, not full-resolution proof|
|Warning appears above playback with a dark backdrop|Real controller tests: OFF/fullscreen sampling, native modal invocation, fullscreen host placement, dark CSS, no automatic pause or strength change|Actual browser top-layer display and focus behavior; warning cannot certify safety or complete detection|
|Never-show preference survives other tabs|Per-key writes, live storage events, legacy fallback, concurrent and delayed-read tests|Real extension storage events across Chrome/Firefox tabs and reload|
|Seek, layout transitions and disposal preserve state/resources|Zero geometry waits, seeking guard, clip ownership, suspended timeouts, stale frame disposal and subscription teardown tests|Native iframe recreation, page navigation, hidden-tab suspension and long sessions|

`npm run check` and `npm test` cover syntax and ten numerical/controller suites.
The recorded 0.2.19 results passed. No numerical test displays flashing imagery or
accesses YouTube. DOM tests use test doubles; they do not establish rendered
appearance or browser decoding. The separate local browser checks establish
fixture behavior only, not native YouTube initialization or installed-extension
playback. Recorded GPU results and the chat screenshot are in
`artifacts/gpu-0.2.18/gpu-result.json` and `artifacts/gpu-0.2.18/chat-shades.jpg`;
scope and limits are recorded in `VALIDATION.md`.

The normal browser tool rejected YouTube access after the user's explicit grant,
citing a saved access setting. Localhost fixture access succeeded for the
0.2.18 in-app browser checks. The YouTube restriction must be resolved through
the supported permission UI before the remaining native-site checks can run;
no alternative browser or command route was used to bypass it.

Dialog placement follows the browser's native
[showModal top-layer behavior](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal).
On browsers with video-frame callbacks, warning sampling follows available new
video frames independently of background FPS. Other browsers retain the display
tick fallback. Decoding, dropped samples, aliasing, small flashing areas and protected
pixels can still prevent detection. Neither the three-second trigger nor 15%
ambient strength is a medical safety guarantee.
