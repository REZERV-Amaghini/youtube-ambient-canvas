# Theme compatibility - 0.2.5 development revision

Some YouTube theme extensions apply high-specificity `!important` backgrounds.
With Enhancer for YouTube's dark theme, these rules can cover the ambient canvas
on the watch page while leaving the header visible. Version 0.2.3 covered outer
surfaces but missed unnamed layout boxes, the related-results wrapper and
transcript-panel surfaces. Version 0.2.4 still missed anonymous information
wrappers, event tickets, button/chip fills and the full-bleed player wrapper.
These additional surfaces are included in 0.2.5.

Ambient Canvas overrides background color, background image and box shadow only
on selected surrounding page surfaces while ambient is active. The app container
also keeps its isolated canvas stacking context. Video pixels, picture geometry,
player controls and thumbnails are preserved; selected page-button faces are
transparent while their touch-feedback children remain intact. Original inline
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

## Button and filter surfaces

The watch-page action buttons, masthead button faces, Enhancer toolbar and
related-video filter chips also reveal ambient. Icons, text, native touch/hover
feedback and focus behavior remain intact. The selected filter retains a thin
outline so selection does not depend on an opaque fill.
