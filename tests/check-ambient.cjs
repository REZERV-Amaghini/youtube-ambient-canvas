'use strict';
// No browser, network, video decoding or visible flashing. This runs the actual
// controller against a deterministic DOM/clock and renderer/monitor test doubles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness(workerMode = false, { videoFrameCallbacks = false, idleCallbacks = true } = {}) {
  const nodes = [], raf = new Map(), intervals = new Map(), renders = [], inspections = [];
  const idle = new Map(), timeouts = new Map(), observers = [], videoFrames = new Map(), resizeObservers = [];
  const stats = { surfaceScans: 0, rectReads: 0, computedStyleReads: 0, monitorSamples: 0 };
  const workerResponses = [];
  let now = 0, id = 0, resolveStorage, flash = false, presentedFrames = 0, worker, renderer;
  const splitOutside = (text, delimiters) => {
    const parts = []; let depth = 0, start = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '(' || text[i] === '[') depth++;
      if (text[i] === ')' || text[i] === ']') depth--;
      if (!depth && delimiters.includes(text[i])) {
        if (i > start) parts.push(text.slice(start, i).trim());
        if (text[i] === '>') parts.push('>');
        start = i + 1;
      }
    }
    if (start < text.length) parts.push(text.slice(start).trim());
    return parts.filter(Boolean);
  };
  // A generic selector subset, used by the real pageSurfaces selector in this
  // controller test. No canned list of matched ambient surfaces is returned.
  const matches = (element, selector) => {
    if (element.nodeType !== 1) return false;
    const simple = (node, text) => {
      if (!node || node.nodeType !== 1) return false;
      while (text) {
        const functional = /^:(is|not)\(/.exec(text);
        if (functional) {
          let depth = 1, end = functional[0].length;
          while (end < text.length && depth) { if (text[end] === '(') depth++; if (text[end] === ')') depth--; end++; }
          const found = matches(node, text.slice(functional[0].length, end - 1));
          if (found === (functional[1] === 'not')) return false;
          text = text.slice(end); continue;
        }
        const attr = /^\[([\w-]+)(?:(\^?=)["']?([^"'\]]+)["']?)?\]/.exec(text);
        if (attr) {
          const value = node.getAttribute(attr[1]);
          if (value === null || (attr[2] === '=' && value !== attr[3]) || (attr[2] === '^=' && !value.startsWith(attr[3]))) return false;
          text = text.slice(attr[0].length); continue;
        }
        const token = /^(\*|[.#]?[\w-]+)/.exec(text);
        if (!token) throw new Error('Unsupported test selector: ' + text);
        const value = token[0];
        if (value[0] === '.' ? !node.classList.contains(value.slice(1)) : value[0] === '#' ? node.id !== value.slice(1) : value !== '*' && node.localName !== value) return false;
        text = text.slice(value.length);
      }
      return true;
    };
    return splitOutside(selector, ',').some(part => {
      const chain = splitOutside(part, ' >');
      const matchAt = (node, index) => {
        if (!simple(node, chain[index])) return false;
        if (!index) return true;
        if (chain[index - 1] === '>') return matchAt(node.parentElement, index - 2);
        for (let parent = node.parentElement; parent; parent = parent.parentElement) if (matchAt(parent, index - 1)) return true;
        return false;
      };
      return matchAt(element, chain.length - 1);
    });
  };
  const recordMutation = record => {
    for (const observer of observers) {
      if (!observer.target || !observer.target.contains(record.target)) continue;
      if (record.type === 'attributes' && (!observer.options.attributes || !observer.options.attributeFilter.includes(record.attributeName))) continue;
      if (record.type === 'childList' && !observer.options.childList) continue;
      observer.records.push(record);
    }
  };
  const flushMutations = () => {
    for (let round = 0; round < 20; round++) {
      const pending = observers.filter(observer => observer.records.length);
      if (!pending.length) return;
      for (const observer of pending) { const records = observer.records.splice(0); observer.callback(records); }
    }
    throw new Error('Mutation feedback loop in controller');
  };
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
    constructor(owner) { this.owner = owner; this.values = new Map(); }
    setProperty(name, value, priority = '') {
      if (this.getPropertyValue(name) === String(value) && this.getPropertyPriority(name) === priority) return;
      this.values.set(name, [String(value), priority]);
      recordMutation({ type: 'attributes', target: this.owner, attributeName: 'style' });
    }
    getPropertyValue(name) { return this.values.get(name)?.[0] || ''; }
    getPropertyPriority(name) { return this.values.get(name)?.[1] || ''; }
    removeProperty(name) { if (this.values.delete(name)) recordMutation({ type: 'attributes', target: this.owner, attributeName: 'style' }); }
  }
  class Element extends Target {
    constructor(tag) {
      super(); this.localName = tag; this.nodeType = tag === '#text' ? 3 : 1; this.children = []; this.attributes = new Map(); this.style = new Style(this);
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
    setAttribute(name, value) {
      const oldValue = this.getAttribute(name); value = String(value);
      if (oldValue === value) return;
      this.attributes.set(name, value); recordMutation({ type: 'attributes', target: this, attributeName: name, oldValue });
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { const oldValue = this.getAttribute(name); if (this.attributes.delete(name)) recordMutation({ type: 'attributes', target: this, attributeName: name, oldValue }); }
    get id() { return this.getAttribute('id') || ''; } set id(value) { this.setAttribute('id', value); }
    get className() { return this.getAttribute('class') || ''; } set className(value) { this.setAttribute('class', value); }
    append(...children) { for (const child of children) { child.remove(); this.children.push(child); child.parentElement = this; recordMutation({ type: 'childList', target: this, addedNodes: [child], removedNodes: [] }); } }
    prepend(child) { child.remove(); this.children.unshift(child); child.parentElement = this; recordMutation({ type: 'childList', target: this, addedNodes: [child], removedNodes: [] }); }
    insertBefore(child, before) { child.remove(); const n = this.children.indexOf(before); this.children.splice(n < 0 ? this.children.length : n, 0, child); child.parentElement = this; recordMutation({ type: 'childList', target: this, addedNodes: [child], removedNodes: [] }); }
    remove() { if (this.parentElement) { const parent = this.parentElement; parent.children = parent.children.filter(v => v !== this); this.parentElement = null; recordMutation({ type: 'childList', target: parent, addedNodes: [], removedNodes: [this] }); } }
    get isConnected() { return this === document.documentElement || !!this.parentElement?.isConnected || !!this.host?.isConnected; }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    attachShadow() { this.shadowRoot = new Element('#shadow'); this.shadowRoot.host = this; return this.shadowRoot; }
    getBoundingClientRect() { stats.rectReads++; return { ...this.rect, right: this.rect.left + this.rect.width, bottom: this.rect.top + this.rect.height }; }
    focus() { document.activeElement = this; }
    click() { this.dispatchEvent(new Event('click')); }
    showModal() { this.open = true; this.modalCalls = (this.modalCalls || 0) + 1; }
    close() { this.open = false; }
    getContext() { return { drawImage() {} }; }
    matches(selector) { return matches(this, selector); }
    closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null; }
    querySelectorAll(selector) { const result = []; const walk = element => { for (const child of element.children) { if (child.matches(selector)) result.push(child); walk(child); } }; walk(this); return result; }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  }
  const document = new Target(); document.hidden = false; document.fullscreenElement = null;
  document.createElement = tag => new Element(tag); document.createElementNS = (_, tag) => new Element(tag);
  document.createTextNode = text => { const node = new Element('#text'); node.textContent = text; return node; };
  document.documentElement = new Element('html'); document.body = new Element('body'); document.documentElement.append(document.body);
  document.getElementById = value => nodes.find(node => node.id === value && node.isConnected && !node.host) || null;
  document.querySelector = selector => document.documentElement.querySelector(selector);
  document.querySelectorAll = selector => { stats.surfaceScans++; return document.documentElement.querySelectorAll(selector); };
  const app = new Element('ytd-app'), watch = new Element('ytd-watch-flexy'), below = new Element('div'), comments = new Element('ytd-comments');
  below.id = 'below'; comments.id = 'comments';
  const player = new Element('div'), video = new Element('video'), toolbar = new Element('div'), gear = new Element('button');
  player.id = 'movie_player'; video.className = 'html5-main-video'; toolbar.className = 'ytp-right-controls'; gear.className = 'ytp-settings-button';
  Object.assign(video, { videoWidth: 640, videoHeight: 360, readyState: 4, currentTime: 1, currentSrc: 'test:static', paused: false, seeking: false });
  document.body.append(app); app.append(watch); watch.append(player, below); below.append(comments); player.append(video, toolbar); toolbar.append(gear);
  if (videoFrameCallbacks) {
    video.requestVideoFrameCallback = callback => { const n = ++id; videoFrames.set(n, callback); return n; };
    video.cancelVideoFrameCallback = n => videoFrames.delete(n);
  }
  const pixels = new Uint8ClampedArray(160 * 90 * 4);
  class Renderer {
    static scrollBlend() { return 0; }
    constructor() { this.padding = 180; this.readable = true; this.stableFrames = 4; renderer = this; }
    reset() {} invalidate() {} dispose() { this.disposed = true; }
    result() { return { readable: true, cropped: true, videoCrop: { x: 0, y: 10, width: 160, height: 70 }, samplingCrop: { x: 0, y: 10, width: 160, height: 70 } }; }
    draw(...args) { renders.push(args); return this.result(); }
    inspect(...args) { inspections.push(args); return this.result(); }
    readPixels() { return pixels; }
  }
  class WorkerRenderer extends Renderer {
    constructor(canvas, callbacks) { super(canvas); this.callbacks = callbacks; this.pending = false; worker = this; }
    setSuspended(value) { this.suspended = value; }
    canAcceptFrame() { return !this.disposed && !this.pending && !this.suspended; }
    draw(source, rectangle, viewport, radial, options) {
      if (!this.canAcceptFrame()) return false;
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
    getComputedStyle: element => { stats.computedStyleReads++; return { objectFit: 'contain', display: element.hidden ? 'none' : 'block' }; },
    ResizeObserver: class { constructor(callback) { this.callback = callback; resizeObservers.push(this); } observe(target) { this.target = target; } disconnect() { this.target = null; } },
    MutationObserver: class { constructor(callback) { this.callback = callback; this.records = []; observers.push(this); } observe(target, options) { this.target = target; this.options = options; } disconnect() { this.target = null; this.records = []; } },
    requestAnimationFrame: callback => { const n = ++id; raf.set(n, callback); return n; }, cancelAnimationFrame: n => raf.delete(n),
    setInterval: callback => { const n = ++id; intervals.set(n, callback); return n; }, clearInterval: n => intervals.delete(n),
    setTimeout: (callback, delay = 0) => { const n = ++id; timeouts.set(n, { callback, due: now + delay }); return n; }, clearTimeout: n => timeouts.delete(n), queueMicrotask,
    ...(idleCallbacks ? { requestIdleCallback: callback => { const n = ++id; idle.set(n, callback); return n; }, cancelIdleCallback: n => idle.delete(n) } : {}),
    YacRenderer: Renderer, YacWorkerRenderer: WorkerRenderer, YacFlashMonitor: class { reset() {} sample() { stats.monitorSamples++; return flash; } }
  });
  const folder = path.resolve(__dirname, '..');
  if (fs.existsSync(path.join(folder, 'settings-store.js'))) vm.runInContext(fs.readFileSync(path.join(folder, 'settings-store.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(folder, 'ambient.js'), 'utf8'), context, { filename: 'ambient.js' });
  const flushTasks = () => {
    flushMutations();
    for (let round = 0; round < 20; round++) {
      const due = [...timeouts].filter(([, task]) => task.due <= now);
      if (!due.length && !idle.size) break;
      for (const [n, task] of due) { timeouts.delete(n); task.callback(); }
      const jobs = [...idle.values()]; idle.clear(); jobs.forEach(callback => callback({ didTimeout: false, timeRemaining: () => 5 }));
      flushMutations();
    }
  };
  return { document, window, video, player, watch, below, comments, app, renders, inspections, nodes, raf, intervals, storageListeners, stats, idle, timeouts, observers, videoFrames,
    get worker() { return worker; },
    get renderer() { return renderer; },
    load: async saved => { assert.ok(resolveStorage, 'controller starts storage load'); resolveStorage({ ambient: saved }); for (let i = 0; i < 8; i++) await Promise.resolve(); flushWorkers(); flushTasks(); },
    tick: ({ delta = 100, mediaAdvance = delta / 1000, flush = true } = {}) => { if (flush) flushWorkers(); now += delta; if (!video.paused) video.currentTime += mediaAdvance; const callbacks = [...raf.values()]; raf.clear(); callbacks.forEach(f => f(now)); if (flush) flushWorkers(); flushTasks(); },
    presentVideoFrame: () => { const callbacks = [...videoFrames.values()]; videoFrames.clear(); presentedFrames++; callbacks.forEach(callback => callback(now, { mediaTime: video.currentTime, presentedFrames, expectedDisplayTime: now })); },
    flushWorkers, flushTasks, flushMutations,
    advance: delta => { now += delta; flushTasks(); },
    discover: () => { for (const callback of intervals.values()) callback(); flushTasks(); },
    resize: () => { for (const observer of resizeObservers) if (observer.target) observer.callback(); flushTasks(); },
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
module.exports = { harness };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
