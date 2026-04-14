/**
 * Unit tests for the settingsStore Zustand slice.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useSettingsStore.setState({
      quality: 'auto',
      soundEnabled: true,
      musicEnabled: true,
      hapticEnabled: true,
    });
  });

  it('should initialize with default settings', () => {
    const state = useSettingsStore.getState();
    expect(state.quality).toBe('auto');
    expect(state.soundEnabled).toBe(true);
    expect(state.musicEnabled).toBe(true);
    expect(state.hapticEnabled).toBe(true);
  });

  it('should update quality tier via setQuality()', () => {
    useSettingsStore.getState().setQuality('low');
    expect(useSettingsStore.getState().quality).toBe('low');

    useSettingsStore.getState().setQuality('high');
    expect(useSettingsStore.getState().quality).toBe('high');
  });

  it('should toggle soundEnabled via toggleSound()', () => {
    useSettingsStore.getState().toggleSound();
    expect(useSettingsStore.getState().soundEnabled).toBe(false);

    useSettingsStore.getState().toggleSound();
    expect(useSettingsStore.getState().soundEnabled).toBe(true);
  });

  it('should toggle musicEnabled via toggleMusic()', () => {
    useSettingsStore.getState().toggleMusic();
    expect(useSettingsStore.getState().musicEnabled).toBe(false);
  });

  it('should toggle hapticEnabled via toggleHaptic()', () => {
    useSettingsStore.getState().toggleHaptic();
    expect(useSettingsStore.getState().hapticEnabled).toBe(false);

    useSettingsStore.getState().toggleHaptic();
    expect(useSettingsStore.getState().hapticEnabled).toBe(true);
  });

  it('should allow independent toggling of each setting', () => {
    useSettingsStore.getState().toggleSound();
    useSettingsStore.getState().toggleHaptic();

    const state = useSettingsStore.getState();
    expect(state.soundEnabled).toBe(false);
    expect(state.hapticEnabled).toBe(false);
    expect(state.musicEnabled).toBe(true); // untouched
  });

  it('should accept all valid quality tiers', () => {
    const tiers = ['auto', 'low', 'medium', 'high'] as const;
    for (const tier of tiers) {
      useSettingsStore.getState().setQuality(tier);
      expect(useSettingsStore.getState().quality).toBe(tier);
    }
  });
});
