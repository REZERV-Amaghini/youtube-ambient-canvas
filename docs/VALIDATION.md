# 検証結果 — 0.2.3 / 2026-10-01

## 0.2.3 theme compatibility verification

- Reproduced the header-only ambient problem using self-authored, high-specificity theme backgrounds and inline important styles.
- Confirmed transparent watch-page surfaces while ambient is active; the video, share button and thumbnail styling remain intact.
- Confirmed original inline background color, image and shadow are restored when ambient is switched off.
- Changed the theme color during active rendering, then confirmed the updated color is restored on disable.
- Confirmed fullscreen suspends the overrides and leaving fullscreen restores the ambient page background.
- JavaScript syntax and distribution archives are checked for this revision. Renderer code and permissions are unchanged.

These checks used the local Chromium fixture at `?theme`. Actual Firefox playback with Enhancer enabled still requires confirmation with 0.2.3. Earlier rendering measurements below belong to their stated revisions.

## 0.2.2の変更と確認

Androidの互換性宣言を外し、デスクトップ向けに提出できるよう修正しました。
実行コード・権限・描画処理は0.2.1と同じです。READMEは実際のYouTubeで撮影した
GIFへ差し替え、公開ソースZIPにもその素材を含めます。ストア用の自作画像は保持。

Mozilla web-ext 9.4.0はエラー0、警告1、通知0でした。警告は未対応のAndroidでの
データ同意項目の最低バージョンに関するものです。AMOではAndroidを対象外にします。
以下の描画・UI・保存の検証は0.2.1で実施した結果です。

## 確認済み

- JavaScriptの構文検査。
- ChromiumのCanvasで上下左右・斜めの端ピクセルの放射状投影。
- 50%混合時の色、100%移行時の全体フレーム。
- 上下帯、左右帯、真っ暗なシーンの誤判定抑制、手動の縁の内側。
- スクロールの計算：半分まで0%、4分の3で50%、画面外で100%。
- ローカル動画のスクロール実動作：4分の3で0.499、画面外で1.000。
- 同じ移行に連動する自動減光と、上へ戻した時の元の濃さへの復帰。
- 手動の全体背景モードでも、動画が画面外に出ると65%から29.25%へ減光。
- 黒帯を隠してアンビエントを見せる処理、オフ時のclip-path復元。
- 設定パネルをプレーヤー内の右下へ配置。外側クリックで閉じない動作、背景オフでの閉鎖。
- ローカル映像で通常・シアター・全画面・640px幅の配置がプレーヤー内に収まることを確認。
- 設定保存と再読み込み。白黒のスイッチ・スライダー。ぼかし付きの半透明パネル背景。
- 背景FPSの24〜60範囲・初期値30・再読み込み後の保存復元。
  Chromiumの60FPSテスト映像で、24設定は約23.7FPS、60設定は約60.1FPS。
  旧設定12は24へ補正。破棄後の追加描画は0回。
- 実際のYouTubeで検索欄の透明背景と、プレーヤー内の設定パネルを確認。
- 日本語／英語の切り替えで設定名・説明・アイコンの案内が変わり、再読み込み後も英語を復元。
- 実際のYouTubeライブチャットで、本体・案内カード・入力欄を透過。
  背景オフで元の不透明背景へ復元。チャット本文や色付きカードは変更しない。
- 実際のYouTube（CodexのChromiumブラウザ）で最新版をプレビュー反映し、
  プレイヤー内ボタン、背景、パネル、スクロールによる完全移行を確認。
- Firefox 156.0.1の隔離したheadless環境で、同じCanvas描画検査がすべてPASS。

ローカル動画は自作のCanvas映像です。Firefoxの結果は描画エンジンのテストで、
Firefoxへ拡張をインストールして実際のYouTubeを操作した検査とは別です。

## 性能の扱い

小さな合成フレームを使う描画テストでは、中央値はChromiumで約1.3ms、
Firefoxで約1msでした。この値は色の投影計算の目安だけです。実動画のデコード、
ぼかし・合成、GPU負荷、電力、フレーム落ちを含む性能評価ではありません。

## 未確認

- Firefox上の実際のYouTubeでの長時間再生と他拡張との競合。
- 実際のChrome製品版での長時間再生、全バージョンでの動作。
- 保護動画、HDR、ライブ配信、広告切り替え、全組み合わせの画面サイズ。
- YouTube以外のサイト・ネイティブ再生ソフト。
- Chrome Web Store／AMOの審査・署名・一般公開。

## 提出物

Mozilla web-ext 9.4.0の`lint --warnings-as-errors`はエラー0、警告0、通知0。
Chrome・Firefoxの本体ZIPはマニフェストを直下に置き、テスト用ファイルや
プロファイルを含めません。ZIPのCRCと明示したファイル一覧を確認しています。
128pxアイコン、440×280の画像、1280×800の自作デモ画像を用意しました。
