/** Helpers for tutor library uploads (images vs PDF / Word / text). */

export function isImageLibraryUpload(item) {
  const mime = String(item?.mimeType || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  const name = String(item?.fileName || '').toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|heic|bmp)$/i.test(name)) return true;
  const uri = String(item?.uri || '').toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp)(\?|#|$)/i.test(uri)) return true;
  return false;
}

export function libraryFileKindLabel(item) {
  const mime = String(item?.mimeType || '').toLowerCase();
  const name = String(item?.fileName || '').toLowerCase();
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'PDF';
  if (
    mime.includes('word') ||
    mime.includes('msword') ||
    mime.includes('wordprocessingml') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx')
  ) {
    return 'Word';
  }
  if (mime.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.csv')) return 'Text';
  if (isImageLibraryUpload(item)) return 'Image';
  return 'File';
}
