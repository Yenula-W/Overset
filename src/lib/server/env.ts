import 'server-only';

/**
 * Server-only environment access.
 *
 * Importing this module from client code is a build error, which is the point:
 * provider keys must never reach client JavaScript, HTML, network requests the
 * browser can see, or localStorage.
 */

export interface ProviderKeys {
  ocr?: string;
  vision?: string;
  translation?: string;
  cleaning?: string;
}

export function providerKeys(): ProviderKeys {
  return {
    ocr: process.env.OVERSET_OCR_API_KEY,
    vision: process.env.OVERSET_VISION_API_KEY,
    translation: process.env.OVERSET_TRANSLATION_API_KEY,
    cleaning: process.env.OVERSET_CLEANING_API_KEY,
  };
}

/** Fails loudly at request time rather than silently producing empty output. */
export function requireKey(name: keyof ProviderKeys): string {
  const key = providerKeys()[name];
  if (!key) {
    throw new Error(
      `Missing ${name} provider key. Set the corresponding OVERSET_*_API_KEY environment variable on the server.`,
    );
  }
  return key;
}
