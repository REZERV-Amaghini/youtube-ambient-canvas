'use strict';
// Numerical images and fake transports exercise lifecycle without flashing UI.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

class Bitmap {
  constructor(width = 320, height = 180, data = null) {
    this.width = width; this.height = height; this.data = data; this.closed = 0;
  }
  close() { this.closed++; }
}
class Canvas {
  constructor(width = 400, height = 400) {
    this.width = width; this.height = height;
    this.context = {
      draws: [], drawImage: (...args) => {
        this.context.draws.push(args);
        const source = args[0];
        if (!source.data || (source.width === this.width && source.height === this.height)) {
          this.data = source.data; return;
        }
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
        for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
          const from = (Math.floor(y * source.height / this.height) * source.width + Math.floor(x * source.width / this.width)) * 4;
          this.data.set(source.data.subarray(from, from + 4), (y * this.width + x) * 4);
        }
      },
      getImageData: () => ({ data: this.data || new Uint8ClampedArray(this.width * this.height * 4) }),
      createImageData: (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: value => { this.data = value.data; }
    };
  }
  getContext() { return this.context; }
  transferToImageBitmap() { return new Bitmap(this.width, this.height, this.data); }
}
const run = (context, name) => vm.runInContext(fs.readFileSync(path.join(root, name), 'utf8'), context, { filename: name });
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

function harness({ captureThrows = false, accepted = true } = {}) {
  const nodes = [], captures = [], channels = [], timers = new Map(), frames = [], failures = [];
  let timerId = 0;
  class Port {
    postMessage(value, transfers = []) { this.sent.push({ value, transfers }); }
    start() {} close() { this.closed = true; }
    constructor() { this.sent = []; }
  }
  class Channel {
    constructor() { this.port1 = new Port(); this.port2 = new Port(); channels.push(this); }
  }
  const context = vm.createContext({
    URL, Uint8Array, Uint8ClampedArray, crypto: { getRandomValues: array => array.fill(1) },
    location: { href: 'https://www.youtube.com/watch?v=test' }, MessageChannel: Channel,
    setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: id => timers.delete(id), queueMicrotask,
    createImageBitmap: (source, options) => {
      if (captureThrows) throw new Error('Unavailable');
      let resolve, reject;
      const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
      captures.push({ source, options, resolve, reject }); return promise;
    },
    document: {
      documentElement: { append: node => nodes.push(node) },
      createElement: () => ({ setAttribute() {}, style: {}, contentWindow: {
        postMessage(value, target, transfers) { this.connection = { value, target, transfers }; }
      }, remove() { this.removed = true; } })
    }
  });
  run(context, 'worker-client.js');
  const canvas = new Canvas();
  const client = new context.YacWorkerRenderer(canvas, {
    hostUrl: 'chrome-extension://test/worker-host.html',
    onFrame: (result, meta) => frames.push({ result, meta }),
    onFailure: reason => failures.push(reason), acceptFrame: () => accepted
  });
  const ready = () => { nodes[0].onload(); client.receive({ type: 'ready' }); };
  return { client, canvas, nodes, captures, channels, timers, frames, failures, ready };
}
const source = { currentSrc: 'video:test', currentTime: 4 };
const rectangle = { left: 10, top: 20, width: 640, height: 360 };
const viewport = { width: 1280, height: 720 };
const result = (client, extra = {}) => ({
  type: 'frame', requestId: client.pending.requestId, generation: client.pending.generation,
  bitmap: new Bitmap(400, 320), pixels: null, readable: true, cropped: false,
  videoCrop: { x: 0, y: 0, width: 160, height: 90 }, stableFrames: 4, ...extra
});

