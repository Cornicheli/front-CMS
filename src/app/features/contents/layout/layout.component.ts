import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '@features/auth/services/auth.service';
import { ContentService } from '@features/contents/services/content.service';
import { SidebarComponent } from '@features/contents/sidebar/sidebar.component';
import { FilterBarComponent } from '@features/contents/filter-bar/filter-bar.component';
import { ContentGridComponent } from '@features/contents/content-grid/content-grid.component';
import { ContentFilters } from '@models/filters.model';
import { ContentFormComponent } from '@features/contents/content-form/content-form.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [SidebarComponent, FilterBarComponent, ContentGridComponent, ContentFormComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly contentService = inject(ContentService);

  readonly sidebarCollapsed = signal(false);
  readonly isFormOpen = signal(false);

  ngOnInit(): void {
    this.contentService.loadMockData().subscribe();
  }

  onFolderSelected(id: number | null): void {
    this.contentService.updateFilters({ folder_id: id ?? '' });
  }

  onFiltersChanged(filters: ContentFilters): void {
    this.contentService.updateFilters(filters);
  }

  openForm(): void { this.isFormOpen.set(true); }
  closeForm(): void { this.isFormOpen.set(false); }

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
