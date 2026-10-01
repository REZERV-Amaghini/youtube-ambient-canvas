'use strict';
const assert = require('node:assert/strict');
const { harness } = require('./check-ambient.cjs');

async function main() {
 for (const idleCallbacks of [true, false]) {
  const h = harness(true, { idleCallbacks });
  const chat = h.document.createElement('ytd-live-chat-frame');
  const chatFrame = h.document.createElement('iframe'); chatFrame.id = 'chatframe';
  chat.style.setProperty('background-color', 'rgb(35, 36, 39)');
  chatFrame.style.setProperty('border-color', 'rgb(65, 66, 69)');
  chat.append(chatFrame); h.watch.append(chat);
  h.below.style.setProperty('background-color', 'rgb(30, 30, 30)', 'important');
  await h.load({ enabled: true, flashWarning: false });
  const scans = () => h.stats.surfaceScans;
  assert.equal(h.below.style.getPropertyValue('background-color'), 'transparent', 'ON guards a real watch surface');
  assert.equal(h.comments.style.getPropertyValue('background-color'), 'transparent', 'comments shell remains transparent');
  assert.equal(h.get('yac-background').style.opacity, '0.6500', 'ambient strength remains unchanged');
  assert.equal(chat.style.getPropertyValue('background-color'), 'rgb(35, 36, 39)', 'the inline surface guard leaves the CSS chat shade intact');
  assert.equal(chatFrame.style.getPropertyValue('border-color'), 'rgb(65, 66, 69)', 'native iframe border is retained');
  let before = scans();
  for (let i = 0; i < 5; i++) { h.advance(1000); h.discover(); }
  assert.equal(scans(), before, 'stable playback performs no recurring whole-page surface scans');

  for (let i = 0; i < 50; i++) {
    const thread = h.document.createElement('ytd-comment-thread-renderer');
    const content = h.document.createElement('div'); content.id = 'content';
    thread.append(content); h.comments.append(thread);
  }
  h.flushTasks(); h.advance(1000); h.discover();
  assert.equal(scans(), before, '50 loaded comment threads do not rescan the page');
  assert.equal(h.comments.style.getPropertyValue('background-color'), 'transparent', 'loading comments preserves transparency');
  h.comments.children[0].classList.add('expanded');
  h.player.classList.add('ytp-playing'); h.player.classList.add('ytp-autohide');
  h.flushTasks(); h.advance(1000); h.discover();
  assert.equal(scans(), before, 'comment and playback-control classes do not rescan structural surfaces');
  assert.equal(h.timeouts.size + h.idle.size, 0, 'unrelated classes do not schedule work');

  const ticket = h.document.createElement('ytd-ticket-shelf-renderer');
  const transcript = h.document.createElement('ytd-transcript-renderer');
  const wrapper = h.document.createElement('section'); wrapper.append(ticket, transcript); h.below.append(wrapper);
  h.flushTasks();
  assert.equal(scans(), before + 1, 'late surfaces in one batch receive one idle/fallback sync');
  assert.equal(ticket.style.getPropertyValue('background-color'), 'transparent');
  assert.equal(transcript.style.getPropertyValue('background-color'), 'transparent');
  before = scans(); h.flushTasks(); h.advance(1000); h.discover();
  assert.equal(scans(), before, 'our own styles do not trigger a mutation feedback loop');

  h.below.style.setProperty('background-color', 'rgb(70, 80, 90)', 'important');
  h.flushTasks();
  assert.equal(h.below.style.getPropertyValue('background-color'), 'transparent', 'external inline theme change is guarded again');
  h.enabled().checked = false; h.event(h.enabled(), 'input');
  assert.equal(h.below.style.getPropertyValue('background-color'), 'rgb(70, 80, 90)', 'OFF restores the latest external theme value');
  assert.equal(h.below.style.getPropertyPriority('background-color'), 'important');
  h.enabled().checked = true; h.event(h.enabled(), 'input'); h.flushTasks();
  before = scans();
  h.resize(); h.resize(); h.resize();
  assert.equal(scans(), before, 'resize bursts defer full-page work');
  assert.equal(h.timeouts.size + h.idle.size, 1, 'resize burst coalesces into one scheduled job');
  h.advance(1000); assert.equal(scans(), before + 1, 'resize burst needs only one refresh');

  h.document.hidden = true; h.event(h.document, 'visibilitychange');
  before = scans();
  const hiddenTicket = h.document.createElement('ytd-ticket-shelf-renderer');
  h.below.append(hiddenTicket); h.flushTasks();
  for (let i = 0; i < 5; i++) { h.advance(1000); h.discover(); }
  assert.equal(scans(), before, 'hidden changes and discovery never scan the page');
  h.document.hidden = false; h.event(h.document, 'visibilitychange'); h.flushTasks();
  assert.equal(scans(), before + 1, 'visible resume synchronizes deferred surfaces once');
  assert.equal(hiddenTicket.style.getPropertyValue('background-color'), 'transparent');

  h.player.style.setProperty('background-color', 'rgb(1, 2, 3)');
  h.watch.setAttribute('theater', ''); h.flushMutations();
  assert.equal(h.player.style.getPropertyValue('background-color'), 'transparent', 'theater player surround is guarded');
  assert.equal(h.timeouts.size + h.idle.size, 0, 'theater entry bypasses the delayed job');
  assert.equal(chat.style.getPropertyValue('background-color'), 'rgb(35, 36, 39)', 'theater entry does not overwrite the chat face with transparency');
  h.watch.removeAttribute('theater'); h.flushMutations();
  assert.equal(h.player.style.getPropertyValue('background-color'), 'rgb(1, 2, 3)', 'leaving theater restores the player surface');
  assert.equal(h.timeouts.size + h.idle.size, 0, 'theater exit restores without waiting');
  assert.equal(chatFrame.style.getPropertyValue('border-color'), 'rgb(65, 66, 69)', 'theater changes preserve the iframe border');
  before = scans(); wrapper.remove(); h.flushTasks(); h.advance(1000);
  assert.equal(scans(), before + 1, 'removed wrapper refreshes tracked descendants');
  assert.equal(ticket.style.getPropertyValue('background-color'), '', 'removed surface is restored');

  h.resize(); h.enabled().checked = false; h.event(h.enabled(), 'input'); h.flushTasks();
  before = scans();
  assert.equal(h.below.style.getPropertyValue('background-color'), 'rgb(70, 80, 90)', 'OFF restores immediately despite a queued refresh');
  assert.equal(chat.style.getPropertyValue('background-color'), 'rgb(35, 36, 39)', 'OFF leaves the native chat face available again');
  h.advance(3000); assert.equal(scans(), before, 'canceled job cannot reapply after OFF');
  h.enabled().checked = true; h.event(h.enabled(), 'input'); h.flushTasks(); h.resize();
  h.event(h.document, 'yac-dispose');
  before = scans(); h.advance(3000);
  assert.equal(scans(), before, 'disposed observer/jobs do not scan or reapply');
  assert.equal(h.below.style.getPropertyValue('background-color'), 'rgb(70, 80, 90)');
  assert.equal(h.timeouts.size + h.idle.size, 0, 'dispose clears scheduled work');
  assert.ok(h.observers.every(observer => !observer.target), 'dispose disconnects DOM observers');
  console.log(`PASS (${idleCallbacks ? 'idle' : 'timer fallback'}): no recurring/50-comment/hidden scans; late surfaces, theme, theater, resize coalescing, restoration and teardown`);
 }

 const busy = harness(true);
 await busy.load({ enabled: true });
 busy.tick({ flush: false });
 assert.ok(busy.worker.pending, 'test leaves one Worker frame outstanding');
 const reads = busy.stats.rectReads, styles = busy.stats.computedStyleReads;
 for (let i = 0; i < 5; i++) busy.tick({ flush: false });
 assert.equal(busy.stats.rectReads, reads, 'busy Worker skips geometry reads');
 assert.equal(busy.stats.computedStyleReads, styles, 'busy Worker skips computed style');
 busy.event(busy.document, 'yac-dispose');
 console.log('PASS: Worker backpressure applies before main-thread layout work');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
