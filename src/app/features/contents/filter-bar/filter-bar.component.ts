import { Component, input, output } from '@angular/core';
import { Category } from '@models/category.model';
import { ContentFilters } from '@models/filters.model';

/** Stub — full implementation in HITO 5. */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  template: ``,
})
export class FilterBarComponent {
  readonly categories = input<Category[]>([]);
  readonly filtersChanged = output<ContentFilters>();
}
