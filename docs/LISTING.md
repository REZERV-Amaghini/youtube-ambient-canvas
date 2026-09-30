# Store listing — 0.2.0

Name: YouTube Ambient Canvas

## Short description

Extend YouTube video colors across the page with radial glow, smooth scroll blending, and black-bar detection.

動画の色をYouTube全体の背景へ。放射状の光、スクロールに合わせた切り替え、黒帯検出、ぼかし・濃さ・彩度の調整。

## English description

Bring the colors of your YouTube video to the surrounding page.

Radial mode extends colors from the video's edges. Starting when half the video
is hidden by scrolling, the glow smoothly blends into a full-frame background.
Scroll back to restore the radial glow. Full-frame mode is also available.
The background automatically dims during the scroll transition to keep text
readable, reaching 45% of your configured strength once the video is hidden.

Open the ambient icon beside the player's settings button to adjust strength,
blur, saturation, edge inset and background frame rate (24–60 FPS, default 30).
Higher frame rates increase rendering load. A dark monochrome panel overlays the related
video sidebar and stays open while you make adjustments.

Symmetrical black-bar detection samples the picture inside the bars. An optional
switch replaces detected bars with ambient color without zooming the picture.

Desktop YouTube watch pages only. Local preferences, no tracking, analytics,
remote code or external communication. Protected videos and YouTube layout
changes may limit functionality. Fullscreen pauses the page background.
Independent MIT-licensed project, not affiliated with YouTube or Google.

## 日本語の説明

YouTubeの動画の色をページ全体の背景に広げる拡張機能です。

放射状モードでは動画の縁の色を外側へ伸ばします。スクロールで動画が半分
隠れると動画全体の背景へゆっくり混ざり始め、見えなくなると完全に切り替わり
ます。上に戻すと放射状へ戻ります。
移行と一緒に背景の光も抑え、見えなくなった時は設定した濃さの45%まで
暗くします。文字を読みやすくし、上に戻すと元の濃さに復帰します。

歯車の隣の丸いアイコンから濃さ・ぼかし・彩度・サンプリング位置を調整
できます。背景のFPSは24〜60で調整でき、初期値は30FPSです。高いFPSほど
描画負荷も増えます。設定は保存されます。
暗いモノクロの設定パネルは関連動画リストに重なり、×、同じ
アイコン、背景オフまで開いたままです。

対称な黒帯を検出して内側から色を拾い、黒帯を背景に置き換えることも
できます。映像本体は拡大しません。対象はデスクトップYouTubeの動画ページ。
設定はローカル保存のみ。追跡・外部通信はありません。保護動画やYouTubeの
変更では使えない場合があります。全画面ではページ背景を停止します。
MITライセンスの独立したオープンソースプロジェクトです。

## Submission fields

Single purpose: Render a customizable ambient background on YouTube watch pages.

`storage`: Save local visual preferences between visits.

Website access: Read the YouTube video element's pixels and add background
canvases and settings controls. Only `https://www.youtube.com/*` is requested.

Remote code: No. Data collection / transmission: None.

Privacy URL: https://github.com/REZERV-Amaghini/youtube-ambient-canvas/blob/main/PRIVACY.md

Assets: `icon-128.png`, `store-promo-440x280.png`, `store-screenshot-1280x800.png`.
The screenshot is labelled as a demonstration using original test graphics.
Add actual-site screenshots if the store reviewer requests them.

Reviewer steps: Open a regular non-DRM YouTube watch page. Use the round icon
beside the gear. Toggle radial mode and black-bar options. Scroll beyond half
visibility, then fully out of view, then return. Verify automatic dimming and
restoration of the configured strength. Adjust background FPS between 24 and 60,
reload and verify the saved value. Switch the background off and verify that
the page and any clipped black bars are restored.
