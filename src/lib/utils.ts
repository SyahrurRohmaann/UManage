export function formatRupiahInput(value: string | number): string {
  if (value === undefined || value === null) return '';
  const numString = String(value).replace(/\D/g, '');
  if (!numString) return '';
  return numString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseRupiahInput(value: string): number {
  if (!value) return 0;
  return Number(value.replace(/\D/g, '')) || 0;
}
