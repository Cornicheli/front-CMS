import { Component, inject } from '@angular/core';
import { ContentService } from '@features/contents/services/content.service';

/** Stub — full implementation in HITO 5. */
@Component({
  selector: 'app-content-grid',
  standalone: true,
  template: `
    <div class="flex items-center justify-center h-40 text-slate-500 text-sm">
      Grilla de contenidos — HITO 5
    </div>
  `,
})
export class ContentGridComponent {
  protected readonly contentService = inject(ContentService);
}
