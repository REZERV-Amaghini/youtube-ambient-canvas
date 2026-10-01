'use strict';
// No browser, network, video decoding or visible flashing. This runs the actual
// controller against a deterministic DOM/clock and renderer/monitor test doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness(workerMode = false) {
  const nodes = [], raf = new Map(), intervals = new Map(), renders = [], inspections = [];
  const workerResponses = [];
  let now = 0, id = 0, resolveStorage, flash = false;
  class Event {
    constructor(type, values = {}) { this.type = type; Object.assign(this, values); }
    stopPropagation() {} preventDefault() { this.defaultPrevented = true; }
  }
  class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, callback, options) {
      const list = this.listeners.get(type) || []; list.push({ callback, options }); this.listeners.set(type, list);
    }
    removeEventListener(type, callback) { this.listeners.set(type, (this.listeners.get(type) || []).filter(v => v.callback !== callback)); }
    dispatchEvent(event) {
      event.target ||= this;
      for (const entry of [...(this.listeners.get(event.type) || [])]) {
        entry.callback(event); if (entry.options?.once) this.removeEventListener(event.type, entry.callback);
      }
      return true;
    }
  }
  class Style {
    constructor() { this.values = new Map(); }
    setProperty(name, value, priority = '') { this.values.set(name, [String(value), priority]); }
    getPropertyValue(name) { return this.values.get(name)?.[0] || ''; }
    getPropertyPriority(name) { return this.values.get(name)?.[1] || ''; }
    removeProperty(name) { this.values.delete(name); }
  }
  class Element extends Target {
    constructor(tag) {
      super(); this.localName = tag; this.children = []; this.attributes = new Map(); this.style = new Style();
      this.dataset = {}; this.className = ''; this.rect = { left: 100, top: 100, width: 640, height: 360 };
      this.clientWidth = 640; this.clientHeight = 360; this.width = 400; this.height = 250; nodes.push(this);
      this.classList = {
        contains: name => this.className.split(' ').includes(name),
        toggle: (name, force) => {
          const list = new Set(this.className.split(' ').filter(Boolean));
          const value = force === undefined ? !list.has(name) : force;
          if (value) list.add(name); else list.delete(name); this.className = [...list].join(' '); return value;
        },
        add: name => this.classList.toggle(name, true), remove: name => this.classList.toggle(name, false)
      };
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    removeAttribute(name) { this.attributes.delete(name); }
    append(...children) { for (const child of children) { child.remove(); this.children.push(child); child.parentElement = this; } }
    prepend(child) { child.remove(); this.children.unshift(child); child.parentElement = this; }
    insertBefore(child, before) { child.remove(); const n = this.children.indexOf(before); this.children.splice(n < 0 ? this.children.length : n, 0, child); child.parentElement = this; }
    remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(v => v !== this); this.parentElement = null; }
    get isConnected() { return this === document.documentElement || !!this.parentElement?.isConnected || !!this.host?.isConnected; }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    attachShadow() { this.shadowRoot = new Element('#shadow'); this.shadowRoot.host = this; return this.shadowRoot; }
    getBoundingClientRect() { return { ...this.rect, right: this.rect.left + this.rect.width, bottom: this.rect.top + this.rect.height }; }
    focus() { document.activeElement = this; }
    click() { this.dispatchEvent(new Event('click')); }
    showModal() { this.open = true; this.modalCalls = (this.modalCalls || 0) + 1; }
    close() { this.open = false; }
    getContext() { return { drawImage() {} }; }
    querySelector(selector) {
      const last = selector.split(' ').at(-1);
      const matches = element => last[0] === '#' ? element.id === last.slice(1) : last[0] === '.' ? element.classList.contains(last.slice(1)) :
        element.localName === last.split('.')[0] && (!last.includes('.') || element.classList.contains(last.split('.')[1]));
      const walk = element => { for (const child of element.children) { if (matches(child)) return child; const found = walk(child); if (found) return found; } return null; };
      return walk(this);
    }
  }
  const document = new Target(); document.hidden = false; document.fullscreenElement = null;
  document.createElement = tag => new Element(tag); document.createElementNS = (_, tag) => new Element(tag);
  document.createTextNode = text => { const node = new Element('#text'); node.textContent = text; return node; };
  document.documentElement = new Element('html'); document.body = new Element('body'); document.documentElement.append(document.body);
  document.getElementById = value => nodes.find(node => node.id === value && node.isConnected && !node.host) || null;
  document.querySelector = selector => document.documentElement.querySelector(selector);
  document.querySelectorAll = () => [];
  const app = new Element('ytd-app'), player = new Element('div'), video = new Element('video'), toolbar = new Element('div'), gear = new Element('button');
  player.id = 'movie_player'; video.className = 'html5-main-video'; toolbar.className = 'ytp-right-controls'; gear.className = 'ytp-settings-button';
  Object.assign(video, { videoWidth: 640, videoHeight: 360, readyState: 4, currentTime: 1, currentSrc: 'test:static', paused: false, seeking: false });
  document.body.append(app); app.append(player); player.append(video, toolbar); toolbar.append(gear);
  const pixels = new Uint8ClampedArray(160 * 90 * 4);
  class Renderer {
    static scrollBlend() { return 0; }
    constructor() { this.padding = 180; this.readable = true; this.stableFrames = 4; }
    reset() {} invalidate() {} dispose() { this.disposed = true; }
    result() { return { readable: true, cropped: true, videoCrop: { x: 0, y: 10, width: 160, height: 70 }, samplingCrop: { x: 0, y: 10, width: 160, height: 70 } }; }
    draw(...args) { renders.push(args); return this.result(); }
    inspect(...args) { inspections.push(args); return this.result(); }
    readPixels() { return pixels; }
  }
  class WorkerRenderer extends Renderer {
    constructor(canvas, callbacks) { super(canvas); this.callbacks = callbacks; this.pending = false; }
    draw(source, rectangle, viewport, radial, options) {
      if (this.pending) return false;
      this.pending = true;
      (options.sampleOnly ? inspections : renders).push([source, rectangle, viewport, radial, options]);
      const meta = { source, rectangle, viewport, options, sourceKey: options.sourceKey, mediaTime: source.currentTime };
      workerResponses.push(() => {
        this.pending = false;
        if (!this.disposed && this.callbacks.acceptFrame(meta)) this.callbacks.onFrame({ ...this.result(), sampleOnly: options.sampleOnly }, meta);
      });
      return true;
    }
  }
  const flushWorkers = () => { for (const callback of workerResponses.splice(0)) callback(); };
  const storageListeners = new Set();
  const storage = { local: { get: () => new Promise(resolve => { resolveStorage = resolve; }), set: async () => {} },
    onChanged: { addListener: f => storageListeners.add(f), removeListener: f => storageListeners.delete(f) } };
  const window = new Target();
  const context = vm.createContext({ document, window, Event, URLSearchParams, URL, console, Uint8ClampedArray,
    browser: { storage, ...(workerMode ? { runtime: { getURL: file => 'test-extension:///' + file } } : {}) }, location: { pathname: '/watch', search: '?v=static', href: 'https://www.youtube.com/watch?v=static' },
    innerWidth: 1280, innerHeight: 720, performance: { now: () => now },
    getComputedStyle: element => ({ objectFit: 'contain', display: element.hidden ? 'none' : 'block' }),
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: callback => { const n = ++id; raf.set(n, callback); return n; }, cancelAnimationFrame: n => raf.delete(n),
    setInterval: callback => { const n = ++id; intervals.set(n, callback); return n; }, clearInterval: n => intervals.delete(n),
    setTimeout, clearTimeout, queueMicrotask,
    YacRenderer: Renderer, YacWorkerRenderer: WorkerRenderer, YacFlashMonitor: class { reset() {} sample() { return flash; } }
  });
  const folder = path.resolve(__dirname, '..');
  if (fs.existsSync(path.join(folder, 'settings-store.js'))) vm.runInContext(fs.readFileSync(path.join(folder, 'settings-store.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(folder, 'ambient.js'), 'utf8'), context, { filename: 'ambient.js' });
  return { document, window, video, player, renders, inspections, nodes, raf, intervals, storageListeners,
    load: async saved => { assert.ok(resolveStorage, 'controller starts storage load'); resolveStorage({ ambient: saved }); for (let i = 0; i < 8; i++) await Promise.resolve(); flushWorkers(); },
    tick: () => { flushWorkers(); now += 100; if (!video.paused) video.currentTime += .1; const callbacks = [...raf.values()]; raf.clear(); callbacks.forEach(f => f(now)); flushWorkers(); },
    event: (target, type) => target.dispatchEvent(new Event(type)),
    flash: value => { flash = value; },
    get: id => nodes.find(node => node.id === id),
    enabled: () => nodes.find(node => node.localName === 'input' && node.getAttribute('aria-label') === 'アンビエント背景')
  };
}

async function main() {
 for (const workerMode of [false, true]) {
  const h = harness(workerMode);
  assert.equal(h.document.documentElement.classList.contains('yac-active'), false, 'no startup activation before saved settings');
  assert.equal(h.renders.length, 0, 'no startup background render before settings');
  await h.load({ enabled: false });
  assert.equal(h.document.documentElement.classList.contains('yac-active'), false, 'saved OFF remains OFF');
  assert.equal(h.renders.length, 0);
  h.tick(); assert.ok(h.inspections.length > 0, 'OFF still samples for warnings');
  h.get('yac-settings-button').click(); assert.equal(h.get('yac-controls').hidden, false, 'OFF settings remain accessible');
  h.enabled().checked = true; h.event(h.enabled(), 'input'); h.tick();
  assert.ok(h.renders.length > 0, 'ON paints background');
  h.enabled().checked = false; h.event(h.enabled(), 'input');
  assert.equal(h.get('yac-controls').hidden, false, 'turning OFF does not close settings');
  h.enabled().checked = true; h.event(h.enabled(), 'input');
  h.video.seeking = true; h.event(h.video, 'seeking');
  let before = h.renders.length; h.tick(); assert.equal(h.renders.length, before, 'seeking does not paint');
  h.video.seeking = false; h.event(h.video, 'seeked'); h.tick(); assert.ok(h.renders.length > before, 'seeked resumes');
  h.video.rect.width = 0; before = h.renders.length; h.tick(); assert.equal(h.renders.length, before, 'zero-width geometry does not paint');
  h.video.rect.width = 640; h.tick();
  h.video.paused = true; before = h.renders.length; const pausedSamples = h.inspections.length;
  h.tick(); h.tick();
  assert.equal(h.renders.length, before, 'settled paused footage does not repaint');
  assert.equal(h.inspections.length, pausedSamples, 'paused footage does not monitor');
  h.video.paused = false;
  h.video.style.setProperty('clip-path', 'inset(7px)', 'important');
  h.document.hidden = true; h.event(h.document, 'visibilitychange');
  assert.equal(h.video.style.getPropertyValue('clip-path'), 'inset(7px)', 'external latest clip is preserved on restoration');
  before = h.renders.length + h.inspections.length; h.tick();
  assert.equal(h.renders.length + h.inspections.length, before, 'hidden document neither paints nor samples');
  h.document.hidden = false; h.event(h.document, 'visibilitychange');
  h.document.fullscreenElement = h.player; h.event(h.document, 'fullscreenchange');
  before = h.renders.length; const samples = h.inspections.length;
  h.tick(); assert.equal(h.renders.length, before, 'fullscreen never paints page background');
  assert.ok(h.inspections.length > samples, 'fullscreen continues warning samples');
  h.flash(true); h.tick();
  const warning = h.get('yac-flash-warning'), dialog = warning.shadowRoot.querySelector('dialog');
  assert.equal(warning.parentElement, h.player, 'warning host follows fullscreen element');
  assert.ok(dialog.open && dialog.modalCalls, 'warning uses modal dialog');
  const css = warning.shadowRoot.querySelector('style').textContent;
  assert.match(css, /background:#1c1c1c/, 'warning dialog has opaque dark background');
  assert.match(css, /dialog::backdrop/, 'warning has backdrop');
  h.event(h.document, 'yac-dispose');
  assert.equal(h.raf.size, 0); assert.equal(h.intervals.size, 0);
  assert.equal(h.storageListeners.size, 0, 'dispose removes storage subscription');
  for (const target of [h.document, h.window, h.video]) assert.ok([...target.listeners.values()].every(list => list.length === 0), 'dispose removes controller listeners');
  console.log(`PASS (${workerMode ? 'worker callback' : 'main'}): ambient startup, OFF/fullscreen monitoring, panel, seek/geometry, clip ownership, modal and disposal`);
 }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
