import { Component, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@features/auth/services/auth.service';
import { ContentService } from '@features/contents/services/content.service';
import { SidebarComponent } from '@features/contents/sidebar/sidebar.component';
import { FilterBarComponent } from '@features/contents/filter-bar/filter-bar.component';
import { ContentGridComponent } from '@features/contents/content-grid/content-grid.component';
import { ContentFilters } from '@models/filters.model';
import { ContentFormComponent } from '@features/contents/content-form/content-form.component';
import { Content } from '@models/content.model';
import { MonitorScreenService } from '@features/monitor/monitor-screen.service';
import { ThemeService } from '@core/services/theme.service';
import { getMetrics } from '@models/zone.model';
import { AppSidebarComponent } from '@shared/app-sidebar/app-sidebar.component';
import { AppRightRailComponent } from '@shared/app-right-rail/app-right-rail.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    SidebarComponent,
    FilterBarComponent,
    ContentGridComponent,
    ContentFormComponent,
    AppSidebarComponent,
    AppRightRailComponent,
  ],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly contentService = inject(ContentService);
  protected readonly screenService = inject(MonitorScreenService);
  protected readonly themeService = inject(ThemeService);
  readonly isFormOpen = signal(false);
  readonly editingContent = signal<Content | null>(null);
  readonly liveTime = signal(new Date().toTimeString().slice(0, 8));

  readonly activeFolderName = computed(() => {
    const folderId = this.contentService.filters().folder_id;
    if (!folderId) return null;
    return this.contentService.folders().find((f) => f.id === folderId)?.name ?? null;
  });

  readonly kpiRevenue = computed(() => {
    const total = this.contentService
      .contents()
      .filter((c) => !c.archived && !this.screenService.isContentOffline(c.id))
      .reduce((acc, c) => acc + getMetrics(c.id).revenue, 0);
    return total >= 1000 ? `$${(total / 1000).toFixed(1)}K` : `$${total}`;
  });

  readonly kpiErrors = computed(() => this.screenService.alertCount());

  constructor() {
    this.contentService.loadMockData().pipe(takeUntilDestroyed()).subscribe();
    setInterval(() => this.liveTime.set(new Date().toTimeString().slice(0, 8)), 1000);
  }

  onFolderSelected(id: number | null): void {
    if (id === null) {
      this.contentService.updateFilters({ folder_id: '', showArchived: undefined });
    } else {
      this.contentService.updateFilters({ folder_id: id });
    }
  }

  onFiltersChanged(filters: ContentFilters): void {
    this.contentService.updateFilters(filters);
  }

  openForm(): void { this.openNewForm(); }
  openNewForm(): void {
    this.editingContent.set(null);
    this.isFormOpen.set(true);
  }
  openEditForm(c: Content): void {
    this.editingContent.set(c);
    this.isFormOpen.set(true);
  }
  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingContent.set(null);
  }
}
