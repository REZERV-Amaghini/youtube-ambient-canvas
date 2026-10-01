'use strict';
const assert = require('node:assert/strict');
const Store = require('../settings-store.js');
const defaults = { enabled: true, radial: true, avoidBars: true, fillBars: true, flashWarning: true,
  strength: 65, blur: 90, saturation: 145, inset: 0, fps: 30, language: 'ja' };
function backend(initial = {}, hold = false) {
  const data = structuredClone(initial), listeners = new Set(), reads = [], writes = [];
  const storage = { onChanged: { addListener: f => listeners.add(f), removeListener: f => listeners.delete(f) }, local: {
    get: keys => {
      const snapshot = Object.fromEntries(keys.filter(k => Object.hasOwn(data, k)).map(k => [k, structuredClone(data[k])]));
      return hold ? new Promise(resolve => reads.push(() => resolve(snapshot))) : Promise.resolve(snapshot);
    },
    set: async values => {
      writes.push(structuredClone(values));
      const changes = {};
      for (const [key, value] of Object.entries(values)) { changes[key] = { oldValue: data[key], newValue: value };data[key] = value; }
      for (const listener of listeners) listener(changes, 'local');
    }
  } };
  return { storage, data, listeners, reads, writes };
}
(async () => {
  const old = backend({ ambient: { enabled: false, blur: 45, fps: 39.4, flashWarning: false } });
  const upgraded = new Store(old.storage, defaults);await upgraded.ready;
  assert.equal(upgraded.values.enabled, false);assert.equal(upgraded.values.blur, 45);
  assert.equal(upgraded.values.fps, 39);assert.equal(upgraded.values.flashWarning, false);
  assert.deepEqual(old.writes, [], 'Reading an older profile does not overwrite or migrate it destructively');
  upgraded.dispose();

  const shared = backend({ ambient: { blur: 42 } });
  const a = new Store(shared.storage, defaults), b = new Store(shared.storage, defaults);
  await Promise.all([a.ready, b.ready]);
  await a.set('flashWarning', false, true);
  assert.equal(b.values.flashWarning, false, 'An already open tab follows the never-show preference');
  await b.set('blur', 70, true);
  assert.equal(shared.data['yac-setting:flashWarning'], false);
  assert.deepEqual(shared.writes.at(-1), { 'yac-setting:blur': 70 }, 'Unrelated sliders save only their own key');
  assert.equal(a.values.blur, 70);
  await Promise.all([a.set('saturation', 155, true), b.set('strength', 15, true)]);
  const reload = new Store(shared.storage, defaults);await reload.ready;
  assert.equal(reload.values.saturation, 155);assert.equal(reload.values.strength, 15);
  assert.equal(reload.values.flashWarning, false);
  assert.deepEqual(shared.data.ambient, { blur: 42 }, 'The legacy bag remains intact');
  let notifications = 0;
  const deduplicated = new Store(shared.storage, defaults, { onChange: () => notifications++ });await deduplicated.ready;
  const before = notifications;
  await deduplicated.set('blur', 81, true);
  assert.equal(notifications, before + 1, 'The own storage echo does not invalidate rendering twice');
  await deduplicated.set('blur', 81, true);
  assert.equal(notifications, before + 1, 'Persisting an unchanged field does not repaint');
  deduplicated.dispose();
  a.dispose();b.dispose();reload.dispose();assert.equal(shared.listeners.size, 0);

  const delayed = backend({ ambient: { enabled: false, blur: 90 } }, true), changes = [];
  const startup = new Store(delayed.storage, defaults, { onChange: (values, meta) => changes.push({ values, ...meta }) });
  assert.equal(startup.loaded, false);
  startup.set('blur', 25);
  await delayed.storage.local.set({ 'yac-setting:flashWarning': false });
  delayed.reads[0]();await startup.ready;
  assert.equal(startup.values.enabled, false, 'Delayed OFF is retained');
  assert.equal(startup.values.blur, 25, 'Input while loading survives an older snapshot');
  assert.equal(startup.values.flashWarning, false, 'A change received during loading survives an older snapshot');
  await delayed.storage.local.set({ 'yac-setting:strength': 15 });
  assert.equal(startup.values.blur, 25, 'An unrelated later tab event cannot undo an unsaved startup edit');
  assert.equal(changes.at(-1).loaded, true);
  startup.dispose();

  const checked = backend({ 'yac-setting:strength': 1, 'yac-setting:blur': 1000, 'yac-setting:fps': 59.5,
    'yac-setting:language': 'invalid', 'yac-setting:flashWarning': 'false' });
  const normalized = new Store(checked.storage, defaults);await normalized.ready;
  assert.equal(normalized.values.strength, 15);assert.equal(normalized.values.blur, 160);
  assert.equal(normalized.values.fps, 60);assert.equal(normalized.values.language, 'ja');assert.equal(normalized.values.flashWarning, true);
  await normalized.set('blur', NaN, true);await normalized.set('unknown', 12, true);
  assert.deepEqual(checked.writes, [], 'Malformed and unknown fields cannot be persisted');
  normalized.dispose();
  let disposedCalls = 0;
  const disposed = backend({}, true), abandoned = new Store(disposed.storage, defaults, { onChange: () => disposedCalls++ });
  abandoned.dispose();disposed.reads[0]();await abandoned.ready;
  assert.equal(disposedCalls, 0);assert.equal(disposed.listeners.size, 0);
  let readError;
  const failed = new Store({ local: { get: () => Promise.reject(new Error('read failed')) } }, defaults,
    { onChange: (_, meta) => { readError = meta.error; } });
  await failed.ready;assert.equal(failed.loaded, true);assert.equal(readError.message, 'read failed');failed.dispose();
  console.log('PASS: legacy preferences, per-key concurrent tab saves, live synchronization, pending-read edits, validation and disposal');
})().catch(error => { console.error(error);process.exitCode = 1; });
