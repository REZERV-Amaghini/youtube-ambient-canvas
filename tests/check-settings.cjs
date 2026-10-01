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
function pendingBackend(initial = {}) {
  const result = backend(initial), attempts = [];
  result.storage.local.set = values => {
    result.writes.push(structuredClone(values));
    return new Promise((resolve, reject) => attempts.push({
      succeed: () => {
        for (const [key, value] of Object.entries(values)) result.data[key] = structuredClone(value);
        resolve();
      },
      fail: reject
    }));
  };
  const complete = async (index, outcome, error) => {
    await new Promise(setImmediate);
    assert.ok(attempts[index], `Storage write ${index + 1} was started`);
    attempts[index][outcome](error);
  };
  return { ...result, succeed: index => complete(index, 'succeed'), fail: (index, error) => complete(index, 'fail', error) };
}
function observedStore(storage) {
  const changes = [];
  const store = new Store(storage, defaults, { onChange: (values, meta) => changes.push({ values, ...meta }) });
  return { store, changes };
}
function assertSaveError(change, key, error, count) {
  assert.equal(change.saveError.key, key);
  assert.equal(change.saveError.error, error);
  assert.equal(change.saveErrorCount, count);
}
function assertAnySaveError(change, expected) {
  assert.equal(change.saveErrorCount, expected.length);
  assert.ok(expected.some(([key, error]) => change.saveError.key === key && change.saveError.error === error),
    'The visible save error belongs to one of the unresolved keys');
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

  const throwingBackend = backend({ 'yac-setting:blur': 45 }), syncError = new Error('storage is unavailable');
  throwingBackend.storage.local.set = () => { throw syncError; };
  const throwing = observedStore(throwingBackend.storage);await throwing.store.ready;
  let thrownSave;
  assert.doesNotThrow(() => { thrownSave = throwing.store.set('blur', 80, true); },
    'A synchronous storage exception is reported through the returned Promise');
  await assert.rejects(thrownSave, error => error === syncError);
  assert.equal(throwing.store.values.blur, 80, 'A failed save keeps the edited value available in the current tab');
  assertSaveError(throwing.changes.at(-1), 'blur', syncError, 1);
  assert.equal(throwingBackend.data['yac-setting:blur'], 45);
  throwing.store.dispose();

  const retryBackend = pendingBackend({ 'yac-setting:blur': 45 });
  const retry = observedStore(retryBackend.storage);await retry.store.ready;
  assert.equal(retry.changes.at(-1).saveError, null);assert.equal(retry.changes.at(-1).saveErrorCount, 0);
  const asyncError = new Error('asynchronous storage failure');
  const failedSave = retry.store.set('blur', 75, true);
  assert.equal(retry.store.values.blur, 75, 'The edit is visible before persistence completes');
  const rejectedSave = assert.rejects(failedSave, error => error === asyncError);
  await retryBackend.fail(0, asyncError);await rejectedSave;
  assert.equal(retry.store.values.blur, 75);
  assertSaveError(retry.changes.at(-1), 'blur', asyncError, 1);
  const afterFailure = new Store(retryBackend.storage, defaults);await afterFailure.ready;
  assert.equal(afterFailure.values.blur, 45, 'Reloading exposes the previous persisted value after a failed save');
  afterFailure.dispose();
  const beforeRetry = retry.changes.length;
  const retriedSave = retry.store.set('blur', 75, true);
  await retryBackend.succeed(1);await retriedSave;
  assert.equal(retry.changes.length, beforeRetry + 1, 'A successful same-value retry notifies that the save error cleared');
  assert.equal(retry.changes.at(-1).values.blur, 75);
  assert.equal(retry.changes.at(-1).saveError, null);assert.equal(retry.changes.at(-1).saveErrorCount, 0);
  const afterRetry = new Store(retryBackend.storage, defaults);await afterRetry.ready;
  assert.equal(afterRetry.values.blur, 75, 'The successful retry is persisted');
  afterRetry.dispose();retry.store.dispose();

  const multipleBackend = pendingBackend(), multiple = observedStore(multipleBackend.storage);await multiple.store.ready;
  const blurError = new Error('blur save failed'), strengthError = new Error('strength save failed');
  const blurFailure = assert.rejects(multiple.store.set('blur', 80, true), error => error === blurError);
  await multipleBackend.fail(0, blurError);await blurFailure;
  const strengthFailure = assert.rejects(multiple.store.set('strength', 35, true), error => error === strengthError);
  await multipleBackend.fail(1, strengthError);await strengthFailure;
  assertAnySaveError(multiple.changes.at(-1), [['blur', blurError], ['strength', strengthError]]);
  const unrelatedSave = multiple.store.set('saturation', 160, true);
  await multipleBackend.succeed(2);await unrelatedSave;
  assertAnySaveError(multiple.changes.at(-1), [['blur', blurError], ['strength', strengthError]]);
  const blurRetry = multiple.store.set('blur', 80, true);
  await multipleBackend.succeed(3);await blurRetry;
  assertSaveError(multiple.changes.at(-1), 'strength', strengthError, 1);
  assert.equal(multiple.store.values.blur, 80);assert.equal(multiple.store.values.strength, 35);
  const strengthRetry = multiple.store.set('strength', 35, true);
  await multipleBackend.succeed(4);await strengthRetry;
  assert.equal(multiple.changes.at(-1).saveError, null);assert.equal(multiple.changes.at(-1).saveErrorCount, 0);
  multiple.store.dispose();

  const staleFailureBackend = pendingBackend(), staleFailure = observedStore(staleFailureBackend.storage);
  await staleFailure.store.ready;
  const oldFailureError = new Error('older save failed');
  const oldFailure = staleFailure.store.set('blur', 70, true);
  const rejectOldFailure = assert.rejects(oldFailure, error => error === oldFailureError);
  const newSuccess = staleFailure.store.set('blur', 80, true);
  await staleFailureBackend.succeed(1);await newSuccess;
  const beforeOldFailure = staleFailure.changes.length;
  await staleFailureBackend.fail(0, oldFailureError);await rejectOldFailure;
  assert.equal(staleFailure.changes.length, beforeOldFailure, 'An older failure cannot invalidate a newer successful save');
  assert.equal(staleFailure.changes.at(-1).saveError, null);assert.equal(staleFailure.changes.at(-1).saveErrorCount, 0);
  assert.equal(staleFailure.store.values.blur, 80);staleFailure.store.dispose();

  const staleSuccessBackend = pendingBackend(), staleSuccess = observedStore(staleSuccessBackend.storage);
  await staleSuccess.store.ready;
  const oldSuccess = staleSuccess.store.set('blur', 70, true), newFailureError = new Error('latest save failed');
  const newFailure = assert.rejects(staleSuccess.store.set('blur', 80, true), error => error === newFailureError);
  await staleSuccessBackend.fail(1, newFailureError);await newFailure;
  const beforeOldSuccess = staleSuccess.changes.length;
  await staleSuccessBackend.succeed(0);await oldSuccess;
  assert.equal(staleSuccess.changes.length, beforeOldSuccess, 'An older successful save cannot clear the latest failure');
  assertSaveError(staleSuccess.changes.at(-1), 'blur', newFailureError, 1);
  assert.equal(staleSuccess.store.values.blur, 80);staleSuccess.store.dispose();

  const abandonedBackend = pendingBackend(), abandonedSave = observedStore(abandonedBackend.storage);
  await abandonedSave.store.ready;
  const lateSuccess = abandonedSave.store.set('blur', 70, true), lateError = new Error('late save failure');
  const lateFailure = assert.rejects(abandonedSave.store.set('strength', 35, true), error => error === lateError);
  abandonedSave.store.dispose();const beforeLateCompletion = abandonedSave.changes.length;
  await abandonedBackend.succeed(0);await lateSuccess;
  await abandonedBackend.fail(1, lateError);await lateFailure;
  assert.equal(abandonedSave.changes.length, beforeLateCompletion, 'Disposed tabs receive no late success or failure callback');
  assert.equal(abandonedBackend.listeners.size, 0);
  console.log('PASS: legacy preferences, concurrent saves, live synchronization, pending-read edits, validation, persistence failures, retries, stale completions and disposal');
})().catch(error => { console.error(error);process.exitCode = 1; });
