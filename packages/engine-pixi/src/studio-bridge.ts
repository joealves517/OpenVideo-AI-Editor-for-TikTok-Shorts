import type { Core, AnyClip, Patch } from '@openvideo/core';
import type { Studio } from './studio';
import type { IClip } from './clips/iclip';
import { jsonToClip } from './json-serialization';
import { fontManager } from './utils/fonts';

/**
 * StudioBridge - The "Reconciler" between Core and Studio.
 * Now driven by Patches for deterministic rendering.
 */
export class StudioBridge {
  private core: Core;
  private studio: Studio;

  constructor(core: Core, studio: Studio) {
    this.core = core;
    this.studio = studio;

    this.init();
  }

  private isSyncing = false;

  private init() {
    console.log('StudioBridge.init');
    // 1. Sync Playback
    this.core.on('timeupdate', async (time: number) => {
      if (this.isSyncing) return;
      this.isSyncing = true;
      try {
        // If we're not playing, seek the studio to match core
        // If we ARE playing, the studio's own loop is already updating time,
        // but we still want to allow external seeks (scrubbing) to take precedence.
        if (!this.studio.isPlaying) {
          await this.studio.transport.seek(time);
        }
      } finally {
        this.isSyncing = false;
      }
    });

    this.core.on('play', () => {
      console.log('core:play -> studio.play()');
      this.studio.play();
    });

    this.core.on('pause', () => {
      console.log('core:pause -> studio.pause()');
      this.studio.pause();
    });

    // 2. Sync Back from Studio to Core (Source of Truth)
    this.studio.on('currentTime', ({ currentTime }) => {
      if (this.studio.isPlaying && !this.isSyncing) {
        this.isSyncing = true;
        try {
          this.core.seek(currentTime);
        } finally {
          this.isSyncing = false;
        }
      }
    });

    // 4. Selection Sync (Studio -> Core)
    const handleSelectionFromStudio = (data: { selected: any[] }) => {
      if (this.isSyncing) return;
      this.isSyncing = true;
      try {
        const ids = data.selected.map((c: any) => c.id);
        const currentSelectedIds = this.core.store.getState().selectedIds;
        if (JSON.stringify(ids) !== JSON.stringify(currentSelectedIds)) {
          this.core.store.getState().select(ids);
        }
      } finally {
        this.isSyncing = false;
      }
    };

    this.studio.on('selection:created', handleSelectionFromStudio);
    this.studio.on('selection:updated', handleSelectionFromStudio);
    this.studio.on('selection:cleared', () =>
      handleSelectionFromStudio({ selected: [] })
    );

    // 5. Sync via Patches
    this.core.on('change', (patches: Patch[]) => this.handlePatches(patches));

    // 6. Initial Sync
    this.syncInitialState();
  }

  private syncSelectionToStudio(ids: string[]) {
    const currentStudioSelection = this.studio.selection
      .getSelection()
      .map((c: any) => c.id);
    if (JSON.stringify(ids) !== JSON.stringify(currentStudioSelection)) {
      this.studio.selectClipsByIds(ids);
    }
  }

  private async handlePatches(patches: Patch[]) {
    // Only trigger a full re-sync for root replacements or settings changes.
    // Structural changes like tracks and clips are now handled granularly.
    const structuralProps = ['settings'];
    const hasRootUpdate = patches.some((patch) => {
      if (patch.path === '/') return true;
      const parts = patch.path.split('/').filter(Boolean);
      return (
        parts.length === 1 &&
        patch.op === 'update' &&
        structuralProps.includes(parts[0])
      );
    });

    if (hasRootUpdate) {
      await this.syncInitialState();
      return;
    }

    for (const patch of patches) {
      const parts = patch.path.split('/').filter(Boolean);

      // Handle Clips
      if (parts[0] === 'clips') {
        const clipId = parts[1];
        if (patch.op === 'add' && !parts[2]) {
          await this.handleAddClip(patch.value);
        } else if (patch.op === 'remove' && !parts[2]) {
          await this.handleRemoveClip(clipId);
        } else if (patch.op === 'update') {
          this.handleUpdateClip(clipId, parts.slice(2), patch.value);
        }
      }

      // Handle Tracks
      if (parts[0] === 'tracks') {
        await this.studio.setTracks(this.core.store.getState().tracks as any);
      }

      // Handle Settings
      if (parts[0] === 'settings') {
        const settings = this.core.store.getState().settings;
        this.studio.setSize(settings.width, settings.height);
      }

      // Handle Selection
      if (parts[0] === 'selectedIds') {
        this.syncSelectionToStudio(this.core.store.getState().selectedIds);
      }
    }
  }

  private async handleAddClip(coreClip: AnyClip) {
    if (coreClip.type === 'Transition') {
      await this.studio.addTransition(
        coreClip.transitionEffect?.key || 'none',
        coreClip.duration,
        coreClip.fromClipId,
        coreClip.toClipId
      );
    } else {
      // Pre-load any font referenced by this clip before constructing the Pixi clip.
      // This ensures document.fonts is ready before refreshText() runs.
      await this.ensureFontForClip(coreClip);
      const clip = await jsonToClip(coreClip);
      const trackId = this.findTrackIdForClip(coreClip.id);
      await this.studio.addClip(clip, { trackId });
    }
  }

  private async handleRemoveClip(clipId: string) {
    const clip = this.studio.timeline.getClipById(clipId);
    if (clip) {
      await this.studio.removeClip(clip);
    }
  }

