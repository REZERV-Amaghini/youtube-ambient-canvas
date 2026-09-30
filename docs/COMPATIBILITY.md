# Theme compatibility - 0.2.3

Some YouTube theme extensions apply high-specificity `!important` backgrounds.
With Enhancer for YouTube's dark theme, these rules can cover the ambient canvas
on the watch page while leaving the header visible.

Ambient Canvas overrides background color, background image and box shadow only
on selected surrounding page surfaces while ambient is active. The app container
also keeps its isolated canvas stacking context. Video, player controls, buttons
and thumbnails are not targeted. Original inline values and priorities are saved
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

The fixture is self-authored and does not redistribute any theme extension code.
Local Chromium verification covers this conflict and restoration behavior.
Actual Firefox playback with Enhancer enabled remains to be confirmed by loading
the updated extension and refreshing YouTube.
