# 公開手順 — 0.2.6

|提出物|用途|
|---|---|
|`dist/youtube-ambient-canvas-chrome-0.2.6.zip`|Chrome Web Store|
|`dist/youtube-ambient-canvas-firefox-0.2.6.zip`|Firefox AMO|
|`dist/youtube-ambient-canvas-source-0.2.6.zip`|公開ソース／AMOのソース資料|
|`dist/youtube-ambient-canvas-store-assets-0.2.6.zip`|説明文・アイコン・画像|
|`dist/SHA256SUMS.txt`|チェックサム|

本体ZIPは実行コード、マニフェスト、アイコン、ライセンスのみです。
Chrome版からFirefox固有項目を除き、Firefox版は収集なしを宣言しています。

## Chrome Web Store

1. [Developer Dashboard](https://chrome.google.com/webstore/devconsole)でChrome
   用ZIPをアップロードします。
2. `LISTING.md`の説明、128pxアイコン、440×280画像、1280×800スクリーンショット
   を登録。単一目的、権限の理由、リモートコードなしを入力。
   Chromeでは端末内だけの処理も申告対象です。「ウェブサイトのコンテンツ」を
   選び、動画の画素をメモリ上で一時処理することを説明します。外部送信はありません。
3. 公開した`PRIVACY.md`のURL、連絡先、配布地域をアカウントに合わせて入力。
4. テスト手順を記載して審査提出。公開後のアイテムURLをREADMEのダウンロード
   欄へ追加します。ストアIDは審査前には確定したリンクとして記載しません。

[公式準備手順](https://developer.chrome.com/docs/webstore/prepare)と
[画像仕様](https://developer.chrome.com/docs/webstore/images)に基づきます。
ローカル検証の成功は審査承認を保証しません。

## Firefox AMO

1. [AMO Developer Hub](https://addons.mozilla.org/developers/)でFirefox用ZIPを提出。
2. 求められたらソースZIPを渡します。コードは難読化しておらず、ビルドは
   `python scripts/build.py`だけです。実行時依存はありません。
3. MIT、説明、プライバシーURL、画像、テスト手順を入力して審査提出。
4. 永続配布の署名はAMO側で行います。手元のZIPは署名前の提出用です。

Firefox 140以降を対象に、[データ同意仕様](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/)
に従って`required: ["none"]`を宣言しています。
今回の対応・検証範囲はデスクトップです。Android互換性をマニフェストで宣言せず、
AMOの互換性選択でもAndroidを外してデスクトップ向けとして提出します。
[パッケージ仕様](https://extensionworkshop.com/documentation/publish/package-your-extension/)も参照。

## GitHub

Publicリポジトリにソース、MIT、ビルド手順とテストを公開します。
`dist/`、npmキャッシュ、プロファイル、個人用のキャプチャはGit対象外です。
提出用ZIPはReleasesの添付ファイルとして配布できます。

ストアへの提出・公開操作はこのローカル準備とは別です。開発者アカウント、
連絡先、公開範囲などの入力と審査提出が必要です。
