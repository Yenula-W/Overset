/**
 * Page-order helpers. Pure, with no browser or alias imports, so they can be
 * unit tested under `node --test`.
 */

/** Filename order a human expects: page2 < page10, case-insensitive. */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const;
export const ACCEPTED_EXTENSIONS = [...IMAGE_EXTENSIONS, 'pdf', 'zip'] as const;

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

export function mimeForExtension(ext: string): string {
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'pdf':
      return 'application/pdf';
    case 'zip':
      return 'application/zip';
    default:
      return 'application/octet-stream';
  }
}

/** Archive entries worth importing: images, not OS metadata or hidden files. */
export function isImportableEntry(path: string): boolean {
  const parts = path.split('/');
  const base = parts[parts.length - 1];
  if (!base || base.startsWith('.') || parts.includes('__MACOSX')) return false;
  return (IMAGE_EXTENSIONS as readonly string[]).includes(extensionOf(base));
}
