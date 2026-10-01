/* Main-thread capture/presentation; the expensive rendering runs in a Worker. */
(() => {
  'use strict';
  const validCrop = crop => crop && ['x', 'y', 'width', 'height'].every(key => Number.isFinite(crop[key])) &&
    crop.x >= 0 && crop.y >= 0 && crop.width > 0 && crop.height > 0 &&
    crop.x + crop.width <= 160 && crop.y + crop.height <= 90;

  globalThis.YacWorkerRenderer = class {
    constructor(canvas, { hostUrl, onFrame = () => {}, onFailure = () => {}, acceptFrame = () => true,
      startupTimeout = 4000, renderTimeout = 2000 } = {}) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d', { alpha: false });
      this.padding = 180;
      this.state = 'starting';
      this.generation = 0;
      this.barGeneration = 0;
      this.requestId = 0;
      this.pending = null;
      this.readable = true;
      this.stableFrames = 0;
      this.crop = { x: 0, y: 0, width: 160, height: 90 };
      this.pixels = null;
      this.onFrame = onFrame;
      this.onFailure = onFailure;
      this.acceptFrame = acceptFrame;
      this.renderTimeout = renderTimeout;
      try {
        if (!hostUrl || typeof createImageBitmap !== 'function' || typeof MessageChannel !== 'function') {
          throw new Error('Ambient worker capture is unavailable');
        }
        const target = new URL(hostUrl, location.href);
        const origin = target.protocol + '//' + target.host;
        const tokenBytes = crypto.getRandomValues(new Uint8Array(16));
        const token = [...tokenBytes].map(value => value.toString(16).padStart(2, '0')).join('');
        target.hash = token;
        this.frame = document.createElement('iframe');
        this.frame.id = 'yac-worker-host';
        this.frame.setAttribute('aria-hidden', 'true');
        this.frame.style.cssText = 'display:none!important;width:0!important;height:0!important;border:0!important';
        this.frame.src = target.href;
        this.frame.onerror = () => this.fail('Ambient worker frame could not load');
        this.frame.onload = () => {
          if (this.state !== 'starting') return;
          const channel = new MessageChannel();
          this.port = channel.port1;
          this.port.onmessage = event => this.receive(event.data);
          this.port.onmessageerror = () => this.fail('Ambient worker result failed');
          this.port.start();
          try { this.frame.contentWindow.postMessage({ type: 'yac-worker-connect', token }, origin, [channel.port2]); }
          catch (error) { channel.port2.close(); this.fail('Ambient worker connection failed'); }
        };
        this.startupTimer = setTimeout(() => this.fail('Ambient worker startup timed out'), startupTimeout);
        document.documentElement.append(this.frame);
      } catch (error) {
        // Notify asynchronously, so the caller can install its fallback after construction.
        queueMicrotask(() => this.fail(error instanceof Error ? error.message : 'Ambient worker is unavailable'));
      }
    }
    readPixels() { return this.readable ? this.pixels : null; }
    draw(source, rectangle, viewport, radial, options = {}) {
      if (this.state !== 'ready' || this.pending) return false;
      const meta = {
        source, rectangle: { ...rectangle }, viewport: { ...viewport }, options: { ...options },
        requestId: ++this.requestId, generation: this.generation, barGeneration: this.barGeneration,
        sourceKey: typeof options.sourceKey === 'string' ? options.sourceKey : source.currentSrc || source.src || '',
        mediaTime: Number(source.currentTime) || 0
      };
      this.pending = meta;
      this.jobTimer = setTimeout(() => this.fail('Ambient worker frame timed out'), this.renderTimeout);
      let captured;
      try { captured = createImageBitmap(source, { resizeWidth: 320, resizeHeight: 180, resizeQuality: 'low' }); }
      catch (error) { this.fail('Ambient video capture is unavailable'); return false; }
      Promise.resolve(captured).then(frame => {
        if (this.state !== 'ready' || this.pending !== meta || meta.generation !== this.generation) {
          frame.close(); this.finish(meta); return;
        }
        try {
          this.port.postMessage({ type: 'render', requestId: meta.requestId, generation: meta.generation,
            barGeneration: meta.barGeneration,
            frame, rectangle: meta.rectangle, viewport: meta.viewport, radial: radial === true,
            sourceKey: meta.sourceKey, mediaTime: meta.mediaTime, options: {
              avoidBars: meta.options.avoidBars !== false, inset: Number(meta.options.inset) || 0,
              blend: Number(meta.options.blend) || 0, readPixels: meta.options.readPixels === true
            }
          }, [frame]);
        } catch (error) { frame.close(); this.fail('Ambient worker capture transfer failed'); }
      }, () => this.fail('Ambient video capture is unavailable'));
      return true;
    }
    receive(value) {
      if (!value || this.state === 'disposed' || this.state === 'failed') { value?.bitmap?.close?.(); return; }
      if (value.type === 'ready' && this.state === 'starting') {
        clearTimeout(this.startupTimer); this.state = 'ready'; return;
      }
      if (value.type === 'failed') { this.fail(value.reason || 'Ambient worker failed'); return; }
      if (value.type !== 'frame') return;
      const meta = this.pending;
      if (!meta || value.requestId !== meta.requestId || value.generation !== meta.generation ||
          meta.generation !== this.generation || this.state !== 'ready') {
        value.bitmap?.close?.();
        if (meta && value.requestId === meta.requestId) this.finish(meta);
        return;
      }
      const bitmap = value.bitmap;
      if (!bitmap || bitmap.width !== 400 || bitmap.height < 80 || bitmap.height > 2048 ||
          !validCrop(value.videoCrop) || typeof value.readable !== 'boolean' || typeof value.cropped !== 'boolean' ||
          !Number.isSafeInteger(value.stableFrames) || value.stableFrames < 0 ||
          (value.pixels !== null && !(value.pixels instanceof Uint8ClampedArray && value.pixels.length === 160 * 90 * 4))) {
        bitmap?.close?.(); this.fail('Invalid ambient worker result'); return;
      }
      try {
        if (!this.acceptFrame(meta)) { this.finish(meta); return; }
        if (this.canvas.width !== bitmap.width || this.canvas.height !== bitmap.height) {
          this.canvas.width = bitmap.width; this.canvas.height = bitmap.height;
        }
        this.context.drawImage(bitmap, 0, 0);
        this.readable = value.readable;
        this.stableFrames = value.stableFrames;
        this.crop = value.videoCrop;
        this.pixels = value.pixels;
        this.finish(meta);
        this.onFrame({ readable: value.readable, cropped: value.cropped, videoCrop: value.videoCrop }, meta);
      } catch (error) {
        this.fail('Ambient worker presentation failed');
      } finally { bitmap.close(); }
    }
    finish(meta) {
      if (this.pending !== meta) return;
      clearTimeout(this.jobTimer); this.pending = null;
    }
    invalidate() {
      this.generation++;
      // A visual preference change only invalidates the pending presentation.
      // It must not erase the confirmed bar geometry or restart detection.
      // Keep the outstanding job until it finishes; never add a queue.
    }
    reset() {
      this.invalidate();
      this.barGeneration++;
      this.pixels = null; this.readable = true; this.stableFrames = 0;
      this.crop = { x: 0, y: 0, width: 160, height: 90 };
    }
    fail(reason) {
      if (this.state === 'failed' || this.state === 'disposed') return;
      this.state = 'failed'; this.closeTransport(); this.onFailure(reason);
    }
    closeTransport() {
      clearTimeout(this.startupTimer); clearTimeout(this.jobTimer);
      try { this.port?.postMessage({ type: 'dispose' }); } catch (error) { /* Already detached. */ }
      this.port?.close(); this.frame?.remove(); this.pending = null; this.pixels = null;
    }
    dispose() { this.state = 'disposed'; this.generation++; this.closeTransport(); }
  };
})();
