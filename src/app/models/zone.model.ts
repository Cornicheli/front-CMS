export interface Zone {
  id: string;
  name: string;
  color: string;  // hex — used for pin and glow
  pinX: string;   // CSS left % on the CABA SVG map
  pinY: string;   // CSS top % on the CABA SVG map
  screenCount: number;
}

export const ZONES: Zone[] = [
  { id: 'centro',        name: 'CABA Centro',  color: '#4f6ef7', pinX: '42%', pinY: '46%', screenCount: 8 },
  { id: 'palermo',       name: 'Palermo',       color: '#8b5cf6', pinX: '27%', pinY: '28%', screenCount: 5 },
  { id: 'retiro',        name: 'Retiro',        color: '#f59e0b', pinX: '56%', pinY: '23%', screenCount: 3 },
  { id: 'puerto-madero', name: 'Puerto Madero', color: '#10b981', pinX: '62%', pinY: '50%', screenCount: 4 },
  { id: 'san-telmo',     name: 'San Telmo',     color: '#ef4444', pinX: '51%', pinY: '66%', screenCount: 2 },
];

const ZONE_IDS = ['centro', 'palermo', 'retiro', 'puerto-madero', 'san-telmo'] as const;

/** Deterministic zone assignment based on content id. */
export function getZoneForContent(id: number): string {
  return ZONE_IDS[id % 5];
}

/** Simulated status badge — deterministic, never random. */
export function getStatusForContent(id: number): 'live' | 'scheduled' | 'error' {
  if (id % 7 === 0) return 'error';
  if (id % 4 === 0) return 'scheduled';
  return 'live';
}

/** Simulated AdTech metrics — deterministic, never random. */
export function getMetrics(id: number): { reach: number; revenue: number; ctr: number } {
  const reach   = ((id * 1337) % 18000) + 2000;
  const revenue = Math.round(reach * 0.028);
  const ctr     = +( ((id * 17) % 25 + 5) / 10 ).toFixed(1);
  return { reach, revenue, ctr };
}
