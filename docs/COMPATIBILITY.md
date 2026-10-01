# Theme compatibility - 0.2.10 development revision

Some YouTube theme extensions apply high-specificity `!important` backgrounds.
With Enhancer for YouTube's dark theme, these rules can cover the ambient canvas
on the watch page while leaving the header visible. Version 0.2.3 covered outer
surfaces but missed unnamed layout boxes, the related-results wrapper and
transcript-panel surfaces. Version 0.2.4 still missed anonymous information
wrappers, event tickets, button/chip fills and the full-bleed player wrapper.
These additional surfaces were included in 0.2.5, but making the button faces
fully transparent removed their visible boundaries. Version 0.2.6 restores
their fills and uses theme color inputs plus backdrop blur.

Ambient Canvas overrides background color, background image and box shadow only
on selected surrounding page surfaces while ambient is active. The app container
also keeps its isolated canvas stacking context. Video pixels, picture geometry,
player controls and thumbnails are preserved. Button/chip faces and the Enhancer
toolbar are excluded from this guard. Original inline
values and priorities are saved
and restored when ambient is disabled, paused for fullscreen or disposed. Changes
made by another theme while ambient is active are retained for restoration.

This fix adds no permissions, dependencies, network requests or third-party code.
The extension still runs only on `https://www.youtube.com/*` and saves local
preferences with `storage`.

## Reproduce the conflict

Run `npm run demo`, then open the printed localhost URL with `?theme` appended.
The fixture adds stronger stylesheet rules and inline important backgrounds.
Toggle ambient off and on, change the theme background while it is active, and
enter and exit fullscreen. The active page surfaces should stay transparent;
turning ambient off should restore the latest theme background, image and shadow.

For a full-theme check, place a locally obtained, compiled DeepDark stylesheet
at `.tool-cache/deepdark.css` and use `?theme=deepdark`. The development server
serves this optional file locally. It is ignored by Git and excluded from every
distribution archive. Preserve its original license and attribution.

The fixture is self-authored. Local Chromium verification used the complete
Material/Pink CSS included in Enhancer for YouTube 2.0.136, with its GPL notices
preserved in the local test copy. The theme is not redistributed with Ambient
Canvas. Actual Firefox playback with the updated extension remains to be
confirmed. The usual distribution stays on 0.2.2 while compatibility is tested.

## Theater margins

While ambient is active, theater mode always reveals the ambient background in
the player's unused space around the picture. This behavior has no additional
switch and is independent of the optional replacement of black bars encoded in
the video. It changes only container/video-element backgrounds; it includes the full-bleed
player wrapper that Enhancer themes also color. It preserves
picture geometry, pixels and player controls. Returning to normal mode,
fullscreen or ambient off restores the previous player backgrounds.

## Early CSS and control surfaces

The stylesheet has a separate `document_start` manifest entry. Runtime video
sampling and controls still use `document_idle` in the default isolated world.
The patch changes DeepDark's `--main-background`, `--second-background` and
`--hover-background` inputs within the watch page and masthead. This lets the
theme's own rules draw transparent layout surfaces and translucent control
faces, without repeatedly replacing button styles after they are created.
The existing layout-only inline guard remains for other opaque backgrounds.

Native YouTube button fills, text colors, radii, padding and interaction states
are preserved as in 0.2.2. A 12px backdrop blur softens the area behind their
existing faces. DeepDark control fills have 14% white opacity; active-filter
color remains controlled by the theme. The 0.2.5 synthetic selection outline
and forced light text are removed. The Enhancer toolbar retains its geometry and icon styling.
No YouTube or Enhancer JavaScript functions are replaced.

## Enhancer control bar

Version 0.2.10 gives the observed `.efyt-control-bar` a 28% neutral dark background,
16px backdrop blur and a subtle 1px inset edge while ambient is active. The previous
72% surface still appeared too opaque in user testing. Small icon drop shadows
support readability over bright ambient colors. Positioning, sizing, corner radii,
icon fills, active/hover colors, button targets and tooltips remain controlled by
Enhancer. The surface remains neutral dark in either YouTube theme.
It is excluded from the inline layout guard. Turning ambient off or entering
fullscreen removes these scoped CSS rules and restores its original surface and icon filters.
Use `?enhancer&controls&theme=deepdark` to check the self-authored toolbar fixture.
Add `&compare-toolbar` to compare the previous and current surface over identical
bright demonstration backdrops.

## Menus, notifications and guide

YouTube renders contextual menus and notifications in `ytd-popup-container`,
outside the watch-page subtree. Version 0.2.8 covers the observed modern
contextual sheet, legacy menu renderer and multi-page notification renderer.
Each gets one 86% neutral surface and 16px backdrop blur. Structural inner
listbox/header backgrounds are transparent; menu rows and their feedback are
preserved. These rules do not enter the layout-only inline background guard.

The guide drawer gets a darker 78% surface with 16px blur. Its guide-wrapper and
guide-content no longer add stacked opaque backgrounds. The scrim, selected
entries, buttons and hover effects retain their native/theme styling.
Light YouTube themes use translucent white surfaces to retain readable native
dark text. The `dark` document attribute or observed Enhancer dark-theme link
selects dark surfaces. All rules are gated by `yac-active`, so OFF/fullscreen
restore the original CSS without recording or replacing inline menu styles.

Use `?surfaces&controls` for standard dark verification, add `&light` for light
mode, or use `?surfaces&theme=deepdark` with the optional local theme file.
Open menus after ambient starts, then disable ambient in its settings. The
fixture uses invented menu/notification content, never account data.

## Settings layout

The settings dialog uses YouTube's native popup base color, `rgba(28,28,28,.9)`,
neutral text, a 12px radius and 14px player-menu typography. DeepDark's secondary
background input uses the same color so native popup menus remain readable.
Strength, blur and saturation are immediately available; radial mode, black-bar
options, sample inset and 24-60 FPS are grouped under Advanced settings.
Language selection stays at the bottom. Advanced expansion is retained during
adjustments, and a scrollable body keeps the close button available in small players.

Range inputs have a 24px pointer area, native keyboard controls and value text
with units. Escape returns focus to the settings button. Turning ambient off
keeps the dialog and current focus available, so it can be re-enabled immediately.
Other settings can still be adjusted and saved while the background is off. Opening the native
YouTube settings closes the ambient dialog; opening ambient closes native settings.
Black-bar replacement remains independent of automatic black-bar detection.

Design references: [YouTube's settings entry point](https://support.google.com/youtube/answer/12827017?co=GENIE.Platform%3DDesktop&hl=en)
and [W3C slider keyboard and value semantics](https://www.w3.org/WAI/ARIA/apg/patterns/slider/).
The native popup color was verified directly in the loaded YouTube stylesheet.
The user-requested Astra review informed grouping, pointer areas and keyboard behavior.

To compare native controls with the tagged 0.2.2 version, locally extract its
`ambient.js` and `ambient.css` to `.tool-cache/ambient-v022.js` and
`.tool-cache/ambient-v022.css`. Open `?controls&baseline` and `?controls` using
the same fixture. Baseline files are ignored and excluded from distributions.
