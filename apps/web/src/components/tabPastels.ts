const ORDERED_TAB_PASTELS: readonly string[] = [
  'color-mix(in srgb, var(--blue-bg) 68%, white 32%)',
  'color-mix(in srgb, var(--amber-bg) 64%, white 36%)',
  'color-mix(in srgb, var(--red-bg) 60%, white 40%)',
  'color-mix(in srgb, var(--green-bg) 62%, white 38%)',
];

const DEFAULT_TAB_PASTEL =
  ORDERED_TAB_PASTELS[0]
  ?? 'color-mix(in srgb, var(--blue-bg) 68%, white 32%)';

export function getSequentialTabPastel(index: number): string {
  if (ORDERED_TAB_PASTELS.length === 0) return DEFAULT_TAB_PASTEL;
  const normalizedIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  return ORDERED_TAB_PASTELS[normalizedIndex % ORDERED_TAB_PASTELS.length] ?? DEFAULT_TAB_PASTEL;
}
