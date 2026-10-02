# Contributing

The runtime uses plain JavaScript and CSS, with no dependencies or remote code.
`renderer.js` owns frame sampling and rendering; `ambient.js` owns the YouTube
adapter and settings; `ambient.css` changes watch-page surfaces.

The Quality workflow runs syntax checks and all numerical/controller suites on
Linux with Node 18/24 and Windows with Node 24 for pull requests and main pushes.
Linux/Node 24 also builds and CRC-checks the Chrome, Firefox, source and store-assets
archives with Python 3.12. These checks do not replace real YouTube or installed-
browser testing. The workflow has read-only repository permissions and does not
publish packages or submit store releases.

Run `npm run check`, then `npm run demo`. Open the printed localhost URL and run
`tests/check-renderer.js` in the page's developer console. The demo uses our own
generated graphics. Add `?bars` to exercise embedded black bars.

Tests cover edge projection, letterboxing, pillarboxing, dark-frame protection,
manual sampling inset, and scroll blending. Also check controls, persistence,
off/on restoration, theater mode, navigation, and resizing on real YouTube.

Build with `python scripts/build.py`. Committed icons mean packaging does not
require Pillow. `scripts/create_assets.py` optionally regenerates icons using
Pillow 12+. Store validation: `npx --yes --package web-ext@9.4.0 -- web-ext lint
--source-dir dist/firefox`. Chrome can load `dist/chrome` unpacked.

Reports should include browser version, video aspect ratio, settings, and steps
to reproduce. Exclude private account information, credentials, and cookies.
