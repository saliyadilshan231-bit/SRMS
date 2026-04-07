/**
 * Tutor library uploads (images) — AsyncStorage, categorized as notes or papers.
 * Same device sees the same list (students can read in a future browse view).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storageKeys';

const MAX_ITEMS = 500;

export const LIBRARY_UPLOAD_CATEGORY = {
  NOTES: 'notes',
  PAPERS: 'papers',
};

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readAll() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.tutorLibraryUploads);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    let list = Array.isArray(parsed) ? parsed : [];
    let mutated = false;
    list = list
      .filter((x) => x && typeof x === 'object')
      .map((x) => {
        if (String(x.id || '').trim() === '') {
          mutated = true;
          return { ...x, id: genId() };
        }
        return x;
      });
    if (mutated) {
      await AsyncStorage.setItem(STORAGE_KEYS.tutorLibraryUploads, JSON.stringify(list));
    }
    return list;
  } catch {
    return [];
  }
}

async function writeAll(list) {
  await AsyncStorage.setItem(STORAGE_KEYS.tutorLibraryUploads, JSON.stringify(list));
}

export async function getTutorLibraryUploads() {
  return readAll();
}

export async function getTutorLibraryUploadsByCategory(category) {
  const c = String(category || '');
  const all = await readAll();
  return all.filter((x) => x.category === c);
}

export async function getTutorLibraryUploadsForModule(moduleId) {
  const mid = String(moduleId || '');
  if (!mid) return [];
  const all = await readAll();
  return all.filter((x) => String(x.moduleId) === mid);
}

export async function deleteTutorLibraryUpload(uploadId) {
  const id = String(uploadId || '').trim();
  if (!id) throw new Error('Missing id.');
  const list = await readAll();
  const next = list.filter((x) => String(x.id) !== id);
  if (next.length === list.length) throw new Error('File not found.');
  await writeAll(next);
}

/**
 * Replace file (or switch category). Students see changes on next load.
 * @param {string} uploadId
 * @param {{ uri?: string, fileName?: string|null, mimeType?: string|null, category?: 'notes'|'papers' }} patch
 */
export async function updateTutorLibraryUpload(uploadId, patch) {
  if (!uploadId) throw new Error('Missing id.');
  const id = String(uploadId).trim();
  const list = await readAll();
  const idx = list.findIndex((x) => String(x.id) === id);
  if (idx < 0) throw new Error('File not found.');
  const prev = list[idx];
  const uri =
    patch.uri != null && String(patch.uri).trim() !== '' ? String(patch.uri).trim() : prev.uri;
  if (!uri) throw new Error('Missing file reference.');
  let cat = prev.category;
  if (patch.category === LIBRARY_UPLOAD_CATEGORY.PAPERS) cat = LIBRARY_UPLOAD_CATEGORY.PAPERS;
  if (patch.category === LIBRARY_UPLOAD_CATEGORY.NOTES) cat = LIBRARY_UPLOAD_CATEGORY.NOTES;
  list[idx] = {
    ...prev,
    uri,
    category: cat,
    fileName: patch.fileName !== undefined ? patch.fileName : prev.fileName,
    mimeType: patch.mimeType !== undefined ? patch.mimeType : prev.mimeType,
    updatedAt: new Date().toISOString(),
  };
  await writeAll(list);
  return list[idx];
}

/**
 * @param {{ category: 'notes'|'papers', uri: string, moduleId: string, moduleTitle: string, fileName?: string|null, mimeType?: string|null }} item
 */
export async function addTutorLibraryUpload({ category, uri, moduleId, moduleTitle, fileName, mimeType }) {
  const cat =
    category === LIBRARY_UPLOAD_CATEGORY.PAPERS ? LIBRARY_UPLOAD_CATEGORY.PAPERS : LIBRARY_UPLOAD_CATEGORY.NOTES;
  const u = String(uri || '').trim();
  if (!u) throw new Error('Missing file reference.');
  const mid = String(moduleId || '').trim();
  const mt = String(moduleTitle || '').trim();
  if (!mid) throw new Error('Missing module.');
  if (!mt) throw new Error('Missing module title.');

  const row = {
    id: genId(),
    category: cat,
    moduleId: mid,
    moduleTitle: mt,
    uri: u,
    fileName: fileName ? String(fileName) : null,
    mimeType: mimeType ? String(mimeType) : null,
    createdAt: new Date().toISOString(),
  };

  const list = await readAll();
  const next = [row, ...list].slice(0, MAX_ITEMS);
  await writeAll(next);
  return row;
}
