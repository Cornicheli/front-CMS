import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  effect,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  form,
  FormField,
  submit,
  required,
  minLength,
  pattern,
} from '@angular/forms/signals';
import { ContentService } from '@features/contents/services/content.service';
import { Category } from '@models/category.model';
import { Folder } from '@models/folder.model';
import { ContentType } from '@models/content.model';

@Component({
  selector: 'app-content-form',
  standalone: true,
  imports: [FormField],
  templateUrl: './content-form.component.html',
})
export class ContentFormComponent {
  private readonly contentService = inject(ContentService);

  readonly categories = input<Category[]>([]);
  readonly folders = input<Folder[]>([]);
  readonly closed = output<void>();

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly model = signal<{
    name: string;
    url: string;
    type: ContentType | '';
    category_id: number | null;
    folder_id: number | null;
    has_audio: boolean;
  }>({
    name: '',
    url: '',
    type: '',
    category_id: null,
    folder_id: null,
    has_audio: false,
  });

  readonly contentForm = form(this.model, (s) => {
    required(s.name, { message: 'El nombre es requerido' });
    minLength(s.name, 2, { message: 'Mínimo 2 caracteres' });
    required(s.url, { message: 'La URL es requerida' });
    pattern(s.url, /^https?:\/\/.+/, {
      message: 'Debe comenzar con https:// o http://',
    });
    required(s.type, { message: 'Seleccioná un tipo de contenido' });
  });

  /** Show has_audio only for videos */
  readonly showAudio = computed(() => this.model().type === 'video');

  /** Reset has_audio when switching away from video */
  private readonly _resetAudio = effect(() => {
    if (this.model().type !== 'video') {
      this.model.update((m) => ({ ...m, has_audio: false }));
    }
  });

  onTypeChange(value: string): void {
    this.model.update((m) => ({
      ...m,
      type: value as ContentType | '',
      has_audio: value !== 'video' ? false : m.has_audio,
    }));
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    submit(this.contentForm, async () => {
      const m = this.model();
      if (!m.type) return;
      this.isLoading.set(true);
      try {
        await firstValueFrom(
          this.contentService.createContent({
            name: m.name,
            url: m.url,
            type: m.type,
            category_id: m.category_id,
            folder_id: m.folder_id,
            has_audio: m.has_audio,
          }),
        );
        this.closed.emit();
      } catch {
        this.errorMessage.set('No se pudo crear el contenido. Verificá la URL e intentá de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}
