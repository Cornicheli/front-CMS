import { Component, input, output } from '@angular/core';
import { FolderNode } from '@models/folder.model';

@Component({
  selector: 'app-sidebar-folder',
  standalone: true,
  imports: [SidebarFolderComponent],
  templateUrl: './sidebar-folder.component.html',
})
export class SidebarFolderComponent {
  readonly node = input.required<FolderNode>();
  readonly selectedId = input<number | null>(null);
  readonly depth = input<number>(0);

  readonly select = output<number>();

  isExpanded = true;

  get isSelected(): boolean {
    return this.selectedId() === this.node().id;
  }

  onSelect(): void {
    this.select.emit(this.node().id);
  }

  onChildSelect(id: number): void {
    this.select.emit(id);
  }

  toggleExpand(event: MouseEvent): void {
    event.stopPropagation();
    this.isExpanded = !this.isExpanded;
  }
}
