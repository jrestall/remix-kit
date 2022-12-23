export function joinUrlSegments(a: string, b: string): string {
  if (!a || !b) {
    return a || b || '';
  }
  if (a.endsWith('/')) {
    a = a.substring(0, a.length - 1);
  }
  if (!b.startsWith('/')) {
    b = '/' + b;
  }
  return a + b;
}
