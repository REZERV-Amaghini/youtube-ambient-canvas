(() => {
  'use strict';
  const prefix = 'yac-setting:';
  const ranges = { strength: [15, 100], blur: [0, 160], saturation: [0, 250], inset: [0, 40], fps: [24, 60],
    surfaceMultiplier: [0, 1], controlDensity: [0, 100], readingDensity: [0, 100], navigationDensity: [0, 100],
    surfaceDensity: [0, 100], controlDensityOffset: [-30, 30], readingDensityOffset: [-30, 30], navigationDensityOffset: [-30, 30] };
  const surfaceKeys = ['surfaceMultiplier', 'controlDensity', 'readingDensity', 'navigationDensity'];
  const legacySurfaceKeys = ['surfaceDensity', 'controlDensityOffset', 'readingDensityOffset', 'navigationDensityOffset'];
  const bounded = (values, key, fallback) => {
    const value = values?.[key], [min, max] = ranges[key];
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  };
  // Each preference has its own storage key. A stale tab cannot replace another
  // tab's warning choice when saving an unrelated slider. The old ambient bag
  // remains a read-only fallback for upgrades from earlier versions.
  class YacSettingsStore {
    static migrateSurfaces(values = {}) {
      const master = bounded(values, 'surfaceDensity', 100) / 100;
      const levels = legacySurfaceKeys.slice(1).map(key => Math.min(1, master * (1 + bounded(values, key, 0) / 100)));
      // Preserve all three paint levels, including previously positive offsets.
      // This fallback is read-only; unrelated saves never write a whole profile.
      const surfaceMultiplier = Math.max(...levels);
      const result = { surfaceMultiplier };
      for (let i = 0; i < levels.length; i++) result[surfaceKeys[i + 1]] = surfaceMultiplier ? levels[i] / surfaceMultiplier * 100 : 100;
      return result;
    }
    static surfacePalette(values = {}) {
      const migrated = YacSettingsStore.migrateSurfaces(values);
      const master = bounded(values, 'surfaceMultiplier', migrated.surfaceMultiplier);
      const level = key => master * bounded(values, key, migrated[key]) / 100;
      const controls = level('controlDensity'), reading = level('readingDensity'), navigation = level('navigationDensity');
      const controlAlpha = .22 * controls, readingAlpha = .74 * reading, menuAlpha = .86 * navigation;
      // These are paint coefficients, not UI percentages or measured contrast.
      // Chat already has a reading face; its children add only the remaining shade.
      const palette = {
        '--yac-control-opacity': controlAlpha,
        '--yac-control-hover-opacity': .34 * controls,
        '--yac-control-selected-opacity': .44 * controls,
        '--yac-control-dark-brightness': 1 - .50 * controls,
        '--yac-control-dark-hover-brightness': 1 - .60 * controls,
        '--yac-chip-dark-brightness': 1 - .56 * controls,
        '--yac-control-light-contrast': 1 - .90 * controls,
        '--yac-control-light-brightness': 1 + .80 * controls,
        '--yac-control-blur': 12 * controls,
        '--yac-reading-blur': 12 * reading,
        '--yac-navigation-blur': 16 * navigation,
        '--yac-control-feedback': controls,
        '--yac-navigation-level': navigation,
        '--yac-reading-opacity': readingAlpha,
        '--yac-reading-hover-opacity': .80 * reading,
        // Long text panes avoid backdrop filters. Their denser paint protects
        // secondary/accent text without a per-comment blur or opacity floor.
        '--yac-reading-pane-opacity': .94 * reading,
        '--yac-reading-pane-hover-opacity': .98 * reading,
        '--yac-menu-opacity': menuAlpha,
        '--yac-guide-opacity': .78 * navigation,
        '--yac-secondary-opacity': .90 * navigation,
        '--yac-settings-opacity': .90 * navigation,
        '--yac-chat-header-opacity': .04 * reading / (1 - readingAlpha),
        '--yac-chat-overlay-opacity': Math.max(0, (menuAlpha - readingAlpha) / (1 - readingAlpha))
      };
      return Object.fromEntries(Object.entries(palette).map(([key, value]) => [key, value.toFixed(6) + (key.endsWith('-blur') ? 'px' : '')]));
    }
    constructor(storage, defaults, { onChange = () => {} } = {}) {
      this.storage = storage; this.defaults = { ...defaults }; this.values = { ...defaults };
      this.onChange = onChange; this.loaded = false; this.disposed = false;
      this.legacy = {}; this.overrides = new Map(); this.edits = new Map(); this.events = [];
      this.saveErrors = new Map(); this.writeVersions = new Map(); this.persistenceRevision = 0;
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
      const oldSurfaces = { ...this.legacy };
      for (const key of legacySurfaceKeys) if (this.overrides.has(key)) oldSurfaces[key] = this.overrides.get(key);
      const migrated = YacSettingsStore.migrateSurfaces(oldSurfaces);
      const hasOldSurfaces = legacySurfaceKeys.some(key => Object.hasOwn(oldSurfaces, key));
      for (const key of Object.keys(this.defaults)) {
        this.values[key] = this.normalize(key, this.overrides.has(key) ? this.overrides.get(key) : this.legacy[key]) ??
          (hasOldSurfaces && surfaceKeys.includes(key) ? migrated[key] : this.defaults[key]);
      }
    }
    consume(changes) {
      if (changes.ambient) this.legacy = changes.ambient.newValue || {};
      for (const key of new Set([...Object.keys(this.defaults), ...legacySurfaceKeys])) {
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
        const keys = new Set([...Object.keys(this.defaults), ...legacySurfaceKeys]);
        const data = await this.storage.local.get(['ambient', ...[...keys].map(key => prefix + key)]);
        if (this.disposed) return;
        this.legacy = data.ambient || {}; this.overrides.clear();
        for (const key of keys) {
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
      const signature = JSON.stringify([this.loaded, this.values, this.persistenceRevision]);
      if (!error && signature === this.emittedSignature) return;
      this.emittedSignature = signature;
      const failed = this.saveErrors.entries().next().value;
      this.onChange({ ...this.values }, { loaded: this.loaded, error,
        saveError: failed ? { key: failed[0], error: failed[1] } : null, saveErrorCount: this.saveErrors.size });
    }
    set(key, value, persist = false) {
      const normalized = this.normalize(key, value);
      if (this.disposed || normalized === undefined) return Promise.resolve();
      if (!this.loaded) this.edits.set(key, normalized);
      this.overrides.set(key, normalized); this.values[key] = normalized; this.emit();
      if (!persist) return Promise.resolve();
      const version = (this.writeVersions.get(key) || 0) + 1;
      this.writeVersions.set(key, version);
      // Keep the explicitly chosen value on this page, including a reduction to
      // 15%. Report durability failures separately, without silently undoing it.
      return Promise.resolve().then(() => this.storage.local.set({ [prefix + key]: normalized })).then(() => {
        if (!this.disposed && this.writeVersions.get(key) === version && this.saveErrors.delete(key)) {
          this.persistenceRevision++; this.emit();
        }
      }, error => {
        if (!this.disposed && this.writeVersions.get(key) === version) {
          this.saveErrors.set(key, error); this.persistenceRevision++; this.emit(error);
        }
        throw error;
      });
    }
    dispose() {
      this.disposed = true; this.events = []; this.edits.clear();
      this.storage.onChanged?.removeListener(this.listener);
    }
  }
  globalThis.YacSettingsStore = YacSettingsStore;
  if (typeof module !== 'undefined') module.exports = YacSettingsStore;
})();
