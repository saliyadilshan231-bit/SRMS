import { Client, Databases, ID, Storage } from 'appwrite';

import { getAppwriteExtra, isAppwriteConfigured } from '@/constants/appwriteConfig';

let cachedClient;

function getClient() {
  const { appwriteEndpoint, appwriteProjectId } = getAppwriteExtra();
  const endpoint = String(appwriteEndpoint || '').trim();
  const project = String(appwriteProjectId || '').trim();
  if (!endpoint || !/^https?:\/\//i.test(endpoint) || !project) {
    throw new Error(
      'Appwrite is not configured. Add a valid https URL for appwriteEndpoint and appwriteProjectId in app.json → expo.extra.',
    );
  }
  if (cachedClient) return cachedClient;
  const client = new Client();
  client.setEndpoint(endpoint);
  client.setProject(project);
  cachedClient = client;
  return client;
}

/**
 * Build a File for Appwrite Storage from a local URI (Expo ImagePicker).
 * Works on web and most native URIs when fetch(uri) is supported.
 */
export async function uriToUploadFile(uri, filename = 'proof.jpg', mimeType = 'image/jpeg') {
  const res = await fetch(uri);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType || blob.type || 'image/jpeg' });
}

/**
 * Submit tutor application: upload proof image, then create document in TutorApplications.
 * Requires Appwrite collection + bucket permissions that allow this client to create (e.g. role rules).
 */
export async function submitTutorApplication({
  fullName,
  email,
  contact,
  degreeProgram,
  year,
  gpa,
  moduleExpertise,
  proofImageUri,
  proofMimeType,
}) {
  if (!isAppwriteConfigured()) {
    throw new Error(
      'Appwrite is not configured. Add appwriteEndpoint, appwriteProjectId, appwriteDatabaseId, appwriteTutorCollectionId, and appwriteProofBucketId to app.json → expo.extra.',
    );
  }

  const extra = getAppwriteExtra();
  const client = getClient();
  const storage = new Storage(client);
  const databases = new Databases(client);

  const fileId = ID.unique();
  const file = await uriToUploadFile(
    proofImageUri,
    'result-sheet.jpg',
    proofMimeType || 'image/jpeg',
  );

  const uploaded = await storage.createFile({
    bucketId: extra.appwriteProofBucketId,
    fileId,
    file,
  });

  const docId = ID.unique();
  const nowIso = new Date().toISOString();

  await databases.createDocument({
    databaseId: extra.appwriteDatabaseId,
    collectionId: extra.appwriteTutorCollectionId,
    documentId: docId,
    data: {
      full_name: fullName,
      email,
      contact,
      degree_program: degreeProgram,
      year,
      gpa,
      module_expertise: moduleExpertise,
      proof_image: uploaded.$id,
      status: 'pending',
      created_at: nowIso,
    },
  });

  return { documentId: docId, fileId: uploaded.$id };
}
