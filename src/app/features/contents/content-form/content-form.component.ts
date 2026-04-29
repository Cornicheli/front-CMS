import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  effect,
  untracked,
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
import { Content, ContentType, UpdateContentRequest, IAB_CATEGORIES, IabCategory, CONTENT_DURATIONS, ContentDuration } from '@models/content.model';

@Component({
  selector: 'app-content-form',
  standalone: true,
  imports: [FormField],
  templateUrl: './content-form.component.html',
})
export class ContentFormComponent {
  private readonly contentService = inject(ContentService);

  readonly categories     = input<Category[]>([]);
  readonly folders        = input<Folder[]>([]);
  readonly initialContent = input<Content | null>(null);
  readonly closed         = output<void>();

  readonly isEditMode = computed(() => this.initialContent() !== null);
  readonly contentId  = computed(() => this.initialContent()?.id ?? null);

  readonly isLoading    = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly model = signal<{
    name: string;
    url: string;
    type: ContentType | '';
    category_id: number | null;
    folder_id: number | null;
    has_audio: boolean;
    iab_category: IabCategory | null;
    duration: ContentDuration | null;
  }>({
    name: '',
    url: '',
    type: '',
    category_id: null,
    folder_id: null,
    has_audio: false,
    iab_category: null,
    duration: null,
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

  readonly iabOpen = signal(false);
  readonly selectedIabName = computed(() => this.model().iab_category ?? 'Seleccionar categoría IAB...');

  readonly iabCategories = IAB_CATEGORIES;
  readonly durations = CONTENT_DURATIONS;

  selectIab(value: IabCategory | null): void {
    this.model.update(m => ({ ...m, iab_category: value }));
    this.iabOpen.set(false);
  }

  /** Populate form when editing — untracked prevents model becoming a dependency of this effect */
  private readonly _populateEffect = effect(() => {
    const c = this.initialContent();
    if (c) {
      untracked(() => this.model.set({
        name:        c.name,
        url:         c.url,
        type:        c.type,
        category_id: c.category_id,
        folder_id:   c.folder_id,
        has_audio:   c.has_audio,
        iab_category: c.iab_category ?? null,
        duration:    c.duration ?? null,
      }));
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
        if (this.isEditMode()) {
          await firstValueFrom(
            this.contentService.updateContent(this.contentId()!, {
              name:        m.name,
              url:         m.url,
              type:        m.type,
              category_id: m.category_id,
              folder_id:   m.folder_id,
              has_audio:   m.has_audio,
              iab_category: m.iab_category,
              duration:    m.duration,
            } as UpdateContentRequest),
          );
        } else {
          await firstValueFrom(
            this.contentService.createContent({
              name:        m.name,
              url:         m.url,
              type:        m.type,
              category_id: m.category_id,
              folder_id:   m.folder_id,
              has_audio:   m.has_audio,
              iab_category: m.iab_category,
              duration:    m.duration,
            }),
          );
        }
        this.closed.emit();
      } catch {
        this.errorMessage.set(
          this.isEditMode()
            ? 'No se pudo guardar los cambios. Verificá los datos e intentá de nuevo.'
            : 'No se pudo crear el contenido. Verificá la URL e intentá de nuevo.',
        );
        this.isLoading.set(false);
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}
