import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [SidebarComponent, FilterBarComponent, ContentGridComponent, ContentFormComponent, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly contentService = inject(ContentService);
  protected readonly screenService = inject(MonitorScreenService);
  protected readonly themeService = inject(ThemeService);

  readonly sidebarCollapsed = signal(false);
  readonly isFormOpen       = signal(false);
  readonly editingContent   = signal<Content | null>(null);
  readonly liveTime         = signal(new Date().toTimeString().slice(0, 8));

  /** Active folder name for breadcrumb display */
  readonly activeFolderName = computed(() => {
    const folderId = this.contentService.filters().folder_id;
    if (!folderId) return null;
    return this.contentService.folders().find((f) => f.id === folderId)?.name ?? null;
  });

  /** Revenue across all active (non-archived, online) contents */
  readonly kpiRevenue = computed(() => {
    const total = this.contentService.contents()
      .filter(c => !c.archived && !this.screenService.isContentOffline(c.id))
      .reduce((acc, c) => acc + getMetrics(c.id).revenue, 0);
    return total >= 1000 ? `$${(total / 1000).toFixed(1)}K` : `$${total}`;
  });

  /** Error / disconnected screen count */
  readonly kpiErrors = computed(() => this.screenService.alertCount());

  /** Proof of Play activity stream for right rail */
  readonly popActivity = [
    { t: '03:31:33', screen: 'CABA-014', zone: 'Centro',    content: 'Banner Obelisco',   dur: 10, status: 'partial' },
    { t: '03:31:05', screen: 'PAL-007',  zone: 'Palermo',   content: 'Spot Palermo',      dur: 15, status: 'ok' },
    { t: '03:30:33', screen: 'RET-002',  zone: 'Retiro',    content: 'Campaña Retiro',    dur: 30, status: 'ok' },
    { t: '03:30:05', screen: 'CABA-009', zone: 'Centro',    content: 'Banner Obelisco',   dur: 10, status: 'ok' },
    { t: '03:29:33', screen: 'PAL-003',  zone: 'Palermo',   content: 'Spot Palermo',      dur: 15, status: 'ok' },
    { t: '03:29:05', screen: 'PM-001',   zone: 'P. Madero', content: 'Coca Cola Mundial', dur: 30, status: 'ok' },
    { t: '03:28:33', screen: 'CABA-014', zone: 'Centro',    content: 'Banner Obelisco',   dur: 10, status: 'ok' },
    { t: '03:28:05', screen: 'PAL-007',  zone: 'Palermo',   content: 'Banner Tecno',      dur: 15, status: 'ok' },
    { t: '03:27:33', screen: 'TEL-002',  zone: 'San Telmo', content: 'Menu Digital',      dur: 30, status: 'partial' },
    { t: '03:27:05', screen: 'CABA-009', zone: 'Centro',    content: 'Coca-Cola',         dur: 10, status: 'ok' },
    { t: '03:26:33', screen: 'PAL-007',  zone: 'Palermo',   content: 'Spot Palermo',      dur: 15, status: 'ok' },
    { t: '03:26:05', screen: 'RET-002',  zone: 'Retiro',    content: 'Campaña Retiro',    dur: 30, status: 'ok' },
  ];

  constructor() {
    this.contentService.loadMockData().pipe(takeUntilDestroyed()).subscribe();
    setInterval(() => this.liveTime.set(new Date().toTimeString().slice(0, 8)), 1000);
  }

  onFolderSelected(id: number | null): void {
    if (id === null) {
      // "Todos": limpia carpeta Y filtro de archivados para mostrar todos los activos
      this.contentService.updateFilters({ folder_id: '', showArchived: undefined });
    } else {
      this.contentService.updateFilters({ folder_id: id });
    }
  }

  onFiltersChanged(filters: ContentFilters): void {
    this.contentService.updateFilters(filters);
  }

  openForm():                   void { this.openNewForm(); }
  openNewForm():                void { this.editingContent.set(null);  this.isFormOpen.set(true); }
  openEditForm(c: Content):     void { this.editingContent.set(c);     this.isFormOpen.set(true); }
  closeForm():                  void { this.isFormOpen.set(false); this.editingContent.set(null); }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  logout(): void {
    this.auth.logout();
  }

  get username(): string {
    return this.auth.currentUser()?.username ?? 'Usuario';
  }

  get userInitial(): string {
    return this.username.charAt(0).toUpperCase();
  }

  get userRole(): string {
    return this.auth.currentUser()?.role ?? '';
  }
}
