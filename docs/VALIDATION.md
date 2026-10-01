# 検証結果 — 0.2.7 development / 2026-10-01

## 0.2.7 keep settings open when ambient is disabled

- Removed the enabled-input handler's automatic dialog closure. OFF now changes the background state without dismissing settings or moving focus.
- Verified in the Chromium fixture with DeepDark: OFF keeps the dialog visible, the switch focused and the off-state message visible. Adjusting blur while OFF is saved and retained after reload.
- Verified ON restores ambient in the same open dialog using the adjusted blur value. The close button and Escape still close the dialog and return focus to its player button.
- Installed-extension verification on actual YouTube/Firefox remains pending a reload of 0.2.7.

## Previous 0.2.6 verification

## 0.2.6 control-surface regression correction

- User feedback confirmed fully transparent 0.2.5 buttons lose their visible faces. The control-specific inline overrides, synthetic chip outline and forced light text are removed.
- Compared 0.2.2 from its Git tag with 0.2.6 on the same native-control fixture: button/chip backgrounds, text colors, corner radii, padding, borders and absence of inline face overrides match. Backdrop blur is added behind the existing fills.
- With the complete Enhancer DeepDark stylesheet, verified button/chip faces retain 14% white opacity and 12px backdrop blur. Information/ticket layout surfaces remain transparent.
- Verified clicking still focuses the action button and native hover feedback remains active (opacity 0.16).
- CSS has a separate document_start manifest entry; video runtime remains at document_idle. The layout guard is retained; YouTube/Enhancer JavaScript functions are not replaced.
- Verified the redesigned settings in Chromium with Japanese/English labels, three immediate appearance sliders, native expandable advanced settings, local preference persistence, every switch and slider, 24-60 FPS endpoints, native arrow/Home/End keys, readout units, scrollable small-player content and Escape focus restoration.
- Verified mutual exclusion with native settings in the fixture and requested OFF-close/focus behavior. Black-bar replacement remains available with automatic detection off.
- Verified encoded black-bar replacement, same-origin chat transparency and restoration on OFF. Surrounding information/ticket/transcript layouts remain transparent while button faces retain their fills. All existing renderer checks pass, including radial edge samples, letterbox/pillarbox detection, dark-frame handling, manual inset and scroll blending.
- Live IAB inspection confirmed Enhancer 3.0.19 Material/Pink is installed and identified an overlap between native and old ambient settings. YouTube's underlying popup CSS uses rgba(28,28,28,.9). The revised extension must be reloaded before claiming live verification of the new settings. Browser policy blocks chrome://extensions, so the reload is handed to the user.
- Actual Firefox appearance with 0.2.6 remains unconfirmed. Normal 0.2.2 publication continues.

## Previous 0.2.5 verification

## 0.2.5 screenshot-guided surfaces

- User testing confirmed 0.2.4 still leaves some theme backgrounds opaque. Screenshots identify the event-ticket shelf, action buttons, masthead button faces, filter chips and full-bleed player margins.
- The more faithful fixture reproduces black anonymous information wrappers, ticket-shelf containers/renderers and the player-full-bleed container under the complete Enhancer DeepDark theme.
- Development 0.2.5 expands only these surrounding surfaces and button fills, preserves touch-feedback children, and marks the selected filter with an outline.
- Verified all reproduced information/ticket/button/chip backgrounds become transparent under the complete theme. Filled-button text stays light, selected-chip outline remains visible and thumbnails keep their image gradients.
- Verified mouse hover still activates the native feedback child (opacity 0.16) and clicking still focuses the action button. Turning ambient off restores the original theme fills and removes our inline background overrides.
- Verified the full-bleed theater wrapper and player margins are transparent with black-bar replacement off. Entering fullscreen pauses ambient and restores the original black player; returning to normal mode keeps the surrounding page transparent and restores the normal player background.
- Actual Firefox verification remains pending; normal 0.2.2 publication continues.

## Previous 0.2.4 fixture verification

## 0.2.4 theme surfaces and theater margins

- User testing of 0.2.3 on Firefox still showed black information, related-video and transcript-panel backgrounds.
- Reproduced these missing inner surfaces using YouTube's observed layout boxes and a nested transcript fixture.
- Verified transparent inner surfaces and original-style restoration in Chromium with the complete Material/Pink CSS bundled in Enhancer for YouTube 2.0.136.
- Verified theater margins show ambient even with encoded-black-bar replacement switched off. Picture size, controls, button background and thumbnails are preserved.
- Verified fullscreen restores the player's black background and pauses ambient; leaving theater mode restores the original normal-player background while surrounding surfaces remain transparent.
- The GPL theme is an ignored local test input and is excluded from public source and extension packages.

Actual Firefox testing subsequently confirmed residual opaque surfaces in 0.2.4. Store submissions use the normal 0.2.2 version; 0.2.4 is a development package until that check completes.

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
