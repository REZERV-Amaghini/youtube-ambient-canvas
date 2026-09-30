# 対応候補と検証計画

0.2.0の対象はデスクトップYouTubeのみです。下記は拡張先の候補です。

|対象|候補の取り込み方|次の確認|状態|
|---|---|---|---|
|YouTube / Chrome・Chromium|動画要素＋専用UI|通常・シアター・黒帯・スクロール・競合|最初の対象|
|YouTube / Firefox|共通描画＋WebExtensions|Canvas、保存、AMO検査、実サイト|提出パッケージ準備|
|Edge / Brave|Chrome版|各ブラウザでインストールと再生|未検証|
|Twitch|専用アダプター|ライブ・VOD・クリップ、広告、チャット|未実装|
|Vimeo|専用アダプター|本体・埋め込みiframe、アクセス制限|未実装|
|Dailymotion / ニコニコ動画|専用アダプター|DOM、広告、コメント、描画可否|未実装|
|Jellyfin Web|専用アダプター|ローカル配信、字幕、再生方式、URL権限|未実装|
|Plex Web|専用アダプター|保護動画、字幕、認証|未実装|
|mpv|ネイティブ用シェーダー／スクリプト|背景のウィンドウ合成、OS対応|別実装が必要|
|VLC|ネイティブ用アダプター|映像出力とウィンドウの拡張方法|別実装が必要|

各対象で「フレームをローカル描画できるか」を小さく試し、可能な対象を共通の
描画へつなぎます。UIとページ背景は対象ごとに分け、権限も限定して追加します。

16:9、横長、縦長、上下帯、左右帯、暗いシーン、停止、シーク、広告、動画変更、
シアター、全画面、ズーム、リサイズ、画面外、非表示タブ、保護動画を確認。
性能は描画計算だけでなく、GPU合成、フレーム落ち、電力も実機で測ります。

[Twitch動画仕様](https://dev.twitch.tv/docs/embed/video-and-clips/)、
[Vimeo SDK](https://developer.vimeo.com/player/sdk/basics)、
[Jellyfinクライアント一覧](https://jellyfin.org/docs/general/clients/)、
[mpvシェーダー仕様](https://mpv.io/manual/stable/)を候補選定の参考にしています。
APIがあることは、拡張機能でフレームを読めることを意味しません。
