import 'server-only';

/** Upload validation. Client-side checks are a convenience; this is the gate. */

export const ALLOWED_MIME = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
] as const;

export const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
export const MAX_PAGES_PER_CHAPTER = 400;

export interface UploadCandidate {
  name: string;
  mimeType: string;
  bytes: number;
}

export interface ValidationFailure {
  file: string;
  code: 'unsupported_type' | 'too_large' | 'too_many_pages';
  message: string;
}

export function validateUpload(files: UploadCandidate[]): ValidationFailure[] {
  const failures: ValidationFailure[] = [];

  for (const file of files) {
    if (!ALLOWED_MIME.includes(file.mimeType as (typeof ALLOWED_MIME)[number])) {
      failures.push({
        file: file.name,
        code: 'unsupported_type',
        message: `“${file.name}” is a ${file.mimeType || 'unknown'} file. Overset accepts PNG, JPG, WEBP, PDF, and ZIP.`,
      });
    }
    if (file.bytes > MAX_FILE_BYTES) {
      failures.push({
        file: file.name,
        code: 'too_large',
        message: `“${file.name}” exceeds the 2 GB limit for a single upload.`,
      });
    }
  }

  if (files.length > MAX_PAGES_PER_CHAPTER) {
    failures.push({
      file: `${files.length} files`,
      code: 'too_many_pages',
      message: `A chapter can hold up to ${MAX_PAGES_PER_CHAPTER} pages. Split this upload across chapters.`,
    });
  }

  return failures;
}
