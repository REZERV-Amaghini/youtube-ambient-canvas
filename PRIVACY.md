# Privacy policy

YouTube Ambient Canvas 0.2.1 — 2026-09-30

This extension does not collect or transmit personal data. It has no analytics,
advertising, telemetry, accounts, remote code, or external network requests.

On YouTube watch pages it draws the playing video into small temporary canvases
in your browser. It reads sampled pixel colors to render the ambient background
and detect black bars. These pixels stay in memory; they are not saved or sent
anywhere. It does not read watch history, searches, account details, comments,
or audio.

Only display preferences (enabled state, mode, black-bar options, strength,
blur, saturation, edge inset, background frame rate, and interface language) are saved in local extension storage. They are
not synced or shared. Removing the extension removes its extension storage.

The `storage` permission saves preferences. The content script runs only on
`https://www.youtube.com/*` to access the video and place the settings button.
No permissions for other websites are requested. YouTube and your browser have
their own privacy policies, independent of this extension. Questions can be
filed through the public repository's issue tracker once it is published.

The extension styles the embedded YouTube live-chat background while ambient
is enabled. It does not read or transmit chat messages and does not send chats.

## 日本語

この拡張機能は個人情報を収集・送信しません。動画の色と黒帯を調べるための
小さな画像はメモリ内でのみ扱い、保存・送信しません。閲覧履歴、検索内容、
アカウント情報、コメント、音声は読み取りません。表示設定だけを拡張機能の
ローカルストレージに保存します。同期、広告、解析、外部通信はありません。
