import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Category } from '@models/category.model';
import { ContentFilters } from '@models/filters.model';
import { ContentType } from '@models/content.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './filter-bar.component.html',
})
export class FilterBarComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  readonly categories    = input<Category[]>([]);
  readonly filtersChanged = output<ContentFilters>();

  readonly showArchived = signal<boolean>(false);

  readonly form = this.fb.nonNullable.group({
    search:      [''],
    type:        ['' as ContentType | ''],
    category_id: ['' as number | ''],
  });

  ngOnInit(): void {
    // Search: debounce 300 ms
    this.form.controls.search.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => this.emit());

    // Dropdowns: immediate
    this.form.controls.type.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.emit());

    this.form.controls.category_id.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.emit());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleArchived(): void {
    this.showArchived.update(v => !v);
    this.emit();
  }

  clearFilters(): void {
    this.form.reset({ search: '', type: '', category_id: '' });
    this.showArchived.set(false);
    this.emit(); // ← must call emit() so showArchived: undefined reaches the service
  }

  private emit(): void {
    const { search, type, category_id } = this.form.getRawValue();
    this.filtersChanged.emit({
      search:       search || undefined,
      type:         type || undefined,
      category_id:  category_id || undefined,
      showArchived: this.showArchived() || undefined,
    });
  }
}
