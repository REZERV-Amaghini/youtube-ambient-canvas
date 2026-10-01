# Privacy policy

YouTube Ambient Canvas — 2026-10-01 (development 0.2.11; public 0.2.2)

This extension does not collect or transmit personal data. It has no analytics,
advertising, telemetry, accounts, remote code, or external network requests.

On YouTube watch pages it draws the playing video into small temporary canvases
in your browser. It reads sampled pixel colors to render the ambient background
and detect black bars. Development 0.2.11 also uses the same sampled pixels for
an optional rapid-flash warning. These pixels stay in memory; they are not saved or sent
anywhere. It does not read watch history, searches, account details, comments,
or audio.

The development renderer transfers a 320×180 video bitmap to a packaged local
Worker through an extension-owned frame and private MessageChannel. Bar detection
uses that small bitmap; color and warning samples use 160×90 pixels. Each input
and output bitmap is closed after use, and no frame queue or recording is kept.
The Worker and host contain only bundled code and make no network requests.

For Chrome Web Store disclosure, this local video-pixel processing is disclosed
as handling website content. It is used only for the extension's ambient visual
features and the optional local flash warning. No website content is collected by the developer, retained, sold,
transferred to third parties, used for advertising or credit decisions, or made
available for human review. This use complies with the Chrome Web Store User
Data Policy, including its Limited Use requirements.

Only display preferences (enabled state, mode, black-bar options, strength,
blur, saturation, edge inset, background frame rate, interface language, and
flash-warning preference) are saved in local extension storage. They are
not synced or shared. Removing the extension removes its extension storage.

The `storage` permission saves preferences. The content script runs only on
`https://www.youtube.com/*` to access the video and place the settings button.
No permissions for other websites are requested. YouTube and your browser have
their own privacy policies, independent of this extension. Questions can be
filed through the [public issue tracker](https://github.com/REZERV-Amaghini/youtube-ambient-canvas/issues).

The extension styles the embedded YouTube live-chat background while ambient
is enabled. It does not read or transmit chat messages and does not send chats.

## 日本語

この拡張機能は個人情報を収集・送信しません。動画の色と黒帯を調べるための
小さな画像はメモリ内でのみ扱い、保存・送信しません。閲覧履歴、検索内容、
アカウント情報、コメント、音声は読み取りません。表示設定だけを拡張機能の
ローカルストレージに保存します。同期、広告、解析、外部通信はありません。
開発版0.2.11では同じ画像から高速点滅も調べ、警告の表示設定をローカル保存します。

Chromeストアでは動画のピクセルを端末内で処理することを「ウェブサイトの
コンテンツ」の取り扱いとして開示しています。用途はアンビエント表示と任意の点滅警告。
開発者による収集・保存、人による閲覧、第三者への販売・転送、広告や信用判断
への使用はありません。Chrome Web StoreのユーザーデータポリシーとLimited Use
要件に従います。
