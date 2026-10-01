# Store listing — 0.2.17

Name: YouTube Ambient Canvas

## Short description

Extend YouTube video colors across the page with radial glow, smooth scroll blending, and black-bar detection.

動画の色をYouTube全体の背景へ。放射状の光、スクロールに合わせた切り替え、黒帯検出、ぼかし・濃さ・彩度の調整。

## English description

Bring the colors of your YouTube video to the surrounding page.

Choose radial edge glow or a full-frame background. As the video scrolls out of
view, radial glow blends into a full-frame background and dims to keep surrounding
text readable. Scrolling back restores your chosen strength.

Adjust strength, blur, saturation, sample inset and background frame rate
(24–60 FPS, default 30). Higher frame rates increase rendering load. Open the
ambient icon beside the player's settings button. The translucent settings panel
stays open when you turn the background off. Japanese and English interfaces
are available.

Buttons, filters, search fields and the Enhancer toolbar use shared translucent
surfaces. Sidebar, menu and chat backgrounds receive matching styling. Black-bar
detection samples colors inside estimated bars; you can also replace detected
bars with ambient color without enlarging the picture.

An optional rapid-flash notice is enabled by default. After about three seconds
of detected rapid flashing, a dark dialog appears while playback and your
background settings remain unchanged. Choose “Reduce strength to 15%” or
“Don't show again.” The notice can be re-enabled in Advanced settings. Monitoring
also works with the background off or in fullscreen. Detection is incomplete
and does not guarantee safety.

For desktop YouTube watch pages. Fullscreen stops the page background. Protected
videos, theme extensions and YouTube layout changes may limit functionality.
Compatibility with Enhancer for YouTube and other themes is being improved;
some display conflicts can remain.

Preferences stay in local extension storage. No tracking, analytics, remote code
or external data transmission. An independent MIT-licensed project, not affiliated
with YouTube or Google.

## 日本語の説明

YouTubeの動画の色を、ページ全体の背景に広げる拡張機能です。

動画の縁から色を広げる放射状モードと、動画全体の背景を選べます。
スクロールで動画が隠れるにつれて背景全体へ滑らかに切り替わり、周囲の文字を
読みやすくするため光を抑えます。上へ戻すと設定した濃さに復帰します。

濃さ・ぼかし・彩度・採色範囲・背景のFPSを調整できます。FPSは24〜60、
初期値は30です。高いFPSほど描画負荷も増えます。歯車の隣のアンビエント
アイコンから設定を開きます。背景をオフにしても設定パネルは開いたままです。
日本語・英語に対応しています。

ボタン、絞り込み、検索欄、Enhancerのツールバーに共通の半透明背景を使い、
サイドバー・メニュー・チャットの背景も調整します。黒帯を推定して内側から
色を拾い、検出した黒帯を背景に置き換えることもできます。映像本体は拡大しません。

高速点滅の警告は初期状態でオンです。検出した高速点滅が約3秒続くと、
暗いダイアログを最前面に表示します。再生や背景設定は自動で変更しません。
「濃さを下げる（15%）」「二度と表示しない」を選べ、詳細設定から警告を
再度オンにできます。背景オフ・全画面でも監視します。検出は完全ではなく、
安全を保証する機能ではありません。

対象はデスクトップYouTubeの動画ページです。全画面ではページ背景を停止します。
保護動画、テーマ拡張、YouTubeの変更によって使えない場合があります。
Enhancer for YouTubeなどとの互換性は改善中で、一部の表示が崩れる場合があります。

設定は拡張機能のローカルストレージに保存します。追跡・解析・リモートコード・
外部へのデータ送信はありません。YouTube・Googleとは関係のない、MITライセンスの
独立したプロジェクトです。

## Submission fields

Single purpose: Render a customizable ambient background on YouTube watch pages.

`storage`: Save local visual preferences between visits.

Website access: Read the YouTube video element's pixels and add background
canvases and settings controls. Only `https://www.youtube.com/*` is requested.

Remote code: No. External collection / transmission: None.
Chrome data disclosure: Website content (video pixels processed locally in
temporary memory only, for ambient visuals; no developer access or retention).
Firefox data collection permission: None (no data is sent off the device).

Privacy URL: https://github.com/REZERV-Amaghini/youtube-ambient-canvas/blob/main/PRIVACY.md

Assets: `icon-128.png`, `store-promo-440x280.png`, `store-screenshot-1280x800.png`.
The screenshot is labelled as a demonstration using original test graphics.
Add actual-site screenshots if the store reviewer requests them.

Reviewer steps: Open a regular non-DRM YouTube watch page. Use the round icon
beside the gear. Toggle radial mode and black-bar options. Scroll beyond half
visibility, then fully out of view, then return. Verify automatic dimming and
restoration of the configured strength. Adjust background FPS between 24 and 60,
reload and verify the saved value. Switch the background off and verify that
the page and any clipped black bars are restored while the settings panel stays
open and usable. Close the panel with its close button or the ambient icon.
Switch between Japanese and English and reload to verify the saved language.
On a page with live chat, verify transparent chat/welcome/input backgrounds,
then turn ambient off and verify that the original chat backgrounds return.
