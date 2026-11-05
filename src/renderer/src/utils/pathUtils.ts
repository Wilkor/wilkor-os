export const normalizePath = (p: string): string => {
  if (!p) return '';
  return p.replace(/\\/g, '/').toLowerCase().trim();
};
