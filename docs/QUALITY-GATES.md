# Development quality status — 0.2.24 source / 2026-10-03

## Unreleased compact settings and percentage controls

The production source now uses the selected four-category menu and an independent
ambient switch beside an icon-only settings button. The user-requested iOS 27 motif
uses one translucent panel, rounded controls and restrained edge highlights. Future
surfaces follow [Apple's Liquid Glass guidance](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass)
for restrained control materials and readable foregrounds. This is a design
direction, not a claim of exact parity with an Apple OS release.
Descriptions are available on hover, focus or click. Detail pages have stable,
category-specific heights so opening help cannot move its hovered button.
Background OFF keeps the dialog usable. Escape dismisses help without moving
focus, then returns to the originating category, then closes to the gear.

A real keyboard pass reproduced two help-state bugs: focus-only descriptions
were visible with aria-expanded=false and Escape left their category; a second
click collapsed the button's state while hover CSS kept its text visible.
One controller now owns visibility, native hidden and aria-expanded. Explicit
dismissal stays closed while the same trigger remains hovered/focused; a fresh
entry can reopen it. Click-pinned help survives focus leaving, and pointer help
persists when moving from the button to its text inside the same row.

The localhost browser pass confirms eight keyboard/click invariants, including
unchanged 340×457px detail-panel geometry, focus-preserving dismissal, second-click
closure, pinned help and reopening on fresh focus. Pointer/touch event paths are
covered by the main/Worker deterministic controller tests; this browser pass did
not move the native pointer onto the tooltip. The controller tests also confirm
no extra video sample, ambient paint, geometry probe, surface scan or warning
reset during help interaction. The full syntax check and all ten suites pass.
This follows [W3C's hover/focus guidance](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)
and [Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/), without
claiming site-wide WCAG conformance. Evidence is
`liquid-settings-help-browser-check-20261003.json`, with before/focus/dismiss JPEGs
in the current visualization directory.

Individual shade preferences span 0–100%; the overall multiplier spans 0–1.
Read-only legacy conversion preserves every existing category's paint, including
positive offsets. Saves still use independent keys and retain warning choices.
The new 162-case percentage/upgrade matrix and the existing 81-case palette matrix
pass, including concurrent saves, reloads, bounds and pending-read input.
Main/Worker controller tests cover independent entrances, category navigation,
help, focus restoration and teardown. The remaining numerical/controller suites
also passed after integration.

The updated source was exercised in the in-app localhost fixture: multiplied
percentages and reload persistence, mouse and keyboard help, language changes,
and background OFF with settings still open. A 320×240 player fixture retained
reachable Back/Close controls, a 296px panel and no horizontal body overflow.
At master zero, computed panel paint,
border, shadow and backdrop blur are clear while category values remain intact.
Native YouTube access was rejected by the browser's saved permission setting in
an earlier goal turn. Installed Chrome/Firefox and native-site checks remain outstanding.
This source update has not been released or submitted to stores.

## Warning focus recovery

A connected warning opener can become unfocusable while the modal is open.
The real localhost browser reproduced the failure: disabling that opener left
focus on body after dismissal. Closure now attempts the original focus target,
reads the focused element through open shadow roots, and uses the settings gear
if the browser did not accept focus. This follows the logical focus-return approach
in [W3C's modal dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
It adds no per-frame observer, document scan or renderer work.

Ten main/Worker controller cases cover usable, disabled, hidden, hidden-ancestor
and removed openers. The actual in-app browser pass confirms ten checks: disabled
and hidden recovery, unchanged usable focus, continued playback and strength,
visible persistence failure, successful retry, native modal behavior, input-event
isolation and an opaque warning with a dark backdrop at surface multiplier zero.
Video time and presented-frame counts continued advancing with the modal open.
The full syntax check and all ten suites pass after the focus-model update.

Sixteen main/Worker preset cases cover Japanese and English with saved ambient
strengths 0, 5, 15 and 65. Saved values below the existing 15% minimum normalize
before warning interaction; the explicit action retains that minimum or reduces
65% to 15%, without stopping playback. Ambient strength remains 15–100; the
independent UI surface multiplier remains 0–1. An initial expectation that saved
0% would remain 0% was incorrect. Its failed assertion and diagnosis are retained
in `liquid-warning-strength-before-20261003.json`; no product range was changed.

Evidence is `liquid-warning-focus-browser-check-20261003.json`, the original
`liquid-warning-focus-before-20261003.json`, and modal/failure/zero-shade JPEGs in
the current visualization directory. The fixture keeps visible video constant
and injects only numerical monitor data/clocks. These checks do not establish
real-video flash-detection accuracy/timing, installed-browser behavior or medical
safety. Actual YouTube and installed Chrome/Firefox remain pending.

## Dormant surface observation

The existing zero whole-page-scan counter missed per-added-node subtree queries.
Before this change, adding 50 unrelated wrappers made 50 descendant queries while
ambient was OFF or the document was hidden, even though both full-page counters
stayed zero. The observer now retains a dirty flag and exits before classification
while UI guarding is inactive or the document is hidden. It remains attached;
this does not claim that the browser allocates no mutation records or uses no CPU.
Activation and visibility/fullscreen resume keep their one complete synchronization.

Twelve deterministic controller cases cover main/Worker, idle/timer scheduling
and OFF/hidden/fullscreen. All have zero dormant subtree queries and full-page
scans, one resume scan, late-surface guarding, and original theme restoration.
They also check that those DOM additions do not trigger layout reads or video
samples. Syntax and all ten suites pass. The localhost browser confirms three
native late-surface paint checks in each of main and Worker with static video.
This is not native selector-count, comment-load latency or timing evidence.

The attempted prototype-wrapped native counter returned zero even for all three
positive controls. It was rejected and removed, rather than reporting those
zeroes as a performance result. Its invalid report is retained alongside
`liquid-dormant-surface-work-before-20261003.json`,
`liquid-dormant-surface-work-after-20261003.json`, the main/Worker browser reports
and `liquid-dormant-surface-browser-20261003.jpg` in the visualization directory.
Actual YouTube active-comment latency and installed-browser behavior remain pending.

## Transcript surfaces and UI-only updates

Engagement panels now retain one shared reading face while their header/content
wrappers stay clear. Transcript fields use the shared control paint without a
second backdrop blur. Their resting border, and the masthead search border,
multiply by the control level. Native focus accent and input contents remain.
The local engagement fixture confirms dark/light zero paint and blur, the focus
border at zero, and restoration of original inline panel/field theme paint on OFF.
Idle and timer-fallback controller tests cover late panels, variable-only changes,
no recursive rescan and restoring prior styles.

UI shade and language changes no longer invalidate renderer inputs or force a
capture. Four main/Worker and callback/fallback combinations confirm no additional
capture or geometry probe during these edits, no delayed duplicate capture, and
continued forced repaint for ambient preferences. A held Worker frame remains
accepted for warning analysis after a shade edit. All ten suites and syntax
checks pass. These are deterministic/local results; native comment latency,
installed-extension rendering and current YouTube selectors remain unverified.

## Search suggestions, voice/confirmation dialogs and compact guide

Modern search-suggestion class variants and the legacy sbdd_b/sbsb_a layout now
use one shared navigation face. Voice and confirmation renderer faces use the
same palette; their dialog wrappers stay clear. Mini-guide entries retain native
active, hover and keyboard-focus feedback without nested opaque backgrounds.
Dark navigation backdrops now dim only the background, proportionally to the
navigation level. Zero restores an identity brightness filter and zero blur.
These selectors were informed by cached theme CSS, not a current YouTube DOM audit.

The self-authored localhost fixture confirms uppercase/lowercase class parity,
arrow-key selection, unchanged dimensions, original red/blue action states,
independent category zero, and dark/light OFF restoration with settings still
accessible. Browser screenshot measurements pass 24 standard-shade text checks
across both themes and static black/white references, minimum 4.774779:1.
The 24 zero-shade samples are recorded separately: this browser returns JPEG,
so they do not certify exact pixel transparency. Computed paint/shadow alpha,
blur and brightness at zero were checked directly. The pixel checker detects
the actual image format and enforces exact transparency only for lossless PNG.
No real microphone access or flashing test imagery is used.

Controller tests confirm these late surfaces and option-class changes do not
start a structural page scan. All ten existing suites and syntax checks pass.
Installed-browser voice search, current suggestion DOM, native themes and actual
YouTube keyboard/focus behavior remain unverified. Known portalled dialogs and
native-shaped player menus are covered by the source work recorded below;
known cached legacy hover/click cards and tooltip shapes are covered below;
current profile-card variants and unsupported dialogs still need a native audit.

## Known legacy cards and tooltips

Cached hover/click card content now owns one navigation face. Structural outer
wrappers are clear; borders and the known vertical/reversed and horizontal/flipped
arrows follow the navigation multiplier. Nested content clears paint/filter/shadow,
and known neutral buttons retain feedback without another opaque face or blur.
Modern renderer, paper-tooltip and player promo-tooltip shapes use a dark lens
for native light foregrounds in either page theme; cached accent foregrounds stay
intact. Paint, shadow, blur, dimming and pointer paint all reach zero. Geometry,
native fade opacity, hidden state and input/media/semantic actions remain native.
These selectors come from saved theme CSS, not current YouTube DOM evidence.

The self-authored localhost page passes 110 dark/light, multiplicative-level,
zero, OFF, nested-face and original-state checks. Idle/timer controller tests
confirm late card/tooltip creation, reversal/flip classes and native fade changes
do not scan the page or enqueue structural work. All ten existing suites and
syntax checks pass. The first local check compared .172 declared alpha with its
.173 browser serialization and failed; the corrected check retains exact
coefficient/multiplier assertions and compares actual paint to a resolved CSS
probe. The initial result is retained with its diagnosis.

Eight screenshots pass 32 standard-shade foreground/background measurements
across dark/light and static white/black backdrops, minimum 4.541970:1. All 32
zero-shade JPEG samples report zero decoded backdrop deviation; they do not prove
lossless transparency. Tooltip foreground groups have opacity 1 for this matrix;
fading-state contrast and arbitrary reduced shades are not certified. Current
profile cards, native hover/click initialization, installed Chrome/Firefox and
actual Enhancer themes remain unverified. No generic renderer-name guessing,
new observer or per-frame DOM work was introduced.

## Description, comment and related-result reading panes

Modern/legacy descriptions, comments and related-result bodies now use one
shared reading face. These long panes have no backdrop filter and no per-comment
paint layer. Their 94% resting and 98% collapsed-description feedback bases
multiply by the existing reading percentage and overall multiplier. Zero has no
paint floor. Native text/accent colors, draft contents, thumbnails and membership
badge paint remain unchanged in the local fixture.

Related wrappers and nested result renderers use a CSS-selected face variable.
Appending a playlist clears its ancestor's face synchronously, before the
coalesced structural refresh, so the selected playing row retains its original
appearance. Removing the playlist restores the reading face. A tracked element
changing roles now updates its owned paint while retaining the original native
property for OFF restoration. Idle/timer-fallback controller tests cover moving
description nodes, nested result owners and zero additional scans from 50 new
comment threads.

The self-authored localhost fixture passes 48 computed primary/secondary/accent
contrast cases, modern/legacy description transitions, independent reading zero,
zero hover, unchanged geometry/draft/media/badge states and dark/light OFF
restoration. Its eight final JPEG captures pass 36 standard-shade screenshot
background/foreground contrast measurements, minimum 4.764497:1. The 36 zero-shade
samples have maximum decoded backdrop deviation zero; JPEG still cannot certify
exact transparency. First-attempt captures were rejected: their viewport-fixed
test backdrop did not cover the full document, and a thumbnail-adjacent sample
failed the unchanged uniformity check. The fixture now has a document-sized
reference and a page-top control. Final samples use blank bottom padding; no
contrast threshold or uniformity tolerance was relaxed. The original captures
remain preserved separately.

The screenshot manifests and reports are `liquid-reading-captures-20261003.json`
and `liquid-reading-pixel-result-20261003.json` in this task's visualization
directory. All ten numerical/controller suites, syntax checks and the prior
search screenshot matrix pass. Current YouTube DOM, installed Chrome/Firefox,
native title/channel paint and mixed playlist/result body readability still
need verification. These local results do not certify arbitrary reduced shades
or a complete product release.

## Metadata owners and mixed playlist/results

Title/channel/description paint now belongs to the native metadata owner.
Modern metadata has one face; the legacy primary and secondary info containers
each have their own face. Inner title/owner/top-row/description wrappers stay
clear, with no extra blur, padding or size changes from the production CSS.
Native text/accent colors and the shared control palette remain intact.

Mixed related wrappers stay clear above the playing row. A playlist-free result
renderer or its first playlist-free item/grid section owns the reading face.
Nested sections explicitly reset their own face instead of inheriting another
paint layer. The local fixture confirms both inside-results and sibling-playlist
placements, synchronous CSS face changes and unchanged native playing-row paint.

The legacy transition initially failed at 4.42:1 accent contrast: an inline
theme background survived until the structural coalescing window. Metadata
owner creation and external owner-paint changes now trigger one immediate
observer-microtask sync. Idle/timer-fallback tests confirm no delayed duplicate
scan and restoration of the latest external paint. Existing stable/hidden/
50-comment scan and main/Worker pacing tests still pass.

After that fix, modern/legacy and both mixed fixture arrangements pass their
60-case calculated text matrices, including dark/light OFF restoration. The
eight modern-metadata JPEG captures pass 48 screenshot-background contrast
measurements, minimum 4.764497:1. All 48 decoded zero-shade padding samples match
their static reference, without asserting lossless transparency. Independent
reading zero and collapsed-description hover also have zero computed paint and
no blur. Draft, avatar/thumbnail image, text/accent states and shade-adjustment
geometry remain unchanged. ON/OFF width/height match; the largest page-coordinate
comparison difference at the same scroll origin is 1.14e-13 CSS px from numeric
round-tripping, not a measurable layout shift. No pixel or contrast tolerance
was changed.

Evidence is `liquid-metadata-captures-20261003.json` and
`liquid-metadata-pixel-result-20261003.json` in this task's visualization
directory. All ten suites and syntax checks pass. Current native YouTube,
actual Enhancer presets, installed-browser behavior and mixed-layout variants
beyond this self-authored fixture still require verification.

## Portalled dialogs and native-shaped player menus

Nine known dialog renderers plus the Dialog Layout component now use one
navigation face. Sharing, reporting, hotkeys, survey/follow-up, voice and
confirmation variants retain native action colors, media and draft contents.
Both Paper Dialog generations stay clear around that face, including an
intermediate wrapper. Nested Dialog Layouts have no second paint or blur.

The native-shaped player popup keeps its original opacity, white foregrounds,
disabled-row opacity, checkbox/radio state and focus outline. It uses a dark
face in both page themes. Its neutral hover/focus and selected-row feedback
dim the background instead of adding a light wash. Face, feedback, shadow and
backdrop filter follow the multiplied navigation level with no zero floor.
This change is CSS-only; late dialogs, player popup creation and selection
changes add zero scans in the idle/timer-fallback controller tests.

The self-authored browser fixture passes 141 checks for each of the two dialog
wrapper generations, covering all ten dialog previews in dark/light themes,
single-face ownership, individual/global zero, OFF restoration and semantic
state preservation. Real keyboard input moves and selects the fixture's native
radio items without changing playback. A first focus check assumed a 2px
outline while this browser resolves the fixture's original outline to 1.6px.
The final check compares the exact native OFF outline and requires a positive,
solid focus indicator; the zero-shade outline matches it.

The first selected-row screenshot failed muted-text contrast at 2.937319:1.
After changing the feedback wash, eight dark/light × black/white × zero/one
JPEG captures pass 24 standard-shade foreground/background measurements,
minimum 4.541970:1. Selected and ordinary player-secondary minima are
5.992297:1 and 5.394657:1. All 24 decoded zero-shade samples match their static
backdrops, without asserting lossless transparency. Geometry, edited draft,
artwork, action/badge paint, original 0.9 popup opacity and native states remain
unchanged. No contrast threshold or pixel-uniformity tolerance was relaxed.

The overlay pixel scope applies that original group opacity to the glyph over
the unfiltered static parent reference. Both white/black references are checked
against actual screenshot padding; opacity is not applied twice over the
already-filtered face. This follows the buffer/opacity/source-over order in the
[Filter Effects 2 rendering draft](https://drafts.csswg.org/filter-effects-2/#backdrop-filter-rendering)
as a compositing model, not a claim that the draft is a completed standard.
The original failed five-role matrix is preserved separately; the final six-role
matrix also measures the ordinary unselected player's muted label.

Evidence is `liquid-overlays-captures-20261003.json` and
`liquid-overlays-pixel-result-20261003.json` in this task's visualization
directory, with the initial captures retained under `liquid-overlays-initial-*`.
All ten suites, syntax and inline fixture parsing pass. Current native YouTube
selectors, installed browsers, actual dialog focus/keyboard behavior, other
popup variants and real theme presets remain unverified.

## Previous interface density measurements before the compact menu

The common shade now multiplies each role's base alpha by its role adjustment
and the 0–100 master level. Zero removes face paint, blur and brightness/contrast
adjustments, including background feedback during keyboard focus. The dense
endpoint remains unchanged. Existing saved values are retained; fresh settings
use 100. Native feedback alpha is preserved whether it is stored in the color
or in `opacity`; a background-only opacity filter applies the master multiplier
through native fade tails as well. Theme hover paint and settings shadows,
hover rows and language fields also multiply by their respective role levels.

The 81-case settings matrix and main/Worker controller tests pass. Local PNG
checks of the current CSS pass 60 zero-shade face measurements over black/white,
including light/dark themes, actual Tab focus, theme hover paint and paused
mid-fade current/legacy feedback with both alpha encodings. Every sampled backdrop pixel
remains unchanged. At 100, all 42 measured faces pass the original primary-text
4.5:1 and ordinary-icon-fill 3:1 checks (minima 4.652435:1 and 3.221879:1).
The toolbar focus sample includes its native feedback fill, uses padding inside
the button and retains the existing uniformity and 9x9-pixel minimum checks.
Local same-document chat/playlist theme changes and OFF restoration pass with
minimum calculated primary contrast 6.29:1 at role offsets zero. Native SVG,
semantic cards and the selected playing row remain intact. Zero shade and OFF
persist after reload, and switching OFF keeps the settings panel open. An OFF
settings panel with master zero remains clear even with a +30 role adjustment.
At master 50 and adjustment +30 its level is .65, including shadow and select
paint. Browser-native select-popup rendering still needs platform verification.

These are fixture results, not installed Chrome/Firefox or native YouTube
verification. Contrast is intentionally not certified at fully transparent or
arbitrarily reduced user-selected shades. Earlier thin-endpoint contrast
results below describe the previous nonzero floor and do not apply to zero in
the current source. This update has not been released or submitted to stores.

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

The 2026-10-03 live store check found Chrome Web Store version 0.2.17 publicly
available, with an update date of 2026-10-02 and a visible installation action.
AMO still reports version 0.2.17 as awaiting review; its listing explicitly says
it is not public and is visible only because the signed-in developer has elevated
permissions. Versions 0.2.18–0.2.24 have not been submitted. The historical AMO
submission screen showed the old 0.2.2 version disabled by Mozilla; this does not
establish approval or publication of a newer version. The focused browser evidence
is `liquid-store-status-20261003.json` in this task's visualization directory.

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
