import { Component, input, output, signal, computed } from '@angular/core';
import { Zone } from '@models/zone.model';
import { Folder, FolderNode, buildFolderTree } from '@models/folder.model';
import { SidebarFolderComponent } from '@features/contents/sidebar/sidebar-folder.component';

@Component({
  selector: 'app-monitor-sidebar',
  standalone: true,
  imports: [SidebarFolderComponent],
  templateUrl: './monitor-sidebar.component.html',
})
export class MonitorSidebarComponent {
  readonly zones          = input.required<Zone[]>();
  readonly folders        = input.required<Folder[]>();
  readonly activeZoneId   = input<string | null>(null);
  readonly activeFolderId = input<number | null>(null);

  readonly zoneSelected   = output<string | null>();
  readonly folderSelected = output<number | null>();

  /** Controls the collapsible "Contenidos" folder section */
  readonly foldersExpanded = signal(false);

  /** Internal selection for visual feedback in the folder tree */
  readonly selectedFolderId = signal<number | null>(null);

  readonly folderTree = computed<FolderNode[]>(() =>
    buildFolderTree(this.folders())
  );

  selectZone(id: string): void {
    this.selectedFolderId.set(null);
    this.zoneSelected.emit(id);
  }

  clearZone(): void {
    this.zoneSelected.emit(null);
  }

  selectFolder(id: number): void {
    this.selectedFolderId.set(id);
    this.folderSelected.emit(id);
  }

  clearFolders(): void {
    this.selectedFolderId.set(null);
    this.folderSelected.emit(null);
  }
}
