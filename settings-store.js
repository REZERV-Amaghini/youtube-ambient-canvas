(() => {
  'use strict';
  const prefix = 'yac-setting:';
  const ranges = { strength: [15, 100], blur: [0, 160], saturation: [0, 250], inset: [0, 40], fps: [24, 60] };
  // Each preference has its own storage key. A stale tab cannot replace another
  // tab's warning choice when saving an unrelated slider. The old ambient bag
  // remains a read-only fallback for upgrades from earlier versions.
  class YacSettingsStore {
    constructor(storage, defaults, { onChange = () => {} } = {}) {
      this.storage = storage; this.defaults = { ...defaults }; this.values = { ...defaults };
      this.onChange = onChange; this.loaded = false; this.disposed = false;
      this.legacy = {}; this.overrides = new Map(); this.edits = new Map(); this.events = [];
      this.listener = (changes, area) => {
        if (area !== 'local' || this.disposed) return;
        if (!this.loaded) this.events.push(changes);
        this.consume(changes); this.emit();
      };
      storage.onChanged?.addListener(this.listener);
      this.ready = this.load();
    }
    normalize(key, value) {
      if (!(key in this.defaults)) return undefined;
      if (key === 'language') return ['ja', 'en'].includes(value) ? value : undefined;
      if (typeof this.defaults[key] === 'boolean') return typeof value === 'boolean' ? value : undefined;
      if (!ranges[key] || !Number.isFinite(value)) return undefined;
      const [min, max] = ranges[key], n = Math.min(max, Math.max(min, value));
      return key === 'fps' ? Math.round(n) : n;
    }
    refresh() {
      for (const key of Object.keys(this.defaults)) {
        this.values[key] = this.normalize(key, this.overrides.has(key) ? this.overrides.get(key) : this.legacy[key]) ?? this.defaults[key];
      }
    }
    consume(changes) {
      if (changes.ambient) this.legacy = changes.ambient.newValue || {};
      for (const key of Object.keys(this.defaults)) {
        const change = changes[prefix + key];
        if (!change) continue;
        if (change.newValue === undefined) this.overrides.delete(key);
        else this.overrides.set(key, change.newValue);
      }
      this.refresh();
      // Preserve input that happened while the initial read was in flight.
      if (!this.loaded) for (const [key, value] of this.edits) this.values[key] = value;
    }
    async load() {
      let error;
      try {
        const data = await this.storage.local.get(['ambient', ...Object.keys(this.defaults).map(key => prefix + key)]);
        if (this.disposed) return;
        this.legacy = data.ambient || {}; this.overrides.clear();
        for (const key of Object.keys(this.defaults)) {
          if (Object.hasOwn(data, prefix + key)) this.overrides.set(key, data[prefix + key]);
        }
        this.refresh();
        for (const changes of this.events) this.consume(changes);
      } catch (caught) { error = caught; }
      if (this.disposed) return;
      for (const [key, value] of this.edits) { this.overrides.set(key, value);this.values[key] = value; }
      this.events = []; this.edits.clear(); this.loaded = true; this.emit(error);
    }
    emit(error) {
      const signature = JSON.stringify([this.loaded, this.values]);
      if (!error && signature === this.emittedSignature) return;
      this.emittedSignature = signature;
      this.onChange({ ...this.values }, { loaded: this.loaded, error });
    }
    set(key, value, persist = false) {
      const normalized = this.normalize(key, value);
      if (this.disposed || normalized === undefined) return Promise.resolve();
      if (!this.loaded) this.edits.set(key, normalized);
      this.overrides.set(key, normalized); this.values[key] = normalized; this.emit();
      return persist ? this.storage.local.set({ [prefix + key]: normalized }) : Promise.resolve();
    }
    dispose() {
      this.disposed = true; this.events = []; this.edits.clear();
      this.storage.onChanged?.removeListener(this.listener);
    }
  }
  globalThis.YacSettingsStore = YacSettingsStore;
  if (typeof module !== 'undefined') module.exports = YacSettingsStore;
})();
