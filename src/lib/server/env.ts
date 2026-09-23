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
    ocr: process.env.PANELFLOW_OCR_API_KEY,
    vision: process.env.PANELFLOW_VISION_API_KEY,
    translation: process.env.PANELFLOW_TRANSLATION_API_KEY,
    cleaning: process.env.PANELFLOW_CLEANING_API_KEY,
  };
}

/** Fails loudly at request time rather than silently producing empty output. */
export function requireKey(name: keyof ProviderKeys): string {
  const key = providerKeys()[name];
  if (!key) {
    throw new Error(
      `Missing ${name} provider key. Set the corresponding PANELFLOW_*_API_KEY environment variable on the server.`,
    );
  }
  return key;
}
