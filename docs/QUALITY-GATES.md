# Development quality status — 0.2.24 / 2026-10-02

Versions 0.2.18–0.2.23 have recorded numerical/controller test results and local
in-app browser fixture verification. Version 0.2.19 passes the 32-case primary-text
reading-contrast matrix for light/dark chat and playlist surfaces. Version 0.2.20
passes all 126 active primary-text checks in its control fixture; two color-background
arrow samples remain inconclusive, so its complete pixel matrix is not a PASS.
Version 0.2.21 also verifies the native warning dialog and persistence-failure
UX in a local browser fixture with constant video and numerical monitor input.
Version 0.2.22 verifies idle-transition cleanup and cadence in the deterministic
controller, real sample-buffer detachment in numerical tests, and 36 sequential
packaged-Worker jobs in the local WebGL2 browser fixture. This does not measure
native comment-load performance. Version 0.2.23 lightens resting action/search/
Enhancer surfaces while preserving chips and reading faces. Its 19 local browser
captures contain 265/266 measured faces and 153 passing active primary-text checks
(minimum 4.652435:1); one color chip-arrow patch remains inconclusive.
Version 0.2.24 protects sampled dim/colored captions and watermarks below the
absolute bright-pixel cutoff, using each band's measured black level. Numerical
tests cover all four edges, corners, first-frame protection, clean recovery,
codec noise and the renderer's separate sampling/display contracts at 160/320.
It adds no canvas readback, frame transfer, DOM work or worker messages.
None is verified as an installed
extension on the current Chrome, Firefox or in-app YouTube page.

Version 0.2.17 was submitted to Chrome Web Store and AMO and was awaiting review
at the last recorded check on 2026-10-01. Versions 0.2.18–0.2.24 have not been
submitted. Current public visibility and review outcomes have not been checked
again. The historical AMO submission screen showed the old 0.2.2 version disabled
by Mozilla; this is not evidence that the new version was approved or published.

|Requirement|Recorded evidence|Remaining verification|
|---|---|---|
|Background OFF keeps settings available and restores native surfaces|Actual controller with deterministic DOM, main and asynchronous Worker callback paths; delayed saved-OFF test|Native player controls and reload on both browsers|
|Shared dark button palette with usable states|0.2.20 retains common RGB and 22/34/44% alpha, adjusts small-control backdrops for theme text, and fixes chip-parent/search keyboard focus. Local browser: 16 static captures, 222/224 measured faces, 126 active primary-text checks passed (minimum 4.652435:1); measured ordinary icon fill minimum 4.292110:1. Native SVG/geometry/disabled/OFF invariants passed|Color-background arrow patches were nonuniform and rejected; full pixel matrix remains incomplete. Semantic pink/disabled and arbitrary custom colors are not certified. Actual Enhancer presets, Chrome/Firefox text/hover/selected states and playback extremes still need checks|
|Search-field background and outline remain visible|0.2.13 adds light/dark faces, modern/legacy selectors and focus borders; the legacy selector outranks DeepDark's mode-specific rule; `?search` fixture|Actual Chrome/Firefox focus, suggestions, clear/search actions, OFF restoration and bright/dark backgrounds|
|Dark translucent sidebar, menus, playlist and chat panels|0.2.19 local browser: 32 primary-text contrast cases across both themes over white/black backdrops, chat/replay/options/top-fans, playlist normal/focus, same iframe document theme changes and OFF restoration; original SVG/card colors and playing row remain native|Actual late-opened YouTube surfaces and native theater transitions remain unverified; selected playing rows, accent/badge text and unrelated action-button contrast are outside this matrix|
|Native chat dropdown/menu icons remain visible|The extension adds no replacement icons and does not rewrite their native DOM; the local fixture retains its existing SVG nodes|Persistent empty native icon slots after theater mode remain unresolved; preserving fixture icons does not prove a fix for YouTube's initialization/iframe-recreation root cause|
|Page UI and ambient rendering remain responsive|Single in-flight Worker with layout preflight; no recurring stable/hidden/50-comment surface scans; decoded-frame pacing: 30 FPS video × 120 Hz display gives 90 captures/3s in main/Worker controller tests; unchanged-frame layout probes follow background FPS|Actual comment-load latency, CPU/GPU/transfer cost and long playback on actual devices; capture/presentation and CSS blur/compositing still use the browser renderer|
|GPU projection preserves appearance and falls back safely|0.2.18 local in-app browser: 13 static GPU/2D comparison cases, a packaged Worker bitmap transfer and forced context loss; the detector remains intact during 2D fallback|Installed Chrome/Firefox GPU behavior, video capture/transfer and end-to-end cost remain unverified; the static projection benchmark excludes these costs, CSS blur and YouTube|
|Scrolled full-frame background uses finer blur|0.2.18 main/Worker controller tests cover interpolation to `max(25px, configuredBlur / 2)`, settings 0/40/90/160, saved-value preservation and scrolling back|Actual YouTube scroll/layout transitions and visual quality on Chrome/Firefox|
|Black-band removal preserves the picture|Noisy-band/dark-scene/jitter/reset holdouts at 160/320; separate sampling and display boundaries; bright and dim/colored subtitle/logo cases protected on their first observed frame, with clean-boundary recovery|Glyphs lost in 320×180 reduction or below the band-relative threshold, unusual ratios, changing bars and real subtitles; detector is an estimate, not full-resolution proof|
|Warning appears above playback with a dark backdrop|0.2.21 local browser: native modal/top layer, dark backdrop, real fullscreen host, focus/keyboard/Escape, video and background continuation, zero warning click/double-click/key bubbles to fixture player, explicit 15% only, ambient OFF sampling; numerical input only|Actual YouTube handlers, installed Chrome/Firefox and real-video detection; warning cannot certify safety or complete detection|
|Never-show preference and save failures remain clear|Per-key/concurrent/delayed-read tests; 0.2.21 sync/async failed writes, multiple-key retry, stale completion and disposal tests; local browser error/retry/focus, Never-show reload and advanced re-enable|Real extension storage events across Chrome/Firefox tabs and reload; local fixture uses its own sessionStorage namespace|
|Seek, layout transitions and disposal preserve state/resources|Zero geometry waits, seeking guard, clip ownership, suspended timeouts, stale frame disposal and subscription teardown tests|Native iframe recreation, page navigation, hidden-tab suspension and long sessions|

`npm run check` and `npm test` cover syntax and ten numerical/controller suites.
The recorded 0.2.24 numerical/controller results passed. No numerical test displays flashing imagery or
accesses YouTube. DOM tests use test doubles; they do not establish rendered
appearance or browser decoding. The separate local browser checks establish
fixture behavior only, not native YouTube initialization or installed-extension
playback. Recorded GPU results and the chat screenshot are in
`artifacts/gpu-0.2.18/gpu-result.json` and `artifacts/gpu-0.2.18/chat-shades.jpg`;
scope and limits are recorded in `VALIDATION.md`. Control pixel evidence is in
`artifacts/controls-0.2.20/result.json`; its two inconclusive color-arrow samples
remain recorded as failed measurements, not corrected by a CSS color formula.
Warning browser evidence is in `artifacts/warning-0.2.21/browser-results.json`;
the constant-video fixture injects only numerical monitor data and synthetic
clocks. It does not establish actual-video detection accuracy or timing.
The latest continuous-transfer evidence is in
`artifacts/performance-0.2.22/gpu-result.json`; the local scroll fixture retains
the 90px → 45px → 90px blur transition. Browser artifacts are ignored and excluded
from packages.

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