(async () => {
  const h = harness();
  assert.equal(h.client.draw(source, rectangle, viewport, true), false, 'Starting transport does not capture');
  h.ready();
  assert.equal(h.channels[0].port1.sent.length, 0);
  assert.equal(h.nodes[0].contentWindow.connection.target, 'chrome-extension://test');
  assert.equal(h.client.draw(source, rectangle, viewport, true, { readPixels: true }), true);
  for (let i = 0; i < 100; i++) assert.equal(h.client.draw(source, rectangle, viewport, true), false);
  assert.equal(h.captures.length, 1, 'Backpressure covers capture, with no pending queue');
  const captured = new Bitmap(); h.captures[0].resolve(captured); await settle();
  assert.equal(h.channels[0].port1.sent.length, 1);
  const job = h.channels[0].port1.sent[0].value;
  assert.equal(job.frame, captured); assert.equal(job.sourceKey, source.currentSrc);
  assert.equal(job.barGeneration, 0);
  assert.equal(job.mediaTime, 4);
  assert.equal(h.captures[0].options.resizeWidth, 320);
  assert.equal(h.captures[0].options.resizeHeight, 180);
  assert.equal(job.options.readPixels, true);
  const image = result(h.client, { pixels: new Uint8ClampedArray(160 * 90 * 4) });
  h.client.receive(image);
  assert.equal(image.bitmap.closed, 1); assert.equal(h.frames.length, 1);
  assert.equal(h.frames[0].meta.source, source); assert.equal(h.frames[0].meta.mediaTime, 4);
  assert.equal(h.client.readPixels().length, 160 * 90 * 4);
  assert.equal(h.client.pending, null); assert.equal(h.canvas.context.draws.length, 1);

  h.client.draw(source, rectangle, viewport, true);
  const oldGeneration = h.client.generation;
  h.client.reset();
  assert.equal(h.client.generation, oldGeneration + 1);
  assert.equal(h.client.draw(source, rectangle, viewport, true), false, 'Reset does not start a burst');
  const staleCapture = new Bitmap(); h.captures[1].resolve(staleCapture); await settle();
  assert.equal(staleCapture.closed, 1); assert.equal(h.client.pending, null);
  assert.equal(h.channels[0].port1.sent.length, 1, 'Invalidated capture is not transferred');

  h.client.draw(source, rectangle, viewport, true);
  h.captures[2].resolve(new Bitmap()); await settle();
  const stale = result(h.client); h.client.reset(); h.client.receive(stale);
  assert.equal(stale.bitmap.closed, 1); assert.equal(h.frames.length, 1);
  assert.equal(h.client.pending, null); assert.equal(h.client.readPixels(), null);
  assert.equal(h.canvas.context.draws.length, 1, 'Old worker result is never presented');

  const preserve = harness(); preserve.ready();
  preserve.client.draw(source, rectangle, viewport, true); preserve.captures[0].resolve(new Bitmap()); await settle();
  const confirmed = result(preserve.client, { cropped: true, readable: false,
    videoCrop: { x: 0, y: 10, width: 160, height: 70 }, stableFrames: 7,
    pixels: new Uint8ClampedArray(160 * 90 * 4) });
  preserve.client.receive(confirmed);
  const confirmedCrop = preserve.client.crop, confirmedPixels = preserve.client.pixels;
  preserve.client.draw(source, rectangle, viewport, true); preserve.captures[1].resolve(new Bitmap()); await settle();
  const oldVisualJob = result(preserve.client);
  preserve.client.invalidate();
  assert.equal(preserve.client.barGeneration, 0);
  assert.equal(preserve.client.crop, confirmedCrop); assert.equal(preserve.client.pixels, confirmedPixels);
  assert.equal(preserve.client.readable, false); assert.equal(preserve.client.stableFrames, 7);
  assert.equal(preserve.client.draw(source, rectangle, viewport, true), false, 'Preference invalidation also preserves backpressure');
  preserve.client.receive(oldVisualJob);
  assert.equal(oldVisualJob.bitmap.closed, 1); assert.equal(preserve.canvas.context.draws.length, 1);
  assert.equal(preserve.client.crop, confirmedCrop); assert.equal(preserve.client.pixels, confirmedPixels);
  preserve.client.draw(source, rectangle, viewport, true); preserve.captures[2].resolve(new Bitmap()); await settle();
  const newVisualJob = preserve.channels[0].port1.sent.at(-1).value;
  assert.equal(newVisualJob.generation, 1); assert.equal(newVisualJob.barGeneration, 0,
    'New preference job retains the detector history key');
  preserve.client.reset();
  assert.equal(preserve.client.barGeneration, 1); assert.equal(preserve.client.generation, 2);
  assert.equal(preserve.client.crop.height, 90); assert.equal(preserve.client.stableFrames, 0);
  assert.equal(preserve.client.pixels, null); assert.equal(preserve.client.readable, true);
  preserve.client.receive(result(preserve.client));
  preserve.client.dispose();

  const reject = harness({ accepted: false }); reject.ready();
  reject.client.draw(source, rectangle, viewport, true); reject.captures[0].resolve(new Bitmap()); await settle();
  const unwanted = result(reject.client); reject.client.receive(unwanted);
  assert.equal(unwanted.bitmap.closed, 1); assert.equal(reject.frames.length, 0);
  assert.equal(reject.canvas.context.draws.length, 0, 'Caller validates source/settings before presentation');
  reject.client.dispose();
  assert.equal(reject.nodes[0].removed, true); assert.equal(reject.channels[0].port1.closed, true);
  assert.equal(reject.client.draw(source, rectangle, viewport, true), false);

  const unavailable = harness({ captureThrows: true }); unavailable.ready();
  assert.equal(unavailable.client.draw(source, rectangle, viewport, true), false);
  assert.equal(unavailable.client.state, 'failed'); assert.equal(unavailable.failures.length, 1);
  assert.equal(unavailable.nodes[0].removed, true);
  unavailable.client.fail('Duplicate'); assert.equal(unavailable.failures.length, 1);

  const timeout = harness();
  [...timeout.timers.values()][0]();
  assert.equal(timeout.client.state, 'failed'); assert.equal(timeout.failures.length, 1);
  const hung = harness(); hung.ready(); hung.client.draw(source, rectangle, viewport, true);
  [...hung.timers.values()][0]();
  assert.equal(hung.client.state, 'failed'); assert.equal(hung.nodes[0].removed, true);
  const lateCapture = new Bitmap(); hung.captures[0].resolve(lateCapture); await settle();
  assert.equal(lateCapture.closed, 1);

  const malformed = harness(); malformed.ready(); malformed.client.draw(source, rectangle, viewport, true);
  malformed.captures[0].resolve(new Bitmap()); await settle();
  const bad = result(malformed.client, { bitmap: new Bitmap(400, 4096) }); malformed.client.receive(bad);
  assert.equal(bad.bitmap.closed, 1); assert.equal(malformed.client.state, 'failed');
  const presentation = harness(); presentation.ready(); presentation.client.draw(source, rectangle, viewport, true);
  presentation.captures[0].resolve(new Bitmap()); await settle();
  presentation.client.onFrame = () => { throw new Error('Presentation failed'); };
  const failedPresentation = result(presentation.client); presentation.client.receive(failedPresentation);
  assert.equal(failedPresentation.bitmap.closed, 1);
  assert.equal(presentation.client.state, 'failed'); assert.equal(presentation.failures.length, 1);
  assert.equal(presentation.nodes[0].removed, true, 'Presentation exceptions use the fallback and close the transport');
  h.client.dispose(); timeout.client.dispose(); hung.client.dispose(); malformed.client.dispose(); unavailable.client.dispose();
  presentation.client.dispose();

  const pixelData = new Uint8ClampedArray(160 * 90 * 4);
  for (let y = 0; y < 90; y++) for (let x = 0; x < 160; x++) {
    const i = (y * 160 + x) * 4;
    pixelData[i] = y >= 10 && y < 80 ? 144 : 0;
    pixelData[i + 1] = y >= 10 && y < 80 ? 74 : 0;
    pixelData[i + 2] = y >= 10 && y < 80 ? 255 : 0; pixelData[i + 3] = 255;
  }
  const rendererContext = vm.createContext({ OffscreenCanvas: Canvas, Uint8ClampedArray });
  if (fs.existsSync(path.join(root, 'black-bar-detector.js'))) run(rendererContext, 'black-bar-detector.js');
  run(rendererContext, 'renderer.js');
  const renderer = new rendererContext.YacRenderer(new Canvas());
  for (let i = 0; i < 4; i++) renderer.draw(new Bitmap(160, 90, pixelData), rectangle, viewport, false, { sourceKey: 'same-video' });
  assert.equal(renderer.crop.y, 10); assert.equal(renderer.crop.height, 70, 'New bitmap objects keep the stable crop');
  renderer.draw(new Bitmap(160, 90, pixelData), rectangle, viewport, false, { sourceKey: 'new-video' });
  assert.equal(renderer.crop.height, 90, 'Changing the explicit key resets bar history');
  for (let i = 0; i < 4; i++) renderer.draw(new Bitmap(160, 90, pixelData), rectangle, viewport, false, { sourceKey: '' });
  assert.equal(renderer.crop.height, 70, 'An explicit empty key is still stable');
  const staticSource = new Bitmap(160, 90, pixelData);
  for (let i = 0; i < 4; i++) renderer.draw(staticSource, rectangle, viewport, false);
  assert.equal(renderer.crop.height, 70);
  renderer.draw(new Bitmap(160, 90, pixelData), rectangle, viewport, false);
  assert.equal(renderer.crop.height, 90, 'Unkeyed canvas fixtures retain source-object reset');
  renderer.draw(staticSource, rectangle, { width: 1, height: 32768 }, false);
  assert.equal(renderer.canvas.height, 2048, 'Extreme aspect ratios remain bounded');

  const workerReplies = [];
  const capturedPixels = new Uint8ClampedArray(320 * 180 * 4);
  for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) {
    const from = (Math.floor(y / 2) * 160 + Math.floor(x / 2)) * 4;
    capturedPixels.set(pixelData.subarray(from, from + 4), (y * 320 + x) * 4);
  }
  const workerContext = vm.createContext({
    OffscreenCanvas: Canvas, Uint8ClampedArray,
    self: { postMessage: (value, transfers = []) => workerReplies.push({ value, transfers }) },
    importScripts: (...names) => names.forEach(name => {
      // The detector is supplied by the parallel detector change. The existing
      // renderer still works on its own while that independent file is pending.
      if (fs.existsSync(path.join(root, name))) run(workerContext, name);
    })
  });
  run(workerContext, 'ambient-worker.js');
  assert.equal(workerReplies[0].value.type, 'ready');
  for (let i = 0; i < 4; i++) {
    const frame = new Bitmap(320, 180, capturedPixels);
    workerContext.self.onmessage({ data: {
      type: 'render', requestId: i + 1, generation: 0, barGeneration: 0, frame,
      rectangle, viewport, radial: false, sourceKey: 'same-video', mediaTime: i / 30, options: { readPixels: true }
    } });
    assert.equal(frame.closed, 1, 'Worker releases each incoming image after rendering');
  }
  const workerResult = workerReplies.at(-1);
  assert.equal(workerResult.value.videoCrop.height, 70);
  assert.equal(workerResult.value.pixels.length, 160 * 90 * 4);
  assert.equal(workerResult.transfers.length, 2, 'Bitmap and copied sample buffer are transferred');
  workerContext.self.onmessage({ data: { type: 'render', requestId: 5, generation: 1, barGeneration: 0,
    frame: new Bitmap(320, 180, capturedPixels), rectangle, viewport, radial: false,
    sourceKey: 'same-video', mediaTime: 4 / 30 } });
  assert.equal(workerReplies.at(-1).value.videoCrop.height, 70,
    'Changing presentation generation retains the confirmed worker crop');
  workerContext.self.onmessage({ data: { type: 'render', requestId: 6, generation: 2, barGeneration: 1,
    frame: new Bitmap(320, 180, capturedPixels), rectangle, viewport, radial: false,
    sourceKey: 'same-video', mediaTime: 5 / 30 } });
  assert.equal(workerReplies.at(-1).value.videoCrop.height, 90,
    'Changing the bar generation resets detection for a seek or new source');
  const invalidFrame = new Bitmap(1920, 1080);
  workerContext.self.onmessage({ data: { type: 'render', requestId: 99, generation: 0, barGeneration: 0,
    frame: invalidFrame, rectangle, viewport, sourceKey: 'same-video' } });
  assert.equal(invalidFrame.closed, 1); assert.equal(workerReplies.at(-1).value.type, 'failed');
  for (const barGeneration of [-1, .5, undefined]) {
    const badCounterFrame = new Bitmap(320, 180, capturedPixels);
    workerContext.self.onmessage({ data: { type: 'render', requestId: 100, generation: 0, barGeneration,
      frame: badCounterFrame, rectangle, viewport, sourceKey: 'same-video' } });
    assert.equal(badCounterFrame.closed, 1); assert.equal(workerReplies.at(-1).value.type, 'failed');
  }

  const handlers = {}, workers = [], parent = {}, bridgeReplies = [];
  const token = '01'.repeat(16);
  class HostWorker {
    constructor(url) { this.url = url; this.jobs = []; workers.push(this); }
    postMessage(value, transfers) { this.jobs.push({ value, transfers }); }
    terminate() { this.terminated = true; }
  }
  const hostContext = vm.createContext({
    Uint8ClampedArray, parent, Worker: HostWorker,
    location: { hash: '#' + token, protocol: 'chrome-extension:', origin: 'chrome-extension://test' },
    addEventListener: (name, listener) => { handlers[name] = listener; }
  });
  run(hostContext, 'worker-host.js');
  const bridgePort = { postMessage: (value, transfers) => bridgeReplies.push({ value, transfers }),
    start() { this.started = true; }, close() { this.closed = true; } };
  const connect = { source: parent, origin: 'https://www.youtube.com',
    data: { type: 'yac-worker-connect', token }, ports: [bridgePort] };
  handlers.message({ ...connect, source: {} });
  handlers.message({ ...connect, origin: 'https://untrusted.example' });
  handlers.message({ ...connect, data: { ...connect.data, token: '00'.repeat(16) } });
  assert.equal(workers.length, 0, 'Bridge rejects unrelated parent, origin and token');
  handlers.message(connect);
  assert.equal(workers[0].url, 'ambient-worker.js'); assert.equal(bridgePort.started, true);
  workers[0].onmessage({ data: { type: 'ready' } });
  assert.equal(bridgeReplies[0].value.type, 'ready');
  const sourceFrame = new Bitmap(); bridgePort.onmessage({ data: { type: 'render', frame: sourceFrame } });
  assert.equal(workers[0].jobs[0].transfers[0], sourceFrame);
  workers[0].onmessage({ data: workerResult.value });
  assert.equal(bridgeReplies.at(-1).transfers.length, 2);
  bridgePort.onmessage({ data: { type: 'dispose' } });
  assert.equal(workers[0].terminated, true); assert.equal(bridgePort.closed, true);
  handlers.pagehide();

  console.log('PASS: worker backpressure, stale generation, frame ownership, fallback, watchdog, crop stability, bounded output, bridge origin and teardown');
})().catch(error => { console.error(error); process.exitCode = 1; });
