import { Component, input } from '@angular/core';

@Component({
  selector: 'app-media-thumb',
  standalone: true,
  templateUrl: './media-thumb.component.html',
  host: { class: 'block relative w-full h-full overflow-hidden' },
  styleUrl: './media-thumb.component.scss',
})
export class MediaThumbComponent {
  readonly type     = input.required<'image' | 'video'>();
  readonly url      = input.required<string>();
  readonly alt      = input<string>('');
  /** Show play/pause overlay on videos (grid view). Set false for compact list view. */
  readonly overlay  = input<boolean>(true);
}
