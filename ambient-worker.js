/* Packaged extension code only; this worker has no DOM or extension API. */
'use strict';
importScripts('black-bar-detector.js', 'renderer.js');

const canvas = new OffscreenCanvas(400, 400);
const renderer = new YacRenderer(canvas);
const validSize = value => Number.isFinite(value) && value > 0 && value <= 32768;
const validRect = rectangle => rectangle &&
  ['left', 'top', 'width', 'height'].every(key => Number.isFinite(rectangle[key])) &&
  validSize(rectangle.width) && validSize(rectangle.height);

self.onmessage = event => {
  const job = event.data;
  if (!job || job.type !== 'render') return;
  const frame = job.frame;
  let output = null;
  try {
    if (!Number.isSafeInteger(job.requestId) || !Number.isSafeInteger(job.generation) ||
        !Number.isSafeInteger(job.barGeneration) || job.barGeneration < 0 ||
        !frame || frame.width !== 320 || frame.height !== 180 || !validRect(job.rectangle) ||
        !job.viewport || !validSize(job.viewport.width) || !validSize(job.viewport.height) ||
        typeof job.sourceKey !== 'string' || job.sourceKey.length > 8192) {
      throw new Error('Invalid ambient frame');
    }
    const options = job.options || {};
    const result = renderer.draw(frame, job.rectangle, job.viewport, job.radial === true, {
      sourceKey: job.barGeneration + ':' + job.sourceKey,
      mediaTime: Number(job.mediaTime) || 0,
      avoidBars: options.avoidBars !== false,
      inset: Number(options.inset) || 0,
      blend: Number(options.blend) || 0
    });
    const pixels = options.readPixels ? renderer.readPixels()?.slice() || null : null;
    const bitmap = canvas.transferToImageBitmap();
    output = bitmap;
    self.postMessage({
      type: 'frame', requestId: job.requestId, generation: job.generation,
      bitmap, pixels, ...result, stableFrames: renderer.stableFrames
    }, pixels ? [bitmap, pixels.buffer] : [bitmap]);
    output = null;
  } catch (error) {
    output?.close();
    self.postMessage({ type: 'failed', requestId: job.requestId, generation: job.generation,
      reason: error instanceof Error ? error.message : 'Ambient worker failed' });
  } finally {
    frame?.close?.();
  }
};
self.postMessage({ type: 'ready' });
