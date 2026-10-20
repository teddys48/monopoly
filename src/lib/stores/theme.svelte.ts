export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'wni_theme';

/**
 * Resolves initial theme mode.
 * Defaults strictly to 'light' unless explicitly saved as 'dark' in localStorage.
 */
export function resolveInitialTheme(storedValue: string | null): ThemeMode {
  if (storedValue === 'dark') {
    return 'dark';
  }
  return 'light';
}

class ThemeStore {
  mode = $state<ThemeMode>('light');

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      this.mode = resolveInitialTheme(stored);
      this.applyToDOM();
    }
  }

  toggle(): void {
    this.mode = this.mode === 'light' ? 'dark' : 'light';
    this.persist();
    this.applyToDOM();
  }

  setTheme(mode: ThemeMode): void {
    this.mode = mode;
    this.persist();
    this.applyToDOM();
  }

  private persist(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, this.mode);
      } catch {
        // Handle restricted storage silently
      }
    }
  }

  private applyToDOM(): void {
    if (typeof document !== 'undefined') {
      if (this.mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
}

export const theme = new ThemeStore();
