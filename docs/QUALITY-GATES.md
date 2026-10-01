# Development quality status — 0.2.12 / 2026-10-01

The development build has passed numerical and controller tests. It is not yet
verified as an installed extension on the current Chrome, Firefox or in-app
YouTube page. Public/store distribution remains 0.2.2.

|Requirement|Evidence for this revision|Remaining verification|
|---|---|---|
|Background OFF keeps settings available and restores native surfaces|Actual controller with deterministic DOM, main and asynchronous Worker callback paths; delayed saved-OFF test|Native player controls and reload on both browsers|
|Theme compatibility without removing button faces|Targeted CSS; light/dark base variables; one menu face under the observed DeepDark wrapper; native button/chip fills preserved|Enhancer color presets, dark/light playback and bright/dark extremes; all screenshots supplied by the user|
|Dark translucent sidebar, menus, playlist and chat panels|Theme-sensitive CSS rules and self-authored fixtures; currently playing playlist row remains native|Late-opened native surfaces, chat replay/top-fans panels and theater transitions|
|Native chat dropdown/menu icons remain visible|The extension adds no replacement icons and does not rewrite their native DOM|Persistent empty native icon slots after theater mode remain unresolved; inspect the actual initialization lifecycle|
|Page UI and ambient rendering remain responsive|Single in-flight Worker; no queue; sample-only monitoring; projection cache has exact RGBA parity with the prior math|CPU/GPU/transfer cost and long playback on actual devices; CSS blur/compositing still use the browser renderer|
|Black-band removal preserves the picture|Noisy-band/dark-scene/jitter/reset holdouts at 160/320; separate sampling and display boundaries; bright subtitle/logo cases protected on their first observed frame|Thin/dark glyphs lost in 320×180 reduction, unusual ratios, changing bars and real subtitles; detector is an estimate, not full-resolution proof|
|Warning appears above playback with a dark backdrop|Real controller tests: OFF/fullscreen sampling, native modal invocation, fullscreen host placement, dark CSS, no automatic pause or strength change|Actual browser top-layer display and focus behavior; warning cannot certify safety or complete detection|
|Never-show preference survives other tabs|Per-key writes, live storage events, legacy fallback, concurrent and delayed-read tests|Real extension storage events across Chrome/Firefox tabs and reload|
|Seek, layout transitions and disposal preserve state/resources|Zero geometry waits, seeking guard, clip ownership, suspended timeouts, stale frame disposal and subscription teardown tests|Native iframe recreation, page navigation, hidden-tab suspension and long sessions|

`npm run check` and `npm test` cover syntax and six numerical/controller suites.
No numerical test displays flashing imagery or accesses YouTube. DOM tests use
test doubles; they do not establish rendered appearance or browser decoding.

The normal browser tool rejected YouTube access after the user's explicit grant,
citing a saved access setting. The localhost fixture is also blocked by that
setting. Those runtime restrictions must be resolved through the supported
permission UI before the remaining visual checks can run; no alternative browser
or command route was used to bypass them.

Dialog placement follows the browser's native
[showModal top-layer behavior](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal).
Warning sampling follows available display ticks independently of background
FPS. Decoding, dropped samples, aliasing, small flashing areas and protected
pixels can still prevent detection. Neither the three-second trigger nor 15%
ambient strength is a medical safety guarantee.
