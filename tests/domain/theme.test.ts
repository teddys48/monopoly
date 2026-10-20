import { describe, it, expect } from 'vitest';
import { resolveInitialTheme } from '../../src/lib/stores/theme.svelte';

describe('Theme Preference Resolver', () => {
  it('respects explicitly stored dark preference', () => {
    expect(resolveInitialTheme('dark')).toBe('dark');
  });

  it('respects explicitly stored light preference', () => {
    expect(resolveInitialTheme('light')).toBe('light');
  });

  it('defaults strictly to light mode when storage is empty', () => {
    expect(resolveInitialTheme(null)).toBe('light');
  });

  it('defaults to light mode for any invalid or unrecognised stored value', () => {
    expect(resolveInitialTheme('invalid_theme')).toBe('light');
    expect(resolveInitialTheme('')).toBe('light');
  });
});
