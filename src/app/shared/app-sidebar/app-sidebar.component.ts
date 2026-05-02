import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ContentService } from '@features/contents/services/content.service';
import { AuthService } from '@features/auth/services/auth.service';
import { MonitorScreenService } from '@features/monitor/monitor-screen.service';

@Component({
  selector: 'app-shared-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {
  readonly contentService = inject(ContentService);
  readonly screenService = inject(MonitorScreenService);
  private readonly auth = inject(AuthService);

  readonly collapsed = signal(false);

  toggle(): void { this.collapsed.update(v => !v); }

  get username(): string { return this.auth.currentUser()?.username ?? 'Usuario'; }
  get userInitial(): string { return this.username.charAt(0).toUpperCase(); }
  get userRole(): string { return this.auth.currentUser()?.role ?? ''; }
  logout(): void { this.auth.logout(); }
}
