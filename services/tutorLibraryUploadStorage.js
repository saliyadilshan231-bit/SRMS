/**
 * Tutor library uploads — Appwrite Databases backend.
 * Collection defaults to "library_uploads" unless overridden by env.
 */
import { Client, Databases, ID, Query } from 'appwrite';
import { Account } from 'appwrite';

export const LIBRARY_UPLOAD_CATEGORY = {
  NOTES: 'notes',
  PAPERS: 'papers',
};

const APPWRITE_ENDPOINT =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID =
  process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '69aa65950030a8c889da';
const APPWRITE_DATABASE_ID =
  process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '69aa65950030a8c889da';
const APPWRITE_COLLECTION_ID =
  process.env.EXPO_PUBLIC_APPWRITE_LIBRARY_UPLOADS_COLLECTION_ID || 'library_uploads';

let _client = null;

function getClient() {
  if (_client) return _client;
  const client = new Client();
  client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
  _client = client;
  return client;
}

function db() {
  return new Databases(getClient());
}

async function ensureAuthSession() {
  const account = new Account(getClient());
  try {
    await account.get();
    return;
  } catch {
    // No active session; create anonymous session for collection-level "users" access.
  }
  await account.createAnonymousSession();
}

function ids() {
  return {
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLECTION_ID,
  };
}

function docToUpload(doc) {
  return {
    id: doc.$id,
    category: doc.category,
    moduleId: doc.moduleId,
    moduleTitle: doc.moduleTitle,
    uri: doc.uri,
    fileName: doc.fileName ?? null,
    mimeType: doc.mimeType ?? null,
    createdAt: doc.createdAt || doc.$createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || doc.$updatedAt || null,
    uploadedBy: doc.uploadedBy || null,
  };
}

export async function getTutorLibraryUploads() {
  try {
    await ensureAuthSession();
    const { databaseId, collectionId } = ids();
    const res = await db().listDocuments(databaseId, collectionId, [
      Query.orderDesc('$createdAt'),
      Query.limit(500),
    ]);
    return res.documents.map(docToUpload);
  } catch (e) {
    console.warn('[tutorLibraryUploadStorage] getTutorLibraryUploads error:', e?.message);
    return [];
  }
}

export async function getTutorLibraryUploadsByCategory(category) {
  const c = String(category || '').trim();
  if (!c) return [];
  try {
    await ensureAuthSession();
    const { databaseId, collectionId } = ids();
    const res = await db().listDocuments(databaseId, collectionId, [
      Query.equal('category', c),
      Query.orderDesc('$createdAt'),
      Query.limit(500),
    ]);
    return res.documents.map(docToUpload);
  } catch (e) {
    console.warn('[tutorLibraryUploadStorage] getTutorLibraryUploadsByCategory error:', e?.message);
    return [];
  }
}

export async function getTutorLibraryUploadsForModule(moduleId) {
  const mid = String(moduleId || '').trim();
  if (!mid) return [];
  try {
    await ensureAuthSession();
    const { databaseId, collectionId } = ids();
    const res = await db().listDocuments(databaseId, collectionId, [
      Query.equal('moduleId', mid),
      Query.orderDesc('$createdAt'),
      Query.limit(500),
    ]);
    return res.documents.map(docToUpload);
  } catch (e) {
    console.warn('[tutorLibraryUploadStorage] getTutorLibraryUploadsForModule error:', e?.message);
    return [];
  }
}

export async function deleteTutorLibraryUpload(uploadId) {
  const id = String(uploadId || '').trim();
  if (!id) throw new Error('Missing id.');
  await ensureAuthSession();
  const { databaseId, collectionId } = ids();
  await db().deleteDocument(databaseId, collectionId, id);
}

/**
 * Replace file (or switch category). Students see changes on next load.
 * @param {string} uploadId
 * @param {{ uri?: string, fileName?: string|null, mimeType?: string|null, category?: 'notes'|'papers' }} patch
 */
export async function updateTutorLibraryUpload(uploadId, patch) {
  if (!uploadId) throw new Error('Missing id.');
  const id = String(uploadId).trim();
  await ensureAuthSession();
  const { databaseId, collectionId } = ids();
  const prev = await db().getDocument(databaseId, collectionId, id);
  const uri =
    patch?.uri != null && String(patch.uri).trim() !== '' ? String(patch.uri).trim() : prev.uri;
  if (!uri) throw new Error('Missing file reference.');

  let category = prev.category;
  if (patch?.category === LIBRARY_UPLOAD_CATEGORY.PAPERS) category = LIBRARY_UPLOAD_CATEGORY.PAPERS;
  if (patch?.category === LIBRARY_UPLOAD_CATEGORY.NOTES) category = LIBRARY_UPLOAD_CATEGORY.NOTES;

  const payload = {
    uri,
    category,
    fileName: patch?.fileName !== undefined ? patch.fileName : prev.fileName,
    mimeType: patch?.mimeType !== undefined ? patch.mimeType : prev.mimeType,
    updatedAt: new Date().toISOString(),
  };
  const updated = await db().updateDocument(databaseId, collectionId, id, payload);
  return docToUpload(updated);
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

  const payload = {
    category: cat,
    moduleId: mid,
    moduleTitle: mt,
    uri: u,
    fileName: fileName ? String(fileName) : null,
    mimeType: mimeType ? String(mimeType) : null,
    createdAt: new Date().toISOString(),
    updatedAt: '',
    uploadedBy: '',
  };
  await ensureAuthSession();
  const { databaseId, collectionId } = ids();
  const doc = await db().createDocument(databaseId, collectionId, ID.unique(), payload);
  return docToUpload(doc);
}