  private handleUpdateClip(clipId: string, pathParts: string[], value: any) {
    const clip = this.studio.timeline.getClipById(clipId);
    if (!clip) return;

    // Simple property update
    if (pathParts.length === 0) {
      // Full clip update
      const wasLocked = clip.locked;
      const changed = this.syncClipProperties(clip, value);

      if (changed) {
        console.log('handleUpdateClip [UPDATED]', clipId, value);
        // If lock status changed and it's selected, refresh transformer
        if (
          wasLocked !== clip.locked &&
          this.studio.selection.selectedClips.has(clip)
        ) {
          this.studio.selection.recreateTransformer();
        }
        this.studio.updateFrame(this.studio.currentTime);
      }
    } else {
      // Granular update (e.g. /clips/c1/left)
      const prop = pathParts[0];
      if (prop === 'display') {
        if (
          !clip.display ||
          clip.display.from !== value.from ||
          clip.display.to !== value.to
        ) {
          console.log('handleUpdateClip [DISPLAY UPDATED]', clipId, value);
          clip.display = { ...value };
          clip.duration = value.to - value.from;
          this.studio.updateFrame(this.studio.currentTime);
        }
      } else {
        const wasLocked = clip.locked;
        const currentValue = (clip as any)[prop];

        if (currentValue !== value) {
          console.log('handleUpdateClip [PROP UPDATED]', clipId, prop, value);
          Object.assign(clip, { [prop]: value });

          if (prop === 'duration') {
            if (clip.display) {
              clip.display.to = clip.display.from + value;
            }
          }
          if (prop === 'display' && value) {
            clip.duration = value.to - value.from;
          }

          if (
            prop === 'locked' &&
            wasLocked !== value &&
            this.studio.selection.selectedClips.has(clip)
          ) {
            this.studio.selection.recreateTransformer();
          }
          this.studio.updateFrame(this.studio.currentTime);
        }
      }
    }
  }

  private async syncInitialState() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      console.log('[StudioBridge] syncInitialState starting...');
      await this.studio.clear();
      const state = this.core.store.getState();
      this.studio.setSize(state.settings.width, state.settings.height);
      for (const id in state.clips) {
        await this.handleAddClip(state.clips[id]);
      }

      this.studio.setTracks(state.tracks as any);
      this.syncSelectionToStudio(state.selectedIds);

      this.studio.updateFrame(state.currentTime);
    } finally {
      this.isSyncing = false;
      console.log('[StudioBridge] syncInitialState finished.');
    }
  }

  private findTrackIdForClip(clipId: string): string | undefined {
    return this.core.store
      .getState()
      .tracks.find((t) => t.clipIds.includes(clipId))?.id;
  }

  /**
   * Pre-load a font referenced by a clip's style.fontUrl (or top-level fontUrl).
   * Must be called before jsonToClip() so document.fonts is populated when
   * the Text constructor calls refreshText().
   */
  private async ensureFontForClip(coreClip: AnyClip): Promise<void> {
    const style = (coreClip as any).style;
    const fontUrl = style?.fontUrl || (coreClip as any).fontUrl;
    const fontFamily = style?.fontFamily || (coreClip as any).fontFamily;
    if (!fontUrl || !fontFamily) return;
    try {
      await fontManager.addFont({ name: fontFamily, url: fontUrl });
    } catch (err) {
      console.warn(
        `[StudioBridge] Failed to pre-load font "${fontFamily}":`,
        err
      );
    }
  }

  private syncClipProperties(clip: IClip, coreClip: AnyClip): boolean {
    let changed = false;
    // Legacy sync logic for full updates
    const props: (
      | keyof AnyClip
      | 'text'
      | 'words'
      | 'caption'
      | 'textBoxStyle'
      | 'wordsPerLine'
      | 'videoWidth'
      | 'videoHeight'
      | 'fontUrl'
      | 'mediaId'
      | 'bottomOffset'
    )[] = [
      'left',
      'top',
      'width',
      'height',
      'angle',
      'opacity',
      'zIndex',
      'flip',
      'playbackRate',
      'trim',
      'volume',
      'text',
      'words',
      'style',
      'chromaKey',
      'colorAdjustment',
      'animations',
      'locked',
      'caption',
      'textBoxStyle',
      'wordsPerLine',
      'videoWidth',
      'videoHeight',
      'fontUrl',
      'mediaId',
      'bottomOffset',
      'duration',
    ];
    props.forEach((prop) => {
      const newValue = (coreClip as any)[prop];
      if (newValue === undefined) return;

      const currentValue = (clip as any)[prop];

      // Equality check to avoid triggering setters
      if (currentValue === newValue) return;

      // Handle numeric precision for position/size
      if (typeof currentValue === 'number' && typeof newValue === 'number') {
        if (Math.abs(currentValue - newValue) < 0.01) return;
      }

      // Handle objects (shallow compare for display and trim)
      if (prop === 'display' || prop === 'trim') {
        if (
          currentValue &&
          newValue &&
          currentValue.from === newValue.from &&
          currentValue.to === newValue.to
        ) {
          return;
        }
      }

      // Handle style (JSON check)
      if (prop === 'style') {
        if (JSON.stringify(currentValue) === JSON.stringify(newValue)) return;
      }

      Object.assign(clip, { [prop]: newValue });
      changed = true;
    });

    // Guard display assignment separately as it wasn't in the loop's props list
    const d = coreClip.display;
    if (
      d &&
      (!clip.display ||
        clip.display.from !== d.from ||
        clip.display.to !== d.to)
    ) {
      clip.display = { ...d };
      clip.duration = d.to - d.from;
      changed = true;
    }

    return changed;
  }

  public dispose() {
    this.core.removeAllListeners();
  }
}
