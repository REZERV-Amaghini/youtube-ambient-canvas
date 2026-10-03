'use strict';
const assert = require('node:assert/strict');
const { harness } = require('./check-ambient.cjs');
const FlashMonitor = require('../flash-monitor.js');
const total = h => h.renders.length + h.inspections.length;
const stop = h => h.event(h.document, 'yac-dispose');
const tick = h => h.tick({ delta: 1000 / 120 });

(async () => {
  for (const workerMode of [false, true]) {
    for (const videoFrameCallbacks of [false, true]) {
      const ui = harness(workerMode, { videoFrameCallbacks });
      await ui.load({ enabled: true, flashWarning: false, avoidBars: false, fillBars: false });
      ui.video.paused = true; tick(ui);
      const captures = total(ui), reads = ui.stats.rectReads;
      for (const [key, value] of [['surfaceMultiplier', .4], ['controlDensity', 70], ['readingDensity', 60], ['navigationDensity', 50], ['language', 'en']]) {
        const field = ui.get('yac-' + key); field.value = value; ui.event(field, 'input');
        assert.equal(total(ui), captures, key + ' does not force a duplicate video capture');
        assert.equal(ui.stats.rectReads, reads, key + ' does not probe background geometry');
      }
      assert.match(ui.get('yac-surface-palette').textContent, /--yac-reading-opacity:0\.177600/, 'UI-only edits still update their shared palette');
      for (let n = 0; n < 16; n++) tick(ui);
      assert.equal(total(ui), captures, 'UI edits do not leave a forced repaint latched for later ticks');
      ui.get('yac-blur').value = 80; ui.event(ui.get('yac-blur'), 'input'); tick(ui);
      assert.ok(total(ui) > captures, 'ambient preferences still repaint the paused current frame');
      stop(ui);
    }
    if (workerMode) {
      const heldUI = harness(true);
      await heldUI.load({ enabled: true, flashWarning: true });
      heldUI.tick({ flush: false });
      assert.ok(heldUI.worker.pending, 'a real Worker submission is still outstanding');
      const captures = total(heldUI), samples = heldUI.stats.monitorSamples;
      heldUI.get('yac-surfaceMultiplier').value = .2; heldUI.event(heldUI.get('yac-surfaceMultiplier'), 'input');
      heldUI.flushWorkers();
      assert.equal(total(heldUI), captures, 'shade edit cannot enqueue another capture behind a busy Worker');
      assert.equal(heldUI.stats.monitorSamples, samples + 1, 'shade edit preserves the in-flight frame for warning analysis');
      stop(heldUI);
    }
    const idle = harness(workerMode, { videoFrameCallbacks: true });
    await idle.load({ enabled: false, flashWarning: false });
    tick(idle);
    const offActivity = idle.stats.activityReads, offResets = idle.stats.monitorResets;
    for (let n = 0; n < 360; n++) tick(idle);
    assert.equal(idle.stats.activityReads, offActivity, 'OFF without monitoring does not re-enter DOM activation on display ticks');
    assert.equal(idle.stats.monitorResets, offResets, 'OFF without monitoring does not repeatedly allocate/reset warning history');
    idle.enabled().checked = true; idle.event(idle.enabled(), 'input'); tick(idle);
    const readyActivity = idle.stats.activityReads;
    for (let n = 0; n < 360; n++) tick(idle);
    assert.ok(idle.stats.activityReads - readyActivity <= 92, 'a repeated video frame enters DOM work at background FPS, not display FPS');
    idle.video.readyState = 1;
    const beforeWait = idle.stats.monitorResets;
    tick(idle);
    assert.equal(idle.stats.monitorResets, beforeWait + 1, 'readiness loss clears warning history once even without an emptied event');
    assert.equal(idle.video.style.getPropertyValue('clip-path'), '', 'readiness loss restores the owned video crop');
    const waitingActivity = idle.stats.activityReads, waitingResets = idle.stats.monitorResets;
    for (let n = 0; n < 120; n++) tick(idle);
    assert.equal(idle.stats.activityReads, waitingActivity, 'waiting does not repeatedly enter DOM work');
    assert.equal(idle.stats.monitorResets, waitingResets, 'waiting does not repeatedly reset warning history');
    idle.video.remove(); idle.discover(); tick(idle);
    assert.equal(idle.document.documentElement.classList.contains('yac-active'), false, 'video removal during an existing wait still deactivates native styling');
    idle.player.append(idle.video); idle.discover(); tick(idle);
    idle.video.readyState = 4; idle.presentVideoFrame(); tick(idle);
    assert.ok(idle.video.style.getPropertyValue('clip-path'), 'new available frame restores cropping after readiness returns');
    idle.video.remove(); idle.discover(); tick(idle);
    assert.equal(idle.document.documentElement.classList.contains('yac-active'), false, 'video removal deactivates native UI styling');
    const missingActivity = idle.stats.activityReads;
    for (let n = 0; n < 120; n++) tick(idle);
    assert.equal(idle.stats.activityReads, missingActivity, 'missing video does not repeatedly enter DOM work');
    idle.player.append(idle.video); idle.discover(); tick(idle);
    assert.equal(idle.document.documentElement.classList.contains('yac-active'), true, 'video replacement reactivates native UI styling');
    idle.document.hidden = true; idle.event(idle.document, 'visibilitychange'); tick(idle);
    const hiddenActivity = idle.stats.activityReads, hiddenResets = idle.stats.monitorResets;
    for (let n = 0; n < 120; n++) tick(idle);
    assert.equal(idle.stats.activityReads, hiddenActivity, 'hidden tab does not repeatedly enter DOM work');
    assert.equal(idle.stats.monitorResets, hiddenResets, 'hidden tab does not repeatedly reset warning history');
    idle.document.hidden = false; idle.event(idle.document, 'visibilitychange'); tick(idle);
    assert.ok(idle.video.style.getPropertyValue('clip-path'), 'visibility restoration resumes current-frame drawing');
    stop(idle);

    for (const fps of [24, 30, 60]) {
      const h = harness(workerMode, { videoFrameCallbacks: true });
      await h.load({ fps });
      const before = total(h), painted = h.renders.length, sampled = h.stats.monitorSamples;
      for (let n = 0; n < 360; n++) {
        if (n % 4 === 0) h.presentVideoFrame();
        tick(h);
      }
      assert.equal(total(h) - before, 90, '30 FPS video is captured once per frame on a 120 Hz display');
      assert.equal(h.stats.monitorSamples - sampled, 90, 'warning observes every available frame independently of background FPS');
      const paintCount = h.renders.length - painted;
      assert.ok(paintCount >= Math.min(fps, 30) * 3 - 2 && paintCount <= Math.min(fps, 30) * 3,
        `background pacing stays near ${Math.min(fps, 30)} FPS: ${paintCount} frames/3s`);
      assert.equal(h.videoFrames.size, 1, 'only one video callback remains registered');
      stop(h); assert.equal(h.videoFrames.size, 0);
    }

    const warningCadence = harness(workerMode, { videoFrameCallbacks: true });
    await warningCadence.load({ fps: 24 });
    for (let n = 0; n < 480; n++) { if (n % 4 === 0) warningCadence.presentVideoFrame(); tick(warningCadence); }
    const samples = [...warningCadence.renders, ...warningCadence.inspections].map(args => args.at(-1)).sort((a, b) => a.sampleTime - b.sampleTime);
    const monitor = new FlashMonitor(), pixels = new Uint8ClampedArray(160 * 90 * 4);
    let triggeredAt;
    for (const options of samples) {
      pixels.fill(Math.floor(options.mediaTime * 8) % 2 ? 255 : 0);
      if (monitor.sample(pixels, options.sampleTime, options.mediaTime, 'paced', undefined, 1)) triggeredAt ??= options.sampleTime;
    }
    assert.ok(triggeredAt >= 3000 && triggeredAt <= 4000, 'actual flash monitor retains its sustained three-second trigger on paced capture timestamps');
    stop(warningCadence);

    const replacement = harness(workerMode, { videoFrameCallbacks: true });
    await replacement.load({});
    const oldElementCallback = [...replacement.videoFrames.values()][0];
    const nextVideo = replacement.document.createElement('video');
    Object.assign(nextVideo, { className: 'html5-main-video', videoWidth: 640, videoHeight: 360, readyState: 4,
      currentTime: 2, currentSrc: 'test:new-element', paused: false, seeking: false,
      requestVideoFrameCallback: replacement.video.requestVideoFrameCallback,
      cancelVideoFrameCallback: replacement.video.cancelVideoFrameCallback });
    replacement.video.remove(); replacement.player.append(nextVideo); replacement.discover(); tick(replacement);
    assert.equal(replacement.renders.at(-1)[0], nextVideo, 'replacement video element receives the forced capture');
    const afterReplacement = total(replacement); oldElementCallback(0, {}); tick(replacement);
    assert.equal(total(replacement), afterReplacement, 'old video callback cannot schedule replacement captures');
    assert.equal(replacement.videoFrames.size, 1); stop(replacement);

    const h = harness(workerMode, { videoFrameCallbacks: true });
    await h.load({ fps: 24 });
    h.presentVideoFrame(); tick(h);
    const afterSample = total(h);
    const layoutReads = h.stats.computedStyleReads;
    for (let n = 0; n < 8; n++) tick(h);
    assert.equal(total(h), afterSample, 'sample-only frame is not recaptured when a later paint deadline arrives');
    assert.ok(h.stats.computedStyleReads - layoutReads <= 2, 'no new video frame probes layout at background FPS instead of every 120 Hz tick');
    h.presentVideoFrame(); tick(h);
    assert.equal(total(h), afterSample + 1, 'latched paint deadline uses the next new video frame');

    const beforeResize = h.renders.length;
    h.video.rect.left += 20; h.resize(); tick(h);
    assert.ok(h.renders.length > beforeResize, 'geometry change can repaint without a new video frame');
    const beforePreference = h.renders.length;
    h.get('yac-inset').value = 10; h.event(h.get('yac-inset'), 'input'); tick(h);
    assert.ok(h.renders.length > beforePreference, 'preference changes force a repaint of the current frame');

    h.video.paused = true; h.renderer.stableFrames = 0;
    const beforeSettle = h.renders.length;
    for (let n = 0; n < 16; n++) tick(h);
    assert.ok(h.renders.length > beforeSettle, 'paused black-band detection can converge without video callbacks');
    h.renderer.stableFrames = 4;
    const settled = total(h); for (let n = 0; n < 16; n++) tick(h);
    assert.equal(total(h), settled, 'settled paused frame stops capturing');
    h.video.paused = false;

    const oldSeekCallback = [...h.videoFrames.values()][0];
    h.video.seeking = true; h.event(h.video, 'seeking');
    assert.equal(h.videoFrames.size, 0, 'seek cancels callback');
    const seeking = total(h); tick(h); assert.equal(total(h), seeking);
    h.video.seeking = false; h.event(h.video, 'seeked'); tick(h);
    assert.ok(total(h) > seeking, 'seeked forces a fresh capture without waiting for a callback');
    const afterSeek = total(h); oldSeekCallback(0, {}); tick(h);
    assert.equal(total(h), afterSeek, 'cancelled seek callback cannot mark a new frame or resubscribe');
    assert.equal(h.videoFrames.size, 1);

    h.enabled().checked = false; h.event(h.enabled(), 'input'); tick(h);
    const offReads = h.stats.computedStyleReads;
    for (let n = 0; n < 12; n++) tick(h);
    assert.equal(h.stats.computedStyleReads, offReads, 'ambient OFF with no new video frame does not force layout for monitoring');
    h.enabled().checked = true; h.event(h.enabled(), 'input'); tick(h);

    h.video.readyState = 0; h.event(h.video, 'emptied');
    assert.equal(h.videoFrames.size, 0);
    const empty = total(h); tick(h); assert.equal(total(h), empty);
    h.video.currentSrc = 'test:replacement'; h.video.readyState = 4; h.event(h.video, 'loadeddata'); tick(h);
    assert.ok(total(h) > empty, 'same-element source replacement refreshes current-frame capture');
    assert.equal(h.videoFrames.size, 1);

    const hiddenCallback = [...h.videoFrames.values()][0];
    h.document.hidden = true; h.event(h.document, 'visibilitychange');
    assert.equal(h.videoFrames.size, 0);
    const hidden = total(h); hiddenCallback(0, {}); tick(h); assert.equal(total(h), hidden);
    h.document.hidden = false; h.event(h.document, 'visibilitychange'); tick(h);
    assert.ok(total(h) > hidden, 'visibility restoration primes capture');
    assert.equal(h.videoFrames.size, 1);

    if (workerMode) {
      h.worker.pending = true; h.presentVideoFrame(); const busy = total(h); tick(h);
      assert.equal(total(h), busy, 'busy preflight does not capture');
      h.worker.pending = false; tick(h);
      assert.equal(total(h), busy + 1, 'busy preflight does not consume the new-frame serial');
      const draw = h.worker.draw;
      h.worker.draw = () => false; h.presentVideoFrame(); const rejected = total(h); tick(h);
      h.worker.draw = draw; tick(h);
      assert.equal(total(h), rejected + 1, 'a draw rejected after preflight does not consume its serial');
      h.presentVideoFrame(); h.tick({ delta: 1000 / 120, flush: false });
      const held = total(h);
      h.presentVideoFrame(); h.presentVideoFrame(); h.tick({ delta: 1000 / 120, flush: false });
      assert.equal(total(h), held, 'in-flight frame does not accumulate a capture queue');
      h.flushWorkers(); tick(h);
      assert.equal(total(h), held + 1, 'latest callback survives completion of an older in-flight frame');
      h.worker.callbacks.onFailure(); tick(h);
      assert.equal(h.get('yac-background').dataset.renderMode, 'main', 'Worker fallback remains available with frame pacing');
    }
    const disposedCallback = [...h.videoFrames.values()][0]; stop(h);
    disposedCallback(0, {});
    assert.equal(h.videoFrames.size, 0, 'late callback after disposal cannot rearm');
    assert.equal(h.raf.size, 0);

    const fallback = harness(workerMode);
    await fallback.load({ fps: 30 }); const fallbackBefore = total(fallback);
    for (let n = 0; n < 12; n++) tick(fallback);
    assert.ok(total(fallback) > fallbackBefore, 'unsupported video-frame callbacks preserve existing sampling');
    stop(fallback);
    console.log(`PASS (${workerMode ? 'worker' : 'main'}): decoded-frame pacing, warning cadence, force repaint, pause, seek, source, hidden and disposal`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
