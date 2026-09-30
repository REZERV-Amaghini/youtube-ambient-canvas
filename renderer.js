(() => {
  'use strict';
  // Independent of YouTube: source frame + video rectangle + viewport.
  globalThis.YacRenderer = class {
    static scrollBlend(rectangle, viewport) {
      const visible = Math.max(0, Math.min(rectangle.top + rectangle.height, viewport.height) - Math.max(rectangle.top, viewport.top || 0));
      const hidden = Math.min(1, Math.max(0, (0.5 - visible / Math.max(1, rectangle.height)) * 2));
      return hidden * hidden * (3 - 2 * hidden);
    }
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d', { alpha: false });
      this.frame = document.createElement('canvas');
      this.frame.width = 160;
      this.frame.height = 90;
      this.sample = this.frame.getContext('2d', { alpha: false, willReadFrequently: true });
      this.padding = 180;
      this.crop = { x: 0, y: 0, width: 160, height: 90 };
      this.pendingCrop = '';
      this.stableFrames = 0;
      this.readable = true;
    }
    readPixels() {
      if (!this.readable) return null;
      if (this.pixels) return this.pixels;
      try { this.pixels = this.sample.getImageData(0, 0, 160, 90).data; }
      catch (error) { this.readable = false; }
      return this.pixels;
    }
    detectBars() {
      const full = { x: 0, y: 0, width: 160, height: 90 };
      const data = this.readPixels();
      if (!data) return full;
      const black = (x, y) => {
        const i = (y * 160 + x) * 4;
        return Math.max(data[i], data[i + 1], data[i + 2]) <= 20;
      };
      const row = y => {
        let count = 0;
        for (let x = 0; x < 160; x++) if (black(x, y)) count++;
        return count >= 157;
      };
      const column = x => {
        let count = 0;
        for (let y = 0; y < 90; y++) if (black(x, y)) count++;
        return count >= 89;
      };
      let top = 0, bottom = 0, left = 0, right = 0;
      while (top < 36 && row(top)) top++;
      while (bottom < 36 && row(89 - bottom)) bottom++;
      while (left < 64 && column(left)) left++;
      while (right < 64 && column(159 - right)) right++;
      const paired = (a, b) => a >= 2 && b >= 2 && Math.abs(a - b) <= Math.max(2, (a + b) * .075);
      if (!paired(top, bottom)) top = bottom = 0;
      if (!paired(left, right)) left = right = 0;
      let crop = { x: left, y: top, width: 160 - left - right, height: 90 - top - bottom };
      // Require visible content inside symmetric bars. An all-black frame,
      // or a dark edge on only one side, is not evidence of letterboxing.
      let bright = 0, count = 0;
      for (let y = crop.y; y < crop.y + crop.height; y += 3) {
        for (let x = crop.x; x < crop.x + crop.width; x += 3) {
          count++;
          const i = (y * 160 + x) * 4;
          if (Math.max(data[i], data[i + 1], data[i + 2]) > 40) bright++;
        }
      }
      if (bright / count < .15) crop = full;
      const key = [crop.x, crop.y, crop.width, crop.height].join(',');
      if (key === this.pendingCrop) this.stableFrames++;
      else { this.pendingCrop = key; this.stableFrames = 1; }
      if (this.stableFrames >= 4) this.crop = crop;
      return this.crop;
    }
    draw(source, rectangle, viewport, radial, options = {}) {
      const sourceKey = source.currentSrc || source.src || '';
      if (this.source !== source || this.sourceKey !== sourceKey) {
        this.source = source; this.sourceKey = sourceKey;
        // Resizing clears any origin taint left by a previous video.
        this.frame.width = 160;
        this.readable = true; this.stableFrames = 0; this.pendingCrop = '';
        this.crop = { x: 0, y: 0, width: 160, height: 90 };
      }
      const pad = this.padding;
      const sw = viewport.width + pad * 2;
      const sh = viewport.height + pad * 2;
      const width = 400;
      const height = Math.max(80, Math.round(width * sh / sw));
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
      this.sample.drawImage(source, 0, 0, 160, 90);
      this.pixels = null;
      const automatic = options.avoidBars === false ? { x: 0, y: 0, width: 160, height: 90 } : this.detectBars();
      const inset = Math.min(.4, Math.max(0, Number(options.inset) / 100 || 0));
      const crop = {
        x: automatic.x + automatic.width * inset,
        y: automatic.y + automatic.height * inset,
        width: automatic.width * (1 - inset * 2),
        height: automatic.height * (1 - inset * 2)
      };
      rectangle = {
        left: rectangle.left + rectangle.width * crop.x / 160,
        top: rectangle.top + rectangle.height * crop.y / 90,
        width: rectangle.width * crop.width / 160,
        height: rectangle.height * crop.height / 90
      };
      const result = { readable: this.readable, cropped: automatic.width < 160 || automatic.height < 90, videoCrop: automatic };
      const ctx = this.context;
      const blend = Math.max(0, Math.min(1, Number(options.blend) || 0));
      const blendWholeFrame = () => {
        if (!blend) return;
        ctx.globalAlpha = blend;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this.frame, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
        ctx.globalAlpha = 1;
      };
      ctx.imageSmoothingEnabled = true;
      if (!radial || blend >= 1 || rectangle.width < 1 || rectangle.height < 1) {
        ctx.drawImage(this.frame, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
        return result;
      }
      const scaleX = width / sw;
      const scaleY = height / sh;
      const left = (rectangle.left + pad) * scaleX;
      const top = (rectangle.top + pad) * scaleY;
      const right = left + rectangle.width * scaleX;
      const bottom = top + rectangle.height * scaleY;
      const cx = (left + right) / 2;
      const cy = (top + bottom) / 2;
      const pixels = this.readPixels();
      result.readable = this.readable;
      if (pixels) {
        if (!this.output || this.output.width !== width || this.output.height !== height) {
          this.output = ctx.createImageData(width, height);
        }
        const target = this.output.data;
        const halfWidth = (right - left) / 2, halfHeight = (bottom - top) / 2;
        // Project each background pixel back along its ray to the video edge.
        // This avoids seams between independently painted perimeter wedges.
        for (let y = 0; y < height; y++) {
          const dy = (y + .5 - cy) / halfHeight;
          for (let x = 0; x < width; x++) {
            const dx = (x + .5 - cx) / halfWidth;
            const distance = Math.max(1, Math.abs(dx), Math.abs(dy));
            const sx = Math.round(crop.x + (dx / distance + 1) * .5 * (crop.width - 1));
            const sy = Math.round(crop.y + (dy / distance + 1) * .5 * (crop.height - 1));
            const from = (Math.min(89, Math.max(0, sy)) * 160 + Math.min(159, Math.max(0, sx))) * 4;
            const to = (y * width + x) * 4;
            target[to] = pixels[from]; target[to + 1] = pixels[from + 1];
            target[to + 2] = pixels[from + 2]; target[to + 3] = 255;
          }
        }
        ctx.putImageData(this.output, 0, 0);
        blendWholeFrame();
        return result;
      }
      // Never blend an adjacent interior pixel into a stretched edge pixel.
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.frame, crop.x, crop.y, 1, 1, 0, 0, width, height);
      ctx.drawImage(this.frame, crop.x, crop.y, crop.width, crop.height, left, top, right - left, bottom - top);
      const far = 1 + Math.max(
        Math.abs(cx) / ((right - left) / 2),
        Math.abs(width - cx) / ((right - left) / 2),
        Math.abs(cy) / ((bottom - top) / 2),
        Math.abs(height - cy) / ((bottom - top) / 2)
      );
      // One sampled perimeter pixel per wedge. Every wedge follows a ray
      // from the real video centre, beyond the viewport, without pixel readback.
      const wedge = (a, b, sx, sy) => {
        const overlap = [(b[0] - a[0]) * .6, (b[1] - a[1]) * .6];
        a = [a[0] - overlap[0], a[1] - overlap[1]];
        b = [b[0] + overlap[0], b[1] + overlap[1]];
        const qa = [cx + (a[0] - cx) * far, cy + (a[1] - cy) * far];
        const qb = [cx + (b[0] - cx) * far, cy + (b[1] - cy) * far];
        const points = [a, b, qb, qa];
        const minX = Math.max(0, Math.min(...points.map(p => p[0])));
        const maxX = Math.min(width, Math.max(...points.map(p => p[0])));
        const minY = Math.max(0, Math.min(...points.map(p => p[1])));
        const maxY = Math.min(height, Math.max(...points.map(p => p[1])));
        if (maxX <= minX || maxY <= minY) return;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        for (const p of points.slice(1)) ctx.lineTo(p[0], p[1]);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(this.frame, Math.floor(sx), Math.floor(sy), 1, 1, minX, minY, maxX - minX, maxY - minY);
        ctx.restore();
      };
      for (let x = 0; x < 160; x++) {
        const a = left + (right - left) * x / 160;
        const b = left + (right - left) * (x + 1) / 160;
        const sx = crop.x + (x + .5) * crop.width / 160;
        wedge([a, top], [b, top], sx, crop.y);
        wedge([b, bottom], [a, bottom], sx, crop.y + crop.height - 1);
      }
      for (let y = 0; y < 90; y++) {
        const a = top + (bottom - top) * y / 90;
        const b = top + (bottom - top) * (y + 1) / 90;
        const sy = crop.y + (y + .5) * crop.height / 90;
        wedge([left, b], [left, a], crop.x, sy);
        wedge([right, a], [right, b], crop.x + crop.width - 1, sy);
      }
      blendWholeFrame();
      return result;
    }
  };
})();
