import { Component, input, output, signal, computed } from '@angular/core';
import { Folder, FolderNode, buildFolderTree } from '@models/folder.model';
import { SidebarFolderComponent } from './sidebar-folder.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SidebarFolderComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  readonly folders = input.required<Folder[]>();
  readonly folderSelected = output<number | null>();

  readonly selectedId = signal<number | null>(null);

  readonly folderTree = computed<FolderNode[]>(() =>
    buildFolderTree(this.folders()),
  );

  selectFolder(id: number): void {
    this.selectedId.set(id);
    this.folderSelected.emit(id);
  }

  clearSelection(): void {
    this.selectedId.set(null);
    this.folderSelected.emit(null);
  }
}
