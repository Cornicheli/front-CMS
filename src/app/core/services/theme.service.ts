import { inject, Injectable, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);

  readonly isDark = signal<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem('theme') === 'dark'
  );

  constructor() {
    // Apply initial theme synchronously (avoids flash)
    this.doc.documentElement.classList.toggle('dark', this.isDark());

    // Keep <html> class and localStorage in sync on every change
    effect(() => {
      const dark = this.isDark();
      this.doc.documentElement.classList.toggle('dark', dark);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update(v => !v);
  }
}
