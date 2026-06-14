export const IMAGE_UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'] as const;

export const DOCUMENT_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
] as const;

const HEIC_UPLOAD_MIME_TYPES = ['image/heic', 'image/heif'] as const;

const MIME_TYPE_ALIASES: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'application/csv': 'text/csv',
  'text/x-csv': 'text/csv',
  'text/comma-separated-values': 'text/csv',
};

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  pdf: 'application/pdf',
  csv: 'text/csv',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
};

const HEIC_EXTENSIONS = new Set(['heic', 'heif']);
const VALID_UPLOAD_MIME_TYPES = new Set<string>([...IMAGE_UPLOAD_MIME_TYPES, ...DOCUMENT_UPLOAD_MIME_TYPES]);
const HEIC_MIME_TYPE_SET = new Set<string>(HEIC_UPLOAD_MIME_TYPES);

export function getFileExtension(filename: string): string {
  const lastSegment = filename.split(/[\\/]/).pop() ?? filename;
  const dotIndex = lastSegment.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === lastSegment.length - 1) return '';
  return lastSegment.slice(dotIndex + 1).toLowerCase();
}

export function getConvertedJpegFilename(filename: string): string {
  const extension = getFileExtension(filename);
  if (!extension) return `${filename}.jpg`;
  return filename.slice(0, -(extension.length + 1)) + '.jpg';
}

export function isHeicUpload(filename: string, contentType: string | null | undefined): boolean {
  const normalizedContentType = (contentType ?? '').toLowerCase().trim();
  return HEIC_MIME_TYPE_SET.has(normalizedContentType) || HEIC_EXTENSIONS.has(getFileExtension(filename));
}

export function normalizeUploadContentType(filename: string, contentType: string | null | undefined): string | null {
  const rawContentType = (contentType ?? '').split(';')[0]?.toLowerCase().trim() ?? '';
  const aliasedContentType = MIME_TYPE_ALIASES[rawContentType] ?? rawContentType;

  if (VALID_UPLOAD_MIME_TYPES.has(aliasedContentType)) {
    return aliasedContentType;
  }

  return MIME_TYPES_BY_EXTENSION[getFileExtension(filename)] ?? null;
}

export function isUploadImageContentType(contentType: string): boolean {
  return IMAGE_UPLOAD_MIME_TYPES.includes(contentType as (typeof IMAGE_UPLOAD_MIME_TYPES)[number]);
}
