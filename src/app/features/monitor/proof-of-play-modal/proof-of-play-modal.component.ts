import { Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';

interface PopEntry {
  time: Date;
  content: string;
  duration: number;
  result: 'ok' | 'partial';
}

function generatePopLogs(count: number): PopEntry[] {
  const now = Date.now();
  const spots = ['Banner Obelisco', 'Spot Palermo', 'Campaña Retiro'];
  return Array.from({ length: count }, (_, i) => ({
    time:     new Date(now - i * 30000),
    content:  spots[i % 3],
    duration: [10, 15, 30][i % 3],
    result:   i % 8 === 0 ? 'partial' : 'ok',
  }));
}

@Component({
  selector: 'app-proof-of-play-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './proof-of-play-modal.component.html',
})
export class ProofOfPlayModalComponent {
  readonly closed      = output<void>();
  readonly contentName = input<string>('');

  readonly logs = computed(() => generatePopLogs(20));
}
